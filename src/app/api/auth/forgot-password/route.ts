// POST /api/auth/forgot-password  { email }
// ตอบข้อความเดียวกันเสมอ ไม่ว่าอีเมลจะมีในระบบหรือไม่ (กันคนเดาอีเมลผู้ดูแล)
// หมายเหตุ: อีเมลของ Supabase แพ็กเกจฟรีส่งได้จำกัด ถ้าอีเมลไม่มา ให้ Admin รีเซ็ตรหัสผ่านใน Dashboard
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง") });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;

  const supabase = await createClient();
  // ไม่สนใจ error: ไม่บอกผู้เรียกว่าอีเมลนี้มีหรือไม่
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/auth/callback?next=/admin/reset-password`,
  });

  return NextResponse.json({
    ok: true,
    message: "ถ้าอีเมลนี้มีในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ให้แล้ว กรุณาตรวจกล่องจดหมาย (รวมถึงจดหมายขยะ)",
  });
}
