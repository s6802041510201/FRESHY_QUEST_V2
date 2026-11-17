"use client";

// ปุ่มลบ (soft delete) และกู้คืนสื่อ ใช้ใน /admin/media/[id] และ /admin/media/trash
import { useRouter } from "next/navigation";
import { useState } from "react";

async function call(url: string, method: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error ?? "ทำรายการไม่สำเร็จ กรุณาลองใหม่";
  } catch {
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่";
  }
}

export function DeleteMediaButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const err = await call(`/api/admin/media/${id}`, "DELETE");
    setBusy(false);
    if (err) return setError(err);
    router.push("/admin/media");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-strong/40 bg-white px-3 py-2 text-sm font-medium text-red-strong transition-colors hover:bg-red/10"
      >
        ย้ายไปถังขยะ
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-lg bg-red/10 p-3 text-sm text-ink">
      <p>ย้าย &ldquo;{title}&rdquo; ไปถังขยะ? นักศึกษาจะมองไม่เห็นทันที (กู้คืนได้จากหน้าถังขยะ)</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={run}
          className="rounded-lg bg-red-strong px-3 py-1.5 font-medium text-white hover:bg-ink disabled:opacity-60"
        >
          {busy ? "กำลังย้าย..." : "ยืนยัน"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-navy hover:bg-canvas"
        >
          ยกเลิก
        </button>
      </div>
      {error ? <p role="alert" className="text-red-strong">{error}</p> : null}
    </div>
  );
}

export function RestoreMediaButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const err = await call(`/api/admin/media/${id}/restore`, "POST");
    setBusy(false);
    if (err) return setError(err);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-canvas disabled:opacity-60"
      >
        {busy ? "กำลังกู้คืน..." : "กู้คืน"}
      </button>
      {error ? <p role="alert" className="mt-1 max-w-xs text-xs text-red-strong">{error}</p> : null}
    </div>
  );
}
