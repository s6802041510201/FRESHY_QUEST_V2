"use client";

// เมนูล่างบนมือถือ (ซ่อนบนจอ >= md ซึ่งใช้เมนูแถบบนแทน) ปุ่มกดได้สะดวกด้วยนิ้วโป้ง สูง 56px+
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { isNavActive, type NavIcon, STUDENT_NAV } from "@/components/student/nav-items";

function Icon({ name }: { name: NavIcon }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h5v-6h4v6h5V10" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
  }
}

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav
      aria-label={t.nav.mobileLabel}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface shadow-[0_-2px_8px_rgba(15,23,56,0.08)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {STUDENT_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={t.nav[item.label]}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs font-medium ${
                  active ? "text-navy" : "text-muted"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? "bg-navy/10" : ""}`}
                >
                  <Icon name={item.icon} />
                </span>
                <span className={active ? "font-semibold" : ""}>{t.nav[item.short]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
