# FRESHY QUEST (เว็บ + หลังบ้าน CMS)

Next.js (App Router) + Tailwind CSS + Supabase · deploy บน Vercel

## สถานะ

| ช่วง | สถานะ |
|---|---|
| ฐานราก (Supabase client, proxy, สิทธิ์) | เสร็จ |
| F01 เข้า/ออกระบบ, ลืม/ตั้งรหัสผ่านใหม่, เมนูตามบทบาท | เสร็จ (ยังไม่ได้ทดสอบกับ Supabase จริง) |
| F02 จัดการสื่อ, F03 อัปโหลด, F04 คลังสื่อ | ยังไม่ได้ทำ |

## เริ่มใช้งานบน Windows (cmd หรือ PowerShell)

ต้องติดตั้ง Node.js รุ่น LTS ก่อน (ตรวจด้วย `node -v`)

```
cd C:\Users\Admin\Desktop\kmutnb\2_1\pro\project\freshy-quest
npm install
copy .env.local.example .env.local
```

จากนั้นเปิดไฟล์ `.env.local` ด้วย VS Code แล้วใส่ค่าจาก Supabase (ดูขั้นตอนสร้างโปรเจกต์ในเอกสารออกแบบ v2 หัวข้อ (ง) ขั้นที่ 1–4)

```
npm run dev
```

เปิด http://localhost:3000/admin แล้วล็อกอินด้วยบัญชี Admin ที่สร้างไว้ใน Supabase

## ก่อนล็อกอินได้ ต้องทำใน Supabase ให้ครบ

1. รัน `supabase/schema.sql` ใน SQL Editor
2. สร้างผู้ใช้ใน Authentication -> Users (ติ๊ก Auto Confirm User)
3. ผูกผู้ใช้กับบทบาทด้วยคำสั่ง `insert into public.profiles ...` (มีตัวอย่างในเอกสารออกแบบ v2 ขั้นที่ 3)
   ถ้าข้ามข้อ 3 จะล็อกอินผ่านแต่ระบบแจ้งว่า "ยังไม่มีสิทธิ์เข้าหลังบ้าน"

## โครงสร้างที่ทำแล้ว

```
src/
├─ proxy.ts                      ต่ออายุเซสชัน + กันคนไม่ล็อกอินเข้า /admin (Next.js 16 เรียก proxy แทน middleware)
├─ app/
│  ├─ page.tsx                   หน้าแรกชั่วคราว
│  ├─ auth/callback/route.ts     ปลายทางลิงก์ในอีเมลรีเซ็ตรหัสผ่าน
│  ├─ api/auth/{login,logout,forgot-password,reset-password}/route.ts
│  └─ admin/
│     ├─ login · forgot-password · reset-password
│     └─ (panel)/layout.tsx · page.tsx   หน้าที่ต้องล็อกอิน (เมนูตามบทบาท + แดชบอร์ด)
├─ components/admin/             AuthCard, LogoutButton, nav.ts (รายการเมนู)
└─ lib/
   ├─ supabase/{client,server,admin}.ts
   ├─ auth.ts                    getCurrentProfile / requireProfile / requirePermission
   └─ permissions.ts             ตารางสิทธิ์ Admin/Editor ที่เดียว (ต้องตรงกับ RLS ใน schema.sql)
```

## ข้อควรรู้

- `.env.local` มีกุญแจลับ ห้ามขึ้น GitHub (create-next-app ใส่ `.env*` ใน `.gitignore` ให้แล้ว)
- `SUPABASE_SERVICE_ROLE_KEY` ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น (`src/lib/supabase/admin.ts`) ห้ามใส่ตัวแปรขึ้นต้น `NEXT_PUBLIC_`
- โปรเจกต์นี้ปิด `cacheComponents` ใน `next.config.ts` ไว้ (หลังบ้านเป็นหน้า dynamic ทั้งหมด)
- ฟอนต์ IBM Plex Sans Thai โหลดจาก Google Fonts ตอน build ต้องต่ออินเทอร์เน็ต
- อีเมล "ลืมรหัสผ่าน" บน Supabase แพ็กเกจฟรีส่งได้จำกัด ถ้าอีเมลไม่มา ให้ Admin รีเซ็ตรหัสผ่านใน Dashboard
