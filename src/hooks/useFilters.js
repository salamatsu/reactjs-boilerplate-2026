import { useCallback, useState } from "react";

export const useFilters = () => {
  const [filters, setFilters] = useState({
    floor: "all",
    roomType: "all",
    status: "all",
  });

  const updateFilter = useCallback((filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  }, []);

  return [filters, updateFilter];
};
