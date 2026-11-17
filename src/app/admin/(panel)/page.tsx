import Link from "next/link";
import { btnAccent, btnSecondary, cardClass } from "@/components/ui/styles";
import { requireProfile } from "@/lib/auth";
import type { LiveState } from "@/lib/format";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "แดชบอร์ด | FRESHY QUEST" };

// แดชบอร์ดชั่วคราว: สรุปจำนวนสื่อตามสถานะ + ทางลัด (หน้านี้ยังไม่มี mockup ในเอกสารต้นฉบับ)
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const profile = await requireProfile();
  const { denied } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("media_with_state")
    .select("live_state")
    .is("deleted_at", null)
    .returns<{ live_state: LiveState }[]>();

  const count = (s: LiveState) => (data ?? []).filter((r) => r.live_state === s).length;
  const stats: { label: string; value: number; tone: string }[] = [
    { label: "สื่อทั้งหมด", value: data?.length ?? 0, tone: "border-navy text-navy" },
    { label: "เผยแพร่อยู่", value: count("live"), tone: "border-teal text-teal-strong" },
    { label: "ตั้งเวลาไว้", value: count("scheduled"), tone: "border-peri text-peri-strong" },
    { label: "ฉบับร่าง", value: count("draft"), tone: "border-slate-400 text-slate-700" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-muted">ยินดีต้อนรับกลับมา</p>
        <h1 className="text-3xl">{profile.name}</h1>
      </div>

      {denied ? (
        <p role="alert" className="rounded-lg bg-orange/15 px-4 py-3 text-sm text-ink">
          บทบาทของคุณไม่มีสิทธิ์เข้าหน้านั้น
        </p>
      ) : null}

      <section aria-label="สรุปสื่อ" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`${cardClass} border-t-4 p-4 ${s.tone}`}>
            <p className="font-heading text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className={`${cardClass} p-6`}>
        <h2 className="text-lg">เริ่มทำงาน</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {can(profile.role, "media.create") ? (
            <Link href="/admin/media/new" className={btnAccent}>
              + เพิ่มสื่อใหม่
            </Link>
          ) : null}
          <Link href="/admin/media" className={btnSecondary}>
            เปิดคลังสื่อ
          </Link>
        </div>
      </section>

      <section className={`${cardClass} p-6`}>
        <h2 className="text-lg">สิทธิ์ของบัญชีนี้</h2>
        <p className="mt-1 text-sm text-muted">{ROLE_LABEL[profile.role]}</p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {(
            [
              ["เพิ่ม/แก้ไขสื่อ", "media.create"],
              ["เผยแพร่/ตั้งเวลา", "media.publish"],
              ["ลบและกู้คืนสื่อ", "media.delete"],
              ["จัดการ Playlist และผู้ใช้", "users.manage"],
              ["ดูสถิติ", "stats.view"],
            ] as const
          ).map(([label, perm]) => {
            const allowed = can(profile.role, perm);
            return (
              <li key={perm} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                    allowed ? "bg-teal-strong" : "bg-slate-400"
                  }`}
                >
                  {allowed ? "✓" : "–"}
                </span>
                <span className={allowed ? "text-ink" : "text-muted"}>
                  {label} <span className="sr-only">{allowed ? "ทำได้" : "ทำไม่ได้"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
