// ดูตัวอย่างหน้านักศึกษาของสื่อชิ้นนี้ (รวมฉบับร่าง/ที่ตั้งเวลา/หมดอายุ) สำหรับ Admin และ Teacher
// อ่านด้วยบัญชีที่ล็อกอิน (RLS ให้ทีมงานเห็นฉบับร่างได้) ความคืบหน้าที่ทดลองอยู่ในหน้านี้เท่านั้น ไม่ถูกบันทึก
import Link from "next/link";
import { notFound } from "next/navigation";
import QuestView from "@/components/student/QuestView";
import { badgeClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth";
import { LIVE_STATE_CLASS, LIVE_STATE_LABEL, type LiveState } from "@/lib/format";
import { toDetail } from "@/lib/quest-types";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ดูตัวอย่าง | FRESHY QUEST" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATE_NOTE: Record<LiveState, string> = {
  draft: "นักศึกษายังมองไม่เห็นหน้านี้ (เป็นฉบับร่าง)",
  scheduled: "นักศึกษายังมองไม่เห็นหน้านี้ จนกว่าจะถึงเวลาที่ตั้งไว้",
  live: "นักศึกษาเห็นหน้านี้อยู่ตอนนี้",
  expired: "นักศึกษามองไม่เห็นหน้านี้แล้ว (เลยเวลาหยุดเผยแพร่)",
  deleted: "สื่อนี้อยู่ในถังขยะ",
};

export default async function PreviewMediaPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("media.view");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("media_with_state")
    .select("*")
    .eq("id", id)
    .maybeSingle<Record<string, unknown> & { live_state: LiveState }>();
  if (!row || row.live_state === "deleted") notFound();

  const quest = toDetail(row);
  const state = row.live_state;

  return (
    <div className="space-y-5">
      <div
        role="region"
        aria-label="โหมดดูตัวอย่าง"
        className="on-dark flex flex-wrap items-center justify-between gap-4 rounded-lg bg-band px-5 py-4 text-white"
      >
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-white">
            โหมดดูตัวอย่าง{" "}
            <span className={`${badgeClass} ml-1 ${LIVE_STATE_CLASS[state]}`}>
              {LIVE_STATE_LABEL[state]}
            </span>
          </p>
          <p className="text-white/85">
            {STATE_NOTE[state]} · แสดงข้อมูลที่บันทึกล่าสุด · สิ่งที่ลองกด (ดูแล้ว เช็กลิสต์ แบบฝึก) ไม่ถูกบันทึกและหายเมื่อปิดหน้านี้
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/media/${id}`}
            className="inline-flex min-h-11 items-center rounded-md bg-white px-4 text-sm font-semibold text-[#1f2b5c] hover:bg-[#eef1fb]"
          >
            ← กลับไปแก้ไข
          </Link>
          {state === "live" ? (
            <a
              href={`/quest/${quest.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-md border border-white/50 px-4 text-sm font-semibold text-white hover:bg-white/10"
            >
              เปิดหน้าจริง ↗
            </a>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-canvas">
        <QuestView quest={quest} prev={null} next={null} liveIds={[quest.id]} preview />
      </div>
    </div>
  );
}
