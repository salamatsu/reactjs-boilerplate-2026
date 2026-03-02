import * as Sentry from "@sentry/react";

// Initialize Sentry
export const initSentry = () => {
  // Only initialize Sentry in production or if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_APP_ENV,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate:
        import.meta.env.VITE_APP_ENV === "production" ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Disable in development if desired
      enabled: import.meta.env.VITE_APP_ENV === "production",

      // Release version
      release: import.meta.env.VITE_APP_VERSION,

      beforeSend(event, hint) {
        // Don't send certain errors
        const error = hint.originalException;

        if (error && error.message) {
          // Ignore network errors
          if (error.message.includes("Network Error")) {
            return null;
          }

          // Ignore 401/403 errors
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            return null;
          }
        }

        return event;
      },
    });
  }
};
