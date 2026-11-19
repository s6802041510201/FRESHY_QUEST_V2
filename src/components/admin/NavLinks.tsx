"use client";

// เมนูข้างหลังบ้าน แบ่งกลุ่มตามหัวข้อ ไฮไลต์หน้าที่เปิดอยู่ (aria-current="page" สำหรับโปรแกรมอ่านหน้าจอ)
// มือถือ: เรียงแนวนอนเลื่อนซ้ายขวาได้ (ซ่อนหัวข้อกลุ่ม)
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavIconName } from "@/components/admin/nav";

export type NavLinkItem = { href: string; label: string; ready: boolean; icon: NavIconName; group: string | null };

function Icon({ name }: { name: NavIconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "shrink-0",
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M10 9.5v5l4.5-2.5L10 9.5z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      );
    case "playlist":
      return (
        <svg {...common}>
          <path d="M4 6h12M4 11h12M4 16h7" />
          <path d="M17 14v6l4-3-4-3z" />
        </svg>
      );
    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2M12 17h.01" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0113 0M16 4.8a3.5 3.5 0 010 6.4M18 14.5a6.5 6.5 0 013.5 5.5" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M3.5 12a8.5 8.5 0 102.5-6" />
          <path d="M3 4v4h4M12 8v4.5l3 1.5" />
        </svg>
      );
  }
}

export default function NavLinks({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname();

  // เมนูที่ href ยาวที่สุดและตรงกับ path ปัจจุบัน = เมนูที่ active
  // (กัน /admin ไฮไลต์ทุกหน้า และกัน /admin/media ไฮไลต์ตอนอยู่ /admin/media/new)
  const active = items
    .filter((i) => i.ready && (pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  // จัดกลุ่มตามลำดับที่ปรากฏ
  const groups: { name: string | null; items: NavLinkItem[] }[] = [];
  for (const item of items) {
    const g = groups.find((x) => x.name === item.group);
    if (g) g.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }

  return (
    <nav aria-label="เมนูหลังบ้าน" className="flex gap-1 overflow-x-auto md:flex-col md:gap-6 md:overflow-visible">
      {groups.map((g) => (
        <div key={g.name ?? "top"} className="flex gap-1 md:flex-col">
          {g.name ? (
            <p className="hidden px-3 pb-1 text-xs font-semibold tracking-wide text-muted md:block">{g.name}</p>
          ) : null}
          {g.items.map((item) => {
            if (!item.ready) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-md px-3 text-sm text-muted"
                >
                  <span className="flex items-center gap-3 whitespace-nowrap">
                    <Icon name={item.icon} />
                    {item.label}
                  </span>
                  <span className="hidden shrink-0 whitespace-nowrap rounded bg-canvas px-2 py-0.5 text-xs md:inline">เร็ว ๆ นี้</span>
                </span>
              );
            }
            const isActive = item.href === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-md border-l-[3px] px-3 text-sm transition-colors ${
                  isActive
                    ? "border-orange bg-tint font-semibold text-navy"
                    : "border-transparent font-medium text-ink hover:bg-canvas"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
