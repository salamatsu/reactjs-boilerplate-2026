import { formatQueryParams } from "../../utils/itemFormat";
import { axiosInstance, createAxiosInstanceWithInterceptor } from "./axios";
import { handleApiError } from "../../utils/handlers";

const axios = createAxiosInstanceWithInterceptor("data");
const axiosMultipart = createAxiosInstanceWithInterceptor("multipart");

// ============================================
// CSRF TOKEN API
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
// AUTH APIS
// ============================================

export const loginApi = async (credentials) => {
  try {
    const response = await axiosInstance.post("/api/v1/auth/login", credentials);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// refreshToken string must be passed in — caller reads it from the store
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

// refreshToken string must be passed in — caller reads it from the store
export const logoutApi = async (refreshToken) => {
  try {
    const response = await axios.post("/api/v1/auth/logout", { refreshToken });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// GET current authenticated user profile
// hashMe is an optional query param (e.g. "password123")
export const getMeApi = async (hashMe) => {
  try {
    const query = hashMe ? `?hashMe=${encodeURIComponent(hashMe)}` : "";
    const response = await axios.get(`/api/v1/auth/me${query}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// PUBLIC APIs - Registration
// ============================================

export const registerPublicApi = async (data) => {
  try {
    const response = await axiosInstance.post("/api/v1/public/register", data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============================================
// ITEMS - CRUD TEMPLATE (GET, POST, PUT, DELETE)
// Replace "items" with your actual resource name.
// ============================================

export const getItemsApi = async (params) => {
  try {
    const response = await axios.get(
      `/api/v1/items?${formatQueryParams(params, { skipEmpty: true })}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getItemByIdApi = async (id) => {
  try {
    const response = await axios.get(`/api/v1/items/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createItemApi = async (data) => {
  try {
    const response = await axios.post("/api/v1/items", data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateItemApi = async ({ id, ...data }) => {
  try {
    const response = await axios.put(`/api/v1/items/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteItemApi = async (id) => {
  try {
    const response = await axios.delete(`/api/v1/items/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// ATTENDEES APIS
// Params: page, limit, sortBy, sortOrder, eventId,
//         transactionId, category, procId, search
// ============================================

export const getAttendeesApi = async (params) => {
  try {
    const response = await axios.get(
      `/api/v1/cms/attendees/attendees?${formatQueryParams(params, { skipEmpty: true })}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAttendeeByIdApi = async (id) => {
  try {
    const response = await axios.get(`/api/v1/cms/attendees/attendees/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Same query params as getAttendeesApi — returns full list without pagination
export const exportAttendeesApi = async (params) => {
  try {
    const response = await axios.get(
      `/api/v1/cms/attendees/export?${formatQueryParams(params, { skipEmpty: true })}`,
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ============================================
// MULTIPART / FILE UPLOAD TEMPLATE
// ============================================

export const uploadFileApi = async (data) => {
  try {
    const response = await axiosMultipart.post("/api/v1/upload", data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
