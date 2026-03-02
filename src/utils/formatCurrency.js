// Consolidated formatters - created once and reused
const formatters = {
  noFraction: new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),

  twoDecimals: new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),

  phpCurrencyNoFraction: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }),

  phpCurrency: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }),

  phpCurrency3: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }),
};

// Optimized regex for unformatting (compiled once)
const CURRENCY_CLEANUP_REGEX = /[^0-9.]+/g;

// Core formatting functions
export const formatAddCommas = (num = 0) => formatters.noFraction.format(num);

// export const formatCurrency = (num = 0) => formatters.twoDecimals.format(num);
export const formatPHPCurrencyNoFraction = (num = 0) =>
  formatters.phpCurrencyNoFraction.format(num);

export const formatPHPCurrency = (num = 0) =>
  formatters.phpCurrency.format(num);

export const formatPHPCurrency3 = (num = 0) =>
  formatters.phpCurrency3.format(num);

// Optimized free check with early return
export const checkFree = (num = 0) =>
  num === 0 ? "FREE" : formatters.phpCurrency.format(num);

// Improved unformat function with better error handling
export const unformatPHPCurrency = (value = "") => {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return 0;

  const cleaned = value.replace(CURRENCY_CLEANUP_REGEX, "");
  return cleaned === "" ? 0 : Number(cleaned);
};

// Optimized percentage calculation with bounds checking
export const getPercentage = (partialValue = 0, totalValue = 0) => {
  if (totalValue === 0) return "0.00";
  return ((partialValue / totalValue) * 100).toFixed(2);
};

// Additional utility functions for common use cases
export const formatCompact = (num = 0) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(num);

export const formatPercent = (decimal = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
  }).format(decimal);

// Batch formatting for arrays (more efficient than mapping)
export const formatBatch = (numbers = [], formatter = formatters.phpCurrency) =>
  numbers.map((num) => formatter.format(num));

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
