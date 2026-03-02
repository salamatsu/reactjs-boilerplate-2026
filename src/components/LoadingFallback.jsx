import { Spin } from "antd";

// Loading fallback for lazy-loaded components
export const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" />
    </div>
  );
};

// Smaller loading fallback for component-level lazy loading
export const ComponentLoader = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Spin />
    </div>
  );
};

export default LoadingFallback;
