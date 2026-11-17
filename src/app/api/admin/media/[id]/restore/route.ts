// POST /api/admin/media/:id/restore  กู้คืนสื่อจากถังขยะ (Admin เท่านั้น)
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { mapDbError } from "@/lib/media-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.delete"))
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบที่กู้คืนสื่อได้" }, { status: 403 });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "รหัสสื่อไม่ถูกต้อง" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id");
  if (error) {
    const m = mapDbError(error);
    // เลขด่านหรือ slug ชนกับสื่ออื่นที่ยังใช้งานอยู่
    if (error.code === "23505")
      return NextResponse.json(
        { error: `${m.message} (ซ้ำกับสื่ออื่นที่ยังไม่ถูกลบ ต้องแก้สื่อนั้นก่อนจึงกู้คืนได้)` },
        { status: 409 },
      );
    return NextResponse.json({ error: m.message }, { status: m.status });
  }
  if (!data || data.length === 0)
    return NextResponse.json({ error: "ไม่พบสื่อในถังขยะ" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
