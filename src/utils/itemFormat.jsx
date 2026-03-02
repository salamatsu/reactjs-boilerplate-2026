import { Typography } from "antd";
import { motion } from "framer-motion";
import { Link } from "react-router";

export const getItem = (label, key, icon, children, ...props) => {
  return {
    key,
    icon,
    children,
    label,
    ...props,
  };
};

export const viewHandler = (value) => (value ? value : "N/A");

export const viewHandlerCopyable = (value) =>
  value ? <Typography.Text copyable>{value}</Typography.Text> : "N/A";

export const generateItems = (arr = []) => {
  return arr.map((obj) =>
    getItem(
      <motion.div
        variants={{
          offscreen: { y: -200, opacity: 0 },
          onscreen: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", bounce: 0.2, duration: 1 },
          },
        }}
        whileHover={{
          x: 10,
          shadow: 20,
        }}
      >
        <Link to={obj.route}>{obj.label}</Link>
      </motion.div>,
      obj.route,

      <Link to={obj.route}>{obj.icon}</Link>
    )
  );
};

export const getSex = (data) => {
  if (data == 0) {
    return "Male";
  } else if (data == 1) {
    return "Female";
  } else {
    return "N/A";
  }
};

export const formatQueryParams = (obj, options = {}) => {
  const {
    skipNull = true,
    skipUndefined = true,
    skipEmpty = false,
    arrayBrackets = false,
  } = options;

  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    // Skip based on options
    if (skipNull && value === null) return;
    if (skipUndefined && value === undefined) return;
    if (skipEmpty && value === "") return;

    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const paramKey = arrayBrackets ? `${key}[]` : key;
        params.append(paramKey, item);
      });
    }
    // Handle objects (convert to JSON string)
    else if (typeof value === "object" && value !== null) {
      params.append(key, JSON.stringify(value));
    }
    // Handle primitives
    else {
      params.append(key, value);
    }
  });

  return params.toString();
};
