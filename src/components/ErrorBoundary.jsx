import * as Sentry from "@sentry/react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Button, Result } from "antd";

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="error"
        title="Something went wrong"
        subTitle="We're sorry for the inconvenience. Please try refreshing the page."
        extra={[
          <Button type="primary" key="retry" onClick={resetErrorBoundary}>
            Try Again
          </Button>,
          <Button key="home" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>,
        ]}
      >
        {import.meta.env.VITE_APP_ENV === "development" && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
            <pre className="text-xs text-red-600 overflow-auto">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </div>
        )}
      </Result>
    </div>
  );
};

// Create Sentry-wrapped error boundary
const SentryErrorBoundary = Sentry.withErrorBoundary(ReactErrorBoundary, {
  fallback: ErrorFallback,
  showDialog: false,
});

// Custom error boundary with additional functionality
export const ErrorBoundary = ({ children }) => {
  const handleError = (error, errorInfo) => {
    // Log error to console in development
    if (import.meta.env.VITE_APP_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Sentry will automatically capture this
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  };

  const handleReset = () => {
    // Optionally clear any error states or caches
    window.location.reload();
  };

  return (
    <SentryErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </SentryErrorBoundary>
  );
};

export default ErrorBoundary;
