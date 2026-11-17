import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Mitr } from "next/font/google";
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

export const metadata: Metadata = {
  title: "FRESHY QUEST | มจพ.",
  description: "สื่อประชาสัมพันธ์สำหรับนักศึกษาใหม่ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${plex.variable} ${mitr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy"
        >
          ข้ามไปยังเนื้อหาหลัก
        </a>
        {children}
      </body>
    </html>
  );
}
