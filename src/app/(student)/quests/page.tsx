// หัวข้อทั้งหมด: การ์ดทุกด่านที่เปิดอยู่ + ตัวกรองหมวดหมู่
import type { Metadata } from "next";
import StudentPageHeader from "@/components/student/PageHeader";
import QuestGrid from "@/components/student/QuestGrid";
import { getDict } from "@/lib/i18n/server";
import { getAllSummaries } from "@/lib/public-data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).t.meta.quests };
}

export default async function QuestsPage() {
  const [quests, { t }] = await Promise.all([getAllSummaries(), getDict()]);
  return (
    <>
      <StudentPageHeader title={t.questsPage.title} description={t.questsPage.desc} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <QuestGrid quests={quests} showFilter />
      </div>
    </>
  );
}
