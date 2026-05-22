const KEY = "nomad-credentials";

export const getCredentials = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

export const saveCredentials = (c) => localStorage.setItem(KEY, JSON.stringify(c));

export const clearCredentials = () => localStorage.removeItem(KEY);

/**
 * Pure derivation of local-only mode from a credentials object.
 * Local mode = user is missing either the Supabase URL or anon key (so no
 * cloud sync, no AI, data stays in localStorage). Matches SB_ENABLED in
 * App.jsx — when SB_ENABLED is false, the app is operating in local mode.
 * Used at module load to decide whether to render the local-mode banner.
 */
export const isLocalMode = (creds) => !creds || !creds.sbUrl || !creds.sbKey;
