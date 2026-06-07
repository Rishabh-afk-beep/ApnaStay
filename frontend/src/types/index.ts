// ── Core types ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// ── Property ──────────────────────────────────────────────────────

export interface RoomOption {
  option_id: string;
  label: string;
  price: number;
  deposit?: number;
  available_count: number;
  status: string;
}

export interface PropertyMetadata {
  gender?: string;
  mess_timing?: string;
  gate_timing?: string;
  warden_contact?: string;
  bhk_type?: string;
  furnishing?: string;
  floor?: number;
  total_floors?: number;
  lift?: boolean;
  society_name?: string;
  num_bathrooms?: number;
  size_sqft?: number;
  allowed_use_type?: string;
  maintenance_charge?: number;
  total_capacity?: number;
  study_hall?: boolean;
  curfew_time?: string;
  warden_on_site?: boolean;
  bathroom_type?: string;
  kitchen_access?: boolean;
  furnished?: string;
  community_events?: boolean;
  coworking?: boolean;
  min_stay_duration?: string;
  parking_type?: string;
  water_supply?: string;
}

export interface PropertyCard {
  property_id: string;
  owner_uid?: string;
  title: string;
  property_type: string;
  primary_college_id: string;
  address_text?: string;
  rent_min: number;
  rent_max: number;
  security_deposit: number;
  amenities: string[];
  rating_avg: number;
  rating_count: number;
  review_count: number;
  availability_status: string;
  approval_status: string;
  visibility_status: string;
  featured: boolean;
  cover_image_url?: string;
  image_urls: string[];
  latitude: number;
  longitude: number;
  distance_km?: number;
  gender?: string;
  food_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyDetail extends PropertyCard {
  description?: string;
  food_menu?: string;
  rules?: string;
  published_at?: string;
  room_options: RoomOption[];
  metadata?: PropertyMetadata;
  college_ids: string[];
  owner_contact?: string;
  owner_whatsapp?: string;
  video_tour_url?: string;
  available_from?: string;
  nearby_landmarks?: string;
  maintenance_charge?: number;
  notice_period_days?: number;
  preferred_tenant?: string;
}

// ── College ───────────────────────────────────────────────────────

export interface CollegeOut {
  college_id: string;
  name: string;
  short_name?: string;
  address?: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// ── User ──────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  role: "admin" | "student" | "owner";
  status: "active" | "blocked" | "pending_verification";
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  college_id?: string;
  verification_state: "unverified" | "pending" | "verified";
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

// ── Review ────────────────────────────────────────────────────────

export interface ReviewOut {
  review_id: string;
  property_id: string;
  user_uid: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ── Engagement ────────────────────────────────────────────────────

export interface InquiryOut {
  inquiry_id: string;
  property_id: string;
  user_uid?: string;
  name: string;
  phone: string;
  message: string;
  created_at: string;
}

export interface AdminInquiryOut {
  inquiry_id: string;
  property_id: string;
  property_title: string;
  owner_uid?: string;
  owner_name?: string;
  owner_email?: string;
  student_uid?: string;
  name: string;
  phone: string;
  message?: string;
  source: string;
  created_at: string;
}

export interface ShortlistOut {
  shortlist_id: string;
  property_id: string;
  user_uid: string;
  created_at: string;
}

export interface RecentViewOut {
  view_id: string;
  property_id: string;
  user_uid: string;
  viewed_at: string;
}

export interface AlertOut {
  alert_id: string;
  user_uid: string;
  college_id: string;
  radius_km: number;
  property_type?: string;
  budget_max?: number;
  active: boolean;
  created_at: string;
}

// ── Admin ─────────────────────────────────────────────────────────

export interface AdminAnalyticsOverview {
  total_properties: number;
  live_properties: number;
  pending_properties: number;
  total_inquiries: number;
  total_shortlists: number;
  total_alerts: number;
  total_reviews: number;
}

export interface AdminLogOut {
  log_id: string;
  admin_uid: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── Upload ────────────────────────────────────────────────────────

export interface ImageUploadResponse {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

// ── Owner ─────────────────────────────────────────────────────────

export interface DailyStat {
  date: string;
  views: number;
  shortlists: number;
  inquiries: number;
}

export interface OwnerAnalyticsOut {
  total_views: number;
  total_shortlists: number;
  total_inquiries: number;
  daily_stats: DailyStat[];
}
