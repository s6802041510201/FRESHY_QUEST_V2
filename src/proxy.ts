// proxy.ts (ชื่อเดิมใน Next.js รุ่นเก่าคือ middleware.ts)
// ทำ 2 อย่างก่อนทุกคำขอที่ตรงกับ matcher:
//  1) ต่ออายุเซสชันของ Supabase (รีเฟรชคุกกี้)
//  2) กันคนที่ยังไม่ล็อกอินไม่ให้เข้า /admin (ยกเว้นหน้าล็อกอินและลืมรหัสผ่าน)
// ข้อควรจำ: นี่เป็นด่านแรกเท่านั้น หน้าและ API ทุกตัวยังต้องตรวจสิทธิ์ซ้ำเอง และ RLS เป็นด่านสุดท้าย
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminPage = path === "/admin" || path.startsWith("/admin/");
  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.includes(path);

  // ยังไม่ล็อกอินแต่เข้าหน้าหลังบ้าน -> ส่งไปหน้าล็อกอิน
  if (isAdminPage && !isPublicAdminPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // รันเฉพาะหลังบ้านและ API/auth ส่วนหน้านักศึกษาไม่ต้องใช้เซสชัน
  matcher: ["/admin/:path*", "/api/:path*", "/auth/:path*"],
};
