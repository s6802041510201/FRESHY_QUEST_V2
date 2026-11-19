"use client";

// ผู้ให้บริการภาษาฝั่งเบราว์เซอร์: Server Component ส่งแค่รหัสภาษา (th/en) ส่วนข้อความอ่านจากพจนานุกรมในฝั่งนี้
// (ส่งพจนานุกรมข้ามจาก server มา client ตรง ๆ ไม่ได้ เพราะมีฟังก์ชันอยู่ข้างใน)
import { createContext, useCallback, useContext, useMemo } from "react";
import { type Dict, dictFor } from "@/lib/i18n/dict";
import { type Lang, langCookieString } from "@/lib/i18n/lang";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = langCookieString(next);
      document.documentElement.lang = next;
      // โหลดหน้าใหม่เลย (แทน router.refresh) เพราะบนโหมด dev การรีเฟรชแบบเงียบอาจช้าหรือไม่เปลี่ยน ทำให้ดูเหมือนปุ่มเสีย
      window.location.reload();
    },
    [],
  );
  const value = useMemo(() => ({ lang, t: dictFor(lang), setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n ต้องอยู่ใน <I18nProvider>");
  return c;
}
