-- =====================================================================
-- FRESHY QUEST — schema.sql  (ฉบับปรับปรุง v2 สำหรับ Supabase / PostgreSQL)
--
-- วิธีใช้:
--   Supabase Dashboard -> SQL Editor -> New query -> วางทั้งไฟล์ -> กด Run
--   ใช้ครั้งเดียวกับโปรเจกต์ใหม่ที่ยังว่าง
--   ถ้าต้องล้างเริ่มใหม่ ให้ดูส่วน RESET ท้ายไฟล์
--
-- สัญลักษณ์ในคอมเมนต์:
--   [ต่างจากเดิม]  = จุดที่ไม่ตรงกับเอกสารออกแบบต้นฉบับ (เอกสารหน้า 10)
--   [เพิ่มเอง]     = ผมเสนอเพิ่มนอกเหนือจากที่ระบุ ตัดออกได้ถ้าไม่เอา
--   [รอยืนยัน]     = ยังไม่มีคำตัดสินจากผู้จัดทำ ใส่ค่าเริ่มต้นไว้ก่อน
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0) ชนิดข้อมูลแบบ enum
-- ---------------------------------------------------------------------

-- สถานะของสื่อ (ตามที่ตัดสินใจ: draft / scheduled / published)
create type public.media_status as enum ('draft', 'scheduled', 'published');
-- สถานะผู้ใช้ (ใช้งาน / ระงับ ตามหน้าจอหน้า 8)
create type public.user_status  as enum ('active', 'suspended');
-- เหตุการณ์รับชม: เริ่มดู / ดูจบ
create type public.view_event   as enum ('start', 'end');
-- อัตราส่วนไฟล์วิดีโอที่เล่น  [ต่างจากเดิม] เดิมชื่อฟิลด์ device (169/916) แต่ค่าจริงคือไฟล์ที่เล่น ไม่ใช่อุปกรณ์
create type public.video_ratio  as enum ('16_9', '9_16');


-- ---------------------------------------------------------------------
-- 1) roles : บทบาท
-- ---------------------------------------------------------------------
create table public.roles (
  id          smallint generated always as identity primary key,
  name        text    not null unique check (name in ('admin', 'editor')),
  -- ปิดบทบาทได้ง่าย: ตั้ง is_enabled = false แล้วผู้ใช้บทบาทนั้นจะเข้า CMS ไม่ได้ทันที
  is_enabled  boolean not null default true,
  description text
);
comment on table  public.roles            is 'บทบาทในระบบหลังบ้าน (admin, editor) ส่วนนักศึกษาไม่มีบัญชีจึงไม่อยู่ในตารางนี้';
comment on column public.roles.is_enabled is 'false = ปิดบทบาทนี้ ผู้ใช้ที่มีบทบาทนี้จะไม่มีสิทธิ์ใดๆ ใน CMS';
-- [ต่างจากเดิม] ตัดคอลัมน์ permissions jsonb ออก
-- ตารางสิทธิ์ให้ยึดไฟล์ src/lib/permissions.ts + นโยบาย RLS ด้านล่างเป็นที่เดียว กันสิทธิ์สองที่ไม่ตรงกัน

insert into public.roles (name, description) values
  ('admin',  'ผู้ดูแลระบบ: ทำได้ทุกอย่างใน CMS'),
  ('editor', 'ผู้แก้ไขเนื้อหา: เพิ่ม/แก้สื่อและบันทึกฉบับร่าง ดูสถิติได้ ลบ/เผยแพร่/จัด Playlist/จัดการผู้ใช้ไม่ได้');


-- ---------------------------------------------------------------------
-- 2) profiles : ข้อมูลผู้ใช้หลังบ้าน
-- [ต่างจากเดิม] เดิมคือตาราง users ที่มี password_hash
-- ใช้ Supabase Auth จึงไม่เก็บรหัสผ่านเอง (อยู่ใน auth.users) ตารางนี้เก็บเฉพาะชื่อ บทบาท สถานะ
-- ---------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '',
  role_id    smallint not null references public.roles (id),
  status     public.user_status not null default 'active',
  created_at timestamptz not null default now()
);
create index profiles_role_id_idx on public.profiles (role_id);
comment on table  public.profiles       is 'ผู้ใช้หลังบ้าน (Admin/Editor) ผูก 1:1 กับ auth.users ของ Supabase Auth';
comment on column public.profiles.email is 'สำเนาอีเมลจาก auth.users ไว้แสดงรายชื่อ (ถ้าเปลี่ยนอีเมลต้องแก้ทั้งสองที่)';


-- ---------------------------------------------------------------------
-- 3) ฟังก์ชันช่วยตรวจสิทธิ์ (ใช้ในนโยบาย RLS และ trigger)
-- ---------------------------------------------------------------------
-- คืนชื่อบทบาทของผู้ที่ล็อกอินอยู่ หรือ null ถ้า: ไม่ได้ล็อกอิน / ไม่มีโปรไฟล์ / ถูกระงับ / ปิดบทบาทนั้นอยู่
create or replace function public.current_role_name()
returns text
language sql stable security definer set search_path = ''
as $$
  select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = (select auth.uid())
    and p.status = 'active'
    and r.is_enabled
$$;
comment on function public.current_role_name() is 'ชื่อบทบาทของผู้ล็อกอิน (null ถ้าไม่มีสิทธิ์/ถูกระงับ/ปิดบทบาท)';

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_role_name() = 'admin', false) $$;

create or replace function public.is_staff()  -- admin หรือ editor
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(public.current_role_name() in ('admin', 'editor'), false) $$;


-- ---------------------------------------------------------------------
-- 4) media : สื่อวิดีโอ 1 แถวต่อ 1 ด่าน (มีไฟล์ทั้ง 16:9 และ 9:16 ในแถวเดียวกัน)
-- ---------------------------------------------------------------------
create table public.media (
  id              uuid primary key default gen_random_uuid(),
  episode_no      int  not null check (episode_no > 0),        -- เลขด่าน แสดงเป็น "ด่าน N"
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- [เพิ่มเอง] ใช้ใน URL เช่น /quest/icit (หน้า 6 ใช้ slug แต่เอกสารไม่มีฟิลด์)
  title           text not null,
  description     text,
  category        text not null default '',                    -- หมวดหมู่ เช่น "ระบบและบัญชี"

  -- [ต่างจากเดิม] เก็บ "path ในบัคเก็ต" แทน URL เต็ม แล้วสร้าง URL ในโค้ดจากตัวแปร NEXT_PUBLIC_VIDEO_BASE_URL
  -- ข้อดี: ถ้าย้ายไฟล์วิดีโอไปที่เก็บอื่นภายหลัง แก้แค่ตัวแปรเดียว ไม่ต้องแก้ข้อมูลทุกแถว
  video_169_path  text,                                        -- เช่น videos/EP01_ICIT_169_v1.mp4
  video_916_path  text,                                        -- เช่น videos/EP01_ICIT_916_v1.mp4
  subtitle_path   text,                                        -- ไฟล์ .vtt
  cover_path      text,                                        -- ภาพปก .jpg
  duration_sec    int  check (duration_sec >= 0),

  -- เนื้อหาเสริมของแต่ละด่าน เก็บเป็น jsonb (ตามที่ตัดสินใจ) รูปแบบข้อมูลอยู่ในคอมเมนต์ท้ายตาราง
  sources         jsonb not null default '[]' check (jsonb_typeof(sources)   = 'array'),
  contacts        jsonb not null default '[]' check (jsonb_typeof(contacts)  = 'array'),  -- [เพิ่มเอง] กล่อง "ติดต่อ" ในหน้า 6
  chapters        jsonb not null default '[]' check (jsonb_typeof(chapters)  = 'array'),
  checklist       jsonb not null default '[]' check (jsonb_typeof(checklist) = 'array'),
  quiz            jsonb not null default '[]' check (jsonb_typeof(quiz)      = 'array'),

  status          public.media_status not null default 'draft',
  publish_at      timestamptz,                                 -- เริ่มเผยแพร่ (ตั้งเวลาที่ระดับสื่อ ตามที่ตัดสินใจ)
  unpublish_at    timestamptz,                                 -- หยุดเผยแพร่
  deleted_at      timestamptz,                                 -- soft delete: มีค่า = ถูกลบ (กู้คืนโดยตั้งเป็น null)

  created_by      uuid references public.profiles (id) on delete set null,
  updated_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- กฎความถูกต้องของข้อมูล [เพิ่มเอง]
  constraint media_publish_window_ck
    check (unpublish_at is null or publish_at is null or unpublish_at > publish_at),
  constraint media_not_draft_needs_date_ck
    check (status = 'draft' or publish_at is not null),        -- scheduled/published ต้องมีวันเริ่มเผยแพร่เสมอ
  constraint media_not_draft_needs_video_ck
    check (status = 'draft' or video_169_path is not null or video_916_path is not null)  -- เผยแพร่ต้องมีวิดีโออย่างน้อย 1 ไฟล์
);

-- เลขด่านและ slug ต้องไม่ซ้ำ (นับเฉพาะแถวที่ยังไม่ถูกลบ)  [รอยืนยัน: ข้อ "ลำดับด่านมี 3 แหล่ง"]
create unique index media_episode_no_uq on public.media (episode_no) where deleted_at is null;
create unique index media_slug_uq       on public.media (slug)       where deleted_at is null;
-- ช่วยให้คำค้นหน้าสาธารณะ (กรองสถานะ + เวลา) เร็ว
create index media_visibility_idx on public.media (status, publish_at) where deleted_at is null;

comment on table  public.media              is 'สื่อวิดีโอ 1 แถวต่อ 1 ด่าน มีทั้งไฟล์ 16:9 และ 9:16';
comment on column public.media.episode_no   is 'เลขด่าน 1-10 ใช้แสดงป้าย "ด่าน N"';
comment on column public.media.status       is 'draft=ฉบับร่าง, scheduled=ตั้งเวลาเผยแพร่ไว้, published=เผยแพร่ ดูกฎการมองเห็นที่นโยบาย media_public_read';
comment on column public.media.publish_at   is 'เวลาเริ่มเผยแพร่ ถ้ากด "บันทึกและเผยแพร่" ทันที ให้แอปใส่เวลาปัจจุบัน';
comment on column public.media.deleted_at   is 'soft delete: ไม่ใช่ null = ถูกลบ ผู้ใช้ทั่วไปมองไม่เห็น เฉพาะ Admin เห็นในหน้าถังขยะและกู้คืนได้';
comment on column public.media.sources      is 'แหล่งข้อมูลทางการ: [{"label":"ICIT","url":"https://...","checked_at":"2569-11-13"}]';
comment on column public.media.contacts     is 'ช่องทางติดต่อ: [{"label":"ICIT Help Center","value":"LINE @icitkmutnb","url":null}]';
comment on column public.media.chapters     is 'บท: [{"time_sec":35,"title":"3 บัญชี"}] เรียงตามเวลา';
comment on column public.media.checklist    is 'เช็กลิสต์ของด่าน: [{"id":"c1","text":"เปิดบัญชีที่ account.kmutnb.ac.th"}] ห้ามเปลี่ยน id ของข้อที่มีอยู่แล้ว เพราะความคืบหน้าของนักศึกษาจำด้วย id';
comment on column public.media.quiz         is 'แบบฝึก 3 ข้อ: [{"id":"q1","question":"...","choices":[{"id":"a","text":"..."}],"answer":"a","explanation":"..."}] ไม่ใช่ข้อสอบวิจัย นักศึกษามองเห็นเฉลยได้';

-- ก่อนบันทึกสื่อ: ใส่ผู้แก้ไข/เวลา และจำกัดสิทธิ์ Editor ที่ระดับฐานข้อมูล
-- (กันกรณีโค้ดหน้าเว็บผิดพลาด Editor ก็ยังเผยแพร่หรือลบไม่ได้)
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

create trigger media_before_write
  before insert or update on public.media
  for each row execute function public.media_before_write();


-- ---------------------------------------------------------------------
-- 5) playlists / playlist_items : รายการเล่น
-- [ต่างจากเดิม] ตัด publish_at / unpublish_at ออกจาก playlists (ตั้งเวลาที่ media แล้ว)
-- playlist ใช้จัดลำดับ และกำหนดว่าชุดไหนแสดงในหน้าแรก (is_home)
-- ---------------------------------------------------------------------
create table public.playlists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  is_home    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- มี playlist หน้าแรกได้ชุดเดียว  [รอยืนยัน: เอกสารต้นฉบับไม่ได้ระบุ]
create unique index playlists_one_home_uq on public.playlists (is_home) where is_home;
comment on table  public.playlists         is 'รายการเล่น ใช้จัดลำดับด่านและเลือกชุดที่แสดงหน้าแรก';
comment on column public.playlists.is_home is 'true = ชุดที่แสดงใน Quest Map หน้าแรก (มีได้ชุดเดียว)';

create table public.playlist_items (
  id          uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  media_id    uuid not null references public.media (id) on delete cascade,
  sort_order  int  not null,
  constraint playlist_items_media_uq unique (playlist_id, media_id),
  -- deferrable: สลับลำดับหลายแถวพร้อมกันได้โดยไม่ชนกฎ unique ระหว่างทาง
  constraint playlist_items_order_uq unique (playlist_id, sort_order) deferrable initially deferred
);
create index playlist_items_media_id_idx on public.playlist_items (media_id);
comment on table public.playlist_items is 'สื่อในแต่ละ playlist และลำดับการแสดง (sort_order น้อยไปมาก)';

create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 6) faqs : คำถามที่พบบ่อย (ตามที่ตัดสินใจ: เพิ่มตาราง faqs)
-- ---------------------------------------------------------------------
create table public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  media_id     uuid references public.media (id) on delete set null,  -- ผูกกับด่านใดด่านหนึ่ง (ไม่บังคับ)
  category     text not null default '',
  sort_order   int  not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index faqs_media_id_idx   on public.faqs (media_id);
create index faqs_published_idx  on public.faqs (sort_order) where is_published;
comment on table public.faqs is 'คำถามที่พบบ่อยในหน้า ค้นหา/FAQ  [รอยืนยัน: สิทธิ์ของ Editor กับ FAQ — ตั้งให้เหมือนสื่อ คือเพิ่ม/แก้ได้แต่เผยแพร่ไม่ได้]';

create or replace function public.faqs_before_write()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if public.current_role_name() = 'editor' then
    if tg_op = 'INSERT' then
      new.is_published := false;          -- Editor เพิ่มได้เฉพาะฉบับร่าง
    elsif new.is_published is distinct from old.is_published then
      raise exception 'บทบาท Editor ไม่มีสิทธิ์เผยแพร่หรือซ่อน FAQ' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger faqs_before_write
  before insert or update on public.faqs
  for each row execute function public.faqs_before_write();


-- ---------------------------------------------------------------------
-- 7) view_logs : บันทึกการรับชม (F09)
-- ---------------------------------------------------------------------
create table public.view_logs (
  id         bigint generated always as identity primary key,
  media_id   uuid not null references public.media (id) on delete cascade,
  event      public.view_event not null,
  ratio      public.video_ratio,               -- [ต่างจากเดิม] เดิมชื่อ device
  created_at timestamptz not null default now()
);
create index view_logs_media_time_idx on public.view_logs (media_id, created_at);
comment on table public.view_logs is 'เหตุการณ์เริ่มดู/ดูจบ แบบไม่ระบุตัวตน';

-- [รอยืนยัน] ถ้าต้องการนับผู้ชมไม่ซ้ำ/เชื่อมกับการวิจัย ให้ปลดคอมเมนต์สองบรรทัดนี้หลังตัดสินใจเรื่อง PDPA
-- alter table public.view_logs add column visitor_id uuid;   -- รหัสสุ่มเก็บในเบราว์เซอร์ ไม่ระบุตัวตน
-- alter table public.view_logs add column position_sec int;  -- ตำแหน่งที่ดูถึง


-- ---------------------------------------------------------------------
-- 8) audit_logs : ประวัติการแก้ไข (F10)  — เขียนอัตโนมัติด้วย trigger ลืมไม่ได้
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles (id) on delete set null,   -- null = ทำผ่านแดชบอร์ด/SQL
  action     text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id  text,
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_time_idx   on public.audit_logs (created_at desc);
create index audit_logs_record_idx on public.audit_logs (table_name, record_id);
comment on table public.audit_logs is 'ประวัติว่าใครแก้อะไรเมื่อใด เขียนโดย trigger เท่านั้น ดูได้เฉพาะ Admin';

create or replace function public.log_audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  else
    v_old := to_jsonb(old);
  end if;

  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce(v_new ->> 'id', v_old ->> 'id'), v_old, v_new);

  return null;  -- trigger แบบ AFTER ไม่ต้องคืนแถว
end;
$$;

create trigger media_audit          after insert or update or delete on public.media          for each row execute function public.log_audit();
create trigger playlists_audit      after insert or update or delete on public.playlists      for each row execute function public.log_audit();
create trigger playlist_items_audit after insert or update or delete on public.playlist_items for each row execute function public.log_audit();
create trigger faqs_audit           after insert or update or delete on public.faqs           for each row execute function public.log_audit();
create trigger profiles_audit       after insert or update or delete on public.profiles       for each row execute function public.log_audit();
create trigger roles_audit          after insert or update or delete on public.roles          for each row execute function public.log_audit();


-- ---------------------------------------------------------------------
-- 9) มุมมอง (view) สำหรับหน้าเว็บ  — ใช้ security_invoker เพื่อให้ RLS ของผู้เรียกมีผล
-- ---------------------------------------------------------------------

-- สถานะจริง ณ ตอนนี้ของแต่ละสื่อ (ไม่ต้องมีงานตั้งเวลา คำนวณตอนอ่าน)  [เพิ่มเอง]
-- หมายเหตุ: m.* จะ "ล็อก" รายการคอลัมน์ ณ ตอนสร้าง view ถ้าเพิ่มคอลัมน์ใน media ภายหลังต้องสร้าง view ใหม่
create view public.media_with_state with (security_invoker = true) as
select
  m.*,
  case
    when m.deleted_at is not null                               then 'deleted'
    when m.status = 'draft'                                     then 'draft'
    when m.publish_at > now()                                   then 'scheduled'
    when m.unpublish_at is not null and m.unpublish_at <= now() then 'expired'
    else 'live'
  end as live_state
from public.media m;
comment on view public.media_with_state is 'สื่อ + live_state (deleted/draft/scheduled/expired/live) ไว้แสดงในตารางคลังสื่อ';

-- ด่านบน Quest Map หน้าแรก: playlist ที่ is_home เรียงตาม sort_order (สื่อที่ยังไม่เผยแพร่ถูก RLS กรองออกเอง)
create view public.home_quest with (security_invoker = true) as
select
  pi.sort_order,
  m.id as media_id,
  m.episode_no,
  m.slug,
  m.title,
  m.cover_path,
  m.duration_sec
from public.playlists p
join public.playlist_items pi on pi.playlist_id = p.id
join public.media m          on m.id = pi.media_id
where p.is_home
order by pi.sort_order;
comment on view public.home_quest is 'รายการด่านของหน้าแรก (สำหรับผู้เข้าชมทั่วไป)';

-- สถิติรายด่าน (F09) เห็นได้เฉพาะ Admin/Editor เพราะ view_logs อ่านได้เฉพาะทีมงาน
-- completion_pct = ดูจบ / เริ่มดู (ถ้าคนเดียวกดดูซ้ำ ตัวเลขอาจเกินจริง จนกว่าจะมี visitor_id)
create view public.media_stats with (security_invoker = true) as
select
  m.id as media_id,
  m.episode_no,
  m.title,
  count(v.id) filter (where v.event = 'start') as starts,
  count(v.id) filter (where v.event = 'end')   as ends,
  case when count(v.id) filter (where v.event = 'start') = 0 then null
       else round(100.0 * count(v.id) filter (where v.event = 'end')
                        / count(v.id) filter (where v.event = 'start'), 1)
  end as completion_pct
from public.media m
left join public.view_logs v on v.media_id = m.id
where m.deleted_at is null
group by m.id;
comment on view public.media_stats is 'จำนวนเริ่มดู/ดูจบและอัตราดูจบรายด่าน';


-- ---------------------------------------------------------------------
-- 10) Row Level Security (RLS) — ใครอ่าน/เขียนอะไรได้
--     เปิด RLS แล้วถ้าไม่มี policy = ปฏิเสธทั้งหมด
-- ---------------------------------------------------------------------
alter table public.roles          enable row level security;
alter table public.profiles       enable row level security;
alter table public.media          enable row level security;
alter table public.playlists      enable row level security;
alter table public.playlist_items enable row level security;
alter table public.faqs           enable row level security;
alter table public.view_logs      enable row level security;
alter table public.audit_logs     enable row level security;

-- roles: คนล็อกอินอ่านได้ (ไว้แสดงชื่อบทบาท) แก้ได้เฉพาะ Admin (เช่น เปิด/ปิด Editor)
create policy roles_read on public.roles for select to authenticated using (true);
create policy roles_admin_update on public.roles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- profiles: อ่านของตัวเอง หรือ Admin อ่านทั้งหมด / เพิ่ม-แก้-ลบได้เฉพาะ Admin
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_admin_insert on public.profiles for insert to authenticated
  with check ((select public.is_admin()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy profiles_admin_delete on public.profiles for delete to authenticated
  using ((select public.is_admin()));

-- media
--  * ใครก็อ่านได้เฉพาะสื่อที่ "กำลังเผยแพร่": ไม่ถูกลบ + ไม่ใช่ draft + ถึงเวลาเริ่ม + ยังไม่ถึงเวลาหยุด
create policy media_public_read on public.media for select to anon, authenticated
  using (
    deleted_at is null
    and status in ('scheduled', 'published')
    and publish_at <= now()
    and (unpublish_at is null or unpublish_at > now())
  );
--  * ทีมงาน (Admin/Editor) อ่านได้ทุกสื่อที่ยังไม่ถูกลบ รวมฉบับร่างและที่ตั้งเวลาไว้
create policy media_staff_read on public.media for select to authenticated
  using ((select public.is_staff()) and deleted_at is null);
--  * Admin อ่านได้ทั้งหมดรวมถังขยะ
create policy media_admin_read_all on public.media for select to authenticated
  using ((select public.is_admin()));
--  * เพิ่ม/แก้ไข: ทีมงาน (ข้อจำกัดของ Editor บังคับโดย trigger media_before_write)
--    แถวที่ถูกลบแล้วแก้ได้เฉพาะ Admin (กู้คืน)
create policy media_staff_insert on public.media for insert to authenticated
  with check ((select public.is_staff()));
create policy media_staff_update on public.media for update to authenticated
  using ((select public.is_staff()) and (deleted_at is null or (select public.is_admin())))
  with check ((select public.is_staff()));
--  * ไม่มี policy delete: ลบจริง (hard delete) ทำไม่ได้จากแอป ให้ใช้ soft delete (deleted_at)
--    ถ้าต้องล้างถาวรเพื่อคืนพื้นที่ ให้ทำใน Supabase Dashboard

-- playlists / playlist_items: ทุกคนอ่านได้ (หน้าแรกต้องใช้) แก้ได้เฉพาะ Admin
create policy playlists_read on public.playlists for select to anon, authenticated using (true);
create policy playlists_admin_write on public.playlists for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy playlist_items_read on public.playlist_items for select to anon, authenticated using (true);
create policy playlist_items_admin_write on public.playlist_items for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- faqs: ทุกคนอ่านเฉพาะที่เผยแพร่ ทีมงานอ่านได้ทั้งหมด ทีมงานเพิ่ม/แก้ได้ Admin ลบได้
create policy faqs_public_read on public.faqs for select to anon, authenticated using (is_published);
create policy faqs_staff_read on public.faqs for select to authenticated using ((select public.is_staff()));
create policy faqs_staff_insert on public.faqs for insert to authenticated with check ((select public.is_staff()));
create policy faqs_staff_update on public.faqs for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy faqs_admin_delete on public.faqs for delete to authenticated using ((select public.is_admin()));

-- view_logs: ใครก็เพิ่มได้ (นักศึกษาไม่ต้องล็อกอิน) อ่านได้เฉพาะทีมงาน
-- ข้อควรระวัง: เปิดให้เขียนได้โดยไม่ล็อกอิน ควรจำกัดอัตราที่ route /api/views กันคนยิงข้อมูลขยะ
create policy view_logs_insert on public.view_logs for insert to anon, authenticated
  with check (true);
create policy view_logs_staff_read on public.view_logs for select to authenticated
  using ((select public.is_staff()));

-- audit_logs: อ่านได้เฉพาะ Admin ไม่มี policy เขียน (เขียนผ่าน trigger แบบ security definer เท่านั้น)
create policy audit_logs_admin_read on public.audit_logs for select to authenticated
  using ((select public.is_admin()));


-- ---------------------------------------------------------------------
-- 11) Storage: บัคเก็ต "media"
--     ตั้งขีดจำกัดฝั่งเซิร์ฟเวอร์ 50 MB/ไฟล์ และจำกัดชนิดไฟล์ ซ้อนกับการตรวจฝั่งผู้ใช้
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media',
  true,                                   -- อ่านผ่าน URL สาธารณะได้ (ไม่ต้องล็อกอิน)
  52428800,                               -- 50 MB = 50 x 1024 x 1024 ไบต์
  array['video/mp4', 'text/vtt', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ทีมงานอัปโหลดและดูรายการไฟล์ได้
create policy media_bucket_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_staff()));
create policy media_bucket_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_staff()));
-- ลบไฟล์ได้เฉพาะ Admin (Editor ใช้ชื่อไฟล์ใหม่ทุกครั้งที่อัปโหลดเวอร์ชันใหม่ แล้ว Admin ลบไฟล์เก่าเพื่อคืนโควตา 1 GB)
create policy media_bucket_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));


-- ---------------------------------------------------------------------
-- 12) ข้อมูลตั้งต้น
-- ---------------------------------------------------------------------
-- playlist หน้าแรก (ชื่อตามตัวอย่างหน้า 8 แก้ชื่อได้ภายหลัง)
insert into public.playlists (name, is_home) values ('ปฐมนิเทศ 2570', true);

-- สร้างผู้ดูแลคนแรก: ทำหลังสร้างผู้ใช้ใน Authentication -> Users แล้ว (ดูขั้นตอนในเอกสาร)
-- insert into public.profiles (id, email, name, role_id)
-- select u.id, u.email, 'ชื่อ-นามสกุล', r.id
-- from auth.users u, public.roles r
-- where u.email = 'อีเมลของคุณ@example.com' and r.name = 'admin';


-- =====================================================================
-- RESET (ล้างเริ่มใหม่) — อันตราย ลบข้อมูลทั้งหมดของแอป ใช้เมื่อแน่ใจเท่านั้น
-- ปลดคอมเมนต์ทั้งก้อนแล้ว Run
-- =====================================================================
-- drop view  if exists public.media_stats, public.home_quest, public.media_with_state;
-- drop table if exists public.audit_logs, public.view_logs, public.faqs,
--                      public.playlist_items, public.playlists, public.media,
--                      public.profiles, public.roles cascade;
-- drop function if exists public.log_audit(), public.faqs_before_write(), public.set_updated_at(),
--                         public.media_before_write(), public.is_staff(), public.is_admin(),
--                         public.current_role_name();
-- drop type if exists public.media_status, public.user_status, public.view_event, public.video_ratio;
-- drop policy if exists media_bucket_staff_insert on storage.objects;
-- drop policy if exists media_bucket_staff_read   on storage.objects;
-- drop policy if exists media_bucket_admin_delete on storage.objects;
-- ไฟล์ในบัคเก็ต: ลบผ่านหน้า Storage ใน Dashboard (Supabase ไม่ให้ลบแถวใน storage.objects ด้วย SQL)
