import { cookies } from "next/headers";
import { type Dict, dictFor } from "@/lib/i18n/dict";
import { LANG_COOKIE, type Lang, parseLang } from "@/lib/i18n/lang";

/** ภาษาของผู้ใช้คนนี้ (อ่านจาก cookie) ใช้ใน Server Component เท่านั้น */
export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

export async function getDict(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: dictFor(lang) };
}
