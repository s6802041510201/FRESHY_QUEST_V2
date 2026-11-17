// PUT    /api/admin/media/:id  แก้ไขสื่อ (Admin แก้ได้ทุกสถานะ, Editor แก้ได้เฉพาะฉบับร่าง)
// DELETE /api/admin/media/:id  ลบแบบ soft delete (Admin เท่านั้น)
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { buildMediaRow, mapDbError, type ExistingMedia } from "@/lib/media-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { firstIssues, mediaInputSchema } from "@/lib/validators";

const IdSchema = z.string().uuid();

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.edit"))
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์แก้ไขสื่อ" }, { status: 403 });

  const { id } = await params;
  if (!IdSchema.safeParse(id).success)
    return NextResponse.json({ error: "รหัสสื่อไม่ถูกต้อง" }, { status: 400 });

  const parsed = mediaInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: firstIssues(parsed.error) }, { status: 400 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("media")
    .select("status, publish_at, deleted_at")
    .eq("id", id)
    .maybeSingle<ExistingMedia>();
  if (!existing || existing.deleted_at)
    return NextResponse.json({ error: "ไม่พบสื่อนี้ (อาจถูกลบไปแล้ว)" }, { status: 404 });

  if (profile.role === "editor" && existing.status !== "draft")
    return NextResponse.json(
      { error: "บทบาท Editor แก้ไขได้เฉพาะสื่อที่เป็นฉบับร่าง" },
      { status: 403 },
    );

  const built = buildMediaRow(parsed.data, profile.role, existing);
  if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });

  const { data, error } = await supabase
    .from("media")
    .update(built.row)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");
  if (error) {
    const m = mapDbError(error);
    return NextResponse.json({ error: m.message }, { status: m.status });
  }
  // RLS ปฏิเสธแบบเงียบ (ไม่ error แต่ไม่มีแถวถูกแก้) -> แจ้งว่าไม่มีสิทธิ์
  if (!data || data.length === 0)
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์แก้ไขสื่อนี้" }, { status: 403 });

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.delete"))
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบที่ลบสื่อได้" }, { status: 403 });

  const { id } = await params;
  if (!IdSchema.safeParse(id).success)
    return NextResponse.json({ error: "รหัสสื่อไม่ถูกต้อง" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");
  if (error) {
    const m = mapDbError(error);
    return NextResponse.json({ error: m.message }, { status: m.status });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ error: "ไม่พบสื่อนี้ (อาจถูกลบไปแล้ว)" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
