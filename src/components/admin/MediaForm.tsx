"use client";

// ฟอร์มเพิ่ม/แก้ไขสื่อ (F02 + ปรับ UX)
// - เนื้อหาเสริม (บท, เช็กลิสต์, แบบฝึก, แหล่งข้อมูล, ช่องทางติดต่อ) เป็น "แถวที่กดเพิ่ม/ลบ/ลากจัดลำดับได้" ไม่ต้องพิมพ์ JSON
// - ตรวจข้อมูลในฟอร์มก่อนส่ง: ขึ้นข้อความใต้ช่องที่ผิด + สรุปด้านบน (กดแล้วกระโดดไปช่องนั้น)
// - เตือนก่อนออกจากหน้าเมื่อมีการแก้ไขที่ยังไม่บันทึก (ครอบคลุมลิงก์ภายในเว็บ ปิด/รีเฟรชแท็บ; ปุ่มย้อนกลับของเบราว์เซอร์ยังไม่ครอบคลุม)
// - ส่วนเผยแพร่/ตั้งเวลาแสดงเฉพาะ Admin (Teacher บันทึกได้แต่ฉบับร่าง) ฝั่งเซิร์ฟเวอร์และฐานข้อมูลบังคับซ้ำ
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderList from "@/components/admin/ReorderList";
import { useToast } from "@/components/admin/ToastProvider";
import UploadField from "@/components/admin/UploadField";
import {
  btnDangerText,
  btnPrimary,
  btnSecondary,
  btnSmall,
  cardClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/ui/styles";
import { dedupeIssues, type FormIssue, issueKey, sortChaptersByTime } from "@/lib/form-helpers";
import { formatDuration, parseDuration } from "@/lib/format";
import {
  buildPayload,
  CHOICE_IDS,
  type FormState,
  type MediaFormInitial,
  newId,
  newQuestion,
  snapshot,
  toFormState,
} from "@/lib/media-form";
import { mediaInputSchema } from "@/lib/validators";

export { EMPTY_MEDIA } from "@/lib/media-form";
export type { MediaFormInitial } from "@/lib/media-form";

const smallBtn = btnSmall;
const dangerBtn = btnDangerText;

// ลำดับส่วนของฟอร์ม (ใช้ทำเลขกำกับและสารบัญด้านข้าง) ต้องตรงกับ id ของ <Section> ด้านล่าง
const FORM_SECTIONS = [
  { id: "sec-main", title: "ข้อมูลหลัก" },
  { id: "sec-files", title: "ไฟล์" },
  { id: "sec-chapters", title: "บท (Chapters)" },
  { id: "sec-checklist", title: "เช็กลิสต์ของด่าน" },
  { id: "sec-quiz", title: "แบบฝึก" },
  { id: "sec-sources", title: "แหล่งข้อมูลทางการ" },
  { id: "sec-contacts", title: "ช่องทางติดต่อ" },
  { id: "sec-publish", title: "การเผยแพร่" },
] as const;

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const no = FORM_SECTIONS.findIndex((x) => x.id === id) + 1;
  return (
    <section className={`${cardClass} p-6 md:p-7`} aria-labelledby={`${id}-title`}>
      <div className="flex items-start gap-4 border-b border-line pb-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-semibold text-white"
        >
          {no}
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-xl">
            {title}
          </h2>
          {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
        </div>
      </div>
      <div id={id} tabIndex={-1} className="mt-5 scroll-mt-28 space-y-5 outline-none">
        {children}
      </div>
    </section>
  );
}

// key ที่ไม่มีช่องกรอกของตัวเอง (หรือช่องถูกซ่อน) ให้กระโดดไปที่ส่วนของมันแทน
function sectionFor(key: string): string | null {
  const head = key.split(".")[0];
  switch (head) {
    case "video":
    case "video_169_path":
    case "video_916_path":
    case "subtitle_path":
    case "cover_path":
    case "duration":
      return "sec-files";
    case "chapters":
    case "checklist":
    case "quiz":
    case "sources":
    case "contacts":
      return `sec-${head}`;
    case "publish_at":
    case "unpublish_at":
    case "action":
      return "sec-publish";
    default:
      return null;
  }
}

function mapRows<T>(rows: T[], match: (r: T) => boolean, patch: Partial<T>): T[] {
  return rows.map((r) => (match(r) ? { ...r, ...patch } : r));
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
  const { toast } = useToast();

  const [f, setF] = useState<FormState>(() => toFormState(initial));
  const [baseSnap] = useState(() => snapshot(toFormState(initial)));
  const dirty = snapshot(f) !== baseSnap;

  const [issues, setIssues] = useState<FormIssue[]>([]);
  const errors = useMemo(() => Object.fromEntries(issues.map((i) => [i.key, i.message])), [issues]);
  const [saving, setSaving] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  const summaryRef = useRef<HTMLDivElement>(null);
  const focusSummaryRef = useRef(false);
  const focusNextRef = useRef<string | null>(null);
  const allowLeaveRef = useRef(false);

  // หลัง render: โฟกัสสรุปข้อผิดพลาด หรือช่องแรกของแถวที่เพิ่งเพิ่ม
  useEffect(() => {
    if (focusSummaryRef.current && summaryRef.current) {
      focusSummaryRef.current = false;
      summaryRef.current.focus();
      summaryRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    if (focusNextRef.current) {
      document.getElementById(focusNextRef.current)?.focus();
      focusNextRef.current = null;
    }
  });

  // เตือนก่อนออกจากหน้าเมื่อมีการแก้ไขที่ยังไม่บันทึก
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // ลิงก์ภายในเว็บ (เมนูข้าง ปุ่มยกเลิก ฯลฯ) ดักตั้งแต่ขั้น capture ก่อน Next.js พาไปหน้าอื่น
    const onClick = (e: MouseEvent) => {
      if (allowLeaveRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  // ---- ตัวช่วยอัปเดตสถานะ + ล้างข้อผิดพลาดของช่องที่กำลังแก้ ----
  const set = (patch: Partial<FormState>, ...clear: string[]) => {
    setF((s) => ({ ...s, ...patch }));
    if (clear.length) {
      setIssues((list) => (list.some((i) => clear.includes(i.key)) ? list.filter((i) => !clear.includes(i.key)) : list));
    }
  };
  const clearKeys = (...keys: string[]) =>
    setIssues((list) => (list.some((i) => keys.includes(i.key)) ? list.filter((i) => !keys.includes(i.key)) : list));

  // ---- ช่องกรอกที่มีข้อผิดพลาด: id / aria / กรอบแดง / ข้อความใต้ช่อง ----
  const fp = (k: string) => ({
    id: `f-${k}`,
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `f-${k}-err` : undefined,
  });
  const ic = (k: string) => (errors[k] ? `${inputClass} !border-red-strong ring-1 ring-red-strong` : inputClass);
  const err = (k: string) =>
    errors[k] ? (
      <p id={`f-${k}-err`} className="mt-1.5 text-sm text-red-strong">
        {errors[k]}
      </p>
    ) : null;

  function goTo(key: string) {
    const el = document.getElementById(`f-${key}`) ?? (() => {
      const sec = sectionFor(key);
      return sec ? document.getElementById(sec) : null;
    })();
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }

  function showIssues(list: FormIssue[], focus = true) {
    // เรียงตามตำแหน่งในหน้า (บนลงล่าง) ช่องที่หาไม่เจอคงลำดับเดิม
    const pos = (k: string) => document.getElementById(`f-${k}`) ?? document.getElementById(sectionFor(k) ?? "");
    const sorted = [...list].sort((a, b) => {
      const ea = pos(a.key);
      const eb = pos(b.key);
      if (!ea || !eb || ea === eb) return 0;
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    setIssues(sorted);
    focusSummaryRef.current = focus;
  }

  // ---- บท ----
  const chaptersSorted =
    f.chapters.length < 2 ||
    sortChaptersByTime(f.chapters, parseDuration).every((c, i) => c.key === f.chapters[i].key);

  function addChapter() {
    const key = newId();
    focusNextRef.current = `f-chapters.${key}.time`;
    set({ chapters: [...f.chapters, { key, time: "", title: "" }] });
  }

  // ---- เช็กลิสต์ ----
  function addChecklist() {
    const id = newId();
    focusNextRef.current = `f-checklist.${id}.text`;
    set({ checklist: [...f.checklist, { id, text: "" }] });
  }

  // ---- แบบฝึก ----
  function addQuestion() {
    if (f.quiz.length >= 3) return;
    const q = newQuestion();
    focusNextRef.current = `f-quiz.${q.id}.question`;
    set({ quiz: [...f.quiz, q] });
  }
  function addChoice(qid: string) {
    set({
      quiz: f.quiz.map((q) => {
        if (q.id !== qid || q.choices.length >= 4) return q;
        const id = CHOICE_IDS.find((c) => !q.choices.some((x) => x.id === c)) ?? newId();
        focusNextRef.current = `f-quiz.${qid}.choice.${id}`;
        return { ...q, choices: [...q.choices, { id, text: "" }] };
      }),
    });
  }
  function removeChoice(qid: string, cid: string) {
    set({
      quiz: f.quiz.map((q) => {
        if (q.id !== qid || q.choices.length <= 3) return q;
        const choices = q.choices.filter((c) => c.id !== cid);
        const answer = choices.some((c) => c.id === q.answer) ? q.answer : choices[0].id;
        return { ...q, choices, answer };
      }),
    });
  }

  // ---- แหล่งข้อมูล / ช่องทางติดต่อ ----
  function addSource() {
    const key = newId();
    focusNextRef.current = `f-sources.${key}.label`;
    set({ sources: [...f.sources, { key, label: "", url: "", checked_at: "" }] });
  }
  function addContact() {
    const key = newId();
    focusNextRef.current = `f-contacts.${key}.label`;
    set({ contacts: [...f.contacts, { key, label: "", value: "", url: "" }] });
  }

  // ---- บันทึก ----
  const episodeNoNumber = /^\d+$/.test(f.episodeNo.trim()) ? Number(f.episodeNo) : null;

  // เติมความยาวจากไฟล์วิดีโอที่เพิ่งอัปโหลด
  function fillDuration(meta: { durationSec: number }) {
    set({ duration: formatDuration(meta.durationSec) }, "duration");
  }

  async function save() {
    if (saving) return;
    const { payload, rk, issues: clientIssues } = buildPayload(f, canPublish);
    const parsed = mediaInputSchema.safeParse(payload);
    const zodIssues: FormIssue[] = parsed.success
      ? []
      : parsed.error.issues.map((i) => ({ key: issueKey(i.path, rk), message: i.message }));
    const all = dedupeIssues([...clientIssues, ...zodIssues]);
    if (all.length > 0) {
      showIssues(all);
      return;
    }

    setIssues([]);
    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/admin/media" : `/api/admin/media/${initial.id}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      if (!res.ok) {
        const message = data.error ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่";
        showIssues([{ key: data.field ?? "form", message }]);
        toast(message, "error");
        return;
      }
      allowLeaveRef.current = true; // บันทึกแล้ว ไม่ต้องเตือนตอนพากลับรายการ
      toast(mode === "create" ? "เพิ่มสื่อแล้ว" : "บันทึกการแก้ไขแล้ว");
      router.push("/admin/media");
      router.refresh();
    } catch {
      const message = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่";
      showIssues([{ key: "form", message }]);
      toast(message, "error");
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
      className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start"
      noValidate
    >
      <nav aria-label="ส่วนของฟอร์ม" className="hidden lg:sticky lg:top-6 lg:block">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted">ส่วนของฟอร์ม</p>
        <ol className="space-y-0.5 border-l border-line">
          {FORM_SECTIONS.map((x, i) => (
            <li key={x.id}>
              <a
                href={`#${x.id}`}
                className="-ml-px flex min-h-10 items-center gap-2 border-l-2 border-transparent py-1 pl-3 text-sm text-muted transition-colors hover:border-navy hover:text-navy"
              >
                <span className="tabular w-4 text-xs">{i + 1}</span>
                {x.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="min-w-0 max-w-3xl space-y-6">
      {issues.length > 0 ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-red-strong/40 bg-red/10 p-5 outline-none"
        >
          <p className="font-semibold text-red-strong">
            {issues.length === 1 ? "มี 1 จุดที่ต้องแก้" : `มี ${issues.length} จุดที่ต้องแก้ก่อนบันทึก`}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {issues.slice(0, 8).map((i) => (
              <li key={i.key}>
                {i.key === "form" ? (
                  i.message
                ) : (
                  <a
                    href={`#f-${i.key}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(i.key);
                    }}
                    className="font-medium text-red-strong underline underline-offset-2"
                  >
                    {i.message}
                  </a>
                )}
              </li>
            ))}
          </ul>
          {issues.length > 8 ? <p className="mt-2 text-sm text-ink">และอีก {issues.length - 8} จุด</p> : null}
        </div>
      ) : null}

      {/* ข้อมูลหลัก */}
      <Section id="sec-main" title="ข้อมูลหลัก">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="f-episode_no" className={labelClass}>
              เลขด่าน
            </label>
            <input
              {...fp("episode_no")}
              type="number"
              min={1}
              max={99}
              value={f.episodeNo}
              onChange={(e) => set({ episodeNo: e.target.value }, "episode_no")}
              className={ic("episode_no")}
            />
            {err("episode_no")}
            <p className={hintClass}>แสดงเป็น &ldquo;ด่าน N&rdquo; ห้ามซ้ำกับด่านอื่น</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="f-slug" className={labelClass}>
              Slug (ใช้ในลิงก์)
            </label>
            <input
              {...fp("slug")}
              value={f.slug}
              onChange={(e) => set({ slug: e.target.value.toLowerCase() }, "slug")}
              placeholder="เช่น icit"
              className={ic("slug")}
            />
            {err("slug")}
            <p className={hintClass}>ภาษาอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง ลิงก์จะเป็น /quest/ชื่อนี้</p>
          </div>
        </div>
        <div>
          <label htmlFor="f-title" className={labelClass}>
            ชื่อเรื่อง
          </label>
          <input
            {...fp("title")}
            value={f.title}
            onChange={(e) => set({ title: e.target.value }, "title")}
            className={ic("title")}
          />
          {err("title")}
        </div>
        <div>
          <label htmlFor="f-category" className={labelClass}>
            หมวดหมู่
          </label>
          <input
            {...fp("category")}
            value={f.category}
            onChange={(e) => set({ category: e.target.value }, "category")}
            placeholder="เช่น ระบบและบัญชี"
            className={ic("category")}
          />
          {err("category")}
        </div>
        <div>
          <label htmlFor="f-description" className={labelClass}>
            คำอธิบาย
          </label>
          <textarea
            {...fp("description")}
            rows={3}
            value={f.description}
            onChange={(e) => set({ description: e.target.value }, "description")}
            className={ic("description")}
          />
          {err("description")}
        </div>
      </Section>

      {/* ไฟล์ */}
      <Section
        id="sec-files"
        title="ไฟล์"
        hint="อัปโหลดตรงจากหน้านี้ ต้องกรอกเลขด่านและ Slug ก่อน ระบบใช้ตั้งชื่อไฟล์ให้อัตโนมัติ (เช่น videos/EP01_icit_169_v1.mp4) ไฟล์ใหม่จะได้เลขเวอร์ชันเพิ่มขึ้นเสมอ ไม่เขียนทับไฟล์เดิม"
      >
        {err("video") ? (
          <p id="f-video-err" className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red-strong">
            {errors.video}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <UploadField
            kind="video169"
            value={f.video169}
            onChange={(v) => set({ video169: v }, "video")}
            episodeNo={episodeNoNumber}
            slug={f.slug}
            onVideoMeta={fillDuration}
          />
          <UploadField
            kind="video916"
            value={f.video916}
            onChange={(v) => set({ video916: v }, "video")}
            episodeNo={episodeNoNumber}
            slug={f.slug}
            onVideoMeta={fillDuration}
          />
          <UploadField
            kind="subtitle"
            value={f.subtitle}
            onChange={(v) => set({ subtitle: v })}
            episodeNo={episodeNoNumber}
            slug={f.slug}
          />
          <UploadField
            kind="cover"
            value={f.cover}
            onChange={(v) => set({ cover: v })}
            episodeNo={episodeNoNumber}
            slug={f.slug}
          />
        </div>
        <div className="max-w-xs">
          <label htmlFor="f-duration" className={labelClass}>
            ความยาววิดีโอ
          </label>
          <input
            {...fp("duration")}
            value={f.duration}
            onChange={(e) => set({ duration: e.target.value }, "duration")}
            placeholder="นาที:วินาที เช่น 5:00"
            className={ic("duration")}
          />
          {err("duration")}
          <p className={hintClass}>เติมให้อัตโนมัติเมื่ออัปโหลดวิดีโอ แก้เองได้</p>
        </div>
      </Section>

      {/* บท */}
      <Section
        id="sec-chapters"
        title="บท (Chapters)"
        hint="จุดกระโดดในวิดีโอ ระบบเรียงตามเวลาให้ตอนบันทึก (ไม่ต้องลากจัดลำดับ) หรือกด “เรียงตามเวลา” เพื่อดูผลก่อน"
      >
        {err("chapters")}
        {f.chapters.map((c, i) => (
          <div key={c.key}>
            <div className="flex gap-2">
              <div className="w-28 shrink-0">
                <input
                  {...fp(`chapters.${c.key}.time`)}
                  aria-label={`บทที่ ${i + 1} เวลา`}
                  value={c.time}
                  onChange={(e) =>
                    set(
                      { chapters: mapRows(f.chapters, (r) => r.key === c.key, { time: e.target.value }) },
                      `chapters.${c.key}.time`,
                    )
                  }
                  placeholder="0:35"
                  className={ic(`chapters.${c.key}.time`)}
                />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  {...fp(`chapters.${c.key}.title`)}
                  aria-label={`บทที่ ${i + 1} ชื่อบท`}
                  value={c.title}
                  onChange={(e) =>
                    set(
                      { chapters: mapRows(f.chapters, (r) => r.key === c.key, { title: e.target.value }) },
                      `chapters.${c.key}.title`,
                    )
                  }
                  placeholder="ชื่อบท เช่น 3 บัญชีที่ต้องรู้"
                  className={ic(`chapters.${c.key}.title`)}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  clearKeys(`chapters.${c.key}.time`, `chapters.${c.key}.title`);
                  set({ chapters: f.chapters.filter((r) => r.key !== c.key) });
                }}
                aria-label={`ลบบทที่ ${i + 1}`}
                className={dangerBtn}
              >
                ลบ
              </button>
            </div>
            <div className="flex gap-2">
              <div className="w-28 shrink-0">{err(`chapters.${c.key}.time`)}</div>
              <div className="min-w-0 flex-1">{err(`chapters.${c.key}.title`)}</div>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addChapter} className={smallBtn}>
            + เพิ่มบท
          </button>
          {f.chapters.length >= 2 ? (
            <button
              type="button"
              disabled={chaptersSorted}
              onClick={() => {
                set({ chapters: sortChaptersByTime(f.chapters, parseDuration) });
                toast("เรียงบทตามเวลาแล้ว", "info");
              }}
              className={smallBtn}
            >
              {chaptersSorted ? "เรียงตามเวลาแล้ว" : "เรียงตามเวลา"}
            </button>
          ) : null}
        </div>
      </Section>

      {/* เช็กลิสต์ */}
      <Section
        id="sec-checklist"
        title="เช็กลิสต์ของด่าน"
        hint="รายการที่นักศึกษาติ๊กเมื่อทำเสร็จ ลากหรือกดลูกศรเพื่อสลับลำดับได้ (ความคืบหน้าของนักศึกษาจำจากรหัสของแต่ละข้อ ไม่ใช่ลำดับ) แต่หลังเผยแพร่แล้วไม่ควรลบข้อเดิมทิ้ง"
      >
        {err("checklist")}
        <ReorderList
          items={f.checklist}
          getKey={(c) => c.id}
          onChange={(next) => set({ checklist: next })}
          label={(i) => `เช็กลิสต์ข้อ ${i + 1}`}
        >
          {(c, i) => (
            <div>
              <div className="flex gap-2">
                <input
                  {...fp(`checklist.${c.id}.text`)}
                  aria-label={`เช็กลิสต์ข้อ ${i + 1}`}
                  value={c.text}
                  onChange={(e) =>
                    set(
                      { checklist: mapRows(f.checklist, (r) => r.id === c.id, { text: e.target.value }) },
                      `checklist.${c.id}.text`,
                    )
                  }
                  placeholder="เช่น เปิดบัญชีที่ account.kmutnb.ac.th"
                  className={ic(`checklist.${c.id}.text`)}
                />
                <button
                  type="button"
                  onClick={() => {
                    clearKeys(`checklist.${c.id}.text`);
                    set({ checklist: f.checklist.filter((r) => r.id !== c.id) });
                  }}
                  aria-label={`ลบเช็กลิสต์ข้อ ${i + 1}`}
                  className={dangerBtn}
                >
                  ลบ
                </button>
              </div>
              {err(`checklist.${c.id}.text`)}
            </div>
          )}
        </ReorderList>
        <button type="button" onClick={addChecklist} className={smallBtn}>
          + เพิ่มข้อ
        </button>
      </Section>

      {/* แบบฝึก */}
      <Section
        id="sec-quiz"
        title="แบบฝึก"
        hint="สูงสุด 3 ข้อ ข้อละ 3–4 ตัวเลือก เลือกวงกลมหน้าตัวเลือกที่ถูก (นักศึกษาเห็นเฉลยได้ ไม่ใช่ข้อสอบวิจัย)"
      >
        {err("quiz")}
        <ReorderList
          items={f.quiz}
          getKey={(q) => q.id}
          onChange={(next) => set({ quiz: next })}
          label={(i) => `แบบฝึกข้อ ${i + 1}`}
        >
          {(q, qi) => (
            <div className="space-y-3 rounded-lg border border-line bg-canvas p-4">
              <div className="flex items-center justify-between">
                <p className="font-heading text-navy">ข้อ {qi + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    clearKeys(
                      `quiz.${q.id}.question`,
                      `quiz.${q.id}.answer`,
                      `quiz.${q.id}.choices`,
                      `quiz.${q.id}.explanation`,
                      ...q.choices.map((c) => `quiz.${q.id}.choice.${c.id}`),
                    );
                    set({ quiz: f.quiz.filter((r) => r.id !== q.id) });
                  }}
                  className={dangerBtn}
                >
                  ลบข้อนี้
                </button>
              </div>
              <div>
                <input
                  {...fp(`quiz.${q.id}.question`)}
                  aria-label={`คำถามข้อ ${qi + 1}`}
                  value={q.question}
                  onChange={(e) =>
                    set(
                      { quiz: mapRows(f.quiz, (r) => r.id === q.id, { question: e.target.value }) },
                      `quiz.${q.id}.question`,
                    )
                  }
                  placeholder="คำถาม"
                  className={ic(`quiz.${q.id}.question`)}
                />
                {err(`quiz.${q.id}.question`)}
              </div>
              {err(`quiz.${q.id}.choices`)}
              {q.choices.map((c, ci) => (
                <div key={c.id}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`answer-${q.id}`}
                      checked={q.answer === c.id}
                      onChange={() =>
                        set(
                          { quiz: mapRows(f.quiz, (r) => r.id === q.id, { answer: c.id }) },
                          `quiz.${q.id}.answer`,
                        )
                      }
                      aria-label={`ตั้งตัวเลือกที่ ${ci + 1} เป็นข้อที่ถูก`}
                      className="size-5 shrink-0 accent-navy"
                    />
                    <input
                      {...fp(`quiz.${q.id}.choice.${c.id}`)}
                      aria-label={`ข้อ ${qi + 1} ตัวเลือกที่ ${ci + 1}`}
                      value={c.text}
                      onChange={(e) =>
                        set(
                          {
                            quiz: mapRows(f.quiz, (r) => r.id === q.id, {
                              choices: mapRows(q.choices, (x) => x.id === c.id, { text: e.target.value }),
                            }),
                          },
                          `quiz.${q.id}.choice.${c.id}`,
                        )
                      }
                      placeholder={`ตัวเลือกที่ ${ci + 1}`}
                      className={ic(`quiz.${q.id}.choice.${c.id}`)}
                    />
                    {q.choices.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => removeChoice(q.id, c.id)}
                        aria-label={`ลบตัวเลือกที่ ${ci + 1} ของข้อ ${qi + 1}`}
                        className={dangerBtn}
                      >
                        ลบ
                      </button>
                    ) : null}
                  </div>
                  {err(`quiz.${q.id}.choice.${c.id}`)}
                </div>
              ))}
              {err(`quiz.${q.id}.answer`)}
              {q.choices.length < 4 ? (
                <button type="button" onClick={() => addChoice(q.id)} className={smallBtn}>
                  + เพิ่มตัวเลือก
                </button>
              ) : null}
              <div>
                <input
                  {...fp(`quiz.${q.id}.explanation`)}
                  aria-label={`คำอธิบายข้อ ${qi + 1}`}
                  value={q.explanation}
                  onChange={(e) =>
                    set(
                      { quiz: mapRows(f.quiz, (r) => r.id === q.id, { explanation: e.target.value }) },
                      `quiz.${q.id}.explanation`,
                    )
                  }
                  placeholder="คำอธิบายเฉลย (ไม่บังคับ)"
                  className={ic(`quiz.${q.id}.explanation`)}
                />
                {err(`quiz.${q.id}.explanation`)}
              </div>
            </div>
          )}
        </ReorderList>
        {f.quiz.length < 3 ? (
          <button type="button" onClick={addQuestion} className={smallBtn}>
            + เพิ่มคำถาม
          </button>
        ) : null}
      </Section>

      {/* แหล่งข้อมูล */}
      <Section id="sec-sources" title="แหล่งข้อมูลทางการ" hint="ลิงก์อ้างอิงที่ใช้ทำเนื้อหา พร้อมวันที่ตรวจล่าสุด">
        {err("sources")}
        <ReorderList
          items={f.sources}
          getKey={(s) => s.key}
          onChange={(next) => set({ sources: next })}
          label={(i) => `แหล่งข้อมูล ${i + 1}`}
        >
          {(s, i) => (
            <div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1.5fr_10rem_auto]">
                <input
                  {...fp(`sources.${s.key}.label`)}
                  aria-label={`แหล่งข้อมูล ${i + 1} ชื่อ`}
                  value={s.label}
                  onChange={(e) =>
                    set(
                      { sources: mapRows(f.sources, (r) => r.key === s.key, { label: e.target.value }) },
                      `sources.${s.key}.label`,
                    )
                  }
                  placeholder="ชื่อ เช่น ICIT"
                  className={ic(`sources.${s.key}.label`)}
                />
                <input
                  {...fp(`sources.${s.key}.url`)}
                  aria-label={`แหล่งข้อมูล ${i + 1} ลิงก์`}
                  value={s.url}
                  onChange={(e) =>
                    set(
                      { sources: mapRows(f.sources, (r) => r.key === s.key, { url: e.target.value }) },
                      `sources.${s.key}.url`,
                    )
                  }
                  placeholder="https://..."
                  className={ic(`sources.${s.key}.url`)}
                />
                <input
                  {...fp(`sources.${s.key}.checked_at`)}
                  aria-label={`แหล่งข้อมูล ${i + 1} วันที่ตรวจ`}
                  type="date"
                  value={s.checked_at}
                  onChange={(e) =>
                    set(
                      { sources: mapRows(f.sources, (r) => r.key === s.key, { checked_at: e.target.value }) },
                      `sources.${s.key}.checked_at`,
                    )
                  }
                  className={ic(`sources.${s.key}.checked_at`)}
                />
                <button
                  type="button"
                  onClick={() => {
                    clearKeys(`sources.${s.key}.label`, `sources.${s.key}.url`, `sources.${s.key}.checked_at`);
                    set({ sources: f.sources.filter((r) => r.key !== s.key) });
                  }}
                  aria-label={`ลบแหล่งข้อมูล ${i + 1}`}
                  className={dangerBtn}
                >
                  ลบ
                </button>
              </div>
              {err(`sources.${s.key}.label`)}
              {err(`sources.${s.key}.url`)}
              {err(`sources.${s.key}.checked_at`)}
            </div>
          )}
        </ReorderList>
        <button type="button" onClick={addSource} className={smallBtn}>
          + เพิ่มแหล่งข้อมูล
        </button>
      </Section>

      {/* ช่องทางติดต่อ */}
      <Section id="sec-contacts" title="ช่องทางติดต่อ" hint='แสดงในกล่อง "ติดต่อ" ของหน้าดูวิดีโอ'>
        {err("contacts")}
        <ReorderList
          items={f.contacts}
          getKey={(c) => c.key}
          onChange={(next) => set({ contacts: next })}
          label={(i) => `ช่องทางติดต่อ ${i + 1}`}
        >
          {(c, i) => (
            <div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  {...fp(`contacts.${c.key}.label`)}
                  aria-label={`ช่องทางติดต่อ ${i + 1} ชื่อ`}
                  value={c.label}
                  onChange={(e) =>
                    set(
                      { contacts: mapRows(f.contacts, (r) => r.key === c.key, { label: e.target.value }) },
                      `contacts.${c.key}.label`,
                    )
                  }
                  placeholder="ชื่อ เช่น ICIT Help Center"
                  className={ic(`contacts.${c.key}.label`)}
                />
                <input
                  {...fp(`contacts.${c.key}.value`)}
                  aria-label={`ช่องทางติดต่อ ${i + 1} ค่า`}
                  value={c.value}
                  onChange={(e) =>
                    set(
                      { contacts: mapRows(f.contacts, (r) => r.key === c.key, { value: e.target.value }) },
                      `contacts.${c.key}.value`,
                    )
                  }
                  placeholder="เช่น LINE @icitkmutnb"
                  className={ic(`contacts.${c.key}.value`)}
                />
                <input
                  {...fp(`contacts.${c.key}.url`)}
                  aria-label={`ช่องทางติดต่อ ${i + 1} ลิงก์`}
                  value={c.url}
                  onChange={(e) =>
                    set(
                      { contacts: mapRows(f.contacts, (r) => r.key === c.key, { url: e.target.value }) },
                      `contacts.${c.key}.url`,
                    )
                  }
                  placeholder="ลิงก์ (ไม่บังคับ)"
                  className={ic(`contacts.${c.key}.url`)}
                />
                <button
                  type="button"
                  onClick={() => {
                    clearKeys(`contacts.${c.key}.label`, `contacts.${c.key}.value`, `contacts.${c.key}.url`);
                    set({ contacts: f.contacts.filter((r) => r.key !== c.key) });
                  }}
                  aria-label={`ลบช่องทางติดต่อ ${i + 1}`}
                  className={dangerBtn}
                >
                  ลบ
                </button>
              </div>
              {err(`contacts.${c.key}.label`)}
              {err(`contacts.${c.key}.value`)}
              {err(`contacts.${c.key}.url`)}
            </div>
          )}
        </ReorderList>
        <button type="button" onClick={addContact} className={smallBtn}>
          + เพิ่มช่องทางติดต่อ
        </button>
      </Section>

      {/* การเผยแพร่ */}
      <Section id="sec-publish" title="การเผยแพร่">
        {canPublish ? (
          <>
            <div role="radiogroup" aria-label="สถานะการเผยแพร่" className="space-y-2">
              {(
                [
                  ["draft", "ฉบับร่าง (นักศึกษายังมองไม่เห็น)"],
                  ["publish_now", "เผยแพร่ทันที"],
                  ["schedule", "ตั้งเวลาเผยแพร่"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="action"
                    checked={f.action === value}
                    onChange={() => set({ action: value }, "video", "publish_at", "unpublish_at")}
                    className="size-5 accent-navy"
                  />
                  {label}
                </label>
              ))}
            </div>
            {f.action === "schedule" ? (
              <div>
                <label htmlFor="f-publish_at" className={labelClass}>
                  เริ่มเผยแพร่ (เวลาไทย)
                </label>
                <input
                  {...fp("publish_at")}
                  type="datetime-local"
                  value={f.publishAt}
                  onChange={(e) => set({ publishAt: e.target.value }, "publish_at", "unpublish_at")}
                  className={ic("publish_at")}
                />
                {err("publish_at")}
              </div>
            ) : null}
            {f.action !== "draft" ? (
              <div>
                <label htmlFor="f-unpublish_at" className={labelClass}>
                  หยุดเผยแพร่ (ไม่บังคับ เว้นว่าง = เผยแพร่ตลอด)
                </label>
                <input
                  {...fp("unpublish_at")}
                  type="datetime-local"
                  value={f.unpublishAt}
                  onChange={(e) => set({ unpublishAt: e.target.value }, "unpublish_at")}
                  className={ic("unpublish_at")}
                />
                {err("unpublish_at")}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            บัญชี Teacher บันทึกได้เฉพาะฉบับร่าง เมื่อพร้อมเผยแพร่ ให้ผู้ดูแลระบบ (Admin) ตรวจและเผยแพร่
          </p>
        )}
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-xl">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "กำลังบันทึก..." : mode === "create" ? "บันทึกสื่อ" : "บันทึกการแก้ไข"}
        </button>
        <Link href="/admin/media" className={btnSecondary}>
          ยกเลิก
        </Link>
        <p role="status" className={`text-sm ${dirty ? "font-medium text-orange-strong" : "text-muted"}`}>
          {dirty ? "● มีการแก้ไขที่ยังไม่บันทึก" : "ยังไม่มีการแก้ไข"}
        </p>
      </div>

      <ConfirmDialog
        open={leaveTo !== null}
        title="ออกจากหน้านี้โดยไม่บันทึก?"
        message="คุณแก้ไขข้อมูลไว้แต่ยังไม่ได้กดบันทึก ถ้าออกตอนนี้ สิ่งที่แก้จะหายไป (ไฟล์ที่อัปโหลดไปแล้วยังอยู่ในคลัง แต่ยังไม่ผูกกับสื่อนี้)"
        confirmLabel="ออกโดยไม่บันทึก"
        cancelLabel="อยู่ต่อ"
        danger
        onConfirm={() => {
          const to = leaveTo;
          allowLeaveRef.current = true;
          setLeaveTo(null);
          if (to) router.push(to);
        }}
        onCancel={() => setLeaveTo(null)}
      />
      </div>
    </form>
  );
}
