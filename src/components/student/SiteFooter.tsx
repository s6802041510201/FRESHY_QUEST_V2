import { DotField } from "@/components/ui/Decor";
import { getDict } from "@/lib/i18n/server";
import { CREDIT_ADVISORS, CREDIT_AUTHORS } from "@/lib/site";
import type { Contact } from "@/lib/quest-types";

export default async function SiteFooter({ contacts }: { contacts: Contact[] }) {
  const { t } = await getDict();
  return (
    <footer className="on-dark relative isolate mt-20 overflow-hidden border-t-[3px] border-orange bg-band text-white/90">
      <DotField className="[mask-image:linear-gradient(to_bottom,#000,transparent_80%)]" />
      <span aria-hidden="true" className="decor pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full border-[28px] border-white/5" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact" className="text-lg">
            {t.footer.contacts}
          </h2>
          {contacts.length === 0 ? (
            <p className="mt-4 text-sm text-white/80">{t.footer.noContacts}</p>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm">
              {contacts.map((c) => (
                <li key={`${c.label}|${c.value}`}>
                  <span className="text-white/80">{c.label}: </span>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white underline underline-offset-2 hover:text-cyan"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="font-medium text-white">{c.value}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="footer-credit">
          <h2 id="footer-credit" className="text-lg">
            {t.footer.credit}
          </h2>
          <p className="mt-4 text-sm text-white/90">{t.footer.project} &ldquo;{t.site.projectTitle}&rdquo;</p>
          {CREDIT_AUTHORS.length > 0 ? (
            <p className="mt-2 text-sm text-white/90">{t.footer.authors}: {CREDIT_AUTHORS.join(", ")}</p>
          ) : null}
          {CREDIT_ADVISORS.length > 0 ? (
            <p className="mt-1 text-sm text-white/90">{t.footer.advisors}: {CREDIT_ADVISORS.join(", ")}</p>
          ) : null}
          <p className="mt-2 text-sm text-white/80">{t.site.university}</p>
        </section>

        <section aria-labelledby="footer-note">
          <h2 id="footer-note" className="text-lg">
            {t.footer.note}
          </h2>
          <p className="mt-4 text-sm text-white/90">{t.site.genAiNote}</p>
        </section>
      </div>
    </footer>
  );
}
