import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const mosqueId = searchParams.get("mosque_id");
    const category = searchParams.get("category");

    let query = supabase
      .from("programs")
      .select("*, mosques(name)")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (mosqueId) query = query.eq("mosque_id", mosqueId);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data program";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { mosque_id, title, description, date, start_time, end_time, speaker, category } = body;

    if (!mosque_id || !title || !date || !start_time) {
      return NextResponse.json(
        { success: false, error: "Field wajib tidak lengkap" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("programs")
      .insert({
        mosque_id,
        title,
        description,
        date,
        start_time,
        end_time,
        speaker,
        category: category || "kajian",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah program";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
