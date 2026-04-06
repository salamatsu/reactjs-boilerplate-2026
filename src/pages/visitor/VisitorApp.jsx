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

import { useEffect, useRef, useState, useCallback } from "react";
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

// ─── localStorage helpers ─────────────────────────────────────────────────────

const ENTRY_KEY = "qrquest_entry";

const loadEntry = () => {
  try {
    const raw = localStorage.getItem(ENTRY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveEntry = (entry) => {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(entry));
};

// ─── Desktop guard ────────────────────────────────────────────────────────────

const DesktopGuard = () => (
  <div className="hidden md:flex h-screen items-center justify-center bg-[#1A1A2E] text-white text-center px-8">
    <div>
      <Zap className="mx-auto mb-4 text-[#E94560]" size={56} />
      <h1 className="text-2xl font-bold mb-2">Mobile Only</h1>
      <p className="text-[#8892A4]">
        Please open this page on your mobile device to participate in Scan to
        Win.
      </p>
    </div>
  </div>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Arc / circular progress bar */
const GoalProgress = ({ points, threshold }) => {
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
            stroke="#16213E"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedR}
            fill="none"
            stroke="#E94560"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{points}</span>
          <span className="text-xs text-[#8892A4]">pts</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-[#8892A4]">
        <span className="text-[#F5A623] font-semibold">{points}</span> /{" "}
        {threshold} pts
      </p>
      <div className="w-full mt-3 bg-[#16213E] rounded-full h-2">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-[#E94560] to-[#F5A623]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1 text-xs text-[#8892A4]">{Math.round(pct)}% of goal</p>
    </div>
  );
};

/** List of booths with scan status */
const BoothList = ({ booths, scannedCodes }) => (
  <div className="space-y-2">
    {booths.map((booth) => {
      const scanned = scannedCodes.includes(booth.boothCode);
      return (
        <div
          key={booth.id}
          className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
            scanned
              ? "bg-[#16213E] opacity-60"
              : "bg-[#16213E] border border-[#E94560]/20"
          }`}
        >
          <div className="flex items-center gap-3">
            {scanned ? (
              <CheckCircle size={20} className="text-[#00D68F] shrink-0" />
            ) : (
              <Circle size={20} className="text-[#8892A4] shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${
                scanned ? "line-through text-[#8892A4]" : "text-white"
              }`}
            >
              {booth.boothName}
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              scanned
                ? "bg-[#00D68F]/10 text-[#00D68F]"
                : "bg-[#E94560]/10 text-[#E94560]"
            }`}
          >
            +{booth.points} pts
          </span>
        </div>
      );
    })}
  </div>
);

/** Event details card */
const CampaignHeader = ({ campaign }) => (
  <div className="rounded-2xl bg-gradient-to-br from-[#16213E] to-[#1A1A2E] border border-[#E94560]/20 p-5 mb-4">
    <h1 className="text-lg font-bold text-white leading-tight">
      {campaign.campaignName}
    </h1>
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-[#8892A4] text-sm">
        <Calendar size={14} className="text-[#F5A623]" />
        <span>
          {formatDateTime(campaign.startDate, DATE_FORMATS.DATE)} –{" "}
          {formatDateTime(campaign.endDate, DATE_FORMATS.DATE)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[#8892A4] text-sm">
        <Zap size={14} className="text-[#E94560]" />
        <span>Threshold: {campaign.thresholdPoints} pts</span>
      </div>
    </div>
    {campaign.description && (
      <p className="mt-3 text-xs text-[#8892A4] leading-relaxed">
        {campaign.description}
      </p>
    )}
  </div>
);

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
      bg: "bg-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "X (Twitter)",
      icon: <XIcon />,
      bg: "bg-[#14171A]",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Join+me+at+Worldbex+Scan+to+Win!`,
    },
    {
      label: "Viber",
      icon: <ViberIcon />,
      bg: "bg-[#7360F2]",
      url: `viber://forward?text=${encodeURIComponent(url)}`,
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      bg: "bg-[#25D366]",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent("Join me at Worldbex Scan to Win! " + url)}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white font-black text-xl">Invite Friends</h2>
        <p className="text-[#8892A4] text-sm mt-1">
          Share this event and let others join the fun!
        </p>
      </div>

      {/* URL row */}
      <div className="flex items-center gap-2 bg-[#16213E] border border-[#E94560]/20 rounded-2xl px-4 py-3">
        <span className="flex-1 text-[#8892A4] text-xs truncate">{url}</span>
        <button
          onClick={copyLink}
          className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
            copied
              ? "bg-[#00D68F]/20 text-[#00D68F]"
              : "bg-[#E94560]/15 text-[#E94560]"
          }`}
          aria-label="Copy event link"
        >
          <Copy size={12} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Native share button */}
      <button
        onClick={shareNative}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#E94560] to-[#F5A623] text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-[#E94560]/25 active:scale-95 transition-transform"
        aria-label="Share event"
      >
        <Share2 size={20} />
        Share This Event
      </button>

      {/* Social platforms */}
      <div>
        <p className="text-[#8892A4] text-xs font-semibold uppercase tracking-widest mb-3">
          Share on
        </p>
        <div className="grid grid-cols-2 gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${s.bg} flex items-center gap-3 rounded-2xl px-4 py-4 active:scale-95 transition-transform no-underline`}
              style={{ color: "white", textDecoration: "none" }}
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
  const { data, isLoading } = useGetCampaignImagesPublic(campaignId);
  const sites = data?.data?.imageSites ?? [];
  const [lightbox, setLightbox] = useState(null); // { src, alt, filename }

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-[#E94560]" size={28} />
      </div>
    );

  if (sites.length === 0)
    return (
      <div className="rounded-2xl bg-[#16213E] border border-[#E94560]/10 flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E94560]/10 flex items-center justify-center mb-4">
          <MapPin size={28} className="text-[#E94560]" />
        </div>
        <p className="text-white font-bold">No maps yet</p>
        <p className="text-[#8892A4] text-xs mt-1">
          Ask event staff for a printed venue map.
        </p>
      </div>
    );

  return (
    <>
      <div className="space-y-5">
        {sites.map((site) => {
          const activeImages = site.images.filter(
            (img) => img.isActive !== false,
          );
          if (!activeImages.length) return null;
          const showCode = site.siteCode !== site.siteName;

          return (
            <div key={site.siteCode}>
              {/* Site header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#E94560]/15 flex items-center justify-center shrink-0">
                  <MapPin size={12} className="text-[#E94560]" />
                </div>
                <span className="text-white font-black text-sm">
                  {site.siteName}
                </span>
                {showCode && (
                  <span className="text-[10px] font-mono text-[#8892A4] border border-[#ffffff12] rounded-md px-1.5 py-0.5 leading-none">
                    {site.siteCode}
                  </span>
                )}
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
                        background: "#16213E",
                        border: "1px solid rgba(255,255,255,0.05)",
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
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <p className="text-xs text-[#8892A4] truncate flex-1">
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
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              color: "#8892A4",
                            }}
                            aria-label="View fullscreen"
                          >
                            <Maximize2 size={11} />
                            View
                          </button>
                          <button
                            onClick={() => downloadImage(src, filename)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
                            style={{
                              background: "rgba(233,69,96,0.15)",
                              color: "#E94560",
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
        className="w-full max-w-sm bg-[#16213E] rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover image */}
        <div
          className="relative bg-[#0f1729] flex items-center justify-center"
          style={{ height: 200 }}
        >
          <img
            src={`${VITE_BASEURL_APP}${event.imgSrc}`}
            alt={event.name}
            className="h-full w-full object-contain p-6"
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
          <span className="absolute bottom-3 left-4 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-white/10 text-[#8892A4] border border-white/10">
            {event.eventName}
          </span>
        </div>

        <div className="p-5 space-y-3">
          <h2 className="text-white font-black text-lg leading-snug">
            {event.name}
          </h2>

          {/* Date */}
          <div className="flex items-start gap-3 bg-[#1A1A2E] rounded-xl px-3 py-3">
            <Calendar size={14} className="text-[#8892A4] shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-bold">{event.date}</p>
              {from && to && (
                <p className="text-[#8892A4] text-xs mt-0.5">
                  {from} — {to}
                </p>
              )}
            </div>
          </div>

          {/* Scan to Win info */}
          <div className="flex items-start gap-3 bg-[#1A1A2E] rounded-xl px-3 py-3">
            <Zap size={14} className="text-[#8892A4] shrink-0 mt-0.5" />
            <p className="text-[#8892A4] text-xs leading-relaxed">
              Scan exhibitor booths, collect points, and qualify for the raffle
              draw at this event.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-2xl py-3 text-sm font-semibold text-[#8892A4] bg-[#1A1A2E] active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UpcomingEvents = () => {
  const { data: events, isLoading } = useGetEventsList();
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div>
      {/* Sticky register CTA */}
      <div className="sticky top-13 z-20 -mx-4 px-4 pt-1 pb-3 bg-[#1A1A2E]">
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
          className="flex items-center gap-3 rounded-2xl p-4 bg-[#16213E] border border-[#E94560]/30 active:scale-[0.98] transition-transform"
          aria-label="Register or Login to Worldbex Events"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E94560]/15 flex items-center justify-center shrink-0">
            <Star size={18} className="text-[#E94560]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm leading-tight">
              Register / Login
            </p>
            <p className="text-[#8892A4] text-xs mt-0.5 truncate">
              worldbexevents.com — access all events
            </p>
          </div>
          <div className="shrink-0 w-8 h-8 rounded-xl bg-[#E94560] flex items-center justify-center">
            <ChevronRight size={15} className="text-white" />
          </div>
        </a>
      </div>

      <div className="mb-4 mt-2">
        <h2 className="text-white font-black text-xl">Upcoming Events</h2>
        <p className="text-[#8892A4] text-sm mt-1">
          Scan. Collect points. Win prizes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-[#E94560]" size={28} />
        </div>
      ) : (
        <div className="space-y-2">
          {(events ?? []).map((ev) => (
            <button
              key={ev.eventId}
              onClick={() => setSelectedEvent(ev)}
              className="w-full rounded-2xl bg-[#16213E] overflow-hidden text-left active:scale-[0.98] transition-transform border border-white/5"
            >
              <div className="p-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#0f1729] shrink-0 flex items-center justify-center">
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
                    <p className="text-white text-sm font-semibold leading-snug flex-1">
                      {ev.name}
                    </p>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-white/8 text-[#8892A4] border border-white/10 ml-1">
                      {ev.eventName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Calendar size={11} className="text-[#8892A4]" />
                    <span className="text-[#8892A4] text-xs">{ev.date}</span>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-[#8892A4]/50 shrink-0"
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
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="w-full max-w-sm bg-[#16213E] rounded-3xl p-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[#E94560]/10 flex items-center justify-center mx-auto mb-4">
        <X size={32} className="text-[#E94560]" />
      </div>
      <h2 className="text-white font-bold text-lg mb-2">Oops!</h2>
      <p className="text-[#8892A4] text-sm mb-5">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold"
        aria-label="Dismiss error"
      >
        Got it
      </button>
    </motion.div>
  </div>
);

/** Success modal after scanning a booth */
const SuccessModal = ({ points, totalPoints, threshold, onClose }) => (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="w-full max-w-sm bg-[#16213E] rounded-3xl p-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[#00D68F]/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-[#00D68F]" />
      </div>
      <h2 className="text-white font-bold text-lg mb-1">Points Earned!</h2>
      <div className="text-5xl font-black text-[#F5A623] my-3">+{points}</div>
      <p className="text-[#8892A4] text-sm mb-1">
        Running total:{" "}
        <span className="text-white font-semibold">{totalPoints}</span> /{" "}
        {threshold} pts
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

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
      <motion.div
        initial={{ y: 120, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden text-center"
        style={{ background: "#16213E" }}
      >
        {/* Top gradient banner */}
        <div
          className="px-6 pt-8 pb-6"
          style={{
            background: "linear-gradient(160deg, #E9456025 0%, #7360F215 100%)",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #E94560, #F5A623)" }}
          >
            <Zap size={36} className="text-white" />
          </motion.div>
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">
            Welcome to the Event!
          </p>
          <h2 className="text-white font-black text-xl leading-tight">
            First Scan Unlocked!
          </h2>
          <p className="text-[#8892A4] text-xs mt-1">{campaignName}</p>
        </div>

        {/* Booth + Points */}
        <div className="px-6 py-5 space-y-3">
          {/* Booth name */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{ background: "#0F1629" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#4096ff20" }}
            >
              <ScanLine size={16} className="text-[#4096ff]" />
            </div>
            <div>
              <p className="text-[#8892A4] text-xs">Booth scanned</p>
              <p className="text-white font-bold text-sm">{booth.boothName}</p>
            </div>
          </div>

          {/* Points breakdown */}
          <div
            className="rounded-2xl px-4 py-4 space-y-2"
            style={{ background: "#0F1629" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#8892A4] text-xs">Booth points</span>
              <span className="text-white font-bold text-sm">
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
              style={{ borderTop: "1px solid #16213E" }}
            >
              <span className="text-[#8892A4] text-xs">Your total</span>
              <span className="font-black text-lg" style={{ color: "#00D68F" }}>
                {totalPoints} / {threshold} pts
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg, #E94560, #F5A623)" }}
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

  if (phase === "form") {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-[#16213E] rounded-3xl p-6 my-auto"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6 }}
            className="text-4xl text-center mb-3"
            aria-hidden
          >
            🎉
          </motion.div>
          <h2 className="text-white font-black text-xl text-center mb-1">
            Threshold Reached!
          </h2>
          <p className="text-[#8892A4] text-sm text-center mb-5">
            Fill in your details (optional) and generate your raffle QR code.
          </p>

          <div className="space-y-3 mb-4">
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              placeholder="Full name (optional)"
              className="w-full bg-[#1A1A2E] border border-[#E94560]/20 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560]"
            />
            <input
              value={form.mobileNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, mobileNumber: e.target.value }))
              }
              placeholder="Mobile number (optional)"
              type="tel"
              className="w-full bg-[#1A1A2E] border border-[#E94560]/20 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560]"
            />
            <input
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="Email address (optional)"
              type="email"
              className="w-full bg-[#1A1A2E] border border-[#E94560]/20 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560]"
            />
          </div>

          {error && (
            <p className="text-[#E94560] text-xs text-center mb-3">
              {error?.message || "Failed to generate QR. Please try again."}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
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
            className="w-full mt-2 text-[#8892A4] text-sm py-2"
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
        className="w-full max-w-sm bg-[#16213E] rounded-3xl p-6 text-center my-auto"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl mb-3"
          aria-hidden
        >
          🎉
        </motion.div>
        <h2 className="text-white font-black text-xl mb-1">You're In!</h2>
        <p className="text-[#8892A4] text-sm mb-4">
          Show this QR code at the raffle station to spin the wheel.
        </p>

        <div className="bg-white rounded-2xl p-4 inline-block mb-4">
          <QRCodeSVG value={encryptedQr} size={180} level="H" />
        </div>

        <p className="text-[#8892A4] text-xs mb-5">
          This QR code is unique to you. Do not share it.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold"
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

  // ── Event data ──
  const {
    data: campaignData,
    isLoading: campaignLoading,
    isError: campaignError,
  } = useGetCampaignByEventTag(eventTag);

  const campaign = campaignData?.data?.campaign ?? null;
  const booths = campaignData?.data?.booths ?? [];
  const thresholdPoints = campaignData?.data?.thresholdPoints ?? 0;

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
    localStorage.removeItem(ENTRY_KEY);
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

    const existing = loadEntry();
    if (existing && existing.eventTag === campaign.eventTag) {
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
      <div className="md:hidden flex items-center justify-center h-screen bg-[#1A1A2E]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#E94560] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center h-screen bg-[#1A1A2E] px-8 text-center">
        <X size={40} className="text-[#E94560] mb-4" />
        <h2 className="text-white font-bold text-lg mb-2">Event Not Found</h2>
        <p className="text-[#8892A4] text-sm">
          No active event found for{" "}
          <span className="text-white font-semibold">{eventTag}</span>.
        </p>
      </div>
    );
  }

  // ── Tab content ──
  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-5 px-4 pb-24 pt-4">
            <CampaignHeader campaign={campaign} />
            <GoalProgress points={currentPoints} threshold={thresholdPoints} />

            {/* Show "Generate QR" if threshold reached, else show scan button */}
            {currentPoints >= thresholdPoints ? (
              <button
                onClick={() => setModal({ type: "goal" })}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#00D68F] to-[#F5A623] text-white rounded-2xl py-4 text-base font-black shadow-lg shadow-[#00D68F]/30"
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
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#E94560] to-[#F5A623] text-white rounded-2xl py-4 text-base font-black shadow-lg shadow-[#E94560]/30"
                aria-label="Open camera QR scanner"
              >
                <Camera size={22} />
                Scan Booth QR
              </button>
            )}

            {/* Booths list */}
            <div>
              <h2 className="text-white font-bold text-sm mb-3">
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
            <h2 className="text-white font-bold text-sm mb-4">Venue Maps</h2>
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
    <>
      <DesktopGuard />

      <div className="md:hidden min-h-screen bg-[#1A1A2E] text-white font-sans">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#1A1A2E]/95 backdrop-blur border-b border-[#16213E] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="Worldbex QR Quest" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8892A4] font-medium uppercase tracking-widest">
              {eventTag}
            </span>
            <button
              onClick={() => setShowGuide(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "#16213E" }}
              aria-label="How to play"
            >
              <HelpCircle size={14} className="text-[#8892A4]" />
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: "#16213E" }}
              aria-label="Reset progress"
            >
              <RotateCcw size={13} className="text-[#8892A4]" />
            </button>
          </div>
        </div>

        <div className="relative">{renderTab()}</div>

        {/* Powered by footer */}
        <div className="flex flex-col items-center gap-2 py-5 pb-20">
          <span className="text-[10px] uppercase tracking-widest text-[#8892A4]/60 font-semibold">
            Powered by
          </span>
          <div className="flex items-center gap-4">
            <img src={dgsiLogo} alt="DGSI" className="h-6 w-auto object-contain opacity-70 brightness-0 invert" />
            <div className="w-px h-4 bg-[#ffffff15]" />
            <img src={eventbookLogo} alt="Eventbook" className="h-6 w-auto object-contain opacity-70 brightness-0 invert" />
          </div>
        </div>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#16213E] border-t border-[#1A1A2E] flex z-30">
          {[
            { id: "home", icon: <Zap size={18} />, label: "Home" },
            { id: "map", icon: <MapPin size={18} />, label: "Map" },
            { id: "share", icon: <Share2 size={18} />, label: "Share" },
            { id: "events", icon: <Gift size={18} />, label: "Events" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors ${
                activeTab === tab.id ? "text-[#E94560]" : "text-[#8892A4]"
              }`}
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
              style={{ background: "#16213E" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "#E9456020" }}
                >
                  <AlertTriangle size={22} className="text-[#E94560]" />
                </div>
                <div>
                  <p className="text-white font-black text-base">
                    Reset Progress?
                  </p>
                  <p className="text-[#8892A4] text-sm mt-1 leading-relaxed">
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
                style={{ background: "#0F1629", color: "#8892A4" }}
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
              style={{ background: "#16213E", maxHeight: "85vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#8892A430]" />
              </div>

              {/* Header */}
              <div className="px-6 pt-2 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-lg leading-tight">
                    How to Play
                  </p>
                  <p className="text-[#8892A4] text-xs mt-0.5">
                    Worldbex QR Quest mechanics
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem(GUIDE_SEEN_KEY, "1");
                    setShowGuide(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: "#0F1629" }}
                >
                  <X size={15} className="text-[#8892A4]" />
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
                          style={{ background: "#0F162960" }}
                        />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pb-5 pt-1 flex-1">
                      <p className="font-bold text-sm text-white leading-tight">
                        {step.title}
                      </p>
                      <p className="text-[#8892A4] text-xs mt-1 leading-relaxed">
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
                    background: "linear-gradient(135deg, #E94560, #F5A623)",
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
    </>
  );
};

export default VisitorApp;
