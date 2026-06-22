import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { randomBytes, createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const QR_TTL_SECONDS = 60;

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

/**
 * POST /api/v1/qr
 * Generate QR token bertanda tangan HMAC untuk sesi shalat tertentu
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();
    const body: { mosque_id: string; prayer_name: string } = await req.json();

    if (!body.mosque_id || !body.prayer_name) {
      return NextResponse.json(
        { success: false, error: "mosque_id dan prayer_name wajib diisi" },
        { status: 400 }
      );
    }

    // Pastikan masjid ada
    const { data: mosque, error: mosqueError } = await serviceClient
      .from("mosques")
      .select("id, name")
      .eq("id", body.mosque_id)
      .eq("is_active", true)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json(
        { success: false, error: "Masjid tidak ditemukan atau tidak aktif" },
        { status: 404 }
      );
    }

    const nonce = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + QR_TTL_SECONDS * 1000);

    const payload = {
      mosque_id: body.mosque_id,
      prayer_name: body.prayer_name,
      nonce,
      expires_at: expiresAt.toISOString(),
    };

    // Tanda tangan HMAC-SHA256
    const secret = process.env.JWT_SECRET ?? "dev-secret-32chars-minimum-length";
    const signature = createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const token = Buffer.from(
      JSON.stringify({ ...payload, sig: signature })
    ).toString("base64url");

    // Simpan sesi QR ke database
    const { data: session, error: sessionError } = await serviceClient
      .from("qr_sessions")
      .insert({
        mosque_id: body.mosque_id,
        prayer_name: body.prayer_name,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        token,
        mosque_name: mosque.name,
        prayer_name: body.prayer_name,
        expires_at: expiresAt.toISOString(),
        ttl_seconds: QR_TTL_SECONDS,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat sesi QR";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
