import Link from "next/link";
import { btnAccent } from "@/components/ui/styles";
import { getDict } from "@/lib/i18n/server";

export default async function StudentNotFound() {
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl">{t.notFound.title}</h1>
      <p className="mt-3 text-muted">{t.notFound.desc}</p>
      <Link href="/" className={`${btnAccent} mt-6`}>
        {t.notFound.home}
      </Link>
    </div>
  );
}
