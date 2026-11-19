import "server-only";
// ดึงข้อมูลสาธารณะสำหรับหน้านักศึกษา
// ใช้ client แบบ "ไม่ผูกคุกกี้" (anon เสมอ) เพื่อให้ผู้ดูแลที่ล็อกอินอยู่ในเบราว์เซอร์เดียวกัน
// เห็นหน้านักศึกษาเหมือนนักศึกษา (ไม่เห็นฉบับร่าง/ที่ยังไม่ถึงเวลา) การกรองจริงทำโดย RLS ในฐานข้อมูล
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import {
  type Contact,
  type QuestDetail,
  type QuestSummary,
  mergeContacts,
  orderQuests,
  toDetail,
  toSummary,
} from "@/lib/quest-types";

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

const MEDIA_COLUMNS =
  "id,slug,episode_no,title,description,category,cover_path,duration_sec," +
  "video_169_path,video_916_path,subtitle_path,chapters,checklist,quiz,sources,contacts";

/** สื่อที่กำลังเผยแพร่ทั้งหมด เรียงตามเลขด่าน (1 คำขอต่อ 1 request ด้วย cache) */
export const getLiveQuests = cache(async (): Promise<QuestDetail[]> => {
  const { data, error } = await anonClient()
    .from("media")
    .select(MEDIA_COLUMNS)
    .order("episode_no", { ascending: true });
  if (error) throw new Error(`โหลดสื่อไม่สำเร็จ: ${error.message}`);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(toDetail);
});

/** ด่านบน Quest Map: ตามลำดับ playlist หน้าแรก ถ้ายังไม่มี playlist ใช้เลขด่าน */
export const getHomeQuests = cache(async (): Promise<QuestDetail[]> => {
  const [all, home] = await Promise.all([getLiveQuests(), getHomeOrder()]);
  return orderQuests(all, home);
});

const getHomeOrder = cache(async () => {
  const { data, error } = await anonClient()
    .from("playlist_items")
    .select("media_id,sort_order,playlists!inner(is_home)")
    .eq("playlists.is_home", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`โหลดลำดับด่านไม่สำเร็จ: ${error.message}`);
  return (data ?? []) as { media_id: string; sort_order: number }[];
});

export async function getHomeSummaries(): Promise<QuestSummary[]> {
  return (await getHomeQuests()).map(toSummary);
}

export async function getAllSummaries(): Promise<QuestSummary[]> {
  return (await getLiveQuests()).map(toSummary);
}

export async function getQuestPage(slug: string): Promise<{
  quest: QuestDetail;
  prev: QuestSummary | null;
  next: QuestSummary | null;
  liveIds: string[];
} | null> {
  const ordered = await getHomeQuests();
  const all = await getLiveQuests();
  const quest = all.find((q) => q.slug === slug);
  if (!quest) return null;
  // ด่านก่อน/ถัดไป: ตามลำดับหน้าแรก ถ้าด่านนี้ไม่อยู่ในลำดับนั้น ใช้เลขด่าน
  const list = ordered.some((q) => q.id === quest.id) ? ordered : all;
  const i = list.findIndex((q) => q.id === quest.id);
  return {
    quest,
    prev: i > 0 ? toSummary(list[i - 1]) : null,
    next: i >= 0 && i < list.length - 1 ? toSummary(list[i + 1]) : null,
    liveIds: all.map((q) => q.id),
  };
}

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  media_id: string | null;
};

export const getFaqs = cache(async (): Promise<PublicFaq[]> => {
  const { data, error } = await anonClient()
    .from("faqs")
    .select("id,question,answer,category,media_id,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`โหลดคำถามที่พบบ่อยไม่สำเร็จ: ${error.message}`);
  return (data ?? []) as PublicFaq[];
});

export async function getAllContacts(): Promise<Contact[]> {
  const all = await getLiveQuests();
  return mergeContacts(all.map((q) => q.contacts));
}
