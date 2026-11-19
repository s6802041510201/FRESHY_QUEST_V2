// ชุดคลาส Tailwind ที่ใช้ซ้ำทั้งเว็บ (ปุ่ม ช่องกรอก การ์ด ป้ายสถานะ) อ้างอิงโทเคนสีใน globals.css
// หลักการ: ปุ่มทุกแบบสูงอย่างน้อย 44px (ปลายนิ้วกดง่าย) มุม 6px เงาเบา
// ปุ่ม Navy เป็นปุ่มหลักของระบบ ส่วนปุ่มส้มใช้กับ "การกระทำเดียวที่สำคัญที่สุดของหน้า" ฝั่งนักศึกษา เพื่อให้ส้มไม่เกิน 10%

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2 text-base font-semibold leading-snug transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/** ปุ่มเน้นสูงสุด (ส้ม + ตัวอักษร ink = 5.18:1 ผ่าน AA) ใช้ได้หน้าละ 1 ปุ่ม */
export const btnAccent = `${base} bg-orange text-on-accent hover:bg-orange-deep hover:text-white`;

/** ปุ่มหลัก Navy (ขาวบน Navy = 13.5:1) */
export const btnPrimary = `${base} bg-brand text-white ring-1 ring-transparent hover:bg-brand-hover dark:ring-white/30`;

/** ปุ่มรอง ขอบ Navy จาง */
export const btnSecondary = `${base} border border-line-strong bg-surface text-navy hover:border-navy hover:bg-canvas`;

/** ปุ่มขนาดเล็กสำหรับพื้นที่แน่น (แถวในตาราง) สูง 40px */
export const btnSmall = `${base} min-h-10 px-3.5 py-1.5 text-sm border border-line-strong bg-surface text-navy hover:border-navy hover:bg-canvas`;

/** ปุ่มอันตราย (ลบ) แบบมีขอบ */
export const btnDangerOutline = `${base} border border-red-strong/50 bg-surface text-red-strong hover:bg-red/10`;

/** ปุ่มตัวอักษรสีแดง (ลบแถวในฟอร์ม) */
export const btnDangerText =
  "inline-flex min-h-10 items-center rounded-md px-3 py-1.5 text-sm font-medium text-red-strong transition-colors hover:bg-red/10";

export const inputClass =
  "block min-h-11 w-full rounded-md border border-input bg-surface px-3.5 py-2 text-base text-ink placeholder:text-muted outline-none transition-shadow focus:border-navy focus:ring-2 focus:ring-peri/40";

export const labelClass = "mb-1.5 block text-sm font-semibold text-ink";
export const hintClass = "mt-1.5 text-sm text-muted";

/** การ์ดมาตรฐาน: พื้นขาว เส้นขอบบาง มุม 8px (ไม่ใช้เงาหนัก) */
export const cardClass = "rounded-lg border border-line bg-surface shadow-sm";

/** ป้ายสถานะ/หมวดหมู่ มุมเหลี่ยมเล็กน้อย ตัวอักษร 13px ขึ้นไป */
export const badgeClass =
  "inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-xs font-semibold leading-relaxed";
