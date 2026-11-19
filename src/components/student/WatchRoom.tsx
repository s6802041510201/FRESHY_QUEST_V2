"use client";

// ตัวเล่นวิดีโอ: เลือกไฟล์ 16:9 หรือ 9:16 อัตโนมัติตามอุปกรณ์ (มือถือแนวตั้ง = 9:16) สลับเองได้
// มีซับไทย (.vtt) รายการบท (กดข้ามไปจุดนั้น) และบันทึก "ดูแล้ว" เมื่อดูถึง 90% หรือจบ
// จำจุดที่หยุดดู (ดูต่อได้) และแสดงหน้าจอฉลองเมื่อผ่านด่านครั้งแรก
import { useRef, useState, useSyncExternalStore } from "react";
import CelebrationDialog from "@/components/student/CelebrationDialog";
import { btnAccent, btnSecondary } from "@/components/ui/styles";
import { formatDuration } from "@/lib/format";
import { clearPosition, countWatched, markWatched, nowMs, resumeTarget, savePosition } from "@/lib/progress";
import type { Chapter } from "@/lib/quest-types";
import { publicUrl } from "@/lib/storage";
import { useProgress } from "@/lib/use-progress";
import { useI18n } from "@/lib/i18n/client";

type Mode = "auto" | "169" | "916";

const PORTRAIT_QUERY = "(orientation: portrait) and (max-width: 767px)";
function subscribePortrait(cb: () => void) {
  const mq = window.matchMedia(PORTRAIT_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getPortrait = () => window.matchMedia(PORTRAIT_QUERY).matches;
const getPortraitServer = () => false;

// true หลัง hydrate เสร็จ (ฝั่งเซิร์ฟเวอร์ = false) ใช้รอให้อ่านความคืบหน้าจากเครื่องก่อนตัดสินใจเสนอ "ดูต่อ"
const subscribeNone = () => () => {};
const SAVE_EVERY_MS = 5000;

export default function WatchRoom({
  mediaId,
  episodeNo,
  title,
  video169,
  video916,
  subtitle,
  cover,
  chapters,
  durationSec,
  hasQuiz,
  next,
  liveIds,
}: {
  mediaId: string;
  title: string;
  video169: string | null;
  video916: string | null;
  subtitle: string | null;
  cover: string | null;
  chapters: Chapter[];
  durationSec: number | null;
  hasQuiz: boolean;
  next: { slug: string; episode_no: number; title: string } | null;
  liveIds: string[];
  episodeNo: number;
}) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeRef = useRef<{ t: number; play: boolean } | null>(null);
  const markedRef = useRef(false);
  const pendingCelebrateRef = useRef(false);
  const lastSaveRef = useRef(0);
  const { progress, update, preview } = useProgress();
  const hydrated = useSyncExternalStore(subscribeNone, () => true, () => false);
  const autoPortrait = useSyncExternalStore(subscribePortrait, getPortrait, getPortraitServer);
  const [mode, setMode] = useState<Mode>("auto");
  const [activeChapter, setActiveChapter] = useState(-1);
  const [failed, setFailed] = useState(false);
  // จุดที่เสนอให้ดูต่อ: undefined = ยังไม่ได้ตัดสินใจ (รอ hydrate), null = ไม่มี/ปิดแล้ว
  const [offer, setOffer] = useState<number | null | undefined>(undefined);
  const [celebrate, setCelebrate] = useState(false);

  const both = !!video169 && !!video916;
  const wantPortrait = mode === "916" ? true : mode === "169" ? false : autoPortrait;
  const ratio: "169" | "916" | null = both
    ? wantPortrait
      ? "916"
      : "169"
    : video169
      ? "169"
      : video916
        ? "916"
        : null;
  const path = ratio === "169" ? video169 : ratio === "916" ? video916 : null;
  const src = path ? publicUrl(path) : null;
  const watched = !!progress.watched[mediaId];

  // ตัดสินใจครั้งเดียวหลัง hydrate: เสนอ "ดูต่อ" เฉพาะด่านที่ยังไม่ผ่านและมีจุดที่หยุดไว้
  // (ปรับ state ระหว่าง render ตามแบบที่ React แนะนำ แทน effect)
  if (hydrated && offer === undefined) {
    setOffer(watched ? null : resumeTarget(progress, mediaId, durationSec));
  }

  // ผ่านด่าน: บันทึกทันทีเมื่อดูถึง 90% แต่ "ฉลอง" รอจนวิดีโอจบ/หยุดดู เพื่อไม่ขัดจังหวะ 10% สุดท้าย
  function completeLevel(celebrateNow: boolean) {
    if (!markedRef.current && !progress.watched[mediaId]) {
      markedRef.current = true;
      update((p) => clearPosition(markWatched(p, mediaId), mediaId));
      pendingCelebrateRef.current = !preview; // โหมดดูตัวอย่างไม่ฉลอง
    }
    if (celebrateNow && pendingCelebrateRef.current) {
      pendingCelebrateRef.current = false;
      // กำลังเต็มจอ: ออกก่อน ไม่งั้นกล่องฉลองถูกบัง
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setCelebrate(true);
    }
  }

  function rememberPosition(force = false) {
    const v = videoRef.current;
    if (!v || preview || watched || markedRef.current) return;
    const now = nowMs();
    if (!force && now - lastSaveRef.current < SAVE_EVERY_MS) return;
    lastSaveRef.current = now;
    update((p) => savePosition(p, mediaId, v.currentTime));
  }

  function resumeNow() {
    const v = videoRef.current;
    if (v && typeof offer === "number") {
      v.currentTime = offer;
      void v.play().catch(() => {});
      v.focus();
    }
    setOffer(null);
  }

  function startOver() {
    const v = videoRef.current;
    update((p) => clearPosition(p, mediaId));
    if (v) {
      v.currentTime = 0;
      void v.play().catch(() => {});
      v.focus();
    }
    setOffer(null);
  }

  function switchRatio(next: Mode) {
    const v = videoRef.current;
    if (v) resumeRef.current = { t: v.currentTime, play: !v.paused };
    setFailed(false);
    setMode(next);
  }

  function seek(sec: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = sec;
    void v.play().catch(() => {});
    v.focus();
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    let idx = -1;
    for (let i = 0; i < chapters.length; i++) if (chapters[i].time_sec <= t) idx = i;
    setActiveChapter((cur) => (cur === idx ? cur : idx));
    if (v.duration > 0 && t / v.duration >= 0.9) completeLevel(false);
    rememberPosition();
  }

  const celebration = (
    <CelebrationDialog
      open={celebrate}
      onClose={() => setCelebrate(false)}
      episodeNo={episodeNo}
      title={title}
      watchedCount={countWatched(progress, liveIds)}
      totalCount={liveIds.length}
      quiz={progress.quiz[mediaId] ?? null}
      hasQuiz={hasQuiz}
      next={next}
    />
  );

  if (!src) {
    return (
      <div className="rounded-lg border border-line bg-surface p-10 text-center">
        <p className="font-medium text-ink">{t.watch.noVideo}</p>
        <p className="mt-1 text-sm text-muted">{t.watch.noVideoHint}</p>
        {!watched ? (
          <button type="button" className={`${btnSecondary} mt-4`} onClick={() => completeLevel(true)}>
            {t.watch.markPassed}
          </button>
        ) : null}
        {celebration}
      </div>
    );
  }

  const portrait = ratio === "916";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_21rem]">
      <div>
        {typeof offer === "number" ? (
          <div
            role="region"
            aria-label={t.watch.resumeRegion}
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-3"
          >
            <p className="text-sm text-ink">
              {t.watch.resumeAt} <strong className="tabular-nums">{formatDuration(offer)}</strong>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={resumeNow} className={btnAccent}>
                {t.watch.resume}
              </button>
              <button type="button" onClick={startOver} className={btnSecondary}>
                {t.watch.startOver}
              </button>
            </div>
          </div>
        ) : null}
        <div
          className={`overflow-hidden rounded-lg bg-black ${portrait ? "mx-auto" : "w-full"}`}
          style={
            portrait
              ? { width: "calc(min(75vh, 640px) * 9 / 16)", maxWidth: "100%", aspectRatio: "9 / 16" }
              : { aspectRatio: "16 / 9" }
          }
        >
          <video
            key={src}
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            poster={cover ? publicUrl(cover) : undefined}
            crossOrigin={subtitle ? "anonymous" : undefined}
            aria-label={t.watch.videoAria(title)}
            className="h-full w-full object-contain"
            onLoadedMetadata={() => {
              const v = videoRef.current;
              const r = resumeRef.current;
              if (v && r) {
                v.currentTime = Math.min(r.t, v.duration || r.t);
                if (r.play) void v.play().catch(() => {});
                resumeRef.current = null;
              }
            }}
            onTimeUpdate={onTimeUpdate}
            onPause={() => {
              const v = videoRef.current;
              if (v && v.duration > 0 && v.currentTime / v.duration >= 0.9) completeLevel(true);
              else rememberPosition(true);
            }}
            onEnded={() => completeLevel(true)}
          >
            <source src={src} type="video/mp4" onError={() => setFailed(true)} />
            {subtitle ? (
              <track kind="subtitles" src={publicUrl(subtitle)} srcLang="th" label={t.watch.subtitleLabel} default />
            ) : null}
            {t.watch.noSupport}
          </video>
        </div>

        {failed ? (
          <p role="alert" className="mt-3 rounded-lg bg-red/10 px-4 py-3 text-sm text-red-strong">
            {t.watch.loadFailed}{" "}
            <a href={src} className="font-medium underline" target="_blank" rel="noopener noreferrer">
              {t.watch.openFile}
            </a>
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {watched ? (
              <span className="font-semibold text-teal-strong">{t.watch.done}</span>
            ) : (
              t.watch.hint90
            )}
          </p>
          {both ? (
            <div role="group" aria-label={t.watch.ratioGroup} className="flex gap-2">
              {(
                [
                  ["auto", t.watch.auto],
                  ["169", t.watch.r169],
                  ["916", t.watch.r916],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => switchRatio(m)}
                  className={`min-h-10 rounded-md px-3.5 py-1.5 text-sm font-medium ring-1 ${
                    mode === m ? "bg-brand text-white ring-navy" : "bg-surface text-navy ring-line-strong hover:bg-canvas"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {chapters.length > 0 ? (
        <aside aria-labelledby="chapters-title" className="rounded-lg border border-line bg-surface p-5 lg:self-start">
          <h2 id="chapters-title" className="section-title text-lg">
            {t.watch.chapters}
          </h2>
          <ol className="mt-3 space-y-1">
            {chapters.map((c, i) => (
              <li key={`${c.time_sec}-${i}`}>
                <button
                  type="button"
                  onClick={() => seek(c.time_sec)}
                  aria-current={i === activeChapter ? "true" : undefined}
                  className={`flex min-h-11 w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-canvas ${
                    i === activeChapter ? "bg-navy/10 font-semibold text-navy" : "text-ink"
                  }`}
                >
                  <span className="shrink-0 tabular-nums text-peri-strong">{formatDuration(c.time_sec)}</span>
                  <span>{c.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
      {celebration}
    </div>
  );
}
