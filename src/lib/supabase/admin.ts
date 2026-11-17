// Supabase client แบบกุญแจลับ (service role) -> ข้าม RLS ทั้งหมด
// ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น และเฉพาะหลังตรวจแล้วว่าผู้เรียกเป็น Admin
// ห้าม import ไฟล์นี้จากคอมโพเนนต์ที่ทำงานในเบราว์เซอร์ ("use client")
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
