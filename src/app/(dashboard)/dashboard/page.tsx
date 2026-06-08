import {
  Building2,
  Users,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  Star,
  MapPin,
  Sparkles,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Lightbulb,
  Clock,
  FileText,
  UserPlus,
  HelpCircle,
} from "lucide-react";
import { formatNumber, getPrayerLabel } from "@/lib/utils";
import { createServiceClient } from "@/lib/supabase/server";

/* ─── Types ─── */
interface DashStat {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  sub?: string;
}

/* ─── Data fetching ─── */
async function getDashboardData() {
  try {
    const supabase = await createServiceClient();
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { count: totalMosques },
      { count: totalUsers },
      { count: attendanceToday },
      { count: weeklyAttendance },
      { count: streakUsers },
      { data: recentAttendance },
      { data: trendRaw },
      { data: prayerRaw },
    ] = await Promise.all([
      supabase.from("mosques").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("attendance").select("*", { count: "exact", head: true })
        .gte("checked_in_at", `${today}T00:00:00.000Z`)
        .lt("checked_in_at", `${today}T23:59:59.999Z`),
      supabase.from("attendance").select("*", { count: "exact", head: true })
        .gte("checked_in_at", weekStart),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).gte("streak_days", 7),
      supabase.from("attendance")
        .select("id, prayer_name, method, checked_in_at, points_earned, user_profiles(full_name), mosques(name)")
        .order("checked_in_at", { ascending: false })
        .limit(6),
      supabase.from("attendance").select("checked_in_at")
        .gte("checked_in_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("checked_in_at"),
      supabase.from("attendance").select("prayer_name").gte("checked_in_at", monthStart),
    ]);

    const trendByDay: Record<string, number> = {};
    (trendRaw ?? []).forEach((r: any) => {
      const day = r.checked_in_at.split("T")[0];
      trendByDay[day] = (trendByDay[day] ?? 0) + 1;
    });
    const trendValues: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      trendValues.push(trendByDay[d] ?? 0);
    }

    const prayerCounts: Record<string, number> = {};
    const total = (prayerRaw ?? []).length;
    (prayerRaw ?? []).forEach((r: any) => {
      const key = r.prayer_name.toLowerCase();
      prayerCounts[key] = (prayerCounts[key] ?? 0) + 1;
    });
    const prayers = ["subuh", "dzuhur", "ashar", "maghrib", "isya"].map((key) => ({
      key, name: getPrayerLabel(key),
      pct: total > 0 ? Math.round(((prayerCounts[key] ?? 0) / total) * 100) : 0,
    }));
    const subuhPct = prayers.find((p) => p.key === "subuh")?.pct ?? 0;
    const maxTrend = Math.max(...trendValues, 1);
    const trendNorm = trendValues.map((v) => Math.round((v / maxTrend) * 100));

    return {
      totalMosques: totalMosques ?? 0,
      totalUsers: totalUsers ?? 0,
      attendanceToday: attendanceToday ?? 0,
      weeklyAttendance: weeklyAttendance ?? 0,
      streakUsers: streakUsers ?? 0,
      subuhPct,
      recentAttendance: recentAttendance ?? [],
      trendNorm,
      trendValues,
      prayers,
    };
  } catch {
    return {
      totalMosques: 0, totalUsers: 0, attendanceToday: 0,
      weeklyAttendance: 0, streakUsers: 0, subuhPct: 0,
      recentAttendance: [], trendNorm: [0,0,0,0,0,0,0], trendValues: [0,0,0,0,0,0,0], prayers: [],
    };
  }
}

/* ─── Sub-components ─── */
function GlassCard({
  children,
  className = "",
  glow = false,
  gold = false,
  padding = "p-5",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  gold?: boolean;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-2xl animate-float-up ${padding} ${className}`}
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${gold ? "rgba(247,201,72,0.22)" : "var(--border-subtle)"}`,
        boxShadow: glow
          ? "0 0 28px rgba(0,200,150,0.12), 0 4px 24px rgba(0,0,0,0.35)"
          : gold
          ? "0 0 28px rgba(247,201,72,0.10), 0 4px 24px rgba(0,0,0,0.35)"
          : "0 4px 24px rgba(0,0,0,0.30)",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div
          className="w-1 h-5 rounded-full"
          style={{ background: "linear-gradient(180deg, #00c896, #1da0cf)" }}
        />
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{children}</h2>
      </div>
      {action}
    </div>
  );
}

/* ─── SVG Line Chart ─── */
function TrendChart({ values }: { values: number[] }) {
  const W = 340, H = 120, pad = 16;
  const inner = W - pad * 2;
  const innerH = H - pad * 2;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * inner;
    const y = pad + (1 - v / max) * innerH;
    return [x, y] as [number, number];
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c896" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00c896" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f7c948" />
            <stop offset="50%" stopColor="#00c896" />
            <stop offset="100%" stopColor="#1da0cf" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[25, 50, 75].map((pct) => (
          <line
            key={pct}
            x1={pad} y1={pad + (1 - pct / 100) * innerH}
            x2={W - pad} y2={pad + (1 - pct / 100) * innerH}
            stroke="rgba(0,200,150,0.08)" strokeWidth="1" strokeDasharray="4 4"
          />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#trendFill)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="url(#trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? "#00c896" : "var(--bg-card)"} stroke="#00c896" strokeWidth="2" />
          </g>
        ))}
      </svg>
      {/* Day labels */}
      <div className="flex justify-between mt-1 px-4">
        {days.map((d) => (
          <span key={d} className="text-[9px]" style={{ color: "var(--text-muted)" }}>{d}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default async function DashboardPage() {
  const data = await getDashboardData();

  const PRAYER_COLORS: Record<string, string> = {
    subuh: "#00c896", dzuhur: "#1da0cf", ashar: "#f7c948", maghrib: "#10b981", isya: "#a855f7",
  };

  // Today's date formatted
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  // Demo AI insights
  const AI_INSIGHTS = [
    {
      icon: TrendingUp, color: "#00c896", bg: "rgba(0,200,150,0.10)",
      title: "Kehadiran subuh meningkat",
      desc: `${data.subuhPct}% dibanding minggu lalu. Tren positif ini terjadi di banyak masjid.`,
    },
    {
      icon: Heart, color: "#f43f5e", bg: "rgba(244,63,94,0.10)",
      title: "Jamaah aktif meningkat",
      desc: `${data.streakUsers} pengguna rutin hadir bersama. Pertahankan konsistensi ini!`,
    },
    {
      icon: AlertTriangle, color: "#f7c948", bg: "rgba(247,201,72,0.10)",
      title: "Perhatian",
      desc: "Beberapa masjid mengalami penurunan kehadiran. AI merekomendasikan intervensi program.",
    },
    {
      icon: Lightbulb, color: "#1da0cf", bg: "rgba(29,160,207,0.10)",
      title: "Rekomendasi AI",
      desc: "Program parenting & kajian keluarga berpotensi meningkatkan kehadiran 18%.",
    },
  ];

  // Demo live attendance (mosque progress)
  const LIVE_MOSQUES = [
    { name: "Masjid Agung Bukittinggi", jamaah: 845, cap: 1080, pct: 78 },
    { name: "Masjid Raya Padang Panjang", jamaah: 532, cap: 858, pct: 62 },
    { name: "Masjid Nurul Iman", jamaah: 412, cap: 748, pct: 55 },
    { name: "Masjid Al-Hikmah", jamaah: 310, cap: 645, pct: 48 },
  ];

  // Demo recent activities
  const ACTIVITIES = [
    { icon: Building2, color: "#00c896", text: "Masjid Al-Ikhlas berhasil ditambahkan", time: "2 menit lalu" },
    { icon: MapPin, color: "#1da0cf", text: "Geofence Masjid Nurul Iman diperbarui", time: "15 menit lalu" },
    { icon: Heart, color: "#f43f5e", text: "Program Kajian Keluarga ditambahkan", time: "1 jam lalu" },
    { icon: UserPlus, color: "#a855f7", text: "Pengguna baru didaftarkan oleh Rahmad Syah Mulya", time: "2 jam lalu" },
    { icon: FileText, color: "#f7c948", text: "Laporan mingguan berhasil dibuat oleh Sistem", time: "3 jam lalu" },
  ];

  const QUICK_ACTIONS = [
    { icon: MapPin,    label: "Input Geofence Masjid",   desc: "Atur atau edit area masjid",   color: "#00c896" },
    { icon: Users,     label: "Kelola Pengguna",          desc: "Atur peran & hak akses",       color: "#1da0cf" },
    { icon: CalendarDays, label: "Buat Program/Kegiatan", desc: "Buat program untuk jamaah",   color: "#a855f7" },
    { icon: FileText,  label: "Laporan & Export Data",    desc: "Unduh data & laporan",         color: "#f7c948" },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Sticky Page Header ── */}
      <header
        className="sticky top-0 z-20 glass"
        style={{ borderBottom: "1px solid var(--border-faint)" }}
      >
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          {/* Left: Greeting */}
          <div>
            <h1 className="text-lg font-black leading-tight" style={{ color: "var(--text-primary)" }}>
              Selamat datang kembali, Rahmad Syah Mulya 👋
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Kelola masjid, pantau kehadiran, dan bangun ekosistem kebaikan bersama NAFAS.
            </p>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Location filter */}
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <MapPin size={13} style={{ color: "#00c896" }} />
              Semua Wilayah
              <ChevronDown size={11} />
            </button>

            {/* Date range */}
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <CalendarCheck size={13} style={{ color: "#1da0cf" }} />
              {dateStr}
            </button>

            {/* Bell */}
            <button
              className="relative p-2 rounded-xl transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Bell size={16} style={{ color: "var(--text-secondary)" }} />
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
                style={{
                  background: "#00c896",
                  color: "#030d08",
                  boxShadow: "0 0 8px rgba(0,200,150,0.6)",
                }}
              >
                12
              </span>
            </button>

            {/* Buat Laporan */}
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #00c896, #009e78)",
                color: "#030d08",
                boxShadow: "0 0 20px rgba(0,200,150,0.35)",
              }}
            >
              <Plus size={13} />
              Buat Laporan
            </button>

            {/* Admin chip */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>NAFAS</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, #00c896, #1da0cf)",
                  color: "#030d08",
                  boxShadow: "0 0 12px rgba(0,200,150,0.30)",
                }}
              >
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 p-6 space-y-5">

        {/* ── Row 1: Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            {
              label: "Total Masjid",
              value: formatNumber(data.totalMosques),
              change: "+8 dari minggu lalu", up: true,
              icon: <Building2 size={20} />, iconBg: "rgba(0,200,150,0.15)", iconColor: "#00c896",
            },
            {
              label: "Total Jamaah Terdaftar",
              value: formatNumber(data.totalUsers),
              change: "+12.4%", up: true,
              icon: <Users size={20} />, iconBg: "rgba(29,160,207,0.15)", iconColor: "#1da0cf",
            },
            {
              label: "Rata-rata Kehadiran Subuh",
              value: `${data.subuhPct}%`,
              change: "+6.3%", up: true,
              icon: <TrendingUp size={20} />, iconBg: "rgba(0,200,150,0.12)", iconColor: "#00c896",
            },
            {
              label: "Total Kehadiran Minggu Ini",
              value: formatNumber(data.weeklyAttendance),
              change: "+15.2%", up: true,
              icon: <CalendarCheck size={20} />, iconBg: "rgba(247,201,72,0.12)", iconColor: "#f7c948",
            },
            {
              label: "Masjid Aktif",
              value: formatNumber(data.totalMosques),
              change: `dari total ${formatNumber(data.totalMosques)} masjid`, up: false,
              icon: <CheckCircle2 size={20} />, iconBg: "rgba(16,185,129,0.12)", iconColor: "#10b981",
            },
            {
              label: "Poin Kebaikan Terkumpul",
              value: formatNumber(data.weeklyAttendance * 10),
              change: "+18.7%", up: true,
              icon: <Star size={20} />, iconBg: "rgba(247,201,72,0.15)", iconColor: "#f7c948",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 animate-float-up transition-all duration-300 hover:-translate-y-0.5 cursor-default"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.28)",
                animationDelay: `${i * 0.07}s`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: stat.iconBg }}
                >
                  <span style={{ color: stat.iconColor }}>{stat.icon}</span>
                </div>
                {stat.up && (
                  <div
                    className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,200,150,0.10)", color: "#00c896" }}
                  >
                    <ArrowUpRight size={10} />
                    {stat.change.startsWith("+") ? stat.change : ""}
                  </div>
                )}
              </div>
              <p className="text-xl font-black leading-tight animate-count-enter" style={{ color: "var(--text-primary)" }}>
                {stat.value}
              </p>
              <p className="text-[10px] mt-1 leading-tight" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
              <p className="text-[9px] mt-0.5 font-medium" style={{ color: stat.up ? "#00c896" : "var(--text-muted)" }}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* ── Row 2: Map | AI Insight | Trend ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* Peta Masjid & Geofence */}
          <GlassCard className="xl:col-span-5" padding="p-5" glow>
            <SectionTitle
              action={
                <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#00c896" }}>
                  Kelola Peta <ArrowUpRight size={12} />
                </button>
              }
            >
              Peta Masjid &amp; Geofence
            </SectionTitle>
            <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
              Kelola area masjid dan pantau kehadiran berbasis lokasi
            </p>

            {/* Map placeholder with overlay stats */}
            <div
              data-map-bg
              className="relative rounded-xl overflow-hidden mb-3"
              style={{
                height: 200,
                background: "linear-gradient(135deg, #0a2218, #071c12)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* Fake map dots */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(0,200,150,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              </div>
              {/* Center glow */}
              <div style={{
                position: "absolute", top: "40%", left: "45%",
                width: 80, height: 80, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0,200,150,0.25) 0%, transparent 70%)",
                transform: "translate(-50%,-50%)",
              }} />
              {/* Fake geofence polygon */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 300 200">
                <polygon
                  points="150,40 210,70 230,130 180,160 120,160 70,130 90,70"
                  fill="rgba(0,200,150,0.06)"
                  stroke="rgba(0,200,150,0.4)"
                  strokeWidth="1.5"
                />
                {/* Mosque pins */}
                {[[150,100],[100,90],[200,85],[130,140],[175,55]].map(([cx, cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="5" fill="#00c896" opacity="0.8" />
                    <circle cx={cx} cy={cy} r="10" fill="rgba(0,200,150,0.15)" />
                  </g>
                ))}
              </svg>
              {/* Map label */}
              <div
                data-map-label
                className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-1 rounded-lg"
                style={{ background: "rgba(3,13,8,0.8)", color: "#00c896", border: "1px solid rgba(0,200,150,0.2)" }}
              >
                LIVE MAP
              </div>
            </div>

            {/* Overlay stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: formatNumber(data.weeklyAttendance), label: "Dalam Area Masjid", sub: "Jamaah saat ini", color: "#00c896" },
                { val: formatNumber(Math.round(data.totalMosques * 0.76)), label: "Masjid dengan Geofence", sub: `dari total ${data.totalMosques} masjid`, color: "#1da0cf" },
                { val: formatNumber(Math.round(data.totalMosques * 0.24)), label: "Masjid tanpa Geofence", sub: "Perlu konfigurasi", color: "#f7c948" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-2.5 text-center"
                  style={{
                    background: "var(--bg-elevated)",
                    border: `1px solid ${item.color}22`,
                  }}
                >
                  <p className="text-base font-black" style={{ color: item.color }}>{item.val}</p>
                  <p className="text-[9px] font-semibold mt-0.5 leading-tight" style={{ color: "var(--text-secondary)" }}>{item.label}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
              {[
                { color: "#00c896", label: "Aktif" },
                { color: "#4a6080", label: "Tidak Aktif" },
                { color: "#f7c948", label: "Belum Diatur" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI Insight Ringkasan */}
          <GlassCard className="xl:col-span-3" padding="p-5">
            <SectionTitle
              action={
                <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#00c896" }}>
                  Lihat Detail <ArrowUpRight size={12} />
                </button>
              }
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} style={{ color: "#f7c948" }} />
                AI Insight Ringkasan
              </span>
            </SectionTitle>
            <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
              Analisis AI berdasarkan data kehadiran &amp; aktivitas
            </p>
            <div className="space-y-2.5">
              {AI_INSIGHTS.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200"
                  style={{
                    background: ins.bg,
                    border: `1px solid ${ins.color}22`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${ins.color}22` }}
                  >
                    <ins.icon size={13} style={{ color: ins.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{ins.title}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>{ins.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Tren Kehadiran Subuh */}
          <GlassCard className="xl:col-span-4" padding="p-5">
            <SectionTitle
              action={
                <button
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  7 Hari Terakhir <ChevronDown size={10} />
                </button>
              }
            >
              Tren Kehadiran Subuh
            </SectionTitle>

            <TrendChart values={data.trendNorm} />

            {/* Stat badges */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Tertinggi", val: `${Math.max(...data.trendNorm)}%`, color: "#00c896" },
                { label: "Terendah", val: `${Math.min(...data.trendNorm.filter(v => v > 0), 0)}%`, color: "#f7c948" },
                { label: "Rata-rata", val: `${Math.round(data.trendNorm.reduce((a,b) => a+b,0) / (data.trendNorm.length || 1))}%`, color: "#1da0cf" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-2 rounded-xl"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-faint)" }}
                >
                  <p className="text-sm font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Prayer breakdown */}
            <div className="mt-4 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Breakdown Shalat</p>
              {data.prayers.map((p) => (
                <div key={p.key}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                    <span className="font-bold" style={{ color: PRAYER_COLORS[p.key] ?? "#00c896" }}>{p.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${p.pct}%`,
                        background: `linear-gradient(90deg, ${PRAYER_COLORS[p.key] ?? "#00c896"}, ${PRAYER_COLORS[p.key] ?? "#00c896"}88)`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.prayers.every((p) => p.pct === 0) && (
                <p className="text-[10px] text-center py-2" style={{ color: "var(--text-muted)" }}>Belum ada data bulan ini</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── Row 3: QR | Live | Activities | Quick Actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* QR Code Masjid Otomatis */}
          <GlassCard padding="p-5" gold>
            <SectionTitle>QR Code Masjid Otomatis</SectionTitle>
            <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>QR dinamis berubah otomatis setiap 60 detik</p>

            {/* Mosque name */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,200,150,0.15)" }}>
                  <Building2 size={14} style={{ color: "#00c896" }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>Masjid Agung Bukittinggi</p>
                </div>
              </div>
              <span
                className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,200,150,0.15)", color: "#00c896", border: "1px solid rgba(0,200,150,0.25)" }}
              >
                Aktif
              </span>
            </div>

            {/* QR Code */}
            <div
              className="rounded-xl p-4 flex flex-col items-center gap-3"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-[9px] font-semibold" style={{ color: "var(--text-muted)" }}>QR Code Saat Ini</p>
              {/* SVG QR placeholder */}
              <div
                className="w-28 h-28 rounded-xl p-2 animate-glow-pulse"
                style={{ background: "white" }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* QR pattern */}
                  {[
                    [0,0,30,30],[70,0,30,30],[0,70,30,30],
                  ].map(([x,y,w,h], i) => (
                    <rect key={i} x={x+2} y={y+2} width={w-4} height={h-4} fill="#030d08" rx="3" />
                  ))}
                  {[
                    [5,5,20,20],[75,5,20,20],[5,75,20,20],
                  ].map(([x,y,w,h], i) => (
                    <rect key={i+3} x={x} y={y} width={w} height={h} fill="white" rx="2" />
                  ))}
                  {[
                    [8,8,14,14],[78,8,14,14],[8,78,14,14],
                  ].map(([x,y,w,h], i) => (
                    <rect key={i+6} x={x} y={y} width={w} height={h} fill="#00c896" rx="1" />
                  ))}
                  {/* Center data pattern */}
                  {[[40,10],[50,10],[60,10],[40,20],[60,20],[35,30],[45,30],[55,30],[65,30],
                    [10,40],[20,40],[30,40],[40,40],[60,40],[70,40],[80,40],[90,40],
                    [10,50],[30,50],[50,50],[70,50],[90,50],
                    [10,60],[20,60],[40,60],[60,60],[80,60],
                    [35,70],[45,70],[65,70],[75,70],[85,70],
                    [40,80],[60,80],[70,80],[80,80],[90,80],
                    [40,90],[50,90],[70,90],[90,90],
                  ].map(([x, y], i) => (
                    <rect key={i + 20} x={x} y={y} width={8} height={8} fill="#030d08" />
                  ))}
                </svg>
              </div>

              {/* Countdown */}
              <div className="text-center">
                <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>QR Code akan berubah dalam</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{ color: "#00c896", textShadow: "0 0 20px rgba(0,200,150,0.6)" }}
                  >
                    00
                  </span>
                  <span className="text-xl font-black animate-blink-dot" style={{ color: "#00c896" }}>:</span>
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{ color: "#00c896", textShadow: "0 0 20px rgba(0,200,150,0.6)" }}
                  >
                    47
                  </span>
                </div>
                <p className="text-[8px] mt-1" style={{ color: "var(--text-muted)" }}>detik</p>
              </div>
              <p className="text-[8px]" style={{ color: "var(--text-muted)" }}>Terakhir diperbarui: {dateStr}</p>
            </div>
          </GlassCard>

          {/* Kehadiran Real-time */}
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-1">
              <SectionTitle action={null}>Kehadiran Real-time</SectionTitle>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="relative w-2.5 h-2.5">
                <div className="absolute inset-0 rounded-full bg-[#00c896] animate-pulse-ring" />
                <div className="absolute inset-0.5 rounded-full bg-[#00c896]" />
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Monitoring kehadiran saat ini di semua masjid</p>
            </div>
            <div className="space-y-3">
              {LIVE_MOSQUES.map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,200,150,0.12)" }}
                      >
                        <Building2 size={12} style={{ color: "#00c896" }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{m.name}</p>
                        <p className="text-[8px]" style={{ color: "var(--text-muted)" }}>{m.jamaah} jamaah</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-black"
                      style={{ color: m.pct >= 70 ? "#00c896" : m.pct >= 50 ? "#1da0cf" : "#f7c948" }}
                    >
                      {m.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.pct}%`,
                        background: `linear-gradient(90deg, ${m.pct >= 70 ? "#00c896" : m.pct >= 50 ? "#1da0cf" : "#f7c948"}, ${m.pct >= 70 ? "#009e78" : m.pct >= 50 ? "#1580a8" : "#d4a017"})`,
                        transition: "width 1s ease-out",
                      }}
                    />
                  </div>
                  <p className="text-[8px] mt-0.5" style={{ color: "var(--text-muted)" }}>dari kapasitas</p>
                </div>
              ))}
            </div>
            <button
              className="w-full mt-4 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Lihat Dashboard Detail <ArrowUpRight size={11} />
            </button>
          </GlassCard>

          {/* Aktivitas Terbaru */}
          <GlassCard padding="p-5">
            <SectionTitle
              action={
                <button className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#00c896" }}>
                  Lihat Semua <ArrowUpRight size={11} />
                </button>
              }
            >
              Aktivitas Terbaru
            </SectionTitle>
            <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>Aktivitas sistem terbaru</p>
            <div className="space-y-3">
              {ACTIVITIES.map((act, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${act.color}18` }}
                  >
                    <act.icon size={12} style={{ color: act.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium leading-tight" style={{ color: "var(--text-secondary)" }}>{act.text}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} style={{ color: "var(--text-muted)" }} />
                      <p className="text-[8px]" style={{ color: "var(--text-muted)" }}>{act.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard padding="p-5">
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm mb-4 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #00c896, #009e78)",
                color: "#030d08",
                boxShadow: "0 0 24px rgba(0,200,150,0.35)",
              }}
            >
              <Plus size={16} />
              Tambah Masjid Baru
            </button>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group hover:bg-[rgba(0,200,150,0.05)] hover:border-[rgba(0,200,150,0.2)]"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-faint)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${qa.color}18` }}
                  >
                    <qa.icon size={14} style={{ color: qa.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold truncate" style={{ color: "var(--text-primary)" }}>{qa.label}</p>
                    <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>{qa.desc}</p>
                  </div>
                  <ArrowUpRight size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: qa.color }} />
                </button>
              ))}
            </div>

            {/* Help button */}
            <div
              className="mt-3 p-3 rounded-xl flex items-center gap-2.5"
              style={{
                background: "linear-gradient(135deg, rgba(247,201,72,0.08), rgba(29,160,207,0.06))",
                border: "1px solid rgba(247,201,72,0.18)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(247,201,72,0.15)" }}
              >
                <HelpCircle size={14} style={{ color: "#f7c948" }} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>Butuh Bantuan?</p>
                <p className="text-[8px]" style={{ color: "var(--text-muted)" }}>Kunjungi pusat bantuan atau hubungi tim support kami.</p>
              </div>
              <button
                className="text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                style={{
                  background: "rgba(247,201,72,0.15)",
                  color: "#f7c948",
                  border: "1px solid rgba(247,201,72,0.22)",
                }}
              >
                Pusat Bantuan
              </button>
            </div>
          </GlassCard>
        </div>

        {/* ── Row 4: Recent Attendance Table ── */}
        {data.recentAttendance.length > 0 && (
          <GlassCard padding="p-0">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-faint)" }}>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Kehadiran Terbaru</h2>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Real-time dari semua masjid</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: "#00c896" }}>
                <div className="relative w-2.5 h-2.5">
                  <div className="absolute inset-0 rounded-full bg-[#00c896] animate-pulse-ring" />
                  <div className="absolute inset-0.5 rounded-full bg-[#00c896]" />
                </div>
                LIVE
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-faint)", background: "rgba(0,200,150,0.04)" }}>
                    {["Jamaah", "Masjid", "Shalat", "Metode", "Waktu", "Poin"].map((h) => (
                      <th key={h} className={`py-3 text-[9px] font-bold uppercase tracking-wide ${h === "Poin" ? "text-right pr-5" : "text-left px-4 first:pl-5"}`} style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.recentAttendance as any[]).map((rec) => (
                    <tr key={rec.id} className="border-b last:border-0 transition-colors hover:bg-[rgba(0,200,150,0.04)]" style={{ borderColor: "var(--border-faint)" }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #00c896, #1da0cf)", color: "#030d08" }}
                          >
                            {(rec.user_profiles?.full_name ?? "?")[0]}
                          </div>
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{rec.user_profiles?.full_name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{rec.mosques?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: "rgba(29,160,207,0.15)", color: "#1da0cf", border: "1px solid rgba(29,160,207,0.25)" }}>
                          {getPrayerLabel(rec.prayer_name)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                          style={rec.method === "qr"
                            ? { background: "rgba(0,200,150,0.15)", color: "#00c896", border: "1px solid rgba(0,200,150,0.25)" }
                            : { background: "rgba(247,201,72,0.12)", color: "#f7c948", border: "1px solid rgba(247,201,72,0.22)" }
                          }
                        >
                          {rec.method === "qr" ? "QR" : "Geo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[9px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(rec.checked_in_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-5 py-3 text-right font-bold" style={{ color: "#00c896" }}>
                        +{rec.points_earned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

