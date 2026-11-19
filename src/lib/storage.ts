// ตัวช่วยที่เก็บไฟล์ (Supabase Storage บัคเก็ต "media") สำหรับ F03
// - ตรวจชนิด/ขนาดไฟล์ในเบราว์เซอร์ก่อนอัปโหลด พร้อมข้อความภาษาไทย
// - ตั้งชื่อไฟล์ตามแบบแผนและเพิ่มเลขเวอร์ชันทุกครั้ง (กัน CDN แคชไฟล์เก่า และไม่เขียนทับไฟล์เดิม)
// - อัปโหลดตรงจากเบราว์เซอร์เข้า Storage ด้วยเซสชันของผู้ใช้ (ไม่ผ่าน API บน Vercel ซึ่งจำกัดขนาด request)
// ฝั่งฐานข้อมูลยังบังคับซ้ำ: บัคเก็ตจำกัด 50 MiB ต่อไฟล์ และจำกัดชนิดไฟล์ (ดู supabase/schema.sql)

export const BUCKET = "media";

/** 50 MiB = 52,428,800 ไบต์ (ตรงกับ file_size_limit ของบัคเก็ต) */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export type SlotKind = "video169" | "video916" | "subtitle" | "cover";

type SlotConfig = {
  label: string;
  folder: string; // โฟลเดอร์ในบัคเก็ต
  suffix: string; // ส่วนท้ายชื่อไฟล์
  extensions: string[]; // นามสกุลที่รับ (พิมพ์เล็ก ไม่มีจุด)
  accept: string; // ค่า accept ของ <input type="file">
  contentType: (ext: string) => string; // Content-Type ที่ส่งไป Storage (ตั้งเองเพราะ .vtt มักได้ชนิดว่าง)
  isVideo: boolean;
};

export const SLOTS: Record<SlotKind, SlotConfig> = {
  video169: {
    label: "วิดีโอ 16:9 (แนวนอน)",
    folder: "videos",
    suffix: "169",
    extensions: ["mp4"],
    accept: ".mp4,video/mp4",
    contentType: () => "video/mp4",
    isVideo: true,
  },
  video916: {
    label: "วิดีโอ 9:16 (แนวตั้ง)",
    folder: "videos",
    suffix: "916",
    extensions: ["mp4"],
    accept: ".mp4,video/mp4",
    contentType: () => "video/mp4",
    isVideo: true,
  },
  subtitle: {
    label: "ไฟล์ซับ (.vtt)",
    folder: "subtitles",
    suffix: "sub",
    extensions: ["vtt"],
    accept: ".vtt,text/vtt",
    contentType: () => "text/vtt",
    isVideo: false,
  },
  cover: {
    label: "ภาพปก",
    folder: "covers",
    suffix: "cover",
    extensions: ["jpg", "jpeg", "png", "webp"],
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    contentType: (ext) => (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"),
    isVideo: false,
  },
};

export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(name: string): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

/** ตรวจไฟล์ก่อนอัปโหลด คืนข้อความผิดพลาดภาษาไทย หรือ null ถ้าผ่าน */
export function validateFile(kind: SlotKind, file: { name: string; size: number; type: string }): string | null {
  const slot = SLOTS[kind];
  const ext = fileExtension(file.name);

  if (!slot.extensions.includes(ext)) {
    return `ช่องนี้รับเฉพาะไฟล์ .${slot.extensions.join(" / .")} แต่ไฟล์ที่เลือกคือ ${ext ? "." + ext : "ไม่ทราบชนิด"}`;
  }
  // บางเครื่องไม่ส่งชนิดไฟล์ (ว่าง) จึงยอมรับค่าว่าง แต่ถ้ามีและเป็นชนิดอื่นที่ชัดเจนให้ปฏิเสธ
  if (slot.isVideo && file.type && file.type !== "video/mp4") {
    return "ไฟล์วิดีโอต้องเป็น MP4 (H.264) เท่านั้น";
  }
  if (file.size === 0) {
    return "ไฟล์นี้ว่างเปล่า (0 ไบต์) กรุณาเลือกไฟล์ใหม่";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const tip = slot.isVideo
      ? "กรุณาบีบไฟล์เป็น 720p ก่อนอัปโหลด (เช่นด้วย HandBrake ตั้ง Constant Quality ราว RF 26–28 หรือบิตเรตประมาณ 1,000 kbps) ไฟล์ 5 นาทีควรได้ประมาณ 41 MB"
      : "กรุณาลดขนาดหรือความละเอียดของไฟล์ก่อนอัปโหลด";
    return `ไฟล์นี้ ${formatMB(file.size)} ใหญ่เกิน 50 MB ที่ระบบรับได้ ${tip}`;
  }
  return null;
}

/**
 * ตั้งชื่อไฟล์ในบัคเก็ต เช่น videos/EP01_icit_169_v2.mp4
 * เลขเวอร์ชันเพิ่มจากไฟล์เดิมในช่องนั้น (ถ้าไม่มีไฟล์เดิมเริ่มที่ v1) ไม่เขียนทับชื่อเดิมเด็ดขาด
 */
export function buildStoragePath(
  kind: SlotKind,
  episodeNo: number,
  slug: string,
  fileName: string,
  previousPath: string | null,
): string {
  const slot = SLOTS[kind];
  let ext = fileExtension(fileName);
  if (ext === "jpeg") ext = "jpg";
  const ep = String(episodeNo).padStart(2, "0");
  const prev = previousPath ? /_v(\d+)\.[A-Za-z0-9]+$/.exec(previousPath) : null;
  const version = prev ? Number(prev[1]) + 1 : 1;
  return `${slot.folder}/EP${ep}_${slug}_${slot.suffix}_v${version}.${ext}`;
}

/** URL สาธารณะของไฟล์ (ย้ายที่เก็บไฟล์ภายหลังได้ด้วยการแก้ NEXT_PUBLIC_VIDEO_BASE_URL ที่เดียว) */
export function publicUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_VIDEO_BASE_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
  return `${base.replace(/\/$/, "")}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function describeUploadError(status: number, body: string): string {
  let message = "";
  try {
    message = (JSON.parse(body) as { message?: string }).message ?? "";
  } catch {
    /* ไม่ใช่ JSON */
  }
  if (status === 409 || /already exists/i.test(message))
    return "มีไฟล์ชื่อนี้อยู่แล้ว กรุณากดอัปโหลดอีกครั้ง (ระบบจะตั้งชื่อใหม่ให้)";
  if (status === 401 || status === 403 || /row-level security|not authorized|jwt/i.test(message))
    return "ไม่มีสิทธิ์อัปโหลด หรือเซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่";
  if (status === 413 || /too large|maximum allowed size/i.test(message))
    return "ไฟล์ใหญ่เกิน 50 MB ที่ระบบรับได้";
  if (/mime type|not supported|invalid mime/i.test(message))
    return "ชนิดไฟล์นี้ระบบไม่รองรับ";
  if (status === 404 || /bucket not found/i.test(message))
    return 'ไม่พบที่เก็บไฟล์ "media" ใน Supabase ตรวจว่ารัน schema.sql ครบแล้ว';
  return "อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

/**
 * อัปโหลดตรงเข้า Supabase Storage ด้วย XMLHttpRequest เพื่อให้มีแถบความคืบหน้า
 * (supabase-js ไม่มี callback ความคืบหน้า) ใช้ access token ของผู้ใช้ที่ล็อกอินอยู่ -> นโยบาย Storage ตรวจสิทธิ์ให้
 */
export function uploadToStorage(opts: {
  kind: SlotKind;
  path: string;
  file: File;
  accessToken: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { kind, path, file, accessToken, onProgress, signal } = opts;
  const ext = fileExtension(file.name);
  const contentType = SLOTS[kind].contentType(ext);
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
    xhr.setRequestHeader("x-upsert", "false"); // ห้ามเขียนทับไฟล์เดิม

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error(describeUploadError(xhr.status, xhr.responseText)));
      }
    };
    xhr.onerror = () =>
      reject(new Error("เชื่อมต่อที่เก็บไฟล์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่"));
    xhr.onabort = () => reject(new Error("ยกเลิกการอัปโหลดแล้ว"));
    signal?.addEventListener("abort", () => xhr.abort());

    // รูปแบบเดียวกับที่ supabase-js ส่ง: multipart + ตั้ง Content-Type เอง (.vtt มักได้ชนิดว่าง)
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", new Blob([file], { type: contentType }), file.name);
    xhr.send(form);
  });
}

export type VideoMeta = { durationSec: number; width: number; height: number };

/** อ่านความยาวและขนาดภาพจากไฟล์วิดีโอในเบราว์เซอร์ (ไม่อัปโหลดอะไร) คืน null ถ้าอ่านไม่ได้ เช่น โคเดกที่เบราว์เซอร์ไม่รองรับ */
export function readVideoMeta(file: File, timeoutMs = 8000): Promise<VideoMeta | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;
    const finish = (v: VideoMeta | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () =>
      finish(
        Number.isFinite(video.duration) && video.videoWidth > 0
          ? {
              durationSec: Math.round(video.duration),
              width: video.videoWidth,
              height: video.videoHeight,
            }
          : null,
      );
    video.onerror = () => finish(null);
    video.src = url;
  });
}

/** ตรวจว่าวิดีโออยู่ถูกช่อง (แนวนอนใน 16:9 / แนวตั้งใน 9:16) คืนข้อความผิดพลาดหรือ null */
export function checkOrientation(kind: SlotKind, meta: VideoMeta): string | null {
  if (kind === "video169" && meta.height > meta.width)
    return `ไฟล์นี้เป็นวิดีโอแนวตั้ง (${meta.width}×${meta.height}) แต่ช่องนี้สำหรับ 16:9 แนวนอน ตรวจว่าเลือกไฟล์ถูกช่องหรือไม่`;
  if (kind === "video916" && meta.width > meta.height)
    return `ไฟล์นี้เป็นวิดีโอแนวนอน (${meta.width}×${meta.height}) แต่ช่องนี้สำหรับ 9:16 แนวตั้ง ตรวจว่าเลือกไฟล์ถูกช่องหรือไม่`;
  return null;
}

/** คำเตือน (ไม่บล็อก) ถ้าความละเอียดสูงกว่า 720p ไฟล์มักเกินขนาดและกินพื้นที่รวม 1 GB */
export function resolutionWarning(meta: VideoMeta): string | null {
  const longSide = Math.max(meta.width, meta.height);
  return longSide > 1280
    ? `ความละเอียด ${meta.width}×${meta.height} สูงกว่า 720p ไฟล์อาจใหญ่ และกินพื้นที่รวม 1 GB ของแพ็กเกจฟรีเร็ว แนะนำบีบเป็น 720p ก่อน`
    : null;
}
