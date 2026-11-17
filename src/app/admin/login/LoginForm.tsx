"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, inputClass } from "@/components/admin/AuthCard";

export default function LoginForm({ linkError }: { linkError: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    linkError ? "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ตั้งรหัสผ่านใหม่" : null,
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          อีเมล
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          รหัสผ่าน
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
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/forgot-password" className="font-medium text-navy underline-offset-2 hover:underline">
          ลืมรหัสผ่าน?
        </Link>
      </p>
    </form>
  );
}
