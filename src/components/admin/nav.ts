// รายการเมนูหลังบ้าน แสดงเฉพาะเมนูที่บทบาทนั้นมีสิทธิ์
// ready = false -> แสดงเป็นสีเทา "เร็ว ๆ นี้" (หน้ายังไม่ได้สร้าง) เปลี่ยนเป็น true เมื่อทำหน้านั้นเสร็จ
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  permission: Permission | null; // null = ทุกบทบาทเห็น
  ready: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "แดชบอร์ด", permission: null, ready: true },
  { href: "/admin/media", label: "คลังสื่อ", permission: "media.view", ready: true },
  { href: "/admin/media/new", label: "เพิ่มสื่อ", permission: "media.create", ready: true },
  { href: "/admin/media/trash", label: "ถังขยะ", permission: "media.delete", ready: true },
  { href: "/admin/playlists", label: "Playlist", permission: "playlists.manage", ready: false },
  { href: "/admin/faqs", label: "FAQ", permission: "faqs.edit", ready: false },
  { href: "/admin/users", label: "ผู้ใช้", permission: "users.manage", ready: false },
  { href: "/admin/audit", label: "ประวัติการแก้ไข", permission: "audit.view", ready: false },
];
