// Haptic feedback via the Web Vibration API. Supported on Android Chrome and
// installed PWAs; iOS Safari exposes no vibration API, so every call is a silent
// no-op there (safe to sprinkle anywhere without guards at the call site).
//
// Pattern vocabulary — follows common mobile UX conventions so the *kind* of
// feedback matches the *kind* of event:
//   selection 30ms  — light tick: tab/segment switch, picker, wallet select
//   light     45ms  — a normal tap / navigation
//   medium    65ms  — a committed action with no toast of its own
// Durations are deliberately >=30ms: sub-20ms pulses are below the reliable
// perception threshold on most Android ERM/LRA motors, so shorter ticks read as
// "no buzz at all". iOS Safari exposes no Vibration API — every call no-ops there.
//   success   rising double — a write succeeded
//   warning   even double   — a soft block (cap hit, validation)
//   error     strong double — a failure
//
// A short throttle coalesces bursts (e.g. a cascade of identical toasts, or
// double-fired click handlers) into a single pulse instead of a machine-gun of
// motor restarts.

const KEY = "nomad-haptics";

let enabled = (() => { try { return localStorage.getItem(KEY) !== "off"; } catch { return true; } })();
let last = 0;

export const hapticsEnabled = () => enabled;

export const setHapticsEnabled = (on) => {
  enabled = !!on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* quota — non-fatal */ }
};

const buzz = (pattern) => {
  if (!enabled) return;
  const now = Date.now();
  if (now - last < 40) return; // coalesce rapid bursts into one pulse
  last = now;
  // Optional chaining keeps this a no-op where navigator/vibrate is absent
  // (iOS Safari, jsdom, SSR) without throwing.
  try { navigator?.vibrate?.(pattern); } catch { /* unsupported */ }
};

export const hapticSelection = () => buzz(30);
export const hapticLight = () => buzz(45);
export const hapticMedium = () => buzz(65);
export const hapticSuccess = () => buzz([35, 45, 55]);
export const hapticWarning = () => buzz([45, 55, 45]);
export const hapticError = () => buzz([65, 70, 65]);

// Toast → feedback mapping, used centrally in showT. Only user-action OUTCOMES
// buzz: info/warn stay silent so on-load bill reminders don't vibrate the device
// every time the app opens.
export const hapticForToast = (type) => {
  if (type === "success") hapticSuccess();
  else if (type === "error") hapticError();
};
