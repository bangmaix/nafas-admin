"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Plus,
  Search,
  Clock,
  User,
  Building2,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Program, Mosque } from "@/types";

const CATEGORIES = ["kajian", "sosial", "pendidikan", "remaja", "akhwat"];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    mosque_id: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "18:30",
    end_time: "20:00",
    speaker: "",
    category: "kajian",
  });

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/programs");
      const json = await res.json();
      setPrograms(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMosques = useCallback(async () => {
    const res = await fetch("/api/v1/mosque?per_page=100");
    const json = await res.json();
    const data = json.data?.data ?? [];
    setMosques(data);
    if (data.length > 0 && !formData.mosque_id) {
      setFormData(prev => ({ ...prev, mosque_id: data[0].id }));
    }
  }, [formData.mosque_id]);

  useEffect(() => {
    fetchPrograms();
    fetchMosques();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAdd = () => {
    setEditingProgram(null);
    setFormData({
      mosque_id: mosques[0]?.id || "",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      start_time: "18:30",
      end_time: "20:00",
      speaker: "",
      category: "kajian",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      mosque_id: program.mosque_id,
      title: program.title,
      description: program.description || "",
      date: program.date,
      start_time: program.start_time.substring(0, 5),
      end_time: program.end_time ? program.end_time.substring(0, 5) : "",
      speaker: program.speaker || "",
      category: program.category,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingProgram ? `/api/v1/programs/${editingProgram.id}` : "/api/v1/programs";
      const method = editingProgram ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setShowModal(false);
      fetchPrograms();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus program ini?")) return;
    try {
      await fetch(`/api/v1/programs/${id}`, { method: "DELETE" });
      fetchPrograms();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(message);
    }
  };

  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.speaker?.toLowerCase().includes(search.toLowerCase()) ||
    p.mosques?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar title="Program & Kegiatan" subtitle="Kelola jadwal kajian dan acara masjid" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Input
            placeholder="Cari judul, pemateri, atau masjid..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />
          <Button onClick={handleOpenAdd}>
            <Plus size={16} />
            Tambah Program
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-5" />
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
              </Card>
            ))
          ) : filteredPrograms.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400">
              <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
              <p>Belum ada program yang terdaftar</p>
            </div>
          ) : (
            filteredPrograms.map((program) => (
              <Card key={program.id} hover className="group flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="info" className="capitalize">{program.category}</Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(program)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(program.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 leading-tight mb-1">{program.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{program.description || "Tidak ada deskripsi"}</p>

                <div className="space-y-2 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Building2 size={14} className="text-[#0d8c77]" />
                    <span className="font-medium">{program.mosques?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CalendarDays size={14} className="text-[#0d8c77]" />
                    <span>{formatDate(program.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock size={14} className="text-[#0d8c77]" />
                    <span>{program.start_time.substring(0, 5)} {program.end_time ? `- ${program.end_time.substring(0, 5)}` : ""}</span>
                  </div>
                  {program.speaker && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User size={14} className="text-[#0d8c77]" />
                      <span>{program.speaker}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">
                {editingProgram ? "Edit Program" : "Tambah Program Baru"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Masjid *</label>
                <select
                  value={formData.mosque_id}
                  onChange={(e) => setFormData(p => ({ ...p, mosque_id: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77]"
                  required
                >
                  {mosques.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <Input
                label="Judul Program *"
                placeholder="Kajian Rutin Malam Jumat..."
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                required
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Deskripsi</label>
                <textarea
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#0d8c77]"
                  placeholder="Ceritakan tentang program ini..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tanggal *"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77]"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Waktu Mulai *"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                  required
                />
                <Input
                  label="Waktu Selesai"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(p => ({ ...p, end_time: e.target.value }))}
                />
              </div>
              <Input
                label="Pemateri / Pembicara"
                placeholder="Ustadz Fulan..."
                value={formData.speaker}
                onChange={(e) => setFormData(p => ({ ...p, speaker: e.target.value }))}
              />
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1" loading={formLoading}>
                  {editingProgram ? "Simpan Perubahan" : "Tambah Program"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
