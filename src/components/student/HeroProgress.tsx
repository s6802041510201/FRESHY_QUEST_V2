"use client";

// การ์ดความคืบหน้าในส่วนหัวหน้าแรก + เส้นทางด่าน (Quest Map) + ปุ่ม "ไปด่านถัดไป"
// การ์ดพื้นขาวบนฮีโร่ Navy (ตัวอักษรเข้มบนขาว คอนทราสต์สูง) ปุ่มส้มมีปุ่มเดียวคือการกระทำถัดไป
import Link from "next/link";
import { btnAccent, btnSecondary } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";
import { formatDuration } from "@/lib/format";
import type { QuestSummary } from "@/lib/quest-types";
import { countWatched, latestResume, nextUnwatched } from "@/lib/progress";
import { useProgress } from "@/lib/use-progress";

export default function HeroProgress({ quests }: { quests: QuestSummary[] }) {
  const { progress } = useProgress();
  const { t } = useI18n();
  const total = quests.length;
  const done = countWatched(progress, quests.map((q) => q.id));
  const next = nextUnwatched(progress, quests);
  const resume = latestResume(progress, quests);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="rounded-lg bg-surface p-6 text-ink shadow-md">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{t.progress.yours}</p>
          <p className="mt-1 font-heading text-4xl leading-none text-navy">
            {done}
            <span className="text-2xl text-muted">/{total}</span>
            <span className="ml-2 font-sans text-base text-muted">{t.progress.unit}</span>
          </p>
        </div>
        <p className="text-sm font-semibold text-navy tabular">{percent}%</p>
      </div>
      <div
        role="progressbar"
        aria-label={t.progress.bar}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={t.progress.barText(done, total)}
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
      </div>

      {total > 0 ? (
        <ol aria-label={t.progress.route} className="mt-5 flex flex-wrap gap-2">
          {quests.map((q) => {
            const isDone = !!progress.watched[q.id];
            const isNext = next?.id === q.id;
            return (
              <li key={q.id}>
                <Link
                  href={`/quest/${q.slug}`}
                  title={q.title}
                  aria-label={t.progress.chipLabel(q.episode_no, q.title, isDone ? "done" : isNext ? "next" : "todo")}
                  className={`flex size-11 items-center justify-center rounded-md text-sm font-bold transition-colors ${
                    isDone
                      ? "bg-teal-deep text-white hover:bg-teal"
                      : isNext
                        ? "bg-surface text-navy ring-2 ring-orange hover:bg-canvas"
                        : "bg-surface text-navy ring-1 ring-line-strong hover:bg-canvas"
                  }`}
                >
                  {isDone ? "✓" : q.episode_no}
                </Link>
              </li>
            );
          })}
        </ol>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {total === 0 ? null : resume ? (
          <>
            <Link href={`/quest/${resume.quest.slug}`} className={`${btnAccent} w-full sm:w-auto`}>
              {t.progress.resume(resume.quest.episode_no, formatDuration(resume.sec))}
            </Link>
            {next && next.id !== resume.quest.id ? (
              <Link href={`/quest/${next.slug}`} className={`${btnSecondary} w-full sm:w-auto`}>
                {t.progress.goNext(next.episode_no)}
              </Link>
            ) : null}
          </>
        ) : next ? (
          <Link href={`/quest/${next.slug}`} className={`${btnAccent} w-full sm:w-auto`}>
            {done === 0 ? t.progress.start(next.episode_no) : t.progress.goNext(next.episode_no)}
          </Link>
        ) : (
          <p className="rounded-md bg-teal/10 px-4 py-3 text-sm font-semibold text-teal-strong">
            {t.progress.allDone}
          </p>
        )}
      </div>
    </div>
  );
}
