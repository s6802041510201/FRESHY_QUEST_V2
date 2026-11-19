// GET  /api/admin/media  รายการสื่อ ?q= &state= &category= &sort= &page= (Admin, Teacher ดูได้)
// POST /api/admin/media  สร้างสื่อใหม่ (Admin, Teacher) Teacher (editor ในฐานข้อมูล) สร้างได้เฉพาะฉบับร่าง
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { PAGE_SIZE, parseListParams, totalPages } from "@/lib/media-list";
import { fetchMediaList, fetchMediaSummary } from "@/lib/media-list-server";
import { buildMediaRow, mapDbError } from "@/lib/media-server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { firstIssues, mediaInputSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.view"))
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์ดูรายการสื่อ" }, { status: 403 });

  const params = parseListParams(Object.fromEntries(new URL(request.url).searchParams));
  const supabase = await createClient();
  const [list, summary] = await Promise.all([fetchMediaList(supabase, params), fetchMediaSummary(supabase)]);
  if (list.error) return NextResponse.json({ error: list.error }, { status: 500 });

  return NextResponse.json({
    items: list.rows,
    total: list.total,
    page: params.page,
    pageSize: PAGE_SIZE,
    totalPages: totalPages(list.total),
    counts: summary.counts,
    categories: summary.categories,
  });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (!can(profile.role, "media.create"))
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์เพิ่มสื่อ" }, { status: 403 });

  const parsed = mediaInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: firstIssues(parsed.error) }, { status: 400 });

  // Editor ห้ามเผยแพร่/ตั้งเวลา ต่อให้ส่ง action มาก็ไม่สน
  const built = buildMediaRow(parsed.data, profile.role, null);
  if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("media").insert(built.row).select("id").single();
  if (error) {
    const m = mapDbError(error);
    return NextResponse.json({ error: m.message, field: m.field }, { status: m.status });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
