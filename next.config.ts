import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // ปิด Cache Components: หลังบ้านทั้งหมดเป็นหน้า dynamic (อ่านคุกกี้/เซสชัน) ตั้งค่าแบบนี้ง่ายสำหรับมือใหม่
  // ถ้าอยากเปิดภายหลังต้องห่อส่วนที่อ่านคุกกี้ด้วย <Suspense>
  cacheComponents: false,
  // โหมด dev ของ Next 16 บล็อกสคริปต์ถ้าเปิดเว็บจากที่อยู่อื่นนอกจาก localhost (เช่น 127.0.0.1 หรือเลข IP ในวง LAN)
  // ผลคือหน้าโหลดมาได้แต่ปุ่มทุกปุ่มที่ต้องใช้ JavaScript กดแล้วไม่ทำงาน จึงอนุญาตที่อยู่เหล่านี้ไว้ (มีผลเฉพาะ dev)
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
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
