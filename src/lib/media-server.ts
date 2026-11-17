// ตรรกะฝั่งเซิร์ฟเวอร์ของสื่อ: แปลงข้อมูลจากฟอร์มเป็นแถวในฐานข้อมูล + แปลง error เป็นข้อความไทย
// ใช้ใน Route Handler เท่านั้น
import type { RoleName } from "@/lib/permissions";
import type { MediaInput } from "@/lib/validators";

export type ExistingMedia = {
  status: "draft" | "scheduled" | "published";
  publish_at: string | null;
  deleted_at: string | null;
};

type SupabaseLikeError = { code?: string; message?: string; details?: string | null } | null;

/**
 * สร้างแถวที่จะบันทึก
 * - Editor: ไม่ส่ง status/publish_at/unpublish_at เลย (ฐานข้อมูลบังคับเป็นฉบับร่างอยู่แล้ว)
 * - Admin: คำนวณ status จาก action
 *     draft        -> ฉบับร่าง
 *     publish_now  -> เผยแพร่ (ถ้าเคยเผยแพร่แล้วคงเวลาเริ่มเดิมไว้)
 *     schedule     -> ถ้าเวลาเริ่มอยู่ในอนาคต = scheduled ถ้าเป็นอดีต = published
 * คืน { error } ถ้าข้อมูลการเผยแพร่ไม่สมเหตุสมผล
 */
export function buildMediaRow(
  input: MediaInput,
  role: RoleName,
  existing: ExistingMedia | null,
  now: Date = new Date(),
): { row: Record<string, unknown> } | { error: string } {
  const content = {
    episode_no: input.episode_no,
    slug: input.slug,
    title: input.title,
    description: input.description,
    category: input.category,
    video_169_path: input.video_169_path,
    video_916_path: input.video_916_path,
    subtitle_path: input.subtitle_path,
    cover_path: input.cover_path,
    duration_sec: input.duration_sec,
    chapters: input.chapters,
    checklist: input.checklist,
    quiz: input.quiz,
    sources: input.sources,
    contacts: input.contacts,
  };

  if (role !== "admin") {
    return { row: content };
  }

  const unpublishAt = input.unpublish_at;
  let status: "draft" | "scheduled" | "published";
  let publishAt: string | null;

  if (input.action === "draft") {
    status = "draft";
    publishAt = input.publish_at;
  } else if (input.action === "publish_now") {
    status = "published";
    publishAt =
      existing?.status === "published" && existing.publish_at
        ? existing.publish_at
        : now.toISOString();
  } else {
    if (!input.publish_at) return { error: "กรุณาระบุเวลาเริ่มเผยแพร่เมื่อเลือกตั้งเวลา" };
    publishAt = input.publish_at;
    status = new Date(publishAt) > now ? "scheduled" : "published";
  }

  if (status !== "draft") {
    if (!input.video_169_path && !input.video_916_path) {
      return {
        error:
          "ต้องมีไฟล์วิดีโออย่างน้อย 1 ไฟล์ก่อนเผยแพร่ (ตอนนี้กรอกชื่อไฟล์เองได้ หรือรอปุ่มอัปโหลดในขั้น F03)",
      };
    }
  }
  if (unpublishAt && publishAt && new Date(unpublishAt) <= new Date(publishAt)) {
    return { error: "เวลาหยุดเผยแพร่ต้องอยู่หลังเวลาเริ่มเผยแพร่" };
  }

  return {
    row: { ...content, status, publish_at: publishAt, unpublish_at: unpublishAt },
  };
}

/** แปลง error จาก Supabase/Postgres เป็นข้อความไทย + HTTP status */
export function mapDbError(error: SupabaseLikeError): { message: string; status: number } {
  const msg = `${error?.message ?? ""} ${error?.details ?? ""}`;
  switch (error?.code) {
    case "23505":
      if (msg.includes("media_episode_no_uq"))
        return { message: "เลขด่านนี้ถูกใช้แล้ว กรุณาเลือกเลขอื่น", status: 409 };
      if (msg.includes("media_slug_uq"))
        return { message: "Slug นี้ถูกใช้แล้ว กรุณาตั้งชื่อใหม่", status: 409 };
      return { message: "ข้อมูลซ้ำกับรายการที่มีอยู่", status: 409 };
    case "23514":
      if (msg.includes("media_not_draft_needs_video_ck"))
        return { message: "ต้องมีไฟล์วิดีโออย่างน้อย 1 ไฟล์ก่อนเผยแพร่", status: 400 };
      if (msg.includes("media_publish_window_ck"))
        return { message: "เวลาหยุดเผยแพร่ต้องอยู่หลังเวลาเริ่มเผยแพร่", status: 400 };
      if (msg.includes("media_not_draft_needs_date_ck"))
        return { message: "ต้องระบุเวลาเริ่มเผยแพร่", status: 400 };
      return { message: "ข้อมูลไม่ผ่านเงื่อนไขของระบบ กรุณาตรวจอีกครั้ง", status: 400 };
    case "42501":
      // มาจาก trigger (Editor) หรือ RLS
      return {
        message: error?.message?.includes("Editor")
          ? error.message
          : "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้",
        status: 403,
      };
    default:
      return { message: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", status: 500 };
  }
}
