// เมนูหลักของนักศึกษา ใช้ร่วมกันระหว่างแถบบน (คอมพิวเตอร์) และเมนูล่าง (มือถือ)
// label/short เป็นคีย์ของพจนานุกรม (lib/i18n/dict.ts หมวด nav) เพื่อให้สลับภาษาได้
export const STUDENT_NAV = [
  { href: "/", label: "home", short: "homeShort", icon: "home" },
  { href: "/quests", label: "quests", short: "questsShort", icon: "grid" },
  { href: "/checklist", label: "checklist", short: "checklistShort", icon: "check" },
  { href: "/search", label: "search", short: "searchShort", icon: "search" },
] as const;

export type NavIcon = (typeof STUDENT_NAV)[number]["icon"];

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
