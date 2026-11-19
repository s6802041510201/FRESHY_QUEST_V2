"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, buttonClass, inputClass } from "@/components/admin/AuthCard";
import { useI18n } from "@/lib/i18n/client";

// หน้านี้เปิดได้เมื่อมีเซสชันจากลิงก์ในอีเมล (ผ่าน /auth/callback) ถ้าไม่มี proxy.ts จะส่งไปหน้าล็อกอิน
export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError(t.auth.mismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t.auth.resetFailed);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(t.auth.offline);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title={t.auth.resetTitle} subtitle={t.auth.resetSub}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
            {t.auth.newPassword}
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold">
            {t.auth.confirmPassword}
          </label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red-strong">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? t.auth.resetSubmitting : t.auth.resetSubmit}
        </button>
      </form>
    </AuthCard>
  );
}
