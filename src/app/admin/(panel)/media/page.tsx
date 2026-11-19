// คลังสื่อ (F04): ค้นหา กรองตามสถานะ/หมวดหมู่ เรียง และแบ่งหน้า
// ตัวกรองทั้งหมดอยู่ใน URL (?q= &state= &category= &sort= &page=) ฟอร์มเป็น GET ธรรมดา ใช้ได้แม้ JavaScript ยังไม่โหลด
import Link from "next/link";
import { redirect } from "next/navigation";
import MediaRowMenu from "@/components/admin/MediaRowMenu";
import AdminPageHeader from "@/components/admin/PageHeader";
import { badgeClass, btnPrimary, btnSecondary, cardClass, inputClass, labelClass } from "@/components/ui/styles";
import { requirePermission } from "@/lib/auth";
import { formatThaiDateTime, LIVE_STATE_CLASS, LIVE_STATE_LABEL } from "@/lib/format";
import {
  listHref,
  PAGE_SIZE,
  pageWindow,
  parseListParams,
  SORT_LABEL,
  SORTS,
  STATE_FILTER_LABEL,
  STATE_FILTERS,
  totalPages,
} from "@/lib/media-list";
import { fetchMediaList, fetchMediaSummary } from "@/lib/media-list-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "คลังสื่อ | FRESHY QUEST" };

const BASE = "/admin/media";

export default async function MediaListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requirePermission("media.view");
  const params = parseListParams(await searchParams);
  const supabase = await createClient();

  const [list, summary] = await Promise.all([fetchMediaList(supabase, params), fetchMediaSummary(supabase)]);
  const pages = totalPages(list.total);

  // ขอหน้าที่เกินจำนวนหน้าจริง (เช่น ลบสื่อแล้วกดย้อนกลับ) -> พาไปหน้าสุดท้ายที่มีข้อมูล
  if (!list.error && list.rows.length === 0 && list.total > 0 && params.page > pages) {
    redirect(listHref(BASE, params, { page: pages }));
  }

  const hasFilters = params.q !== "" || params.state !== "all" || params.category !== "";
  const firstShown = list.total === 0 ? 0 : (params.page - 1) * PAGE_SIZE + 1;
  const lastShown = (params.page - 1) * PAGE_SIZE + list.rows.length;
  const error = list.error ?? summary.error;
  // หมวดที่เลือกอยู่แต่ไม่มีสื่อเหลือในหมวดนั้นแล้ว ยังต้องเห็นในตัวเลือกเพื่อให้ล้างได้
  const categories =
    params.category && !summary.categories.includes(params.category)
      ? [...summary.categories, params.category]
      : summary.categories;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="คลังสื่อ"
        description="ค้นหา กรอง และจัดการสื่อทุกด่านที่นี่ กดที่ชื่อเรื่องหรือเมนูท้ายแถวเพื่อแก้ไข"
        actions={
          <>
            {can(profile.role, "media.delete") ? (
              <Link href="/admin/media/trash" className={btnSecondary}>
                ถังขยะ
              </Link>
            ) : null}
            {can(profile.role, "media.create") ? (
              <Link href="/admin/media/new" className={btnPrimary}>
                + เพิ่มสื่อ
              </Link>
            ) : null}
          </>
        }
      />

      {error ? (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 text-sm text-red-strong">
          {error} กรุณาลองรีเฟรชหน้า
        </p>
      ) : null}

      {/* กรองตามสถานะ (พร้อมจำนวน) */}
      <nav aria-label="กรองตามสถานะ" className="flex flex-wrap gap-2 pt-1">
        {STATE_FILTERS.map((s) => {
          const active = params.state === s;
          return (
            <Link
              key={s}
              href={listHref(BASE, params, { state: s, page: 1 })}
              aria-current={active ? "true" : undefined}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-4 text-sm font-medium ring-1 transition-colors ${
                active ? "bg-brand text-white ring-navy" : "bg-surface text-navy ring-line-strong hover:bg-canvas"
              }`}
            >
              {STATE_FILTER_LABEL[s]}{" "}
              <span className={active ? "text-white/85" : "text-muted"}>({summary.counts[s]})</span>
            </Link>
          );
        })}
      </nav>

      {/* ค้นหา + หมวด + เรียง (ฟอร์ม GET ส่งกลับมาที่หน้านี้) */}
      <form action={BASE} method="get" role="search" className={`${cardClass} grid gap-4 p-5 md:grid-cols-[1fr_12rem_10rem_auto]`}>
        {params.state !== "all" ? <input type="hidden" name="state" value={params.state} /> : null}
        <div>
          <label htmlFor="q" className={labelClass}>
            ค้นหา (ชื่อเรื่อง คำอธิบาย slug หมวดหมู่)
          </label>
          <input id="q" name="q" type="search" defaultValue={params.q} placeholder="พิมพ์คำที่ต้องการ" className={inputClass} />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            หมวดหมู่
          </label>
          <select id="category" name="category" defaultValue={params.category} className={inputClass}>
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={labelClass}>
            เรียงตาม
          </label>
          <select id="sort" name="sort" defaultValue={params.sort} className={inputClass}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className={btnPrimary}>
            ค้นหา
          </button>
          {hasFilters ? (
            <Link href={listHref(BASE, params, { q: "", state: "all", category: "", page: 1 })} className={btnSecondary}>
              ล้าง
            </Link>
          ) : null}
        </div>
      </form>

      <p className="text-sm text-muted" role="status">
        {list.total === 0
          ? hasFilters
            ? "ไม่พบสื่อที่ตรงกับตัวกรอง"
            : "ยังไม่มีสื่อ"
          : `แสดง ${firstShown}–${lastShown} จาก ${list.total} รายการ${hasFilters ? " (ตามตัวกรอง)" : ""}`}
      </p>

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="border-b border-line bg-canvas text-left text-muted">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-semibold">ด่าน</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">ชื่อเรื่อง</th>
              <th scope="col" className="hidden px-5 py-3.5 font-semibold sm:table-cell">หมวดหมู่</th>
              <th scope="col" className="px-5 py-3.5 font-semibold">สถานะ</th>
              <th scope="col" className="hidden px-5 py-3.5 font-semibold md:table-cell">แก้ไขล่าสุด</th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">การจัดการ</span></th>
            </tr>
          </thead>
          <tbody>
            {list.rows.map((m) => (
              <tr key={m.id} className="border-b border-line align-top transition-colors last:border-0 hover:bg-canvas">
                <td className="px-5 py-4 font-heading text-lg text-navy">{m.episode_no}</td>
                <td className="px-5 py-4">
                  <Link href={`/admin/media/${m.id}`} className="font-medium text-navy underline-offset-4 hover:underline">
                    {m.title}
                  </Link>
                  <span className="block text-xs text-muted">/quest/{m.slug}</span>
                </td>
                <td className="hidden px-5 py-4 text-muted sm:table-cell">{m.category || "-"}</td>
                <td className="px-5 py-4">
                  <span className={`${badgeClass} ${LIVE_STATE_CLASS[m.live_state]}`}>
                    {LIVE_STATE_LABEL[m.live_state]}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-5 py-4 text-muted md:table-cell">
                  {formatThaiDateTime(m.updated_at)}
                </td>
                <td className="px-5 py-4 text-right">
                  <MediaRowMenu
                    id={m.id}
                    title={m.title}
                    liveState={m.live_state}
                    canEdit={can(profile.role, "media.edit")}
                    canPublish={can(profile.role, "media.publish")}
                    canCreate={can(profile.role, "media.create")}
                    canDelete={can(profile.role, "media.delete")}
                  />
                </td>
              </tr>
            ))}
            {!error && list.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted">
                  {hasFilters ? (
                    <>
                      ไม่พบสื่อที่ตรงกับตัวกรอง{" "}
                      <Link
                        href={listHref(BASE, params, { q: "", state: "all", category: "", page: 1 })}
                        className="font-medium text-navy underline underline-offset-4"
                      >
                        ล้างตัวกรอง
                      </Link>
                    </>
                  ) : (
                    <>ยังไม่มีสื่อ กด &ldquo;+ เพิ่มสื่อ&rdquo; เพื่อเริ่มต้น</>
                  )}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <nav aria-label="แบ่งหน้า" className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {params.page > 1 ? (
            <Link href={listHref(BASE, params, { page: params.page - 1 })} className={btnSecondary} rel="prev">
              ← ก่อนหน้า
            </Link>
          ) : null}
          {pageWindow(params.page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-2 text-muted">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={listHref(BASE, params, { page: p })}
                aria-label={`หน้า ${p}`}
                aria-current={p === params.page ? "page" : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-center text-sm font-medium ring-1 ${
                  p === params.page ? "bg-brand text-white ring-navy" : "bg-surface text-navy ring-line-strong hover:bg-canvas"
                }`}
              >
                {p}
              </Link>
            ),
          )}
          {params.page < pages ? (
            <Link href={listHref(BASE, params, { page: params.page + 1 })} className={btnSecondary} rel="next">
              ถัดไป →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
