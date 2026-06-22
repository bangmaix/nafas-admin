import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function checkAdmin(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single();
  return profile?.role === "admin" || profile?.role === "mosque_admin";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from("families")
      .select("*, family_members(*, user_profiles(*))")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil detail keluarga";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const serviceClient = await createServiceClient();
    const body = await req.json();

    const { data, error } = await serviceClient.from("families").update(body).eq("id", id).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui keluarga";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const serviceClient = await createServiceClient();

    const { error } = await serviceClient.from("families").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Keluarga berhasil dihapus" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus keluarga";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
