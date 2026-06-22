import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { type ApiResponse, type Mosque } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function checkAdmin(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return profile?.role === "admin" || profile?.role === "mosque_admin";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
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
    if (error) throw error;

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data masjid";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();
    const body = await req.json();

    const { name, address, city, province, latitude, longitude, geofence_radius } = body;

    if (!name || !city || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Field wajib tidak lengkap" },
        { status: 400 }
      );
    }

    const { data, error } = await serviceClient
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah masjid";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
