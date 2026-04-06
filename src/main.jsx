// ============================================
// SCAN2WIN — Application Entry Point
// Worldbex Events "Scan to Win" Platform
// ============================================

import { ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initSentry } from "./config/sentry.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Initialize Sentry error tracking before rendering
initSentry();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Scan2Win Ant Design theme — dark navy primary, red-pink accent */}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#E94560",       // Vivid red-pink accent
            colorBgBase: "#1A1A2E",        // Deep navy background
            colorTextBase: "#FFFFFF",
            borderRadius: 8,
            fontFamily: "'DM Sans', 'Nunito', sans-serif",
          },
          components: {
            Button: {
              colorPrimary: "#E94560",
              algorithm: true,
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </StrictMode>
);
