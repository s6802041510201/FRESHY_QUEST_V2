// หัวหน้าของหน้าย่อยฝั่งนักศึกษา (หัวข้อทั้งหมด / Checklist / ค้นหา): แถบคั่นด้านบน + หัวข้อ + คำอธิบาย + ลวดลายมุมขวา
import { BandArt } from "@/components/ui/Decor";

export default function StudentPageHeader({
  title,
  description,
  width = "max-w-6xl",
}: {
  title: string;
  description?: string;
  width?: "max-w-6xl" | "max-w-3xl";
}) {
  return (
    <div className="relative isolate overflow-hidden border-b border-line bg-surface">
      <BandArt />
      <div className={`relative mx-auto ${width} px-4 py-8 sm:px-6 md:py-10`}>
        <h1 className="section-title text-3xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-muted">{description}</p> : null}
      </div>
    </div>
  );
}
