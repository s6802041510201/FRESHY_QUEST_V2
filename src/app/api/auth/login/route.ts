// POST /api/auth/login  { email, password }
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

const Body = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // ข้อความเดียวกันไม่ว่าจะผิดที่อีเมลหรือรหัสผ่าน (กันคนเดาว่ามีอีเมลนี้ในระบบ)
    return NextResponse.json(
      { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  // ล็อกอินผ่านแล้ว แต่ต้องมีบทบาทที่ใช้งานได้ (ไม่ถูกระงับ ไม่ถูกปิดบทบาท)
  const profile = await getCurrentProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error:
          "บัญชีนี้ยังไม่มีสิทธิ์เข้าหลังบ้านหรือถูกระงับ กรุณาติดต่อผู้ดูแลระบบ",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, role: profile.role });
}
