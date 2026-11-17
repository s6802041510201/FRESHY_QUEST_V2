"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard, buttonClass, inputClass } from "@/components/admin/AuthCard";

export default function ForgotPasswordPage() {
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
      if (!res.ok) setError(data.error ?? "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");
      else setMessage(data.message);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="ลืมรหัสผ่าน" subtitle="กรอกอีเมลของบัญชี เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            อีเมล
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
          {loading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
        </button>
        <p className="text-center text-sm">
          <Link href="/admin/login" className="font-medium text-navy underline-offset-2 hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
