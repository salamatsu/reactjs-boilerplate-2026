import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntProvider, ConfigProvider } from "antd";
import RootRoutes from "./routes";
import "@ant-design/v5-patch-for-react-19";
import { useCsrfToken } from "./hooks/useCsrfToken";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Initialize CSRF token on app mount
  useCsrfToken();

  return (
    <QueryClientProvider client={queryClient}>
      <AntProvider>
        <RootRoutes />
      </AntProvider>
    </QueryClientProvider>
  );
};

export default App;
