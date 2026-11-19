// ห้องดูวิดีโอของแต่ละด่าน (UC02, UC04): วิดีโอ + บท + เช็กลิสต์ + แบบฝึก 3 ข้อ + แหล่งข้อมูล + ช่องทางติดต่อ
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuestView from "@/components/student/QuestView";
import { getDict } from "@/lib/i18n/server";
import { getQuestPage } from "@/lib/public-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getQuestPage(slug).catch(() => null);
  const { t } = await getDict();
  return { title: page ? t.meta.questTitle(page.quest.episode_no, page.quest.title) : "FRESHY QUEST" };
}

export default async function QuestPage({ params }: Props) {
  const { slug } = await params;
  const page = await getQuestPage(slug);
  if (!page) notFound();
  return <QuestView quest={page.quest} prev={page.prev} next={page.next} liveIds={page.liveIds} />;
}
