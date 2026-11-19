// หัวหน้าของทุกหน้าในหลังบ้าน: ลิงก์ย้อนกลับ (ถ้ามี) · หัวข้อ · คำอธิบาย · ปุ่มการกระทำด้านขวา คั่นด้วยเส้นบาง ๆ
import Link from "next/link";

export default function AdminPageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-1 inline-flex min-h-11 items-center text-sm font-medium text-muted underline-offset-4 hover:text-navy hover:underline"
          >
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
