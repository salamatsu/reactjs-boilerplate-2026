import { ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initSentry } from "./config/sentry.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#1E3A71",
            colorBgBase: "#fff",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </StrictMode>
);
