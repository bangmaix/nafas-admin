"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw } from "lucide-react";

interface MosqueMapEditorProps {
  center: [number, number];
  mosqueId?: string;
  editable?: boolean;
  onSave?: (polygon: [number, number][][]) => void;
  onCancel?: () => void;
}

export default function MosqueMapEditor({
  center,
  editable = false,
  onSave,
  onCancel,
}: MosqueMapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const drawnLayersRef = useRef<unknown>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // cancelled flag guards against the React StrictMode double-invoke
    let cancelled = false;

    (async () => {
      // Wait for imports
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet-draw/dist/leaflet.draw.css");
      await import("leaflet-draw");

      // Bail out if effect was cleaned up or container already has a map
      if (cancelled || !mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) return;

      // Fix default icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center,
        zoom: 17,
        zoomControl: true,
      });

      L.tileLayer(
        "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
        {
          maxZoom: 21,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          attribution: "© Google Maps",
        }
      ).addTo(map);

      // Mosque marker
      const mosqueIcon = L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#0d8c77,#0e5b8d);width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        className: "",
      });

      L.marker(center, { icon: mosqueIcon })
        .addTo(map)
        .bindPopup("<strong>Lokasi Masjid</strong>")
        .openPopup();

      const drawnItems = new L.FeatureGroup();
      drawnItems.addTo(map);
      drawnLayersRef.current = drawnItems;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DrawControl = (L as any).Control.Draw;
      const drawControl = new DrawControl({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: { color: "#ef4444", message: "Area tidak boleh berpotongan" },
            shapeOptions: {
              color: "#0d8c77",
              fillColor: "#0d8c77",
              fillOpacity: 0.25,
              weight: 2,
            },
          },
          circle: false,
          rectangle: {
            shapeOptions: { color: "#0d8c77", fillColor: "#0d8c77", fillOpacity: 0.25, weight: 2 },
          },
          polyline: false,
          marker: false,
          circlemarker: false,
        },
        edit: { featureGroup: drawnItems },
      });

      map.addControl(drawControl);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        drawnItems.addLayer(e.layer);
        setHasDrawn(true);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on((L as any).Draw.Event.DELETED, () => {
        setHasDrawn(drawnItems.getLayers().length > 0);
      });

      mapInstanceRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when changed
  useEffect(() => {
    if (mapInstanceRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapInstanceRef.current as any).setView(center, 17);
    }
  }, [center]);

  const handleSave = () => {
    if (!drawnLayersRef.current || !onSave) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers = (drawnLayersRef.current as any).getLayers();
    if (layers.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coords = layers[0].getLatLngs().map((ring: any[]) =>
      ring.map((ll: { lat: number; lng: number }) => [ll.lng, ll.lat] as [number, number])
    );
    onSave(coords);
  };

  const handleReset = () => {
    if (!drawnLayersRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (drawnLayersRef.current as any).clearLayers();
    setHasDrawn(false);
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Controls overlay */}
      {editable && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-2">
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={!hasDrawn}>
            <RotateCcw size={14} /> Reset
          </Button>
          <Button size="sm" variant="danger" onClick={onCancel}>
            <X size={14} /> Batal
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasDrawn}>
            <Check size={14} /> Simpan Area
          </Button>
        </div>
      )}

      {/* Instruction */}
      {editable && !hasDrawn && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-[#0d8c77] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
          Klik ikon polygon di toolbar kiri → gambar batas area masjid
        </div>
      )}

      {!editable && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur text-xs font-medium px-3 py-1.5 rounded-full shadow border border-slate-200 text-slate-600">
          Mode lihat saja
        </div>
      )}
    </div>
  );
}
