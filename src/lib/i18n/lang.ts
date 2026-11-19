// ภาษาของเว็บ (ไทย/อังกฤษ) ฟังก์ชันล้วน ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์
// เก็บค่าใน cookie (ไม่ใช่ localStorage) เพื่อให้เซิร์ฟเวอร์รู้ภาษาและเรนเดอร์ข้อความถูกตั้งแต่แรก ไม่กะพริบ

export const LANGS = ["th", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "th";
export const LANG_COOKIE = "fq-lang";
export const LANG_LABEL: Record<Lang, string> = { th: "ไทย", en: "English" };

export function parseLang(v: string | null | undefined): Lang {
  return LANGS.find((l) => l === v) ?? DEFAULT_LANG;
}

/** ข้อความสำหรับตั้ง cookie ฝั่งเบราว์เซอร์ (อยู่ 1 ปี ใช้ได้ทุกหน้า) */
export function langCookieString(lang: Lang): string {
  return `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}
