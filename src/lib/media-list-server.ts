import "server-only";
// ดึงรายการสื่อสำหรับหลังบ้าน (F04) ใช้ client ที่ผูกกับผู้ใช้ -> RLS ตรวจสิทธิ์อ่านให้
// ใช้ร่วมกันระหว่างหน้า /admin/media และ GET /api/admin/media
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveState } from "@/lib/format";
import { type ListParams, pageRange, queryTerms, summarize } from "@/lib/media-list";

export type MediaListRow = {
  id: string;
  slug: string;
  episode_no: number;
  title: string;
  category: string;
  live_state: LiveState;
  updated_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ชนิดของ query builder ของ supabase-js ซับซ้อนเกินจำเป็น
function applyFilters<T extends { is: any; eq: any; or: any }>(query: T, p: ListParams): T {
  // Admin อ่านแถวที่ถูกลบได้ด้วย ต้องกรองออกเอง (ถังขยะอยู่อีกหน้า)
  let q = query.is("deleted_at", null);
  if (p.state !== "all") q = q.eq("live_state", p.state);
  if (p.category) q = q.eq("category", p.category);
  // แต่ละคำต้องพบในอย่างน้อย 1 ช่อง (AND ข้ามคำ, OR ข้ามช่อง) คำค้นผ่าน sanitizeQuery แล้ว
  for (const t of queryTerms(p.q)) {
    q = q.or(`title.ilike.%${t}%,description.ilike.%${t}%,slug.ilike.%${t}%,category.ilike.%${t}%`);
  }
  return q;
}

export async function fetchMediaList(
  supabase: SupabaseClient,
  p: ListParams,
): Promise<{ rows: MediaListRow[]; total: number; error: string | null }> {
  const { from, to } = pageRange(p.page);
  let query = applyFilters(
    supabase
      .from("media_with_state")
      .select("id, slug, episode_no, title, category, live_state, updated_at", { count: "exact" }),
    p,
  );
  query = p.sort === "updated"
    ? query.order("updated_at", { ascending: false })
    : query.order("episode_no", { ascending: true });
  const { data, count, error } = await query.range(from, to);

  if (error) {
    // PGRST103 = หน้าที่ขอเกินจำนวนแถวจริง -> ขอแค่จำนวนรวม ให้ผู้เรียกพาไปหน้าสุดท้าย
    if (error.code === "PGRST103") {
      const head = await applyFilters(
        supabase.from("media_with_state").select("id", { count: "exact", head: true }),
        p,
      );
      return { rows: [], total: head.count ?? 0, error: head.error ? "โหลดรายการไม่สำเร็จ" : null };
    }
    return { rows: [], total: 0, error: "โหลดรายการไม่สำเร็จ" };
  }
  return { rows: (data ?? []) as MediaListRow[], total: count ?? 0, error: null };
}

/** จำนวนสื่อแต่ละสถานะและรายชื่อหมวดหมู่ (ไม่รวมที่ถูกลบ) ไว้ทำปุ่มกรองและตัวเลือกหมวด */
export async function fetchMediaSummary(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("media_with_state")
    .select("live_state, category")
    .is("deleted_at", null)
    .range(0, 999);
  const rows = (data ?? []) as { live_state: string; category: string }[];
  return { ...summarize(rows), error: error ? "โหลดสรุปไม่สำเร็จ" : null };
}
