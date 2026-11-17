import Link from "next/link";
import { notFound } from "next/navigation";
import MediaForm, { type MediaFormInitial } from "@/components/admin/MediaForm";
import { DeleteMediaButton } from "@/components/admin/MediaRowActions";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "แก้ไขสื่อ | FRESHY QUEST" };

type Row = MediaFormInitial & { id: string; deleted_at: string | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission("media.view");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: media } = await supabase.from("media").select("*").eq("id", id).maybeSingle<Row>();
  if (!media || media.deleted_at) notFound();

  const canEdit = can(profile.role, "media.edit");
  // Editor แก้ได้เฉพาะฉบับร่าง (ฐานข้อมูลและ API บังคับซ้ำ)
  const lockedForEditor = profile.role === "editor" && media.status !== "draft";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/media" className="text-sm text-muted hover:underline">
            ← กลับคลังสื่อ
          </Link>
          <h1 className="text-3xl">
            ด่าน {media.episode_no}: {media.title}
          </h1>
        </div>
        {can(profile.role, "media.delete") ? (
          <DeleteMediaButton id={media.id} title={media.title} />
        ) : null}
      </div>

      {lockedForEditor || !canEdit ? (
        <p className="rounded-lg bg-orange/15 px-4 py-3 text-sm text-ink">
          {lockedForEditor
            ? "สื่อนี้ตั้งเวลาหรือเผยแพร่แล้ว บทบาท Editor แก้ไขได้เฉพาะสื่อที่เป็นฉบับร่าง กรุณาแจ้งผู้ดูแลระบบ (Admin) หากต้องการแก้ไข"
            : "บัญชีนี้ไม่มีสิทธิ์แก้ไขสื่อ"}
        </p>
      ) : (
        <MediaForm mode="edit" initial={media} canPublish={can(profile.role, "media.publish")} />
      )}
    </div>
  );
}
