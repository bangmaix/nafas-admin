import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function checkAdmin(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single();
  return profile?.role === "admin" || profile?.role === "mosque_admin";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";

    let query = supabase.from("families").select("*, family_members(count)").order("name");
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data keluarga";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const serviceClient = await createServiceClient();
    const body = await req.json();
    const { name, address } = body;

    if (!name) return NextResponse.json({ success: false, error: "Nama keluarga wajib diisi" }, { status: 400 });

    const { data, error } = await serviceClient.from("families").insert({ name, address }).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah keluarga";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
