// ชุดคลาส Tailwind ที่ใช้ซ้ำทั้งเว็บ (ปุ่ม ช่องกรอก การ์ด) อ้างอิงโทเคนสีใน globals.css
// ปุ่มหลักของแต่ละหน้า (1 ปุ่ม) ใช้สีส้มไฮไลต์ ส่วนปุ่มอื่นใช้ Navy หรือขอบเทา เพื่อไม่ให้ส้มเกิน 10%

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** ปุ่มหลักที่ต้องกด (ส้ม + ตัวอักษร ink = 5.18:1 ผ่าน AA) */
export const btnAccent = `${base} bg-orange px-4 py-2.5 text-ink shadow-sm hover:bg-orange-strong hover:text-white`;

/** ปุ่ม Navy (ขาวบน Navy = 13.5:1) */
export const btnPrimary = `${base} bg-navy px-4 py-2.5 text-white shadow-sm hover:bg-ink`;

/** ปุ่มรอง ขอบเทา */
export const btnSecondary = `${base} border border-line bg-white px-3 py-2 text-sm text-navy hover:bg-canvas`;

/** ปุ่มอันตราย (ลบ) แบบมีขอบ */
export const btnDangerOutline = `${base} border border-red-strong/40 bg-white px-3 py-2 text-sm text-red-strong hover:bg-red/10`;

/** ปุ่มตัวอักษรสีแดงขนาดเล็ก (ลบแถวในฟอร์ม) */
export const btnDangerText =
  "rounded-lg px-2 py-1.5 text-sm font-medium text-red-strong transition-colors hover:bg-red/10";

export const inputClass =
  "w-full rounded-lg border border-[#7b86a3] bg-white px-3 py-2 text-base text-ink placeholder:text-slate-500 outline-none transition-shadow focus:border-navy focus:ring-2 focus:ring-peri/40";

export const labelClass = "mb-1 block text-sm font-medium text-ink";
export const hintClass = "mt-1 text-xs text-muted";

export const cardClass = "rounded-2xl bg-white ring-1 ring-line shadow-sm";
