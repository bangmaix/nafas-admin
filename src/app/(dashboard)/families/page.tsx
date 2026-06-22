"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Family {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  family_members: [{ count: number }];
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingFamily, setEditingUser] = useState<Family | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "" });

  const fetchFamilies = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/families?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      setFamilies(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingUser(null);
    setFormData({ name: "", address: "" });
    setShowFormModal(true);
  };

  const handleOpenEdit = (family: Family) => {
    setIsAdding(false);
    setEditingUser(family);
    setFormData({ name: family.name, address: family.address || "" });
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = isAdding ? "/api/v1/families" : `/api/v1/families/${editingFamily?.id}`;
      const method = isAdding ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowFormModal(false);
      fetchFamilies(search);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data keluarga ini?")) return;
    try {
      const res = await fetch(`/api/v1/families/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      fetchFamilies(search);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <Topbar title="Keluarga & Komunitas" subtitle="Kelola data unit keluarga jamaah" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Input
            placeholder="Cari nama keluarga..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />
          <Button onClick={handleOpenAdd}>
            <Plus size={16} />
            Tambah Keluarga
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-5" />
                <div className="h-8 bg-slate-50 rounded-xl w-full" />
              </Card>
            ))
          ) : families.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400">
              <Heart size={48} className="mx-auto mb-4 opacity-20" />
              <p>Belum ada data keluarga</p>
            </div>
          ) : (
            families.map((family) => (
              <Card key={family.id} hover className="group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                    <Heart size={20} className="text-pink-500 fill-pink-50" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(family)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(family.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Keluarga {family.name}</h3>
                <p className="text-xs text-slate-500 mb-4 truncate">{family.address || "Alamat belum diatur"}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Users size={14} className="text-[#0d8c77]" />
                    {family.family_members[0]?.count || 0} Anggota
                  </div>
                  <button className="flex items-center gap-1 text-[10px] font-bold text-[#0d8c77] hover:underline">
                    Kelola Anggota <ChevronRight size={10} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">
                {isAdding ? "Tambah Keluarga Baru" : "Edit Data Keluarga"}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nama Keluarga *"
                placeholder="Misal: Bp. Ahmad / Syah Mulya"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Alamat</label>
                <textarea
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#0d8c77]"
                  placeholder="Alamat lengkap..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowFormModal(false)}>
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
