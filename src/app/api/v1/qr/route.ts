import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { randomBytes, createHmac } from "crypto";

const QR_TTL_SECONDS = 60;

/**
 * POST /api/v1/qr/generate
 * Generate QR token bertanda tangan HMAC untuk sesi shalat tertentu
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body: { mosque_id: string; prayer_name: string } = await req.json();

    if (!body.mosque_id || !body.prayer_name) {
      return NextResponse.json(
        { success: false, error: "mosque_id dan prayer_name wajib diisi" },
        { status: 400 }
      );
    }

    // Pastikan masjid ada
    const { data: mosque, error: mosqueError } = await supabase
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
    const { data: session, error: sessionError } = await supabase
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal membuat sesi QR" },
      { status: 500 }
    );
  }
}
