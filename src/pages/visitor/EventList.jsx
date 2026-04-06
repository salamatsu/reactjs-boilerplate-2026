// ============================================
// SCAN2WIN — Event List Page
// Route: /
// Lists all events from /api/scans/getEvents
// ============================================

import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Calendar, Loader2, AlertTriangle } from "lucide-react";
import { useGetEventsList } from "../../services/requests/useApi";

const BASE_URL = import.meta.env.VITE_BASEURL_APP;

export default function EventList() {
  const navigate = useNavigate();
  const { data: events, isLoading, isError } = useGetEventsList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1A1A2E]">
        <Loader2 className="animate-spin text-[#E94560]" size={40} />
      </div>
    );
  }

  if (isError || !events) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1A1A2E] text-white gap-3">
        <AlertTriangle className="text-[#E94560]" size={40} />
        <p className="text-[#8892A4]">Failed to load events. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Worldbex Events
        </h1>
        <p className="text-[#8892A4] text-sm mt-1">Select an event to participate</p>
      </motion.div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        {events.map((event, i) => (
          <motion.button
            key={event.eventId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/${event.eventName.toLowerCase()}`)}
            className="flex items-center gap-4 bg-[#16213E] rounded-2xl p-4 text-left w-full hover:bg-[#1e2d4d] transition-colors active:scale-[0.98]"
          >
            {/* Cover image */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1A1A2E] flex-shrink-0 flex items-center justify-center">
              <img
                src={`${BASE_URL}${event.imgSrc}`}
                alt={event.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug truncate">
                {event.name}
              </p>
              <p className="text-[#8892A4] text-xs mt-1 flex items-center gap-1">
                <Calendar size={11} />
                {event.date}
              </p>
            </div>

            {/* Chevron */}
            <svg
              className="text-[#8892A4] flex-shrink-0"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
