// ความคืบหน้าของนักศึกษา เก็บในเครื่อง (localStorage) ไม่ต้องล็อกอิน ไม่ส่งขึ้นเซิร์ฟเวอร์
// คีย์ด้วย id ของสื่อ (ไม่ใช่ slug) เพื่อให้เปลี่ยน slug ภายหลังแล้วความคืบหน้ายังอยู่
// ไฟล์นี้เป็นฟังก์ชันล้วน (ไม่แตะเบราว์เซอร์) เพื่อทดสอบได้ ส่วนที่แตะ localStorage อยู่ใน use-progress.ts

export const PROGRESS_KEY = "freshy-quest:progress:v1";

export type QuizResult = { answers: Record<string, string>; score: number; total: number };

/** จุดที่หยุดดู: sec = วินาทีในวิดีโอ, at = เวลาที่บันทึก (ms) ใช้หาว่า "ดูล่าสุด" คือด่านไหน */
export type Position = { sec: number; at: number };

export type Progress = {
  v: 1;
  watched: Record<string, true>; // mediaId -> ดูแล้ว
  checklist: Record<string, string[]>; // mediaId -> id ข้อที่ติ๊กแล้ว
  quiz: Record<string, QuizResult>; // mediaId -> ผลล่าสุด
  position: Record<string, Position>; // mediaId -> จุดที่หยุดดู (ข้อมูลเก่าที่ไม่มีฟิลด์นี้ยังอ่านได้)
};

export const EMPTY_PROGRESS: Progress = { v: 1, watched: {}, checklist: {}, quiz: {}, position: {} };

/** เวลาปัจจุบัน (ms) แยกเป็นฟังก์ชันเพื่อให้ component ไม่เรียกฟังก์ชันที่ไม่บริสุทธิ์ตรง ๆ ตอน render */
export const nowMs = (): number => Date.now();

/** ต้องดูเกินกี่วินาทีถึงจะจำจุดที่หยุด (กันจำตอนเพิ่งกดเล่น) */
export const MIN_RESUME_SEC = 3;
/** เหลือเวลาน้อยกว่านี้ถือว่าดูจบแล้ว ไม่เสนอให้ดูต่อ */
export const END_MARGIN_SEC = 10;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** อ่านค่าจากข้อความที่เก็บไว้ ถ้าเสีย/ไม่ตรงรูปแบบ ให้เริ่มใหม่ (ไม่ทำให้หน้าพัง) */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1) return EMPTY_PROGRESS;
    const watched: Progress["watched"] = {};
    if (isRecord(data.watched)) {
      for (const [k, v] of Object.entries(data.watched)) if (v === true) watched[k] = true;
    }
    const checklist: Progress["checklist"] = {};
    if (isRecord(data.checklist)) {
      for (const [k, v] of Object.entries(data.checklist)) {
        if (Array.isArray(v)) checklist[k] = v.filter((x): x is string => typeof x === "string");
      }
    }
    const quiz: Progress["quiz"] = {};
    if (isRecord(data.quiz)) {
      for (const [k, v] of Object.entries(data.quiz)) {
        if (!isRecord(v) || !isRecord(v.answers)) continue;
        const answers: Record<string, string> = {};
        for (const [qid, a] of Object.entries(v.answers)) if (typeof a === "string") answers[qid] = a;
        const score = typeof v.score === "number" ? v.score : 0;
        const total = typeof v.total === "number" ? v.total : 0;
        quiz[k] = { answers, score, total };
      }
    }
    const position: Progress["position"] = {};
    if (isRecord(data.position)) {
      for (const [k, v] of Object.entries(data.position)) {
        if (!isRecord(v)) continue;
        const sec = v.sec;
        const at = v.at;
        if (typeof sec === "number" && Number.isFinite(sec) && sec >= 0 && typeof at === "number" && Number.isFinite(at)) {
          position[k] = { sec: Math.floor(sec), at };
        }
      }
    }
    return { v: 1, watched, checklist, quiz, position };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function markWatched(p: Progress, mediaId: string): Progress {
  if (p.watched[mediaId]) return p;
  return { ...p, watched: { ...p.watched, [mediaId]: true } };
}

export function toggleChecklistItem(p: Progress, mediaId: string, itemId: string): Progress {
  const cur = p.checklist[mediaId] ?? [];
  const next = cur.includes(itemId) ? cur.filter((x) => x !== itemId) : [...cur, itemId];
  return { ...p, checklist: { ...p.checklist, [mediaId]: next } };
}

export function saveQuizResult(p: Progress, mediaId: string, result: QuizResult): Progress {
  return { ...p, quiz: { ...p.quiz, [mediaId]: result } };
}

export function clearQuizResult(p: Progress, mediaId: string): Progress {
  if (!p.quiz[mediaId]) return p;
  const quiz = { ...p.quiz };
  delete quiz[mediaId];
  return { ...p, quiz };
}

/** จำจุดที่หยุดดู: ข้ามถ้าดูไม่ถึง MIN_RESUME_SEC หรือวินาทีเดิม (ลดการเขียนซ้ำ) */
export function savePosition(p: Progress, mediaId: string, sec: number, at: number = nowMs()): Progress {
  if (!Number.isFinite(sec) || sec < MIN_RESUME_SEC) return p;
  const s = Math.floor(sec);
  if (p.position[mediaId]?.sec === s) return p;
  return { ...p, position: { ...p.position, [mediaId]: { sec: s, at } } };
}

export function clearPosition(p: Progress, mediaId: string): Progress {
  if (!p.position[mediaId]) return p;
  const position = { ...p.position };
  delete position[mediaId];
  return { ...p, position };
}

/** วินาทีที่ควรเริ่มดูต่อ หรือ null ถ้าไม่มี/ใกล้จบแล้ว (durationSec ที่ไม่รู้ = ไม่ตรวจท้ายคลิป) */
export function resumeTarget(p: Progress, mediaId: string, durationSec?: number | null): number | null {
  const pos = p.position[mediaId];
  if (!pos || pos.sec < MIN_RESUME_SEC) return null;
  if (durationSec && durationSec > 0 && pos.sec >= durationSec - END_MARGIN_SEC) return null;
  return pos.sec;
}

/** ด่านที่ดูค้างไว้ล่าสุด (บันทึกจุดหยุดล่าสุด) เฉพาะด่านที่ยังเผยแพร่ ยังไม่ผ่าน และมีจุดให้ดูต่อ */
export function latestResume<T extends { id: string; duration_sec?: number | null }>(
  p: Progress,
  ordered: T[],
): { quest: T; sec: number } | null {
  let best: { quest: T; sec: number; at: number } | null = null;
  for (const q of ordered) {
    if (p.watched[q.id]) continue;
    const sec = resumeTarget(p, q.id, q.duration_sec);
    if (sec === null) continue;
    const at = p.position[q.id].at;
    if (!best || at > best.at) best = { quest: q, sec, at };
  }
  return best ? { quest: best.quest, sec: best.sec } : null;
}

/** จำนวนด่านที่ดูแล้ว นับเฉพาะด่านที่ยังเผยแพร่อยู่จริง (ด่านที่ถูกถอดออกไม่ถูกนับ) */
export function countWatched(p: Progress, liveIds: string[]): number {
  return liveIds.filter((id) => p.watched[id]).length;
}

/** จำนวนข้อเช็กลิสต์ที่ติ๊กแล้ว นับเฉพาะ id ที่ยังมีอยู่ในด่าน (กันตัวเลขเกินเมื่อผู้ดูแลลบข้อทิ้ง) */
export function countChecked(p: Progress, mediaId: string, itemIds: string[]): number {
  const checked = new Set(p.checklist[mediaId] ?? []);
  return itemIds.filter((id) => checked.has(id)).length;
}

/** ด่านถัดไปที่ยังไม่ดู (ตามลำดับที่ส่งมา) ถ้าดูครบแล้วคืน null */
export function nextUnwatched<T extends { id: string }>(p: Progress, ordered: T[]): T | null {
  return ordered.find((q) => !p.watched[q.id]) ?? null;
}

/** ตรวจคำตอบ: answers = { questionId: choiceId } */
export function gradeQuiz(
  questions: { id: string; answer: string }[],
  answers: Record<string, string>,
): QuizResult {
  let score = 0;
  for (const q of questions) if (answers[q.id] === q.answer) score++;
  return { answers, score, total: questions.length };
}
