"use client";

// แจ้งผลแบบป๊อปอัปมุมจอ: ใช้ useToast().toast("ข้อความ", "success" | "error" | "info")
// อ่านออกเสียงได้ (aria-live) หายเองใน 5 วินาที (ข้อผิดพลาด 8 วินาที) กดปิดเองได้ และไม่ต้องใช้เมาส์
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Kind = "success" | "error" | "info";
type Item = { id: number; kind: Kind; message: string };
type Ctx = { toast: (message: string, kind?: Kind) => void };

const ToastContext = createContext<Ctx | null>(null);

const KIND_CLASS: Record<Kind, string> = {
  success: "border-teal-strong bg-surface text-ink",
  error: "border-red-strong bg-surface text-ink",
  info: "border-peri-strong bg-surface text-ink",
};
const KIND_ICON: Record<Kind, string> = { success: "✓", error: "!", info: "i" };
const KIND_BADGE: Record<Kind, string> = {
  success: "bg-teal-deep text-white",
  error: "bg-red-deep text-white",
  info: "bg-peri-strong text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: Kind = "success") => {
      const id = nextId.current++;
      // เก็บสูงสุด 4 อัน กันล้นจอเมื่อกดรัว ๆ
      setItems((list) => [...list.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? 8000 : 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-start gap-2 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-96"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border-l-4 p-4 text-sm shadow-xl ring-1 ring-line ${KIND_CLASS[t.kind]}`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${KIND_BADGE[t.kind]}`}
            >
              {KIND_ICON[t.kind]}
            </span>
            <p className="min-w-0 flex-1 break-words">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="ปิดการแจ้งเตือน"
              className="-m-2 inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  // นอก Provider (เช่นเทสต์) ให้เงียบไว้ ไม่ทำให้หน้าล่ม
  return ctx ?? { toast: () => {} };
}
