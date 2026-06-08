import { Sidebar } from "@/components/layout/sidebar";

/* ─── Deterministic starfield (no Math.random → no hydration mismatch) ─── */
const STARS: { x: number; y: number; s: number; d: number; dur: number; gold?: boolean }[] = [
  { x:  3, y:  8, s: 1.2, d: 0.0, dur: 3.2 },
  { x:  8, y: 22, s: 1.5, d: 0.7, dur: 2.8, gold: true },
  { x: 14, y: 45, s: 1.0, d: 1.5, dur: 3.9 },
  { x: 18, y:  3, s: 2.0, d: 0.3, dur: 4.1, gold: true },
  { x: 24, y: 67, s: 1.0, d: 2.1, dur: 3.0 },
  { x: 29, y: 31, s: 1.5, d: 0.9, dur: 2.6 },
  { x: 34, y: 55, s: 1.0, d: 3.2, dur: 4.3 },
  { x: 39, y: 12, s: 1.0, d: 1.8, dur: 3.5 },
  { x: 44, y: 78, s: 2.0, d: 0.4, dur: 2.9, gold: true },
  { x: 49, y: 25, s: 1.0, d: 2.7, dur: 3.7 },
  { x: 54, y: 49, s: 1.5, d: 1.1, dur: 4.0 },
  { x: 59, y: 64, s: 1.0, d: 3.8, dur: 2.7 },
  { x: 63, y: 18, s: 1.0, d: 0.6, dur: 3.3 },
  { x: 69, y: 88, s: 2.5, d: 2.3, dur: 4.4, gold: true },
  { x: 74, y: 36, s: 1.0, d: 1.4, dur: 3.1 },
  { x: 79, y: 72, s: 1.5, d: 0.1, dur: 2.5 },
  { x: 84, y: 42, s: 1.0, d: 3.5, dur: 3.8 },
  { x: 89, y: 15, s: 2.0, d: 1.9, dur: 4.2, gold: true },
  { x: 94, y: 60, s: 1.0, d: 2.8, dur: 3.0 },
  { x: 98, y: 30, s: 1.0, d: 0.8, dur: 3.6 },
  { x:  6, y: 55, s: 1.0, d: 4.0, dur: 2.8 },
  { x: 11, y: 70, s: 1.5, d: 1.2, dur: 3.4 },
  { x: 16, y: 82, s: 1.0, d: 3.0, dur: 4.1 },
  { x: 21, y: 38, s: 2.0, d: 0.5, dur: 2.9, gold: true },
  { x: 26, y: 13, s: 1.0, d: 2.5, dur: 3.7 },
  { x: 31, y: 95, s: 1.5, d: 1.7, dur: 3.2 },
  { x: 36, y: 28, s: 1.0, d: 3.9, dur: 4.5 },
  { x: 41, y: 65, s: 1.0, d: 0.2, dur: 2.6 },
  { x: 46, y: 92, s: 2.0, d: 2.0, dur: 3.9, gold: true },
  { x: 51, y:  7, s: 1.0, d: 1.3, dur: 3.3 },
  { x: 56, y: 40, s: 1.5, d: 3.4, dur: 4.0 },
  { x: 61, y: 76, s: 1.0, d: 0.9, dur: 2.7 },
  { x: 66, y: 22, s: 1.0, d: 2.6, dur: 3.6 },
  { x: 71, y: 50, s: 2.5, d: 1.0, dur: 4.3, gold: true },
  { x: 76, y: 85, s: 1.0, d: 3.7, dur: 3.1 },
  { x: 81, y: 35, s: 1.5, d: 0.3, dur: 2.5 },
  { x: 86, y: 62, s: 1.0, d: 1.6, dur: 3.8 },
  { x: 91, y: 18, s: 1.0, d: 4.2, dur: 4.4 },
  { x: 96, y: 78, s: 2.0, d: 2.9, dur: 3.0, gold: true },
  { x: 99, y: 45, s: 1.0, d: 1.4, dur: 3.5 },
];

const SHOOTING_STARS = [
  { top: "18%", left:  "8%", delay: "0s",   dur: "6s"   },
  { top: "42%", left: "52%", delay: "5.5s", dur: "7.5s" },
  { top: "70%", left: "25%", delay: "13s",  dur: "5.8s" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-base)" }}>

      {/* ── Layer 0: Full-page galaxy background ── */}
      <div className="galaxy-layer fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>

        {/* Islamic geometric tiled pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              rgba(0,200,150,0.025) 0deg 22.5deg,
              transparent 22.5deg 45deg
            )
          `,
          backgroundSize: "72px 72px",
          opacity: 0.6,
        }} />

        {/* Dot-grid drift */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,200,150,0.22) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          animation: "grid-drift 24s linear infinite",
          opacity: 0.30,
        }} />

        {/* Starfield */}
        {STARS.map((star, i) => (
          <div
            key={i}
            className="animate-star-twinkle"
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.s}px`,
              height: `${star.s}px`,
              borderRadius: "50%",
              background: star.gold ? "#f7c948" : "#00c896",
              boxShadow: star.gold
                ? `0 0 ${star.s * 2}px rgba(247,201,72,0.7)`
                : `0 0 ${star.s * 2}px rgba(0,200,150,0.6)`,
              ["--dur" as string]: `${star.dur}s`,
              ["--delay" as string]: `${star.d}s`,
            }}
          />
        ))}

        {/* Shooting stars */}
        {SHOOTING_STARS.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: 90,
              height: 2,
              borderRadius: 2,
              background: "linear-gradient(90deg, transparent, #f7c948 40%, #00c896)",
              transform: "rotate(-32deg)",
              animation: `shooting ${s.dur} ${s.delay} linear infinite`,
              opacity: 0,
            }}
          />
        ))}

        {/* Nebula orb 1 — forest green top-left */}
        <div style={{
          position: "absolute",
          top: "-8%", left: "5%",
          width: 900, height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,150,0.10) 0%, rgba(0,120,80,0.04) 50%, transparent 70%)",
          animation: "orb-breathe 16s ease-in-out infinite",
        }} />

        {/* Nebula orb 2 — gold bottom-right */}
        <div style={{
          position: "absolute",
          bottom: "-5%", right: "2%",
          width: 700, height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(247,201,72,0.08) 0%, rgba(200,140,0,0.03) 50%, transparent 70%)",
          animation: "orb-breathe-b 19s ease-in-out infinite 3s",
        }} />

        {/* Nebula orb 3 — teal mid */}
        <div style={{
          position: "absolute",
          top: "30%", right: "20%",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(29,160,207,0.07) 0%, transparent 65%)",
          animation: "orb-breathe-c 23s ease-in-out infinite 7s",
        }} />

        {/* ── Islamic crescent & star decoration (top-right corner) ── */}
        <div style={{
          position: "absolute",
          top: 24, right: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: "crescent-glow 4s ease-in-out infinite",
        }}>
          {/* 8-pointed star (Islamic octagram) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 14,9 21,9 15.5,13.5 17.5,21 12,16.5 6.5,21 8.5,13.5 3,9 10,9" fill="#f7c948" opacity="0.75"/>
          </svg>
          {/* Crescent moon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#f7c948" opacity="0.75"/>
          </svg>
          {/* Small star */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#f7c948" opacity="0.60"/>
          </svg>
        </div>

      </div>

      <Sidebar />

      {/* ── Layer 10: Main content column ── */}
      <main
        className="ml-[268px] min-h-screen flex flex-col overflow-hidden"
        style={{ position: "relative", zIndex: 10 }}
      >
        {/* Scanline */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            zIndex: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(0,200,150,0.25) 30%, rgba(247,201,72,0.30) 50%, rgba(0,200,150,0.25) 70%, transparent 100%)",
            animation: "scan-line 10s ease-in-out infinite",
          }}
        />

        <div className="flex-1 flex flex-col" style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </main>

    </div>
  );
}

