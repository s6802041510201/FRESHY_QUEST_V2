-- =====================================================================
-- สร้างผู้ใช้หลังบ้าน: ผูกบัญชีใน Supabase Auth เข้ากับบทบาท
--
-- ลำดับการทำ
--   1) รัน schema.sql ให้เสร็จก่อน
--   2) Supabase Dashboard -> Authentication -> Users -> Add user -> Create new user
--      ใส่อีเมลกับรหัสผ่าน และติ๊ก "Auto Confirm User"
--      (รหัสผ่านตั้งในหน้านั้นเอง ไม่ต้องใส่ในไฟล์นี้ และห้ามใส่ไฟล์นี้ขึ้น GitHub)
--   3) แก้อีเมลและชื่อด้านล่างเป็นของจริง แล้ว Run ทีละก้อน
--
-- กติกา: 1 อีเมล = 1 บทบาท (ตาราง profiles ผูก 1:1 กับ auth.users)
--   - Admin   -> เข้าจากประตู "Admin"   ได้เท่านั้น
--   - Teacher -> เข้าจากประตู "Teacher" ได้เท่านั้น (ในฐานข้อมูลชื่อบทบาท editor)
--   ถ้าอยากทดสอบทั้งสองฝั่งต้องสร้าง 2 บัญชี อีเมลต่างกัน
--
-- ข้อควรรู้: ถ้าข้ามขั้นตอนนี้ ล็อกอินจะผ่านแต่ระบบแจ้งว่า "ยังไม่มีสิทธิ์เข้าหลังบ้าน"
-- =====================================================================

-- ก้อน A: ผู้ดูแลระบบ (Admin)
insert into public.profiles (id, email, name, role_id)
select u.id, u.email, 'ชื่อ-นามสกุล Admin', r.id
from auth.users u, public.roles r
where u.email = 'admin@example.com'        -- <- แก้เป็นอีเมลจริง
  and r.name  = 'admin'
on conflict (id) do update
  set name = excluded.name, role_id = excluded.role_id, status = 'active';

-- ก้อน B: ผู้สอน (Teacher = role editor)
insert into public.profiles (id, email, name, role_id)
select u.id, u.email, 'ชื่อ-นามสกุล Teacher', r.id
from auth.users u, public.roles r
where u.email = 'teacher@example.com'      -- <- แก้เป็นอีเมลจริง (คนละอีเมลกับ Admin)
  and r.name  = 'editor'
on conflict (id) do update
  set name = excluded.name, role_id = excluded.role_id, status = 'active';

-- ตรวจผล: ควรเห็นอีเมลที่เพิ่ง Run พร้อมบทบาท (ถ้าไม่มีแถว แปลว่าอีเมลไม่ตรงกับใน Authentication -> Users)
select p.email, p.name, r.name as role, p.status
from public.profiles p
join public.roles r on r.id = p.role_id
order by r.name, p.email;
