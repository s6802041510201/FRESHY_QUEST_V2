// สลับภาษาด้วยลิงก์ธรรมดา: /lang?to=en&next=/quests -> ตั้ง cookie ภาษา แล้วกลับไปหน้าเดิม
// ทำเป็น route (ไม่ใช่ปุ่ม JavaScript) เพื่อให้ปุ่มภาษาทำงานได้เสมอ แม้ JavaScript ในหน้ายังโหลดไม่เสร็จหรือถูกบล็อก
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, parseLang } from "@/lib/i18n/lang";

/** รับเฉพาะ path ภายในเว็บเรา (ขึ้นต้นด้วย / ตัวเดียว) กันถูกใช้เป็นตัวส่งต่อไปเว็บอื่น */
function safeNext(v: string | null): string {
  return v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/";
}

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lang = parseLang(searchParams.get("to"));
  const url = request.nextUrl.clone();
  const next = new URL(safeNext(searchParams.get("next")), url);
  url.pathname = next.pathname;
  url.search = next.search;
  url.hash = "";
  const res = NextResponse.redirect(url);
  res.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}
