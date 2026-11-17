"use client";

// รายการเมนูหลังบ้าน ไฮไลต์หน้าที่เปิดอยู่ (aria-current="page" สำหรับโปรแกรมอ่านหน้าจอ)
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkItem = { href: string; label: string; ready: boolean };

export default function NavLinks({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname();

  // เมนูที่ href ยาวที่สุดและตรงกับ path ปัจจุบัน = เมนูที่ active
  // (กัน /admin ไฮไลต์ทุกหน้า และกัน /admin/media ไฮไลต์ตอนอยู่ /admin/media/new)
  const active = items
    .filter((i) => i.ready && (pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible" aria-label="เมนูหลังบ้าน">
      {items.map((item) => {
        if (!item.ready) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className="flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-white/60"
            >
              {item.label}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">เร็ว ๆ นี้</span>
            </span>
          );
        }
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 rounded-lg border-l-4 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-orange bg-white/15 text-white"
                : "border-transparent text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
