"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, inputClass } from "@/components/admin/AuthCard";
import { useI18n } from "@/lib/i18n/client";

export default function LoginForm({ linkError, as }: { linkError: boolean; as: "admin" | "teacher" }) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(
    linkError ? t.auth.linkExpired : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          as,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.code === "wrong_role" ? t.auth.wrongRole(data.actual === "admin" ? "Admin" : "Teacher") : (data.error ?? t.auth.loginFailed),
        );
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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
          {t.auth.email}
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          {t.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red-strong">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? t.auth.submitting : t.auth.submit}
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/forgot-password" className="inline-block py-2 font-medium text-navy underline-offset-4 hover:underline">
          {t.auth.forgot}
        </Link>
      </p>
    </form>
  );
}
