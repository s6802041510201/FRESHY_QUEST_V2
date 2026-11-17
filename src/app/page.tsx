// หน้าแรกของนักศึกษา (Quest Map, UC01) ยังไม่ได้ทำในช่วง 50% (F01–F04 เป็นหลังบ้านทั้งหมด)
export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl">FRESHY QUEST</h1>
        <p className="mt-2 text-muted">เว็บสำหรับนักศึกษาใหม่ มจพ. กำลังพัฒนา</p>
        <a href="/admin" className="mt-6 inline-block text-sm font-medium text-navy underline-offset-2 hover:underline">
          เข้าหลังบ้าน
        </a>
      </div>
    </main>
  );
}
