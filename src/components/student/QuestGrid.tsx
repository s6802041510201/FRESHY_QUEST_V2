"use client";

// การ์ดด่าน + (ถ้าเปิด) ตัวกรองหมวดหมู่ แสดงป้าย "ดูแล้ว" จากความคืบหน้าในเครื่อง
import Link from "next/link";
import { useMemo, useState } from "react";
import Cover from "@/components/student/Cover";
import { useI18n } from "@/lib/i18n/client";
import { formatDuration } from "@/lib/format";
import type { QuestSummary } from "@/lib/quest-types";
import { useProgress } from "@/lib/use-progress";

function QuestCard({ q, watched }: { q: QuestSummary; watched: boolean }) {
  const { t } = useI18n();
  return (
    <li>
      <Link
        href={`/quest/${q.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition hover:border-navy hover:shadow-md"
      >
        <Cover episodeNo={q.episode_no} coverPath={q.cover_path} />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-navy">{t.grid.level(q.episode_no)}</span>
            {watched ? (
              <span className="whitespace-nowrap rounded-md bg-teal/15 px-2.5 py-0.5 text-xs font-semibold text-teal-strong">
                {t.grid.watched}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg group-hover:underline group-hover:underline-offset-4">{q.title}</h3>
          <p className="mt-auto pt-4 text-sm text-muted">
            {[q.category, q.duration_sec ? t.grid.minutes(formatDuration(q.duration_sec)) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function QuestGrid({
  quests,
  showFilter = false,
}: {
  quests: QuestSummary[];
  showFilter?: boolean;
}) {
  const { progress } = useProgress();
  const { t } = useI18n();
  const [category, setCategory] = useState<string>("");

  const categories = useMemo(
    () => [...new Set(quests.map((q) => q.category).filter(Boolean))],
    [quests],
  );
  const shown = category ? quests.filter((q) => q.category === category) : quests;

  if (quests.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-8 text-center text-muted">
        {t.grid.empty}
      </p>
    );
  }

  return (
    <div>
      {showFilter && categories.length > 0 ? (
        <div role="group" aria-label={t.grid.filter} className="mb-6 flex flex-wrap gap-2">
          {["", ...categories].map((c) => {
            const active = c === category;
            return (
              <button
                key={c || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium ring-1 transition-colors ${
                  active ? "bg-brand text-white ring-navy" : "bg-surface text-navy ring-line-strong hover:bg-canvas"
                }`}
              >
                {c || t.grid.all}
              </button>
            );
          })}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-8 text-center text-muted">{t.grid.emptyCategory}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((q) => (
            <QuestCard key={q.id} q={q} watched={!!progress.watched[q.id]} />
          ))}
        </ul>
      )}
    </div>
  );
}
