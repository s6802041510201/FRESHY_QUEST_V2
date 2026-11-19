"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ปุ่มออกจากระบบ (อยู่บนแถบ Navy ด้านบนของหลังบ้าน)
export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="inline-flex min-h-11 items-center rounded-md border border-white/40 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? "กำลังออก..." : "ออกจากระบบ"}
    </button>
  );
}
