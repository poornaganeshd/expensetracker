const SHOWN_KEY_PREFIX = "nomad-bill-reminders-";

function getTodayShown(todayStr) {
  try { return new Set(JSON.parse(localStorage.getItem(SHOWN_KEY_PREFIX + todayStr) || "[]")); }
  catch { return new Set(); }
}

function markShown(todayStr, ids) {
  try {
    const s = getTodayShown(todayStr);
    ids.forEach(id => s.add(id));
    localStorage.setItem(SHOWN_KEY_PREFIX + todayStr, JSON.stringify([...s]));
    Object.keys(localStorage)
      .filter(k => k.startsWith(SHOWN_KEY_PREFIX) && k !== SHOWN_KEY_PREFIX + todayStr)
      .forEach(k => localStorage.removeItem(k));
  } catch { }
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function isNotHandled(r, dueStr) {
  if (r.frequency === "monthly") return !(r.lastPaidDate?.slice(0, 7) === dueStr.slice(0, 7) || r.lastSkippedDate?.slice(0, 7) === dueStr.slice(0, 7));
  if (r.frequency === "yearly") return !(r.lastPaidDate?.slice(0, 4) === dueStr.slice(0, 4) || r.lastSkippedDate?.slice(0, 4) === dueStr.slice(0, 4));
  const anchor = r.lastPaidDate || r.lastSkippedDate || r.startDate;
  return anchor !== dueStr;
}

export function checkBillReminders(recurring, splits, todayStr, getRecurringDueDateFn, isRecurringDueTodayFn) {
  const shown = getTodayShown(todayStr);
  const reminders = [];
  const in3Str = addDays(todayStr, 3);

  recurring.filter(r => r.active).forEach(r => {
    const key = "rec-" + r.id;
    if (shown.has(key)) return;
    if (isRecurringDueTodayFn(r, todayStr)) {
      reminders.push({ id: key, msg: `${r.name} is due`, type: "warn" });
      return;
    }
    const upcoming = getRecurringDueDateFn(r, in3Str);
    if (upcoming && upcoming > todayStr && upcoming <= in3Str && isNotHandled(r, upcoming)) {
      const days = Math.round((new Date(upcoming + "T00:00:00") - new Date(todayStr + "T00:00:00")) / 86400000);
      reminders.push({ id: key, msg: `${r.name} due in ${days} day${days !== 1 ? "s" : ""}`, type: "info" });
    }
  });

  splits.filter(s => s.direction === "owe" && !s.settled).forEach(s => {
    const key = "stl-" + s.id;
    if (shown.has(key)) return;
    reminders.push({ id: key, msg: `You owe ₹${s.amount} — ${s.name}`, type: "warn" });
  });

  if (reminders.length > 0) markShown(todayStr, reminders.map(r => r.id));
  return reminders;
}
