"use client";

// hook อ่าน/เขียนความคืบหน้าใน localStorage
// ใช้ useSyncExternalStore: ฝั่งเซิร์ฟเวอร์และการ render แรกใช้ค่าว่าง จึงไม่เกิด hydration mismatch
// แล้วค่อยอัปเดตเมื่อเบราว์เซอร์อ่านค่าจริง ใช้ได้แม้ localStorage ถูกปิด (เก็บในหน่วยความจำแทน)
import { useCallback, useSyncExternalStore } from "react";
import { usePreviewContext } from "@/lib/preview";
import { EMPTY_PROGRESS, PROGRESS_KEY, type Progress, parseProgress } from "@/lib/progress";

let memoryRaw: string | null = null; // ใช้เมื่อ localStorage ไม่พร้อม
let cache: { raw: string | null; value: Progress } = { raw: null, value: EMPTY_PROGRESS };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(PROGRESS_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function getSnapshot(): Progress {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, value: parseProgress(raw) };
  return cache.value;
}

const getServerSnapshot = (): Progress => EMPTY_PROGRESS;

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROGRESS_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage); // แท็บอื่นแก้ค่า
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: Progress) {
  const raw = JSON.stringify(next);
  memoryRaw = raw;
  try {
    window.localStorage.setItem(PROGRESS_KEY, raw);
  } catch {
    /* เก็บไม่ได้ (โหมดส่วนตัวหรือพื้นที่เต็ม) ใช้ค่าในหน่วยความจำต่อไป */
  }
  listeners.forEach((l) => l());
}

export function useProgress(): {
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  preview: boolean;
} {
  const preview = usePreviewContext();
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const update = useCallback((fn: (p: Progress) => Progress) => {
    write(fn(getSnapshot()));
  }, []);
  // โหมดดูตัวอย่าง: ใช้ค่าในหน่วยความจำของหน้านั้นแทน localStorage
  if (preview) return { progress: preview.progress, update: preview.update, preview: true };
  return { progress, update, preview: false };
}
