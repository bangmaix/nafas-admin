import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();
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
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("mosques")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Gagal memperbarui masjid" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    const { error } = await supabase.from("mosques").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Masjid berhasil dihapus" });
  } catch {
    return NextResponse.json({ success: false, error: "Gagal menghapus masjid" }, { status: 500 });
  }
}
