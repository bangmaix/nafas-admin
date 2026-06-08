import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { type GeoJSONPolygon } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/mosque/[id]/geofence
 * Simpan atau update polygon geofence masjid menggunakan PostGIS
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();
    const body: { polygon: GeoJSONPolygon } = await req.json();

    if (!body.polygon || body.polygon.type !== "Polygon") {
      return NextResponse.json(
        { success: false, error: "Format polygon tidak valid. Gunakan GeoJSON Polygon." },
        { status: 400 }
      );
    }

    // Konversi GeoJSON ke WKT untuk PostGIS
    const ring = body.polygon.coordinates[0];
    const wkt = `POLYGON((${ring.map(([lng, lat]) => `${lng} ${lat}`).join(",")}))`;

    const { data, error } = await supabase
      .from("mosques")
      .update({
        geofence_polygon: `SRID=4326;${wkt}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, name, geofence_polygon")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Geofence berhasil disimpan",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan geofence" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/mosque/[id]/geofence/check
 * Validasi apakah koordinat user ada di dalam geofence masjid
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();
    const body: { latitude: number; longitude: number } = await req.json();

    if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
      return NextResponse.json(
        { success: false, error: "Koordinat tidak valid" },
        { status: 400 }
      );
    }

    // Query PostGIS ST_Contains
    const { data, error } = await supabase.rpc("check_user_in_mosque_area", {
      p_mosque_id: id,
      p_latitude: body.latitude,
      p_longitude: body.longitude,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        is_inside: Boolean(data),
        latitude: body.latitude,
        longitude: body.longitude,
        mosque_id: id,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal memvalidasi lokasi" },
      { status: 500 }
    );
  }
}
