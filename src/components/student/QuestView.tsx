// เนื้อหาหน้าห้องดูวิดีโอของแต่ละด่าน ใช้ร่วมกันระหว่างหน้านักศึกษา (/quest/[slug]) และหน้าดูตัวอย่างของผู้ดูแล
// โหมด preview: ไม่เก็บความคืบหน้าจริง ไม่มีลิงก์ย้อนกลับ/ด่านก่อนหน้า-ถัดไป
import Link from "next/link";
import ChecklistBox from "@/components/student/ChecklistBox";
import QuizBox from "@/components/student/QuizBox";
import WatchRoom from "@/components/student/WatchRoom";
import { cardClass } from "@/components/ui/styles";
import { formatDateOnly, formatDuration } from "@/lib/format";
import { getDict } from "@/lib/i18n/server";
import { PreviewProvider } from "@/lib/preview";
import type { QuestDetail, QuestSummary } from "@/lib/quest-types";

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${cardClass} min-w-0 p-6 md:p-7`}>
      <h2 id={id} className="section-title text-xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function QuestView({
  quest: q,
  prev,
  next,
  liveIds,
  preview = false,
}: {
  quest: QuestDetail;
  prev: QuestSummary | null;
  next: QuestSummary | null;
  liveIds: string[];
  preview?: boolean;
}) {
  const { lang, t } = await getDict();
  const content = (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
      {preview ? null : (
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-navy underline underline-offset-4 hover:text-orange-strong">
          {t.quest.back}
        </Link>
      )}

      <header className={preview ? "mb-8" : "mb-8"}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-brand px-3 py-1 text-sm font-semibold text-white">{t.grid.level(q.episode_no)}</span>
          {q.category ? (
            <span className="rounded-md bg-tint px-3 py-1 text-sm font-medium text-navy">{q.category}</span>
          ) : null}
          {q.duration_sec ? (
            <span className="text-sm text-muted">{t.grid.minutes(formatDuration(q.duration_sec))}</span>
          ) : null}
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl">{q.title}</h1>
        {q.description ? <p className="mt-3 max-w-3xl text-muted">{q.description}</p> : null}
      </header>

      <WatchRoom
        mediaId={q.id}
        episodeNo={q.episode_no}
        title={q.title}
        video169={q.video_169_path}
        video916={q.video_916_path}
        subtitle={q.subtitle_path}
        cover={q.cover_path}
        chapters={q.chapters}
        durationSec={q.duration_sec}
        hasQuiz={q.quiz.length > 0}
        next={next}
        liveIds={liveIds}
      />

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
        {q.checklist.length > 0 ? (
          <Block id="checklist-title" title={t.quest.checklist}>
            <ChecklistBox mediaId={q.id} items={q.checklist} />
          </Block>
        ) : null}

        {q.quiz.length > 0 ? (
          <Block id="quiz-title" title={t.quest.quiz}>
            <QuizBox mediaId={q.id} questions={q.quiz} />
          </Block>
        ) : null}

        {q.sources.length > 0 ? (
          <Block id="sources-title" title={t.quest.sources}>
            <ul className="space-y-2">
              {q.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-navy underline underline-offset-4 hover:text-orange-strong"
                  >
                    {s.label}
                  </a>
                  {s.checked_at ? (
                    <span className="block text-sm text-muted">{t.quest.checkedAt(formatDateOnly(s.checked_at, lang))}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {q.contacts.length > 0 ? (
          <Block id="contacts-title" title={t.quest.contacts}>
            <ul className="space-y-2">
              {q.contacts.map((c) => (
                <li key={`${c.label}|${c.value}`} className="text-sm">
                  <span className="text-muted">{c.label}: </span>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-navy underline underline-offset-4 hover:text-orange-strong"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="font-medium text-ink">{c.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}
      </div>

      {preview ? null : (
        <nav aria-label={t.quest.navLabel} className="mt-10 grid gap-4 sm:grid-cols-2">
          {prev ? (
            <Link href={`/quest/${prev.slug}`} className={`${cardClass} block p-5 transition hover:border-navy hover:shadow-md`}>
              <span className="text-sm text-muted">{t.quest.prev}</span>
              <span className="mt-1 block font-medium text-navy">
                {t.quest.levelTitle(prev.episode_no, prev.title)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/quest/${next.slug}`} className={`${cardClass} block p-5 text-right transition hover:border-navy hover:shadow-md`}>
              <span className="text-sm text-muted">{t.quest.next}</span>
              <span className="mt-1 block font-medium text-navy">
                {t.quest.levelTitle(next.episode_no, next.title)}
              </span>
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
  return preview ? <PreviewProvider>{content}</PreviewProvider> : content;
}
