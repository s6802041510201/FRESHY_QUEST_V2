"use client";

// ช่องอัปโหลดไฟล์ 1 ช่อง (วิดีโอ 16:9, วิดีโอ 9:16, ซับ, ภาพปก) สำหรับ F03
// - ตรวจชนิด/ขนาดก่อนส่ง แสดงข้อความไทยที่เข้าใจง่าย
// - อัปโหลดตรงเข้า Supabase Storage พร้อมแถบความคืบหน้า
// - ปุ่ม "เอาออก" แค่ล้างชื่อไฟล์ออกจากฟอร์ม ไม่ลบไฟล์ในที่เก็บ (Admin ลบเองใน Supabase Dashboard)
import { useRef, useState } from "react";
import { btnSecondary, btnDangerText, hintClass } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/client";
import {
  SLOTS,
  type SlotKind,
  type VideoMeta,
  buildStoragePath,
  checkOrientation,
  publicUrl,
  readVideoMeta,
  resolutionWarning,
  uploadToStorage,
  validateFile,
} from "@/lib/storage";

export default function UploadField({
  kind,
  value,
  onChange,
  episodeNo,
  slug,
  onVideoMeta,
  disabled = false,
}: {
  kind: SlotKind;
  /** path ปัจจุบันในที่เก็บไฟล์ ("" = ยังไม่มีไฟล์) */
  value: string;
  onChange: (path: string) => void;
  /** เลขด่านและ slug ใช้ตั้งชื่อไฟล์ ต้องกรอกก่อนอัปโหลด */
  episodeNo: number | null;
  slug: string;
  /** เรียกเมื่ออ่านข้อมูลวิดีโอได้ (ใช้เติมความยาวอัตโนมัติ) */
  onVideoMeta?: (meta: VideoMeta) => void;
  disabled?: boolean;
}) {
  const slot = SLOTS[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null); // null = ไม่ได้กำลังอัปโหลด
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const uploading = progress !== null;
  const inputId = `upload-${kind}`;

  async function handleFile(file: File) {
    setError(null);
    setNotice(null);

    if (!episodeNo || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      setError("กรุณากรอก “เลขด่าน” และ “Slug” ในส่วนข้อมูลหลักก่อน ระบบใช้ตั้งชื่อไฟล์");
      return;
    }
    const invalid = validateFile(kind, file);
    if (invalid) {
      setError(invalid);
      return;
    }

    // วิดีโอ: อ่านข้อมูลก่อนส่ง เพื่อเตือนถ้าวางผิดช่อง/ความละเอียดสูง และเติมความยาวให้
    let meta: VideoMeta | null = null;
    if (slot.isVideo) {
      meta = await readVideoMeta(file);
      if (meta) {
        const wrong = checkOrientation(kind, meta);
        if (wrong) {
          setError(wrong);
          return;
        }
      }
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่");
      return;
    }

    const path = buildStoragePath(kind, episodeNo, slug, file.name, value || null);
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    try {
      await uploadToStorage({
        kind,
        path,
        file,
        accessToken: token,
        onProgress: setProgress,
        signal: controller.signal,
      });
      onChange(path);
      if (meta) {
        onVideoMeta?.(meta);
        const warn = resolutionWarning(meta);
        setNotice(
          warn ? `อัปโหลดแล้ว แต่${warn}` : "อัปโหลดแล้ว อย่าลืมกด “บันทึก” ด้านล่างเพื่อเก็บลงสื่อนี้",
        );
      } else {
        setNotice(
          slot.isVideo
            ? "อัปโหลดแล้ว (เบราว์เซอร์อ่านความยาวไฟล์นี้ไม่ได้ กรุณากรอกความยาวเอง) อย่าลืมกด “บันทึก”"
            : "อัปโหลดแล้ว อย่าลืมกด “บันทึก” ด้านล่างเพื่อเก็บลงสื่อนี้",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      abortRef.current = null;
      setProgress(null);
      if (inputRef.current) inputRef.current.value = ""; // เลือกไฟล์เดิมซ้ำได้
    }
  }

  const percent = progress === null ? 0 : Math.round(progress * 100);
  const url = value ? publicUrl(value) : null;

  return (
    <div className="rounded-lg border border-line bg-canvas p-5">
      <p className="text-sm font-semibold text-ink">{slot.label}</p>

      {value ? (
        <div className="mt-2 space-y-2">
          {kind === "cover" && url ? (
            // eslint-disable-next-line @next/next/no-img-element -- ภาพจาก Storage ภายนอก ไม่ต้องผ่าน next/image
            <img
              src={url}
              alt="ตัวอย่างภาพปก"
              className="aspect-video w-full max-w-xs rounded-lg object-cover ring-1 ring-line"
            />
          ) : null}
          {slot.isVideo && url ? (
            <video
              src={url}
              controls
              preload="metadata"
              className={`rounded-lg bg-black ring-1 ring-line ${kind === "video916" ? "max-h-64" : "w-full max-w-xs"}`}
            >
              เบราว์เซอร์นี้เล่นวิดีโอไม่ได้
            </video>
          ) : null}
          <p className="break-all text-xs text-muted">{value}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">ยังไม่มีไฟล์</p>
      )}

      {uploading ? (
        <div className="mt-3" aria-live="polite">
          <div
            role="progressbar"
            aria-label={`กำลังอัปโหลด${slot.label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2.5 w-full overflow-hidden rounded-full bg-line"
          >
            <div className="h-full bg-teal transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>กำลังอัปโหลด {percent}% อย่าปิดหน้านี้</span>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="font-medium text-red-strong underline"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={slot.accept}
            disabled={disabled}
            className="peer sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <label
            htmlFor={inputId}
            className={`${btnSecondary} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-peri-strong ${disabled ? "pointer-events-none opacity-60" : ""}`}
          >
            {value ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}
          </label>
          {value ? (
            <button type="button" className={btnDangerText} onClick={() => onChange("")}>
              เอาออก
            </button>
          ) : null}
        </div>
      )}

      {kind === "video169" || kind === "video916" ? (
        <p className={hintClass}>MP4 ไม่เกิน 50 MB แนะนำ 720p (ไฟล์ 5 นาทีราว 41 MB)</p>
      ) : kind === "subtitle" ? (
        <p className={hintClass}>ไฟล์ .vtt ไม่เกิน 50 MB</p>
      ) : (
        <p className={hintClass}>JPG, PNG หรือ WebP ไม่เกิน 50 MB</p>
      )}

      {error ? (
        <p role="alert" className="mt-2 rounded-lg bg-red/10 px-3 py-2 text-sm text-red-strong">
          {error}
        </p>
      ) : null}
      {notice && !error ? (
        <p role="status" className="mt-2 rounded-lg bg-teal/10 px-3 py-2 text-sm text-teal-strong">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
