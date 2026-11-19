// ก้อนสีเทาเคลื่อนไหวเบา ๆ ใช้เป็นโครงหน้าระหว่างรอข้อมูล (ผู้ที่ตั้งค่าลดการเคลื่อนไหวจะไม่เห็นการกะพริบ ดู globals.css)
export function SkeletonBlock({ className = "" }: { className?: string }) {
  // ถ้าส่งสีพื้นมาเอง (เช่นบนพื้น Navy) ไม่ใส่สีเทาซ้ำ เพราะลำดับคลาส Tailwind ที่ชนกันไม่แน่นอน
  const bg = /(^|\s)bg-/.test(className) ? "" : "bg-line";
  return <div aria-hidden="true" className={`animate-pulse rounded-lg ${bg} ${className}`} />;
}
