// src/api/api.ts
// Central API file for Admin Panel → Backend communication

import axios from "axios";

declare global {
  interface ImportMetaEnv {
    readonly VITE_ADMIN_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

/* ======================================================
   Shared Types (backend response shapes)
   ====================================================== */

export type BackendRole = "ADMIN" | "VENDOR_PENDING" | "VENDOR_APPROVED";
export type BackendOfferStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BackendMediaStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BackendVendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type BackendPlanStatus = "ACTIVE" | "INACTIVE";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  posts: number;
  months: number;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
}

export interface AdminVendorUser {
  id: string;
  email: string;
  role: BackendRole;
  createdAt?: string;
}

export interface AdminVendorProfile {
  id: string;
  externalVendorId: number | null;
  userId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  city: string;
  state: string;
  country?: string;    // country of registration
  kycDocs: string[];
  status: BackendVendorStatus;
  createdAt: string;
  user: AdminVendorUser;
}

export interface VendorKycDoc {
  type: string;
  url: string;
}

export interface VendorKycResponse {
  shopName: string;
  ownerName: string;
  status: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  country?: string;    // country of registration
  kycDocs: VendorKycDoc[];
  user: {
    email: string;
  };
}

export interface AdminOfferVendorInfo {
  shopName: string;
  ownerName: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  user: {
    email: string;
  };
}

export interface PendingAdminOffer {
  id: string;
  externalOfferId: number | null;
  title: string;
  description: string;
  price: number;
  storeLat: number;
  storeLng: number;
  status: BackendOfferStatus;
  isActive: boolean;
  poster_url?: string;
  video_url?: string;

  // Database Fields (from screenshot)
  category?: string;
  discount_type?: string;     // e.g. "Flat Discount"
  discount_label?: string;    // e.g. "50% OFF"
  start_date?: string;
  end_date?: string;
  shop_address?: string;
  map_link?: string;
  buy_link?: string; 

  // Keep these for backward/camelCase compatibility if backend converts them
  discountPercentage?: number;
  startDate?: string;
  endDate?: string;
  area?: string;
  city?: string;

  createdAt: string;
  vendorId: string;
  vendor: AdminOfferVendorInfo;
  rejection_reason?: string;
}

export interface OfferImage {
  id: string;
  url: string;
  publicId: string;
  status: BackendMediaStatus;
  createdAt: string;
  offerId: string;
}

export interface AdminOfferDetails extends Omit<PendingAdminOffer, "vendor"> {
  vendor: AdminOfferVendorInfo;
  images: OfferImage[];
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordRequestResponse {
  message: string;
  cooldownSeconds?: number;
}

export interface ForgotPasswordVerifyResponse {
  reset_token: string;
}

/**
 * AXIOS INSTANCE
 * All admin API calls go through this instance
 */
const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_ADMIN_API_BASE_URL ||
    "https://admin-api.jewellersparadise.com",
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches Admin JWT to every request
 */
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ======================================================
   AUTH APIs
   ====================================================== */

/**
 * Admin Login
 * - Verifies admin credentials
 * - Returns JWT token
 */
export const adminLogin = (data: { email: string; password: string }) =>
  API.post<AdminLoginResponse>("/auth/admin/login", data);

/**
 * Admin Forgot Password - Request OTP
 */
export const adminForgotPasswordRequest = (data: { email: string }) =>
  API.post<ForgotPasswordRequestResponse>(
    "/auth/admin/forgot-password/request",
    data,
  );

/**
 * Admin Forgot Password - Verify OTP
 * Returns a short-lived reset token
 */
export const adminForgotPasswordVerify = (data: {
  email: string;
  otp: string;
}) =>
  API.post<ForgotPasswordVerifyResponse>(
    "/auth/admin/forgot-password/verify",
    data,
  );

/**
 * Admin Forgot Password - Reset Password
 */
export const adminForgotPasswordReset = (data: {
  reset_token: string;
  password: string;
}) => API.post<MessageResponse>("/auth/admin/forgot-password/reset", data);

/* ======================================================
   VENDOR MANAGEMENT APIs
   ====================================================== */

/**
 * Get all pending vendor applications
 * - Used in Admin → Pending Vendors screen
 */
export const getPendingVendors = () =>
  API.get<AdminVendorProfile[]>("/admin/vendors/pending");

/**
 * Get all vendors (all statuses)
 */
export const getAllVendors = () =>
  API.get<AdminVendorProfile[]>("/admin/vendors");

/**
 * Approve a vendor
 * - Changes vendor status to APPROVED
 * - Enables vendor login
 */
export const approveVendor = (userId: string) =>
  API.patch<MessageResponse>(`/admin/vendors/${userId}/approve`);

/**
 * Reject a vendor
 * - Marks vendor as REJECTED
 */
export const rejectVendor = (userId: string, reason: string) =>
  API.patch<MessageResponse>(`/admin/vendors/${userId}/reject`, { reason });

/**
 * Suspend a vendor
 */
export const suspendVendor = (userId: string) =>
  API.patch<MessageResponse>(`/admin/vendors/${userId}/suspend`);

/**
 * Get vendor KYC documents
 * - Used by admin to verify vendor identity
 */
export const getVendorKyc = (vendorId: string) =>
  API.get<VendorKycResponse>(`/admin/vendors/${vendorId}/kyc`);

/**
 * Vendor Application form
 */
export const vendorApply = (data: {
  email: string;
  password?: string;
  shopName: string;
  ownerName?: string;
}) => API.post<MessageResponse>("/vendor/apply", data);

/* ======================================================
   OFFER MANAGEMENT APIs
   ====================================================== */

/**
 * Get all pending offers
 * - Used in Admin → Pending Offers list
 */
export const getPendingOffers = () =>
  API.get<PendingAdminOffer[]>("/admin/offers/pending");

/**
 * Get all offers (all statuses)
 */
export const getAllOffers = () =>
  API.get<PendingAdminOffer[]>("/admin/offers");

/**
 * Get full offer details
 * - Includes offer info, images, vendor info
 * - Used when admin clicks an offer
 */
export const getOfferDetails = (offerId: string) =>
  API.get<AdminOfferDetails>(`/admin/offers/${offerId}`);

/**
 * Approve an offer and its images
 * - Makes offer publicly visible
 */
export const approveOffer = (offerId: string) =>
  API.patch<MessageResponse>(`/admin/offers/${offerId}/approve`);

/**
 * Reject an offer and its images
 * - Keeps offer hidden from users
 */
export const rejectOffer = (offerId: string, reason: string) =>
  API.patch<MessageResponse>(`/admin/offers/${offerId}/reject`, { reason });

/* ======================================================
   PLAN MANAGEMENT APIs
   ====================================================== */

/**
 * Get all subscription plans
 */
export const getAllPlans = () =>
  API.get<{ success: boolean; data: SubscriptionPlan[] }>("/plans");

/**
 * Create a new plan
 */
export const createPlan = (data: Omit<SubscriptionPlan, "id">) =>
  API.post<{ success: boolean; data: SubscriptionPlan }>("/plans", data);

/**
 * Update an existing plan
 */
export const updatePlan = (id: string, data: Partial<SubscriptionPlan>) =>
  API.patch<{ success: boolean; data: SubscriptionPlan }>(`/plans/${id}`, data);

/**
 * Delete a plan
 */
export const deletePlan = (id: string) =>
  API.delete<{ success: boolean }>(`/plans/${id}`);

/**
 * Delete a vendor
 */
export const deleteVendor = (userId: string) =>
  API.delete<MessageResponse>(`/admin/vendors/${userId}`);

/**
 * Delete an offer
 */
export const deleteOffer = (offerId: string) =>
  API.delete<MessageResponse>(`/admin/offers/${offerId}`);

/* ======================================================
   PRODUCT MANAGEMENT APIs
   ====================================================== */

export interface Product {
  id: number;
  title: string;
  description: string;
  image1_url: string;
  image2_url: string;
  affiliate_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all products
 */
export const getProducts = () =>
  API.get<Product[]>("/products");

/**
 * Create a new product
 */
export const createProduct = (formData: FormData) =>
  API.post<Product>("/admin/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

/**
 * Update an existing product
 */
export const updateProduct = (id: number, formData: FormData) =>
  API.patch<Product>(`/admin/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

/**
 * Delete a product
 */
export const deleteProduct = (id: number) =>
  API.delete<{ message: string }>(`/admin/products/${id}`);

/* ======================================================
   STORE LISTINGS MANAGEMENT APIs (Admin-Managed Stores)
   ====================================================== */

export interface StoreGalleryItem {
  id: number;
  store_id: number;
  image_url: string;
  caption?: string | null;
  display_order: number;
  created_at: string;
}

export interface StoreOfferItem {
  id: number;
  store_id: number;
  title: string;
  description?: string | null;
  poster_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  terms?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StoreClaimItem {
  id: number;
  store_id: number;
  claimant_name: string;
  claimant_phone: string;
  claimant_email: string;
  proof_type?: string | null;
  proof_doc_url?: string | null;
  notes?: string | null;
  status: string;
  admin_notes?: string | null;
  created_at: string;
  store?: {
    id: number;
    store_name: string;
    city: string;
    phone: string;
  };
}

export interface StoreReportItem {
  id: number;
  store_id: number;
  report_type: string;
  description: string;
  reported_by_email?: string | null;
  status: string;
  admin_notes?: string | null;
  created_at: string;
  store?: {
    id: number;
    store_name: string;
    city: string;
  };
}

export interface StoreListing {
  id: number;
  slug: string;
  store_name: string;
  logo_url: string | null;
  cover_photo_url: string | null;
  short_description: string | null;
  categories: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  google_maps_link: string | null;
  phone: string;
  whatsapp: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  opening_hours: string | null;
  weekly_holiday: string | null;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | string;
  is_verified: boolean;
  info_source?: string | null;
  store_contact?: string | null;
  photo_permissions?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  gallery?: StoreGalleryItem[];
  offers?: StoreOfferItem[];
  _count?: {
    gallery: number;
    offers: number;
    claim_requests: number;
    report_requests: number;
  };
}

export const getAdminStoreListings = (params?: {
  status?: string;
  search?: string;
  isVerified?: string;
}) =>
  API.get<StoreListing[]>("/admin/stores", { params });

export const getAdminStoreById = (id: number) =>
  API.get<StoreListing>(`/admin/stores/${id}`);

export const createAdminStoreListing = (formData: FormData) =>
  API.post<StoreListing>("/admin/stores", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateAdminStoreListing = (id: number, formData: FormData) =>
  API.patch<StoreListing>(`/admin/stores/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteAdminStoreListing = (id: number) =>
  API.delete<{ success: boolean; message: string }>(`/admin/stores/${id}`);

export const toggleAdminStorePublish = (id: number, status: string) =>
  API.patch<StoreListing>(`/admin/stores/${id}/publish`, { status });

export const toggleAdminStoreVerification = (id: number, isVerified?: boolean) =>
  API.patch<StoreListing>(`/admin/stores/${id}/verify`, { isVerified });

export const uploadAdminStoreGallery = (id: number, formData: FormData) =>
  API.post<StoreGalleryItem[]>(`/admin/stores/${id}/gallery`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteAdminStoreGalleryImage = (storeId: number, imageId: number) =>
  API.delete<{ success: boolean; message: string }>(
    `/admin/stores/${storeId}/gallery/${imageId}`,
  );

export const addAdminStoreOffer = (storeId: number, formData: FormData) =>
  API.post<StoreOfferItem>(`/admin/stores/${storeId}/offers`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteAdminStoreOffer = (offerId: number) =>
  API.delete<{ success: boolean; message: string }>(
    `/admin/stores/offers/${offerId}`,
  );

export const getAdminStoreClaims = () =>
  API.get<StoreClaimItem[]>("/admin/stores/claims");

export const updateAdminStoreClaim = (
  claimId: number,
  data: { status: string; adminNotes?: string },
) => API.patch<StoreClaimItem>(`/admin/stores/claims/${claimId}`, data);

export const getAdminStoreReports = () =>
  API.get<StoreReportItem[]>("/admin/stores/reports");

export const updateAdminStoreReport = (
  reportId: number,
  data: { status: string; adminNotes?: string },
) => API.patch<StoreReportItem>(`/admin/stores/reports/${reportId}`, data);

/* ======================================================
   PUBLIC STORE LISTINGS APIs (Customer-facing)
   ====================================================== */

export const getPublicStores = (params?: {
  search?: string;
  city?: string;
  state?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => API.get("/stores", { params });

export const getPublicStoreProfile = (slugOrId: string | number) =>
  API.get(`/stores/${slugOrId}`);

export const submitStoreClaim = (storeId: number, formData: FormData) =>
  API.post(`/stores/${storeId}/claim`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const submitStoreReport = (
  storeId: number,
  data: {
    reportType: string;
    description: string;
    reportedByEmail?: string;
  },
) => API.post(`/stores/${storeId}/report`, data);

/* ======================================================
   EXPORT AXIOS INSTANCE (optional)
   ====================================================== */

export default API;
