export interface Mosque {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  geofence_polygon: GeoJSONPolygon | null;
  photo_url: string | null;
  total_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  mosque_id: string;
  prayer_name: string;
  method: "qr" | "geo";
  latitude: number;
  longitude: number;
  checked_in_at: string;
  points_earned: number;
  is_valid: boolean;
  mosque?: Pick<Mosque, "id" | "name">;
  user?: UserProfile;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: "admin" | "mosque_admin" | "jamaah";
  total_points: number;
  total_attendance: number;
  streak_days: number;
  mosque_id: string | null;
  created_at: string;
}

export interface QRSession {
  id: string;
  mosque_id: string;
  prayer_name: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface DashboardStats {
  total_mosques: number;
  total_users: number;
  total_attendance_today: number;
  total_attendance_month: number;
  active_streak_users: number;
  top_mosque: Pick<Mosque, "id" | "name"> | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Program {
  id: string;
  mosque_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  speaker: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  mosques?: { name: string };
}
