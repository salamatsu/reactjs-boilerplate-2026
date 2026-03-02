import { useMemo } from "react";

export const useTableData = (dataSource, searchTerm, filters) => {
  return useMemo(() => {
    let filteredData = [...dataSource];

    if (searchTerm) {
      filteredData = filteredData.filter((item) =>
        Object.values(item).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        filteredData = filteredData.filter(
          (item) => item[key] === filters[key]
        );
      }
    });

    return filteredData;
  }, [dataSource, searchTerm, filters]);
};