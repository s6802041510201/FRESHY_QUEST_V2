import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Mitr } from "next/font/google";
import { DISPLAY_INIT_SCRIPT } from "@/lib/display-prefs";
import { I18nProvider } from "@/lib/i18n/client";
import { getDict } from "@/lib/i18n/server";
import "./globals.css";

// ฟอนต์ตามคู่มือสไตล์ศิลป์: Mitr (หัวข้อ) + IBM Plex Sans Thai (เนื้อหา) ใช้ฟรีตาม Open Font License
const plex = IBM_Plex_Sans_Thai({
  variable: "--font-plex",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: "FRESHY QUEST | มจพ.", description: t.meta.description };
}

// viewport-fit=cover: ให้เมนูล่างบนมือถือเว้นพื้นที่ขอบล่าง (เช่น แถบ home ของ iPhone) ได้ด้วย env(safe-area-inset-bottom)
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang, t } = await getDict();
  return (
    // suppressHydrationWarning: สคริปต์ด้านล่างตั้ง data-text / data-contrast / data-theme บน <html> ก่อน React โหลด
    <html lang={lang} className={`${plex.variable} ${mitr.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-navy"
        >
          {t.site.skip}
        </a>
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
