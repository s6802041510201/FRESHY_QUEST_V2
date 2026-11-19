import Link from "next/link";
import AdminPageHeader from "@/components/admin/PageHeader";
import { badgeClass, btnPrimary, btnSecondary, cardClass } from "@/components/ui/styles";
import { requireProfile } from "@/lib/auth";
import { formatThaiDateTime, LIVE_STATE_CLASS, LIVE_STATE_LABEL, type LiveState } from "@/lib/format";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "แดชบอร์ด | FRESHY QUEST" };

type Row = { id: string; episode_no: number; title: string; live_state: LiveState; updated_at: string };

// แดชบอร์ด: ตัวเลขสรุปตามสถานะ · งานที่ควรทำต่อ · สื่อที่แก้ไขล่าสุด · สิทธิ์ของบัญชี
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
    .select("id, episode_no, title, live_state, updated_at")
    .is("deleted_at", null)
    .returns<Row[]>();

  const rows = data ?? [];
  const count = (s: LiveState) => rows.filter((r) => r.live_state === s).length;
  const recent = [...rows].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")).slice(0, 5);
  const drafts = count("draft");
  const canPublish = can(profile.role, "media.publish");

  const stats: { label: string; value: number; dot: string }[] = [
    { label: "สื่อทั้งหมด", value: rows.length, dot: "bg-brand" },
    { label: "เผยแพร่อยู่", value: count("live"), dot: "bg-teal-deep" },
    { label: "ตั้งเวลาไว้", value: count("scheduled"), dot: "bg-peri-strong" },
    { label: "ฉบับร่าง", value: drafts, dot: "bg-muted" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="แดชบอร์ด"
        description={`สวัสดี ${profile.name} · สรุปภาพรวมสื่อและงานที่ควรทำต่อ`}
        actions={
          can(profile.role, "media.create") ? (
            <Link href="/admin/media/new" className={btnPrimary}>
              + เพิ่มสื่อใหม่
            </Link>
          ) : null
        }
      />

      {denied ? (
        <p role="alert" className="mb-6 rounded-md border border-orange/40 bg-orange/10 px-4 py-3 text-sm text-ink">
          บทบาทของคุณไม่มีสิทธิ์เข้าหน้านั้น
        </p>
      ) : null}

      <section aria-label="สรุปสื่อ" className={`${cardClass} grid grid-cols-2 md:grid-cols-4`}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`p-6 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${
              i > 0 ? "md:border-l md:border-line" : ""
            }`}
          >
            <p className="flex items-center gap-2 text-sm text-muted">
              <span aria-hidden="true" className={`size-2.5 rounded-sm ${s.dot}`} />
              {s.label}
            </p>
            <p className="mt-2 font-heading text-4xl leading-none text-navy">{s.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="recent-title" className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 id="recent-title" className="text-lg">
              สื่อที่แก้ไขล่าสุด
            </h2>
            <Link href="/admin/media" className="text-sm font-medium text-navy underline underline-offset-4 hover:text-orange-strong">
              ดูทั้งหมด
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted">ยังไม่มีสื่อ กด &ldquo;+ เพิ่มสื่อใหม่&rdquo; เพื่อเริ่มต้น</p>
          ) : (
            <ul>
              {recent.map((m) => (
                <li key={m.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/admin/media/${m.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4 transition-colors hover:bg-canvas"
                  >
                    <span className="w-8 font-heading text-lg text-navy">{m.episode_no}</span>
                    <span className="min-w-0 flex-1 font-medium text-ink">{m.title}</span>
                    <span className={`${badgeClass} ${LIVE_STATE_CLASS[m.live_state]}`}>{LIVE_STATE_LABEL[m.live_state]}</span>
                    <span className="w-full text-sm text-muted sm:w-auto">{formatThaiDateTime(m.updated_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-8">
          <section aria-labelledby="todo-title" className={`${cardClass} p-6`}>
            <h2 id="todo-title" className="text-lg">
              งานที่ควรทำต่อ
            </h2>
            {drafts > 0 ? (
              <>
                <p className="mt-3 text-muted">
                  {canPublish
                    ? `มีฉบับร่าง ${drafts} รายการ รอตรวจและเผยแพร่`
                    : `มีฉบับร่าง ${drafts} รายการ แก้ไขต่อได้ เมื่อพร้อมให้แจ้ง Admin เป็นผู้เผยแพร่`}
                </p>
                <Link href="/admin/media?state=draft" className={`${btnSecondary} mt-4`}>
                  ดูฉบับร่าง
                </Link>
              </>
            ) : (
              <p className="mt-3 text-muted">ไม่มีฉบับร่างค้างอยู่ ตอนนี้ไม่มีงานที่ต้องทำต่อ</p>
            )}
          </section>

          <section aria-labelledby="perm-title" className={`${cardClass} p-6`}>
            <h2 id="perm-title" className="text-lg">
              สิทธิ์ของบัญชีนี้
            </h2>
            <p className="mt-1 text-sm text-muted">{ROLE_LABEL[profile.role]}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
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
                  <li key={perm} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded text-xs font-bold ${
                        allowed ? "bg-teal-deep text-white" : "bg-line text-muted"
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
      </div>
    </div>
  );
}
