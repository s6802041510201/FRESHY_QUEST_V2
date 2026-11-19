// กรอบหน้านักศึกษา: ส่วนหัว + เนื้อหา + ส่วนท้าย (ใช้ร่วมกันระหว่างหน้าแรกกับกลุ่ม (student))
import BottomNav from "@/components/student/BottomNav";
import SiteFooter from "@/components/student/SiteFooter";
import SiteHeader from "@/components/student/SiteHeader";
import { getAllContacts } from "@/lib/public-data";

export default async function StudentShell({ children }: { children: React.ReactNode }) {
  // ถ้าโหลดช่องทางติดต่อไม่ได้ ไม่ควรทำให้ทั้งหน้าพัง ส่วนท้ายแสดงว่ายังไม่มีข้อมูลแทน
  const contacts = await getAllContacts().catch(() => []);
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter contacts={contacts} />
      {/* เว้นที่ท้ายหน้าให้เมนูล่างบนมือถือไม่บังส่วนท้าย */}
      <div aria-hidden="true" className="h-16 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      <BottomNav />
    </>
  );
}
