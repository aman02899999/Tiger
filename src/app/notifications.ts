/* ---------------------------------------------------------------- */
/* Browser (Web) Notifications helper.                                */
/*                                                                    */
/* Uses the standard Notification API — no backend/push server        */
/* required. When the user turns notifications ON we request          */
/* permission; once granted, the app can surface its live alerts      */
/* (streak at risk, achievement unlocked, reminders…) as real         */
/* system notifications.                                              */
/* ---------------------------------------------------------------- */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/** Ask the browser for permission. Returns the resulting permission. */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Show a notification now, if permission is granted. Returns true if shown. */
export function sendNotification(title: string, options?: NotificationOptions): boolean {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    const n = new Notification(title, { icon: "/images/tiger-fit-hero.jpg", ...options });
    n.onclick = () => { window.focus(); n.close(); };
    return true;
  } catch {
    return false;
  }
}

/* Fire a notification at most once per (key, day) so the same alert
   doesn't re-notify every render. */
function firedKey(id: string) {
  const day = new Date().toISOString().slice(0, 10);
  return `tfp_notif_fired_${id}_${day}`;
}

export function sendNotificationOnce(id: string, title: string, options?: NotificationOptions): boolean {
  try {
    if (localStorage.getItem(firedKey(id))) return false;
  } catch { /* ignore */ }
  const shown = sendNotification(title, options);
  if (shown) {
    try { localStorage.setItem(firedKey(id), "1"); } catch { /* ignore */ }
  }
  return shown;
}
