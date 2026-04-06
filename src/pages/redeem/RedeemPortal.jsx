// ============================================
// SCAN2WIN — Redeem Portal
// Worldbex Events "Scan to Win" Platform
//
// Route: /redeem
// Actor: Prize booth staff
//
// Step flow:
//   1. SCAN   — Input or camera-scan visitor's encrypted QR
//   2. SURVEY — Fill out event survey
//   3. SPIN   — Animated roulette wheel reveals prize
//   4. CLAIM  — POST /api/redeem → confirm prize redemption
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CryptoJS from "crypto-js";
import { ScanLine, ChevronRight, X, CheckCircle, RotateCcw } from "lucide-react";
import { SECRET_KEY, USE_MOCK, MOCK_DATA } from "../../lib/constants";
import {
  useGetPrizes,
  useGetSurveyQuestions,
  useRedeem,
} from "../../services/requests/useApi";

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ["scan", "survey", "roulette", "claim"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Decrypt the visitor's encrypted QR string */
const decryptQr = (qrData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(qrData, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
};

/** Pick a random winner from pool-eligible (isPool: 1) prizes */
const pickWinner = (prizes) => {
  const pool = prizes.filter((p) => p.isPool === 1);
  if (!pool.length) return prizes[0]; // Fallback if no pool prizes configured
  return pool[Math.floor(Math.random() * pool.length)];
};

// ─── Step 1: QR Scan ─────────────────────────────────────────────────────────

const QRInputStep = ({ onNext }) => {
  const [input, setInput] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  // Autofocus the text input (for hardware QR scanner devices)
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

  const validateAndProceed = (qrData) => {
    setError(null);
    const decrypted = decryptQr(qrData.trim());
    if (!decrypted || !decrypted.id || !decrypted.eventTag) {
      setError("Invalid or expired QR code. Please try again.");
      return;
    }
    onNext({ qrData: qrData.trim(), decrypted });
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") validateAndProceed(input);
  };

  // Camera-based scanning
  const startCamera = async () => {
    setError(null);
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
      setError("Camera access denied. Please allow camera permissions.");
      setCameraOpen(false);
    }
  };

  // Decode frames
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
  }, [cameraOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-10">
      <ScanLine size={48} className="text-[#E94560]" />
      <h2 className="text-2xl font-black text-white text-center">
        Scan Visitor QR
      </h2>
      <p className="text-[#8892A4] text-sm text-center">
        Use a hardware QR scanner or the camera to read the visitor's
        redemption QR code.
      </p>

      {/* Text input — works with USB QR scanner devices that act as keyboards */}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Scan or paste QR data here…"
        className="w-full bg-[#16213E] border border-[#E94560]/30 rounded-xl px-4 py-3 text-white text-sm placeholder-[#8892A4] outline-none focus:border-[#E94560]"
        aria-label="QR code input"
      />

      {error && (
        <p className="text-[#E94560] text-sm text-center">{error}</p>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={startCamera}
          className="flex-1 bg-[#16213E] border border-[#E94560]/30 text-white rounded-xl py-3 text-sm font-semibold"
          aria-label="Open camera scanner"
        >
          Camera
        </button>
        <button
          onClick={() => validateAndProceed(input)}
          disabled={!input}
          className="flex-1 bg-[#E94560] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40"
          aria-label="Validate QR code"
        >
          Validate
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

// ─── Step 2: Survey ───────────────────────────────────────────────────────────

const SurveyStep = ({ onNext }) => {
  const { data: questions = [], isLoading } = useGetSurveyQuestions();
  const [answers, setAnswers] = useState({});

  const allAnswered = questions.every((q) => answers[q.id]?.toString().trim());

  const setAnswer = (id, value) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#E94560] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 space-y-6">
      <h2 className="text-2xl font-black text-white">Quick Survey</h2>
      <p className="text-[#8892A4] text-sm">
        Please answer all questions before spinning.
      </p>

      {questions.map((q, idx) => (
        <div key={q.id} className="space-y-2">
          <p className="text-white text-sm font-semibold">
            {idx + 1}. {q.question}
          </p>

          {q.type === "text" && (
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              className="w-full bg-[#16213E] border border-[#E94560]/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#E94560]"
              placeholder="Your answer…"
              aria-label={q.question}
            />
          )}

          {q.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setAnswer(q.id, n.toString())}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                    answers[q.id] === n.toString()
                      ? "bg-[#E94560] text-white"
                      : "bg-[#16213E] text-[#8892A4]"
                  }`}
                  aria-label={`Rating ${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {q.type === "multiple_choice" && (
            <div className="space-y-2">
              {q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    answers[q.id] === opt
                      ? "bg-[#E94560] text-white font-semibold"
                      : "bg-[#16213E] text-[#8892A4]"
                  }`}
                  aria-label={opt}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => onNext({ surveyAnswers: answers })}
        disabled={!allAnswered}
        className="w-full bg-[#E94560] text-white rounded-xl py-4 font-black disabled:opacity-40 flex items-center justify-center gap-2"
        aria-label="Continue to roulette spin"
      >
        Spin the Wheel <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ─── Step 3: Roulette Spin ────────────────────────────────────────────────────

const RouletteStep = ({ prizes, onNext }) => {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);

  // Draw the wheel on the canvas
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

        // Alternate slice colors — pool prizes are brighter
        const isPool = prize.isPool === 1;
        const fill = isPool
          ? i % 2 === 0
            ? "#E94560"
            : "#F5A623"
          : i % 2 === 0
          ? "#16213E"
          : "#1A1A2E";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = "#0D0D1A";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
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

      // Pointer triangle at top
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

    // Calculate how many extra full rotations + land on winner slice
    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5–9 full rotations
    const targetAngle =
      extraSpins * 2 * Math.PI +
      (2 * Math.PI - winnerIndex * sliceAngle - sliceAngle / 2);

    const duration = 4000;
    const start = performance.now();
    const startRot = rotation;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
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

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-8">
      <h2 className="text-2xl font-black text-white text-center">
        Spin to Win!
      </h2>

      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-full shadow-2xl shadow-[#E94560]/20"
        aria-label="Roulette prize wheel"
      />

      {!winner ? (
        <button
          onClick={spin}
          disabled={spinning}
          className="w-full bg-gradient-to-r from-[#E94560] to-[#F5A623] text-white rounded-2xl py-4 font-black text-lg disabled:opacity-60 shadow-lg shadow-[#E94560]/30"
          aria-label="Spin the roulette wheel"
        >
          {spinning ? "Spinning…" : "SPIN!"}
        </button>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-[#16213E] border border-[#00D68F]/30 rounded-2xl p-5 text-center"
        >
          <p className="text-[#00D68F] text-xs font-bold mb-1">YOU WON!</p>
          <p className="text-white text-xl font-black">{winner.name}</p>
          <p className="text-[#8892A4] text-sm mt-1">{winner.description}</p>
          <button
            onClick={() => onNext({ winner })}
            className="mt-4 w-full bg-[#00D68F] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
            aria-label="Claim prize"
          >
            Claim Prize <ChevronRight size={18} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

// ─── Step 4: Claim ────────────────────────────────────────────────────────────

const ClaimStep = ({ qrData, surveyAnswers, winner, onReset }) => {
  const { mutateAsync: redeem, isPending, isSuccess, isError, error } = useRedeem();
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    try {
      await redeem({
        qrData,
        surveyAnswers,
        prizeId: winner.id,
      });
      setClaimed(true);
    } catch {
      // Error is displayed from isError state
    }
  };

  if (claimed || isSuccess) {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-24 h-24 rounded-full bg-[#00D68F]/10 flex items-center justify-center"
        >
          <CheckCircle size={48} className="text-[#00D68F]" />
        </motion.div>
        <h2 className="text-2xl font-black text-white">Redeemed!</h2>
        <p className="text-[#8892A4] text-sm">
          Prize successfully claimed. Hand the visitor their{" "}
          <span className="text-white font-semibold">{winner.name}</span>.
        </p>
        <button
          onClick={onReset}
          className="w-full bg-[#E94560] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 mt-4"
          aria-label="Reset for next visitor"
        >
          <RotateCcw size={16} /> Next Visitor
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6 py-10 text-center">
      <h2 className="text-2xl font-black text-white">Confirm Claim</h2>
      <div className="bg-[#16213E] rounded-2xl p-5 w-full">
        <p className="text-[#8892A4] text-xs mb-1">Prize</p>
        <p className="text-white font-bold text-lg">{winner.name}</p>
        <p className="text-[#8892A4] text-sm mt-1">{winner.description}</p>
      </div>

      {isError && (
        <p className="text-[#E94560] text-sm">
          {error?.message || "This QR code has already been redeemed."}
        </p>
      )}

      <button
        onClick={handleClaim}
        disabled={isPending}
        className="w-full bg-[#00D68F] text-white rounded-xl py-4 font-black disabled:opacity-50"
        aria-label="Confirm prize redemption"
      >
        {isPending ? "Processing…" : "Confirm & Redeem"}
      </button>
    </div>
  );
};

// ─── Step progress indicator ─────────────────────────────────────────────────

const StepIndicator = ({ currentStep }) => {
  const labels = ["Scan", "Survey", "Spin", "Claim"];
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
  const [step, setStep] = useState("scan");
  const [sessionData, setSessionData] = useState({});
  const { data: prizes = [] } = useGetPrizes();

  const advance = (newData) => {
    setSessionData((prev) => ({ ...prev, ...newData }));
    const nextIndex = STEPS.indexOf(step) + 1;
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex]);
  };

  const reset = () => {
    setStep("scan");
    setSessionData({});
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      {/* Header */}
      <div className="bg-[#16213E] border-b border-[#E94560]/10 px-6 py-4 flex items-center justify-between">
        <h1 className="font-black text-lg tracking-wide">SCAN2WIN — Redeem</h1>
        {step !== "scan" && (
          <button
            onClick={reset}
            className="text-[#8892A4] text-xs flex items-center gap-1"
            aria-label="Reset redemption flow"
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}
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
          {step === "scan" && <QRInputStep onNext={advance} />}

          {step === "survey" && <SurveyStep onNext={advance} />}

          {step === "roulette" && prizes.length > 0 && (
            <RouletteStep prizes={prizes} onNext={advance} />
          )}

          {step === "claim" && (
            <ClaimStep
              qrData={sessionData.qrData}
              surveyAnswers={sessionData.surveyAnswers}
              winner={sessionData.winner}
              onReset={reset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RedeemPortal;
