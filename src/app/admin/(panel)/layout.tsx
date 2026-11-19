import LogoutButton from "@/components/admin/LogoutButton";
import { NAV_ITEMS } from "@/components/admin/nav";
import NavLinks from "@/components/admin/NavLinks";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { requireProfile } from "@/lib/auth";
import { can, ROLE_LABEL } from "@/lib/permissions";
import { SITE_NAME } from "@/lib/site";

// กลุ่มหน้าที่ต้องล็อกอิน: ตรวจซ้ำที่นี่ (ไม่พึ่ง proxy.ts อย่างเดียว) และตรวจบทบาทที่ใช้งานได้จริง
// โครง: แถบบน Navy (ชื่อระบบ + ผู้ใช้ + ออกจากระบบ) · เมนูข้างพื้นขาวแบ่งกลุ่ม · พื้นที่ทำงานพื้นสว่าง
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const items = NAV_ITEMS.filter((i) => i.permission === null || can(profile.role, i.permission)).map(
    ({ href, label, ready, icon, group }) => ({ href, label, ready, icon, group }),
  );
  const [first, ...rest] = SITE_NAME.split(" ");

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <header className="on-dark bg-band text-white">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 md:px-6">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-md bg-white font-heading text-lg text-[#1f2b5c]"
              >
                FQ
              </span>
              <div className="leading-tight">
                <p className="font-heading text-lg text-white">
                  {first} <span className="text-orange-soft">{rest.join(" ")}</span>
                </p>
                <p className="text-xs text-white/75">ระบบจัดการเนื้อหา</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="max-w-[12rem] truncate text-sm font-medium text-white">{profile.name}</p>
                <p className="text-xs text-white/75">{ROLE_LABEL[profile.role]}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col md:flex-row">
          <aside className="border-b border-line bg-surface md:w-72 md:shrink-0 md:border-r md:border-b-0">
            <div className="p-3 md:sticky md:top-0 md:p-5">
              <NavLinks items={items} />
            </div>
          </aside>
          <main id="main" className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
