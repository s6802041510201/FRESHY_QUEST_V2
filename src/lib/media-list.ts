// พารามิเตอร์ของรายการสื่อในหลังบ้าน (F04): ค้นหา กรองสถานะ/หมวด เรียง แบ่งหน้า
// เป็นฟังก์ชันล้วน (ไม่แตะฐานข้อมูล) ใช้ร่วมกันระหว่างหน้า /admin/media และ GET /api/admin/media
// URL เป็นแหล่งความจริงของตัวกรอง: แชร์ลิงก์/กดย้อนกลับ/รีเฟรชแล้วได้ผลเหมือนเดิม

export const PAGE_SIZE = 10;

export const STATE_FILTERS = ["all", "draft", "scheduled", "live", "expired"] as const;
export type StateFilter = (typeof STATE_FILTERS)[number];

export const STATE_FILTER_LABEL: Record<StateFilter, string> = {
  all: "ทั้งหมด",
  draft: "ฉบับร่าง",
  scheduled: "ตั้งเวลาไว้",
  live: "กำลังเผยแพร่",
  expired: "หมดเวลาแล้ว",
};

export const SORTS = ["episode", "updated"] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABEL: Record<Sort, string> = {
  episode: "เลขด่าน",
  updated: "แก้ไขล่าสุด",
};

export type ListParams = {
  q: string;
  state: StateFilter;
  category: string;
  sort: Sort;
  page: number;
};

export const DEFAULT_PARAMS: ListParams = { q: "", state: "all", category: "", sort: "episode", page: 1 };

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/**
 * ตัดอักขระที่มีความหมายพิเศษใน PostgREST/LIKE ออกจากคำค้น (% _ \ " , ( ) * :)
 * กันคำค้นไปแทรกเงื่อนไข filter หรือทำให้ wildcard ทำงานผิด จำกัดความยาว 80 ตัวอักษร
 */
export function sanitizeQuery(raw: string): string {
  return raw.replace(/[%_\\",()*:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** คำค้นแยกด้วยเว้นวรรค ต้องตรงครบทุกคำ (สูงสุด 5 คำ) */
export function queryTerms(q: string): string[] {
  return q.split(/\s+/).filter(Boolean).slice(0, 5);
}

export function parseListParams(sp: RawParams): ListParams {
  const state = first(sp.state);
  const sort = first(sp.sort);
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  return {
    q: sanitizeQuery(first(sp.q) ?? ""),
    state: STATE_FILTERS.includes(state as StateFilter) ? (state as StateFilter) : "all",
    category: (first(sp.category) ?? "").trim().slice(0, 60),
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : "episode",
    page: Number.isFinite(pageNum) && pageNum >= 1 ? Math.min(pageNum, 10000) : 1,
  };
}

export function pageRange(page: number, size = PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * size;
  return { from, to: from + size - 1 };
}

export function totalPages(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/** ลิงก์ของรายการ ใส่เฉพาะค่าที่ต่างจากค่าเริ่มต้น (URL สั้นและอ่านง่าย) */
export function listHref(base: string, params: ListParams, overrides: Partial<ListParams> = {}): string {
  const p = { ...params, ...overrides };
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.state !== "all") qs.set("state", p.state);
  if (p.category) qs.set("category", p.category);
  if (p.sort !== "episode") qs.set("sort", p.sort);
  if (p.page > 1) qs.set("page", String(p.page));
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** เลขหน้าที่จะแสดงใน pager: 1 … (ก่อนหน้า) ปัจจุบัน (ถัดไป) … สุดท้าย */
export function pageWindow(current: number, total: number): (number | "…")[] {
  const keep = new Set<number>([1, total, current - 1, current, current + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export type StateCounts = Record<StateFilter, number>;

/** นับจำนวนสื่อแต่ละสถานะ และรวบรวมหมวดหมู่ (เรียงตามตัวอักษร ไม่ซ้ำ) จากแถว {live_state, category} */
export function summarize(rows: { live_state: string; category: string }[]): {
  counts: StateCounts;
  categories: string[];
} {
  const counts: StateCounts = { all: 0, draft: 0, scheduled: 0, live: 0, expired: 0 };
  const cats = new Set<string>();
  for (const r of rows) {
    counts.all++;
    if (r.live_state in counts && r.live_state !== "all") counts[r.live_state as StateFilter]++;
    if (r.category) cats.add(r.category);
  }
  return { counts, categories: [...cats].sort((a, b) => a.localeCompare(b, "th")) };
}
