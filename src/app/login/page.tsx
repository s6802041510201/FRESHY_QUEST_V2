// หน้าเลือกบทบาทก่อนเข้าใช้งาน: นักศึกษา (เข้าเว็บได้เลย ไม่ต้องมีบัญชี) / Admin / Teacher
// Admin และ Teacher ใช้หน้าฟอร์มเดียวกัน (/admin/login?as=...) แต่ล็อกอินข้ามกันไม่ได้ เซิร์ฟเวอร์เช็กว่าบทบาทของบัญชีตรงกับที่เลือก
// หมายเหตุ: Teacher คือชื่อที่แสดงของบทบาท editor ในฐานข้อมูล
import type { Metadata } from "next";
import Link from "next/link";
import { btnAccent, btnPrimary } from "@/components/ui/styles";
import { GlowBlobs } from "@/components/ui/Decor";
import { LangQuickToggle, ThemeQuickToggle } from "@/components/student/QuickToggles";
import { getDict } from "@/lib/i18n/server";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).t.meta.roles };
}

const iconProps = {
  width: 32,
  height: 32,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const ROLES = [
  {
    key: "student",
    href: "/",
    primary: true,
    icon: (
      <svg {...iconProps}>
        <path d="M2 9l10-5 10 5-10 5L2 9z" />
        <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
      </svg>
    ),
  },
  {
    key: "admin",
    href: "/admin/login?as=admin",
    primary: false,
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "teacher",
    href: "/admin/login?as=teacher",
    primary: false,
    icon: (
      <svg {...iconProps}>
        <path d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17v3z" />
        <path d="M14 7l3 3" />
      </svg>
    ),
  },
] as const;

export default async function RolePickerPage() {
  const { t } = await getDict();
  const [first, ...rest] = SITE_NAME.split(" ");
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="bg-band text-white">
          <p className="mx-auto max-w-5xl px-4 py-1.5 text-xs sm:px-6">{t.site.university}</p>
        </div>
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-md bg-brand font-heading text-lg text-white"
          >
            FQ
          </span>
          <p className="wordmark font-heading text-xl text-navy">
            {first} <span className="text-orange-strong">{rest.join(" ")}</span>
          </p>
          <div className="ml-auto flex gap-2">
            <LangQuickToggle />
            <ThemeQuickToggle />
          </div>
        </div>
      </header>

      <div className="relative isolate flex-1 overflow-hidden">
      <GlowBlobs />
      <main id="main" className="relative mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 md:py-16">
        <div className="max-w-2xl">
          <h1 className="section-title text-3xl md:text-4xl">{t.roles.title}</h1>
          <p className="mt-4 text-muted">{t.roles.desc}</p>
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {ROLES.map((r) => (
            <li key={r.key} className="flex">
              <div
                className={`flex w-full flex-col rounded-lg border border-t-4 bg-surface p-6 shadow-sm ${
                  r.primary ? "border-navy" : "border-line"
                }`}
              >
                <div className="flex size-14 items-center justify-center rounded-md bg-tint text-navy">
                  {r.icon}
                </div>
                <h2 className="mt-5 text-xl">{t.roles[r.key].title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted">{t.roles[r.key].desc}</p>
                <Link href={r.href} className={`${r.primary ? btnAccent : btnPrimary} mt-6 w-full`}>
                  {t.roles[r.key].cta}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
      </div>
    </div>
  );
}
