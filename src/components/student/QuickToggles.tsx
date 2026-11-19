"use client";

// ปุ่มลัดบนหัวเว็บ: สลับภาษา (ไทย/EN) และสลับธีม (สว่าง/มืด) ใช้ค่าเดียวกับเมนู "ปรับการแสดงผล"
import { usePathname } from "next/navigation";
import { LANG_LABEL, LANGS } from "@/lib/i18n/lang";
import { useI18n } from "@/lib/i18n/client";
import { useDisplayPrefs } from "@/lib/use-display-prefs";

const btn =
  "min-h-11 min-w-11 items-center justify-center rounded-md border border-line-strong bg-surface px-2.5 text-sm font-semibold text-navy transition-colors hover:bg-canvas";

export function LangQuickToggle() {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const other = LANGS.find((l) => l !== lang) ?? "en";
  // ลิงก์ธรรมดาไปที่ /lang (ตั้ง cookie แล้วกลับหน้าเดิม) จึงใช้ได้แม้ JavaScript ยังไม่พร้อม
  const href = `/lang?to=${other}&next=${encodeURIComponent(pathname || "/")}`;
  return (
    <a
      href={href}
      lang={other}
      aria-label={t.settings.quickLang(LANG_LABEL[other])}
      title={t.settings.quickLang(LANG_LABEL[other])}
      className={`inline-flex ${btn}`}
    >
      {other === "en" ? "EN" : "ไทย"}
    </a>
  );
}

export function ThemeQuickToggle() {
  const { t } = useI18n();
  const { setTheme } = useDisplayPrefs();
  // ธีมที่ใช้จริงอยู่ที่ <html data-theme> (รวมกรณีตามระบบ) จึงอ่านตอนกดและสลับเป็นอีกฝั่ง
  function toggle() {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }
  return (
    <>
      <button type="button" onClick={toggle} aria-label={t.settings.quickThemeToDark} title={t.settings.quickThemeToDark} className={`inline-flex ${btn} dark:hidden`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      </button>
      <button type="button" onClick={toggle} aria-label={t.settings.quickThemeToLight} title={t.settings.quickThemeToLight} className={`hidden ${btn} dark:inline-flex`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
    </>
  );
}
