// Supabase client ฝั่งเซิร์ฟเวอร์ ผูกกับเซสชันของผู้ใช้ที่เรียก (อ่านจากคุกกี้)
// ใช้ใน Server Component, Route Handler -> RLS ในฐานข้อมูลทำงานตามสิทธิ์ของผู้ใช้คนนั้น
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // เรียกจาก Server Component จะเขียนคุกกี้ไม่ได้ ไม่เป็นไร
            // เพราะ proxy.ts ต่ออายุเซสชันให้อยู่แล้ว
          }
        },
      },
    },
  );
}
