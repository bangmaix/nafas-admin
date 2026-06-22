"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  CalendarCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
} from "lucide-react";
import { formatDateTime, getPrayerLabel } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export";

interface AttendanceRecord {
  id: string;
  prayer_name: string;
  method: "qr" | "geo";
  checked_in_at: string;
  points_earned: number;
  is_valid: boolean;
  user_profiles: { full_name: string; email: string } | null;
  mosques: { name: string } | null;
}

const PRAYER_OPTIONS = ["", "subuh", "dzuhur", "ashar", "maghrib", "isya"];
const PER_PAGE = 20;

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prayerFilter, setPrayerFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });
      if (prayerFilter) params.set("prayer_name", prayerFilter);
      if (methodFilter) params.set("method", methodFilter);

      const res = await fetch(`/api/v1/attendance?${params}`);
      const json = await res.json();
      setRecords(json.data?.data ?? []);
      setTotal(json.data?.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, prayerFilter, methodFilter]);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, prayerFilter, methodFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data kehadiran ini? Poin jamaah tidak akan otomatis berkurang.")) return;
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/v1/attendance/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      fetchAttendance();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  const filteredRecords = search
    ? records.filter(
        (r) =>
          r.user_profiles?.full_name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          r.mosques?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  return (
    <>
      <Topbar
        title="Kehadiran"
        subtitle="Riwayat absensi jamaah dari semua masjid"
      />
      <div className="flex-1 p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Cari jamaah atau masjid..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <div className="flex gap-2 items-center">
            <Filter size={15} className="text-slate-400 flex-shrink-0" />
            <select
              value={prayerFilter}
              onChange={(e) => { setPrayerFilter(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77] text-slate-700"
            >
              <option value="">Semua Shalat</option>
              {PRAYER_OPTIONS.filter(Boolean).map((p) => (
                <option key={p} value={p}>
                  {getPrayerLabel(p)}
                </option>
              ))}
            </select>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77] text-slate-700"
            >
              <option value="">Semua Metode</option>
              <option value="qr">QR Code</option>
              <option value="geo">Geofence</option>
            </select>
          </div>
          <div className="sm:ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {total} total data
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={records.length === 0}
              onClick={() => exportToCSV(records, `kehadiran-${new Date().toISOString().split('T')[0]}.csv`)}
            >
              <Download size={14} className="mr-1.5" />
              Ekspor
            </Button>
          </div>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-[#0d8c77] border-t-transparent rounded-full animate-spin" />
                Memuat data...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <CalendarCheck size={32} className="text-slate-300" />
                <p className="text-sm">Belum ada data kehadiran</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Jamaah
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Masjid
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Shalat
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Metode
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Waktu
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Poin
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0d8c77] to-[#0e5b8d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(record.user_profiles?.full_name ?? "?")[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {record.user_profiles?.full_name ?? "—"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {record.user_profiles?.email ?? ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {record.mosques?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="info">
                          {getPrayerLabel(record.prayer_name)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={record.method === "qr" ? "success" : "warning"}
                        >
                          {record.method === "qr" ? "QR" : "Geo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {formatDateTime(record.checked_in_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={record.is_valid ? "success" : "error"}>
                          {record.is_valid ? "Valid" : "Tidak Valid"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#0d8c77]">
                        +{record.points_earned}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deleteLoading === record.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        >
                          {deleteLoading === record.id ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
