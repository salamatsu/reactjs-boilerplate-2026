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
// CAMPAIGN RAFFLE — Participant Flow
// Base: /api/v1/raffles/campaigns
//
// Step 1  GET  /campaigns/event/:eventTag        → load campaign + booth list
// Step 3  POST /campaigns/:campaignId/generate-raffle-qr → get encrypted QR
// Step 5  POST /campaigns/:campaignId/validate-raffle    → validate QR, get raffleEntryId
// Step 7  POST /campaigns/:campaignId/spin-wheel         → record spin outcome
// ============================================

const RAFFLE_BASE = "/api/v1/raffles";

export const getCampaignByEventTagApi = async (eventTag) => {
  try {
    const response = await axiosInstance.get(
      `${RAFFLE_BASE}/campaigns/event/${eventTag}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const generateRaffleQrApi = async ({
  campaignId,
  boothCodes,
  participantInfo,
}) => {
  try {
    const response = await axiosInstance.post(
      `${RAFFLE_BASE}/campaigns/${campaignId}/generate-raffle-qr`,
      { boothCodes, participantInfo },
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const validateRaffleApi = async ({ campaignId, encryptedQr }) => {
  try {
    const response = await axiosInstance.post(
      `${RAFFLE_BASE}/campaigns/${campaignId}/validate-raffle`,
      { encryptedQr },
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const spinWheelApi = async ({
  campaignId,
  raffleEntryId,
  prizeName,
  wheelResult,
  claimedBy,
}) => {
  try {
    const response = await axiosInstance.post(
      `${RAFFLE_BASE}/campaigns/${campaignId}/spin-wheel`,
      { raffleEntryId, prizeName, wheelResult, claimedBy },
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// CAMPAIGN MANAGEMENT — Admin CMS
// Base: /api/v1/raffles/campaigns
//
// GET    /campaigns              → list all
// GET    /campaigns/:id          → get by id
// POST   /campaigns              → create
// PATCH  /campaigns/:id          → update
// DELETE /campaigns/:id          → delete (draft only)
// GET    /campaigns/:id/booths   → all booths incl. inactive
// GET    /campaigns/:id/prizes   → prize claim stats
// ============================================

export const listCampaignsApi = async () => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/campaigns`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getCampaignByIdApi = async (campaignId) => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createCampaignApi = async (data) => {
  try {
    const response = await axios.post(`${RAFFLE_BASE}/campaigns`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateCampaignApi = async ({ id, ...data }) => {
  try {
    const response = await axios.patch(`${RAFFLE_BASE}/campaigns/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteCampaignApi = async (id) => {
  try {
    const response = await axios.delete(`${RAFFLE_BASE}/campaigns/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getCampaignBoothsApi = async (campaignId) => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/campaigns/${campaignId}/booths`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getCampaignPrizesApi = async (campaignId) => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/campaigns/${campaignId}/prizes`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
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
