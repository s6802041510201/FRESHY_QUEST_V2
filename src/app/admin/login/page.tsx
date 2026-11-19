import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { getCurrentProfile } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import LoginForm from "./LoginForm";

export async function generateMetadata() {
  return { title: (await getDict()).t.meta.login };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; as?: string }>;
}) {
  const { error, as } = await searchParams;
  // ต้องเข้ามาจากหน้าเลือกบทบาท (?as=admin หรือ ?as=teacher) ถ้าไม่ระบุให้กลับไปเลือกก่อน
  if (as !== "admin" && as !== "teacher") redirect("/login");

  // ล็อกอินอยู่แล้วและบทบาทตรงกับประตูที่เลือก -> ไปแดชบอร์ดเลย
  // (ถ้าล็อกอินด้วยบทบาทอีกฝั่งอยู่ จะแสดงฟอร์มให้ล็อกอินใหม่ ไม่พาเข้าแดชบอร์ดของอีกบทบาท)
  const profile = await getCurrentProfile();
  if (profile && profile.role === (as === "admin" ? "admin" : "editor")) redirect("/admin");

  const { t } = await getDict();
  const subtitle = as === "admin" ? t.auth.subAdmin : t.auth.subTeacher;
  return (
    <AuthCard
      title={t.auth.loginTitle}
      subtitle={subtitle}
    >
      <LoginForm linkError={error === "link"} as={as} />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="inline-block py-2 font-medium text-navy underline underline-offset-4 hover:text-orange-strong">
          {t.auth.changeRole}
        </Link>
      </p>
    </AuthCard>
  );
}
