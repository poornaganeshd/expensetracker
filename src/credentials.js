const KEY = "nomad-credentials";

export const getCredentials = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

export const saveCredentials = (c) => localStorage.setItem(KEY, JSON.stringify(c));

export const clearCredentials = () => localStorage.removeItem(KEY);
