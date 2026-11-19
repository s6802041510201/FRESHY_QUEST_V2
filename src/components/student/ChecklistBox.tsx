"use client";

// เช็กลิสต์ของด่านเดียว (ติ๊กแล้วจำในเครื่อง)
import { countChecked, toggleChecklistItem } from "@/lib/progress";
import type { ChecklistItem } from "@/lib/quest-types";
import { useProgress } from "@/lib/use-progress";
import { useI18n } from "@/lib/i18n/client";

export default function ChecklistBox({ mediaId, items }: { mediaId: string; items: ChecklistItem[] }) {
  const { t } = useI18n();
  const { progress, update } = useProgress();
  const checked = new Set(progress.checklist[mediaId] ?? []);
  const done = countChecked(progress, mediaId, items.map((i) => i.id));

  return (
    <div>
      <p className="text-sm text-muted" aria-live="polite">
        {t.checklistBox.done(done, items.length)}
      </p>
      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const id = `chk-${mediaId}-${item.id}`;
          return (
            <li key={item.id}>
              <label
                htmlFor={id}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 hover:bg-canvas"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked.has(item.id)}
                  onChange={() => update((p) => toggleChecklistItem(p, mediaId, item.id))}
                  className="mt-1.5 size-5 shrink-0 accent-teal"
                />
                <span className={checked.has(item.id) ? "text-muted line-through [overflow-wrap:anywhere]" : "text-ink [overflow-wrap:anywhere]"}>
                  {item.text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
