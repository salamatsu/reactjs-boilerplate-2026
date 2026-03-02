import React from "react";

function HeaderCell({ children, ...restProps }) {
  return React.createElement(
    "th",
    {
      ...restProps,
      className: "text-xs font-medium text-gray-700 uppercase tracking-wide",
    },
    children
  );
}

export function useStyledTable() {
  return {
    header: {
      cell: HeaderCell,
    },
  };
}
