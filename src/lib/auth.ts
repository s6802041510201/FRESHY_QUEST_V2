// ฟังก์ชันช่วยเรื่องผู้ใช้ปัจจุบัน (ฝั่งเซิร์ฟเวอร์)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, type Permission, type RoleName } from "@/lib/permissions";

export type CurrentProfile = {
  id: string;
  email: string;
  name: string;
  role: RoleName; // บทบาทที่ใช้งานได้จริง (ผ่านการตรวจ status และ is_enabled แล้ว)
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  status: "active" | "suspended";
  roles: { name: RoleName; is_enabled: boolean } | null;
};

/**
 * คืนข้อมูลผู้ใช้ที่ล็อกอินอยู่ หรือ null ถ้า
 *  - ยังไม่ล็อกอิน
 *  - ไม่มีแถวใน profiles (ยังไม่ได้ผูกบทบาท)
 *  - ถูกระงับ (status = suspended)
 *  - บทบาทถูกปิด (roles.is_enabled = false)
 * หมายเหตุ: ใช้ getUser() ซึ่งถามเซิร์ฟเวอร์ Supabase จริง ไม่เชื่อคุกกี้อย่างเดียว
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, status, roles(name, is_enabled)")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!data || data.status !== "active") return null;
  if (!data.roles || !data.roles.is_enabled) return null;

  return { id: data.id, email: data.email, name: data.name, role: data.roles.name };
}

/** ใช้ใน Server Component: ไม่ผ่าน -> ส่งกลับหน้าล็อกอิน */
export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}

/** ใช้ในหน้าที่ต้องมีสิทธิ์เฉพาะ: ไม่มีสิทธิ์ -> กลับแดชบอร์ด */
export async function requirePermission(perm: Permission): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!can(profile.role, perm)) redirect("/admin?denied=1");
  return profile;
}
