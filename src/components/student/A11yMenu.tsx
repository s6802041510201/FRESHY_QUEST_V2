"use client";

// เมนูปรับการแสดงผล: ขนาดตัวอักษร 3 ระดับ + ธีมสี (ตามระบบ/สว่าง/มืด) + ภาษา + ความคมชัดสูง
// ค่าทั้งหมดจำในเครื่อง (ภาษาเก็บใน cookie) ใช้กับทุกหน้า
import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_PREFS, TEXT_SIZE_PERCENT, TEXT_SIZES, THEMES } from "@/lib/display-prefs";
import { useI18n } from "@/lib/i18n/client";
import { LANG_LABEL, LANGS } from "@/lib/i18n/lang";
import { useDisplayPrefs } from "@/lib/use-display-prefs";

const choice = (active: boolean) =>
  `min-h-11 rounded-md px-2 py-2 text-sm font-medium ring-1 transition-colors ${
    active ? "bg-brand text-white ring-navy" : "bg-surface text-navy ring-line-strong hover:bg-canvas"
  }`;

export default function A11yMenu() {
  const { prefs, setText, setContrast, setTheme, reset } = useDisplayPrefs();
  const { lang, t, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const changed = prefs.text !== "md" || prefs.contrast || prefs.theme !== DEFAULT_PREFS.theme;

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-md border px-3 text-sm font-medium text-navy transition-colors hover:bg-canvas sm:px-3.5 ${
          changed ? "border-navy bg-canvas" : "border-line-strong bg-surface"
        }`}
      >
        <span aria-hidden="true" className="font-heading">
          Aa
        </span>{" "}
        <span className="sr-only xl:not-sr-only">{t.settings.button}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label={t.settings.title}
          className="fixed inset-x-4 top-[4.5rem] z-40 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-line bg-surface p-5 text-ink shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80"
        >
          <p className="text-sm font-semibold text-ink">{t.settings.textSize}</p>
          <div role="group" aria-label={t.settings.textSize} className="mt-2 grid grid-cols-3 gap-2">
            {TEXT_SIZES.map((s) => (
              <button key={s} type="button" aria-pressed={prefs.text === s} onClick={() => setText(s)} className={choice(prefs.text === s)}>
                {t.settings.sizes[s]}
                <span className="block text-xs font-normal opacity-80">{TEXT_SIZE_PERCENT[s]}%</span>
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-ink">{t.settings.theme}</p>
          <div role="group" aria-label={t.settings.theme} className="mt-2 grid grid-cols-3 gap-2">
            {THEMES.map((m) => (
              <button key={m} type="button" aria-pressed={prefs.theme === m} onClick={() => setTheme(m)} className={choice(prefs.theme === m)}>
                {t.settings.themes[m]}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-ink">{t.settings.language}</p>
          <div role="group" aria-label={t.settings.language} className="mt-2 grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={choice(lang === l)}>
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span id={`${panelId}-contrast`} className="text-sm font-semibold text-ink">
              {t.settings.contrast}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.contrast}
              aria-labelledby={`${panelId}-contrast`}
              onClick={() => setContrast(!prefs.contrast)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                prefs.contrast ? "bg-teal-deep" : "bg-input"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                  prefs.contrast ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="mt-1.5 text-sm text-muted">{t.settings.contrastHint}</p>

          <button
            type="button"
            onClick={reset}
            disabled={!changed}
            className="mt-5 min-h-11 w-full rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-navy hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.settings.reset}
          </button>
        </div>
      ) : null}
    </div>
  );
}
