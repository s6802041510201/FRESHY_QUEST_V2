import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { getCurrentProfile } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "เข้าสู่ระบบ | FRESHY QUEST" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // ล็อกอินอยู่แล้ว (และมีสิทธิ์) -> ไปแดชบอร์ดเลย
  if (await getCurrentProfile()) redirect("/admin");

  const { error } = await searchParams;
  return (
    <AuthCard title="เข้าสู่ระบบ" subtitle="สำหรับผู้ดูแลระบบและผู้จัดทำเนื้อหาเท่านั้น">
      <LoginForm linkError={error === "link"} />
    </AuthCard>
  );
}
