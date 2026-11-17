// POST /api/auth/reset-password  { password }
// ต้องมีเซสชันจากลิงก์ในอีเมล (ผ่าน /auth/callback แล้ว)
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  password: z.string().min(8, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร").max(72, "รหัสผ่านยาวเกินไป"),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่" },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json(
      { error: "ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่หรือขอลิงก์ใหม่" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
