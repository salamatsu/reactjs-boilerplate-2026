import dayjs from "dayjs";

export const DATE_FORMATS = {
  DATETIME: "MMM DD, YYYY hh:mm A",
  DATE: "MMM DD, YYYY",
  TIME: "hh:mm A",
};
export const formatDateTime = (dateTime, format = DATE_FORMATS.DATETIME) => {
  if (!dateTime) return "Not set";
  return dayjs(dateTime).format(format);
};

export const getCurrentDayType = () => {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
};

// Utility functions
// const formatDateTime = useCallback((dateTime) => {
//   if (!dateTime) return "Not set";
//   try {
//     const date = new Date(dateTime);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch (error) {
//     console.error("Date formatting error:", error);
//     return "Invalid date";
//   }
// }, []);
