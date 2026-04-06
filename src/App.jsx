// ============================================
// SCAN2WIN — Root Application Component
// Worldbex Events "Scan to Win" Platform
// ============================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntProvider } from "antd";
import RootRoutes from "./routes";
import "@ant-design/v5-patch-for-react-19";
import { useCsrfToken } from "./hooks/useCsrfToken";

// Configure React Query with sensible defaults for event-day usage
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000, // 30s — interactions list changes rarely during an event
    },
  },
});

const App = () => {
  // // Initialize CSRF token for admin CMS API calls
  // useCsrfToken();

  return (
    <QueryClientProvider client={queryClient}>
      <AntProvider>
        <RootRoutes />
      </AntProvider>
    </QueryClientProvider>
  );
};

export default App;
