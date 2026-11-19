"use client";

// ภาพปกของด่าน ถ้ายังไม่มีไฟล์ แสดงตัวแทนเป็นลวดลายเรขาคณิต (สลับ 4 แบบตามเลขด่าน) + เลขด่าน
// เปลี่ยนเป็นภาพจริงได้โดยอัปโหลดภาพปกในหลังบ้าน
import { CoverArt } from "@/components/ui/Decor";
import { useI18n } from "@/lib/i18n/client";
import { publicUrl } from "@/lib/storage";

export default function Cover({
  episodeNo,
  coverPath,
  className = "",
}: {
  episodeNo: number;
  coverPath: string | null;
  className?: string;
}) {
  const { t } = useI18n();
  if (coverPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ภาพจาก Storage ภายนอก
      <img
        src={publicUrl(coverPath)}
        alt=""
        loading="lazy"
        className={`aspect-video w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-video w-full flex-col justify-end overflow-hidden bg-tint p-4 ${className}`}
    >
      <CoverArt episodeNo={episodeNo} />
      <span className="absolute inset-x-0 top-0 h-1 bg-brand" />
      <span className="relative text-sm font-medium text-muted">{t.grid.coverLevel}</span>
      <span className="relative font-heading text-5xl leading-none text-navy">{String(episodeNo).padStart(2, "0")}</span>
    </div>
  );
}
