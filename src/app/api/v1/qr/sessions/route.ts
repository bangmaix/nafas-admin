import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const serviceClient = await createServiceClient();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, count, error } = await serviceClient
      .from("qr_sessions")
      .select("*, mosques(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { data: data ?? [], count: count ?? 0, page, per_page: perPage },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data sesi QR";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
