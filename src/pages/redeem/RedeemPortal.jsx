// ============================================
// SCAN2WIN — Redeem Portal (Raffle Station)
// Worldbex Events "Scan to Win" Platform
//
// Route: /redeem
// Actor: Event staff at the raffle station
//
// Event Raffle API flow:
//   Setup   → Enter eventTag to load event (persisted in localStorage)
//   Step 5  POST /campaigns/:campaignId/validate-raffle  → validate visitor QR
//   Step 6  Wheel spin (client-side)
//   Step 7  POST /campaigns/:campaignId/spin-wheel       → record outcome
// ============================================

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wheel } from "react-custom-roulette";
import {
  ScanLine,
  X,
  CheckCircle,
  RotateCcw,
  Loader2,
  Settings,
  Gift,
  Star,
  Zap,
  ChevronUp,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import {
  useGetCampaignByEventTag,
  useGetCampaignPrizesPublic,
  useValidateRaffle,
  useSpinWheel,
} from "../../services/requests/useApi";
import {
  getActiveSurveyApi,
  checkSurveyResponseStatusApi,
  submitSurveyApi,
} from "../../services/api/api";
import { logo } from "../../assets/images/logos";

// ─── Theme ────────────────────────────────────────────────────────────────────

const REDEEM_THEME_KEY = "qrquest_redeem_theme";

const LIGHT = {
  isDark: false,
  bg: "#FFFFFF",
  bgGradient: "linear-gradient(135deg, #fff7ee 0%, #ffffff 50%, #fff3e0 100%)",
  card: "#FFF7EE",
  deeper: "#FFF0DC",
  headerBg: "rgba(255,247,238,0.92)",
  headerBorder: "rgba(253,145,20,0.15)",
  text: "#1A1A2E",
  muted: "#6B7280",
  mutedAlt: "rgba(107,114,128,0.6)",
  primary: "#FD9114",
  primaryBg: "rgba(253,145,20,0.1)",
  primaryBorder: "rgba(253,145,20,0.25)",
  accentBar: "linear-gradient(to right, #FD9114, #f59e0b, #FD9114)",
  inputBg: "rgba(253,145,20,0.06)",
  inputBorder: "rgba(253,145,20,0.2)",
  pill: "rgba(0,0,0,0.05)",
  pillBorder: "rgba(0,0,0,0.08)",
};

const DARK = {
  isDark: true,
  bg: "#0D0D1A",
  bgGradient: "linear-gradient(135deg, #0D0D1A 0%, #1a0533 50%, #0D0D1A 100%)",
  card: "rgba(255,255,255,0.05)",
  deeper: "rgba(0,0,0,0.3)",
  headerBg: "rgba(0,0,0,0.3)",
  headerBorder: "rgba(255,255,255,0.1)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.5)",
  mutedAlt: "rgba(255,255,255,0.4)",
  primary: "#f472b6",
  primaryBg: "rgba(255,255,255,0.05)",
  primaryBorder: "rgba(255,255,255,0.1)",
  accentBar: "linear-gradient(to right, #ec4899, #eab308, #a855f7)",
  inputBg: "rgba(255,255,255,0.1)",
  inputBorder: "rgba(255,255,255,0.2)",
  pill: "rgba(255,255,255,0.05)",
  pillBorder: "rgba(255,255,255,0.1)",
};

const ThemeCtx = createContext(LIGHT);
const useRT = () => useContext(ThemeCtx);

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STATION_KEY = "qrquest_station";

const loadStation = () => {
  try {
    const raw = localStorage.getItem(STATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStation = (data) =>
  localStorage.setItem(STATION_KEY, JSON.stringify(data));

const clearStation = () => localStorage.removeItem(STATION_KEY);

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = ["scan", "survey", "spin", "done"];

// ─── Vibrant wheel color palette ─────────────────────────────────────────────

const WHEEL_COLORS = [
  "#FF2D55", // hot pink
  "#FF9500", // orange
  "#FFCC00", // yellow
  "#34C759", // green
  "#007AFF", // blue
  "#AF52DE", // purple
  "#FF6B6B", // coral
  "#00C7BE", // teal
  "#FF3B30", // red
  "#30D158", // mint
];

// ─── Floating particle background ────────────────────────────────────────────

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 4,
  dur: 4 + Math.random() * 4,
  size: 4 + Math.random() * 8,
  color: WHEEL_COLORS[i % WHEEL_COLORS.length],
}));

const FloatingParticles = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-full opacity-20"
        style={{
          left: `${p.x}%`,
          bottom: "-20px",
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
        }}
        animate={{
          y: [0, -window.innerHeight - 40],
          rotate: [0, 360],
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: p.dur,
          delay: p.delay,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    ))}
  </div>
);

// ─── Confetti burst ───────────────────────────────────────────────────────────

const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.5,
  color: WHEEL_COLORS[i % WHEEL_COLORS.length],
  size: 6 + Math.random() * 8,
  angle: Math.random() * 360,
}));

const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
    {CONFETTI.map((c) => (
      <motion.div
        key={c.id}
        className="absolute rounded-sm"
        style={{
          left: `${c.x}%`,
          top: "-10px",
          width: c.size,
          height: c.size / 2,
          backgroundColor: c.color,
          rotate: c.angle,
        }}
        animate={{
          y: window.innerHeight + 20,
          rotate: [c.angle, c.angle + 720],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 2.5,
          delay: c.delay,
          ease: "easeIn",
        }}
      />
    ))}
  </div>
);

// ─── Event Setup Screen ────────────────────────────────────────────────────

const SetupScreen = ({ onSetup }) => {
  const [eventTag, setEventTag] = useState("");
  const [staffName, setStaffName] = useState("");
  const [submittedTag, setSubmittedTag] = useState(null);

  const {
    data: campaignData,
    isLoading,
    isError,
  } = useGetCampaignByEventTag(submittedTag);

  useEffect(() => {
    if (campaignData?.data?.campaign && submittedTag) {
      const campaign = campaignData.data.campaign;
      const station = {
        eventTag: submittedTag,
        campaignId: campaign.id,
        campaignName: campaign.campaignName,
        staffName,
      };
      saveStation(station);
      onSetup(station);
    }
  }, [campaignData, submittedTag, staffName, onSetup]);

  const handleSubmit = () => {
    if (!eventTag.trim()) return;
    setSubmittedTag(eventTag.trim().toUpperCase());
  };

  const t = useRT();
  return (
    <div className="relative h-full flex flex-col items-center justify-center gap-5 w-full max-w-md mx-auto px-6 z-10">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="w-20 h-20  flex items-center justify-center"
        // style={{ background: `linear-gradient(135deg, ${t.primary}, #f59e0b)` }}
      >
        <img
          src={logo}
          style={{
            width: 70,
            height: 70,
          }}
        />
        {/* <Settings size={40} className="text-white" /> */}
      </motion.div>

      <div className="text-center">
        <h2 className="text-3xl font-black" style={{ color: t.text }}>
          Station Setup
        </h2>
        <p className="text-sm mt-1" style={{ color: t.muted }}>
          Enter the event tag to load the active raffle event.
        </p>
      </div>

      <div className="w-full space-y-3">
        <input
          value={eventTag}
          onChange={(e) => setEventTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Event tag (e.g. WORLDBEX2026)"
          className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all uppercase backdrop-blur-sm"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.text,
          }}
          aria-label="Event tag"
        />
        <input
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="Staff name (optional)"
          className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all backdrop-blur-sm"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
            color: t.text,
          }}
          aria-label="Staff name"
        />
      </div>

      {isError && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2"
        >
          Event not found for <strong>{submittedTag}</strong>. Check the event
          tag and try again.
        </motion.p>
      )}

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={!eventTag.trim() || isLoading}
        className="w-full text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg"
        style={{
          background: `linear-gradient(to right, ${t.primary}, #f59e0b)`,
        }}
        aria-label="Load event"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Loading…
          </>
        ) : (
          <>
            {/* <img
              src={logo}
              style={{
                width: 28,
                height: 28,
              }}
            /> */}
            <Zap size={20} />
            Load Event
          </>
        )}
      </motion.button>
    </div>
  );
};

// ─── Step: Scan & Validate ────────────────────────────────────────────────────

const ScanStep = ({ station, onNext }) => {
  const [input, setInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef(null);

  const {
    mutateAsync: validateRaffle,
    isPending,
    error,
    reset: resetMutation,
  } = useValidateRaffle();

  const isLoading = isScanning || isPending;

  // Keep the hidden input focused
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Re-focus on any click anywhere on the page
  useEffect(() => {
    const refocus = () => {
      if (!isLoading) inputRef.current?.focus();
    };
    document.addEventListener("click", refocus);
    return () => document.removeEventListener("click", refocus);
  }, [isLoading]);

  const validateAndProceed = useCallback(
    async (qrValue) => {
      resetMutation();
      const encryptedQr = qrValue.trim();
      if (!encryptedQr) return;
      try {
        const res = await validateRaffle({
          campaignId: station.campaignId,
          encryptedQr,
        });
        const entry = res.data;
        onNext({
          raffleEntryId: entry.raffleEntryId,
          participantId: entry.participantId,
          fullName: entry.fullName,
          totalPoints: entry.totalPoints,
        });
      } catch {
        setIsScanning(false);
      }
    },
    [validateRaffle, resetMutation, station.campaignId, onNext],
  );

  const handleChange = (e) => {
    setInput(e.target.value);
    if (e.target.value.length > 0) setIsScanning(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsScanning(false);
      validateAndProceed(input);
      setInput("");
    }
  };

  const handleRetry = () => {
    resetMutation();
    setInput("");
    setIsScanning(false);
  };

  const apiError = error?.response?.data?.message || error?.message;

  // Derive which screen to show — no AnimatePresence mode="wait" so transitions are instant
  const screen = isLoading ? "loading" : apiError ? "error" : "ready";

  const t = useRT();
  const scanColor = t.isDark ? "#22d3ee" : t.primary;

  return (
    <div className="relative h-full flex flex-col items-center justify-center w-full max-w-md mx-auto px-6 z-10">
      {/* Hidden input — captures hardware QR scanner keystrokes */}
      <input
        ref={inputRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="sr-only"
        aria-label="QR code input"
        autoComplete="off"
        readOnly={isPending}
      />

      <AnimatePresence>
        {screen === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            <div className="relative flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2"
                  style={{ borderColor: scanColor, width: 80, height: 80 }}
                  animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                  transition={{
                    duration: 1.6,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl z-10"
                style={{
                  background: `linear-gradient(135deg, ${scanColor}, #3b82f6)`,
                }}
              >
                <Loader2 size={36} className="text-white animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black" style={{ color: t.text }}>
                {isPending ? "Validating…" : "Scanning…"}
              </h2>
              <p className="text-sm" style={{ color: t.muted }}>
                {isPending
                  ? "Checking QR code, please wait."
                  : "Reading QR code data…"}
              </p>
            </div>

            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: t.pill }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${scanColor}, #3b82f6)`,
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.0,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        ) : screen === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-5 w-full text-center"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
            >
              <X size={36} className="text-red-400" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black" style={{ color: t.text }}>
                Scan Failed
              </h2>
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {apiError}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRetry}
              className="w-full text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: `linear-gradient(to right, ${scanColor}, #3b82f6)`,
              }}
            >
              <RotateCcw size={20} /> Try Again
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            {/* Animated scan frame */}
            <div className="relative w-44 h-44">
              <div
                className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl"
                style={{ borderColor: scanColor }}
              />
              <div
                className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl"
                style={{ borderColor: scanColor }}
              />
              <div
                className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl"
                style={{ borderColor: scanColor }}
              />
              <div
                className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl"
                style={{ borderColor: scanColor }}
              />

              <motion.div
                animate={{ y: [0, 144, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-2 right-2 top-2 h-0.5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${scanColor}, ${scanColor}, transparent)`,
                  boxShadow: `0 0 10px 2px ${scanColor}99`,
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ScanLine size={52} style={{ color: `${scanColor}99` }} />
                </motion.div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black" style={{ color: t.text }}>
                Ready to Scan
              </h2>
              <p className="text-sm" style={{ color: t.muted }}>
                Present the visitor's QR code to the scanner.
              </p>
            </div>

            <div
              className="flex items-center gap-2 rounded-full px-5 py-2"
              style={{
                background: t.pill,
                border: `1px solid ${t.pillBorder}`,
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: t.muted }}
              >
                Scanner active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Prize Reveal Overlay ─────────────────────────────────────────────────────

const RAYS = Array.from({ length: 12 }, (_, i) => i);

const PrizeReveal = ({ winner, isWin, recording, spinApiError, onDismiss }) => {
  const prizeColor = isWin ? "#FFD700" : "#A855F7";
  const prizeColor2 = isWin ? "#FF6B00" : "#6366F1";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Rotating light rays */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {RAYS.map((i) => (
          <div
            key={i}
            className="absolute origin-bottom"
            style={{
              width: 2,
              height: "55vh",
              bottom: "50%",
              left: "calc(50% - 1px)",
              transform: `rotate(${i * 30}deg)`,
              background: `linear-gradient(to top, ${isWin ? "rgba(255,215,0,0.25)" : "rgba(168,85,247,0.15)"}, transparent)`,
            }}
          />
        ))}
      </motion.div>

      {/* Confetti for wins */}
      {isWin ? <Confetti /> : null}

      {/* Outer glow ring */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${prizeColor}33 0%, transparent 70%)`,
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.5, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
        className="relative z-10 flex flex-col items-center gap-4 px-8 py-10 mx-6 rounded-3xl text-center max-w-sm w-full"
        style={{
          background: isWin
            ? "linear-gradient(135deg, #1a1000 0%, #2d1a00 50%, #1a0d00 100%)"
            : "linear-gradient(135deg, #0f0a1a 0%, #1a0d2e 100%)",
          border: `2px solid ${prizeColor}55`,
          boxShadow: `0 0 60px ${prizeColor}44, 0 0 120px ${prizeColor}22`,
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.25 }}
          className="text-6xl"
        >
          {isWin ? "🏆" : "🎲"}
        </motion.div>

        {/* Result label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-xs font-black uppercase tracking-[0.3em]"
          style={{ color: prizeColor }}
        >
          {isWin ? "Grand Prize!" : "Result"}
        </motion.p>

        {/* Prize name */}
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
          className="font-black leading-tight"
          style={{
            fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
            background: `linear-gradient(135deg, ${prizeColor}, ${prizeColor2})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 12px ${prizeColor}88)`,
          }}
        >
          {winner?.prizeName}
        </motion.h2>

        {/* Description */}
        {winner?.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-white/50 text-sm"
          >
            {winner.description}
          </motion.p>
        )}

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex items-center gap-2 text-sm"
          style={{ color: isWin ? "#86efac" : "#94a3b8" }}
        >
          {recording ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Recording result…</span>
            </>
          ) : (
            <>
              <CheckCircle size={15} />
              <span>{isWin ? "Prize claimed!" : "Result recorded"}</span>
            </>
          )}
        </motion.div>

        {spinApiError && (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1 text-center">
              {spinApiError}
            </p>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl font-black text-sm text-white"
              style={{
                background: "linear-gradient(135deg, #ec4899, #f97316)",
              }}
            >
              <RotateCcw size={14} className="inline mr-1.5 -mt-0.5" />
              Next Visitor
            </button>
          </div>
        )}

        {/* Decorative bottom glow bar */}
        <div
          className="absolute bottom-0 left-8 right-8 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${prizeColor}, transparent)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// ─── Step: Spin Wheel ─────────────────────────────────────────────────────────

const SpinStep = ({ participant, station, onNext, onReset }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showReveal, setShowReveal] = useState(false);
  const [spinIsWin, setSpinIsWin] = useState(false);

  const { data: prizesData, isLoading: loadingPrizes } =
    useGetCampaignPrizesPublic(station.campaignId);

  const prizes = prizesData?.data?.prizes ?? [];

  const {
    mutateAsync: recordSpin,
    isPending: recording,
    error: spinError,
  } = useSpinWheel();

  // Build react-custom-roulette data array with vibrant colors
  const wheelData = prizes.map((p, i) => ({
    option: p.prizeName,
    style: {
      backgroundColor: WHEEL_COLORS[i % WHEEL_COLORS.length],
      textColor: "#FFFFFF",
    },
  }));

  // If no prizes have isPool set, treat all prizes as eligible winners
  const hasPool = prizes.some((p) => p.isPool);
  const eligiblePool = hasPool ? prizes.filter((p) => p.isPool) : prizes;

  const handleSpin = () => {
    if (mustSpin || winner || !prizes.length) return;
    const picked =
      eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    const idx = prizes.findIndex((p) => p.id === picked.id);
    setPrizeNumber(idx);
    setMustSpin(true);
  };

  // Auto-claim: fires as soon as wheel stops
  const handleStopSpinning = useCallback(async () => {
    setMustSpin(false);
    const w = prizes[prizeNumber];
    setWinner(w);
    setShowReveal(true);

    const isWin = hasPool ? !!w.isPool : true;
    setSpinIsWin(isWin);
    try {
      const res = await recordSpin({
        campaignId: station.campaignId,
        raffleEntryId: String(participant.raffleEntryId),
        prizeId: isWin ? w.id : null,
        wheelResult: isWin ? w.prizeName : "No Prize",
        claimedBy: station.staffName || undefined,
      });
      // Brief celebration delay, then advance
      setTimeout(
        () => {
          onNext({
            outcome: res.data.outcome,
            prize: res.data.prize,
            prizeName: isWin ? w.prizeName : "No Prize",
            winner: w,
          });
        },
        isWin ? 3500 : 2200,
      );
    } catch {
      // spinError state handles display; user can still see the overlay
    }
  }, [prizes, prizeNumber, recordSpin, station, participant, onNext]);

  const spinApiError = spinError?.response?.data?.message || spinError?.message;

  const t = useRT();

  return (
    <div className="relative h-full flex items-center justify-center gap-6 px-8 z-10 w-full max-w-6xl mx-auto">
      {/* ── Left: Participant info + Spin button ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-w-0">
        {/* Participant card */}
        {participant.fullName && (
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full rounded-3xl px-6 py-6 text-center backdrop-blur-sm"
            style={{
              background: t.card,
              border: `1px solid ${t.primaryBorder}`,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: t.primary }}
            >
              🎟 Participant
            </p>
            <p
              className="font-black text-2xl leading-tight"
              style={{ color: t.text }}
            >
              {participant.fullName}
            </p>
            <p className="text-base font-bold mt-1 text-yellow-500">
              ⭐ {participant.totalPoints} pts
            </p>
          </motion.div>
        )}

        <motion.h2
          animate={{ scale: mustSpin ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: mustSpin ? Infinity : 0 }}
          className="text-4xl font-black text-center drop-shadow-lg"
          style={{ color: t.text }}
        >
          🎡 Spin to Win!
        </motion.h2>

        <p className="text-sm text-center" style={{ color: t.muted }}>
          {mustSpin
            ? "Spinning…"
            : winner
              ? "Result recorded!"
              : "Press the button to spin the wheel!"}
        </p>

        {loadingPrizes ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="animate-spin"
              style={{ color: t.primary }}
              size={36}
            />
            <p className="text-sm" style={{ color: t.muted }}>
              Loading prizes…
            </p>
          </div>
        ) : wheelData.length === 0 ? (
          <p className="text-sm text-center" style={{ color: t.muted }}>
            No prizes configured for this campaign.
          </p>
        ) : (
          <motion.button
            onClick={handleSpin}
            disabled={mustSpin || !!winner}
            whileHover={!mustSpin && !winner ? { scale: 1.05 } : {}}
            whileTap={!mustSpin && !winner ? { scale: 0.95 } : {}}
            animate={
              !mustSpin && !winner
                ? {
                    boxShadow: [
                      `0 0 20px ${t.primary}66`,
                      `0 0 40px ${t.primary}99`,
                      `0 0 20px ${t.primary}66`,
                    ],
                  }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-full text-white rounded-2xl py-5 font-black text-2xl disabled:opacity-60 shadow-xl tracking-wider"
            style={{
              background: `linear-gradient(to right, ${t.primary}, #f59e0b, #facc15)`,
            }}
            aria-label="Spin the wheel"
          >
            {mustSpin ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={24} /> Spinning…
              </span>
            ) : (
              "🎰 SPIN!"
            )}
          </motion.button>
        )}
      </div>

      {/* ── Right: Wheel ── */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        {loadingPrizes ? (
          <div
            className="w-72 h-72 rounded-full flex items-center justify-center"
            style={{ background: t.pill, border: `1px solid ${t.pillBorder}` }}
          >
            <Loader2
              className="animate-spin"
              style={{ color: t.primary }}
              size={48}
            />
          </div>
        ) : wheelData.length > 0 ? (
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-110"
              style={{
                background: `linear-gradient(to right, ${t.primary}, #facc15, #a855f7)`,
              }}
            />
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              onStopSpinning={handleStopSpinning}
              backgroundColors={WHEEL_COLORS}
              textColors={["#FFFFFF"]}
              outerBorderColor="#ffffff"
              outerBorderWidth={6}
              innerBorderColor="#ffffff"
              innerBorderWidth={3}
              radiusLineColor="#ffffff"
              radiusLineWidth={2}
              spinDuration={0.8}
              fontSize={13}
              pointerProps={{
                style: { filter: "drop-shadow(0 0 6px rgba(255,200,0,0.8))" },
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Prize reveal overlay */}
      <AnimatePresence>
        {showReveal && winner && (
          <PrizeReveal
            winner={winner}
            isWin={spinIsWin}
            recording={recording}
            spinApiError={spinApiError}
            onDismiss={onReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Step: Done ───────────────────────────────────────────────────────────────

const DoneStep = ({ outcome, prizeName, onReset }) => {
  const isWin = outcome === "won";
  const [showConfetti, setShowConfetti] = useState(isWin);

  useEffect(() => {
    if (isWin) {
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isWin]);

  const t = useRT();

  return (
    <>
      {showConfetti ? <Confetti /> : null}
      <div className="relative h-full flex items-center justify-center z-10 w-full px-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden text-center px-10 py-12 flex flex-col items-center gap-6"
          style={{
            background: isWin
              ? t.isDark
                ? "linear-gradient(135deg,#1a1000,#2d1a00,#1a0d00)"
                : "linear-gradient(135deg,#fffbf0,#fff7ee)"
              : t.isDark
                ? "linear-gradient(135deg,#0f0a1a,#1a0d2e)"
                : t.card,
            border: isWin
              ? "1px solid rgba(255,200,0,0.3)"
              : `1px solid ${t.primaryBorder}`,
            boxShadow: isWin
              ? "0 0 80px rgba(255,200,0,0.2), 0 0 160px rgba(255,100,0,0.1)"
              : "0 0 60px rgba(99,102,241,0.15)",
          }}
        >
          {/* Animated glow blob behind icon */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: isWin
                ? "radial-gradient(circle, rgba(255,200,0,0.35) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
            }}
          />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 14,
              delay: 0.1,
            }}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl ${
              isWin
                ? "bg-linear-to-br from-yellow-300 to-orange-500 shadow-yellow-400/50"
                : "bg-linear-to-br from-slate-600 to-slate-800"
            }`}
          >
            {isWin ? (
              <Gift size={52} className="text-white drop-shadow-lg" />
            ) : (
              <Star size={52} className="text-white/50" />
            )}
          </motion.div>

          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xs font-black uppercase tracking-[0.3em]"
            style={{ color: isWin ? "#FFD700" : "#818cf8" }}
          >
            {isWin ? "Prize Claimed!" : "Result Recorded"}
          </motion.p>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="font-black leading-tight"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              background: isWin
                ? "linear-gradient(135deg, #FFD700, #FF6B00)"
                : "linear-gradient(135deg, #c4b5fd, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isWin ? "🎉 Congratulations!" : "Better Luck Next Time!"}
          </motion.h2>

          {/* Sub-text */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-lg leading-relaxed"
            style={{ color: t.muted }}
          >
            {isWin ? (
              <>
                Hand the visitor their{" "}
                <span className="text-yellow-400 font-black">{prizeName}</span>.{" "}
                🎊
              </>
            ) : (
              "Thank the visitor for participating!"
            )}
          </motion.p>

          {/* Divider */}
          <div
            className="w-full h-px rounded-full"
            style={{
              background: isWin
                ? "linear-gradient(90deg, transparent, rgba(255,200,0,0.4), transparent)"
                : "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
            }}
          />

          {/* Button */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onReset}
            className="w-full bg-linear-to-r from-pink-500 via-fuchsia-500 to-orange-400 text-white rounded-2xl py-4 font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
            aria-label="Next visitor"
          >
            <RotateCcw size={22} /> Next Visitor
          </motion.button>
        </motion.div>
      </div>
    </>
  );
};

// ─── Survey: build answer payload entry ──────────────────────────────────────

const buildAnswerEntry = (question, value) => {
  if (value === null || value === undefined || value === "") return null;
  const entry = { questionId: question.id };
  switch (question.questionType) {
    case "single_choice":
    case "dropdown":
    case "boolean":
    case "likert":
      entry.answerOptionId = value;
      break;
    case "rating":
    case "number":
      entry.answerNumeric = Number(value);
      break;
    case "text":
    case "long_text":
      entry.answerText = String(value).trim();
      break;
    case "date":
      entry.answerDate = value;
      break;
    case "multiple_choice":
      if (!Array.isArray(value) || !value.length) return null;
      entry.answerJson = value.map((id) => ({ optionId: id }));
      break;
    case "ranking":
      if (!Array.isArray(value) || !value.length) return null;
      entry.answerJson = value.map((optionId, i) => ({
        optionId,
        rank: i + 1,
      }));
      break;
    case "matrix":
      if (!Array.isArray(value) || !value.length) return null;
      entry.answerJson = value;
      break;
    default:
      return null;
  }
  return entry;
};

// ─── Survey: question renderers ───────────────────────────────────────────────

const SurveyQuestion = ({ question, value, onChange, error }) => {
  const t = useRT();

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${error ? "#f87171" : t.inputBorder}`,
    color: t.text,
    outline: "none",
    width: "100%",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
  };

  const optionBtn = (selected, label, onClick) => (
    <button
      key={label}
      onClick={onClick}
      className="text-left rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98]"
      style={
        selected
          ? {
              background: t.primary,
              color: "#fff",
              border: `1px solid ${t.primary}`,
            }
          : {
              background: t.inputBg,
              color: t.text,
              border: `1px solid ${t.inputBorder}`,
            }
      }
    >
      {label}
    </button>
  );

  const {
    questionType: qt,
    options = [],
    matrixRows = [],
    validationRules,
  } = question;

  if (qt === "single_choice" || qt === "dropdown" || qt === "likert") {
    return (
      <div
        className={`flex ${qt === "likert" ? "flex-row flex-wrap" : "flex-col"} gap-2`}
      >
        {options.map((o) =>
          optionBtn(value === o.id, o.optionText, () => onChange(o.id)),
        )}
      </div>
    );
  }

  if (qt === "boolean") {
    return (
      <div className="flex gap-3">
        {options.map((o) =>
          optionBtn(value === o.id, o.optionText, () => onChange(o.id)),
        )}
      </div>
    );
  }

  if (qt === "multiple_choice") {
    const selected = value ?? [];
    return (
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const checked = selected.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() =>
                onChange(
                  checked
                    ? selected.filter((id) => id !== o.id)
                    : [...selected, o.id],
                )
              }
              className="flex items-center gap-3 text-left rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={
                checked
                  ? {
                      background: t.primary + "22",
                      color: t.text,
                      border: `1px solid ${t.primary}`,
                    }
                  : {
                      background: t.inputBg,
                      color: t.text,
                      border: `1px solid ${t.inputBorder}`,
                    }
              }
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={{
                  background: checked ? t.primary : "transparent",
                  border: `2px solid ${checked ? t.primary : t.inputBorder}`,
                }}
              >
                {checked ? (
                  <CheckCircle size={10} className="text-white" />
                ) : null}
              </div>
              {o.optionText}
            </button>
          );
        })}
      </div>
    );
  }

  if (qt === "text") {
    return (
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={validationRules?.maxLength}
        placeholder="Type your answer…"
        style={inputStyle}
      />
    );
  }

  if (qt === "long_text") {
    const max = validationRules?.maxLength;
    const len = (value ?? "").length;
    return (
      <div>
        <textarea
          rows={4}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={max}
          placeholder="Type your answer…"
          style={{ ...inputStyle, resize: "vertical" }}
        />
        {max && (
          <p className="text-xs mt-1 text-right" style={{ color: t.muted }}>
            {len}/{max}
          </p>
        )}
      </div>
    );
  }

  if (qt === "number") {
    return (
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        min={validationRules?.min}
        max={validationRules?.max}
        placeholder={
          validationRules
            ? `${validationRules.min ?? ""}–${validationRules.max ?? ""}`
            : "Enter number"
        }
        style={inputStyle}
      />
    );
  }

  if (qt === "date") {
    return (
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    );
  }

  if (qt === "rating") {
    const min = validationRules?.min ?? 1;
    const max = validationRules?.max ?? 5;
    const stars = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    return (
      <div className="flex gap-2 flex-wrap">
        {stars.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="text-2xl transition-transform active:scale-90"
            style={{ opacity: value && n > value ? 0.3 : 1 }}
          >
            ★
          </button>
        ))}
        {value && (
          <span className="text-sm self-center ml-1" style={{ color: t.muted }}>
            {value}/{max}
          </span>
        )}
      </div>
    );
  }

  if (qt === "ranking") {
    const ranked = value ?? options.map((o) => o.id);
    const move = (from, to) => {
      const arr = [...ranked];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      onChange(arr);
    };
    return (
      <div className="space-y-2">
        {ranked.map((optId, idx) => {
          const opt = options.find((o) => o.id === optId);
          return (
            <div
              key={optId}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
              }}
            >
              <span
                className="text-xs font-black w-5 text-center"
                style={{ color: t.primary }}
              >
                {idx + 1}
              </span>
              <span className="flex-1 text-sm" style={{ color: t.text }}>
                {opt?.optionText}
              </span>
              <div className="flex flex-col">
                <button
                  disabled={idx === 0}
                  onClick={() => move(idx, idx - 1)}
                  style={{ color: idx === 0 ? t.muted : t.primary }}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  disabled={idx === ranked.length - 1}
                  onClick={() => move(idx, idx + 1)}
                  style={{
                    color: idx === ranked.length - 1 ? t.muted : t.primary,
                  }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (qt === "matrix") {
    const current = value ?? [];
    const getRowAnswer = (rowId) =>
      current.find((a) => a.rowId === rowId)?.optionId ?? null;
    const setRowAnswer = (rowId, optionId) => {
      const rest = current.filter((a) => a.rowId !== rowId);
      onChange([...rest, { rowId, optionId }]);
    };
    return (
      <div className="overflow-x-auto">
        <table
          className="w-full text-xs"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          <thead>
            <tr>
              <th
                className="text-left pb-2 pr-4"
                style={{ color: t.muted, fontWeight: 600 }}
              >
                &nbsp;
              </th>
              {options.map((o) => (
                <th
                  key={o.id}
                  className="pb-2 px-2 text-center"
                  style={{ color: t.muted, fontWeight: 600, minWidth: 64 }}
                >
                  {o.optionText}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row, ri) => (
              <tr
                key={row.id}
                style={{ background: ri % 2 === 0 ? t.inputBg : "transparent" }}
              >
                <td
                  className="py-2 pr-4 rounded-l-lg text-sm"
                  style={{ color: t.text }}
                >
                  {row.rowText}
                </td>
                {options.map((o) => (
                  <td key={o.id} className="py-2 px-2 text-center">
                    <button
                      onClick={() => setRowAnswer(row.id, o.id)}
                      className="w-5 h-5 rounded-full border-2 mx-auto flex items-center justify-center transition-all"
                      style={
                        getRowAnswer(row.id) === o.id
                          ? { borderColor: t.primary, background: t.primary }
                          : {
                              borderColor: t.inputBorder,
                              background: "transparent",
                            }
                      }
                    >
                      {getRowAnswer(row.id) === o.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

// ─── Step: Survey ─────────────────────────────────────────────────────────────

const SurveyStep = ({ participant, station, onNext }) => {
  const t = useRT();
  const [checking, setChecking] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // On mount: check for active raffle_entry survey, check response status
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await getActiveSurveyApi(
          station.campaignId,
          "raffle_entry",
        );
        if (cancelled) return;
        if (!res?.data?.hasSurvey || !res.data.survey?.questions?.length) {
          onNext();
          return;
        }
        const s = res.data.survey;
        const statusRes = await checkSurveyResponseStatusApi(
          station.campaignId,
          s.id,
          participant.participantId,
        );
        if (cancelled) return;
        if (statusRes?.data?.hasResponded && statusRes.data.isComplete) {
          onNext();
          return;
        }
        setSurvey(s);
        setAnswers(
          Object.fromEntries(
            s.questions
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((q) => [
                q.id,
                q.questionType === "ranking"
                  ? q.options.map((o) => o.id)
                  : null,
              ]),
          ),
        );
      } catch {
        // On any error skip survey
        if (!cancelled) onNext();
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: null }));
  };

  const visibleQuestions = survey
    ? survey.questions
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .filter((q) => {
          if (!q.conditionalLogic?.showIf) return true;
          const { questionId, optionId, answerValue } =
            q.conditionalLogic.showIf;
          if (optionId !== undefined) return answers[questionId] === optionId;
          if (answerValue !== undefined)
            return String(answers[questionId]) === String(answerValue);
          return true;
        })
    : [];

  const validate = () => {
    const errs = {};
    for (const q of visibleQuestions) {
      if (!q.isRequired) continue;
      const ans = answers[q.id];
      if (ans === null || ans === undefined || ans === "") {
        errs[q.id] = "Required";
        continue;
      }
      if (Array.isArray(ans) && ans.length === 0) {
        errs[q.id] = "Please select at least one option.";
        continue;
      }
      if (q.questionType === "matrix") {
        const answeredRowIds = new Set((ans ?? []).map((a) => a.rowId));
        if (q.matrixRows.some((r) => !answeredRowIds.has(r.id)))
          errs[q.id] = "Please answer all rows.";
      }
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitSurveyApi({
        campaignId: station.campaignId,
        surveyId: survey.id,
        participantId: participant.participantId,
        scanLogId: null,
        answers: visibleQuestions
          .map((q) => buildAnswerEntry(q, answers[q.id]))
          .filter(Boolean),
      });
      onNext();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Submission failed. Please try again.";
      const match = msg.match(/question ID\(s\): ([\d, ]+)/);
      if (match) {
        const ids = new Set(
          match[1].split(",").map((id) => parseInt(id.trim(), 10)),
        );
        const fieldErrs = {};
        visibleQuestions
          .filter((q) => ids.has(q.id))
          .forEach((q) => {
            fieldErrs[q.id] = "This question is required.";
          });
        setErrors(fieldErrs);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Checking for survey
  if (checking) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center gap-4 z-10">
        <div className="relative flex items-center justify-center">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{ borderColor: t.primary, width: 64, height: 64 }}
              animate={{ scale: [1, 2], opacity: [0.6, 0] }}
              transition={{
                duration: 1.4,
                delay: i * 0.6,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center z-10"
            style={{
              background: `linear-gradient(135deg, ${t.primary}, #f59e0b)`,
            }}
          >
            <ClipboardList size={28} className="text-white" />
          </div>
        </div>
        <p className="text-sm font-semibold" style={{ color: t.muted }}>
          Checking for survey…
        </p>
      </div>
    );
  }

  // No survey — shouldn't render (onNext called), but safety fallback
  if (!survey) return null;

  return (
    <div className="relative h-full flex items-center justify-center z-10 px-6 py-4 overflow-hidden">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: t.card,
          border: `1px solid ${t.primaryBorder}`,
          maxHeight: "calc(100vh - 140px)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${t.primaryBorder}` }}
        >
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList size={18} style={{ color: t.primary }} />
              <h2 className="font-black text-lg" style={{ color: t.text }}>
                {survey.surveyName}
              </h2>
            </div>
            {survey.description && (
              <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                {survey.description}
              </p>
            )}
          </div>
          <span
            className="shrink-0 text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: t.primaryBg, color: t.primary }}
          >
            {visibleQuestions.length} question
            {visibleQuestions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Questions — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {visibleQuestions.map((q, idx) => (
            <div key={q.id}>
              <div className="flex items-start gap-2 mb-3">
                <span
                  className="shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center mt-0.5"
                  style={{
                    background: errors[q.id] ? "#fca5a522" : t.primaryBg,
                    color: errors[q.id] ? "#f87171" : t.primary,
                  }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: t.text }}
                  >
                    {q.questionText}
                    {q.isRequired ? (
                      <span className="text-red-400 ml-1">*</span>
                    ) : null}
                  </p>
                  {errors[q.id] && (
                    <p className="text-xs text-red-400 mt-0.5">
                      {errors[q.id]}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-8">
                <SurveyQuestion
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                  error={!!errors[q.id]}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-6 py-4 flex items-center gap-3"
          style={{ borderTop: `1px solid ${t.primaryBorder}` }}
        >
          {!survey.isRequired && (
            <button
              onClick={onNext}
              className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-95"
              style={{
                background: t.pill,
                color: t.muted,
                border: `1px solid ${t.pillBorder}`,
              }}
            >
              Skip
            </button>
          )}
          {submitError && (
            <p className="flex-1 text-xs text-red-400 text-center bg-red-500/10 rounded-xl px-3 py-2">
              {submitError}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 text-white rounded-2xl py-3 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all shadow-lg"
            style={{
              background: `linear-gradient(to right, ${t.primary}, #f59e0b)`,
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting…
              </>
            ) : (
              <>Submit & Continue</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Step progress indicator ─────────────────────────────────────────────────

const StepIndicator = ({ currentStep }) => {
  const t = useRT();
  const labels = ["Scan", "Survey", "Spin", "Done"];
  const icons = ["📷", "📋", "🎡", "🏆"];
  const currentIndex = STEPS.indexOf(currentStep);
  return (
    <div className="shrink-0 flex items-center justify-center gap-2 py-2 relative z-10">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center">
          <motion.div
            animate={
              i === currentIndex ? { scale: [1, 1.15, 1] } : { scale: 1 }
            }
            transition={{ duration: 1, repeat: Infinity }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all shadow-md"
              style={
                i < currentIndex
                  ? {
                      background: "linear-gradient(135deg, #4ade80, #10b981)",
                      color: "#fff",
                    }
                  : i === currentIndex
                    ? {
                        background: `linear-gradient(135deg, ${t.primary}, #f59e0b)`,
                        color: "#fff",
                        boxShadow: `0 0 12px ${t.primary}66`,
                        outline: `2px solid ${t.primaryBorder}`,
                      }
                    : { background: t.pill, color: t.muted }
              }
            >
              {i < currentIndex ? <CheckCircle size={16} /> : icons[i]}
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: i === currentIndex ? t.text : t.muted }}
            >
              {label}
            </span>
          </motion.div>
          {i < labels.length - 1 && (
            <div
              className="w-10 h-1 mx-2 mb-4 rounded-full transition-all"
              style={{
                background:
                  i < currentIndex
                    ? "linear-gradient(to right, #4ade80, #10b981)"
                    : t.pill,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Main Redeem Portal ───────────────────────────────────────────────────────

const RedeemPortal = () => {
  const [station, setStation] = useState(() => loadStation());
  const [step, setStep] = useState("scan");
  const [sessionData, setSessionData] = useState({});

  const [isDark, setIsDark] = useState(
    () => (localStorage.getItem(REDEEM_THEME_KEY) ?? "light") !== "light",
  );
  const t = isDark ? DARK : LIGHT;
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(REDEEM_THEME_KEY, next ? "dark" : "light");
  };

  const advance = (newData) => {
    setSessionData((prev) => ({ ...prev, ...newData }));
    const nextIndex = STEPS.indexOf(step) + 1;
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex]);
  };

  const reset = () => {
    setStep("scan");
    setSessionData({});
  };

  const handleChangeStation = () => {
    clearStation();
    setStation(null);
    reset();
  };

  if (!station) {
    return (
      <ThemeCtx.Provider value={t}>
        <div
          className="h-screen flex flex-col overflow-hidden"
          style={{ background: t.bgGradient }}
        >
          {isDark ? <FloatingParticles /> : null}
          <div className="h-1 shrink-0" style={{ background: t.accentBar }} />
          <div
            className="shrink-0 px-6 py-4 backdrop-blur-sm relative z-10 flex items-center justify-between"
            style={{
              background: t.headerBg,
              borderBottom: `1px solid ${t.headerBorder}`,
            }}
          >
            <h1
              className="flex items-center gap-2 font-black text-lg tracking-wide"
              style={{ color: t.primary }}
            >
              <img
                src={logo}
                style={{
                  width: 28,
                  height: 28,
                }}
              />
              Worldbex Scan2Win — Raffle Station
            </h1>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-base"
              style={{ background: t.pill }}
              aria-label="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <SetupScreen onSetup={setStation} />
          </div>
        </div>
      </ThemeCtx.Provider>
    );
  }

  return (
    <ThemeCtx.Provider value={t}>
      <div
        className="h-screen flex flex-col overflow-hidden"
        style={{ background: t.bgGradient }}
      >
        {isDark && <FloatingParticles />}

        {/* Top accent bar */}
        <div className="h-1 shrink-0" style={{ background: t.accentBar }} />

        {/* Header */}
        <div
          className="shrink-0 px-6 py-3 flex items-center justify-between backdrop-blur-sm relative z-10"
          style={{
            background: t.headerBg,
            borderBottom: `1px solid ${t.headerBorder}`,
          }}
        >
          <div>
            <h1
              className="font-black text-lg tracking-wide"
              style={{ color: t.primary }}
            >
              🎡 Worldbex Scan2Win
            </h1>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {station.campaignName} · {station.eventTag}
              {station.staffName ? ` · ${station.staffName}` : null}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {step !== "scan" && (
              <button
                onClick={reset}
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: t.muted }}
                aria-label="Reset for next visitor"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-base"
              style={{ background: t.pill }}
              aria-label="Toggle theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleChangeStation}
              className="flex items-center gap-1 transition-colors"
              style={{ color: t.muted }}
              aria-label="Change event"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        <StepIndicator currentStep={step} />

        {/* Step panels — fill remaining height, no scroll */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {step === "scan" ? (
                <ScanStep station={station} onNext={advance} />
              ) : step === "survey" ? (
                <SurveyStep
                  participant={sessionData}
                  station={station}
                  onNext={advance}
                />
              ) : step === "spin" ? (
                <SpinStep
                  participant={sessionData}
                  station={station}
                  onNext={advance}
                  onReset={reset}
                />
              ) : step === "done" ? (
                <DoneStep
                  outcome={sessionData.outcome}
                  prizeName={sessionData.prizeName}
                  onReset={reset}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
};

export default RedeemPortal;
