"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ปุ่มออกจากระบบ (ออกแบบให้อยู่บนพื้น Navy ของเมนูข้าง)
export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="w-full rounded-lg border border-white/30 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? "กำลังออก..." : "ออกจากระบบ"}
    </button>
  );
}
