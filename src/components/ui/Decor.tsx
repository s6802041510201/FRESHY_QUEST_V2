// ลวดลายตกแต่งของเว็บ (ล้วนเป็น SVG/CSS ไม่มีไฟล์ภาพ ไม่มีผลต่อความเร็ว) ใช้โทเคนสี จึงเปลี่ยนตามธีมสว่าง/มืดเอง
// ทุกชิ้น aria-hidden และไม่รับการคลิก ถูกซ่อนเมื่อเปิดโหมดความคมชัดสูง (ดู .decor ใน globals.css)
// ชิ้นที่ขยับ (.float-*) หยุดเองเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว

const dots = (color: string, size = 26, r = 1.3) => ({
  backgroundImage: `radial-gradient(${color} ${r}px, transparent ${r + 0.2}px)`,
  backgroundSize: `${size}px ${size}px`,
});

/** ลวดลายหลังฮีโร่หน้าแรก: แสงฟุ้ง + จุดไข่ปลา + เส้นทางด่านที่มีจุดแวะ + รูปทรงลอยเบา ๆ */
export function HeroArt() {
  return (
    <div aria-hidden="true" className="decor pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-28 -right-24 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(124,134,224,0.5),transparent_65%)]" />
      <div className="absolute -bottom-40 left-[18%] size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(63,198,255,0.2),transparent_65%)]" />
      <div
        className="absolute inset-0"
        style={{
          ...dots("rgba(255,255,255,0.16)"),
          maskImage: "linear-gradient(to left, #000 0%, transparent 75%)",
          WebkitMaskImage: "linear-gradient(to left, #000 0%, transparent 75%)",
        }}
      />
      <svg
        viewBox="0 0 520 420"
        className="absolute top-1/2 right-0 hidden w-[46rem] max-w-none -translate-y-1/2 md:block"
        fill="none"
      >
        <path
          d="M10 370 C 120 390, 150 250, 260 272 S 400 130, 506 66"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeDasharray="6 9"
          strokeLinecap="round"
        />
        {[
          [60, 352],
          [165, 296],
          [262, 270],
          [352, 206],
          [438, 120],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i === 2 ? 11 : 8}
            fill={i === 2 ? "#e8622c" : "var(--color-band)"}
            stroke={i === 2 ? "#ffd2bd" : "rgba(255,255,255,0.7)"}
            strokeWidth="2"
          />
        ))}
        <path d="M506 66 V28 L534 40 L506 52" fill="#3fc6ff" stroke="#3fc6ff" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <span className="float-slow absolute top-[7%] left-[52%] size-10 rounded-full border-2 border-cyan/60" />
      <span className="float-slower absolute top-[12%] left-[44%] size-5 rotate-12 rounded-sm bg-orange/85" />
      <span className="float-slow absolute bottom-[14%] left-[40%] size-3.5 rounded-full bg-cyan/80" />
      <svg
        viewBox="0 0 24 24"
        className="float-slower absolute right-[10%] bottom-[12%] size-8 text-white/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M12 4v16M4 12h16" />
      </svg>
    </div>
  );
}

/** ภาพปกตัวแทนของด่าน (เมื่อยังไม่มีภาพจริง) สลับ 4 แบบตามเลขด่านให้การ์ดไม่ซ้ำกันหมด */
export function CoverArt({ episodeNo }: { episodeNo: number }) {
  const v = Math.abs(episodeNo) % 4;
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      {v === 0 ? (
        <>
          <circle cx="270" cy="150" r="120" fill="var(--color-peri)" fillOpacity="0.16" />
          <circle cx="270" cy="150" r="82" fill="var(--color-peri)" fillOpacity="0.18" />
          <circle cx="270" cy="150" r="44" fill="var(--color-orange)" fillOpacity="0.9" />
          <circle cx="36" cy="30" r="5" fill="var(--color-cyan)" />
        </>
      ) : v === 1 ? (
        <>
          <defs>
            <pattern id={`stripe-${episodeNo}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="14" fill="var(--color-navy)" fillOpacity="0.1" />
            </pattern>
          </defs>
          <rect x="150" y="0" width="170" height="180" fill={`url(#stripe-${episodeNo})`} />
          <rect x="214" y="34" width="70" height="70" rx="14" fill="var(--color-peri)" fillOpacity="0.5" />
          <circle cx="292" cy="130" r="14" fill="var(--color-orange)" />
          <path d="M20 22h34" stroke="var(--color-cyan)" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : v === 2 ? (
        <>
          {Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 8 }, (_, c) => (
              <circle key={`${r}-${c}`} cx={176 + c * 18} cy={20 + r * 18} r="2.4" fill="var(--color-navy)" fillOpacity="0.28" />
            )),
          )}
          <rect x="226" y="60" width="64" height="64" rx="32" stroke="var(--color-peri)" strokeWidth="5" strokeOpacity="0.8" />
          <circle cx="258" cy="92" r="12" fill="var(--color-cyan)" />
          <rect x="22" y="22" width="12" height="12" rx="3" fill="var(--color-orange)" />
        </>
      ) : (
        <>
          <rect x="170" y="30" width="130" height="16" rx="8" fill="var(--color-peri)" fillOpacity="0.45" />
          <rect x="170" y="62" width="100" height="16" rx="8" fill="var(--color-peri)" fillOpacity="0.3" />
          <rect x="170" y="94" width="116" height="16" rx="8" fill="var(--color-orange)" fillOpacity="0.9" />
          <rect x="170" y="126" width="70" height="16" rx="8" fill="var(--color-peri)" fillOpacity="0.2" />
          <circle cx="40" cy="36" r="16" stroke="var(--color-cyan)" strokeWidth="4" />
        </>
      )}
    </svg>
  );
}

/** ลวดลายด้านขวาของแถบหัวหน้าย่อย (หัวข้อทั้งหมด / Checklist / ค้นหา) */
export function BandArt() {
  return (
    <div aria-hidden="true" className="decor pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden sm:block">
      <div
        className="absolute inset-0"
        style={{
          ...dots("var(--color-peri)", 22, 1.4),
          opacity: 0.45,
          maskImage: "linear-gradient(to left, #000, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to left, #000, transparent 85%)",
        }}
      />
      <span className="absolute -top-10 right-16 size-32 rounded-full border-[14px] border-peri/20" />
      <span className="absolute right-40 bottom-4 size-6 rounded-full bg-orange/80" />
      <span className="absolute top-7 right-[30%] size-3 rotate-12 rounded-sm bg-cyan/80" />
    </div>
  );
}

/** ลวดลายจุดไข่ปลาบนพื้น Navy (ท้ายเว็บ แผงข้างหน้าเข้าสู่ระบบ) */
export function DotField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`decor pointer-events-none absolute inset-0 ${className}`}
      style={dots("rgba(255,255,255,0.12)", 24, 1.2)}
    />
  );
}

/** แสงฟุ้งสีฟ้า/ม่วงเป็นพื้นหลังหน้าที่โล่ง (เช่นหน้าเลือกบทบาท) */
export function GlowBlobs() {
  return (
    <div aria-hidden="true" className="decor pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -right-24 size-[26rem] rounded-full bg-[radial-gradient(circle,rgba(124,134,224,0.28),transparent_65%)]" />
      <div className="absolute -bottom-32 -left-24 size-[24rem] rounded-full bg-[radial-gradient(circle,rgba(63,198,255,0.2),transparent_65%)]" />
      <div className="absolute top-1/3 right-[12%] size-4 rotate-12 rounded-sm bg-orange/70" />
      <div className="absolute bottom-1/4 left-[8%] size-8 rounded-full border-2 border-peri/40" />
    </div>
  );
}
