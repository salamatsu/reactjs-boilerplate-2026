// ============================================
// APP CONSTANTS
// ============================================

export const APP_NAME = import.meta.env.VITE_APP_NAME || "My App";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// ============================================
// USER ROLES
// ============================================

export const USER_ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  USER: "USER",
};

// ============================================
// STATUS VALUES
// ============================================

export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  REJECTED: "rejected",
};

// ============================================
// PAGINATION DEFAULTS
// ============================================

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
