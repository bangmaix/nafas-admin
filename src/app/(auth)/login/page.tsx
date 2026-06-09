"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Shield, Users, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

const FEATURES = [
  { icon: Shield,    text: "Keamanan multi-layer dengan enkripsi end-to-end" },
  { icon: Users,     text: "Kelola ribuan jamaah & masjid dalam satu platform" },
  { icon: BarChart3, text: "Analitik kehadiran sholat berbasis AI realtime" },
];

// Deterministic star positions
const STARS = [
  { x: 5,  y: 12, s: 1.5, o: 0.6 }, { x: 14, y: 35, s: 1.0, o: 0.4 },
  { x: 23, y: 8,  s: 2.0, o: 0.7 }, { x: 31, y: 55, s: 1.0, o: 0.5 },
  { x: 42, y: 22, s: 1.5, o: 0.6 }, { x: 51, y: 68, s: 1.0, o: 0.4 },
  { x: 63, y: 15, s: 2.0, o: 0.5 }, { x: 72, y: 42, s: 1.0, o: 0.6 },
  { x: 83, y: 78, s: 1.5, o: 0.4 }, { x: 91, y: 28, s: 1.0, o: 0.7 },
  { x: 8,  y: 62, s: 1.0, o: 0.3 }, { x: 19, y: 88, s: 1.5, o: 0.5 },
  { x: 38, y: 72, s: 1.0, o: 0.4 }, { x: 57, y: 91, s: 2.0, o: 0.6 },
  { x: 76, y: 58, s: 1.0, o: 0.5 }, { x: 88, y: 85, s: 1.5, o: 0.4 },
];

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const isLight = theme === "light";

  const palette = {
    page: isLight
      ? "linear-gradient(135deg, #f8fffb 0%, #e8fdf2 38%, #ecfeff 68%, #fff7ed 100%)"
      : "linear-gradient(135deg, #030e06 0%, #041a0d 50%, #020b05 100%)",
    shellShadow: isLight
      ? "0 34px 90px rgba(15, 118, 110, 0.18), 0 0 0 1px rgba(15, 118, 110, 0.13)"
      : "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(5,150,105,0.18)",
    brandPanel: isLight
      ? "linear-gradient(160deg, #047857 0%, #0d9488 48%, #14b8a6 100%)"
      : "linear-gradient(160deg, #064e3b 0%, #065f46 40%, #047857 70%, #064e3b 100%)",
    formPanel: isLight ? "rgba(255,255,255,0.82)" : "rgba(3, 10, 6, 0.97)",
    formBorder: isLight ? "rgba(15,118,110,0.12)" : "rgba(5,150,105,0.18)",
    title: isLight ? "#0f2419" : "#e2f0ec",
    muted: isLight ? "#527a62" : "#3d7060",
    label: isLight ? "#047857" : "#6ee7b7",
    fieldBg: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.035)",
    fieldBorder: isLight ? "rgba(15,118,110,0.18)" : "rgba(5,150,105,0.22)",
    fieldText: isLight ? "#0f2419" : "#e2f0ec",
    icon: isLight ? "#5b8a70" : "#3d7060",
    accent: isLight ? "#047857" : "#10b981",
    footer: isLight ? "#658872" : "#1a3a25",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Test credentials bypass (for development)
    if (email === "admin@nafas.id" && password === "admin123") {
      // Set a session token in localStorage for testing
      localStorage.setItem("test_user_token", "test-token-admin");
      localStorage.setItem("test_user_email", email);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError("Email atau password salah. Silakan coba lagi.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Konfigurasi Supabase belum lengkap. Hubungi administrator.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: palette.page }}
    >
      <div
        className="absolute right-4 top-4 md:right-6 md:top-6 z-20 flex items-center gap-3 rounded-2xl px-3 py-2"
        style={{
          background: isLight ? "rgba(255,255,255,0.72)" : "rgba(3, 15, 9, 0.72)",
          border: `1px solid ${isLight ? "rgba(15,118,110,0.13)" : "rgba(5,150,105,0.18)"}`,
          boxShadow: isLight
            ? "0 16px 40px rgba(15,118,110,0.14)"
            : "0 18px 40px rgba(0,0,0,0.32)",
          backdropFilter: "blur(18px) saturate(150%)",
          WebkitBackdropFilter: "blur(18px) saturate(150%)",
        }}
      >
        <ThemeToggle />
      </div>

      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.s, height: s.s,
            background: isLight ? "#059669" : "#ffffff",
            opacity: isLight ? s.o * 0.28 : s.o,
            boxShadow: isLight
              ? `0 0 ${s.s * 4}px rgba(5,150,105,0.26)`
              : `0 0 ${s.s * 2}px rgba(255,255,255,0.5)`,
          }}
        />
      ))}

      {/* Glow orbs */}
      <div className="absolute pointer-events-none" style={{ top: "-15%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: isLight ? "radial-gradient(circle, rgba(16,185,129,0.28) 0%, transparent 65%)" : "radial-gradient(circle, rgba(5,150,105,0.14) 0%, transparent 65%)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-20%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: isLight ? "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 65%)" : "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)" }} />
      <div className="absolute pointer-events-none" style={{ top: "30%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: isLight ? "radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 65%)" : "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 65%)" }} />

      {/* ── Main card — split layout ── */}
      <div
        className="w-full max-w-4xl relative z-10 flex rounded-3xl overflow-hidden"
        style={{ boxShadow: palette.shellShadow }}
      >
        {/* ── LEFT — Branding panel ── */}
        <div
          className="hidden md:flex flex-col justify-between p-10 w-[44%] relative overflow-hidden"
          style={{ background: palette.brandPanel }}
        >
          {/* Dot grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
          {/* Decorative circles */}
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: "rgba(0,0,0,0.18)" }} />
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                <span className="text-xl font-black text-white" style={{ letterSpacing: "-1px" }}>N</span>
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">NAFAS Admin</p>
                <p className="text-emerald-200 text-[11px] leading-tight opacity-75">Dashboard Manajemen</p>
              </div>
            </div>

            <h2 className="text-[28px] font-bold text-white leading-snug mb-3">
              Kelola Masjid<br />dan Jamaah<br />
              <span style={{ color: "#6ee7b7" }}>Mudah &amp; Cerdas</span>
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed" style={{ opacity: 0.78 }}>
              Platform admin terpadu untuk memantau kehadiran sholat, mengelola data masjid, dan menganalisis tren ibadah jamaah secara realtime.
            </p>
          </div>

          {/* Feature list */}
          <div className="relative z-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Icon size={14} className="text-emerald-200" />
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed" style={{ opacity: 0.82 }}>{text}</p>
              </div>
            ))}
            <p className="text-emerald-200 text-[11px] pt-2" style={{ opacity: 0.55 }}>
              © 2026 NAFAS · Network for AI Family &amp; Spiritual Awakening
            </p>
          </div>
        </div>

        {/* ── RIGHT — Form panel ── */}
        <div
          className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14 relative"
          style={{
            background: palette.formPanel,
            borderLeft: `1px solid ${palette.formBorder}`,
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
          }}
        >
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #059669, #0d9488)", boxShadow: "0 0 16px rgba(5,150,105,0.4)" }}>
              <span className="text-base font-black text-white">N</span>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: palette.title }}>NAFAS Admin</p>
              <p className="text-xs" style={{ color: palette.muted }}>Dashboard Manajemen</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: palette.title }}>Masuk ke Dashboard</h1>
            <p className="text-sm" style={{ color: palette.muted }}>Masukkan akun admin Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}>
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: palette.label }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: palette.icon }} />
                <input
                  type="email"
                  placeholder="admin@nafas.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-colors duration-200"
                  style={{ background: palette.fieldBg, border: `1px solid ${palette.fieldBorder}`, color: palette.fieldText, caretColor: palette.accent, boxShadow: isLight ? "0 1px 0 rgba(255,255,255,0.8) inset" : "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.65)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = palette.fieldBorder)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: palette.label }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: palette.icon }} />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-28 py-3.5 rounded-xl text-sm outline-none transition-colors duration-200"
                  style={{ background: palette.fieldBg, border: `1px solid ${palette.fieldBorder}`, color: palette.fieldText, caretColor: palette.accent, boxShadow: isLight ? "0 1px 0 rgba(255,255,255,0.8) inset" : "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.65)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = palette.fieldBorder)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors"
                  style={{ color: palette.muted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = palette.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = palette.muted)}
                >
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200"
              style={{
                background: loading ? "rgba(5,150,105,0.35)" : "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                color: "#ffffff",
                boxShadow: loading ? "none" : "0 4px 24px rgba(5,150,105,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 6px 32px rgba(5,150,105,0.55)"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 24px rgba(5,150,105,0.35)"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Memverifikasi...
                </span>
              ) : "Masuk"}
            </button>

            <p className="text-center text-xs" style={{ color: palette.muted }}>
              Lupa password?{" "}
              <a href="#" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: palette.accent }}>
                Reset di sini
              </a>
            </p>
          </form>
        </div>
      </div>

      <p className="absolute bottom-5 text-center text-xs w-full md:hidden" style={{ color: palette.footer }}>
        © 2026 NAFAS · Seluruh hak dilindungi
      </p>
    </div>
  );
}
