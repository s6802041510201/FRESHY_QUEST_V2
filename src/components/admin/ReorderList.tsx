"use client";

// รายการแถวที่จัดลำดับได้ 2 วิธี: ลากที่จับ ⠿ (เมาส์) หรือปุ่ม ▲ ▼ (คีย์บอร์ด/จอสัมผัส ซึ่งลากแบบ HTML5 ไม่ได้)
// หลังย้ายด้วยปุ่ม โฟกัสจะตามแถวที่ย้ายไป และมีข้อความแจ้งผู้ใช้โปรแกรมอ่านหน้าจอ
import { useEffect, useRef, useState } from "react";
import { moveItem } from "@/lib/form-helpers";

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  onChange: (next: T[]) => void;
  /** ชื่อแถวสำหรับอ่านออกเสียง เช่น "เช็กลิสต์ข้อ 2" */
  label: (index: number) => string;
  children: (item: T, index: number) => React.ReactNode;
};

const arrowBtn =
  "flex size-9 items-center justify-center rounded-md border border-line-strong bg-surface text-xs text-navy hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40";

export default function ReorderList<T>({ items, getKey, onChange, label, children }: Props<T>) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const focusRef = useRef<{ key: string; dir: "up" | "down" } | null>(null);

  // หลังย้ายด้วยปุ่ม ให้โฟกัสตามไปที่ปุ่มเดิมของแถวที่ย้าย (ถ้าชนขอบ ปุ่มนั้นถูกปิด จึงไปปุ่มตรงข้าม)
  useEffect(() => {
    const f = focusRef.current;
    if (!f) return;
    focusRef.current = null;
    const row = document.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(f.key)}"]`);
    const want = row?.querySelector<HTMLButtonElement>(`[data-move="${f.dir}"]`);
    const other = row?.querySelector<HTMLButtonElement>(`[data-move="${f.dir === "up" ? "down" : "up"}"]`);
    (want && !want.disabled ? want : other)?.focus();
  }, [items]);

  function moveTo(from: number, to: number, dir?: "up" | "down") {
    const next = moveItem(items, from, to);
    if (next === items) return;
    if (dir) focusRef.current = { key: getKey(items[from]), dir };
    setAnnounce(`ย้าย${label(from)}ไปเป็นลำดับที่ ${to + 1} จาก ${items.length}`);
    onChange(next);
  }

  const dragIndex = dragKey === null ? -1 : items.findIndex((x) => getKey(x) === dragKey);

  return (
    <div className="space-y-3">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
      {items.map((item, i) => {
        const key = getKey(item);
        const isOver = overKey === key && dragKey !== null && dragKey !== key;
        const lineSide = isOver ? (dragIndex < i ? "after" : "before") : null;
        return (
          <div
            key={key}
            data-row-key={key}
            onDragOver={(e) => {
              if (dragKey === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overKey !== key) setOverKey(key);
            }}
            onDrop={(e) => {
              if (dragKey === null) return;
              e.preventDefault();
              const to = items.findIndex((x) => getKey(x) === key);
              if (dragIndex >= 0 && to >= 0) moveTo(dragIndex, to);
              setDragKey(null);
              setOverKey(null);
            }}
            className={`flex gap-2 rounded-lg ${dragKey === key ? "opacity-50" : ""} ${
              lineSide === "before"
                ? "shadow-[0_-3px_0_0_var(--color-peri-strong)]"
                : lineSide === "after"
                  ? "shadow-[0_3px_0_0_var(--color-peri-strong)]"
                  : ""
            }`}
          >
            <div className="flex shrink-0 items-start gap-1 pt-1">
              {items.length > 1 ? (
                <>
                  <span
                    draggable
                    aria-hidden="true"
                    title="ลากเพื่อจัดลำดับ"
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", key);
                      const row = (e.currentTarget as HTMLElement).closest("[data-row-key]");
                      if (row) e.dataTransfer.setDragImage(row, 16, 16);
                      setDragKey(key);
                    }}
                    onDragEnd={() => {
                      setDragKey(null);
                      setOverKey(null);
                    }}
                    className="hidden size-9 cursor-grab select-none items-center justify-center rounded-md text-lg text-muted hover:bg-canvas active:cursor-grabbing sm:flex"
                  >
                    ⠿
                  </span>
                  <div className="flex flex-col gap-1 sm:flex-row">
                  <button
                    type="button"
                    data-move="up"
                    disabled={i === 0}
                    aria-label={`เลื่อน${label(i)}ขึ้น`}
                    onClick={() => moveTo(i, i - 1, "up")}
                    className={arrowBtn}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    data-move="down"
                    disabled={i === items.length - 1}
                    aria-label={`เลื่อน${label(i)}ลง`}
                    onClick={() => moveTo(i, i + 1, "down")}
                    className={arrowBtn}
                  >
                    ▼
                  </button>
                  </div>
                </>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">{children(item, i)}</div>
          </div>
        );
      })}
    </div>
  );
}
