import Link from "next/link";
import { LangQuickToggle, ThemeQuickToggle } from "@/components/student/QuickToggles";
import StudentNav from "@/components/student/StudentNav";
import { getDict } from "@/lib/i18n/server";

// ส่วนหัวแบบมหาวิทยาลัย: แถบบางสี Navy บอกสังกัด + แถบเมนูพื้นสว่าง (ติดบนสุดเมื่อเลื่อนหน้า)
export default async function SiteHeader() {
  const { t } = await getDict();
  const [first, ...rest] = t.site.name.split(" ");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="hidden bg-band text-white sm:block">
        <p className="mx-auto max-w-6xl px-4 py-1.5 text-xs sm:px-6">{t.site.university}</p>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={t.site.homeAria}>
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-brand font-heading text-lg text-white">
            FQ
          </span>
          <span className="wordmark leading-tight">
            <span className="block whitespace-nowrap font-heading text-lg text-navy sm:text-xl">
              {first} <span className="text-orange-strong">{rest.join(" ")}</span>
            </span>
            <span className="hidden text-xs text-muted 2xl:block">{t.site.taglineShort}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <StudentNav />
          <div className="hidden items-center gap-2 sm:flex">
            <LangQuickToggle />
            <ThemeQuickToggle />
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-md bg-brand px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover sm:px-4"
          >
            {t.nav.login}
          </Link>
        </div>
      </div>
    </header>
  );
}
