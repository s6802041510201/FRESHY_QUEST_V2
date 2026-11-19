"use client";

// โหมดดูตัวอย่าง (ผู้ดูแล/Teacher ดูหน้านักศึกษาของสื่อที่ยังเป็นฉบับร่างได้)
// ความคืบหน้าในโหมดนี้อยู่ในหน่วยความจำของหน้านี้เท่านั้น ไม่เขียน localStorage ของเครื่อง
// (ไม่ทำให้ความคืบหน้าจริงของผู้ใช้ปนกับการทดสอบ) ปิดหน้าแล้วหายหมด
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { EMPTY_PROGRESS, type Progress } from "@/lib/progress";

type PreviewValue = { progress: Progress; update: (fn: (p: Progress) => Progress) => void };

const PreviewContext = createContext<PreviewValue | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => fn(p)), []);
  const value = useMemo(() => ({ progress, update }), [progress, update]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreviewContext(): PreviewValue | null {
  return useContext(PreviewContext);
}
