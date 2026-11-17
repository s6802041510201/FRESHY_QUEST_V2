import Link from "next/link";
import { RestoreMediaButton } from "@/components/admin/MediaRowActions";
import { cardClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth";
import { formatThaiDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ถังขยะ | FRESHY QUEST" };

type Row = { id: string; episode_no: number; title: string; deleted_at: string };

// ถังขยะ: เฉพาะ Admin (policy ในฐานข้อมูลก็ให้เฉพาะ Admin อ่านแถวที่ถูกลบได้)
export default async function TrashPage() {
  await requirePermission("media.delete");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media")
    .select("id, episode_no, title, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .returns<Row[]>();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/media" className="text-sm text-muted hover:underline">
          ← กลับคลังสื่อ
        </Link>
        <h1 className="text-3xl">ถังขยะ</h1>
        <p className="text-sm text-muted">
          สื่อที่ถูกลบจะไม่ปรากฏต่อนักศึกษา กู้คืนได้ที่นี่ (ไฟล์ในที่เก็บไฟล์ยังอยู่ ไม่ถูกลบ)
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red-strong">
          โหลดรายการไม่สำเร็จ กรุณาลองรีเฟรชหน้า
        </p>
      ) : null}

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ด่าน</th>
              <th className="px-4 py-3 font-medium">ชื่อเรื่อง</th>
              <th className="px-4 py-3 font-medium">ลบเมื่อ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0 hover:bg-canvas">
                <td className="px-4 py-3 font-heading text-lg text-navy">{m.episode_no}</td>
                <td className="px-4 py-3">{m.title}</td>
                <td className="px-4 py-3 text-muted">{formatThaiDateTime(m.deleted_at)}</td>
                <td className="px-4 py-3 text-right">
                  <RestoreMediaButton id={m.id} />
                </td>
              </tr>
            ))}
            {!error && (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  ถังขยะว่าง
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
