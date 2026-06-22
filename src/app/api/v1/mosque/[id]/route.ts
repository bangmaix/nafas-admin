import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mosques")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Masjid tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const serviceClient = await createServiceClient();
    const body = await req.json();

    const { data, error } = await serviceClient
      .from("mosques")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui masjid";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const serviceClient = await createServiceClient();

    const { error } = await serviceClient.from("mosques").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Masjid berhasil dihapus" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus masjid";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
