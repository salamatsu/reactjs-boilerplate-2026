// ============================================
// SCAN2WIN — APP CONSTANTS
// Worldbex Events "Scan to Win" Platform
// ============================================

export const APP_NAME = "Scan2Win";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Base URL for the visitor web app (used in QR/share links)
export const APP_BASE_URL = "https://app.worldbexevents.com";

// AES encryption key for redemption QR codes
// Replace with VITE_SECRET_KEY env var in production
export const SECRET_KEY =
  import.meta.env.VITE_SECRET_KEY || "worldbex-scan-2025";

// ============================================
// USER ROLES (Admin CMS)
// ============================================

export const USER_ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
};

// ============================================
// PAGINATION DEFAULTS
// ============================================

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// ============================================
// SCAN2WIN DESIGN TOKENS
// ============================================

export const COLORS = {
  primary: "#1A1A2E",   // Deep navy background
  surface: "#16213E",   // Card/surface background
  accent: "#E94560",    // Vivid red-pink — primary CTA
  gold: "#F5A623",      // Gold — highlight / points
  success: "#00D68F",   // Success green
  text: "#FFFFFF",
  muted: "#8892A4",
};

// ============================================
// SCAN2WIN MOCK DATA FLAG
// Set to false once the live API is wired up
// ============================================

export const USE_MOCK = true;

// ============================================
// UPCOMING WORLDBEX EVENTS (hardcoded)
// ============================================

export const UPCOMING_EVENTS = [
  {
    name: "Manila International Auto Show (MIAS) 2025",
    date: "April 3–6, 2025",
    tag: "mias",
    registrationUrl: "https://register.worldbexevents.com/",
  },
  {
    name: "Philippine Industrial Safety Conference",
    date: "May 14–15, 2025",
    tag: "pisc",
    registrationUrl: "https://register.worldbexevents.com/",
  },
  {
    name: "World Food Expo (WOFEX) 2025",
    date: "July 30 – August 2, 2025",
    tag: "wofex",
    registrationUrl: "https://register.worldbexevents.com/",
  },
  {
    name: "Philippine Franchise Association Expo",
    date: "September 5–7, 2025",
    tag: "pfa",
    registrationUrl: "https://register.worldbexevents.com/",
  },
];

// ============================================
// MOCK API DATA (used when USE_MOCK = true)
// ============================================

export const MOCK_DATA = {
  event: {
    eventTag: "mias",
    name: "Manila International Auto Show (MIAS) 2025",
    date: "April 3–6, 2025",
    location: "SM Mall of Asia Concert Grounds, Pasay City",
    description:
      "The Philippines' premier automotive event showcasing the latest vehicles, concepts, and innovations from leading car brands.",
    goal: 100,
    interactions: [
      { id: 1, name: "Honda Booth Visit", points: 15 },
      { id: 2, name: "Toyota Test Drive", points: 20 },
      { id: 3, name: "Mitsubishi Interactive Zone", points: 10 },
      { id: 4, name: "Ford Exhibit Stamp", points: 15 },
      { id: 5, name: "Geely Showcase Scan", points: 10 },
      { id: 6, name: "Survey Station", points: 20 },
      { id: 7, name: "Photo Booth Check-In", points: 10 },
    ],
  },
  prizes: [
    {
      id: "p1",
      name: "Car Care Kit",
      description: "Premium car cleaning and detailing kit.",
      image: null,
      isPool: 1,
    },
    {
      id: "p2",
      name: "MIAS Merchandise Bag",
      description: "Exclusive MIAS 2025 tote bag with goodies.",
      image: null,
      isPool: 1,
    },
    {
      id: "p3",
      name: "Fuel Voucher ₱500",
      description: "₱500 fuel voucher redeemable at participating stations.",
      image: null,
      isPool: 1,
    },
    {
      id: "p4",
      name: "Dashboard Cam",
      description: "Full HD dash camera with night vision.",
      image: null,
      isPool: 1,
    },
    {
      id: "p5",
      name: "Better Luck Next Time",
      description: "Thank you for joining!",
      image: null,
      isPool: 0,
    },
    {
      id: "p6",
      name: "Try Again",
      description: "Keep scanning for more chances!",
      image: null,
      isPool: 0,
    },
  ],
  surveyQuestions: [
    {
      id: "sq1",
      question: "How did you hear about MIAS 2025?",
      type: "multiple_choice",
      options: ["Social Media", "Friend/Family", "TV/Radio", "Billboard", "Other"],
    },
    {
      id: "sq2",
      question: "Rate your overall MIAS 2025 experience.",
      type: "rating",
    },
    {
      id: "sq3",
      question: "Which car brand impressed you the most today?",
      type: "text",
    },
    {
      id: "sq4",
      question: "Would you attend MIAS again next year?",
      type: "multiple_choice",
      options: ["Definitely", "Probably", "Not Sure", "No"],
    },
  ],
};
