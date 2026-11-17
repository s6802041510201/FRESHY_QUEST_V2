// POST /api/admin/media  สร้างสื่อใหม่ (Admin, Editor)
// Editor สร้างได้เฉพาะฉบับร่าง (ฐานข้อมูลบังคับซ้ำ) ส่วน GET รายการจะเพิ่มใน F04
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { buildMediaRow, mapDbError } from "@/lib/media-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { firstIssues, mediaInputSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.create"))
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์เพิ่มสื่อ" }, { status: 403 });

  const parsed = mediaInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: firstIssues(parsed.error) }, { status: 400 });

  // Editor ห้ามเผยแพร่/ตั้งเวลา ต่อให้ส่ง action มาก็ไม่สน
  const built = buildMediaRow(parsed.data, profile.role, null);
  if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("media").insert(built.row).select("id").single();
  if (error) {
    const m = mapDbError(error);
    return NextResponse.json({ error: m.message }, { status: m.status });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
