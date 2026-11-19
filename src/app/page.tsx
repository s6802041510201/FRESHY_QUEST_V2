// หน้าแรก Quest Map (UC01): ส่วนหัว + ความคืบหน้า + การ์ดด่านตามลำดับ playlist หน้าแรก
import Link from "next/link";
import HeroProgress from "@/components/student/HeroProgress";
import QuestGrid from "@/components/student/QuestGrid";
import StudentShell from "@/components/student/StudentShell";
import { HeroArt } from "@/components/ui/Decor";
import { btnAccent } from "@/components/ui/styles";
import { getDict } from "@/lib/i18n/server";
import { getHomeSummaries } from "@/lib/public-data";

// หน้านี้อยู่ที่ src/app/page.tsx (นอกกลุ่ม (student)) จึงต้องห่อด้วย StudentShell และกำหนด dynamic เอง
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { t } = await getDict();
  // ไม่ throw เมื่อโหลดไม่ได้ เพราะหน้านี้อยู่นอก error boundary ของกลุ่ม (student) แสดงข้อความในหน้าแทน
  const quests = await getHomeSummaries().catch(() => null);

  return (
    <StudentShell>
      {quests === null ? (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl">{t.home.loadFailed}</h1>
          <p className="mt-3 text-muted">{t.home.loadFailedHint}</p>
          <Link href="/" prefetch={false} className={`${btnAccent} mt-6`}>
            {t.home.retry}
          </Link>
        </div>
      ) : (
        <HomeContent quests={quests} t={t} />
      )}
    </StudentShell>
  );
}

function HomeContent({
  quests,
  t,
}: {
  quests: Awaited<ReturnType<typeof getHomeSummaries>>;
  t: Awaited<ReturnType<typeof getDict>>["t"];
}) {
  const totalSec = quests.reduce((n, q) => n + (q.duration_sec ?? 0), 0);
  const facts: { label: string; value: string }[] = [
    { label: t.home.factLevels, value: t.home.factLevelsValue(quests.length) },
    ...(totalSec > 0
      ? [{ label: t.home.factTime, value: t.home.factTimeValue(Math.max(1, Math.round(totalSec / 60))) }]
      : []),
    { label: t.home.factAccess, value: t.home.factAccessValue },
  ];
  return (
    <>
      <section className="on-dark relative isolate overflow-hidden bg-band text-white" aria-labelledby="hero-title">
        <HeroArt />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:items-center md:py-16">
          <div>
            <p className="inline-flex items-center gap-3 text-sm font-medium text-white/85">
              <span aria-hidden="true" className="h-0.5 w-8 bg-orange" />
              {t.site.tagline}
            </p>
            <h1 id="hero-title" className="mt-4 text-4xl md:text-5xl">
              {t.home.heroWords.map((w, i) => (
                <span key={w}>
                  {i > 0 ? " " : ""}
                  <span className="whitespace-nowrap">{w}</span>
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">{t.home.heroDesc}</p>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/20 pt-6">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-white/75">{f.label}</dt>
                  <dd className="mt-0.5 font-medium text-white">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroProgress quests={quests} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="section-title text-2xl">{t.home.allLevels}</h2>
          <Link href="/quests" className="text-sm font-medium text-navy underline underline-offset-4 hover:text-orange-strong">
            {t.home.byCategory}
          </Link>
        </div>
        <QuestGrid quests={quests} />
      </div>
    </>
  );
}
