import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const { id } = await params;

    const { error } = await serviceClient.from("attendance").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Data kehadiran berhasil dihapus" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus data kehadiran";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
