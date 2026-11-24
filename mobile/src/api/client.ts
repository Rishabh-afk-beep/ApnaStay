import axios from "axios";
import * as SecureStore from "expo-secure-store";

import type {
  CollegeOut,
  InquiryOut,
  PaginatedResponse,
  PropertyCard,
  PropertyDetail,
  ReviewOut,
  ShortlistOut,
  UserProfile,
} from "../types";

// Use env var or fallback to localhost for development
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

// ── Token management ──────────────────────────────────────────────

let _token = "";

export function setApiToken(token: string) {
  _token = token;
}

export async function loadStoredToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      _token = token;
    }
    return token;
  } catch {
    return null;
  }
}

export async function saveToken(token: string) {
  _token = token;
  try {
    await SecureStore.setItemAsync("auth_token", token);
  } catch {
    // SecureStore not available (web fallback)
  }
}

export async function clearToken() {
  _token = "";
  try {
    await SecureStore.deleteItemAsync("auth_token");
  } catch {}
}

// Auth interceptor
api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────

export async function getMe(): Promise<UserProfile> {
  const res = await api.get<UserProfile>("/auth/me");
  return res.data;
}

export async function registerUser(data: {
  role: string;
  name: string;
  phone?: string;
  email?: string;
  college_id?: string;
}): Promise<{ uid: string; role: string; name: string; message: string }> {
  const res = await api.post("/auth/register", data);
  return res.data;
}

// ── Colleges ──────────────────────────────────────────────────────

export async function listColleges(): Promise<CollegeOut[]> {
  const res = await api.get<CollegeOut[]>("/colleges");
  return res.data;
}

// ── Properties ────────────────────────────────────────────────────

export async function searchProperties(params: {
  college_id?: string;
  radius_km?: number;
  property_type?: string;
  gender?: string;
  budget_min?: number;
  budget_max?: number;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PropertyCard>> {
  const res = await api.get<PaginatedResponse<PropertyCard>>(
    "/properties/search",
    { params }
  );
  return res.data;
}

export async function getPropertyDetail(
  propertyId: string
): Promise<PropertyDetail> {
  const res = await api.get<PropertyDetail>(`/properties/${propertyId}`);
  return res.data;
}

// ── Reviews ───────────────────────────────────────────────────────

export async function getPropertyReviews(
  propertyId: string
): Promise<ReviewOut[]> {
  const res = await api.get<ReviewOut[]>(
    `/properties/${propertyId}/reviews`
  );
  return res.data;
}

export async function submitReview(
  propertyId: string,
  data: { rating: number; comment: string }
): Promise<ReviewOut> {
  const res = await api.post<ReviewOut>(
    `/properties/${propertyId}/reviews`,
    data
  );
  return res.data;
}

// ── Engagement ────────────────────────────────────────────────────

export async function submitInquiry(
  propertyId: string,
  data: { name: string; phone: string; message: string }
): Promise<InquiryOut> {
  const res = await api.post<InquiryOut>(
    `/properties/${propertyId}/inquiries`,
    data
  );
  return res.data;
}

export async function addShortlist(
  propertyId: string
): Promise<ShortlistOut> {
  const res = await api.post<ShortlistOut>(
    `/properties/${propertyId}/shortlist`
  );
  return res.data;
}

export async function removeShortlist(propertyId: string): Promise<void> {
  await api.delete(`/properties/${propertyId}/shortlist`);
}

export async function listShortlists(): Promise<ShortlistOut[]> {
  const res = await api.get<ShortlistOut[]>("/me/shortlists");
  return res.data;
}

// ── Upload ────────────────────────────────────────────────────────

export async function uploadImage(
  uri: string,
  fileName: string
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: fileName,
    type: "image/jpeg",
  } as any);
  const res = await api.post<{ url: string }>("/media/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
