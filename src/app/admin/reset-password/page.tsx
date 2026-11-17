"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, buttonClass, inputClass } from "@/components/admin/AuthCard";

// หน้านี้เปิดได้เมื่อมีเซสชันจากลิงก์ในอีเมล (ผ่าน /auth/callback) ถ้าไม่มี proxy.ts จะส่งไปหน้าล็อกอิน
export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
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
        setError(data.error ?? "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
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
    <AuthCard title="ตั้งรหัสผ่านใหม่" subtitle="รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            รหัสผ่านใหม่
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red-strong">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
        </button>
      </form>
    </AuthCard>
  );
}
