"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { isNavActive, STUDENT_NAV } from "@/components/student/nav-items";

export default function StudentNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label={t.nav.label} className="hidden lg:block">
      <ul className="flex">
        {STUDENT_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 items-center whitespace-nowrap px-3 text-sm font-medium transition-colors hover:bg-canvas ${
                  active
                    ? "font-semibold text-navy after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-orange"
                    : "text-muted hover:text-navy"
                }`}
              >
                {t.nav[item.label]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
