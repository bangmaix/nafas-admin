"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Plus, Clock, Building2, RefreshCw, X } from "lucide-react";
import { formatDateTime, getPrayerLabel } from "@/lib/utils";

interface QRSession {
  id: string;
  mosque_id: string;
  prayer_name: string;
  token: string;
  expires_at: string;
  created_at: string;
  mosques: { name: string } | null;
}

interface Mosque {
  id: string;
  name: string;
  city: string;
}

const PRAYERS = ["subuh", "dzuhur", "ashar", "maghrib", "isya", "jumat", "tarawih"];

export default function QRPage() {
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMosqueId, setSelectedMosqueId] = useState("");
  const [selectedPrayer, setSelectedPrayer] = useState("subuh");
  const [activeQR, setActiveQR] = useState<{
    token: string;
    mosqueName: string;
    prayerName: string;
    expiresAt: string;
    qrDataUrl: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/qr/sessions?per_page=30");
      const json = await res.json();
      setSessions(json.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMosques = useCallback(async () => {
    const res = await fetch("/api/v1/mosque?per_page=100");
    const json = await res.json();
    setMosques(json.data?.data ?? []);
    if (json.data?.data?.length > 0) {
      setSelectedMosqueId(json.data.data[0].id);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchMosques();
  }, [fetchSessions, fetchMosques]);

  // Countdown timer
  useEffect(() => {
    if (!activeQR) return;
    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(activeQR.expiresAt).getTime() - Date.now()) / 1000)
      );
      setCountdown(remaining);
      if (remaining === 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setActiveQR(null);
      }
    };
    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [activeQR]);

  const handleGenerate = async () => {
    if (!selectedMosqueId || !selectedPrayer) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mosque_id: selectedMosqueId,
          prayer_name: selectedPrayer,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      // Generate QR code image
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(json.data.token, {
        width: 280,
        margin: 2,
        color: { dark: "#0d8c77", light: "#ffffff" },
      });

      setActiveQR({
        token: json.data.token,
        mosqueName: json.data.mosque_name,
        prayerName: json.data.prayer_name,
        expiresAt: json.data.expires_at,
        qrDataUrl,
      });
      setShowModal(false);
      fetchSessions();
    } catch (err: any) {
      alert(err.message ?? "Gagal membuat QR");
    } finally {
      setGenerating(false);
    }
  };

  const isExpired = (expiresAt: string) =>
    new Date(expiresAt).getTime() < Date.now();

  return (
    <>
      <Topbar
        title="QR Sesi"
        subtitle="Generate dan kelola sesi absensi QR Code"
      />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {sessions.length} sesi terakhir
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Buat QR Baru
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Active QR Display */}
          <div className="xl:col-span-1">
            <Card className="text-center">
              {activeQR ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">QR Aktif</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-semibold">LIVE</span>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-[#0d8c77]/20 rounded-2xl p-3 inline-block mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeQR.qrDataUrl}
                      alt="QR Code"
                      className="w-52 h-52 mx-auto"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{activeQR.mosqueName}</p>
                    <p className="text-sm text-slate-500">
                      {getPrayerLabel(activeQR.prayerName)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-slate-50 rounded-xl py-3">
                    <Clock size={16} className="text-[#0d8c77]" />
                    <span
                      className={`text-2xl font-black tabular-nums ${
                        countdown <= 10 ? "text-red-500" : "text-[#0d8c77]"
                      }`}
                    >
                      {countdown}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tunjukkan QR ini kepada jamaah
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <QrCode size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Belum ada QR aktif</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Buat QR baru untuk memulai absensi
                    </p>
                  </div>
                  <Button onClick={() => setShowModal(true)} size="sm">
                    <Plus size={14} />
                    Buat QR Sekarang
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Session History */}
          <div className="xl:col-span-2">
            <Card padding="none">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Riwayat Sesi QR</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchSessions}
                  loading={loading}
                >
                  <RefreshCw size={14} />
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-[#0d8c77] border-t-transparent rounded-full animate-spin" />
                    Memuat...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <QrCode size={28} className="text-slate-300" />
                    <p className="text-sm">Belum ada sesi QR</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {sessions.map((session) => {
                      const expired = isExpired(session.expires_at);
                      return (
                        <div
                          key={session.id}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d8c77]/10 to-[#0e5b8d]/10 flex items-center justify-center flex-shrink-0">
                            <QrCode size={16} className="text-[#0d8c77]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 text-sm truncate">
                                {session.mosques?.name ?? "—"}
                              </p>
                              <Badge variant={expired ? "neutral" : "success"}>
                                {expired ? "Kedaluwarsa" : "Aktif"}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {getPrayerLabel(session.prayer_name)} ·{" "}
                              {formatDateTime(session.created_at)}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-400 flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Clock size={11} />
                              {expired
                                ? "Habis"
                                : Math.max(
                                    0,
                                    Math.floor(
                                      (new Date(session.expires_at).getTime() -
                                        Date.now()) /
                                        1000
                                    )
                                  ) + "s"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Generate QR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Buat Sesi QR</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Masjid
                </label>
                <select
                  value={selectedMosqueId}
                  onChange={(e) => setSelectedMosqueId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c77] text-slate-700"
                >
                  {mosques.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Waktu Shalat
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRAYERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPrayer(p)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                        selectedPrayer === p
                          ? "bg-[#0d8c77] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {getPrayerLabel(p)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                QR code berlaku selama <strong>60 detik</strong> setelah dibuat
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  loading={generating}
                  onClick={handleGenerate}
                  disabled={!selectedMosqueId}
                >
                  <QrCode size={15} />
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
