"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Star,
  CalendarCheck,
  Trophy,
} from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: "admin" | "mosque_admin" | "jamaah";
  total_points: number;
  total_attendance: number;
  streak_days: number;
  mosque_id: string | null;
  created_at: string;
  mosques: { name: string } | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  mosque_admin: "Admin Masjid",
  jamaah: "Jamaah",
};

const ROLE_VARIANT: Record<string, "success" | "info" | "neutral"> = {
  admin: "success",
  mosque_admin: "info",
  jamaah: "neutral",
};

const PER_PAGE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/v1/users?${params}`);
      const json = await res.json();
      setUsers(json.data?.data ?? []);
      setTotal(json.data?.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <Topbar title="Pengguna" subtitle="Kelola data jamaah yang terdaftar" />
      <div className="flex-1 p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Input
            placeholder="Cari nama atau email..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77] text-slate-700"
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="mosque_admin">Admin Masjid</option>
            <option value="jamaah">Jamaah</option>
          </select>
          <span className="sm:ml-auto text-sm text-slate-500">
            {formatNumber(total)} pengguna
          </span>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-[#0d8c77] border-t-transparent rounded-full animate-spin" />
                Memuat data...
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Users size={32} className="text-slate-300" />
                <p className="text-sm">Tidak ada pengguna ditemukan</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Pengguna
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Masjid
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <div className="flex items-center gap-1">
                        <Trophy size={12} />
                        Poin
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <div className="flex items-center gap-1">
                        <CalendarCheck size={12} />
                        Kehadiran
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <div className="flex items-center gap-1">
                        <Star size={12} />
                        Streak
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Bergabung
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0d8c77] to-[#0e5b8d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {user.full_name[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={ROLE_VARIANT[user.role] ?? "neutral"}>
                          {ROLE_LABEL[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        {user.mosques?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#0d8c77]">
                        {formatNumber(user.total_points)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {formatNumber(user.total_attendance)}x
                      </td>
                      <td className="px-4 py-3.5">
                        {user.streak_days >= 7 ? (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            {user.streak_days} hari
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {user.streak_days} hari
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

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
