import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createHmac } from "crypto";

const ALLOWED_TIME_DRIFT_MS = 5000; // 5 detik toleransi
const POINTS_PER_ATTENDANCE = 20;

interface AttendancePayload {
  token: string;
  user_id: string;
  latitude: number;
  longitude: number;
  method: "qr" | "geo";
}

/**
 * POST /api/v1/attendance
 * Validasi dan catat kehadiran jamaah via QR atau Geo-area
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const body: AttendancePayload = await req.json();

    if (!body.user_id || !body.latitude || !body.longitude || !body.method) {
      return NextResponse.json(
        { success: false, error: "Data kehadiran tidak lengkap" },
        { status: 400 }
      );
    }

    // ─── Validasi QR ──────────────────────────────────────────────────────────
    if (body.method === "qr") {
      if (!body.token) {
        return NextResponse.json(
          { success: false, error: "Token QR wajib untuk metode QR" },
          { status: 400 }
        );
      }

      let parsed: {
        mosque_id: string;
        prayer_name: string;
        nonce: string;
        expires_at: string;
        sig: string;
      };

      try {
        parsed = JSON.parse(Buffer.from(body.token, "base64url").toString());
      } catch {
        return NextResponse.json(
          { success: false, error: "Token QR tidak valid" },
          { status: 400 }
        );
      }

      // Cek kadaluarsa + toleransi drift
      const expiresAt = new Date(parsed.expires_at).getTime();
      if (Date.now() > expiresAt + ALLOWED_TIME_DRIFT_MS) {
        return NextResponse.json(
          { success: false, error: "Token QR sudah kadaluarsa" },
          { status: 400 }
        );
      }

      // Verifikasi tanda tangan
      const { sig, ...payloadWithoutSig } = parsed;
      const secret = process.env.JWT_SECRET ?? "dev-secret-32chars-minimum-length";
      const expected = createHmac("sha256", secret)
        .update(JSON.stringify(payloadWithoutSig))
        .digest("hex");

      if (sig !== expected) {
        return NextResponse.json(
          { success: false, error: "Token QR tidak sah" },
          { status: 400 }
        );
      }

      // Cek sesi QR ada dan belum kadaluarsa di DB
      const { data: session, error: sessionError } = await supabase
        .from("qr_sessions")
        .select("id, mosque_id, prayer_name, expires_at")
        .eq("token", body.token)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { success: false, error: "Sesi QR tidak ditemukan" },
          { status: 404 }
        );
      }

      // Cek duplikat absensi (per user + masjid + shalat + hari ini)
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("user_id", body.user_id)
        .eq("mosque_id", session.mosque_id)
        .eq("prayer_name", session.prayer_name)
        .gte("checked_in_at", `${today}T00:00:00.000Z`)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "Kehadiran sudah dicatat hari ini" },
          { status: 409 }
        );
      }

      // Catat kehadiran
      const { data: attendance, error: attError } = await supabase
        .from("attendance")
        .insert({
          user_id: body.user_id,
          mosque_id: session.mosque_id,
          prayer_name: session.prayer_name,
          method: "qr",
          latitude: body.latitude,
          longitude: body.longitude,
          points_earned: POINTS_PER_ATTENDANCE,
          is_valid: true,
        })
        .select()
        .single();

      if (attError) throw attError;

      // Update poin pengguna
      await supabase.rpc("increment_user_points", {
        p_user_id: body.user_id,
        p_points: POINTS_PER_ATTENDANCE,
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: "Alhamdulillah! Kehadiran tercatat.",
        points_earned: POINTS_PER_ATTENDANCE,
      });
    }

    // ─── Validasi Geo-area ────────────────────────────────────────────────────
    if (body.method === "geo") {
      const mosqueId = (body as AttendancePayload & { mosque_id: string }).mosque_id;
      if (!mosqueId) {
        return NextResponse.json(
          { success: false, error: "mosque_id wajib untuk metode geo" },
          { status: 400 }
        );
      }

      const { data: isInside, error: geoError } = await supabase.rpc(
        "check_user_in_mosque_area",
        {
          p_mosque_id: mosqueId,
          p_latitude: body.latitude,
          p_longitude: body.longitude,
        }
      );

      if (geoError) throw geoError;

      if (!isInside) {
        return NextResponse.json(
          { success: false, error: "Anda berada di luar area masjid" },
          { status: 403 }
        );
      }

      const { data: attendance, error: attError } = await supabase
        .from("attendance")
        .insert({
          user_id: body.user_id,
          mosque_id: mosqueId,
          prayer_name: (body as AttendancePayload & { prayer_name: string }).prayer_name,
          method: "geo",
          latitude: body.latitude,
          longitude: body.longitude,
          points_earned: POINTS_PER_ATTENDANCE,
          is_valid: true,
        })
        .select()
        .single();

      if (attError) throw attError;

      await supabase.rpc("increment_user_points", {
        p_user_id: body.user_id,
        p_points: POINTS_PER_ATTENDANCE,
      });

      return NextResponse.json({
        success: true,
        data: attendance,
        message: "Alhamdulillah! Kehadiran tercatat.",
        points_earned: POINTS_PER_ATTENDANCE,
      });
    }

    return NextResponse.json(
      { success: false, error: "Metode tidak dikenal" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal mencatat kehadiran" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const mosqueId = searchParams.get("mosque_id");
    const userId = searchParams.get("user_id");
    const prayerName = searchParams.get("prayer_name");
    const method = searchParams.get("method");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("attendance")
      .select("*, mosques(id,name), user_profiles(id,full_name,email,avatar_url)", { count: "exact" })
      .order("checked_in_at", { ascending: false })
      .range(from, to);

    if (mosqueId) query = query.eq("mosque_id", mosqueId);
    if (userId) query = query.eq("user_id", userId);
    if (prayerName) query = query.eq("prayer_name", prayerName);
    if (method) query = query.eq("method", method);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { data: data ?? [], count: count ?? 0, page, per_page: perPage },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Gagal mengambil data kehadiran" }, { status: 500 });
  }
}
