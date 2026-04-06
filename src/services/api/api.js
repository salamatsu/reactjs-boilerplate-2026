// ============================================
// SCAN2WIN — API Service Layer
// Worldbex Events "Scan to Win" Platform
//
// All endpoints here mirror the live backend.
// When USE_MOCK = true in constants.jsx the
// React Query hooks return MOCK_DATA directly,
// so these functions are only called in production.
// ============================================

import { axiosInstance, createAxiosInstanceWithInterceptor } from "./axios";
import { handleApiError } from "../../utils/handlers";

// Authenticated axios instance (Bearer token + CSRF headers)
const axios = createAxiosInstanceWithInterceptor("data");
const axiosMultipart = createAxiosInstanceWithInterceptor("multipart");

// ============================================
// CSRF TOKEN — Required for admin CMS calls
// ============================================

export const getCsrfToken = async () => {
  try {
    const response = await axiosInstance.get("/api/v1/auth/csrf-token");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// AUTH — Admin CMS login / refresh / logout
// ============================================

export const loginApi = async (credentials) => {
  try {
    const response = await axiosInstance.post("/api/v1/auth/login", credentials);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// refreshToken must be passed by the caller (read fresh from the store)
export const refreshTokenApi = async (refreshToken) => {
  try {
    const response = await axiosInstance.post("/api/v1/auth/refresh", {
      refreshToken,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const logoutApi = async (refreshToken) => {
  try {
    const response = await axios.post("/api/v1/auth/logout", { refreshToken });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// EVENTS — Visitor App
// GET /api/events → returns event config + interactions list
// ============================================

export const getEventApi = async () => {
  try {
    const response = await axiosInstance.get("/api/events");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// PRIZES — CMS + Redeem Portal
// GET    /api/prizes          → list all prizes
// POST   /api/prizes          → create prize
// PUT    /api/prizes/:id      → update prize
// DELETE /api/prizes/:id      → delete prize
// PUT    /api/prizes/pool     → bulk-update isPool flags
// ============================================

export const getPrizesApi = async () => {
  try {
    const response = await axios.get("/api/prizes");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createPrizeApi = async (data) => {
  try {
    const response = await axiosMultipart.post("/api/prizes", data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updatePrizeApi = async ({ id, ...data }) => {
  try {
    const response = await axiosMultipart.put(`/api/prizes/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deletePrizeApi = async (id) => {
  try {
    const response = await axios.delete(`/api/prizes/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Bulk update isPool flags for all prizes (Prize Pool Config page)
// Payload: [{ id, isPool }]
export const updatePrizePoolApi = async (poolData) => {
  try {
    const response = await axios.put("/api/prizes/pool", { prizes: poolData });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// SURVEY — Redeem Portal
// GET /api/survey-questions → list survey questions
// ============================================

export const getSurveyQuestionsApi = async () => {
  try {
    const response = await axiosInstance.get("/api/survey-questions");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// REDEEM — Redeem Portal (Step 4)
// POST /api/redeem → submit scan data, survey answers, and prize won
// Payload: { qrData: string, surveyAnswers: Record<string, string>, prizeId: string }
// Returns error if QR already redeemed (prevents double redemption)
// ============================================

export const redeemApi = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/redeem", payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw so the caller can handle "already redeemed" errors
  }
};

// ============================================
// FILE UPLOAD — CMS prize images
// POST /api/upload → multipart form data
// ============================================

export const uploadFileApi = async (data) => {
  try {
    const response = await axiosMultipart.post("/api/upload", data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
