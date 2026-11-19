// POST /api/admin/media/:id/status  เปลี่ยนสถานะด่วนจากรายการสื่อ (Admin เท่านั้น)
//   body { action: "publish_now" }  เผยแพร่ทันที (ต้องมีวิดีโออย่างน้อย 1 ไฟล์)
//   body { action: "unpublish" }    ยกเลิกเผยแพร่ -> กลับเป็นฉบับร่าง (นักศึกษามองไม่เห็นทันที)
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { mapDbError } from "@/lib/media-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

const BodySchema = z.object({ action: z.enum(["publish_now", "unpublish"]) });

type Existing = {
  status: "draft" | "scheduled" | "published";
  publish_at: string | null;
  unpublish_at: string | null;
  video_169_path: string | null;
  video_916_path: string | null;
  deleted_at: string | null;
};

export async function POST(request: Request, { params }: Ctx) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.publish"))
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบที่เผยแพร่หรือยกเลิกเผยแพร่ได้" }, { status: 403 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "รหัสสื่อไม่ถูกต้อง" }, { status: 400 });
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("media")
    .select("status, publish_at, unpublish_at, video_169_path, video_916_path, deleted_at")
    .eq("id", id)
    .maybeSingle<Existing>();
  if (!existing || existing.deleted_at)
    return NextResponse.json({ error: "ไม่พบสื่อนี้ (อาจถูกลบไปแล้ว)" }, { status: 404 });

  let patch: Record<string, unknown>;
  if (body.data.action === "unpublish") {
    if (existing.status === "draft")
      return NextResponse.json({ error: "สื่อนี้เป็นฉบับร่างอยู่แล้ว" }, { status: 409 });
    patch = { status: "draft" };
  } else {
    if (!existing.video_169_path && !existing.video_916_path)
      return NextResponse.json(
        { error: "ต้องอัปโหลดไฟล์วิดีโออย่างน้อย 1 ไฟล์ก่อนเผยแพร่ (เข้าไปที่หน้าแก้ไข)" },
        { status: 400 },
      );
    const now = new Date();
    // เคยเผยแพร่แล้ว (เช่นหมดอายุ) คงเวลาเริ่มเดิม; ฉบับร่าง/ตั้งเวลา เริ่มทันที
    const publishAt =
      existing.status === "published" && existing.publish_at ? existing.publish_at : now.toISOString();
    // เวลาหยุดเผยแพร่ที่ผ่านไปแล้วต้องล้าง ไม่เช่นนั้นสื่อจะหมดอายุทันที
    const unpublishAt =
      existing.unpublish_at && new Date(existing.unpublish_at) > now ? existing.unpublish_at : null;
    patch = { status: "published", publish_at: publishAt, unpublish_at: unpublishAt };
  }

  const { data, error } = await supabase
    .from("media")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");
  if (error) {
    const m = mapDbError(error);
    return NextResponse.json({ error: m.message }, { status: m.status });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์แก้ไขสื่อนี้" }, { status: 403 });

  return NextResponse.json({ ok: true });
}
