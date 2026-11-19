"use client";

import { btnAccent } from "@/components/ui/styles";
import { useI18n } from "@/lib/i18n/client";

export default function StudentError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl">{t.home.loadFailed}</h1>
      <p className="mt-3 text-muted">{t.home.loadFailedHintBtn}</p>
      <button type="button" onClick={reset} className={`${btnAccent} mt-6`}>
        {t.home.retry}
      </button>
    </div>
  );
}
