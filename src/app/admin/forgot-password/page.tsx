"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard, buttonClass, inputClass } from "@/components/admin/AuthCard";
import { useI18n } from "@/lib/i18n/client";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t.auth.forgotFailed);
      else setMessage(data.message);
    } catch {
      setError(t.auth.offline);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title={t.auth.forgotTitle} subtitle={t.auth.forgotSub}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            {t.auth.email}
          </label>
          <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red-strong">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-teal-strong">
            {message}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? t.auth.forgotSubmitting : t.auth.forgotSubmit}
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-navy underline-offset-4 hover:underline">
            {t.auth.backToLogin}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
