// ค้นหาแบบง่ายสำหรับข้อมูลชุดเล็ก (ด่านไม่กี่สิบด่าน + FAQ) ทำในเบราว์เซอร์
// ภาษาไทยไม่มีช่องว่างคั่นคำ จึงใช้ "ข้อความมีคำค้นอยู่" (includes) แทนการตัดคำ
// พิมพ์หลายคำคั่นด้วยเว้นวรรค = ต้องมีครบทุกคำ (AND)

export function normalizeText(s: string): string {
  return s.normalize("NFC").toLocaleLowerCase("th-TH").replace(/\s+/g, " ").trim();
}

export function searchTerms(query: string): string[] {
  const n = normalizeText(query);
  return n ? n.split(" ") : [];
}

export function matchesAll(haystackParts: (string | null | undefined)[], terms: string[]): boolean {
  if (terms.length === 0) return false;
  const hay = normalizeText(haystackParts.filter(Boolean).join(" "));
  return terms.every((t) => hay.includes(t));
}
