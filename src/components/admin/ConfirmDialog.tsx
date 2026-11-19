"use client";

// กล่องยืนยันแบบ modal ใช้ <dialog> ของเบราว์เซอร์ (ล็อกโฟกัสในกล่อง, กด Esc ปิดได้, คืนโฟกัสให้ปุ่มเดิมเอง)
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault(); // Esc: ให้ state ของเราเป็นคนปิด
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        // กดพื้นหลังมืด (ตัว dialog เอง) = ยกเลิก
        if (e.target === ref.current && !busy) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg bg-surface p-0 text-ink shadow-xl backdrop:bg-black/60"
    >
      <div className="space-y-3 p-6">
        <h2 id="confirm-title" className="text-xl" style={{ color: "var(--color-navy)" }}>
          {title}
        </h2>
        <div className="text-ink">{message}</div>
        <div className="flex flex-wrap justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex min-h-11 items-center rounded-md border border-line-strong bg-surface px-5 text-base font-medium text-navy hover:bg-canvas disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex min-h-11 items-center rounded-md px-5 text-base font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-red-deep hover:bg-brand-hover" : "bg-brand hover:bg-brand-hover"
            }`}
          >
            {busy ? "กำลังทำรายการ..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
