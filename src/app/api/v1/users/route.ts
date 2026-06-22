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

  return profile?.role === "admin";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = await createServiceClient();

    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = serviceClient
      .from("user_profiles")
      .select("*, mosques(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (role) {
      query = query.eq("role", role);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { data: data ?? [], count: count ?? 0, page, per_page: perPage },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data pengguna";
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
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const body = await req.json();
    const { email, password, fullName, role, mosque_id } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Create auth user using service role
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create user profile
    const { data: profileData, error: profileError } = await serviceClient
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName || email.split("@")[0],
        role: role || "jamaah",
        mosque_id: mosque_id || null,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({ 
      success: true, 
      data: { user: authData.user, profile: profileData } 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const body = await req.json();
    const { id, role, full_name, mosque_id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id wajib diisi" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (full_name) updateData.full_name = full_name;
    if (mosque_id !== undefined) updateData.mosque_id = mosque_id;

    const { data, error } = await serviceClient
      .from("user_profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pengguna";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
