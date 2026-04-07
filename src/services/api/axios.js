import { message } from "antd";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  useAdminAuthStore,
  useCurrentActiveUserToken,
} from "../../store/useAdminAuthStore";
import { useCsrfStore } from "../../store/useCsrfStore";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASEURL,
  headers: {
    "Content-Type": "application/json",
    // "Access-Control-Allow-Origin": "*",
  },
  // withCredentials: true, // Send cookies (refresh token) with requests
});

export const userTypeAuth = {
  admin: "admin",
};

export const tokens = {
  [userTypeAuth.admin]: useAdminAuthStore,
};

export const getUserToken = (userType = userTypeAuth.admin) => {
  return tokens[userType]?.getState();
};

// Methods that require CSRF protection (only POST and PATCH)
const CSRF_PROTECTED_METHODS = ["post", "patch"];

const shouldApplyCsrfToken = (config) => {
  const method = config.method?.toLowerCase();
  const isCsrfEndpoint = config.url?.includes("/csrf-token");
  return !isCsrfEndpoint && CSRF_PROTECTED_METHODS.includes(method);
};

// Add CSRF token interceptor to axiosInstance (for POST, PATCH, PUT, DELETE only)
axiosInstance.interceptors.request.use(
  (config) => {
    // Add Idempotency-Key for all requests
    config.headers["Idempotency-Key"] = uuidv4();

    if (shouldApplyCsrfToken(config)) {
      const csrfToken = useCsrfStore?.getState()?.csrfToken;
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for CSRF token refetch
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log(error);
    const originalRequest = error.config;

    // Check for CSRF validation failure
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === "CSRF_VALIDATION_FAILED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Fetch new CSRF token
        // const response = await axiosInstance.get("/api/v1/auth/csrf-token");
        // const newCsrfToken = response.data.csrfToken;

        // // Update the store with the new token
        // useCsrfStore?.getState()?.setCsrfToken(newCsrfToken);

        // // Update the original request with the new token if applicable
        // if (shouldApplyCsrfToken(originalRequest)) {
        //   originalRequest.headers["x-csrf-token"] = newCsrfToken;
        // }

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refetchError) {
        console.error("Failed to refetch CSRF token:", refetchError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// Cache for authenticated axios instances
const instanceCache = new Map();

export const createAxiosInstanceWithInterceptor = (type = "data") => {
  // Return cached instance if available
  const cacheKey = type;
  if (instanceCache.has(cacheKey)) {
    return instanceCache.get(cacheKey);
  }

  const headers = {
    // "Access-Control-Allow-Origin": "*",
  };

  if (type === "data") {
    headers["Content-Type"] = "application/json";
  } else if (type === "multipart") {
    headers["Content-Type"] = "multipart/form-data";
  }

  const instance = axios.create({
    baseURL: import.meta.env.VITE_BASEURL,
    headers,
    withCredentials: true, // Send cookies (refresh token) with requests
  });

  // Request interceptor: Add auth token and CSRF token
  instance.interceptors.request.use(
    (config) => {
      // Add Idempotency-Key for all requests
      config.headers["Idempotency-Key"] = uuidv4();

      // Get fresh token state for each request (not cached at instance creation)
      const { user } = useCurrentActiveUserToken?.getState() || {};
      const userTokenState = getUserToken(user);

      if (userTokenState?.token) {
        config.headers.Authorization = `Bearer ${userTokenState.token}`;
      } else {
        console.warn("No authentication token found");
      }

      // Add CSRF token for POST, PATCH, PUT, DELETE requests
      // if (shouldApplyCsrfToken(config)) {
      //   const csrfToken = useCsrfStore?.getState()?.csrfToken;
      //   if (csrfToken) {
      //     config.headers["x-csrf-token"] = csrfToken;
      //   }
      // }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: Handle CSRF failures and auth errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const errMessage = error.response?.data;
      const originalRequest = error.config;

      // // Handle CSRF validation failure
      // if (
      //   error.response?.status === 403 &&
      //   errMessage?.code === "CSRF_VALIDATION_FAILED" &&
      //   !originalRequest._retry
      // ) {
      //   originalRequest._retry = true;

      //   try {
      //     // Fetch new CSRF token
      //     const response = await axiosInstance.get("/api/v1/auth/csrf-token");
      //     const newCsrfToken = response.data.csrfToken;

      //     // Update the store with the new token
      //     useCsrfStore?.getState()?.setCsrfToken(newCsrfToken);

      //     // Update the original request with the new token if applicable
      //     if (shouldApplyCsrfToken(originalRequest)) {
      //       originalRequest.headers["x-csrf-token"] = newCsrfToken;
      //     }

      //     // Retry the original request
      //     return instance(originalRequest);
      //   } catch (refetchError) {
      //     console.error("Failed to refetch CSRF token:", refetchError);
      //     return Promise.reject(error);
      //   }
      // }

      // Handle authentication errors — token is valid for 24h, no refresh endpoint.
      // On expiry, clear auth state and prompt re-login.
      const authErrorMessages = [
        "Invalid or expired token.",
        "Invalid token.",
        "No token provided",
        "Token expired",
        "jwt expired",
      ];

      if (
        authErrorMessages.includes(errMessage?.message) ||
        errMessage?.code === 300 ||
        errMessage?.code === "TOKEN_EXPIRED"
      ) {
        message.warning("Your session has expired. Please login again.");

        const { user } = useCurrentActiveUserToken?.getState() || {};
        const userTokenState = getUserToken(user);
        userTokenState?.reset();
      }

      return Promise.reject(error);
    },
  );

  // Cache the instance for reuse
  instanceCache.set(cacheKey, instance);

  return instance;
};
