// ฟังก์ชันล้วนสำหรับฟอร์มสื่อ (ทดสอบได้): จับคู่ error ของ Zod กับช่องในฟอร์ม และจัดลำดับแถว

export type FormIssue = { key: string; message: string };

/** key ของแถวในฟอร์ม เรียงตาม "ลำดับในข้อมูลที่ส่ง" (หลังตัดแถวว่างทิ้งแล้ว) ใช้แปลง index ของ Zod กลับเป็นแถวที่ผู้ใช้เห็น */
export type RowKeys = {
  chapters: string[];
  checklist: string[];
  quiz: { key: string; choices: string[] }[];
  sources: string[];
  contacts: string[];
};

/**
 * แปลง path ของ issue จาก Zod เป็น key ของช่องในฟอร์ม (ใช้เป็น id="f-<key>")
 * ตัวอย่าง: ["chapters",1,"title"] -> "chapters.<key แถวที่ 2>.title"
 */
export function issueKey(path: ReadonlyArray<PropertyKey>, rk: RowKeys): string {
  const p0 = String(path[0] ?? "form");
  const i = typeof path[1] === "number" ? path[1] : null;
  const p2 = path[2] === undefined ? null : String(path[2]);

  switch (p0) {
    case "duration_sec":
      return "duration";
    case "chapters": {
      const k = i === null ? undefined : rk.chapters[i];
      if (k === undefined) return "chapters";
      return `chapters.${k}.${p2 === "time_sec" ? "time" : "title"}`;
    }
    case "checklist": {
      const k = i === null ? undefined : rk.checklist[i];
      return k === undefined ? "checklist" : `checklist.${k}.text`;
    }
    case "quiz": {
      const q = i === null ? undefined : rk.quiz[i];
      if (!q) return "quiz";
      if (p2 === "question") return `quiz.${q.key}.question`;
      if (p2 === "explanation") return `quiz.${q.key}.explanation`;
      if (p2 === "choices") {
        const j = typeof path[3] === "number" ? path[3] : null;
        const c = j === null ? undefined : q.choices[j];
        return c === undefined ? `quiz.${q.key}.choices` : `quiz.${q.key}.choice.${c}`;
      }
      return `quiz.${q.key}.answer`; // answer และ refine ระดับข้อ
    }
    case "sources":
    case "contacts": {
      const list = p0 === "sources" ? rk.sources : rk.contacts;
      const k = i === null ? undefined : list[i];
      return k === undefined || p2 === null ? p0 : `${p0}.${k}.${p2}`;
    }
    default:
      return p0;
  }
}

/** คงข้อความแรกของแต่ละช่อง (ช่องเดียวอาจมีหลาย issue) */
export function dedupeIssues(issues: FormIssue[]): FormIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => (seen.has(i.key) ? false : (seen.add(i.key), true)));
}

/** ย้ายสมาชิกจากตำแหน่ง from ไป to คืนอาร์เรย์ใหม่ (ไม่แก้ของเดิม) นอกช่วง/ตำแหน่งเดิม = คืนอาร์เรย์เดิม */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** เรียงแถวบทตามเวลา แถวที่เวลายังไม่ถูกต้อง (หรือว่าง) ไปอยู่ท้าย โดยคงลำดับเดิมระหว่างกัน */
export function sortChaptersByTime<T extends { time: string }>(
  rows: T[],
  parse: (s: string) => number | null,
): T[] {
  const withIdx = rows.map((r, i) => ({ r, i, t: parse(r.time) }));
  withIdx.sort((a, b) => {
    if (a.t === null && b.t === null) return a.i - b.i;
    if (a.t === null) return 1;
    if (b.t === null) return -1;
    return a.t - b.t || a.i - b.i;
  });
  return withIdx.map((x) => x.r);
}
