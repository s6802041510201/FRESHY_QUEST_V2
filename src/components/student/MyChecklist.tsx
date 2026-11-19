"use client";

// Checklist ของฉัน: รวมเช็กลิสต์ของทุกด่านที่เปิดอยู่ + ความคืบหน้าจำนวนด่านที่ดูแล้ว
import Link from "next/link";
import ChecklistBox from "@/components/student/ChecklistBox";
import { cardClass } from "@/components/ui/styles";
import { countChecked, countWatched } from "@/lib/progress";
import type { ChecklistItem } from "@/lib/quest-types";
import { useProgress } from "@/lib/use-progress";
import { useI18n } from "@/lib/i18n/client";

export type ChecklistLevel = {
  id: string;
  slug: string;
  episode_no: number;
  title: string;
  items: ChecklistItem[];
};

export default function MyChecklist({
  levels,
  allLevelIds,
}: {
  levels: ChecklistLevel[];
  /** id ของทุกด่านที่เปิดอยู่ (รวมด่านที่ไม่มีเช็กลิสต์) ไว้นับความคืบหน้า X/N */
  allLevelIds: string[];
}) {
  const { t } = useI18n();
  const { progress } = useProgress();
  const watched = countWatched(progress, allLevelIds);
  const totalItems = levels.reduce((n, l) => n + l.items.length, 0);
  const doneItems = levels.reduce(
    (n, l) =>
      n +
      countChecked(
        progress,
        l.id,
        l.items.map((i) => i.id),
      ),
    0,
  );
  const pct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  return (
    <div>
      <div className={`${cardClass} grid gap-6 p-6 sm:grid-cols-2`}>
        <div>
          <p className="text-sm text-muted">{t.myChecklist.levelsWatched}</p>
          <p className="font-heading text-3xl text-navy">
            {watched}
            <span className="text-xl text-muted">/{allLevelIds.length}</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">{t.myChecklist.itemsDone}</p>
          <p className="font-heading text-3xl text-navy">
            {doneItems}
            <span className="text-xl text-muted">/{totalItems}</span>
          </p>
          <div
            role="progressbar"
            aria-label={t.myChecklist.bar}
            aria-valuemin={0}
            aria-valuemax={totalItems}
            aria-valuenow={doneItems}
            aria-valuetext={t.myChecklist.barText(doneItems, totalItems)}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {levels.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-surface p-8 text-center text-muted">
          {t.myChecklist.empty}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {levels.map((l) => (
            <section key={l.id} aria-labelledby={`lv-${l.id}`} className={`${cardClass} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id={`lv-${l.id}`} className="section-title text-lg">
                  {t.quest.levelTitle(l.episode_no, l.title)}
                </h2>
                <Link
                  href={`/quest/${l.slug}`}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-navy underline underline-offset-4 hover:text-orange-strong"
                >
                  {t.myChecklist.goLevel}
                </Link>
              </div>
              <div className="mt-3">
                <ChecklistBox mediaId={l.id} items={l.items} />
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="mt-8 text-sm text-muted">
        {t.myChecklist.localNote}
      </p>
    </div>
  );
}
