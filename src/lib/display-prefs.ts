// การตั้งค่าการแสดงผล: ขนาดตัวอักษร 3 ระดับ + ความคมชัดสูง + ธีม (สว่าง/มืด/ตามระบบ) เก็บในเครื่อง (localStorage)
// ไฟล์นี้เป็นฟังก์ชันล้วน (ทดสอบได้) ส่วนที่แตะเบราว์เซอร์อยู่ใน use-display-prefs.ts
// ภาษา (ไทย/อังกฤษ) เก็บใน cookie แยกต่างหาก (ดู lib/i18n) เพราะฝั่งเซิร์ฟเวอร์ต้องอ่านค่าเพื่อเรนเดอร์ข้อความ

export const DISPLAY_KEY = "freshy-quest:display:v1";

export const TEXT_SIZES = ["md", "lg", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

/** ขนาดตัวอักษรหลักของหน้าเว็บ (ตรงกับ html[data-text] ใน globals.css): ปกติ 100% · ใหญ่ 125% · ใหญ่มาก 150% */
export const TEXT_SIZE_PERCENT: Record<TextSize, number> = { md: 100, lg: 125, xl: 150 };

export const THEMES = ["light", "dark", "system"] as const;
export type ThemePref = (typeof THEMES)[number];

export type DisplayPrefs = { text: TextSize; contrast: boolean; theme: ThemePref };

// ค่าเริ่มต้น = สว่าง (หน้าตาเดิมของเว็บ) ธีมมืดเปิดเองได้ หรือเลือก "ตามระบบ" ให้ตามโหมดของเครื่อง
export const DEFAULT_PREFS: DisplayPrefs = { text: "md", contrast: false, theme: "light" };

/** อ่านค่าที่เก็บไว้ ถ้าเสียหรือไม่รู้จัก ใช้ค่าเริ่มต้น (ไม่ทำให้หน้าพัง) */
export function parsePrefs(raw: string | null): DisplayPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const d: unknown = JSON.parse(raw);
    if (typeof d !== "object" || d === null) return DEFAULT_PREFS;
    const o = d as Record<string, unknown>;
    const text = TEXT_SIZES.find((t) => t === o.text) ?? "md";
    const theme = THEMES.find((t) => t === o.theme) ?? DEFAULT_PREFS.theme;
    return { text, contrast: o.contrast === true, theme };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** ธีมที่ใช้จริง: system -> ตามระบบปฏิบัติการของผู้ใช้ */
export function resolveTheme(pref: ThemePref, systemDark: boolean): "light" | "dark" {
  return pref === "system" ? (systemDark ? "dark" : "light") : pref;
}

/** ตั้ง attribute บน <html> ให้ CSS (globals.css) ทำงาน: data-text="lg|xl", data-contrast="high", data-theme="light|dark" */
export function applyPrefs(prefs: DisplayPrefs, root: HTMLElement, systemDark: boolean): void {
  if (prefs.text === "md") root.removeAttribute("data-text");
  else root.setAttribute("data-text", prefs.text);
  if (prefs.contrast) root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
  root.setAttribute("data-theme", resolveTheme(prefs.theme, systemDark));
}

/**
 * สคริปต์เล็ก ๆ ที่รันใน <head> ก่อนวาดหน้าจอ เพื่อไม่ให้ขนาดตัวอักษร/สีกระตุกตอนโหลด (โดยเฉพาะธีมมืดไม่ให้ขึ้นขาววาบ)
 * ต้องตรงกับ parsePrefs + applyPrefs ด้านบน (มีเทสต์เทียบ)
 */
export const DISPLAY_INIT_SCRIPT = `try{var d=null;try{d=JSON.parse(localStorage.getItem(${JSON.stringify(DISPLAY_KEY)})||"null")}catch(_){}var e=document.documentElement;if(d){if(d.text==="lg"||d.text==="xl")e.setAttribute("data-text",d.text);if(d.contrast===true)e.setAttribute("data-contrast","high")}var t=d&&(d.theme==="light"||d.theme==="dark"||d.theme==="system")?d.theme:"light";if(t==="system")t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";e.setAttribute("data-theme",t)}catch(_){}`;
