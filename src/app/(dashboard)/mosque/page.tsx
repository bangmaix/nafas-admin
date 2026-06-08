"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Mosque } from "@/types";

const MosqueMapEditor = dynamic(
  () => import("@/components/map/mosque-map-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-slate-100 rounded-2xl animate-pulse" />
    ),
  }
);

interface MosqueFormData {
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: string;
  longitude: string;
  geofence_radius: string;
}

const EMPTY_FORM: MosqueFormData = {
  name: "",
  address: "",
  city: "",
  province: "",
  latitude: "",
  longitude: "",
  geofence_radius: "100",
};

export default function MosquePage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMosque, setEditingMosque] = useState<Mosque | null>(null);
  const [formData, setFormData] = useState<MosqueFormData>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMosques = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = `/api/v1/mosque?per_page=50${q ? `&search=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      setMosques(json.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMosques();
  }, [fetchMosques]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchMosques(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchMosques]);

  const openAddModal = () => {
    setEditingMosque(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (mosque: Mosque) => {
    setEditingMosque(mosque);
    setFormData({
      name: mosque.name,
      address: mosque.address ?? "",
      city: mosque.city,
      province: mosque.province,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      geofence_radius: String(mosque.geofence_radius),
    });
    setFormError("");
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        geofence_radius: parseInt(formData.geofence_radius),
      };

      const res = await fetch(
        editingMosque ? `/api/v1/mosque/${editingMosque.id}` : "/api/v1/mosque",
        {
          method: editingMosque ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Terjadi kesalahan");

      setShowFormModal(false);
      fetchMosques(search);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus masjid ini?")) return;
    setDeleteId(id);
    try {
      await fetch(`/api/v1/mosque/${id}`, { method: "DELETE" });
      if (selectedMosque?.id === id) setSelectedMosque(null);
      fetchMosques(search);
    } finally {
      setDeleteId(null);
    }
  };

  const handleSaveGeofence = async (polygon: [number, number][][]) => {
    if (!selectedMosque) return;
    await fetch(`/api/v1/mosque/${selectedMosque.id}/geofence`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polygon }),
    });
    setShowEditor(false);
    fetchMosques(search);
  };

  return (
    <>
      <Topbar
        title="Manajemen Masjid"
        subtitle="Kelola profil masjid dan area geofence"
      />
      <div className="flex-1 p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Input
            placeholder="Cari nama masjid atau kota..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-72"
          />
          <Button onClick={openAddModal}>
            <Plus size={16} />
            Tambah Masjid
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Mosque list */}
          <div className="xl:col-span-2 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} padding="sm">
                  <div className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : mosques.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Tidak ada masjid ditemukan
              </div>
            ) : (
              mosques.map((mosque) => (
                <Card
                  key={mosque.id}
                  hover
                  padding="sm"
                  className={`cursor-pointer transition-all ${
                    selectedMosque?.id === mosque.id
                      ? "ring-2 ring-[#0d8c77]"
                      : ""
                  }`}
                  onClick={() => setSelectedMosque(mosque)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d8c77]/20 to-[#0e5b8d]/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-[#0d8c77]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {mosque.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {mosque.city}, {mosque.province}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={mosque.is_active ? "success" : "neutral"}>
                          {mosque.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                        <Badge
                          variant={mosque.geofence_polygon ? "info" : "warning"}
                        >
                          {mosque.geofence_polygon
                            ? "Geofence ✓"
                            : "Belum ada area"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">
                        {formatNumber(mosque.total_members ?? 0)}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">
                        <Users size={10} /> anggota
                      </p>
                    </div>
                  </div>
                  {selectedMosque?.id === mosque.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditor(true);
                        }}
                      >
                        <Edit2 size={13} /> Edit Area
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(mosque);
                        }}
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deleteId === mosque.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mosque.id);
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Map panel */}
          <div className="xl:col-span-3">
            <Card padding="none" className="sticky top-20 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {selectedMosque
                      ? selectedMosque.name
                      : "Pilih masjid untuk mengedit area"}
                  </p>
                  {selectedMosque && (
                    <p className="text-xs text-slate-400">
                      {selectedMosque.city}, {selectedMosque.province}
                    </p>
                  )}
                </div>
                {selectedMosque && (
                  <Button size="sm" onClick={() => setShowEditor(true)}>
                    <Edit2 size={13} /> Gambar Area
                  </Button>
                )}
              </div>
              <div className="h-[540px]">
                <MosqueMapEditor
                  center={
                    selectedMosque
                      ? [selectedMosque.latitude, selectedMosque.longitude]
                      : [-0.3046, 100.3684]
                  }
                  mosqueId={selectedMosque?.id}
                  editable={showEditor}
                  onSave={handleSaveGeofence}
                  onCancel={() => setShowEditor(false)}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Mosque Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">
                {editingMosque ? "Edit Masjid" : "Tambah Masjid"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}
              <Input
                label="Nama Masjid *"
                placeholder="Masjid Agung..."
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
              <Input
                label="Alamat"
                placeholder="Jl. Merdeka No. 1..."
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Kota *"
                  placeholder="Bukittinggi"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, city: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Provinsi"
                  placeholder="Sumatera Barat"
                  value={formData.province}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, province: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude *"
                  placeholder="-0.3046"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, latitude: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Longitude *"
                  placeholder="100.3684"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, longitude: e.target.value }))
                  }
                  required
                />
              </div>
              <Input
                label="Radius Geofence (meter)"
                placeholder="100"
                value={formData.geofence_radius}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, geofence_radius: e.target.value }))
                }
              />
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
                  {editingMosque ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
