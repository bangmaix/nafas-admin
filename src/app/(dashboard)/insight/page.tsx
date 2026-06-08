import { Topbar } from "@/components/layout/topbar";
import { Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  CalendarCheck,
  Building2,
  Star,
  Trophy,
  BarChart3,
} from "lucide-react";
import { formatNumber, getPrayerLabel } from "@/lib/utils";
import { createServiceClient } from "@/lib/supabase/server";

async function getInsightData() {
  const supabase = await createServiceClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [
    { count: totalAttendanceMonth },
    { count: totalAttendanceLastMonth },
    { data: prayerBreakdown },
    { data: topUsers },
    { data: topMosques },
    { data: methodBreakdown },
    { count: newUsersMonth },
  ] = await Promise.all([
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("checked_in_at", monthStart),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("checked_in_at", lastMonthStart)
      .lte("checked_in_at", lastMonthEnd),
    supabase
      .from("attendance")
      .select("prayer_name")
      .gte("checked_in_at", monthStart),
    supabase
      .from("user_profiles")
      .select("id, full_name, email, total_points, total_attendance, streak_days")
      .order("total_points", { ascending: false })
      .limit(10),
    supabase
      .from("mosques")
      .select("id, name, city, total_members")
      .eq("is_active", true)
      .order("total_members", { ascending: false })
      .limit(5),
    supabase
      .from("attendance")
      .select("method")
      .gte("checked_in_at", monthStart),
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
  ]);

  // Prayer counts
  const prayerCounts: Record<string, number> = {};
  const totalPrayers = (prayerBreakdown ?? []).length;
  (prayerBreakdown ?? []).forEach((r: any) => {
    const k = r.prayer_name.toLowerCase();
    prayerCounts[k] = (prayerCounts[k] ?? 0) + 1;
  });

  const prayers = ["subuh", "dzuhur", "ashar", "maghrib", "isya"].map((k) => ({
    key: k,
    name: getPrayerLabel(k),
    count: prayerCounts[k] ?? 0,
    pct: totalPrayers > 0 ? Math.round(((prayerCounts[k] ?? 0) / totalPrayers) * 100) : 0,
  }));

  // Method breakdown
  const methodCounts: Record<string, number> = { qr: 0, geo: 0 };
  (methodBreakdown ?? []).forEach((r: any) => {
    methodCounts[r.method] = (methodCounts[r.method] ?? 0) + 1;
  });
  const totalMethods = methodCounts.qr + methodCounts.geo;

  // Month-over-month growth
  const growth =
    (totalAttendanceLastMonth ?? 0) > 0
      ? Math.round(
          (((totalAttendanceMonth ?? 0) - (totalAttendanceLastMonth ?? 0)) /
            (totalAttendanceLastMonth ?? 1)) *
            100
        )
      : 0;

  return {
    totalAttendanceMonth: totalAttendanceMonth ?? 0,
    growth,
    prayers,
    topUsers: topUsers ?? [],
    topMosques: topMosques ?? [],
    methodCounts,
    totalMethods,
    newUsersMonth: newUsersMonth ?? 0,
  };
}

const PRAYER_COLORS: Record<string, string> = {
  subuh: "#0d8c77",
  dzuhur: "#0e5b8d",
  ashar: "#f59e0b",
  maghrib: "#10b981",
  isya: "#6366f1",
};

export default async function InsightPage() {
  const data = await getInsightData();

  return (
    <>
      <Topbar
        title="Insight AI"
        subtitle="Analitik kehadiran dan tren jamaah bulan ini"
      />
      <div className="flex-1 p-6 space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Kehadiran Bulan Ini"
            value={formatNumber(data.totalAttendanceMonth)}
            icon={<CalendarCheck size={22} className="text-[#0d8c77]" />}
            change={
              data.growth >= 0
                ? `+${data.growth}% dari bulan lalu`
                : `${data.growth}% dari bulan lalu`
            }
            changeType={data.growth >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Pengguna Baru"
            value={formatNumber(data.newUsersMonth)}
            icon={<Users size={22} className="text-[#0e5b8d]" />}
            iconBg="bg-[#0e5b8d]/10"
            change="Bergabung bulan ini"
            changeType="up"
          />
          <StatCard
            label="Dominan QR"
            value={
              data.totalMethods > 0
                ? `${Math.round((data.methodCounts.qr / data.totalMethods) * 100)}%`
                : "0%"
            }
            icon={<BarChart3 size={22} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            change={`${formatNumber(data.methodCounts.qr)} via QR Code`}
            changeType="neutral"
          />
          <StatCard
            label="Dominan Geo"
            value={
              data.totalMethods > 0
                ? `${Math.round((data.methodCounts.geo / data.totalMethods) * 100)}%`
                : "0%"
            }
            icon={<TrendingUp size={22} className="text-amber-500" />}
            iconBg="bg-amber-50"
            change={`${formatNumber(data.methodCounts.geo)} via Geofence`}
            changeType="neutral"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Prayer breakdown */}
          <Card>
            <h2 className="font-bold text-slate-900 mb-1">Distribusi Shalat</h2>
            <p className="text-xs text-slate-400 mb-4">Berdasarkan total absensi bulan ini</p>
            <div className="space-y-4">
              {data.prayers.map((p) => (
                <div key={p.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="font-bold text-slate-900">
                      {formatNumber(p.count)}
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        ({p.pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.pct}%`,
                        background: PRAYER_COLORS[p.key] ?? "#0d8c77",
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.prayers.every((p) => p.count === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Belum ada data bulan ini
                </p>
              )}
            </div>
          </Card>

          {/* Top mosques */}
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-[#0d8c77]" />
              <h2 className="font-bold text-slate-900">Masjid Terpopuler</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Berdasarkan jumlah anggota</p>
            <div className="space-y-3">
              {data.topMosques.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Belum ada data
                </p>
              ) : (
                data.topMosques.map((mosque: any, i) => (
                  <div key={mosque.id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{
                        background:
                          i === 0
                            ? "linear-gradient(135deg,#f59e0b,#f97316)"
                            : i === 1
                            ? "linear-gradient(135deg,#94a3b8,#64748b)"
                            : i === 2
                            ? "linear-gradient(135deg,#b45309,#92400e)"
                            : "#f1f5f9",
                        color: i < 3 ? "white" : "#64748b",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {mosque.name}
                      </p>
                      <p className="text-xs text-slate-400">{mosque.city}</p>
                    </div>
                    <span className="text-sm font-bold text-[#0d8c77] flex-shrink-0">
                      {formatNumber(mosque.total_members ?? 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Top users */}
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-900">Leaderboard</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Top 10 jamaah berdasarkan poin</p>
            <div className="space-y-3">
              {data.topUsers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Belum ada data
                </p>
              ) : (
                data.topUsers.map((user: any, i) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{
                        background:
                          i === 0
                            ? "linear-gradient(135deg,#f59e0b,#f97316)"
                            : i === 1
                            ? "linear-gradient(135deg,#94a3b8,#64748b)"
                            : i === 2
                            ? "linear-gradient(135deg,#b45309,#92400e)"
                            : "#f1f5f9",
                        color: i < 3 ? "white" : "#64748b",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.full_name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">
                          {user.total_attendance}x hadir
                        </span>
                        {user.streak_days >= 7 && (
                          <Badge variant="warning">
                            <Star size={9} className="mr-0.5" />
                            {user.streak_days}d
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#0d8c77] flex-shrink-0">
                      {formatNumber(user.total_points)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
