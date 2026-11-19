// ค้นหา / FAQ (UC03): ค้นด่านและคำถามที่พบบ่อย พร้อมช่องทางติดต่อหน่วยงาน
import type { Metadata } from "next";
import StudentPageHeader from "@/components/student/PageHeader";
import SearchPanel from "@/components/student/SearchPanel";
import { cardClass } from "@/components/ui/styles";
import { getDict } from "@/lib/i18n/server";
import { getAllContacts, getFaqs, getLiveQuests } from "@/lib/public-data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).t.meta.search };
}

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const initialQuery = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.slice(0, 100) ?? "";

  const [quests, faqs, contacts, { t }] = await Promise.all([getLiveQuests(), getFaqs(), getAllContacts(), getDict()]);
  const byId = new Map(quests.map((q) => [q.id, q]));

  return (
    <>
      <StudentPageHeader
        width="max-w-3xl"
        title={t.searchPage.title}
        description={t.searchPage.desc}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

      <SearchPanel
        initialQuery={initialQuery}
        quests={quests.map((q) => ({
          id: q.id,
          slug: q.slug,
          episode_no: q.episode_no,
          title: q.title,
          description: q.description,
          category: q.category,
          keywords: [...q.chapters.map((c) => c.title), ...q.checklist.map((c) => c.text)],
        }))}
        faqs={faqs.map((f) => {
          const q = f.media_id ? byId.get(f.media_id) : undefined;
          return {
            id: f.id,
            question: f.question,
            answer: f.answer,
            category: f.category,
            episode_no: q?.episode_no ?? null,
            quest_slug: q?.slug ?? null,
          };
        })}
      />

      <section aria-labelledby="contact-title" className={`${cardClass} mt-12 p-6`}>
        <h2 id="contact-title" className="section-title text-xl">
          {t.searchPage.contactTitle}
        </h2>
        {contacts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.searchPage.noContacts}</p>
        ) : (
          <ul className="mt-4 space-y-2.5 text-sm">
            {contacts.map((c) => (
              <li key={`${c.label}|${c.value}`}>
                <span className="text-muted">{c.label}: </span>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-navy underline underline-offset-2 hover:text-orange-strong"
                  >
                    {c.value}
                  </a>
                ) : (
                  <span className="font-medium text-ink">{c.value}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </>
  );
}
