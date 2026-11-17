// กรอบหน้าล็อกอิน / ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่
// พื้นหลัง Navy พร้อมเส้นกริดเรืองแสงจาง ๆ (Holo Cyan) ตามคู่มือสไตล์ศิลป์ และการ์ดขาวตรงกลาง
import { btnAccent, inputClass as input } from "@/components/ui/styles";

export const inputClass = input;
export const buttonClass = `${btnAccent} w-full`;

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-navy px-4 py-12"
      style={{
        backgroundImage:
          "linear-gradient(rgba(63,198,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(63,198,255,0.08) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
      <main id="main" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-heading text-3xl tracking-wide text-white">
            FRESHY <span className="text-orange">QUEST</span>
          </p>
          <p className="mt-1 text-sm text-white/80">ระบบจัดการเนื้อหา · มจพ.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/10">
          <div className="mb-1 h-1 w-12 rounded-full bg-orange" aria-hidden="true" />
          <h1 className="mt-3 text-2xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
