// POST /api/auth/login  { email, password, as }
// as = หน้าที่ผู้ใช้เลือกเข้า: "admin" ต้องเป็นบัญชีบทบาท admin, "teacher" ต้องเป็นบัญชีบทบาท editor (ตรงกับ UI ที่เรียกว่า Teacher)
// เป็นการแยกประตูเข้าสองทาง: ใช้บัญชีของอีกฝั่งล็อกอินไม่ได้ (ตรวจที่เซิร์ฟเวอร์ ไม่ใช่แค่ซ่อนที่หน้าเว็บ)
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

const Body = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  as: z.enum(["admin", "teacher"], { message: "กรุณาเลือกบทบาทก่อนเข้าสู่ระบบ" }),
});

const ROLE_OF: Record<"admin" | "teacher", "admin" | "editor"> = { admin: "admin", teacher: "editor" };

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { as, ...credentials } = parsed.data;
  const { error } = await supabase.auth.signInWithPassword(credentials);
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

  // บทบาทของบัญชีต้องตรงกับประตูที่เลือก ไม่ตรง -> ออกจากระบบทันที ไม่ให้เหลือ session ค้าง
  if (profile.role !== ROLE_OF[as]) {
    await supabase.auth.signOut();
    const actual = profile.role === "admin" ? "admin" : "teacher";
    return NextResponse.json(
      {
        error: `บัญชีนี้เป็นบัญชี ${actual === "admin" ? "Admin" : "Teacher"} กรุณาเข้าสู่ระบบจากหน้า ${actual === "admin" ? "Admin" : "Teacher"}`,
        code: "wrong_role",
        actual,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, role: profile.role });
}
