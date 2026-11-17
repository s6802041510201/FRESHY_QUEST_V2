import MediaForm, { EMPTY_MEDIA } from "@/components/admin/MediaForm";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const metadata = { title: "เพิ่มสื่อ | FRESHY QUEST" };

export default async function NewMediaPage() {
  const profile = await requirePermission("media.create");
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">เพิ่มสื่อ</h1>
      <MediaForm mode="create" initial={EMPTY_MEDIA} canPublish={can(profile.role, "media.publish")} />
    </div>
  );
}
