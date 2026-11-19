"use client";

// ค้นหาด่านและคำถามที่พบบ่อย (UC03) ค้นในเบราว์เซอร์ เพราะข้อมูลมีไม่มาก
import Link from "next/link";
import { useMemo, useState } from "react";
import { inputClass, labelClass } from "@/components/ui/styles";
import { matchesAll, searchTerms } from "@/lib/search";
import { useI18n } from "@/lib/i18n/client";

export type SearchQuest = {
  id: string;
  slug: string;
  episode_no: number;
  title: string;
  description: string | null;
  category: string;
  keywords: string[]; // ชื่อบท + ข้อความเช็กลิสต์ ไว้ให้ค้นเจอ
};

export type SearchFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  episode_no: number | null;
  quest_slug: string | null;
};

export default function SearchPanel({
  quests,
  faqs,
  initialQuery,
}: {
  quests: SearchQuest[];
  faqs: SearchFaq[];
  initialQuery: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState(initialQuery);
  const terms = useMemo(() => searchTerms(query), [query]);
  const searching = terms.length > 0;

  const questHits = useMemo(
    () =>
      searching
        ? quests.filter((q) => matchesAll([q.title, q.description, q.category, ...q.keywords], terms))
        : [],
    [quests, terms, searching],
  );
  const faqHits = useMemo(
    () => (searching ? faqs.filter((f) => matchesAll([f.question, f.answer, f.category], terms)) : faqs),
    [faqs, terms, searching],
  );

  function onChange(v: string) {
    setQuery(v);
    try {
      window.history.replaceState(null, "", v.trim() ? `?q=${encodeURIComponent(v.trim())}` : window.location.pathname);
    } catch {
      /* ไม่เป็นไร แค่ไม่อัปเดตลิงก์ */
    }
  }

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className={labelClass}>
          {t.search.label}
        </label>
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.search.placeholder}
          className={`${inputClass} min-h-12 text-lg`}
          autoComplete="off"
        />
        <p className="mt-2 text-sm text-muted">{t.search.hint}</p>
      </form>

      <p className="sr-only" role="status" aria-live="polite">
        {searching ? t.search.status(questHits.length, faqHits.length) : ""}
      </p>

      {searching ? (
        <section aria-labelledby="res-quests" className="mt-10">
          <h2 id="res-quests" className="section-title text-xl">
            {t.search.relatedLevels(questHits.length)}
          </h2>
          {questHits.length === 0 ? (
            <p className="mt-3 text-muted">{t.search.noLevel(query.trim())}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {questHits.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/quest/${q.slug}`}
                    className="block rounded-lg border border-line bg-surface p-5 transition hover:border-navy hover:shadow-md"
                  >
                    <span className="text-sm font-semibold text-peri-strong">
                      {t.grid.level(q.episode_no)}
                      {q.category ? ` · ${q.category}` : ""}
                    </span>
                    <span className="mt-1 block font-medium text-navy">{q.title}</span>
                    {q.description ? (
                      <span className="mt-1 line-clamp-2 block text-sm text-muted">{q.description}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="res-faq" className="mt-10">
        <h2 id="res-faq" className="section-title text-xl">
          {t.search.faq(searching ? faqHits.length : null)}
        </h2>
        {faqHits.length === 0 ? (
          <p className="mt-3 text-muted">
            {searching ? t.search.noFaq(query.trim()) : t.search.emptyFaq}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {faqHits.map((f) => (
              <li key={f.id}>
                <details className="group rounded-lg border border-line bg-surface open:shadow-sm" open={searching && faqHits.length <= 3}>
                  <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3 p-5 font-medium text-navy">
                    <span>{f.question}</span>
                    <span aria-hidden="true" className="mt-0.5 text-xl leading-none text-peri-strong transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-line px-5 pb-5 pt-4 text-ink">
                    <p className="whitespace-pre-line">{f.answer}</p>
                    {f.quest_slug && f.episode_no ? (
                      <Link
                        href={`/quest/${f.quest_slug}`}
                        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-navy underline underline-offset-4 hover:text-orange-strong"
                      >
                        {t.search.inLevel(f.episode_no)}
                      </Link>
                    ) : null}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
