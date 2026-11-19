"use client";

// hook อ่าน/เขียนการตั้งค่าการแสดงผล (ใช้ useSyncExternalStore เหมือน use-progress: ไม่เกิด hydration mismatch)
import { useCallback, useSyncExternalStore } from "react";
import {
  applyPrefs,
  DEFAULT_PREFS,
  DISPLAY_KEY,
  type DisplayPrefs,
  parsePrefs,
  type TextSize,
  type ThemePref,
} from "@/lib/display-prefs";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const systemDark = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(DARK_QUERY).matches;

let memoryRaw: string | null = null;
let cache: { raw: string | null; value: DisplayPrefs } = { raw: null, value: DEFAULT_PREFS };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(DISPLAY_KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function getSnapshot(): DisplayPrefs {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, value: parsePrefs(raw) };
  return cache.value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === DISPLAY_KEY || e.key === null) {
      applyPrefs(getSnapshot(), document.documentElement, systemDark());
      cb();
    }
  };
  // ธีม "ตามระบบ": เมื่อผู้ใช้เปลี่ยนโหมดมืด/สว่างของเครื่อง ให้เว็บเปลี่ยนตามทันที
  const mq = window.matchMedia ? window.matchMedia(DARK_QUERY) : null;
  const onSystem = () => {
    if (getSnapshot().theme === "system") applyPrefs(getSnapshot(), document.documentElement, systemDark());
  };
  window.addEventListener("storage", onStorage);
  mq?.addEventListener("change", onSystem);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    mq?.removeEventListener("change", onSystem);
  };
}

function write(next: DisplayPrefs) {
  const raw = JSON.stringify(next);
  memoryRaw = raw;
  try {
    window.localStorage.setItem(DISPLAY_KEY, raw);
  } catch {
    /* เก็บไม่ได้: ใช้ค่าในหน่วยความจำต่อไป */
  }
  applyPrefs(next, document.documentElement, systemDark());
  listeners.forEach((l) => l());
}

export function useDisplayPrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PREFS);
  const setText = useCallback((text: TextSize) => write({ ...getSnapshot(), text }), []);
  const setContrast = useCallback((contrast: boolean) => write({ ...getSnapshot(), contrast }), []);
  const setTheme = useCallback((theme: ThemePref) => write({ ...getSnapshot(), theme }), []);
  const reset = useCallback(() => write(DEFAULT_PREFS), []);
  return { prefs, setText, setContrast, setTheme, reset };
}
