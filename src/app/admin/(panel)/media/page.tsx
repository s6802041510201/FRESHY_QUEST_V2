import Link from "next/link";
import { btnAccent, btnSecondary, cardClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth";
import {
  formatThaiDateTime,
  LIVE_STATE_CLASS,
  LIVE_STATE_LABEL,
  type LiveState,
} from "@/lib/format";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "คลังสื่อ | FRESHY QUEST" };

type Row = {
  id: string;
  episode_no: number;
  title: string;
  category: string;
  live_state: LiveState;
  updated_at: string;
};

// รายการสื่ออย่างง่าย (F02) ตัวกรอง ค้นหา และแบ่งหน้าจะเพิ่มใน F04
export default async function MediaListPage() {
  const profile = await requirePermission("media.view");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media_with_state")
    .select("id, episode_no, title, category, live_state, updated_at")
    .is("deleted_at", null) // Admin อ่านแถวที่ถูกลบได้ด้วย ต้องกรองออกเอง
    .order("episode_no", { ascending: true })
    .returns<Row[]>();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">คลังสื่อ</h1>
        <div className="flex gap-2">
          {can(profile.role, "media.delete") ? (
            <Link href="/admin/media/trash" className={btnSecondary}>
              ถังขยะ
            </Link>
          ) : null}
          {can(profile.role, "media.create") ? (
            <Link href="/admin/media/new" className={btnAccent}>
              + เพิ่มสื่อ
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red-strong">
          โหลดรายการไม่สำเร็จ กรุณาลองรีเฟรชหน้า
        </p>
      ) : null}

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ด่าน</th>
              <th className="px-4 py-3 font-medium">ชื่อเรื่อง</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">หมวดหมู่</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">แก้ไขล่าสุด</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((m) => (
              <tr key={m.id} className="border-b border-line transition-colors last:border-0 hover:bg-canvas">
                <td className="px-4 py-3 font-heading text-lg text-navy">{m.episode_no}</td>
                <td className="px-4 py-3">{m.title}</td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{m.category || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${LIVE_STATE_CLASS[m.live_state]}`}
                  >
                    {LIVE_STATE_LABEL[m.live_state]}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted md:table-cell">{formatThaiDateTime(m.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/media/${m.id}`} className="font-medium text-navy underline-offset-2 hover:underline">
                    {can(profile.role, "media.edit") ? "แก้ไข" : "ดู"}
                  </Link>
                </td>
              </tr>
            ))}
            {!error && (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  ยังไม่มีสื่อ กด &ldquo;+ เพิ่มสื่อ&rdquo; เพื่อเริ่มต้น
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
