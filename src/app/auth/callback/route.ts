// ปลายทางของลิงก์ในอีเมล (รีเซ็ตรหัสผ่าน): แลกรหัสชั่วคราวเป็นเซสชัน แล้วส่งต่อไปหน้าที่ต้องการ
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// อนุญาตเฉพาะเส้นทางภายในเว็บของเรา กัน open redirect (เช่น ?next=https://เว็บอื่น)
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/admin";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/admin/login?error=link`);
}
