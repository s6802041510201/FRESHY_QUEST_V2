// POST /api/admin/media/:id/duplicate  ทำสำเนาสื่อเป็นฉบับร่างใหม่ (Admin, Teacher)
// เลขด่านใหม่ = เลขสูงสุดที่ใช้อยู่ + 1, slug = "<slug>-copy" (ชนก็ต่อ -2, -3 ...)
// ไฟล์วิดีโอ/ซับ/ปก ใช้ path เดียวกับต้นฉบับ (ไม่คัดลอกไฟล์จริง ประหยัดพื้นที่ 1 GB)
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { copySlug, copyTitle, mapDbError } from "@/lib/media-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

const COPY_FIELDS =
  "slug, title, description, category, video_169_path, video_916_path, subtitle_path, cover_path, duration_sec, chapters, checklist, quiz, sources, contacts, deleted_at";

type Source = {
  slug: string;
  title: string;
  deleted_at: string | null;
} & Record<string, unknown>;

export async function POST(_request: Request, { params }: Ctx) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.create"))
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์เพิ่มสื่อ" }, { status: 403 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "รหัสสื่อไม่ถูกต้อง" }, { status: 400 });

  const supabase = await createClient();
  const { data: src } = await supabase.from("media").select(COPY_FIELDS).eq("id", id).maybeSingle<Source>();
  if (!src || src.deleted_at)
    return NextResponse.json({ error: "ไม่พบสื่อนี้ (อาจถูกลบไปแล้ว)" }, { status: 404 });

  const { deleted_at: _drop, ...content } = src;
  void _drop;

  // ลองได้สูงสุด 5 ครั้ง เผื่อมีคนสร้างพร้อมกันจนเลขด่าน/slug ชน
  let slugAttempt = 1;
  for (let i = 0; i < 5; i++) {
    const { data: top } = await supabase
      .from("media")
      .select("episode_no")
      .is("deleted_at", null)
      .order("episode_no", { ascending: false })
      .limit(1)
      .maybeSingle<{ episode_no: number }>();
    const episode_no = (top?.episode_no ?? 0) + 1;
    if (episode_no > 99)
      return NextResponse.json({ error: "เลขด่านเต็มแล้ว (สูงสุด 99) ทำสำเนาไม่ได้" }, { status: 400 });

    const row = {
      ...content,
      episode_no,
      slug: copySlug(src.slug, slugAttempt),
      title: copyTitle(src.title),
      status: "draft" as const,
      publish_at: null,
      unpublish_at: null,
    };
    const { data, error } = await supabase.from("media").insert(row).select("id").single();
    if (!error) return NextResponse.json({ ok: true, id: data.id, episode_no }, { status: 201 });

    const msg = `${error.message ?? ""} ${error.details ?? ""}`;
    if (error.code === "23505" && msg.includes("media_slug_uq")) {
      slugAttempt += 1;
      continue;
    }
    if (error.code === "23505") continue; // เลขด่านชน -> คำนวณใหม่
    const m = mapDbError(error);
    return NextResponse.json({ error: m.message }, { status: m.status });
  }
  return NextResponse.json({ error: "ทำสำเนาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 409 });
}
