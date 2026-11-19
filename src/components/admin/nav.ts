// รายการเมนูหลังบ้าน แสดงเฉพาะเมนูที่บทบาทนั้นมีสิทธิ์
// ready = false -> แสดงเป็นสีเทา "เร็ว ๆ นี้" (หน้ายังไม่ได้สร้าง) เปลี่ยนเป็น true เมื่อทำหน้านั้นเสร็จ
// group = หัวข้อกลุ่มในเมนูข้าง (null = อยู่บนสุดไม่มีหัวข้อ)
import type { Permission } from "@/lib/permissions";

export type NavIconName = "dashboard" | "library" | "plus" | "trash" | "playlist" | "faq" | "users" | "history";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  group: string | null;
  permission: Permission | null; // null = ทุกบทบาทเห็น
  ready: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "แดชบอร์ด", icon: "dashboard", group: null, permission: null, ready: true },
  { href: "/admin/media", label: "คลังสื่อ", icon: "library", group: "เนื้อหา", permission: "media.view", ready: true },
  { href: "/admin/media/new", label: "เพิ่มสื่อ", icon: "plus", group: "เนื้อหา", permission: "media.create", ready: true },
  { href: "/admin/playlists", label: "Playlist", icon: "playlist", group: "เนื้อหา", permission: "playlists.manage", ready: false },
  { href: "/admin/faqs", label: "FAQ", icon: "faq", group: "เนื้อหา", permission: "faqs.edit", ready: false },
  { href: "/admin/media/trash", label: "ถังขยะ", icon: "trash", group: "เนื้อหา", permission: "media.delete", ready: true },
  { href: "/admin/users", label: "ผู้ใช้", icon: "users", group: "ระบบ", permission: "users.manage", ready: false },
  { href: "/admin/audit", label: "ประวัติการแก้ไข", icon: "history", group: "ระบบ", permission: "audit.view", ready: false },
];
