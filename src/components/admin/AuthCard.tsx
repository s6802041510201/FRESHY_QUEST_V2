"use client";

// กรอบหน้าล็อกอิน / ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่
// จอคอมพิวเตอร์: แบ่งสองส่วน ซ้าย = แผงสี Navy บอกว่าเป็นระบบอะไรของหน่วยงานไหน ขวา = ฟอร์มบนพื้นสว่าง
// มือถือ: แถบ Navy บาง ๆ ด้านบน แล้วตามด้วยฟอร์ม
import { btnPrimary, inputClass as input } from "@/components/ui/styles";
import { DotField } from "@/components/ui/Decor";
import { LangQuickToggle, ThemeQuickToggle } from "@/components/student/QuickToggles";
import { useI18n } from "@/lib/i18n/client";
import { SITE_NAME } from "@/lib/site";

export const inputClass = input;
export const buttonClass = `${btnPrimary} w-full`;

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [first, ...rest] = SITE_NAME.split(" ");
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="on-dark relative isolate overflow-hidden bg-band px-6 py-5 text-white md:flex md:w-5/12 md:max-w-xl md:flex-col md:justify-between md:px-12 md:py-14">
        <DotField className="[mask-image:linear-gradient(to_bottom,transparent,#000_40%,transparent)]" />
        <div className="relative flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-md bg-white font-heading text-lg text-[#1f2b5c]"
          >
            FQ
          </span>
          <p className="font-heading text-xl text-white">
            {first} <span className="text-orange-soft">{rest.join(" ")}</span>
          </p>
        </div>
        <div className="relative hidden md:block">
          <span aria-hidden="true" className="block h-0.5 w-10 bg-orange" />
          <h2 className="mt-5 text-3xl">{t.auth.asideTitle}</h2>
          <p className="mt-4 max-w-sm text-white/85">
            {t.auth.asideDesc}
          </p>
        </div>
        <p className="relative hidden text-sm text-white/75 md:block">{t.site.university}</p>
      </aside>

      <main id="main" className="relative flex flex-1 items-center justify-center bg-canvas px-4 py-10 sm:px-8 md:py-14">
        <div className="absolute top-3 right-3 flex gap-2 sm:top-4 sm:right-4">
          <LangQuickToggle />
          <ThemeQuickToggle />
        </div>
        <div className="w-full max-w-md">
          <h1 className="text-3xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
          <div className="mt-8 rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
