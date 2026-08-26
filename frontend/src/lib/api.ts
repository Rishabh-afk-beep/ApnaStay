import axios from "axios";
import { auth } from "../auth/firebase";
import type { PropertyCard, PropertyDetail, PaginatedResponse, CollegeOut, UserProfile, AdminAnalyticsOverview, AdminLogOut, InquiryOut, AdminInquiryOut, ReviewOut, AlertOut, ShortlistOut, RecentViewOut, ImageUploadResponse, OwnerAnalyticsOut } from "../types";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  timeout: 15_000,
});

// ── Auth ──────────────────────────────────────────────────────────

let _token = "";

export function setApiToken(token: string) {
  _token = token;
}

export function getApiToken() {
  return _token;
}

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If 401 Unauthorized and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // If we have a Firebase user, force refresh their token
        if (auth.currentUser) {
          const newToken = await auth.currentUser.getIdToken(true);
          setApiToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("[NearMyColleges] Token refresh failed:", refreshError);
        // Optional: Trigger global logout or redirect
      }
    }
    return Promise.reject(error);
  }
);

// ── Me ────────────────────────────────────────────────────────────

export async function getMe(): Promise<UserProfile> {
  const res = await api.get<UserProfile>("/auth/me");
  return res.data;
}

export async function registerUser(data: { role: string; name: string; phone?: string; email?: string; college_id?: string }): Promise<{ uid: string; role: string; name: string; message: string }> {
  const res = await api.post("/auth/register", data);
  return res.data;
}

export async function updateMe(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await api.patch<UserProfile>("/me", data);
  return res.data;
}

export async function completeProfile(data: { name: string; phone: string; email?: string; college_id?: string }): Promise<UserProfile> {
  const res = await api.post<UserProfile>("/me/complete-profile", data);
  return res.data;
}

// ── Health & Stats ──────────────────────────────────────────────────

export interface PublicStatsOut {
  verified_listings: number;
  colleges_covered: number;
  students_active: number;
  cities_active: number;
}

export async function getPublicStats(): Promise<PublicStatsOut> {
  const res = await api.get<PublicStatsOut>("/health/stats");
  return res.data;
}

// ── Colleges ──────────────────────────────────────────────────────

export async function listColleges(): Promise<CollegeOut[]> {
  const res = await api.get<CollegeOut[]>("/colleges");
  return res.data;
}

export async function getCollege(collegeId: string): Promise<CollegeOut> {
  const res = await api.get<CollegeOut>(`/colleges/${collegeId}`);
  return res.data;
}

// ── Public Properties ─────────────────────────────────────────────

export async function searchProperties(params: {
  college_id?: string;
  radius_km?: number;
  property_type?: string;
  gender?: string;
  budget_min?: number;
  budget_max?: number;
  availability_status?: string;
  amenities?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PropertyCard>> {
  const res = await api.get<PaginatedResponse<PropertyCard>>("/properties/search", { params });
  return res.data;
}

export async function getPropertyDetail(propertyId: string): Promise<PropertyDetail> {
  const res = await api.get<PropertyDetail>(`/properties/${propertyId}`);
  return res.data;
}

// ── Reviews ───────────────────────────────────────────────────────

export async function getPropertyReviews(propertyId: string): Promise<ReviewOut[]> {
  const res = await api.get<ReviewOut[]>(`/properties/${propertyId}/reviews`);
  return res.data;
}

export async function submitReview(propertyId: string, data: { rating: number; comment: string }): Promise<ReviewOut> {
  const res = await api.post<ReviewOut>(`/properties/${propertyId}/reviews`, data);
  return res.data;
}

// ── Engagement: Inquiries ─────────────────────────────────────────

export async function submitInquiry(propertyId: string, data: { name: string; phone: string; message: string }): Promise<InquiryOut> {
  const res = await api.post<InquiryOut>(`/properties/${propertyId}/inquiries`, data);
  return res.data;
}

// ── Engagement: Shortlists ────────────────────────────────────────

export async function addShortlist(propertyId: string): Promise<ShortlistOut> {
  const res = await api.post<ShortlistOut>(`/properties/${propertyId}/shortlist`);
  return res.data;
}

export async function removeShortlist(propertyId: string): Promise<void> {
  await api.delete(`/properties/${propertyId}/shortlist`);
}

export async function listShortlists(): Promise<ShortlistOut[]> {
  const res = await api.get<ShortlistOut[]>("/me/shortlists");
  return res.data;
}

// ── Engagement: Recent Views ──────────────────────────────────────

export async function recordView(propertyId: string): Promise<void> {
  await api.post(`/properties/${propertyId}/view`);
}

export async function listRecentViews(): Promise<RecentViewOut[]> {
  const res = await api.get<RecentViewOut[]>("/me/recent-views");
  return res.data;
}

// ── Engagement: Alerts ────────────────────────────────────────────

export async function createAlert(data: { college_id: string; radius_km?: number; property_type?: string; budget_max?: number }): Promise<AlertOut> {
  const res = await api.post<AlertOut>("/me/alerts", data);
  return res.data;
}

export async function listAlerts(): Promise<AlertOut[]> {
  const res = await api.get<AlertOut[]>("/me/alerts");
  return res.data;
}

export async function deleteAlert(alertId: string): Promise<void> {
  await api.delete(`/me/alerts/${alertId}`);
}

// ── Owner ─────────────────────────────────────────────────────────

export async function createOwnerProperty(data: any): Promise<PropertyDetail> {
  const res = await api.post<PropertyDetail>("/owner/properties", data);
  return res.data;
}

export async function listOwnerProperties(): Promise<PropertyDetail[]> {
  const res = await api.get<PropertyDetail[]>("/owner/properties");
  return res.data;
}

export async function updateOwnerProperty(propertyId: string, data: any): Promise<PropertyDetail> {
  const res = await api.patch<PropertyDetail>(`/owner/properties/${propertyId}`, data);
  return res.data;
}

export async function deleteOwnerProperty(propertyId: string): Promise<any> {
  const res = await api.delete(`/owner/properties/${propertyId}`);
  return res.data;
}

export async function listOwnerInquiries(propertyId: string): Promise<InquiryOut[]> {
  const res = await api.get<InquiryOut[]>(`/owner/properties/${propertyId}/inquiries`);
  return res.data;
}

export async function getOwnerAnalytics(): Promise<OwnerAnalyticsOut> {
  const res = await api.get<OwnerAnalyticsOut>("/owner/properties/analytics");
  return res.data;
}

// ── Admin ─────────────────────────────────────────────────────────

export async function listAdminPending(): Promise<PropertyCard[]> {
  const res = await api.get<PropertyCard[]>("/admin/listings/pending");
  return res.data;
}

export async function adminListProperties(): Promise<PropertyCard[]> {
  const res = await api.get<PropertyCard[]>("/admin/properties");
  return res.data;
}

export async function adminDeleteProperty(propertyId: string): Promise<void> {
  await api.delete(`/admin/properties/${propertyId}`);
}

export async function adminApprove(propertyId: string): Promise<PropertyCard> {
  const res = await api.patch<PropertyCard>(`/admin/properties/${propertyId}/approve`);
  return res.data;
}

export async function adminReject(propertyId: string): Promise<PropertyCard> {
  const res = await api.patch<PropertyCard>(`/admin/properties/${propertyId}/reject`);
  return res.data;
}

export async function adminHide(propertyId: string): Promise<PropertyCard> {
  const res = await api.patch<PropertyCard>(`/admin/properties/${propertyId}/hide`);
  return res.data;
}

export async function adminFeature(propertyId: string): Promise<PropertyCard> {
  const res = await api.patch<PropertyCard>(`/admin/properties/${propertyId}/feature`);
  return res.data;
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsOverview> {
  const res = await api.get<AdminAnalyticsOverview>("/admin/analytics/overview");
  return res.data;
}

export async function getAdminLogs(): Promise<AdminLogOut[]> {
  const res = await api.get<AdminLogOut[]>("/admin/logs");
  return res.data;
}

// Admin Colleges
export async function adminListColleges(): Promise<CollegeOut[]> {
  const res = await api.get<CollegeOut[]>("/admin/colleges");
  return res.data;
}

export async function adminCreateCollege(data: { name: string; short_name?: string; address?: string; city: string; state: string; latitude: number; longitude: number }): Promise<CollegeOut> {
  const res = await api.post<CollegeOut>("/admin/colleges", data);
  return res.data;
}

export async function adminUpdateCollege(collegeId: string, data: any): Promise<CollegeOut> {
  const res = await api.patch<CollegeOut>(`/admin/colleges/${collegeId}`, data);
  return res.data;
}

export async function adminDeleteCollege(collegeId: string): Promise<void> {
  await api.delete(`/admin/colleges/${collegeId}`);
}

// Admin Users
export async function adminListUsers(role?: string, status?: string): Promise<UserProfile[]> {
  const res = await api.get<UserProfile[]>("/admin/users", { params: { role, status } });
  return res.data;
}

export async function adminUpdateUserStatus(uid: string, data: { status: string; reason?: string }): Promise<UserProfile> {
  const res = await api.patch<UserProfile>(`/admin/users/${uid}/status`, data);
  return res.data;
}

export async function adminVerifyUser(uid: string, data: { verification_state: "verified" | "unverified" }): Promise<UserProfile> {
  const res = await api.patch<UserProfile>(`/admin/users/${uid}/verify`, data);
  return res.data;
}

// Admin Inquiries
export async function adminListInquiries(): Promise<AdminInquiryOut[]> {
  const res = await api.get<AdminInquiryOut[]>("/admin/inquiries");
  return res.data;
}

// ── Upload ────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  // Prevent uploads larger than 5MB to avoid backend/load-balancer 413 errors (which manifest as CORS errors)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Please upload an image smaller than 5MB.");
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ImageUploadResponse>("/media/photo", formData, {
    timeout: 60000, // 60 seconds (override global 15s timeout for large uploads)
  });
  return res.data;
}

// ── Cloudinary Dynamic Image Optimization ──
export function getOptimizedImageUrl(url: string, width = 600, height = 400): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("cloudinary.com")) return url;
  // Automatically injects responsive widths, responsive heights, fill crop, auto quality, and auto format support
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
}
