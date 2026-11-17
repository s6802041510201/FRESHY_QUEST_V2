"use client";

// ฟอร์มเพิ่ม/แก้ไขสื่อ (F02)
// - เนื้อหาเสริม (บท, เช็กลิสต์, แบบฝึก, แหล่งข้อมูล, ช่องทางติดต่อ) เป็น "แถวที่กดเพิ่มได้" ผู้ใช้ไม่ต้องพิมพ์ JSON
// - แถวที่เว้นว่างทั้งแถวจะถูกตัดทิ้งตอนบันทึก
// - ส่วนเผยแพร่/ตั้งเวลาแสดงเฉพาะ Admin (Editor บันทึกได้แต่ฉบับร่าง) ฝั่งเซิร์ฟเวอร์และฐานข้อมูลบังคับซ้ำ
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  btnAccent,
  btnDangerText,
  btnSecondary,
  cardClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/ui/styles";
import {
  formatDuration,
  fromBangkokInputValue,
  parseDuration,
  toBangkokInputValue,
} from "@/lib/format";
import type { MediaAction } from "@/lib/validators";

// ---- ชนิดข้อมูลในฟอร์ม (ค่าทุกช่องเป็นข้อความเพื่อให้พิมพ์ง่าย) ----
type ChapterRow = { time: string; title: string };
type ChecklistRow = { id: string; text: string };
type SourceRow = { label: string; url: string; checked_at: string };
type ContactRow = { label: string; value: string; url: string };
type ChoiceRow = { id: string; text: string };
type QuizRow = {
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

const newId = () => crypto.randomUUID().slice(0, 8);
const CHOICE_IDS = ["a", "b", "c", "d"];

const smallBtn = btnSecondary;
const dangerBtn = btnDangerText;

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${cardClass} p-6`}>
      <div className="flex items-start gap-3">
        <span className="mt-1 h-6 w-1.5 shrink-0 rounded-full bg-orange" aria-hidden="true" />
        <div>
          <h2 className="text-lg">{title}</h2>
          {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function MediaForm({
  mode,
  initial,
  canPublish,
}: {
  mode: "create" | "edit";
  initial: MediaFormInitial;
  canPublish: boolean; // true = Admin
}) {
  const router = useRouter();

  const [episodeNo, setEpisodeNo] = useState(initial.episode_no?.toString() ?? "");
  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [category, setCategory] = useState(initial.category);

  const [video169, setVideo169] = useState(initial.video_169_path ?? "");
  const [video916, setVideo916] = useState(initial.video_916_path ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle_path ?? "");
  const [cover, setCover] = useState(initial.cover_path ?? "");
  const [duration, setDuration] = useState(
    initial.duration_sec != null ? formatDuration(initial.duration_sec) : "",
  );

  const [chapters, setChapters] = useState<ChapterRow[]>(
    initial.chapters.map((c) => ({ time: formatDuration(c.time_sec), title: c.title })),
  );
  const [checklist, setChecklist] = useState<ChecklistRow[]>(initial.checklist);
  const [quiz, setQuiz] = useState<QuizRow[]>(
    initial.quiz.map((q) => ({ ...q, explanation: q.explanation ?? "" })),
  );
  const [sources, setSources] = useState<SourceRow[]>(
    initial.sources.map((s) => ({ label: s.label, url: s.url, checked_at: s.checked_at ?? "" })),
  );
  const [contacts, setContacts] = useState<ContactRow[]>(
    initial.contacts.map((c) => ({ label: c.label, value: c.value, url: c.url ?? "" })),
  );

  const [action, setAction] = useState<MediaAction>(
    initial.status === "published"
      ? "publish_now"
      : initial.status === "scheduled"
        ? "schedule"
        : "draft",
  );
  const [publishAt, setPublishAt] = useState(toBangkokInputValue(initial.publish_at));
  const [unpublishAt, setUnpublishAt] = useState(toBangkokInputValue(initial.unpublish_at));

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- ตัวช่วยแก้ไขแถวใน array ----
  function updateAt<T>(list: T[], i: number, patch: Partial<T>): T[] {
    return list.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
  }
  const removeAt = <T,>(list: T[], i: number): T[] => list.filter((_, idx) => idx !== i);

  // ---- แบบฝึก ----
  function addQuestion() {
    if (quiz.length >= 3) return;
    setQuiz([
      ...quiz,
      {
        id: newId(),
        question: "",
        choices: [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
        ],
        answer: "a",
        explanation: "",
      },
    ]);
  }
  function addChoice(qi: number) {
    const q = quiz[qi];
    if (q.choices.length >= 4) return;
    const id = CHOICE_IDS.find((c) => !q.choices.some((x) => x.id === c)) ?? newId();
    setQuiz(updateAt(quiz, qi, { choices: [...q.choices, { id, text: "" }] }));
  }
  function removeChoice(qi: number, ci: number) {
    const q = quiz[qi];
    if (q.choices.length <= 3) return;
    const choices = removeAt(q.choices, ci);
    const answer = choices.some((c) => c.id === q.answer) ? q.answer : choices[0].id;
    setQuiz(updateAt(quiz, qi, { choices, answer }));
  }

  // ---- บันทึก ----
  async function save() {
    setError(null);

    const ep = Number(episodeNo);
    if (!episodeNo.trim() || !Number.isInteger(ep)) {
      setError("เลขด่าน: กรุณากรอกตัวเลข");
      return;
    }

    let durationSec: number | null = null;
    if (duration.trim()) {
      durationSec = parseDuration(duration);
      if (durationSec === null) {
        setError("ความยาว: ใช้รูปแบบ นาที:วินาที เช่น 5:00");
        return;
      }
    }

    const chapterRows = [];
    for (const c of chapters) {
      if (!c.time.trim() && !c.title.trim()) continue;
      const sec = parseDuration(c.time);
      if (sec === null) {
        setError(`บท: เวลา "${c.time}" ไม่ถูกต้อง ใช้รูปแบบ นาที:วินาที เช่น 1:30`);
        return;
      }
      chapterRows.push({ time_sec: sec, title: c.title });
    }
    chapterRows.sort((a, b) => a.time_sec - b.time_sec);

    const payload = {
      episode_no: ep,
      slug,
      title,
      description,
      category,
      video_169_path: video169,
      video_916_path: video916,
      subtitle_path: subtitle,
      cover_path: cover,
      duration_sec: durationSec,
      chapters: chapterRows,
      checklist: checklist
        .filter((c) => c.text.trim())
        .map((c) => ({ id: c.id, text: c.text })),
      quiz: quiz
        .filter((q) => q.question.trim() || q.choices.some((c) => c.text.trim()))
        .map((q) => ({
          id: q.id,
          question: q.question,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation,
        })),
      sources: sources
        .filter((s) => s.label.trim() || s.url.trim())
        .map((s) => ({ label: s.label, url: s.url, checked_at: s.checked_at || null })),
      contacts: contacts
        .filter((c) => c.label.trim() || c.value.trim())
        .map((c) => ({ label: c.label, value: c.value, url: c.url || null })),
      // Editor: ส่ง draft เสมอ (เซิร์ฟเวอร์บังคับซ้ำ)
      action: canPublish ? action : "draft",
      publish_at: canPublish && action === "schedule" ? fromBangkokInputValue(publishAt) : null,
      unpublish_at: canPublish && action !== "draft" ? fromBangkokInputValue(unpublishAt) : null,
    };

    if (canPublish && action === "schedule" && !payload.publish_at) {
      setError("กรุณาระบุเวลาเริ่มเผยแพร่เมื่อเลือกตั้งเวลา");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/media" : `/api/admin/media/${initial.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push("/admin/media");
      router.refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="max-w-3xl space-y-6"
      noValidate
    >
      {error ? (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red-strong">
          {error}
        </p>
      ) : null}

      {/* ข้อมูลหลัก */}
      <Section title="ข้อมูลหลัก">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="episode_no" className={labelClass}>
              เลขด่าน
            </label>
            <input
              id="episode_no"
              type="number"
              min={1}
              max={99}
              value={episodeNo}
              onChange={(e) => setEpisodeNo(e.target.value)}
              className={inputClass}
            />
            <p className={hintClass}>แสดงเป็น &ldquo;ด่าน N&rdquo; ห้ามซ้ำกับด่านอื่น</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="slug" className={labelClass}>
              Slug (ใช้ในลิงก์)
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="เช่น icit"
              className={inputClass}
            />
            <p className={hintClass}>ภาษาอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง ลิงก์จะเป็น /quest/ชื่อนี้</p>
          </div>
        </div>
        <div>
          <label htmlFor="title" className={labelClass}>
            ชื่อเรื่อง
          </label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            หมวดหมู่
          </label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="เช่น ระบบและบัญชี"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>
            คำอธิบาย
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
      </Section>

      {/* ไฟล์ */}
      <Section
        title="ไฟล์ (ชั่วคราว)"
        hint="ขั้นถัดไป (F03) จะเปลี่ยนเป็นปุ่มอัปโหลด ตอนนี้กรอกชื่อไฟล์ที่อยู่ในที่เก็บไฟล์แล้วได้ เช่น videos/EP01_ICIT_169_v1.mp4 หรือเว้นว่างไว้"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="v169" className={labelClass}>
              วิดีโอ 16:9
            </label>
            <input id="v169" value={video169} onChange={(e) => setVideo169(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="v916" className={labelClass}>
              วิดีโอ 9:16
            </label>
            <input id="v916" value={video916} onChange={(e) => setVideo916(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sub" className={labelClass}>
              ไฟล์ซับ (.vtt)
            </label>
            <input id="sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cover" className={labelClass}>
              ภาพปก
            </label>
            <input id="cover" value={cover} onChange={(e) => setCover(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="dur" className={labelClass}>
              ความยาววิดีโอ
            </label>
            <input
              id="dur"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="นาที:วินาที เช่น 5:00"
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      {/* บท */}
      <Section title="บท (Chapters)" hint="จุดกระโดดในวิดีโอ ระบบจะเรียงตามเวลาให้เอง">
        {chapters.map((c, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-28 shrink-0">
              <input
                aria-label={`บทที่ ${i + 1} เวลา`}
                value={c.time}
                onChange={(e) => setChapters(updateAt(chapters, i, { time: e.target.value }))}
                placeholder="0:35"
                className={inputClass}
              />
            </div>
            <input
              aria-label={`บทที่ ${i + 1} ชื่อบท`}
              value={c.title}
              onChange={(e) => setChapters(updateAt(chapters, i, { title: e.target.value }))}
              placeholder="ชื่อบท เช่น 3 บัญชีที่ต้องรู้"
              className={inputClass}
            />
            <button type="button" onClick={() => setChapters(removeAt(chapters, i))} className={dangerBtn}>
              ลบ
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setChapters([...chapters, { time: "", title: "" }])} className={smallBtn}>
          + เพิ่มบท
        </button>
      </Section>

      {/* เช็กลิสต์ */}
      <Section
        title="เช็กลิสต์ของด่าน"
        hint="รายการที่นักศึกษาติ๊กเมื่อทำเสร็จ หลังเผยแพร่แล้วไม่ควรลบหรือสลับข้อเดิม เพราะความคืบหน้าของนักศึกษาจำจากรหัสของแต่ละข้อ"
      >
        {checklist.map((c, i) => (
          <div key={c.id} className="flex gap-2">
            <input
              aria-label={`เช็กลิสต์ข้อ ${i + 1}`}
              value={c.text}
              onChange={(e) => setChecklist(updateAt(checklist, i, { text: e.target.value }))}
              placeholder="เช่น เปิดบัญชีที่ account.kmutnb.ac.th"
              className={inputClass}
            />
            <button type="button" onClick={() => setChecklist(removeAt(checklist, i))} className={dangerBtn}>
              ลบ
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setChecklist([...checklist, { id: newId(), text: "" }])}
          className={smallBtn}
        >
          + เพิ่มข้อ
        </button>
      </Section>

      {/* แบบฝึก */}
      <Section
        title="แบบฝึก"
        hint="สูงสุด 3 ข้อ ข้อละ 3–4 ตัวเลือก เลือกวงกลมหน้าตัวเลือกที่ถูก (นักศึกษาเห็นเฉลยได้ ไม่ใช่ข้อสอบวิจัย)"
      >
        {quiz.map((q, qi) => (
          <div key={q.id} className="space-y-3 rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center justify-between">
              <p className="font-heading text-navy">ข้อ {qi + 1}</p>
              <button type="button" onClick={() => setQuiz(removeAt(quiz, qi))} className={dangerBtn}>
                ลบข้อนี้
              </button>
            </div>
            <input
              aria-label={`คำถามข้อ ${qi + 1}`}
              value={q.question}
              onChange={(e) => setQuiz(updateAt(quiz, qi, { question: e.target.value }))}
              placeholder="คำถาม"
              className={inputClass}
            />
            {q.choices.map((c, ci) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`answer-${q.id}`}
                  checked={q.answer === c.id}
                  onChange={() => setQuiz(updateAt(quiz, qi, { answer: c.id }))}
                  aria-label={`ตั้งตัวเลือกที่ ${ci + 1} เป็นข้อที่ถูก`}
                  className="h-4 w-4 shrink-0 accent-navy"
                />
                <input
                  aria-label={`ข้อ ${qi + 1} ตัวเลือกที่ ${ci + 1}`}
                  value={c.text}
                  onChange={(e) =>
                    setQuiz(
                      updateAt(quiz, qi, {
                        choices: updateAt(q.choices, ci, { text: e.target.value }),
                      }),
                    )
                  }
                  placeholder={`ตัวเลือกที่ ${ci + 1}`}
                  className={inputClass}
                />
                {q.choices.length > 3 ? (
                  <button type="button" onClick={() => removeChoice(qi, ci)} className={dangerBtn}>
                    ลบ
                  </button>
                ) : null}
              </div>
            ))}
            {q.choices.length < 4 ? (
              <button type="button" onClick={() => addChoice(qi)} className={smallBtn}>
                + เพิ่มตัวเลือก
              </button>
            ) : null}
            <input
              aria-label={`คำอธิบายข้อ ${qi + 1}`}
              value={q.explanation}
              onChange={(e) => setQuiz(updateAt(quiz, qi, { explanation: e.target.value }))}
              placeholder="คำอธิบายเฉลย (ไม่บังคับ)"
              className={inputClass}
            />
          </div>
        ))}
        {quiz.length < 3 ? (
          <button type="button" onClick={addQuestion} className={smallBtn}>
            + เพิ่มคำถาม
          </button>
        ) : null}
      </Section>

      {/* แหล่งข้อมูล */}
      <Section title="แหล่งข้อมูลทางการ" hint="ลิงก์อ้างอิงที่ใช้ทำเนื้อหา พร้อมวันที่ตรวจล่าสุด">
        {sources.map((s, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_10rem_auto]">
            <input
              aria-label={`แหล่งข้อมูล ${i + 1} ชื่อ`}
              value={s.label}
              onChange={(e) => setSources(updateAt(sources, i, { label: e.target.value }))}
              placeholder="ชื่อ เช่น ICIT"
              className={inputClass}
            />
            <input
              aria-label={`แหล่งข้อมูล ${i + 1} ลิงก์`}
              value={s.url}
              onChange={(e) => setSources(updateAt(sources, i, { url: e.target.value }))}
              placeholder="https://..."
              className={inputClass}
            />
            <input
              aria-label={`แหล่งข้อมูล ${i + 1} วันที่ตรวจ`}
              type="date"
              value={s.checked_at}
              onChange={(e) => setSources(updateAt(sources, i, { checked_at: e.target.value }))}
              className={inputClass}
            />
            <button type="button" onClick={() => setSources(removeAt(sources, i))} className={dangerBtn}>
              ลบ
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSources([...sources, { label: "", url: "", checked_at: "" }])}
          className={smallBtn}
        >
          + เพิ่มแหล่งข้อมูล
        </button>
      </Section>

      {/* ช่องทางติดต่อ */}
      <Section title="ช่องทางติดต่อ" hint='แสดงในกล่อง "ติดต่อ" ของหน้าดูวิดีโอ'>
        {contacts.map((c, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              aria-label={`ช่องทางติดต่อ ${i + 1} ชื่อ`}
              value={c.label}
              onChange={(e) => setContacts(updateAt(contacts, i, { label: e.target.value }))}
              placeholder="ชื่อ เช่น ICIT Help Center"
              className={inputClass}
            />
            <input
              aria-label={`ช่องทางติดต่อ ${i + 1} ค่า`}
              value={c.value}
              onChange={(e) => setContacts(updateAt(contacts, i, { value: e.target.value }))}
              placeholder="เช่น LINE @icitkmutnb"
              className={inputClass}
            />
            <input
              aria-label={`ช่องทางติดต่อ ${i + 1} ลิงก์`}
              value={c.url}
              onChange={(e) => setContacts(updateAt(contacts, i, { url: e.target.value }))}
              placeholder="ลิงก์ (ไม่บังคับ)"
              className={inputClass}
            />
            <button type="button" onClick={() => setContacts(removeAt(contacts, i))} className={dangerBtn}>
              ลบ
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setContacts([...contacts, { label: "", value: "", url: "" }])}
          className={smallBtn}
        >
          + เพิ่มช่องทางติดต่อ
        </button>
      </Section>

      {/* การเผยแพร่ */}
      <Section title="การเผยแพร่">
        {canPublish ? (
          <>
            <div className="space-y-2">
              {(
                [
                  ["draft", "ฉบับร่าง (นักศึกษายังมองไม่เห็น)"],
                  ["publish_now", "เผยแพร่ทันที"],
                  ["schedule", "ตั้งเวลาเผยแพร่"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="action"
                    checked={action === value}
                    onChange={() => setAction(value)}
                    className="h-4 w-4 accent-navy"
                  />
                  {label}
                </label>
              ))}
            </div>
            {action === "schedule" ? (
              <div>
                <label htmlFor="publish_at" className={labelClass}>
                  เริ่มเผยแพร่ (เวลาไทย)
                </label>
                <input
                  id="publish_at"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
            {action !== "draft" ? (
              <div>
                <label htmlFor="unpublish_at" className={labelClass}>
                  หยุดเผยแพร่ (ไม่บังคับ เว้นว่าง = เผยแพร่ตลอด)
                </label>
                <input
                  id="unpublish_at"
                  type="datetime-local"
                  value={unpublishAt}
                  onChange={(e) => setUnpublishAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            บัญชี Editor บันทึกได้เฉพาะฉบับร่าง เมื่อพร้อมเผยแพร่ ให้ผู้ดูแลระบบ (Admin) ตรวจและเผยแพร่
          </p>
        )}
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-line">
        <button type="submit" disabled={saving} className={btnAccent}>
          {saving ? "กำลังบันทึก..." : mode === "create" ? "บันทึกสื่อ" : "บันทึกการแก้ไข"}
        </button>
        <Link href="/admin/media" className={btnSecondary}>
          ยกเลิก
        </Link>
        <p className="text-xs text-muted">แถวที่เว้นว่างทั้งแถวจะไม่ถูกบันทึก</p>
      </div>
    </form>
  );
}
