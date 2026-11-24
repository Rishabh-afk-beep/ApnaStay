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
  college_ids: string[];
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
}

// ── Review ────────────────────────────────────────────────────────

export interface ReviewOut {
  review_id: string;
  property_id: string;
  user_uid: string;
  user_name?: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
}

// ── Engagement ────────────────────────────────────────────────────

export interface InquiryOut {
  inquiry_id: string;
  property_id: string;
  owner_uid?: string;
  student_uid?: string;
  name: string;
  phone: string;
  message?: string;
  source?: string;
  created_at: string;
}

export interface ShortlistOut {
  shortlist_id?: string;
  property_id: string;
  user_uid: string;
  created_at: string;
}

// ── Navigation ────────────────────────────────────────────────────

export type RootStackParams = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: { role: "student" | "owner" };
  PropertyDetail: { propertyId: string };
  CreateListing: undefined;
};

export type MainTabParams = {
  Discover: undefined;
  Shortlists: undefined;
  Profile: undefined;
};
