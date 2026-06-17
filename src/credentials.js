const KEY = "nomad-credentials";

export const getCredentials = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

export const saveCredentials = (c) => localStorage.setItem(KEY, JSON.stringify(c));

export const clearCredentials = () => localStorage.removeItem(KEY);

// Local mode = no usable Supabase credentials. Requires BOTH sbUrl AND sbKey
// to be present — a partial credential (URL only) still means no sync and
// no AI, so the local-mode banner must show.
export const isLocalMode = (creds) => !creds || !creds.sbUrl || !creds.sbKey;
