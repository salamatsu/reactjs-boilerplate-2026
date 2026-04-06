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

// Base for all campaign-raffle endpoints
const RAFFLE_BASE = "/api/v1/raffles";

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
// AUTH — Admin CMS login
// POST /api/v1/raffles/auth/login
// GET  /api/v1/raffles/auth/me
//
// Response: { success, data: { admin, accessToken, tokenType, expiresIn, expiresAt } }
// No refresh token — accessToken is valid for 24h.
// ============================================

export const loginApi = async (credentials) => {
  try {
    const response = await axiosInstance.post(`${RAFFLE_BASE}/auth/login`, credentials);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getMeApi = async () => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/auth/me`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// EVENTS — Visitor App
// GET /api/events → returns event config + interactions list
// GET /api/scans/getEvents → returns list of all events
// ============================================

export const getEventApi = async () => {
  try {
    const response = await axiosInstance.get("/api/events");
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getEventsListApi = async () => {
  try {
    const response = await axiosInstance.get("/api/scans/getEvents");
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
// Base: /api/v1/raffles/campaigns  (public, no auth)
//
// Step 1  GET  /campaigns/event/:eventTag              → load campaign + booth list
// Step 3  POST /campaigns/:campaignId/generate-raffle-qr → get encrypted QR
// Step 5  POST /campaigns/:campaignId/validate-raffle    → validate QR, get raffleEntryId
// Step 7  POST /campaigns/:campaignId/spin-wheel         → record spin outcome
// ============================================

export const getCampaignImagesPublicApi = async (campaignId) => {
  try {
    const response = await axiosInstance.get(
      `${RAFFLE_BASE}/campaigns/${campaignId}/images`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

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
  prizeId,
  wheelResult,
  claimedBy,
}) => {
  try {
    const response = await axiosInstance.post(
      `${RAFFLE_BASE}/campaigns/${campaignId}/spin-wheel`,
      { raffleEntryId, prizeId: prizeId ?? null, wheelResult, claimedBy },
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// PRIZES — Public (Participant / Raffle Station)
// GET /campaigns/:campaignId/prizes → active prizes for wheel
// ============================================

export const getCampaignPrizesPublicApi = async (campaignId) => {
  try {
    const response = await axiosInstance.get(
      `${RAFFLE_BASE}/campaigns/${campaignId}/prizes`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// CAMPAIGN MANAGEMENT — Admin CMS
// Base: /api/v1/raffles/admin/campaigns  (requires Bearer token)
//
// GET    /admin/campaigns              → list all
// GET    /admin/campaigns/:id          → get by id
// POST   /admin/campaigns              → create
// PATCH  /admin/campaigns/:id          → update
// DELETE /admin/campaigns/:id          → delete (draft only)
// ============================================

export const listCampaignsApi = async () => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/admin/campaigns`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getCampaignByIdApi = async (campaignId) => {
  try {
    const response = await axios.get(`${RAFFLE_BASE}/admin/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createCampaignApi = async (data) => {
  try {
    const response = await axios.post(`${RAFFLE_BASE}/admin/campaigns`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateCampaignApi = async ({ id, ...data }) => {
  try {
    const response = await axios.patch(`${RAFFLE_BASE}/admin/campaigns/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteCampaignApi = async (id) => {
  try {
    const response = await axios.delete(`${RAFFLE_BASE}/admin/campaigns/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// BOOTH MANAGEMENT — Admin CMS
// Base: /api/v1/raffles/admin/campaigns/:campaignId/booths
//
// GET    /booths           → list all (incl. inactive), sorted by sortOrder
// GET    /booths/:boothId  → get single booth
// POST   /booths           → create booth
// PATCH  /booths/:boothId  → partial update
// DELETE /booths/:boothId  → delete (blocked if scan logs exist)
// ============================================

export const getCampaignBoothsApi = async (campaignId) => {
  try {
    const response = await axios.get(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/booths`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getBoothByIdApi = async ({ campaignId, boothId }) => {
  try {
    const response = await axios.get(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/booths/${boothId}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createBoothApi = async ({ campaignId, ...data }) => {
  try {
    const response = await axios.post(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/booths`,
      data,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateBoothApi = async ({ campaignId, boothId, ...data }) => {
  try {
    const response = await axios.patch(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/booths/${boothId}`,
      data,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteBoothApi = async ({ campaignId, boothId }) => {
  try {
    const response = await axios.delete(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/booths/${boothId}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// PRIZE MANAGEMENT — Admin CMS
// Base: /api/v1/raffles/admin/campaigns/:campaignId/prizes
//
// GET    /prizes           → list all (active + inactive), sorted by sortOrder
// POST   /prizes           → create prize
// PATCH  /prizes/:prizeId  → partial update
// DELETE /prizes/:prizeId  → delete (blocked if claims exist)
// ============================================

export const getCampaignPrizesApi = async (campaignId) => {
  try {
    const response = await axios.get(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/prizes`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createCampaignPrizeApi = async ({ campaignId, ...data }) => {
  try {
    const response = await axios.post(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/prizes`,
      data,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateCampaignPrizeApi = async ({ campaignId, prizeId, ...data }) => {
  try {
    const response = await axios.patch(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/prizes/${prizeId}`,
      data,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteCampaignPrizeApi = async ({ campaignId, prizeId }) => {
  try {
    const response = await axios.delete(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/prizes/${prizeId}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// ADMIN STATS
// GET /admin/campaigns/:campaignId/participant/:participantId/progress
//   → full participant view: points, scans, claims
// ============================================

export const getParticipantProgressApi = async ({ campaignId, participantId }) => {
  try {
    const response = await axios.get(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/participant/${participantId}/progress`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// IMAGE MAPS — Admin CMS
// Base: /api/v1/raffles/admin/campaigns/:campaignId/images
//
// GET    /images                      → list all, grouped by siteCode
// POST   /images                      → upload new image (multipart)
// PATCH  /images/:imageId             → update metadata (JSON)
// POST   /images/:imageId/replace     → replace file (multipart)
// DELETE /images/:imageId             → delete record + file
// ============================================

export const getCampaignImagesApi = async (campaignId) => {
  try {
    const response = await axios.get(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/images`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const uploadCampaignImageApi = async ({ campaignId, formData }) => {
  try {
    const response = await axiosMultipart.post(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/images`,
      formData,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateCampaignImageApi = async ({ campaignId, imageId, ...data }) => {
  try {
    const response = await axios.patch(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/images/${imageId}`,
      data,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const replaceCampaignImageApi = async ({ campaignId, imageId, formData }) => {
  try {
    const response = await axiosMultipart.post(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/images/${imageId}/replace`,
      formData,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteCampaignImageApi = async ({ campaignId, imageId }) => {
  try {
    const response = await axios.delete(
      `${RAFFLE_BASE}/admin/campaigns/${campaignId}/images/${imageId}`,
    );
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
