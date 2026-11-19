import type { Metadata } from "next";
import StudentPageHeader from "@/components/student/PageHeader";
import MyChecklist from "@/components/student/MyChecklist";
import { getDict } from "@/lib/i18n/server";
import { getHomeQuests } from "@/lib/public-data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).t.meta.checklist };
}

export default async function ChecklistPage() {
  const [quests, { t }] = await Promise.all([getHomeQuests(), getDict()]);
  const levels = quests
    .filter((q) => q.checklist.length > 0)
    .map((q) => ({ id: q.id, slug: q.slug, episode_no: q.episode_no, title: q.title, items: q.checklist }));

  return (
    <>
      <StudentPageHeader
        width="max-w-3xl"
        title={t.myChecklist.title}
        description={t.myChecklist.desc}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <MyChecklist levels={levels} allLevelIds={quests.map((q) => q.id)} />
      </div>
    </>
  );
}
