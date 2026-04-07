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

import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  useGetCampaignByEventTag,
  useGetCampaignPrizesPublic,
  useValidateRaffle,
  useSpinWheel,
} from "../../services/requests/useApi";

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

const STEPS = ["scan", "spin", "done"];

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

  return (
    <div className="relative flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-12 z-10">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/40"
      >
        <Settings size={40} className="text-white" />
      </motion.div>

      <div className="text-center">
        <h2 className="text-3xl font-black text-white">Station Setup</h2>
        <p className="text-white/50 text-sm mt-1">
          Enter the event tag to load the active raffle event.
        </p>
      </div>

      <div className="w-full space-y-3">
        <input
          value={eventTag}
          onChange={(e) => setEventTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Event tag (e.g. WORLDBEX2026)"
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-pink-400 focus:bg-white/15 transition-all uppercase backdrop-blur-sm"
          aria-label="Event tag"
        />
        <input
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="Staff name (optional)"
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-pink-400 focus:bg-white/15 transition-all backdrop-blur-sm"
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
        className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-pink-500/40"
        aria-label="Load event"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Loading…
          </>
        ) : (
          <>
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
    const refocus = () => { if (!isLoading) inputRef.current?.focus(); };
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

  return (
    <div className="relative flex flex-col items-center w-full max-w-md mx-auto px-6 py-10 z-10">
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
          /* ── Scanning / Validating state ── */
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-8 py-8 w-full"
          >
            {/* Pulsing rings */}
            <div className="relative flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2 border-cyan-400"
                  animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                  transition={{
                    duration: 1.6,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  style={{ width: 80, height: 80 }}
                />
              ))}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/40 z-10">
                <Loader2 size={36} className="text-white animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white">
                {isPending ? "Validating…" : "Scanning…"}
              </h2>
              <p className="text-white/50 text-sm">
                {isPending ? "Checking QR code, please wait." : "Reading QR code data…"}
              </p>
            </div>

            {/* Animated progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        ) : screen === "error" ? (
          /* ── Error state ── */
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-6 py-8 w-full text-center"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center"
            >
              <X size={36} className="text-red-400" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Scan Failed</h2>
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {apiError}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              <RotateCcw size={20} /> Try Again
            </motion.button>
          </motion.div>
        ) : (
          /* ── Ready state ── */
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col items-center gap-8 py-8 w-full"
          >
            {/* Animated scan frame */}
            <div className="relative w-52 h-52">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

              {/* Scan line */}
              <motion.div
                animate={{ y: [0, 176, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-2 right-2 top-2 h-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #22d3ee, #22d3ee, transparent)",
                  boxShadow: "0 0 10px 2px rgba(34,211,238,0.6)",
                }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ScanLine size={52} className="text-cyan-400/60" />
                </motion.div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white">Ready to Scan</h2>
              <p className="text-white/50 text-sm">
                Present the visitor's QR code to the scanner.
              </p>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-white/60 text-xs font-semibold tracking-wide">
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

const PrizeReveal = ({ winner, isWin, recording, spinApiError }) => {
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
      {isWin && <Confetti />}

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
          <p className="text-red-400 text-xs mt-1 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1">
            {spinApiError}
          </p>
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

const SpinStep = ({ participant, station, onNext }) => {
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
    const picked = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
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
      setTimeout(() => {
        onNext({
          outcome: res.data.outcome,
          prize: res.data.prize,
          prizeName: isWin ? w.prizeName : "No Prize",
          winner: w,
        });
      }, isWin ? 3500 : 2200);
    } catch {
      // spinError state handles display; user can still see the overlay
    }
  }, [prizes, prizeNumber, recordSpin, station, participant, onNext]);

  const spinApiError = spinError?.response?.data?.message || spinError?.message;

  return (
    <div className="relative flex flex-col items-center gap-5 w-full max-w-md mx-auto px-6 py-8 z-10">
      {/* Participant card */}
      {participant.fullName && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-2xl px-5 py-4 text-center backdrop-blur-sm"
        >
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-1">
            🎟 Participant
          </p>
          <p className="text-white font-black text-lg">{participant.fullName}</p>
          <p className="text-yellow-400 text-sm font-bold mt-0.5">
            ⭐ {participant.totalPoints} pts
          </p>
        </motion.div>
      )}

      <motion.h2
        animate={{ scale: mustSpin ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.5, repeat: mustSpin ? Infinity : 0 }}
        className="text-3xl font-black text-white text-center drop-shadow-lg"
      >
        🎡 Spin to Win!
      </motion.h2>

      {loadingPrizes ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin text-pink-400" size={40} />
          <p className="text-white/50 text-sm">Loading prizes…</p>
        </div>
      ) : wheelData.length === 0 ? (
        <p className="text-white/50 text-sm text-center">
          No prizes configured for this campaign.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Wheel glow ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500 blur-xl opacity-40 scale-105" />
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

          <motion.button
            onClick={handleSpin}
            disabled={mustSpin || !!winner}
            whileHover={!mustSpin && !winner ? { scale: 1.05 } : {}}
            whileTap={!mustSpin && !winner ? { scale: 0.95 } : {}}
            animate={
              !mustSpin && !winner
                ? {
                    boxShadow: [
                      "0 0 20px rgba(233,69,96,0.4)",
                      "0 0 40px rgba(245,166,35,0.6)",
                      "0 0 20px rgba(233,69,96,0.4)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 text-white rounded-2xl py-5 font-black text-2xl disabled:opacity-60 shadow-xl tracking-wider"
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
        </div>
      )}

      {/* Prize reveal overlay */}
      <AnimatePresence>
        {showReveal && winner && (
          <PrizeReveal
            winner={winner}
            isWin={spinIsWin}
            recording={recording}
            spinApiError={spinApiError}
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

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="relative flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-12 text-center z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${
            isWin
              ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-400/50"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          }`}
        >
          {isWin ? (
            <Gift size={56} className="text-white" />
          ) : (
            <Star size={56} className="text-white/60" />
          )}
        </motion.div>

        {isWin && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute top-8 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full border-4 border-dashed border-yellow-400/30"
          />
        )}

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-3xl font-black ${isWin ? "text-yellow-400" : "text-white"}`}
        >
          {isWin ? "🎉 Prize Claimed!" : "Better Luck Next Time!"}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-white/60 text-base"
        >
          {isWin ? (
            <>
              Hand the visitor their{" "}
              <span className="text-yellow-400 font-black">{prizeName}</span>.{" "}
              Congratulations! 🎊
            </>
          ) : (
            "Result recorded. Thank the visitor for participating!"
          )}
        </motion.p>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 mt-2 shadow-lg shadow-pink-500/30"
          aria-label="Next visitor"
        >
          <RotateCcw size={20} /> Next Visitor
        </motion.button>
      </div>
    </>
  );
};

// ─── Step progress indicator ─────────────────────────────────────────────────

const StepIndicator = ({ currentStep }) => {
  const labels = ["Scan", "Spin", "Done"];
  const icons = ["📷", "🎡", "🏆"];
  const currentIndex = STEPS.indexOf(currentStep);
  return (
    <div className="flex items-center justify-center gap-2 py-5 relative z-10">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center">
          <motion.div
            animate={
              i === currentIndex
                ? { scale: [1, 1.15, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 1, repeat: Infinity }}
            className={`flex flex-col items-center gap-1`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all shadow-md ${
                i < currentIndex
                  ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-400/40"
                  : i === currentIndex
                    ? "bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-pink-500/40 ring-2 ring-white/30"
                    : "bg-white/10 text-white/30"
              }`}
            >
              {i < currentIndex ? <CheckCircle size={16} /> : icons[i]}
            </div>
            <span
              className={`text-xs font-bold ${
                i === currentIndex ? "text-white" : "text-white/30"
              }`}
            >
              {label}
            </span>
          </motion.div>
          {i < labels.length - 1 && (
            <div
              className={`w-10 h-1 mx-2 mb-4 rounded-full transition-all ${
                i < currentIndex
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-white/10"
              }`}
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
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#1a0533] to-[#0D0D1A] text-white overflow-hidden">
        <FloatingParticles />
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500" />
        <div className="bg-black/30 border-b border-white/10 px-6 py-4 backdrop-blur-sm relative z-10">
          <h1 className="font-black text-lg tracking-wide bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
            🎡 Worldbex QR Quest — Raffle Station
          </h1>
        </div>
        <SetupScreen onSetup={setStation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1A] via-[#1a0533] to-[#0D0D1A] text-white overflow-hidden">
      <FloatingParticles />

      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500" />

      {/* Header */}
      <div className="bg-black/30 border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-sm relative z-10">
        <div>
          <h1 className="font-black text-lg tracking-wide bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
            🎡 Worldbex QR Quest
          </h1>
          <p className="text-white/40 text-xs mt-0.5">
            {station.campaignName} · {station.eventTag}
            {station.staffName && ` · ${station.staffName}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {step !== "scan" && (
            <button
              onClick={reset}
              className="text-white/40 text-xs flex items-center gap-1 hover:text-white/70 transition-colors"
              aria-label="Reset for next visitor"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <button
            onClick={handleChangeStation}
            className="text-white/40 text-xs flex items-center gap-1 hover:text-white/70 transition-colors"
            aria-label="Change event"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      <StepIndicator currentStep={step} />

      {/* Step panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {step === "scan" && <ScanStep station={station} onNext={advance} />}

          {step === "spin" && (
            <SpinStep
              participant={sessionData}
              station={station}
              onNext={advance}
            />
          )}

          {step === "done" && (
            <DoneStep
              outcome={sessionData.outcome}
              prizeName={sessionData.prizeName}
              onReset={reset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RedeemPortal;
