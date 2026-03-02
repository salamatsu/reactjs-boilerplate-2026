export const parseJsonField = (jsonString) => {
  try {
    return JSON.parse(jsonString || "[]");
  } catch {
    return [];
  }
};
