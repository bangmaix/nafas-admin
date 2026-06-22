"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  CalendarCheck,
  QrCode,
  Users,
  Heart,
  CalendarDays,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronDown,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

const NAV_SECTIONS: {
  label?: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    disabled?: boolean;
  }[];
}[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Masjid",
    items: [
      { href: "/mosque", label: "Manajemen Masjid", icon: Building2 },
      { href: "/mosque", label: "Peta & Geofence", icon: MapPin },
    ],
  },
  {
    label: "Jamaah",
    items: [
      { href: "/attendance", label: "Kehadiran", icon: CalendarCheck },
      { href: "/qr", label: "QR Code Masjid", icon: QrCode },
      { href: "/users", label: "Pengguna", icon: Users },
      { href: "#", label: "Keluarga & Komunitas", icon: Heart, disabled: true },
      { href: "/programs", label: "Program & Kegiatan", icon: CalendarDays },
    ],
  },
  {
    label: "Analitik",
    items: [
      { href: "#", label: "Laporan & Analisis", icon: BarChart3, disabled: true },
      { href: "/insight", label: "AI Insight", icon: Sparkles, badge: "New" },
      { href: "#", label: "Notifikasi", icon: Bell, disabled: true },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/settings", label: "Pengaturan Sistem", icon: Settings },
      { href: "#", label: "Audit Log", icon: Shield, disabled: true },
      { href: "#", label: "Bantuan & Panduan", icon: HelpCircle, disabled: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 w-[268px] flex flex-col z-30 glass"
      style={{ borderRight: "1px solid var(--border-subtle)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-faint)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #00c896, #009e78)",
            boxShadow: "0 0 22px rgba(0,200,150,0.45), 0 0 44px rgba(0,200,150,0.12)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 C8.5 3 6 6 6 9.5 L6 13 L18 13 L18 9.5 C18 6 15.5 3 12 3Z" fill="white" opacity="0.9"/>
            <rect x="4" y="8" width="2.5" height="7" rx="1" fill="white" opacity="0.65"/>
            <rect x="17.5" y="8" width="2.5" height="7" rx="1" fill="white" opacity="0.65"/>
            <path d="M10.5 13 L10.5 16 Q12 17 13.5 16 L13.5 13Z" fill="white" opacity="0.5"/>
            <path d="M12 1.5 C10.8 1.5 10 2.3 10 2.8 C10.7 2.5 11.3 2.3 12 2.3 C12.7 2.3 13.3 2.5 14 2.8 C14 2.3 13.2 1.5 12 1.5Z" fill="#f7c948" opacity="0.9"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm leading-tight tracking-widest" style={{ color: "#00c896" }}>NAFAS</p>
          <p className="text-[9px] font-medium leading-tight mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
            Network for AI Family &amp; Spiritual Awakening
          </p>
        </div>
        <div className="relative w-3 h-3 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-[#00c896] animate-pulse-ring" />
          <div className="absolute inset-0.5 rounded-full bg-[#00c896] animate-blink-dot" />
        </div>
      </div>

      {/* User Profile */}
      <div
        className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-faint)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, #00c896, #1da0cf)",
            boxShadow: "0 0 12px rgba(0,200,150,0.35)",
            color: "#030d08",
          }}
        >
          R
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>Rahmad Syah Mulya</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(0,200,150,0.15)",
                color: "#00c896",
                border: "1px solid rgba(0,200,150,0.25)",
              }}
            >
              Super Admin
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-blink-dot" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 min-h-0">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p
                className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, badge, disabled }) => {
                const active =
                  !disabled &&
                  (pathname === href ||
                    (href !== "/" && href !== "#" && pathname.startsWith(href + "/")));
                return (
                  <Link
                    key={label}
                    href={disabled ? "#" : href}
                    onClick={disabled ? (e) => e.preventDefault() : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group",
                      disabled && "cursor-not-allowed",
                      !active && !disabled && (isLight ? "hover:bg-emerald-50/70" : "hover:bg-white/[0.04]")
                    )}
                    style={
                      active
                        ? isLight
                          ? {
                              background: "rgba(16,185,129,0.13)",
                              border: "1px solid rgba(16,185,129,0.28)",
                              color: "#064e3b",
                            }
                          : {
                              background:
                                "linear-gradient(90deg, rgba(0,200,150,0.15) 0%, rgba(29,160,207,0.07) 100%)",
                              border: "1px solid rgba(0,200,150,0.28)",
                              color: "#e2f0ec",
                            }
                        : {
                            border: "1px solid transparent",
                            color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
                          }
                    }
                  >
                    <Icon
                      size={15}
                      style={
                        active
                          ? { color: isLight ? "#059669" : "#00c896", filter: `drop-shadow(0 0 5px ${isLight ? "rgba(16,185,129,0.5)" : "rgba(0,200,150,0.65)"})` }
                          : disabled
                          ? { color: "var(--text-muted)" }
                          : {}
                      }
                      className={!active && !disabled ? (isLight ? "text-slate-500 group-hover:text-emerald-600 transition-colors" : "text-slate-500 group-hover:text-slate-300 transition-colors") : ""}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge && (
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "linear-gradient(90deg, #f7c948, #f59e0b)",
                          color: "#030d08",
                          boxShadow: "0 0 8px rgba(247,201,72,0.5)",
                        }}
                      >
                        {badge}
                      </span>
                    )}
                    {active && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#00c896", boxShadow: "0 0 6px #00c896" }}
                      />
                    )}
                    {!active && !disabled && !badge && (
                      <ChevronDown size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--text-muted)" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Mobile App CTA */}
      <div
        className="mx-3 mb-3 p-3 rounded-xl flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, rgba(0,200,150,0.10), rgba(29,160,207,0.06))",
          border: "1px solid rgba(0,200,150,0.16)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,200,150,0.18)" }}
          >
            <Smartphone size={16} style={{ color: "#00c896" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              NAFAS MOBILE APP
            </p>
            <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>
              Pantau kehadiran &amp; aktivitas dimanapun Anda berada.
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2.5">
          {["App Store", "Google Play"].map((s) => (
            <button
              key={s}
              className="flex-1 text-[8px] font-bold py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: "rgba(0,200,150,0.12)",
                border: "1px solid rgba(0,200,150,0.22)",
                color: "#00c896",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,200,150,0.22)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,200,150,0.12)"; }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Theme toggle + Logout */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border-faint)" }}>
        {/* Theme row */}
        <div className="flex items-center justify-between px-3 py-2 mb-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
          <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>Mode Tampilan</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{ color: "rgba(248,113,113,0.70)", border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.color = "rgb(252,165,165)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(248,113,113,0.70)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
