import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Settings2, User, Shield, Bell, Info } from "lucide-react";

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

export default async function SettingsPage() {
  const session = await getCurrentUser();

  return (
    <>
      <Topbar title="Pengaturan" subtitle="Konfigurasi akun dan sistem" />
      <div className="flex-1 p-6 space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#0d8c77]/10 flex items-center justify-center">
              <User size={18} className="text-[#0d8c77]" />
            </div>
            <h2 className="font-bold text-slate-900">Profil Admin</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Nama Lengkap
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {session?.profile?.full_name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-900">
                  {session?.user?.email ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Role</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">
                  {session?.profile?.role ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Total Poin
                </p>
                <p className="text-sm font-semibold text-[#0d8c77]">
                  {session?.profile?.total_points ?? 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Shield size={18} className="text-blue-600" />
            </div>
            <h2 className="font-bold text-slate-900">Keamanan</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Password</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reset password melalui email
                </p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                Hubungi superadmin
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Session Aktif
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Login terakhir: {session?.user?.last_sign_in_at
                    ? new Date(session.user.last_sign_in_at).toLocaleString("id-ID")
                    : "—"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Aktif
              </span>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Info size={18} className="text-slate-600" />
            </div>
            <h2 className="font-bold text-slate-900">Informasi Aplikasi</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Nama Aplikasi", value: "NAFAS Admin" },
              { label: "Versi", value: "1.0.0" },
              {
                label: "Deskripsi",
                value: "Network for AI Family & Spiritual Awakening",
              },
              { label: "Framework", value: "Next.js 16 + Supabase" },
              { label: "Tahun", value: "2026" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
              >
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
