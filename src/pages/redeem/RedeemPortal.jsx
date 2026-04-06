// ============================================
// SCAN2WIN — Redeem Portal (Raffle Station)
// Worldbex Events "Scan to Win" Platform
//
// Route: /redeem
// Actor: Event staff at the raffle station
//
// Campaign Raffle API flow:
//   Setup   → Enter eventTag to load campaign (persisted in localStorage)
//   Step 5  POST /campaigns/:campaignId/validate-raffle  → validate visitor QR
//   Step 6  Wheel spin (client-side)
//   Step 7  POST /campaigns/:campaignId/spin-wheel       → record outcome
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, X, CheckCircle, RotateCcw, Loader2, Settings } from "lucide-react";
import {
  useGetCampaignByEventTag,
  useGetPrizes,
  useValidateRaffle,
  useSpinWheel,
} from "../../services/requests/useApi";

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STATION_KEY = "scan2win_station";

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

// ─── Prize wheel helper ────────────────────────────────────────────────────────

/** Pick a random winner from pool-eligible (isPool: 1) prizes */
const pickWinner = (prizes) => {
  const pool = prizes.filter((p) => p.isPool === 1);
  if (!pool.length) return prizes[0];
  return pool[Math.floor(Math.random() * pool.length)];
};

// ─── Campaign Setup Screen ────────────────────────────────────────────────────

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
      const station = { eventTag: submittedTag, campaignId: campaign.id, campaignName: campaign.campaignName, staffName };
      saveStation(station);
      onSetup(station);
    }
  }, [campaignData, submittedTag, staffName, onSetup]);

  const handleSubmit = () => {
    if (!eventTag.trim()) return;
    setSubmittedTag(eventTag.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-12">
      <Settings size={48} className="text-[#E94560]" />
      <h2 className="text-2xl font-black text-white text-center">Station Setup</h2>
      <p className="text-[#8892A4] text-sm text-center">
        Enter the event tag to load the active campaign for this raffle station.
      </p>

      <div className="w-full space-y-3">
        <input
          value={eventTag}
          onChange={(e) => setEventTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Event tag (e.g. WORLDBEX2026)"
          className="w-full bg-[#16213E] border border-[#E94560]/30 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560] uppercase"
          aria-label="Event tag"
        />
        <input
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="Staff name (optional)"
          className="w-full bg-[#16213E] border border-[#E94560]/30 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560]"
          aria-label="Staff name"
        />
      </div>

      {isError && (
        <p className="text-[#E94560] text-sm text-center">
          Campaign not found for <strong>{submittedTag}</strong>. Check the event tag and try again.
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!eventTag.trim() || isLoading}
        className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        aria-label="Load campaign"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Loading…
          </>
        ) : (
          "Load Campaign"
        )}
      </button>
    </div>
  );
};

// ─── Step: Scan & Validate ────────────────────────────────────────────────────

const ScanStep = ({ station, onNext }) => {
  const [input, setInput] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const {
    mutateAsync: validateRaffle,
    isPending,
    error,
    reset: resetMutation,
  } = useValidateRaffle();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraOpen(false);
  }, []);

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
        // error displayed via `error` state
      }
    },
    [validateRaffle, resetMutation, station.campaignId, onNext]
  );

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") validateAndProceed(input);
  };

  const startCamera = async () => {
    resetMutation();
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraOpen(false);
    }
  };

  useEffect(() => {
    if (!cameraOpen) return;
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
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        stopCamera();
        validateAndProceed(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraOpen, validateAndProceed, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const apiError = error?.response?.data?.message || error?.message;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-10">
      <ScanLine size={48} className="text-[#E94560]" />
      <h2 className="text-2xl font-black text-white text-center">
        Scan Visitor QR
      </h2>
      <p className="text-[#8892A4] text-sm text-center">
        Scan or paste the visitor's raffle QR code.
      </p>

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Scan or paste QR data here…"
        className="w-full bg-[#16213E] border border-[#E94560]/30 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560]"
        aria-label="QR code input"
      />

      {apiError && (
        <p className="text-[#E94560] text-sm text-center">{apiError}</p>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={startCamera}
          disabled={isPending}
          className="flex-1 bg-[#16213E] border border-[#E94560]/30 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
          aria-label="Open camera"
        >
          Camera
        </button>
        <button
          onClick={() => validateAndProceed(input)}
          disabled={!input.trim() || isPending}
          className="flex-1 bg-[#E94560] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          aria-label="Validate QR"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Validating…
            </>
          ) : (
            "Validate"
          )}
        </button>
      </div>

      {/* Camera overlay */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 text-white">
              <span className="font-bold">Scanning…</span>
              <button onClick={stopCamera} aria-label="Close camera">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Step: Spin Wheel ─────────────────────────────────────────────────────────

const SpinStep = ({ participant, station, prizes, onNext }) => {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);

  const { mutateAsync: recordSpin, isPending: recording, error: spinError } =
    useSpinWheel();

  const drawWheel = useCallback(
    (currentRotation = 0) => {
      const canvas = canvasRef.current;
      if (!canvas || !prizes.length) return;
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 8;
      const sliceAngle = (2 * Math.PI) / prizes.length;

      ctx.clearRect(0, 0, width, height);

      prizes.forEach((prize, i) => {
        const startAngle = currentRotation + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const isPool = prize.isPool === 1;
        const fill = isPool
          ? i % 2 === 0 ? "#E94560" : "#F5A623"
          : i % 2 === 0 ? "#16213E" : "#1A1A2E";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = "#0D0D1A";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.max(9, Math.floor(radius / prizes.length) + 4)}px DM Sans, sans-serif`;
        ctx.fillText(
          prize.name.length > 14 ? prize.name.slice(0, 13) + "…" : prize.name,
          radius - 10,
          5
        );
        ctx.restore();
      });

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "#0D0D1A";
      ctx.fill();

      // Pointer
      const pSize = 18;
      ctx.beginPath();
      ctx.moveTo(cx - pSize / 2, 0);
      ctx.lineTo(cx + pSize / 2, 0);
      ctx.lineTo(cx, pSize);
      ctx.closePath();
      ctx.fillStyle = "#E94560";
      ctx.fill();
    },
    [prizes]
  );

  useEffect(() => {
    drawWheel(rotation);
  }, [drawWheel, rotation]);

  const spin = () => {
    if (spinning || winner) return;
    setSpinning(true);

    const winnerPrize = pickWinner(prizes);
    const winnerIndex = prizes.findIndex((p) => p.id === winnerPrize.id);
    const sliceAngle = (2 * Math.PI) / prizes.length;
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const targetAngle =
      extraSpins * 2 * Math.PI +
      (2 * Math.PI - winnerIndex * sliceAngle - sliceAngle / 2);

    const duration = 4000;
    const start = performance.now();
    const startRot = rotation;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + targetAngle * eased;
      setRotation(currentRot);
      drawWheel(currentRot);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinner(winnerPrize);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleConfirm = async () => {
    // Determine prizeName: pool prizes win, non-pool prizes = "No Prize"
    const isWin = winner.isPool === 1;
    const prizeName = isWin ? winner.name : "No Prize";

    try {
      const res = await recordSpin({
        campaignId: station.campaignId,
        raffleEntryId: String(participant.raffleEntryId),
        prizeName,
        wheelResult: winner.name,
        claimedBy: station.staffName || undefined,
      });
      onNext({ outcome: res.data.outcome, prize: res.data.prize, prizeName, winner });
    } catch {
      // error shown via spinError
    }
  };

  const spinApiError = spinError?.response?.data?.message || spinError?.message;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-8">
      {/* Participant info */}
      {participant.fullName && (
        <div className="w-full bg-[#16213E] rounded-2xl px-4 py-3 text-center">
          <p className="text-[#8892A4] text-xs">Participant</p>
          <p className="text-white font-bold">{participant.fullName}</p>
          <p className="text-[#F5A623] text-xs mt-0.5">{participant.totalPoints} pts</p>
        </div>
      )}

      <h2 className="text-2xl font-black text-white text-center">Spin to Win!</h2>

      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-full shadow-2xl shadow-[#E94560]/20"
        aria-label="Prize wheel"
      />

      {!winner ? (
        <button
          onClick={spin}
          disabled={spinning}
          className="w-full bg-gradient-to-r from-[#E94560] to-[#F5A623] text-white rounded-2xl py-4 font-black text-lg disabled:opacity-60 shadow-lg shadow-[#E94560]/30"
          aria-label="Spin the wheel"
        >
          {spinning ? "Spinning…" : "SPIN!"}
        </button>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-[#16213E] border border-[#00D68F]/30 rounded-2xl p-5 text-center"
        >
          <p className="text-[#00D68F] text-xs font-bold mb-1">
            {winner.isPool === 1 ? "YOU WON!" : "RESULT"}
          </p>
          <p className="text-white text-xl font-black">{winner.name}</p>
          {winner.description && (
            <p className="text-[#8892A4] text-sm mt-1">{winner.description}</p>
          )}
          {spinApiError && (
            <p className="text-[#E94560] text-xs mt-2">{spinApiError}</p>
          )}
          <button
            onClick={handleConfirm}
            disabled={recording}
            className="mt-4 w-full bg-[#00D68F] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            aria-label="Confirm and record result"
          >
            {recording ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Recording…
              </>
            ) : (
              "Confirm Result"
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

// ─── Step: Done ───────────────────────────────────────────────────────────────

const DoneStep = ({ outcome, prizeName, onReset }) => {
  const isWin = outcome === "won";

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`w-24 h-24 rounded-full flex items-center justify-center ${
          isWin ? "bg-[#00D68F]/10" : "bg-[#16213E]"
        }`}
      >
        <CheckCircle
          size={48}
          className={isWin ? "text-[#00D68F]" : "text-[#8892A4]"}
        />
      </motion.div>
      <h2 className="text-2xl font-black text-white">
        {isWin ? "Prize Claimed!" : "Better Luck Next Time"}
      </h2>
      <p className="text-[#8892A4] text-sm">
        {isWin ? (
          <>
            Hand the visitor their{" "}
            <span className="text-white font-semibold">{prizeName}</span>.
          </>
        ) : (
          "Result recorded. Thank the visitor for participating."
        )}
      </p>
      <button
        onClick={onReset}
        className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 mt-4"
        aria-label="Next visitor"
      >
        <RotateCcw size={16} /> Next Visitor
      </button>
    </div>
  );
};

// ─── Step progress indicator ─────────────────────────────────────────────────

const StepIndicator = ({ currentStep }) => {
  const labels = ["Scan", "Spin", "Done"];
  const currentIndex = STEPS.indexOf(currentStep);
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < currentIndex
                ? "bg-[#00D68F] text-white"
                : i === currentIndex
                ? "bg-[#E94560] text-white"
                : "bg-[#16213E] text-[#8892A4]"
            }`}
          >
            {i < currentIndex ? <CheckCircle size={14} /> : i + 1}
          </div>
          {i < labels.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-1 rounded ${
                i < currentIndex ? "bg-[#00D68F]" : "bg-[#16213E]"
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
  const { data: prizesData } = useGetPrizes();
  const prizes = prizesData ?? [];

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

  // Show setup screen if no station is configured
  if (!station) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] text-white">
        <div className="bg-[#16213E] border-b border-[#E94560]/10 px-6 py-4">
          <h1 className="font-black text-lg tracking-wide">SCAN2WIN — Raffle Station</h1>
        </div>
        <SetupScreen onSetup={setStation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      {/* Header */}
      <div className="bg-[#16213E] border-b border-[#E94560]/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg tracking-wide">SCAN2WIN — Raffle</h1>
          <p className="text-[#8892A4] text-xs mt-0.5">
            {station.campaignName} · {station.eventTag}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {step !== "scan" && (
            <button
              onClick={reset}
              className="text-[#8892A4] text-xs flex items-center gap-1"
              aria-label="Reset for next visitor"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <button
            onClick={handleChangeStation}
            className="text-[#8892A4] text-xs flex items-center gap-1"
            aria-label="Change campaign"
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
          {step === "scan" && (
            <ScanStep station={station} onNext={advance} />
          )}

          {step === "spin" && prizes.length > 0 && (
            <SpinStep
              participant={sessionData}
              station={station}
              prizes={prizes}
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
