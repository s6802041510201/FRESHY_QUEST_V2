// ตัวช่วยแสดงผลและแปลงค่า: วันเวลาไทย (UTC+7, ปี พ.ศ.), นาที:วินาที, ขนาดไฟล์, ป้ายสถานะ
// ในฐานข้อมูลเก็บเวลาเป็น timestamptz (UTC) แปลงเป็นเวลาไทยที่หน้าจอเท่านั้น

const TZ = "Asia/Bangkok";

const thaiDateTime = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "2026-11-13T15:00:00Z" -> "13 พ.ย. 2569 22:00" */
export function formatThaiDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return thaiDateTime.format(d);
}

/** ISO -> ค่าสำหรับ <input type="datetime-local"> เป็นเวลาไทย "YYYY-MM-DDTHH:mm" */
export function toBangkokInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** ค่าจาก <input type="datetime-local"> (ตีความเป็นเวลาไทย) -> ISO UTC หรือ null */
export function fromBangkokInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** 125 -> "2:05", 3725 -> "1:02:05" */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** "2:05" -> 125, "1:02:05" -> 3725, "45" -> 45 ; ไม่ถูกต้อง -> null */
export function parseDuration(input: string): number | null {
  const t = input.trim();
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return null;
  const nums = t.split(":").map(Number);
  if (nums.slice(1).some((n) => n > 59)) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// สถานะที่แสดงในตาราง (ค่า live_state จาก view media_with_state)
export type LiveState = "draft" | "scheduled" | "live" | "expired" | "deleted";

export const LIVE_STATE_LABEL: Record<LiveState, string> = {
  draft: "ฉบับร่าง",
  scheduled: "ตั้งเวลาไว้",
  live: "เผยแพร่อยู่",
  expired: "หมดอายุ",
  deleted: "ถูกลบ",
};

export const LIVE_STATE_CLASS: Record<LiveState, string> = {
  draft: "bg-tint text-muted",
  scheduled: "bg-peri/20 text-navy",
  live: "bg-teal/15 text-teal-strong",
  expired: "bg-orange/15 text-orange-strong",
  deleted: "bg-red/15 text-red-strong",
};

const thaiDateOnly = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** วันที่ล้วนตามภาษาที่เลือก: ไทย = "13 พ.ย. 2569" · อังกฤษ = "13 Nov 2026" */
export function formatDateOnly(ymd: string | null | undefined, lang: "th" | "en"): string {
  if (lang === "th") return formatThaiDateOnly(ymd);
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "-";
  const d = new Date(`${ymd}T12:00:00+07:00`);
  return Number.isNaN(d.getTime())
    ? "-"
    : new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** "2026-11-13" (วันที่ล้วน) -> "13 พ.ย. 2569" ไม่ผ่านการแปลงเขตเวลาให้วันเพี้ยน */
export function formatThaiDateOnly(ymd: string | null | undefined): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "-";
  const d = new Date(`${ymd}T12:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? "-" : thaiDateOnly.format(d);
}
