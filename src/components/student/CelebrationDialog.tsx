"use client";

// หน้าจอฉลองเมื่อผ่านด่าน (เปิดเฉพาะตอนผ่านด่านครั้งแรก) บอกคะแนนแบบฝึก ความคืบหน้า และปุ่มไปด่านถัดไป
// ใช้ <dialog> ของเบราว์เซอร์: โฟกัสถูกล็อกในกล่อง กด Esc ปิดได้ และคืนโฟกัสให้เอง
import Link from "next/link";
import { useEffect, useRef } from "react";
import { btnAccent, btnSecondary } from "@/components/ui/styles";
import type { QuizResult } from "@/lib/progress";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  open: boolean;
  onClose: () => void;
  episodeNo: number;
  title: string;
  watchedCount: number;
  totalCount: number;
  quiz: QuizResult | null; // ผลแบบฝึกของด่านนี้ (null = ยังไม่ได้ทำ)
  hasQuiz: boolean;
  next: { slug: string; episode_no: number; title: string } | null;
};

const CONFETTI_COLORS = ["#e8622c", "#8b9bff", "#7b86e8", "#2fb8a3", "#27c3e6"];

export default function CelebrationDialog({
  open,
  onClose,
  episodeNo,
  title,
  watchedCount,
  totalCount,
  quiz,
  hasQuiz,
  next,
}: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const allDone = totalCount > 0 && watchedCount >= totalCount;
  const percent = totalCount === 0 ? 0 : Math.round((watchedCount / totalCount) * 100);

  return (
    <dialog
      ref={ref}
      aria-labelledby="celebrate-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60"
    >
      {open ? (
        <div className="relative px-6 pt-8 pb-6 text-center">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
            {Array.from({ length: 22 }, (_, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${(i * 97) % 100}%`,
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  animationDelay: `${(i % 8) * 0.12}s`,
                  ["--dx" as string]: `${((i % 5) - 2) * 18}px`,
                }}
              />
            ))}
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-teal-deep text-4xl font-bold text-white ring-8 ring-teal/25"
          >
            ✓
          </div>
          <h2 id="celebrate-title" className="relative mt-4 text-3xl" style={{ color: "var(--color-navy)" }}>
            {allDone ? t.celebrate.allDone : t.celebrate.passed(episodeNo)}
          </h2>
          <p className="relative mt-1 text-sm text-muted">{title}</p>

          <div className="relative mt-5 rounded-lg bg-canvas p-4 text-left text-sm">
            <p className="flex items-center justify-between font-medium text-ink">
              <span>{t.celebrate.progress}</span>
              <span className="tabular-nums">
                {t.celebrate.levelsCount(watchedCount, totalCount)}
              </span>
            </p>
            <div
              role="progressbar"
              aria-label={t.celebrate.progress}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-valuenow={watchedCount}
              className="mt-2 h-3 overflow-hidden rounded-full bg-line"
            >
              <div className="h-full rounded-full bg-teal-deep" style={{ width: `${percent}%` }} />
            </div>
            {quiz ? (
              <p className="mt-3 flex items-center justify-between text-ink">
                <span>{t.celebrate.quizScore}</span>
                <span className="font-semibold tabular-nums">
                  {t.celebrate.quizScoreValue(quiz.score, quiz.total)}
                </span>
              </p>
            ) : hasQuiz ? (
              <p className="mt-3 text-muted">{t.celebrate.quizTodo}</p>
            ) : null}
          </div>

          <div className="relative mt-5 flex flex-col gap-2">
            {next ? (
              <Link href={`/quest/${next.slug}`} className={`${btnAccent} w-full`} onClick={onClose}>
                {t.celebrate.next(next.episode_no)}
              </Link>
            ) : (
              <Link href="/" className={`${btnAccent} w-full`} onClick={onClose}>
                {t.celebrate.home}
              </Link>
            )}
            {!quiz && hasQuiz ? (
              <a
                href="#quiz-title"
                onClick={onClose}
                className={`${btnSecondary} w-full`}
              >
                {t.celebrate.doQuiz}
              </a>
            ) : null}
            <button type="button" onClick={onClose} className={`${btnSecondary} w-full`}>
              {t.celebrate.keepWatching}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
