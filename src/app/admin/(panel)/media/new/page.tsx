import AdminPageHeader from "@/components/admin/PageHeader";
import MediaForm, { EMPTY_MEDIA } from "@/components/admin/MediaForm";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const metadata = { title: "เพิ่มสื่อ | FRESHY QUEST" };

export default async function NewMediaPage() {
  const profile = await requirePermission("media.create");
  return (
    <div>
      <AdminPageHeader
        title="เพิ่มสื่อ"
        description="กรอกข้อมูลสื่อใหม่ บันทึกเป็นฉบับร่างก่อน แล้วค่อยเผยแพร่หรือตั้งเวลาเมื่อพร้อม"
        back={{ href: "/admin/media", label: "กลับคลังสื่อ" }}
      />
      <MediaForm mode="create" initial={EMPTY_MEDIA} canPublish={can(profile.role, "media.publish")} />
    </div>
  );
}
