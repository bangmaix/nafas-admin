import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { type ApiResponse, type Mosque } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const search = searchParams.get("search") ?? "";
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("mosques")
      .select("*", { count: "exact" })
      .order("name")
      .range(from, to);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) { console.error("[mosque GET]", error); throw error; }

    const response: ApiResponse<{ data: Mosque[]; count: number; page: number; per_page: number }> = {
      success: true,
      data: {
        data: data ?? [],
        count: count ?? 0,
        page,
        per_page: perPage,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data masjid" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body = await req.json();

    const { name, address, city, province, latitude, longitude, geofence_radius } = body;

    if (!name || !city || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Field wajib tidak lengkap" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("mosques")
      .insert({
        name,
        address,
        city,
        province,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        geofence_radius: geofence_radius ?? 100,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Gagal menambah masjid" },
      { status: 500 }
    );
  }
}
