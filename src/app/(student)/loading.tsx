// โครงหน้าระหว่างโหลดข้อมูลหน้านักศึกษา (ส่วนหัว/ท้ายของกรอบอยู่ครบแล้ว แสดงเฉพาะส่วนเนื้อหา)
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { getDict } from "@/lib/i18n/server";

export default async function StudentLoading() {
  const { t } = await getDict();
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <span className="sr-only">{t.site.loadingContent}</span>
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-4 h-9 w-2/3" />
      <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <SkeletonBlock className="aspect-video w-full rounded-lg" />
        <div className="space-y-3">
          <SkeletonBlock className="h-6 w-1/2" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
