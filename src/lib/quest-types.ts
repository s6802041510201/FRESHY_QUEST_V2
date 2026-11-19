// ชนิดข้อมูลของ "ด่าน" ฝั่งนักศึกษา และตัวแปลงค่า jsonb จากฐานข้อมูลให้ปลอดภัย
// (ข้อมูลใน jsonb แก้ได้จากหลายทาง จึงตรวจรูปแบบซ้ำก่อนเอาไปแสดง ไม่เชื่อค่าตรง ๆ)

export type Chapter = { time_sec: number; title: string };
export type ChecklistItem = { id: string; text: string };
export type QuizChoice = { id: string; text: string };
export type QuizQuestion = {
  id: string;
  question: string;
  choices: QuizChoice[];
  answer: string;
  explanation: string | null;
};
export type Source = { label: string; url: string; checked_at: string | null };
export type Contact = { label: string; value: string; url: string | null };

export type QuestSummary = {
  id: string;
  slug: string;
  episode_no: number;
  title: string;
  description: string | null;
  category: string;
  cover_path: string | null;
  duration_sec: number | null;
};

export type QuestDetail = QuestSummary & {
  video_169_path: string | null;
  video_916_path: string | null;
  subtitle_path: string | null;
  chapters: Chapter[];
  checklist: ChecklistItem[];
  quiz: QuizQuestion[];
  sources: Source[];
  contacts: Contact[];
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** ลิงก์ที่อนุญาตให้ใส่ใน href: เฉพาะ http/https (กัน javascript: จากข้อมูลที่ถูกแก้) */
export function safeHttpUrl(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeChapters(v: unknown): Chapter[] {
  if (!Array.isArray(v)) return [];
  const out: Chapter[] = [];
  for (const r of v) {
    if (!isRecord(r)) continue;
    const t = r.time_sec;
    const title = str(r.title);
    if (typeof t === "number" && Number.isFinite(t) && t >= 0 && title) {
      out.push({ time_sec: Math.floor(t), title });
    }
  }
  return out.sort((a, b) => a.time_sec - b.time_sec);
}

export function normalizeChecklist(v: unknown): ChecklistItem[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: ChecklistItem[] = [];
  for (const r of v) {
    if (!isRecord(r)) continue;
    const id = str(r.id);
    const text = str(r.text);
    if (id && text && !seen.has(id)) {
      seen.add(id);
      out.push({ id, text });
    }
  }
  return out;
}

export function normalizeQuiz(v: unknown): QuizQuestion[] {
  if (!Array.isArray(v)) return [];
  const out: QuizQuestion[] = [];
  for (const r of v) {
    if (!isRecord(r) || !Array.isArray(r.choices)) continue;
    const id = str(r.id);
    const question = str(r.question);
    const answer = str(r.answer);
    const choices: QuizChoice[] = [];
    for (const c of r.choices) {
      if (!isRecord(c)) continue;
      const cid = str(c.id);
      const text = str(c.text);
      if (cid && text) choices.push({ id: cid, text });
    }
    if (id && question && answer && choices.length >= 2 && choices.some((c) => c.id === answer)) {
      out.push({ id, question, choices, answer, explanation: str(r.explanation) });
    }
  }
  return out;
}

export function normalizeSources(v: unknown): Source[] {
  if (!Array.isArray(v)) return [];
  const out: Source[] = [];
  for (const r of v) {
    if (!isRecord(r)) continue;
    const label = str(r.label);
    const url = safeHttpUrl(r.url);
    if (label && url) out.push({ label, url, checked_at: str(r.checked_at) });
  }
  return out;
}

export function normalizeContacts(v: unknown): Contact[] {
  if (!Array.isArray(v)) return [];
  const out: Contact[] = [];
  for (const r of v) {
    if (!isRecord(r)) continue;
    const label = str(r.label);
    const value = str(r.value);
    if (label && value) out.push({ label, value, url: safeHttpUrl(r.url) });
  }
  return out;
}

/** รวมช่องทางติดต่อจากทุกด่าน ตัดตัวซ้ำ (ชื่อ+ค่าเหมือนกัน) */
export function mergeContacts(lists: Contact[][]): Contact[] {
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const list of lists) {
    for (const c of list) {
      const key = `${c.label}\u0000${c.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(c);
      }
    }
  }
  return out;
}

export function toDetail(row: Record<string, unknown>): QuestDetail {
  return {
    id: String(row.id),
    slug: String(row.slug),
    episode_no: Number(row.episode_no),
    title: String(row.title),
    description: str(row.description),
    category: typeof row.category === "string" ? row.category : "",
    cover_path: str(row.cover_path),
    duration_sec: typeof row.duration_sec === "number" ? row.duration_sec : null,
    video_169_path: str(row.video_169_path),
    video_916_path: str(row.video_916_path),
    subtitle_path: str(row.subtitle_path),
    chapters: normalizeChapters(row.chapters),
    checklist: normalizeChecklist(row.checklist),
    quiz: normalizeQuiz(row.quiz),
    sources: normalizeSources(row.sources),
    contacts: normalizeContacts(row.contacts),
  };
}

export function toSummary(d: QuestDetail): QuestSummary {
  return {
    id: d.id,
    slug: d.slug,
    episode_no: d.episode_no,
    title: d.title,
    description: d.description,
    category: d.category,
    cover_path: d.cover_path,
    duration_sec: d.duration_sec,
  };
}

/** เรียงตามลำดับ playlist หน้าแรก ถ้าไม่มี (ยังไม่ได้สร้าง/ว่าง) ใช้เลขด่านน้อยไปมาก */
export function orderQuests<T extends { id: string; episode_no: number }>(
  all: T[],
  homeOrder: { media_id: string; sort_order: number }[],
): T[] {
  const byEpisode = [...all].sort((a, b) => a.episode_no - b.episode_no);
  if (homeOrder.length === 0) return byEpisode;
  const byId = new Map(all.map((q) => [q.id, q]));
  const ordered: T[] = [];
  for (const item of [...homeOrder].sort((a, b) => a.sort_order - b.sort_order)) {
    const q = byId.get(item.media_id);
    if (q) {
      ordered.push(q);
      byId.delete(item.media_id);
    }
  }
  // playlist ที่มีสื่อที่ยังไม่เผยแพร่/ถูกกรองออก -> ได้ลิสต์สั้นกว่า ตามที่ผู้ดูแลจัด
  return ordered.length > 0 ? ordered : byEpisode;
}
