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
  Download,
  Edit2,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export";
import type { Mosque, UserProfile } from "@/types";

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
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "jamaah" as UserProfile["role"],
    mosque_id: "" as string | null,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);


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

  const fetchMosques = useCallback(async () => {
    const res = await fetch("/api/v1/mosque?per_page=100");
    const json = await res.json();
    setMosques(json.data?.data ?? []);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchMosques();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, roleFilter]);

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      fullName: "",
      role: "jamaah",
      mosque_id: null,
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setIsAdding(false);
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      fullName: user.full_name,
      role: user.role,
      mosque_id: user.mosque_id,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = "/api/v1/users";
      const method = isAdding ? "POST" : "PATCH";
      const payload = isAdding
        ? formData
        : {
            id: editingUser?.id,
            role: formData.role,
            full_name: formData.fullName,
            mosque_id: formData.mosque_id
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowFormModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengguna ini? Semua data terkait termasuk riwayat kehadiran akan hilang.")) return;
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/v1/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <Topbar title="Pengguna" subtitle="Kelola data jamaah yang terdaftar" />
      <div className="flex-1 p-6 space-y-6">
        {/* Filters & Actions */}
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <Input
              placeholder="Cari nama atau email..."
              leftIcon={<Search size={15} />}
              value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="sm:w-64"
            />
            <select
              value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77] text-slate-700"
            >
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="mosque_admin">Admin Masjid</option>
              <option value="jamaah">Jamaah</option>
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={() => exportToCSV(users, `pengguna-${new Date().toISOString().split('T')[0]}.csv`)} disabled={users.length === 0}>
              <Download size={15} />
              Ekspor CSV
            </Button>
            <Button onClick={handleOpenAdd}>
              <Plus size={15} />
              Tambah Pengguna
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
                      Bergabung
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Aksi
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
        {(user as UserProfile & { mosques?: { name: string } }).mosques?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#0d8c77]">
                        {formatNumber(user.total_points)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {formatNumber(user.total_attendance)}x
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#0d8c77] transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteLoading === user.id}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            {deleteLoading === user.id ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
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

      {/* Add/Edit User Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">
                {isAdding ? "Tambah Pengguna Baru" : "Edit Profil Pengguna"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nama Lengkap *"
                placeholder="Rahmad Syah..."
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <Input
                label="Email *"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!isAdding}
              />
              {isAdding && (
                <Input
                  label="Password *"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77]"
                >
                  <option value="jamaah">Jamaah</option>
                  <option value="mosque_admin">Admin Masjid</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Masjid Terkait</label>
                <select
                  value={formData.mosque_id || ""}
                  onChange={(e) => setFormData({ ...formData, mosque_id: e.target.value || null })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77]"
                >
                  <option value="">Pilih Masjid (Opsional)</option>
                  {mosques.map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.city}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowFormModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" loading={formLoading}>
                  {isAdding ? "Tambah" : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
