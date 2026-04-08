// ============================================
// SCAN2WIN — Visitor Web App
// Worldbex Events "Scan to Win" Platform
//
// Route: /:eventTag  (e.g. /mias)
// Target: Mobile & tablet only
//
// Event Raffle API flow:
//   Step 1  Load event + booth list (GET /campaigns/event/:eventTag)
//   Step 2  Client scans booth QRs locally (no API call per scan)
//   Step 3  Generate raffle QR when threshold reached (POST /campaigns/:id/generate-raffle-qr)
//   Step 4  Visitor presents QR at raffle station
// ============================================

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useParams, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { v4 as uuidv4 } from "uuid";
import {
  MapPin,
  Calendar,
  CheckCircle,
  Circle,
  Copy,
  Share2,
  Camera,
  X,
  ChevronRight,
  Zap,
  Gift,
  Loader2,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  QrCode,
  Star,
  Trophy,
  ScanLine,
  Download,
  Maximize2,
} from "lucide-react";
import { APP_BASE_URL } from "../../lib/constants";
import { logo, dgsiLogo, eventbookLogo } from "../../assets/images/logos";
import { formatDateTime, DATE_FORMATS } from "../../utils/formatDate";
import {
  useGetCampaignByEventTag,
  useGetCampaignImagesPublic,
  useGenerateRaffleQr,
  useGetEventsList,
} from "../../services/requests/useApi";

// ─── Theme ────────────────────────────────────────────────────────────────────

const LIGHT = {
  bg: "#FFFFFF",
  card: "#FFF7EE",
  deeper: "#FFF3E0",
  text: "#1A1A2E",
  muted: "#6B7280",
  primary: "#FD9114",
  primaryBg: "rgba(253,145,20,0.1)",
  primaryBorder: "rgba(253,145,20,0.25)",
  progressTrack: "#FFE4C2",
  cardBorder: "rgba(0,0,0,0.07)",
  divider: "rgba(0,0,0,0.06)",
};

const DARK = {
  bg: "#1A1A2E",
  card: "#16213E",
  deeper: "#0F1629",
  text: "#FFFFFF",
  muted: "#8892A4",
  primary: "#E94560",
  primaryBg: "rgba(233,69,96,0.1)",
  primaryBorder: "rgba(233,69,96,0.2)",
  progressTrack: "#16213E",
  cardBorder: "rgba(255,255,255,0.05)",
  divider: "#16213E",
};

const THEME_KEY = "qrquest_theme";

const ThemeContext = createContext(LIGHT);
const useVT = () => useContext(ThemeContext);

// ─── localStorage helpers ─────────────────────────────────────────────────────

const entryKey = (eventTag) => `qrquest_entry_${eventTag}`;

const loadEntry = (eventTag) => {
  try {
    const raw = localStorage.getItem(entryKey(eventTag));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveEntry = (entry) => {
  localStorage.setItem(entryKey(entry.eventTag), JSON.stringify(entry));
};

// ─── Landscape guard (mobile only) ───────────────────────────────────────────

const isLandscapeMobile = () =>
  window.innerWidth > window.innerHeight && window.innerWidth < 1024;

const LandscapeGuard = () => {
  const [landscape, setLandscape] = useState(isLandscapeMobile);

  useEffect(() => {
    const update = () => setLandscape(isLandscapeMobile());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!landscape) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-4 text-center px-8"
      style={{ background: "#1E3A71", color: "#fff" }}
    >
      <motion.div
        animate={{ rotate: [0, -15, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      </motion.div>
      <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
        Please rotate your device
      </p>
      <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: 0 }}>
        This app works best in portrait mode
      </p>
    </div>
  );
};

// ─── Desktop guard ────────────────────────────────────────────────────────────

const DesktopGuard = () => {
  const t = useVT();
  return (
    <div
      className="hidden md:flex h-screen items-center justify-center text-center px-8"
      style={{ background: t.bg }}
    >
      <div>
        <Zap className="mx-auto mb-4" style={{ color: t.primary }} size={56} />
        <h1 className="text-2xl font-bold mb-2" style={{ color: t.text }}>
          Mobile Only
        </h1>
        <p style={{ color: t.muted }}>
          Please open this page on your mobile device to participate in Scan to
          Win.
        </p>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Arc / circular progress bar */
const GoalProgress = ({ points, threshold }) => {
  const t = useVT();
  const pct = Math.min((points / threshold) * 100, 100);
  const radius = 70;
  const stroke = 10;
  const normalizedR = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedR;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={normalizedR}
            fill="none"
            stroke={t.progressTrack}
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedR}
            fill="none"
            stroke={t.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: t.text }}>
            {points}
          </span>
          <span className="text-xs" style={{ color: t.muted }}>
            pts
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm" style={{ color: t.muted }}>
        <span className="font-semibold" style={{ color: "#F5A623" }}>
          {points}
        </span>{" "}
        / {threshold} pts
      </p>
      <div
        className="w-full mt-3 rounded-full h-2"
        style={{ background: t.progressTrack }}
      >
        <motion.div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(to right, ${t.primary}, #F5A623)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1 text-xs" style={{ color: t.muted }}>
        {Math.round(pct)}% of goal
      </p>
    </div>
  );
};

/** List of booths with scan status */
const BoothList = ({ booths, scannedCodes }) => {
  const t = useVT();
  return (
    <div className="space-y-2">
      {booths.map((booth) => {
        const scanned = scannedCodes.includes(booth.boothCode);
        return (
          <div
            key={booth.id}
            className="flex items-center justify-between rounded-xl px-4 py-3 transition-all"
            style={{
              background: t.card,
              border: scanned
                ? `1px solid ${t.cardBorder}`
                : `1px solid ${t.primaryBorder}`,
              opacity: scanned ? 0.65 : 1,
            }}
          >
            <div className="flex items-center gap-3">
              {scanned ? (
                <CheckCircle size={20} className="text-[#00D68F] shrink-0" />
              ) : (
                <Circle
                  size={20}
                  className="shrink-0"
                  style={{ color: t.muted }}
                />
              )}
              <span
                className="text-sm font-medium"
                style={{
                  color: scanned ? t.muted : t.text,
                  textDecoration: scanned ? "line-through" : "none",
                }}
              >
                {booth.boothName}
              </span>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded-full shrink-0 whitespace-nowrap"
              style={
                scanned
                  ? { background: "rgba(0,214,143,0.1)", color: "#00D68F" }
                  : { background: t.primaryBg, color: t.primary }
              }
            >
              +{booth.points} pts
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** Event details card */
const CampaignHeader = ({ campaign }) => {
  const t = useVT();
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: t.card, border: `1px solid ${t.primaryBorder}` }}
    >
      <h1 className="text-lg font-bold leading-tight" style={{ color: t.text }}>
        {campaign.campaignName}
      </h1>
      <div className="mt-3 space-y-2">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: t.muted }}
        >
          <Calendar size={14} className="text-[#F5A623]" />
          <span>
            {formatDateTime(campaign.startDate, DATE_FORMATS.DATE)} –{" "}
            {formatDateTime(campaign.endDate, DATE_FORMATS.DATE)}
          </span>
        </div>
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: t.muted }}
        >
          <Zap size={14} style={{ color: t.primary }} />
          <span>Threshold: {campaign.thresholdPoints} pts</span>
        </div>
      </div>
      {campaign.description && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: t.muted }}>
          {campaign.description}
        </p>
      )}
    </div>
  );
};

/** Camera QR scanner using jsQR + canvas */
const CameraScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      // getUserMedia requires HTTPS or localhost
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera not available. Make sure this page is opened over HTTPS or on localhost.",
        );
        return;
      }

      const tryGetStream = async () => {
        // First try rear camera; fall back to any camera if constraint fails
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
        } catch {
          return await navigator.mediaDevices.getUserMedia({ video: true });
        }
      };

      try {
        const stream = await tryGetStream();
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
        }
      } catch (err) {
        const name = err?.name ?? "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError(
            "Camera permission denied. Please allow camera access in your browser settings and try again.",
          );
        } else if (
          name === "NotFoundError" ||
          name === "DevicesNotFoundError"
        ) {
          setError("No camera found on this device.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setError(
            "Camera is already in use by another app. Close it and try again.",
          );
        } else if (name === "OverconstrainedError") {
          setError(
            "No suitable camera found. Please try on a device with a camera.",
          );
        } else {
          setError(
            `Camera error: ${err?.message || "Unknown error"}. Try reloading the page.`,
          );
        }
      }
    };

    startCamera();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [stopCamera, retryKey]);

  useEffect(() => {
    if (!scanning) return;

    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { default: jsQR } = await import("jsqr");
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        stopCamera();
        onScan(code.data);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scanning, onScan, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <span className="font-bold">Scan Booth QR</span>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          aria-label="Close scanner"
        >
          <X size={24} />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#E94560]/10 flex items-center justify-center">
            <Camera size={26} className="text-[#E94560]" />
          </div>
          <p className="text-white text-sm font-semibold">Camera Unavailable</p>
          <p className="text-[#8892A4] text-xs leading-relaxed max-w-xs">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              setScanning(false);
              setRetryKey((k) => k + 1);
            }}
            className="mt-1 px-5 py-2.5 bg-[#E94560] text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-[#E94560] rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#E94560] rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#E94560] rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#E94560] rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#E94560] rounded-br-xl" />
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <p className="text-center text-[#8892A4] text-xs py-4 px-8">
        Point your camera at the booth QR code.
      </p>
    </div>
  );
};

/** Inline SVG icons for social platforms */
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const ViberIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M11.4 1.1C7.4.5 3.9 2.6 2.5 6.1c-.5 1.3-.6 2.7-.3 4.2.4 2.4 1.8 4.5 3.8 5.9l.3 4.2 3.3-2.2c.6.1 1.1.1 1.7.1 5.2 0 9.5-3.8 9.5-8.5S16.6 1.1 11.4 1.1zm4.5 11.1c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.2.3-4-1.3-3.3-1.8-5.4-5.2-5.6-5.5-.1-.3-.9-1.3-.9-2.4s.6-1.7 1-2.1c.3-.3.7-.4 1-.4s.5 0 .7.1c.2 0 .5.1.7.6l.9 2.2c.1.3.2.7 0 1L7 7c-.2.3-.4.5-.3.8.6 1.1 1.4 2 2.3 2.7 1 .7 2.1 1.2 3.3 1.5.4.1.6 0 .9-.3l.5-.7c.3-.4.6-.3 1-.2l2 .9c.2.1.4.2.5.4.1.3 0 1-.6 1.8z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

/** Share panel */
const SharePanel = ({ eventTag }) => {
  const t = useVT();
  const url = `${APP_BASE_URL}/${eventTag}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Scan to Win!", url });
    } else {
      copyLink();
    }
  };

  const socials = [
    {
      label: "Facebook",
      icon: <FacebookIcon />,
      bg: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "X (Twitter)",
      icon: <XIcon />,
      bg: "#14171A",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Join+me+at+Worldbex+Scan+to+Win!`,
    },
    {
      label: "Viber",
      icon: <ViberIcon />,
      bg: "#7360F2",
      url: `viber://forward?text=${encodeURIComponent(url)}`,
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      bg: "#25D366",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent("Join me at Worldbex Scan to Win! " + url)}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-black text-xl" style={{ color: t.text }}>
          Invite Friends
        </h2>
        <p className="text-sm mt-1" style={{ color: t.muted }}>
          Share this event and let others join the fun!
        </p>
      </div>

      {/* URL row */}
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{ background: t.card, border: `1px solid ${t.primaryBorder}` }}
      >
        <span className="flex-1 text-xs truncate" style={{ color: t.muted }}>
          {url}
        </span>
        <button
          onClick={copyLink}
          className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
          style={
            copied
              ? { background: "rgba(0,214,143,0.2)", color: "#00D68F" }
              : { background: t.primaryBg, color: t.primary }
          }
          aria-label="Copy event link"
        >
          <Copy size={12} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Native share button */}
      <button
        onClick={shareNative}
        className="w-full flex items-center justify-center gap-3 text-white rounded-2xl py-4 font-bold text-base shadow-lg active:scale-95 transition-transform"
        style={{
          background: `linear-gradient(to right, ${t.primary}, #F5A623)`,
        }}
        aria-label="Share event"
      >
        <Share2 size={20} />
        Share This Event
      </button>

      {/* Social platforms */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: t.muted }}
        >
          Share on
        </p>
        <div className="grid grid-cols-2 gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl px-4 py-4 active:scale-95 transition-transform no-underline"
              style={{
                background: s.bg,
                color: "white",
                textDecoration: "none",
              }}
              aria-label={`Share on ${s.label}`}
            >
              <span className="shrink-0">{s.icon}</span>
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: "white" }}
              >
                {s.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Venue image maps */
const VITE_BASEURL_APP = import.meta.env.VITE_BASEURL_APP;

const downloadImage = async (src, filename) => {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, "_blank");
  }
};

const ImageMapsView = ({ campaignId }) => {
  const t = useVT();
  const { data, isLoading } = useGetCampaignImagesPublic(campaignId);
  const sites = data?.data?.imageSites ?? [];
  const [lightbox, setLightbox] = useState(null); // { src, alt, filename }

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2
          className="animate-spin"
          style={{ color: t.primary }}
          size={28}
        />
      </div>
    );

  if (sites.length === 0)
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center"
        style={{ background: t.card, border: `1px solid ${t.primaryBorder}` }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: t.primaryBg }}
        >
          <MapPin size={28} style={{ color: t.primary }} />
        </div>
        <p className="font-bold" style={{ color: t.text }}>
          No maps yet
        </p>
        <p className="text-xs mt-1" style={{ color: t.muted }}>
          Ask event staff for a printed venue map.
        </p>
      </div>
    );

  return (
    <>
      <div className="space-y-5">
        {sites.map((site) => {
          const activeImages = site.images.filter(
            (img) => img.isActive === 1 || img.isActive === true,
          );
          if (!activeImages.length) return null;
          const showCode = site.siteCode !== site.siteName;

          return (
            <div key={site.siteCode}>
              {/* Site header */}
              <div
                className="flex items-center gap-3 mb-3 pb-2"
                style={{ borderBottom: `2px solid ${t.cardBorder}` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: t.primaryBg }}
                >
                  <MapPin size={16} style={{ color: t.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-base leading-tight truncate"
                    style={{ color: t.text }}
                  >
                    {site.siteName}
                  </div>
                  {showCode ? (
                    <div
                      className="text-[10px] font-mono mt-0.5 leading-none"
                      style={{ color: t.muted }}
                    >
                      {site.siteCode} &middot; {activeImages.length} map{activeImages.length !== 1 ? "s" : ""}
                    </div>
                  ) : (
                    <div
                      className="text-[10px] font-mono mt-0.5 leading-none"
                      style={{ color: t.muted }}
                    >
                      {activeImages.length} map{activeImages.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                {showCode ? (
                  <span
                    className="text-[10px] font-mono font-bold rounded-lg px-2 py-1 leading-none shrink-0"
                    style={{
                      color: t.primary,
                      background: t.primaryBg,
                    }}
                  >
                    {site.siteCode}
                  </span>
                ) : null}
              </div>

              {/* Image cards */}
              <div className="space-y-3">
                {activeImages.map((img) => {
                  const src = `/${img.imageUrl}`;
                  const ext = img.imageUrl.split(".").pop() || "jpg";
                  const filename = `${site.siteCode}.${ext}`;
                  return (
                    <div
                      key={img.id}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background: t.card,
                        border: `1px solid ${t.cardBorder}`,
                      }}
                    >
                      {/* Image */}
                      <img
                        src={src}
                        alt={img.altText || site.siteName}
                        className="w-full object-contain block"
                        onError={(e) => {
                          e.currentTarget.closest(
                            ".rounded-2xl",
                          ).style.display = "none";
                        }}
                      />

                      {/* Action bar */}
                      <div
                        className="flex items-center justify-between px-3 py-2.5 gap-2"
                        style={{ borderTop: `1px solid ${t.cardBorder}` }}
                      >
                        <p
                          className="text-xs truncate flex-1"
                          style={{ color: t.muted }}
                        >
                          {img.altText || site.siteName}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              setLightbox({
                                src,
                                alt: img.altText || site.siteName,
                                filename,
                              })
                            }
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
                            style={{ background: t.deeper, color: t.muted }}
                            aria-label="View fullscreen"
                          >
                            <Maximize2 size={11} />
                            View
                          </button>
                          <button
                            onClick={() => downloadImage(src, filename)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
                            style={{
                              background: t.primaryBg,
                              color: t.primary,
                            }}
                            aria-label="Save image"
                          >
                            <Download size={11} />
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "#000" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white text-sm font-semibold truncate flex-1 mr-3">
                {lightbox.alt}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(lightbox.src, lightbox.filename)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold active:scale-95 transition-transform"
                  style={{ background: "#E94560", color: "#fff" }}
                  aria-label="Save image"
                >
                  <Download size={13} />
                  Save
                </button>
                <button
                  onClick={() => setLightbox(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                  aria-label="Close"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Image — supports pinch-zoom natively on mobile */}
            <div
              className="flex-1 flex items-center justify-center overflow-auto p-4"
              onClick={() => setLightbox(null)}
            >
              <img
                src={lightbox.src}
                alt={lightbox.alt}
                className="max-w-full max-h-full object-contain"
                style={{ touchAction: "pinch-zoom" }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Upcoming Worldbex events */
const REGISTER_URL = "https://register.worldbexevents.com/";

const EventDetailModal = ({ event, onClose }) => {
  const t = useVT();
  const from = event.dateFrom
    ? new Date(event.dateFrom).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const to = event.dateTo
    ? new Date(event.dateTo).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 140, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 140, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: t.card }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover image */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: 200, background: t.primary }}
        >
          <img
            src={`${VITE_BASEURL_APP}${event.imgSrc}`}
            alt={event.name}
            className="h-full w-full object-contain p-6 mb-6"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={16} className="text-white" />
          </button>
          <span className="absolute bottom-3 left-4 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-white/10 text-white border border-white/10">
            {event.eventName}
          </span>
        </div>

        <div className="p-5 space-y-3">
          <h2
            className="font-black text-lg leading-snug"
            style={{ color: t.text }}
          >
            {event.name}
          </h2>

          {/* Date */}
          <div
            className="flex items-start gap-3 rounded-xl px-3 py-3"
            style={{ background: t.deeper }}
          >
            <Calendar
              size={14}
              className="shrink-0 mt-0.5"
              style={{ color: t.muted }}
            />
            <div>
              <p className="text-sm font-bold" style={{ color: t.text }}>
                {event.date}
              </p>
              {from && to && (
                <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                  {from} — {to}
                </p>
              )}
            </div>
          </div>

          {/* Scan to Win info */}
          <div
            className="flex items-start gap-3 rounded-xl px-3 py-3"
            style={{ background: t.deeper }}
          >
            <Zap
              size={14}
              className="shrink-0 mt-0.5"
              style={{ color: t.muted }}
            />
            <p className="text-xs leading-relaxed" style={{ color: t.muted }}>
              Scan exhibitor booths, collect points, and qualify for the raffle
              draw at this event.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-2xl py-3 text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: t.primary, color: "white" }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UpcomingEvents = () => {
  const t = useVT();
  const { data: events, isLoading } = useGetEventsList();
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div>
      {/* Sticky register CTA */}
      <div
        className="sticky top-13 z-20 -mx-4 px-4 pt-1 pb-3"
        style={{ background: t.bg }}
      >
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "none",
            background: t.card,
            border: `1px solid ${t.primaryBorder}`,
          }}
          className="flex items-center gap-3 rounded-2xl p-4 active:scale-[0.98] transition-transform"
          aria-label="Register or Login to Worldbex Events"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: t.primaryBg }}
          >
            <Star size={18} style={{ color: t.primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-black text-sm leading-tight"
              style={{ color: t.text }}
            >
              Register / Login
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: t.muted }}>
              worldbexevents.com — access all events
            </p>
          </div>
          <div
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: t.primary }}
          >
            <ChevronRight size={15} className="text-white" />
          </div>
        </a>
      </div>

      <div className="mb-4 mt-2">
        <h2 className="font-black text-xl" style={{ color: t.text }}>
          Upcoming Events
        </h2>
        <p className="text-sm mt-1" style={{ color: t.muted }}>
          Scan. Collect points. Win prizes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="animate-spin"
            style={{ color: t.primary }}
            size={28}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {(events ?? []).map((ev) => (
            <button
              key={ev.eventId}
              onClick={() => setSelectedEvent(ev)}
              className="w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
              style={{
                background: t.card,
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div className="p-3.5 flex items-center gap-3">
                <div
                  className="w-11 h-11 p-1 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: t.primary }}
                >
                  <img
                    src={`${VITE_BASEURL_APP}${ev.imgSrc}`}
                    alt={ev.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-semibold leading-snug flex-1"
                      style={{ color: t.text }}
                    >
                      {ev.name}
                    </p>
                    <span
                      className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ml-1"
                      style={{
                        background: t.deeper,
                        color: t.muted,
                        border: `1px solid ${t.cardBorder}`,
                      }}
                    >
                      {ev.eventName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Calendar size={11} style={{ color: t.muted }} />
                    <span className="text-xs" style={{ color: t.muted }}>
                      {ev.date}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="shrink-0"
                  style={{ color: t.muted, opacity: 0.5 }}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/** Generic error modal */
const ErrorModal = ({ message, onClose }) => {
  const t = useVT();
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: t.card }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(233,69,96,0.1)" }}
        >
          <X size={32} className="text-[#E94560]" />
        </div>
        <h2 className="font-bold text-lg mb-2" style={{ color: t.text }}>
          Oops!
        </h2>
        <p className="text-sm mb-5" style={{ color: t.muted }}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full text-white rounded-xl py-3 font-bold"
          style={{ background: "#E94560" }}
          aria-label="Dismiss error"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
};

/** Success modal after scanning a booth */
const SuccessModal = ({ points, totalPoints, threshold, onClose }) => {
  const t = useVT();
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: t.card }}
      >
        <div className="w-16 h-16 rounded-full bg-[#00D68F]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-[#00D68F]" />
        </div>
        <h2 className="font-bold text-lg mb-1" style={{ color: t.text }}>
          Points Earned!
        </h2>
        <div className="text-5xl font-black text-[#F5A623] my-3">+{points}</div>
        <p className="text-sm mb-1" style={{ color: t.muted }}>
          Running total:{" "}
          <span className="font-semibold" style={{ color: t.text }}>
            {totalPoints}
          </span>{" "}
          / {threshold} pts
        </p>
        <button
          onClick={onClose}
          className="w-full mt-5 bg-[#00D68F] text-white rounded-xl py-3 font-bold"
          aria-label="Dismiss success"
        >
          Keep Scanning!
        </button>
      </motion.div>
    </div>
  );
};

/** First-ever scan modal — shown when scannedCodes was empty before this scan */
const FirstScanModal = ({
  booth,
  points,
  bonus,
  totalPoints,
  threshold,
  campaignName,
  onClose,
}) => {
  useEffect(() => {
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.55 },
      colors: ["#E94560", "#F5A623", "#00D68F", "#7360F2", "#4096ff"],
    });
  }, []);

  const t = useVT();
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
      <motion.div
        initial={{ y: 120, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden text-center"
        style={{ background: t.card }}
      >
        {/* Top gradient banner */}
        <div
          className="px-6 pt-8 pb-6"
          style={{
            background: `linear-gradient(160deg, ${t.primary}22 0%, #7360F215 100%)`,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: `linear-gradient(135deg, ${t.primary}, #F5A623)`,
            }}
          >
            <Zap size={36} className="text-white" />
          </motion.div>
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">
            Welcome to the Event!
          </p>
          <h2
            className="font-black text-xl leading-tight"
            style={{ color: t.text }}
          >
            First Scan Unlocked!
          </h2>
          <p className="text-xs mt-1" style={{ color: t.muted }}>
            {campaignName}
          </p>
        </div>

        {/* Booth + Points */}
        <div className="px-6 py-5 space-y-3">
          {/* Booth name */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{ background: t.deeper }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#4096ff20" }}
            >
              <ScanLine size={16} className="text-[#4096ff]" />
            </div>
            <div>
              <p className="text-xs" style={{ color: t.muted }}>
                Booth scanned
              </p>
              <p className="font-bold text-sm" style={{ color: t.text }}>
                {booth.boothName}
              </p>
            </div>
          </div>

          {/* Points breakdown */}
          <div
            className="rounded-2xl px-4 py-4 space-y-2"
            style={{ background: t.deeper }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: t.muted }}>
                Booth points
              </span>
              <span className="font-bold text-sm" style={{ color: t.text }}>
                +{points} pts
              </span>
            </div>
            {bonus > 0 && (
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#F5A623" }}
                >
                  🎁 1st scan bonus
                </span>
                <span
                  className="font-bold text-sm"
                  style={{ color: "#F5A623" }}
                >
                  +{bonus} pts
                </span>
              </div>
            )}
            <div
              className="flex items-center justify-between pt-2"
              style={{ borderTop: `1px solid ${t.divider}` }}
            >
              <span className="text-xs" style={{ color: t.muted }}>
                Your total
              </span>
              <span className="font-black text-lg" style={{ color: "#00D68F" }}>
                {totalPoints} / {threshold} pts
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white"
            style={{
              background: `linear-gradient(135deg, ${t.primary}, #F5A623)`,
            }}
            aria-label="Continue scanning"
          >
            Let's Keep Scanning!
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Goal modal — two phases:
 *   "form"  → collect optional participant info + call generate-raffle-qr API
 *   "qr"    → display server-returned encryptedQr
 */
const GoalModal = ({
  entry,
  campaignId,
  boothCodes,
  onClose,
  onQrGenerated,
}) => {
  const [phase, setPhase] = useState(entry.encryptedQr ? "qr" : "form");
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
  });
  const [encryptedQr, setEncryptedQr] = useState(entry.encryptedQr ?? null);
  const [validationError, setValidationError] = useState(null);
  const { mutateAsync: generateQr, isPending, error } = useGenerateRaffleQr();

  useEffect(() => {
    if (phase === "qr") {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#E94560", "#F5A623", "#00D68F", "#FFFFFF"],
      });
    }
  }, [phase]);

  const handleGenerate = async () => {
    if (!form.fullName.trim()) {
      setValidationError("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setValidationError("Email address is required.");
      return;
    }
    setValidationError(null);
    const participantInfo = {
      participantCode: entry.participantCode,
      ...(form.fullName.trim() && { fullName: form.fullName.trim() }),
      ...(form.mobileNumber.trim() && {
        mobileNumber: form.mobileNumber.trim(),
      }),
      ...(form.email.trim() && { email: form.email.trim() }),
    };

    try {
      const res = await generateQr({ campaignId, boothCodes, participantInfo });
      const qr = res.data.encryptedQr;
      setEncryptedQr(qr);
      onQrGenerated(qr, res.data.raffleQrId);
      setPhase("qr");
    } catch {
      // error shown via `error` state
    }
  };

  const t = useVT();

  if (phase === "form") {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm rounded-3xl p-6 my-auto"
          style={{ background: t.card }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6 }}
            className="text-4xl text-center mb-3"
            aria-hidden
          >
            🎉
          </motion.div>
          <h2
            className="font-black text-xl text-center mb-1"
            style={{ color: t.text }}
          >
            Threshold Reached!
          </h2>
          <p className="text-sm text-center mb-5" style={{ color: t.muted }}>
            Fill in your details and generate your raffle QR code.
          </p>

          <div className="space-y-3 mb-4">
            {[
              {
                value: form.fullName,
                field: "fullName",
                placeholder: "Full name",
                type: "text",
                required: true,
              },
              {
                value: form.mobileNumber,
                field: "mobileNumber",
                placeholder: "Mobile number",
                type: "tel",
                required: true,
              },
              {
                value: form.email,
                field: "email",
                placeholder: "Email address",
                type: "email",
                required: true,
              },
            ].map(({ value, field, placeholder, type, required }) => (
              <input
                key={field}
                value={value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [field]: e.target.value }))
                }
                placeholder={placeholder}
                type={type}
                required={required}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: t.deeper,
                  border: `1px solid ${t.primaryBorder}`,
                  color: t.text,
                }}
              />
            ))}
          </div>

          {(validationError || error) && (
            <p className="text-[#E94560] text-xs text-center mb-3">
              {validationError ||
                error?.message ||
                "Failed to generate QR. Please try again."}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: t.primary }}
            aria-label="Generate raffle QR"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Generate Raffle QR <ChevronRight size={18} />
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 text-sm py-2"
            style={{ color: t.muted }}
            aria-label="Close"
          >
            Later
          </button>
        </motion.div>
      </div>
    );
  }

  // phase === "qr"
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full max-w-sm rounded-3xl p-6 text-center my-auto"
        style={{ background: t.card }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl mb-3"
          aria-hidden
        >
          🎉
        </motion.div>
        <h2 className="font-black text-xl mb-1" style={{ color: t.text }}>
          You're In!
        </h2>
        <p className="text-sm mb-4" style={{ color: t.muted }}>
          Show this QR code at the raffle station to spin the wheel.
        </p>

        <div className="bg-white rounded-2xl p-4 inline-block mb-4">
          <QRCodeSVG value={encryptedQr} size={180} level="H" />
        </div>

        <p className="text-xs mb-5" style={{ color: t.muted }}>
          This QR code is unique to you. Do not share it.
        </p>
        <button
          onClick={onClose}
          className="w-full text-white rounded-xl py-3 font-bold"
          style={{ background: t.primary }}
          aria-label="Done"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
};

// ─── Main Visitor App ─────────────────────────────────────────────────────────

const VisitorApp = () => {
  const { eventTag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();


  // ── Theme ──
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem(THEME_KEY) === "dark",
  );
  const t = isDark ? DARK : LIGHT;
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  // ── Event data ──
  const {
    data: campaignData,
    isLoading: campaignLoading,
    isError: campaignError,
  } = useGetCampaignByEventTag(eventTag);

  const campaign = campaignData?.data?.campaign ?? null;
  const booths = campaignData?.data?.booths ?? [];
  const thresholdPoints = campaignData?.data?.thresholdPoints ?? 0;

  // ── Dynamic page title + OG meta ──
  useEffect(() => {
    if (!campaign) return;
    const title = `${campaign.campaignName} | Scan2Win`;
    const desc =
      campaign.description || "Scan booths, collect points, and win prizes!";
    const setMeta = (attr, key, content) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    document.title = title;
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("name", "description", desc);
    return () => {
      document.title = "Worldbex Scan2Win";
    };
  }, [campaign]);

  // ── Local entry (tracks scanned booth codes + progress) ──
  const [entry, setEntry] = useState(null);
  const [modal, setModal] = useState(null); // { type: "error"|"success"|"goal", ... }
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const urlScanProcessed = useRef(false);
  const GUIDE_SEEN_KEY = "qrquest_guide_seen";

  // ── Derived ──
  const scannedCodes = entry?.scannedCodes ?? [];
  const currentPoints = entry?.currentPoints ?? 0;

  // ── Reset progress ──
  const handleReset = () => {
    localStorage.removeItem(entryKey(campaign.eventTag));
    const freshEntry = {
      participantCode: uuidv4(),
      eventTag: campaign.eventTag,
      campaignId: campaign.id,
      thresholdPoints: campaign.thresholdPoints,
      scannedCodes: [],
      currentPoints: 0,
      encryptedQr: null,
      raffleQrId: null,
    };
    saveEntry(freshEntry);
    setEntry(freshEntry);
    setShowResetConfirm(false);
  };

  // ── Init / sync entry with event on load ──
  useEffect(() => {
    if (!campaign) return;

    const existing = loadEntry(campaign.eventTag);
    if (existing) {
      setEntry(existing);
    } else {
      const newEntry = {
        participantCode: uuidv4(),
        eventTag: campaign.eventTag,
        campaignId: campaign.id,
        thresholdPoints: campaign.thresholdPoints,
        scannedCodes: [],
        currentPoints: 0,
        encryptedQr: null,
        raffleQrId: null,
      };
      saveEntry(newEntry);
      setEntry(newEntry);
      // Show guide automatically on first visit
      if (!localStorage.getItem(GUIDE_SEEN_KEY)) {
        setShowGuide(true);
      }
    }
  }, [campaign]);

  // ── Core scan logic ──
  const processScan = useCallback(
    (
      boothCode,
      currentEntry,
      currentBooths,
      currentThreshold,
      firstScanBonus = 0,
    ) => {
      const booth = currentBooths.find((b) => b.boothCode === boothCode);

      if (!booth) {
        setModal({
          type: "error",
          message: "Invalid QR code. This booth is not part of the event.",
        });
        return;
      }

      if (currentEntry.scannedCodes.includes(boothCode)) {
        setModal({
          type: "error",
          message: "You have already scanned this booth.",
        });
        return;
      }

      if (
        booth.maxScanPerUser > 0 &&
        currentEntry.scannedCodes.filter((c) => c === boothCode).length >=
          booth.maxScanPerUser
      ) {
        setModal({
          type: "error",
          message: "Maximum scans reached for this booth.",
        });
        return;
      }

      const isFirstScan = currentEntry.scannedCodes.length === 0;
      const bonus = isFirstScan ? (firstScanBonus ?? 0) : 0;
      const updatedCodes = [...currentEntry.scannedCodes, boothCode];
      const updatedPoints = currentEntry.currentPoints + booth.points + bonus;
      const updatedEntry = {
        ...currentEntry,
        scannedCodes: updatedCodes,
        currentPoints: updatedPoints,
      };
      saveEntry(updatedEntry);
      setEntry(updatedEntry);

      if (updatedPoints >= currentThreshold) {
        setModal({ type: "goal" });
      } else if (isFirstScan) {
        setModal({
          type: "firstScan",
          booth,
          points: booth.points,
          bonus,
          totalPoints: updatedPoints,
        });
      } else {
        setModal({
          type: "success",
          points: booth.points,
          totalPoints: updatedPoints,
        });
      }
    },
    [],
  );

  // ── URL param scan (e.g. /mias?i=BOOTH-HONDA-01&p=100) ──
  useEffect(() => {
    const boothCode = searchParams.get("i");
    if (!boothCode || !entry || !booths.length || urlScanProcessed.current)
      return;
    urlScanProcessed.current = true;
    setSearchParams({}, { replace: true });
    setActiveTab("scan");
    processScan(
      boothCode,
      entry,
      booths,
      thresholdPoints,
      campaign?.firstScanBonus ?? 0,
    );
  }, [
    searchParams,
    entry,
    booths,
    thresholdPoints,
    processScan,
    setSearchParams,
  ]);

  // ── Camera scan handler ──
  const handleCameraScan = useCallback(
    (decoded) => {
      setShowScanner(false);
      if (!entry || !booths.length) return;

      // Parse URL format: {baseUrl}/{eventTag}?i={boothCode}&p={points}
      let boothCode = decoded.trim();
      try {
        const parsed = new URL(decoded.trim());
        const iParam = parsed.searchParams.get("i");
        if (iParam) boothCode = iParam;
      } catch {
        // not a URL — use raw value as boothCode
      }

      processScan(
        boothCode,
        entry,
        booths,
        thresholdPoints,
        campaign?.firstScanBonus ?? 0,
      );
    },
    [entry, booths, thresholdPoints, processScan, campaign],
  );

  // ── QR generated callback ──
  const handleQrGenerated = useCallback(
    (encryptedQr, raffleQrId) => {
      const updatedEntry = { ...entry, encryptedQr, raffleQrId };
      saveEntry(updatedEntry);
      setEntry(updatedEntry);
    },
    [entry],
  );

  // ── Loading / error screens ──
  if (campaignLoading) {
    return (
      <ThemeContext.Provider value={t}>
        <div
          className="md:hidden flex items-center justify-center h-screen"
          style={{ background: t.bg }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-t-transparent rounded-full"
            style={{ borderColor: t.primary, borderTopColor: "transparent" }}
          />
        </div>
      </ThemeContext.Provider>
    );
  }

  if (campaignError || !campaign) {
    return (
      <ThemeContext.Provider value={t}>
        <div
          className="md:hidden flex flex-col items-center justify-center h-screen px-8 text-center"
          style={{ background: t.bg }}
        >
          <X size={40} className="text-[#E94560] mb-4" />
          <h2 className="font-bold text-lg mb-2" style={{ color: t.text }}>
            Event Not Found
          </h2>
          <p className="text-sm" style={{ color: t.muted }}>
            No active event found for{" "}
            <span className="font-semibold" style={{ color: t.text }}>
              {eventTag}
            </span>
            .
          </p>
        </div>
      </ThemeContext.Provider>
    );
  }

  // ── Tab content ──
  const renderTab = () => {
    const unscannedBooths = booths.filter(
      (b) => !scannedCodes.includes(b.boothCode),
    );
    const progressPct =
      thresholdPoints > 0
        ? Math.min((currentPoints / thresholdPoints) * 100, 100)
        : 0;
    const isQualified = currentPoints >= thresholdPoints;

    switch (activeTab) {
      case "home":
        return (
          <div className="pb-24">
            {/* ── Hero ── */}
            <div className="relative">
              {campaign.bannerUrl ? (
                <img
                  src={campaign.bannerUrl}
                  alt={campaign.campaignName}
                  className="w-full object-cover h-44"
                />
              ) : (
                <div
                  className="w-full h-44 flex flex-col items-center justify-center gap-1"
                  style={{
                    background: `linear-gradient(135deg, ${t.primary} 0%, #F5A623 100%)`,
                  }}
                >
                  <QrCode size={44} className="text-white opacity-90" />
                  <span className="text-white text-[11px] font-bold tracking-widest uppercase opacity-75">
                    Scan to Win
                  </span>
                </div>
              )}
              {isQualified && (
                <span
                  className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full shadow"
                  style={{ background: "#00D68F", color: "#fff" }}
                >
                  ✓ Qualified
                </span>
              )}
            </div>

            {/* ── Event info ── */}
            <div className="px-4 pt-4 pb-2">
              <h1
                className="text-xl font-black leading-tight"
                style={{ color: t.text }}
              >
                {campaign.campaignName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: t.muted }}
                >
                  <Calendar size={12} className="text-[#F5A623]" />
                  {formatDateTime(campaign.startDate, DATE_FORMATS.DATE)} –{" "}
                  {formatDateTime(campaign.endDate, DATE_FORMATS.DATE)}
                </span>
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: t.muted }}
                >
                  <MapPin size={12} style={{ color: t.primary }} />
                  {booths.length} booths
                </span>
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: t.muted }}
                >
                  <Trophy size={12} className="text-[#00D68F]" />
                  {thresholdPoints} pts to qualify
                </span>
                {campaign.firstScanBonus > 0 && (
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: t.muted }}
                  >
                    <Zap size={12} style={{ color: t.primary }} />+
                    {campaign.firstScanBonus} first-scan bonus
                  </span>
                )}
              </div>
              {campaign.description && (
                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{ color: t.muted }}
                >
                  {campaign.description}
                </p>
              )}
            </div>

            <div className="px-4 space-y-4 pt-2">
              {/* ── Progress (after first scan) ── */}
              {currentPoints > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: t.card,
                    border: `1px solid ${t.divider}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: t.text }}
                    >
                      Your Progress
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isQualified ? "#00D68F" : t.primary }}
                    >
                      {isQualified
                        ? "Goal reached!"
                        : `${currentPoints} / ${thresholdPoints} pts`}
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2"
                    style={{ background: t.progressTrack }}
                  >
                    <motion.div
                      className="h-2 rounded-full"
                      style={{
                        background: `linear-gradient(to right, ${t.primary}, #F5A623)`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div
                    className="mt-3 flex items-center justify-between text-xs"
                    style={{ color: t.muted }}
                  >
                    <span>
                      <strong style={{ color: t.primary }}>
                        {scannedCodes.length}
                      </strong>{" "}
                      booths scanned
                    </span>
                    <span>
                      <strong style={{ color: "#F5A623" }}>
                        {currentPoints}
                      </strong>{" "}
                      pts earned
                    </span>
                    <span>
                      {isQualified ? (
                        <strong style={{ color: "#00D68F" }}>
                          qualified ✓
                        </strong>
                      ) : (
                        <>
                          <strong style={{ color: t.text }}>
                            {thresholdPoints - currentPoints}
                          </strong>{" "}
                          pts to go
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("scan")}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform"
                    style={{ background: t.primaryBg, color: t.primary }}
                  >
                    {isQualified ? (
                      <>
                        <Gift size={14} /> Generate Raffle QR
                      </>
                    ) : (
                      <>
                        <ScanLine size={14} /> Continue Scanning
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ── Stats row (first visit) ── */}
              {currentPoints === 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Booths", value: booths.length, color: t.primary },
                    {
                      label: "Pts Goal",
                      value: thresholdPoints,
                      color: "#F5A623",
                    },
                    {
                      label: "1st Bonus",
                      value: `+${campaign.firstScanBonus ?? 0}`,
                      color: "#00D68F",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-xl py-3 text-center"
                      style={{
                        background: t.card,
                        border: `1px solid ${t.divider}`,
                      }}
                    >
                      <p className="text-lg font-black" style={{ color }}>
                        {value}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: t.muted }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── How to Play ── */}
              <div
                className="rounded-2xl p-4"
                style={{ background: t.card, border: `1px solid ${t.divider}` }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: t.muted }}
                >
                  How to Play
                </p>
                <div className="space-y-0">
                  {[
                    {
                      step: "1",
                      color: t.primary,
                      title: "Scan Booth QRs",
                      desc: "Visit participating booths and scan their QR codes via camera or URL link.",
                    },
                    {
                      step: "2",
                      color: "#F5A623",
                      title: "Collect Points",
                      desc: `Each booth awards different points. Reach ${thresholdPoints} pts to qualify.${campaign.firstScanBonus > 0 ? ` First scan gives +${campaign.firstScanBonus} bonus!` : ""}`,
                    },
                    {
                      step: "3",
                      color: "#A855F7",
                      title: "Generate Raffle QR",
                      desc: "Once you hit the goal, enter your info and get your unique encrypted raffle ticket.",
                    },
                    {
                      step: "4",
                      color: "#00D68F",
                      title: "Present & Win",
                      desc: "Show your raffle QR at the prize booth. Staff scans it and enters you in the draw.",
                    },
                  ].map(({ step, color, title, desc }, i, arr) => (
                    <div key={step} className="flex gap-3">
                      <div className="shrink-0 flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black mt-0.5"
                          style={{ background: `${color}20`, color }}
                        >
                          {step}
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className="w-px flex-1 my-1"
                            style={{ background: t.divider }}
                          />
                        )}
                      </div>
                      <div className="pb-4 last:pb-0 flex-1">
                        <p
                          className="text-sm font-bold"
                          style={{ color: t.text }}
                        >
                          {title}
                        </p>
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: t.muted }}
                        >
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Features grid ── */}
              <div
                className="rounded-2xl p-4"
                style={{ background: t.card, border: `1px solid ${t.divider}` }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: t.muted }}
                >
                  App Features
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      icon: <Camera size={14} />,
                      color: t.primary,
                      label: "Camera Scanner",
                    },
                    {
                      icon: <ScanLine size={14} />,
                      color: "#F5A623",
                      label: "URL Auto-Scan",
                    },
                    {
                      icon: <QrCode size={14} />,
                      color: "#A855F7",
                      label: "Raffle QR",
                    },
                    {
                      icon: <MapPin size={14} />,
                      color: "#00D68F",
                      label: "Venue Map",
                    },
                    {
                      icon: <Share2 size={14} />,
                      color: "#EC4899",
                      label: "Share & Invite",
                    },
                    {
                      icon: <RotateCcw size={14} />,
                      color: t.muted,
                      label: "Progress Saved",
                    },
                  ].map(({ icon, color, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{ background: t.deeper }}
                    >
                      <span style={{ color }}>{icon}</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: t.text }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Booth preview ── */}
              {unscannedBooths.length > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: t.card,
                    border: `1px solid ${t.divider}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: t.muted }}
                    >
                      {scannedCodes.length === 0 ? "Booths" : "Still to Scan"}
                    </p>
                    <button
                      onClick={() => setActiveTab("scan")}
                      className="flex items-center gap-0.5 text-xs font-semibold active:opacity-70"
                      style={{ color: t.primary }}
                    >
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {unscannedBooths.slice(0, 4).map((booth) => (
                      <div
                        key={booth.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: t.deeper }}
                      >
                        <span className="text-xs" style={{ color: t.text }}>
                          {booth.boothName}
                        </span>
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: t.primary }}
                        >
                          +{booth.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                  {unscannedBooths.length > 4 && (
                    <button
                      onClick={() => setActiveTab("scan")}
                      className="mt-2 w-full text-center text-xs py-1.5 rounded-xl font-semibold"
                      style={{ color: t.muted }}
                    >
                      +{unscannedBooths.length - 4} more
                    </button>
                  )}
                </div>
              )}

              {/* ── CTA ── */}
              <button
                onClick={() => setActiveTab("scan")}
                className="w-full flex items-center justify-center gap-2 text-white rounded-2xl py-4 text-base font-black shadow-lg active:scale-95 transition-transform"
                style={{
                  background: isQualified
                    ? "linear-gradient(to right, #00D68F, #F5A623)"
                    : `linear-gradient(to right, ${t.primary}, #F5A623)`,
                }}
              >
                {isQualified ? (
                  <>
                    <Gift size={20} /> View My Raffle QR
                  </>
                ) : (
                  <>
                    <ScanLine size={20} /> Start Scanning
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "scan":
        return (
          <div className="space-y-5 px-4 pb-24 pt-4">
            <GoalProgress points={currentPoints} threshold={thresholdPoints} />

            {/* Show "Generate QR" if threshold reached, else show scan button */}
            {currentPoints >= thresholdPoints ? (
              <button
                onClick={() => setModal({ type: "goal" })}
                className="w-full flex items-center justify-center gap-3 text-white rounded-2xl py-4 text-base font-black shadow-lg"
                style={{
                  background: "linear-gradient(to right, #00D68F, #F5A623)",
                }}
                aria-label="Generate raffle QR"
              >
                <Gift size={22} />
                {entry?.encryptedQr
                  ? "Show My Raffle QR"
                  : "Generate Raffle QR"}
              </button>
            ) : (
              <button
                onClick={() => setShowScanner(true)}
                className="w-full flex items-center justify-center gap-3 text-white rounded-2xl py-4 text-base font-black shadow-lg"
                style={{
                  background: `linear-gradient(to right, ${t.primary}, #F5A623)`,
                }}
                aria-label="Open camera QR scanner"
              >
                <Camera size={22} />
                Scan Booth QR
              </button>
            )}

            {/* Booths list */}
            <div>
              <h2 className="font-bold text-sm mb-3" style={{ color: t.text }}>
                Booths ({scannedCodes.length}/{booths.length})
              </h2>
              {booths.length > 0 && (
                <BoothList booths={booths} scannedCodes={scannedCodes} />
              )}
            </div>
          </div>
        );

      case "map":
        return (
          <div className="px-4 pb-24 pt-4">
            <h2 className="font-bold text-sm mb-4" style={{ color: t.text }}>
              Maps &amp; Directories
            </h2>
            <ImageMapsView campaignId={campaign?.id} />
          </div>
        );

      case "share":
        return (
          <div className="px-4 pb-24 pt-6">
            <SharePanel eventTag={eventTag} />
          </div>
        );

      case "events":
        return (
          <div className="px-4 pb-24 pt-6">
            <UpcomingEvents />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ThemeContext.Provider value={t}>
      <DesktopGuard />
      <LandscapeGuard />

      <div
        className="md:hidden min-h-screen font-sans"
        style={{ background: t.bg, color: t.text }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 backdrop-blur px-4 py-3 flex items-center justify-between"
          style={{
            background: `${t.bg}f2`,
            borderBottom: `1px solid ${t.divider}`,
          }}
        >
          <div className="flex items-center">
            <img
              src={logo}
              alt="Worldbex Scan2Win"
              className="h-8 w-auto object-contain"
              style={isDark ? {} : { filter: "none" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: t.muted }}
            >
              {eventTag}
            </span>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-base"
              style={{ background: t.card }}
              aria-label="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: t.card }}
              aria-label="How to play"
            >
              <HelpCircle size={14} style={{ color: t.muted }} />
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: t.card }}
              aria-label="Reset progress"
            >
              <RotateCcw size={13} style={{ color: t.muted }} />
            </button>
          </div>
        </div>

        <div className="relative">{renderTab()}</div>

        {/* Powered by footer */}
        <div className="flex flex-col items-center gap-2 py-5 pb-20">
          <span
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: `${t.muted}99` }}
          >
            Powered by
          </span>
          <div className="flex items-center gap-4">
            <img
              src={dgsiLogo}
              alt="DGSI"
              className="h-6 w-auto object-contain opacity-70"
              style={isDark ? { filter: "brightness(0) invert(1)" } : {}}
            />
            <div className="w-px h-4" style={{ background: t.divider }} />
            <img
              src={eventbookLogo}
              alt="Eventbook"
              className="h-6 w-auto object-contain opacity-70"
              style={isDark ? { filter: "brightness(0) invert(1)" } : {}}
            />
          </div>
        </div>

        {/* Bottom navigation */}
        <nav
          className="fixed bottom-0 left-0 right-0 flex z-30"
          style={{ background: t.card, borderTop: `1px solid ${t.divider}` }}
        >
          {[
            { id: "home", icon: <Zap size={18} />, label: "Home" },
            { id: "scan", icon: <ScanLine size={18} />, label: "Scan" },
            { id: "map", icon: <MapPin size={18} />, label: "Directories" },
            { id: "share", icon: <Share2 size={18} />, label: "Share" },
            { id: "events", icon: <Gift size={18} />, label: "Events" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors"
              style={{ color: activeTab === tab.id ? t.primary : t.muted }}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Camera scanner */}
      <AnimatePresence>
        {showScanner && (
          <CameraScanner
            onScan={handleCameraScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Reset confirm bottom sheet */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowResetConfirm(false)}
            />
            {/* Sheet */}
            <motion.div
              className="relative w-full rounded-t-3xl p-6 space-y-5"
              style={{ background: t.card }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(233,69,96,0.12)" }}
                >
                  <AlertTriangle size={22} className="text-[#E94560]" />
                </div>
                <div>
                  <p className="font-black text-base" style={{ color: t.text }}>
                    Reset Progress?
                  </p>
                  <p
                    className="text-sm mt-1 leading-relaxed"
                    style={{ color: t.muted }}
                  >
                    All scanned booths, points, and your raffle QR will be
                    cleared. This cannot be undone.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white"
                style={{ background: "#E94560" }}
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: t.deeper, color: t.muted }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to Play guide */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                localStorage.setItem(GUIDE_SEEN_KEY, "1");
                setShowGuide(false);
              }}
            />
            <motion.div
              className="relative w-full rounded-t-3xl overflow-hidden"
              style={{ background: t.card, maxHeight: "85vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: `${t.muted}40` }}
                />
              </div>

              {/* Header */}
              <div className="px-6 pt-2 pb-4 flex items-center justify-between">
                <div>
                  <p
                    className="font-black text-lg leading-tight"
                    style={{ color: t.text }}
                  >
                    How to Play
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                    Worldbex Scan2Win mechanics
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem(GUIDE_SEEN_KEY, "1");
                    setShowGuide(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: t.deeper }}
                >
                  <X size={15} style={{ color: t.muted }} />
                </button>
              </div>

              {/* Steps */}
              <div
                className="overflow-y-auto px-6 pb-8 space-y-0"
                style={{ maxHeight: "calc(85vh - 110px)" }}
              >
                {[
                  {
                    icon: <ScanLine size={18} />,
                    color: "#4096ff",
                    title: "Scan Booth QR Codes",
                    desc: `Visit each booth and scan their QR code to earn points.${campaign?.firstScanBonus > 0 ? ` Your very first scan gives you a +${campaign.firstScanBonus} pts welcome bonus!` : ""}`,
                  },
                  {
                    icon: <Star size={18} />,
                    color: "#7360F2",
                    title: "Collect Points",
                    desc: `Each booth awards different points. Reach ${thresholdPoints} pts to unlock your raffle entry.`,
                  },
                  {
                    icon: <QrCode size={18} />,
                    color: "#00D68F",
                    title: "Generate Your Raffle QR",
                    desc: 'Once you hit the points goal, tap "Generate Raffle QR" to get your unique encrypted raffle code.',
                  },
                  {
                    icon: <CheckCircle size={18} />,
                    color: "#F5A623",
                    title: "Present to Event Staff",
                    desc: "Show your raffle QR to a staff member at the redemption booth. They'll scan and verify it.",
                  },
                  {
                    icon: <Trophy size={18} />,
                    color: "#E94560",
                    title: "Spin the Wheel & Win!",
                    desc: `Spin the prize wheel for a chance to win exciting prizes!${campaign?.maxSpinsPerParticipant > 1 ? ` You get up to ${campaign.maxSpinsPerParticipant} spins.` : ""}`,
                  },
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    {/* Connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: `${step.color}20`,
                          color: step.color,
                        }}
                      >
                        {step.icon}
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{ background: `${t.deeper}99` }}
                        />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pb-5 pt-1 flex-1">
                      <p
                        className="font-bold text-sm leading-tight"
                        style={{ color: t.text }}
                      >
                        {step.title}
                      </p>
                      <p
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: t.muted }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    localStorage.setItem(GUIDE_SEEN_KEY, "1");
                    setShowGuide(false);
                  }}
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-white mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${t.primary}, #F5A623)`,
                  }}
                >
                  Got it, Let's Play!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === "error" && (
          <ErrorModal message={modal.message} onClose={() => setModal(null)} />
        )}
        {modal?.type === "firstScan" && (
          <FirstScanModal
            booth={modal.booth}
            points={modal.points}
            bonus={modal.bonus}
            totalPoints={modal.totalPoints}
            threshold={thresholdPoints}
            campaignName={campaign?.campaignName}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "success" && (
          <SuccessModal
            points={modal.points}
            totalPoints={modal.totalPoints}
            threshold={thresholdPoints}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "goal" && entry && (
          <GoalModal
            entry={entry}
            campaignId={campaign.id}
            boothCodes={scannedCodes}
            onClose={() => setModal(null)}
            onQrGenerated={handleQrGenerated}
          />
        )}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
};

export default VisitorApp;
