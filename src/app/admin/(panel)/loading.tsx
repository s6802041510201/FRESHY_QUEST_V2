// โครงหน้าระหว่างโหลดของหน้าหลังบ้าน (แถบเมนูข้างยังอยู่ แสดงเฉพาะส่วนเนื้อหา)
import { SkeletonBlock } from "@/components/ui/Skeleton";

export default function PanelLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">กำลังโหลด...</span>
      <SkeletonBlock className="h-10 w-56" />
      <SkeletonBlock className="h-5 w-full max-w-xl" />
      <SkeletonBlock className="h-72 w-full rounded-lg" />
    </div>
  );
}
