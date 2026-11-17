// ตัวตรวจรูปแบบข้อมูลสื่อ (Zod) ใช้ร่วมกันทั้งฟอร์มและ API
// รูปแบบ jsonb ตรงกับคอมเมนต์ใน supabase/schema.sql (media.chapters / checklist / quiz / sources / contacts)
import { z } from "zod";

const text = (label: string, max: number) =>
  z
    .string({ error: `${label}: กรุณากรอก` })
    .trim()
    .min(1, `${label}: กรุณากรอก`)
    .max(max, `${label}: ยาวเกิน ${max} ตัวอักษร`);

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label}: ยาวเกิน ${max} ตัวอักษร`)
    .nullish()
    .transform((v) => (v ? v : null));

const httpUrl = (label: string) =>
  z
    .string({ error: `${label}: กรุณากรอก` })
    .trim()
    .min(1, `${label}: กรุณากรอก`)
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, `${label}: ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://`);

// path ไฟล์ในบัคเก็ต เช่น videos/EP01_ICIT_169_v1.mp4 (ห้ามขึ้นต้นด้วย / และห้ามมี ..)
const storagePath = (label: string) =>
  z
    .string()
    .trim()
    .max(300, `${label}: ยาวเกินไป`)
    .refine(
      (v) => v === "" || (!v.startsWith("/") && !v.includes("..") && !/\s/.test(v)),
      `${label}: รูปแบบชื่อไฟล์ไม่ถูกต้อง (ห้ามมีช่องว่าง ขึ้นต้นด้วย / หรือมี ..)`,
    )
    .nullish()
    .transform((v) => (v ? v : null));

// ---- แต่ละส่วนของเนื้อหาเสริม ----

export const chapterSchema = z.object({
  time_sec: z
    .number({ error: "บท: เวลาไม่ถูกต้อง" })
    .int("บท: เวลาไม่ถูกต้อง")
    .min(0, "บท: เวลาต้องไม่ติดลบ"),
  title: text("บท: ชื่อบท", 100),
});

export const checklistItemSchema = z.object({
  id: z.string().trim().min(1).max(40),
  text: text("เช็กลิสต์: ข้อความ", 200),
});

export const sourceSchema = z.object({
  label: text("แหล่งข้อมูล: ชื่อ", 100),
  url: httpUrl("แหล่งข้อมูล: ลิงก์"),
  checked_at: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "แหล่งข้อมูล: วันที่ตรวจไม่ถูกต้อง")
    .nullish()
    .transform((v) => (v ? v : null)),
});

export const contactSchema = z.object({
  label: text("ช่องทางติดต่อ: ชื่อ", 100),
  value: text("ช่องทางติดต่อ: ค่า", 200),
  url: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => {
      if (v === null) return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "ช่องทางติดต่อ: ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://"),
});

export const quizQuestionSchema = z
  .object({
    id: z.string().trim().min(1).max(40),
    question: text("แบบฝึก: คำถาม", 300),
    choices: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(10),
          text: text("แบบฝึก: ตัวเลือก", 200),
        }),
      )
      .min(3, "แบบฝึก: ต้องมีตัวเลือก 3–4 ข้อ")
      .max(4, "แบบฝึก: ต้องมีตัวเลือก 3–4 ข้อ"),
    answer: z.string().trim().min(1, "แบบฝึก: เลือกข้อที่ถูก"),
    explanation: optionalText("แบบฝึก: คำอธิบาย", 500),
  })
  .refine((q) => q.choices.some((c) => c.id === q.answer), {
    message: "แบบฝึก: ข้อที่ถูกต้องไม่อยู่ในตัวเลือก",
  });

// ---- ตัวสื่อทั้งหมด ----

export const MEDIA_ACTIONS = ["draft", "publish_now", "schedule"] as const;
export type MediaAction = (typeof MEDIA_ACTIONS)[number];

const isoDateTime = (label: string) =>
  z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), `${label}: วันเวลาไม่ถูกต้อง`);

export const mediaInputSchema = z.object({
  episode_no: z
    .number({ error: "เลขด่าน: กรุณากรอกตัวเลข" })
    .int("เลขด่าน: ต้องเป็นจำนวนเต็ม")
    .min(1, "เลขด่าน: ต้องมากกว่า 0")
    .max(99, "เลขด่าน: ต้องไม่เกิน 99"),
  slug: z
    .string({ error: "Slug: กรุณากรอก" })
    .trim()
    .min(1, "Slug: กรุณากรอก")
    .max(60, "Slug: ยาวเกิน 60 ตัวอักษร")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug: ใช้ได้เฉพาะภาษาอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลาง เช่น icit หรือ wifi-setup",
    ),
  title: text("ชื่อเรื่อง", 150),
  description: optionalText("คำอธิบาย", 2000),
  category: z.string().trim().max(60, "หมวดหมู่: ยาวเกิน 60 ตัวอักษร").default(""),

  // ไฟล์ (F03 จะเปลี่ยนเป็นปุ่มอัปโหลด ตอนนี้กรอกชื่อไฟล์ที่อยู่ในบัคเก็ตได้)
  video_169_path: storagePath("วิดีโอ 16:9"),
  video_916_path: storagePath("วิดีโอ 9:16"),
  subtitle_path: storagePath("ไฟล์ซับ"),
  cover_path: storagePath("ภาพปก"),
  duration_sec: z
    .number()
    .int("ความยาว: ต้องเป็นจำนวนเต็มวินาที")
    .min(0, "ความยาว: ต้องไม่ติดลบ")
    .nullish()
    .transform((v) => v ?? null),

  chapters: z.array(chapterSchema).max(30, "บท: มากเกิน 30 รายการ").default([]),
  checklist: z.array(checklistItemSchema).max(30, "เช็กลิสต์: มากเกิน 30 รายการ").default([]),
  quiz: z.array(quizQuestionSchema).max(3, "แบบฝึก: ไม่เกิน 3 ข้อ").default([]),
  sources: z.array(sourceSchema).max(20, "แหล่งข้อมูล: มากเกิน 20 รายการ").default([]),
  contacts: z.array(contactSchema).max(20, "ช่องทางติดต่อ: มากเกิน 20 รายการ").default([]),

  // การเผยแพร่ (Editor ส่งได้เฉพาะ draft ฝั่งเซิร์ฟเวอร์จะบังคับซ้ำ)
  action: z.enum(MEDIA_ACTIONS).default("draft"),
  publish_at: isoDateTime("เวลาเริ่มเผยแพร่"),
  unpublish_at: isoDateTime("เวลาหยุดเผยแพร่"),
});

export type MediaInput = z.infer<typeof mediaInputSchema>;

/** รวมข้อความผิดพลาดแรก ๆ ของ Zod เป็นภาษาไทยอ่านง่าย */
export function firstIssues(error: z.ZodError, limit = 3): string {
  const msgs = [...new Set(error.issues.map((i) => i.message))];
  return msgs.slice(0, limit).join(" / ");
}
