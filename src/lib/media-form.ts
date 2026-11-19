// สถานะของฟอร์มสื่อ + ตัวแปลงเป็นข้อมูลที่ส่ง API (ฟังก์ชันล้วน ทดสอบได้)
// ค่าทุกช่องเป็นข้อความเพื่อให้พิมพ์ง่าย แถวมี key คงที่ (ใช้เป็น React key / id ของช่อง / ติดตามตอนลากย้าย)
import { type FormIssue, type RowKeys, sortChaptersByTime } from "@/lib/form-helpers";
import { formatDuration, fromBangkokInputValue, parseDuration, toBangkokInputValue } from "@/lib/format";
import type { MediaAction } from "@/lib/validators";

export type ChapterRow = { key: string; time: string; title: string };
export type ChecklistRow = { id: string; text: string };
export type SourceRow = { key: string; label: string; url: string; checked_at: string };
export type ContactRow = { key: string; label: string; value: string; url: string };
export type ChoiceRow = { id: string; text: string };
export type QuizRow = {
  id: string;
  question: string;
  choices: ChoiceRow[];
  answer: string;
  explanation: string;
};

export type MediaFormInitial = {
  id?: string;
  episode_no: number | null;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  video_169_path: string | null;
  video_916_path: string | null;
  subtitle_path: string | null;
  cover_path: string | null;
  duration_sec: number | null;
  chapters: { time_sec: number; title: string }[];
  checklist: { id: string; text: string }[];
  quiz: {
    id: string;
    question: string;
    choices: { id: string; text: string }[];
    answer: string;
    explanation?: string | null;
  }[];
  sources: { label: string; url: string; checked_at?: string | null }[];
  contacts: { label: string; value: string; url?: string | null }[];
  status: "draft" | "scheduled" | "published";
  publish_at: string | null;
  unpublish_at: string | null;
};

export const EMPTY_MEDIA: MediaFormInitial = {
  episode_no: null,
  slug: "",
  title: "",
  description: "",
  category: "",
  video_169_path: null,
  video_916_path: null,
  subtitle_path: null,
  cover_path: null,
  duration_sec: null,
  chapters: [],
  checklist: [],
  quiz: [],
  sources: [],
  contacts: [],
  status: "draft",
  publish_at: null,
  unpublish_at: null,
};

export type FormState = {
  episodeNo: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  video169: string;
  video916: string;
  subtitle: string;
  cover: string;
  duration: string;
  chapters: ChapterRow[];
  checklist: ChecklistRow[];
  quiz: QuizRow[];
  sources: SourceRow[];
  contacts: ContactRow[];
  action: MediaAction;
  publishAt: string;
  unpublishAt: string;
};

/** รหัสสั้นสำหรับแถวใหม่ (ไม่พึ่ง crypto.randomUUID เพราะใช้ไม่ได้บนหน้า http ที่ไม่ใช่ localhost) */
export function newId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
}

export const CHOICE_IDS = ["a", "b", "c", "d"];

export function toFormState(initial: MediaFormInitial): FormState {
  return {
    episodeNo: initial.episode_no?.toString() ?? "",
    slug: initial.slug,
    title: initial.title,
    description: initial.description ?? "",
    category: initial.category,
    video169: initial.video_169_path ?? "",
    video916: initial.video_916_path ?? "",
    subtitle: initial.subtitle_path ?? "",
    cover: initial.cover_path ?? "",
    duration: initial.duration_sec != null ? formatDuration(initial.duration_sec) : "",
    chapters: initial.chapters.map((c) => ({ key: newId(), time: formatDuration(c.time_sec), title: c.title })),
    checklist: initial.checklist.map((c) => ({ id: c.id, text: c.text })),
    quiz: initial.quiz.map((q) => ({
      id: q.id,
      question: q.question,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      answer: q.answer,
      explanation: q.explanation ?? "",
    })),
    sources: initial.sources.map((s) => ({
      key: newId(),
      label: s.label,
      url: s.url,
      checked_at: s.checked_at ?? "",
    })),
    contacts: initial.contacts.map((c) => ({ key: newId(), label: c.label, value: c.value, url: c.url ?? "" })),
    action:
      initial.status === "published" ? "publish_now" : initial.status === "scheduled" ? "schedule" : "draft",
    publishAt: toBangkokInputValue(initial.publish_at),
    unpublishAt: toBangkokInputValue(initial.unpublish_at),
  };
}

/** ข้อความสรุปสถานะฟอร์มไว้เทียบว่ามีการแก้ไขหรือยัง (ไม่นับ key ของแถว เพราะสุ่มใหม่ทุกครั้ง) */
export function snapshot(f: FormState): string {
  return JSON.stringify(f, (k, v) => (k === "key" ? undefined : v));
}

export function newQuestion(): QuizRow {
  return {
    id: newId(),
    question: "",
    choices: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
    ],
    answer: "a",
    explanation: "",
  };
}

const blank = (s: string) => !s.trim();

export type BuiltPayload = {
  payload: Record<string, unknown>;
  rk: RowKeys;
  /** ข้อผิดพลาดที่ตรวจได้ฝั่งฟอร์ม (รูปแบบเวลา ฯลฯ) ก่อนส่งให้ Zod */
  issues: FormIssue[];
};

/**
 * แปลงสถานะฟอร์มเป็นข้อมูลที่ส่ง API
 * - แถวที่เว้นว่างทั้งแถวถูกตัดทิ้ง; บทเรียงตามเวลา
 * - rk = key ของแถวตามลำดับในข้อมูลที่ส่ง เพื่อแปลง index ของ Zod กลับเป็นแถวที่ผู้ใช้เห็น
 */
export function buildPayload(f: FormState, canPublish: boolean, now: Date = new Date()): BuiltPayload {
  const issues: FormIssue[] = [];

  const ep = blank(f.episodeNo) ? NaN : Number(f.episodeNo);

  let durationSec: number | null = null;
  if (!blank(f.duration)) {
    durationSec = parseDuration(f.duration);
    if (durationSec === null) issues.push({ key: "duration", message: "ความยาว: ใช้รูปแบบ นาที:วินาที เช่น 5:00" });
  }

  // บท: แถวไม่ว่าง -> แปลงเวลา -> เรียงตามเวลา
  const chapterRows = f.chapters.filter((c) => !blank(c.time) || !blank(c.title));
  const sortedChapters = sortChaptersByTime(chapterRows, parseDuration);
  const chapters = sortedChapters.map((c) => {
    const sec = parseDuration(c.time);
    if (sec === null) {
      issues.push({
        key: `chapters.${c.key}.time`,
        message: blank(c.time)
          ? "บท: กรุณากรอกเวลา เช่น 1:30"
          : `บท: เวลา "${c.time}" ไม่ถูกต้อง ใช้รูปแบบ นาที:วินาที เช่น 1:30`,
      });
    }
    return { time_sec: sec ?? Number.NaN, title: c.title };
  });

  const checklistRows = f.checklist.filter((c) => !blank(c.text));
  const quizRows = f.quiz.filter((q) => !blank(q.question) || q.choices.some((c) => !blank(c.text)));
  const sourceRows = f.sources.filter((s) => !blank(s.label) || !blank(s.url));
  const contactRows = f.contacts.filter((c) => !blank(c.label) || !blank(c.value) || !blank(c.url));

  const action: MediaAction = canPublish ? f.action : "draft";
  const publishAtIso = canPublish && action === "schedule" ? fromBangkokInputValue(f.publishAt) : null;
  const unpublishAtIso = canPublish && action !== "draft" ? fromBangkokInputValue(f.unpublishAt) : null;

  if (action === "schedule" && !publishAtIso) {
    issues.push({ key: "publish_at", message: "กรุณาระบุเวลาเริ่มเผยแพร่เมื่อเลือกตั้งเวลา" });
  }
  if (action !== "draft") {
    if (blank(f.video169) && blank(f.video916)) {
      issues.push({ key: "video", message: "ต้องมีไฟล์วิดีโออย่างน้อย 1 ไฟล์ก่อนเผยแพร่ (อัปโหลดในส่วน “ไฟล์”)" });
    }
    const start = action === "schedule" ? publishAtIso : now.toISOString();
    if (unpublishAtIso && start && new Date(unpublishAtIso) <= new Date(start)) {
      issues.push({ key: "unpublish_at", message: "เวลาหยุดเผยแพร่ต้องอยู่หลังเวลาเริ่มเผยแพร่" });
    }
  }

  const payload = {
    episode_no: ep,
    slug: f.slug,
    title: f.title,
    description: f.description,
    category: f.category,
    video_169_path: f.video169,
    video_916_path: f.video916,
    subtitle_path: f.subtitle,
    cover_path: f.cover,
    duration_sec: durationSec,
    chapters,
    checklist: checklistRows.map((c) => ({ id: c.id, text: c.text })),
    quiz: quizRows.map((q) => ({
      id: q.id,
      question: q.question,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
      answer: q.answer,
      explanation: q.explanation,
    })),
    sources: sourceRows.map((s) => ({ label: s.label, url: s.url, checked_at: s.checked_at || null })),
    contacts: contactRows.map((c) => ({ label: c.label, value: c.value, url: c.url || null })),
    // Teacher: ส่ง draft เสมอ (เซิร์ฟเวอร์บังคับซ้ำ)
    action,
    publish_at: publishAtIso,
    unpublish_at: unpublishAtIso,
  };

  const rk: RowKeys = {
    chapters: sortedChapters.map((c) => c.key),
    checklist: checklistRows.map((c) => c.id),
    quiz: quizRows.map((q) => ({ key: q.id, choices: q.choices.map((c) => c.id) })),
    sources: sourceRows.map((s) => s.key),
    contacts: contactRows.map((c) => c.key),
  };

  return { payload, rk, issues };
}
