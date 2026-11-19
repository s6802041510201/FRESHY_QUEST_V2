-- =====================================================================
-- แพตช์: จำกัดสิทธิ์ Teacher (role "editor") ที่ระดับฐานข้อมูล
--   - สร้างสื่อได้เฉพาะ "ฉบับร่าง" (draft)
--   - แก้ไขได้เฉพาะสื่อที่ยังเป็นฉบับร่าง
--   - เปลี่ยนสถานะ / เวลาเผยแพร่ / ลบ ไม่ได้
--
-- เนื้อหาเหมือนส่วนเดียวกันใน schema.sql ทุกตัวอักษร
-- ใช้เมื่อฐานข้อมูลจริงถูกสร้างจาก schema.sql รุ่นเก่า หรือไม่แน่ใจว่า trigger นี้ถูกติดตั้งแล้ว
-- รันซ้ำได้ปลอดภัย (ไม่ลบข้อมูล ไม่แตะตารางอื่น)
--
-- วิธีรัน: Supabase Dashboard -> SQL Editor -> New query -> วางทั้งไฟล์ -> Run
-- ต้องมี schema.sql รันไปแล้วก่อน (ต้องมีตาราง media และฟังก์ชัน current_role_name)
-- =====================================================================

create or replace function public.media_before_write()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_role text := public.current_role_name();
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := auth.uid();
    if v_role = 'editor' then
      -- Editor สร้างได้เฉพาะฉบับร่าง
      new.status       := 'draft';
      new.publish_at   := null;
      new.unpublish_at := null;
      new.deleted_at   := null;
    end if;
  else
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    -- [ตัดสินใจแล้ว] Editor แก้ได้เฉพาะสื่อที่ยังเป็นฉบับร่าง
    -- (สื่อที่ตั้งเวลา/เผยแพร่แล้วต้องให้ Admin แก้ เพราะการแก้ขึ้นหน้าเว็บทันที)
    if v_role = 'editor' and old.status <> 'draft' then
      raise exception 'บทบาท Editor แก้ไขได้เฉพาะสื่อที่เป็นฉบับร่าง'
        using errcode = '42501';
    end if;
    if v_role = 'editor' and (
         new.status       is distinct from old.status
      or new.publish_at   is distinct from old.publish_at
      or new.unpublish_at is distinct from old.unpublish_at
      or new.deleted_at   is distinct from old.deleted_at
    ) then
      raise exception 'บทบาท Editor ไม่มีสิทธิ์เปลี่ยนสถานะ เวลาเผยแพร่ หรือลบสื่อ'
        using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists media_before_write on public.media;

create trigger media_before_write
  before insert or update on public.media
  for each row execute function public.media_before_write();

-- ตรวจผล: ควรได้ 1 แถว
select tgname from pg_trigger
where tgrelid = 'public.media'::regclass and tgname = 'media_before_write' and not tgisinternal;
