import StudentShell from "@/components/student/StudentShell";

// หน้านักศึกษาอ่านข้อมูลสดทุกครั้ง เพื่อให้สื่อที่ตั้งเวลาไว้ขึ้น/หายตรงเวลา (ไม่มีงานตั้งเวลา ใช้กฎใน RLS)
export const dynamic = "force-dynamic";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
