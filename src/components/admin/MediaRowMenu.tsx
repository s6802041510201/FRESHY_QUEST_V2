"use client";

// ปุ่มลัดท้ายแถวในรายการสื่อ: แก้ไข / ดูตัวอย่าง / เมนู "⋯" (เผยแพร่ทันที, ยกเลิกเผยแพร่, ทำสำเนา, ถังขยะ)
// ปุ่มที่ทำไม่ได้ตามบทบาทจะไม่แสดง (API และฐานข้อมูลตรวจซ้ำเสมอ)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import type { LiveState } from "@/lib/format";

type Props = {
  id: string;
  title: string;
  liveState: LiveState;
  canEdit: boolean; // เปิดหน้าแก้ไขได้ (ตัวอักษรปุ่ม "แก้ไข" หรือ "ดู")
  canPublish: boolean;
  canCreate: boolean;
  canDelete: boolean;
};

type Pending = "publish" | "unpublish" | "delete" | null;

async function post(url: string, method: string, body?: unknown): Promise<{ error?: string; data?: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: (data as { error?: string }).error ?? "ทำรายการไม่สำเร็จ กรุณาลองใหม่" };
    return { data };
  } catch {
    return { error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่" };
  }
}

export default function MediaRowMenu({ id, title, liveState, canEdit, canPublish, canCreate, canDelete }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const canPublishNow = canPublish && (liveState === "draft" || liveState === "scheduled" || liveState === "expired");
  const canUnpublish = canPublish && (liveState === "live" || liveState === "scheduled" || liveState === "expired");
  const hasItems = canPublishNow || canUnpublish || canCreate || canDelete;

  function toggle() {
    if (open) return setOpen(false);
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setOpen(true);
  }

  // เมนูลอย: ปิดเมื่อกดข้างนอก / Esc / เลื่อนหรือย่อขยายหน้าต่าง
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = () => setOpen(false);
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  async function duplicate() {
    setOpen(false);
    const r = await post(`/api/admin/media/${id}/duplicate`, "POST");
    if (r.error) return toast(r.error, "error");
    toast("ทำสำเนาเป็นฉบับร่างแล้ว กำลังเปิดหน้าแก้ไขสำเนา");
    router.push(`/admin/media/${String(r.data?.id)}`);
    router.refresh();
  }

  async function runPending() {
    if (!pending) return;
    setBusy(true);
    const r =
      pending === "delete"
        ? await post(`/api/admin/media/${id}`, "DELETE")
        : await post(`/api/admin/media/${id}/status`, "POST", {
            action: pending === "publish" ? "publish_now" : "unpublish",
          });
    setBusy(false);
    if (r.error) {
      toast(r.error, "error");
      return setPending(null);
    }
    toast(
      pending === "delete"
        ? `ย้าย "${title}" ไปถังขยะแล้ว`
        : pending === "publish"
          ? `เผยแพร่ "${title}" แล้ว นักศึกษาเห็นทันที`
          : `ยกเลิกเผยแพร่ "${title}" แล้ว กลับเป็นฉบับร่าง`,
    );
    setPending(null);
    router.refresh();
  }

  const itemClass =
    "block min-h-11 w-full rounded-md px-3 py-2.5 text-left text-sm text-ink hover:bg-canvas focus-visible:bg-canvas";

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/media/${id}`}
        className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-navy underline-offset-4 hover:bg-canvas hover:underline"
      >
        {canEdit ? "แก้ไข" : "ดู"}
      </Link>
      <Link
        href={`/admin/media/${id}/preview`}
        className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-navy underline-offset-4 hover:bg-canvas hover:underline"
      >
        ตัวอย่าง
      </Link>
      {hasItems ? (
        <>
          <button
            ref={btnRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`เมนูเพิ่มเติมของ ${title}`}
            onClick={toggle}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-lg leading-none text-navy hover:bg-canvas"
          >
            ⋯
          </button>
          {open && pos ? (
            <div
              ref={menuRef}
              role="menu"
              onKeyDown={onMenuKey}
              style={{ position: "fixed", top: pos.top, right: pos.right }}
              className="z-40 w-60 rounded-lg border border-line bg-surface p-1.5 text-left shadow-xl"
            >
              {canPublishNow ? (
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    setOpen(false);
                    setPending("publish");
                  }}
                >
                  เผยแพร่ทันที
                </button>
              ) : null}
              {canUnpublish ? (
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    setOpen(false);
                    setPending("unpublish");
                  }}
                >
                  ยกเลิกเผยแพร่ (กลับเป็นร่าง)
                </button>
              ) : null}
              {canCreate ? (
                <button type="button" role="menuitem" className={itemClass} onClick={duplicate}>
                  ทำสำเนาเป็นฉบับร่าง
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  className={`${itemClass} text-red-strong`}
                  onClick={() => {
                    setOpen(false);
                    setPending("delete");
                  }}
                >
                  ย้ายไปถังขยะ
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title={
          pending === "delete" ? "ย้ายไปถังขยะ?" : pending === "publish" ? "เผยแพร่ทันที?" : "ยกเลิกเผยแพร่?"
        }
        message={
          pending === "delete"
            ? `ย้าย "${title}" ไปถังขยะ นักศึกษาจะมองไม่เห็นทันที (กู้คืนได้จากหน้าถังขยะ)`
            : pending === "publish"
              ? `"${title}" จะขึ้นหน้าเว็บให้นักศึกษาเห็นทันที`
              : `"${title}" จะกลับเป็นฉบับร่าง นักศึกษาจะมองไม่เห็นทันที (ข้อมูลและไฟล์ยังอยู่ครบ)`
        }
        confirmLabel={pending === "delete" ? "ย้ายไปถังขยะ" : pending === "publish" ? "เผยแพร่" : "ยกเลิกเผยแพร่"}
        danger={pending !== "publish"}
        busy={busy}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
