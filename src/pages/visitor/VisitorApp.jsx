// ============================================
// SCAN2WIN — Visitor Web App
// Worldbex Events "Scan to Win" Platform
//
// Route: /:eventTag  (e.g. /mias)
// Target: Mobile & tablet only
//
// Features:
//   1. Goal Progress (arc progress bar)
//   2. Scans List (interactions + status)
//   3. Save Link to Clipboard
//   4. Scan-to-Win deep link handler (URL params ?i=&p=)
//   5. Camera QR Scanner (jsQR via canvas)
//   6. Digital Event Map
//   7. Event Details card
//   8. Shareable Event Link (Web Share API)
//   9. Upcoming Events Showcase
// ============================================

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import CryptoJS from "crypto-js";
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
} from "lucide-react";
import {
  APP_BASE_URL,
  SECRET_KEY,
  UPCOMING_EVENTS,
  USE_MOCK,
  MOCK_DATA,
} from "../../lib/constants";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const ENTRY_KEY = "scan2win_entry";

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

// ─── Encryption helpers ───────────────────────────────────────────────────────

const encryptPayload = (payload) =>
  CryptoJS.AES.encrypt(JSON.stringify(payload), SECRET_KEY).toString();

// ─── Desktop guard ────────────────────────────────────────────────────────────

const DesktopGuard = () => (
  <div className="hidden md:flex h-screen items-center justify-center bg-[#1A1A2E] text-white text-center px-8">
    <div>
      <Zap className="mx-auto mb-4 text-[#E94560]" size={56} />
      <h1 className="text-2xl font-bold mb-2">Mobile Only</h1>
      <p className="text-[#8892A4]">
        Please open this page on your mobile device to participate in Scan to Win.
      </p>
    </div>
  </div>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Arc / circular progress bar */
const GoalProgress = ({ points, goal }) => {
  const pct = Math.min((points / goal) * 100, 100);
  const radius = 70;
  const stroke = 10;
  const normalizedR = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedR;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedR}
            fill="none"
            stroke="#16213E"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
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
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{points}</span>
          <span className="text-xs text-[#8892A4]">pts</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-[#8892A4]">
        <span className="text-[#F5A623] font-semibold">{points}</span> / {goal} pts
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

/** List of all event interactions with scan status */
const InteractionList = ({ interactions, scannedIds }) => (
  <div className="space-y-2">
    {interactions.map((item) => {
      const scanned = scannedIds.includes(item.id);
      return (
        <div
          key={item.id}
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
              {item.name}
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              scanned
                ? "bg-[#00D68F]/10 text-[#00D68F]"
                : "bg-[#E94560]/10 text-[#E94560]"
            }`}
          >
            +{item.points} pts
          </span>
        </div>
      );
    })}
  </div>
);

/** Event details card */
const EventHeader = ({ event }) => (
  <div className="rounded-2xl bg-gradient-to-br from-[#16213E] to-[#1A1A2E] border border-[#E94560]/20 p-5 mb-4">
    <h1 className="text-lg font-bold text-white leading-tight">{event.name}</h1>
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-[#8892A4] text-sm">
        <Calendar size={14} className="text-[#F5A623]" />
        <span>{event.date}</span>
      </div>
      <div className="flex items-center gap-2 text-[#8892A4] text-sm">
        <MapPin size={14} className="text-[#E94560]" />
        <span>{event.location}</span>
      </div>
    </div>
    <p className="mt-3 text-xs text-[#8892A4] leading-relaxed">
      {event.description}
    </p>
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

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
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
      } catch {
        setError(
          "Camera access denied. Please allow camera permissions and try again."
        );
      }
    };

    startCamera();
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Decode frames with jsQR
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
      // Dynamically import jsQR to keep initial bundle lean
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
        <span className="font-bold">Scan QR Code</span>
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
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <p className="text-[#E94560] text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scan frame overlay */}
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
        Point your camera at the Scan to Win QR code at the booth.
      </p>
    </div>
  );
};

/** Share panel — copy link + Web Share API + social buttons */
const SharePanel = ({ eventTag }) => {
  const url = `${APP_BASE_URL}/${eventTag}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
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
      color: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "X",
      color: "#000",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Join+me+at+the+Worldbex+Scan+to+Win!`,
    },
    {
      label: "Viber",
      color: "#7360F2",
      url: `viber://forward?text=${encodeURIComponent(url)}`,
    },
    {
      label: "WhatsApp",
      color: "#25D366",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent("Join me at Worldbex Scan to Win! " + url)}`,
    },
  ];

  return (
    <div className="rounded-2xl bg-[#16213E] p-5 space-y-4">
      <h2 className="text-white font-bold text-sm">Share This Event</h2>
      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A2E] border border-[#E94560]/30 rounded-xl py-2.5 text-sm text-white"
          aria-label="Copy event link"
        >
          <Copy size={14} className="text-[#E94560]" />
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={shareNative}
          className="flex-1 flex items-center justify-center gap-2 bg-[#E94560] rounded-xl py-2.5 text-sm text-white font-semibold"
          aria-label="Share event"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>
      <div className="flex gap-2">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: s.color }}
            aria-label={`Share on ${s.label}`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
};

/** Upcoming Worldbex events horizontal scroll */
const UpcomingEvents = () => (
  <div>
    <h2 className="text-white font-bold text-sm mb-3">Upcoming Events</h2>
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
      {UPCOMING_EVENTS.map((ev) => (
        <div
          key={ev.tag}
          className="shrink-0 snap-start w-48 rounded-2xl bg-[#16213E] border border-[#E94560]/10 p-4 flex flex-col justify-between"
        >
          <div>
            <p className="text-white text-xs font-bold leading-tight line-clamp-2">
              {ev.name}
            </p>
            <p className="text-[#F5A623] text-xs mt-1">{ev.date}</p>
          </div>
          <a
            href={ev.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-xs bg-[#E94560] text-white rounded-lg py-1.5 font-semibold"
            aria-label={`Register for ${ev.name}`}
          >
            Register
          </a>
        </div>
      ))}
    </div>
  </div>
);

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

/** Success modal shown after scanning a valid interaction */
const SuccessModal = ({ points, totalPoints, goal, onClose }) => (
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
        {goal} pts
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

/** Goal modal — shown when visitor hits the points goal */
const GoalModal = ({ entry, onClose }) => {
  const payload = {
    id: entry.id,
    scans: entry.scans,
    eventTag: entry.eventTag,
  };
  const encrypted = encryptPayload(payload);

  // Fire confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.4 },
      colors: ["#E94560", "#F5A623", "#00D68F", "#FFFFFF"],
    });
  }, []);

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
        <h2 className="text-white font-black text-xl mb-1">
          Goal Reached!
        </h2>
        <p className="text-[#8892A4] text-sm mb-4">
          Show this QR code at the prize booth to redeem your reward.
        </p>

        {/* Encrypted redemption QR code */}
        <div className="bg-white rounded-2xl p-4 inline-block mb-4">
          <QRCodeSVG value={encrypted} size={180} level="H" />
        </div>

        <p className="text-[#8892A4] text-xs mb-5">
          This QR code is unique to you. Do not share it.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold"
          aria-label="Dismiss goal modal"
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

  // ── State ──
  const [event, setEvent] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: "error"|"success"|"goal", ... }
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home"|"map"|"share"|"events"

  // ── Derived state ──
  const totalPoints = entry?.scans?.reduce((s, r) => s + r.points, 0) ?? 0;
  const scannedIds = entry?.scans?.map((r) => r.interactionId) ?? [];

  // ── Load or create entry on mount ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Fetch event data (mock or API)
        const eventData = USE_MOCK
          ? MOCK_DATA.event
          : await fetch("/api/events").then((r) => r.json());

        if (!eventData) {
          setModal({
            type: "error",
            message: "No event available right now. Please check back later.",
          });
          setLoading(false);
          return;
        }

        setEvent(eventData);

        // Check for existing localStorage entry
        const existing = loadEntry();
        if (existing && existing.eventTag === eventData.eventTag) {
          setEntry(existing);
        } else {
          // First visit — create a new entry
          const newEntry = {
            id: uuidv4(),
            eventTag: eventData.eventTag,
            goal: eventData.goal,
            scans: [],
          };
          saveEntry(newEntry);
          setEntry(newEntry);
        }
      } catch {
        setModal({
          type: "error",
          message: "No event available right now. Please check back later.",
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // ── Handle deep link scan params (?i=interactionId&p=points) ──
  useEffect(() => {
    const interactionId = searchParams.get("i");
    const points = searchParams.get("p");

    if (!interactionId || !points || !entry || !event) return;

    // Clear URL params immediately to prevent re-trigger on back navigation
    setSearchParams({}, { replace: true });

    processScan(interactionId, parseInt(points, 10), entry, event);
  }, [searchParams, entry, event]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core scan validation & storage logic ──
  const processScan = useCallback(
    (rawInteractionId, rawPoints, currentEntry, currentEvent) => {
      const interactionId = parseInt(rawInteractionId, 10);
      const points = parseInt(rawPoints, 10);

      // Validate event tag match
      if (currentEntry.eventTag !== currentEvent.eventTag) {
        setModal({
          type: "error",
          message: "This QR code is not valid for this event.",
        });
        return;
      }

      // Check for duplicate scan
      if (currentEntry.scans.some((s) => s.interactionId === interactionId)) {
        setModal({
          type: "error",
          message: "You have already scanned this interaction.",
        });
        return;
      }

      // Add scan and persist
      const updatedScans = [...currentEntry.scans, { interactionId, points }];
      const updatedEntry = { ...currentEntry, scans: updatedScans };
      saveEntry(updatedEntry);
      setEntry(updatedEntry);

      const newTotal = updatedScans.reduce((s, r) => s + r.points, 0);

      // Check if goal is reached
      if (newTotal >= currentEntry.goal) {
        setModal({ type: "goal", entry: updatedEntry });
      } else {
        setModal({ type: "success", points, totalPoints: newTotal });
      }
    },
    []
  );

  // ── Camera scan handler ──
  const handleCameraScan = useCallback(
    (decoded) => {
      setShowScanner(false);
      try {
        const url = new URL(decoded);
        const scannedTag = url.pathname.replace("/", "");
        const i = url.searchParams.get("i");
        const p = url.searchParams.get("p");

        if (!i || !p) {
          setModal({
            type: "error",
            message: "Invalid QR code. Please scan a Scan to Win booth QR.",
          });
          return;
        }

        if (scannedTag !== entry?.eventTag) {
          setModal({
            type: "error",
            message: "This QR code is not valid for this event.",
          });
          return;
        }

        processScan(i, parseInt(p, 10), entry, event);
      } catch {
        setModal({
          type: "error",
          message: "Could not read QR code. Please try again.",
        });
      }
    },
    [entry, event, processScan]
  );

  // ── Loading screen ──
  if (loading) {
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

  // ── Bottom nav tab content ──
  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-5 px-4 pb-24 pt-4">
            <EventHeader event={event} />
            <GoalProgress points={totalPoints} goal={entry?.goal ?? 100} />

            {/* Scan button */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#E94560] to-[#F5A623] text-white rounded-2xl py-4 text-base font-black shadow-lg shadow-[#E94560]/30"
              aria-label="Open camera QR scanner"
            >
              <Camera size={22} />
              Scan QR Code
            </button>

            {/* Interactions list */}
            <div>
              <h2 className="text-white font-bold text-sm mb-3">
                Scan Interactions ({scannedIds.length}/{event?.interactions?.length})
              </h2>
              {event?.interactions && (
                <InteractionList
                  interactions={event.interactions}
                  scannedIds={scannedIds}
                />
              )}
            </div>
          </div>
        );

      case "map":
        return (
          <div className="px-4 pb-24 pt-4">
            <h2 className="text-white font-bold text-sm mb-3">Event Map</h2>
            <div className="rounded-2xl overflow-hidden bg-[#16213E] border border-[#E94560]/10">
              {/* Static map placeholder — replace src with actual venue map image */}
              <div className="w-full aspect-square flex items-center justify-center text-[#8892A4] text-sm p-8 text-center">
                <div>
                  <MapPin size={40} className="mx-auto mb-3 text-[#E94560]" />
                  <p className="font-bold text-white">SM Mall of Asia</p>
                  <p>Concert Grounds, Pasay City</p>
                  <p className="mt-2 text-xs">
                    Interactive venue map coming soon.
                    {"\n"}Ask staff for a printed copy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "share":
        return (
          <div className="px-4 pb-24 pt-4 space-y-5">
            <SharePanel eventTag={eventTag} />
          </div>
        );

      case "events":
        return (
          <div className="px-4 pb-24 pt-4">
            <UpcomingEvents />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile-only guard — show message on md+ screens */}
      <DesktopGuard />

      {/* App shell — visible on mobile/tablet only */}
      <div className="md:hidden min-h-screen bg-[#1A1A2E] text-white font-sans">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#1A1A2E]/95 backdrop-blur border-b border-[#16213E] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#E94560]" />
            <span className="text-sm font-black tracking-wide">SCAN2WIN</span>
          </div>
          <span className="text-xs text-[#8892A4] font-medium uppercase tracking-widest">
            {eventTag}
          </span>
        </div>

        {/* Page content */}
        <div className="relative">{renderTab()}</div>

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
                activeTab === tab.id
                  ? "text-[#E94560]"
                  : "text-[#8892A4]"
              }`}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Camera QR scanner overlay */}
      <AnimatePresence>
        {showScanner && (
          <CameraScanner
            onScan={handleCameraScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === "error" && (
          <ErrorModal
            message={modal.message}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "success" && (
          <SuccessModal
            points={modal.points}
            totalPoints={modal.totalPoints}
            goal={entry?.goal ?? 100}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === "goal" && (
          <GoalModal entry={modal.entry} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default VisitorApp;
