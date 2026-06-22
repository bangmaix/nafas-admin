import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function checkAdmin(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single();
  return profile?.role === "admin" || profile?.role === "mosque_admin";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id: family_id } = await params;
    const serviceClient = await createServiceClient();
    const { user_id, relation } = await req.json();

    if (!user_id || !relation) return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });

    const { data, error } = await serviceClient
      .from("family_members")
      .insert({ family_id, user_id, relation })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah anggota keluarga";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
