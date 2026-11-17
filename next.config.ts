import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // ปิด Cache Components: หลังบ้านทั้งหมดเป็นหน้า dynamic (อ่านคุกกี้/เซสชัน) ตั้งค่าแบบนี้ง่ายสำหรับมือใหม่
  // ถ้าอยากเปิดภายหลังต้องห่อส่วนที่อ่านคุกกี้ด้วย <Suspense>
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
