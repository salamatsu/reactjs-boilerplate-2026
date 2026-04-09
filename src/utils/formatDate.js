import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const DATE_FORMATS = {
  DATETIME: "MMM DD, YYYY hh:mm A",
  DATE: "MMM DD, YYYY",
  TIME: "hh:mm A",
  TIME_SECONDS: "hh:mm:ss A",
};

/** Format a local or date-only value (e.g. campaign startDate "2026-04-09") */
export const formatDateTime = (dateTime, format = DATE_FORMATS.DATETIME) => {
  if (!dateTime) return "Not set";
  return dayjs(dateTime).format(format);
};

/** Format a UTC ISO timestamp from the server without local timezone shift */
export const formatUTC = (dateTime, format = DATE_FORMATS.DATETIME) => {
  if (!dateTime) return null;
  return dayjs.utc(dateTime).format(format);
};

export const getCurrentDayType = () => {
  const day = dayjs().day();
  return day === 0 || day === 6 ? "weekend" : "weekday";
};
