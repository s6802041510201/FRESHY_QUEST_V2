import LogoutButton from "@/components/admin/LogoutButton";
import { NAV_ITEMS } from "@/components/admin/nav";
import NavLinks from "@/components/admin/NavLinks";
import { requireProfile } from "@/lib/auth";
import { can, ROLE_LABEL } from "@/lib/permissions";

// กลุ่มหน้าที่ต้องล็อกอิน: ตรวจซ้ำที่นี่ (ไม่พึ่ง proxy.ts อย่างเดียว) และตรวจบทบาทที่ใช้งานได้จริง
// เมนูข้าง Navy (คอมพิวเตอร์) / แถบบน Navy เลื่อนซ้ายขวาได้ (มือถือ)
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = NAV_ITEMS.filter((i) => i.permission === null || can(profile.role, i.permission)).map(
    ({ href, label, ready }) => ({ href, label, ready }),
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="on-dark bg-navy p-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto">
        <div className="flex items-center justify-between md:block">
          <div>
            <p className="font-heading text-2xl tracking-wide text-white">
              FRESHY <span className="text-orange">QUEST</span>
            </p>
            <p className="text-xs text-white/75">ระบบจัดการเนื้อหา</p>
          </div>
        </div>

        <div className="mt-4">
          <NavLinks items={items} />
        </div>

        <div className="mt-4 space-y-2 border-t border-white/15 pt-4 md:mt-8">
          <p className="truncate text-sm font-medium text-white">{profile.name}</p>
          <p className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white">
            {ROLE_LABEL[profile.role]}
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
