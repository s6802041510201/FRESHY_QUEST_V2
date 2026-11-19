// โครงหน้าระหว่างโหลดของหน้าแรก (ใช้กับหน้าที่ไม่มี loading ของตัวเอง) แถบเมนูขาว + ฮีโร่ Navy + การ์ดด่าน
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { getDict } from "@/lib/i18n/server";

export default async function RootLoading() {
  const { t } = await getDict();
  return (
    <div role="status" aria-live="polite" className="flex-1">
      <span className="sr-only">{t.site.loading}</span>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="h-10 w-28" />
        </div>
      </div>
      <div className="bg-band">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <SkeletonBlock className="h-10 w-3/4 max-w-md bg-white/25" />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-lg bg-white/20" />
          <SkeletonBlock className="mt-8 h-40 w-full max-w-md rounded-lg bg-white/15" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonBlock key={i} className="h-56 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
