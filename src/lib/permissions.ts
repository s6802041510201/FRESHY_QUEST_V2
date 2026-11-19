// ตารางสิทธิ์ Admin / Editor (แสดงบนหน้าจอว่า Teacher) ที่เดียว (ตามตารางสิทธิ์หน้า 8 ของเอกสารออกแบบ)
// ใช้ซ่อน/แสดงเมนูและตรวจใน API ทุกตัว
// สำคัญ: นี่คือชั้นแรก ชั้นที่สองคือ RLS + trigger ใน supabase/schema.sql ซึ่งบังคับกฎเดียวกัน
// ถ้าแก้ที่นี่ ต้องแก้ schema.sql ให้ตรงกัน

export type RoleName = "admin" | "editor";

export type Permission =
  | "media.view"
  | "media.create"
  | "media.edit" // Editor แก้ได้เฉพาะสื่อที่เป็นฉบับร่าง (บังคับที่ฐานข้อมูล)
  | "media.publish" // เผยแพร่ / ตั้งเวลา / ยกเลิกเผยแพร่
  | "media.delete" // ลบ (soft delete) และกู้คืน
  | "files.upload"
  | "files.delete"
  | "playlists.manage"
  | "faqs.edit" // เพิ่ม/แก้ FAQ
  | "faqs.publish"
  | "faqs.delete"
  | "users.manage"
  | "stats.view"
  | "audit.view";

const ALL: Permission[] = [
  "media.view",
  "media.create",
  "media.edit",
  "media.publish",
  "media.delete",
  "files.upload",
  "files.delete",
  "playlists.manage",
  "faqs.edit",
  "faqs.publish",
  "faqs.delete",
  "users.manage",
  "stats.view",
  "audit.view",
];

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  admin: ALL,
  editor: [
    "media.view",
    "media.create",
    "media.edit",
    "files.upload",
    "faqs.edit",
    "stats.view",
  ],
};

export const ROLE_LABEL: Record<RoleName, string> = {
  admin: "ผู้ดูแลระบบ (Admin)",
  editor: "Teacher (ผู้จัดทำเนื้อหา)", // ชื่อในฐานข้อมูลยังเป็น editor แสดงเป็น Teacher เฉพาะหน้าจอ
};

export function can(role: RoleName | null | undefined, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(perm);
}
