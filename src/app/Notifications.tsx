import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { getXP, LEVELS, BADGES } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Notifications Center — a bell icon + dropdown that surfaces real,  */
/* live alerts computed from the app's existing data: newly-unlocked  */
/* achievements, a level-up, an at-risk streak, unclaimed daily quests */
/* / spin, and an unfinished daily checklist. No backend/push infra   */
/* exists, so everything here is derived client-side each time the    */
/* bell renders — genuinely current, not a stored feed.               */
/* ---------------------------------------------------------------- */

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  detail: string;
  section?: string; // section id to jump to on click, if any
  tone: "info" | "success" | "warning";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seenBadgesKey(email: string | null | undefined) {
  return `tfp_seen_badges_${email ?? "guest"}`;
}
function readSeenKey(email: string | null | undefined) {
  return `tfp_notifs_read_${email ?? "guest"}_${todayKey()}`;
}

function computeNotifications(user: ReturnType<typeof useAuth>["user"]): NotificationItem[] {
  if (!user) return [];
  const items: NotificationItem[] = [];
  const xp = getXP(user.email);
  const streak = user.streak ?? 0;
  const workouts = user.stats?.totalWorkouts ?? 0;
  const ctx = { xp, workouts, streak };

  // Newly unlocked badges since the user last saw the Achievements page.
  let seen: string[] = [];
  try { seen = JSON.parse(localStorage.getItem(seenBadgesKey(user.email)) ?? "[]"); } catch { /* ignore */ }
  const unlockedNow = BADGES.filter((b) => b.unlocked(ctx)).map((b) => b.id);
  const newlyUnlocked = BADGES.filter((b) => unlockedNow.includes(b.id) && !seen.includes(b.id));
  newlyUnlocked.forEach((b) => {
    items.push({ id: `badge-${b.id}`, icon: b.icon, title: `Badge unlocked: ${b.title}`, detail: b.desc, section: "achievements", tone: "success" });
  });

  // Level check — celebrate if XP just crossed a level threshold (best-effort: show current level always if close to next).
  const levelIdx = LEVELS.reduce((acc, l, i) => (xp >= l.min ? i : acc), 0);
  const next = LEVELS[levelIdx + 1];
  if (next) {
    const remaining = next.min - xp;
    if (remaining <= 50 && remaining > 0) {
      items.push({ id: "level-close", icon: next.icon, title: `Almost ${next.name}!`, detail: `Just ${remaining} more XP to reach ${next.name}.`, section: "achievements", tone: "info" });
    }
  }

  // Streak at risk — has a streak going, but today's checklist is empty.
  let checklistDone: Record<string, boolean> = {};
  try { checklistDone = JSON.parse(localStorage.getItem(`tfp_checklist_${user.email}_${todayKey()}`) ?? "{}"); } catch { /* ignore */ }
  const anyChecklistToday = Object.values(checklistDone).some(Boolean);
  if (streak >= 2 && !anyChecklistToday) {
    items.push({ id: "streak-risk", icon: "🔥", title: `Don't break your ${streak}-day streak!`, detail: "Tick off today's checklist on the Dashboard to keep it alive.", section: "dashboard", tone: "warning" });
  }

  // Unclaimed daily quests.
  let questsDone: Record<string, boolean> = {};
  try { questsDone = JSON.parse(localStorage.getItem(`tfp_quests_${user.email}_${todayKey()}`) ?? "{}"); } catch { /* ignore */ }
  const anyQuestDone = Object.values(questsDone).some(Boolean);
  if (!anyQuestDone) {
    items.push({ id: "quests-open", icon: "⚔️", title: "Today's quests are waiting", detail: "Complete them for bonus XP before the day resets.", section: "quests", tone: "info" });
  }

  // Unclaimed free spin.
  const spunToday = localStorage.getItem(`tfp_spin_${user.email}`) === todayKey();
  if (!spunToday) {
    items.push({ id: "spin-open", icon: "🎡", title: "Free daily spin available", detail: "Spin the wheel for up to 200 bonus XP.", section: "dailyrewards", tone: "info" });
  }

  return items;
}

export function NotificationBell({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => computeNotifications(user), [user]);

  useEffect(() => {
    try { setReadIds(JSON.parse(localStorage.getItem(readSeenKey(user?.email)) ?? "[]")); } catch { setReadIds([]); }
  }, [user?.email]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function markAllRead() {
    const ids = notifications.map((n) => n.id);
    setReadIds(ids);
    try { localStorage.setItem(readSeenKey(user?.email), JSON.stringify(ids)); } catch { /* ignore */ }
    // Remember which badges have been shown so they don't re-notify tomorrow.
    const unlockedIds = notifications.filter((n) => n.id.startsWith("badge-")).map((n) => n.id.replace("badge-", ""));
    if (unlockedIds.length) {
      try {
        const prev: string[] = JSON.parse(localStorage.getItem(seenBadgesKey(user?.email)) ?? "[]");
        localStorage.setItem(seenBadgesKey(user?.email), JSON.stringify([...new Set([...prev, ...unlockedIds])]));
      } catch { /* ignore */ }
    }
  }

  function handleClick(n: NotificationItem) {
    if (n.section) onNavigate(n.section);
    setOpen(false);
  }

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;
  const toneColor: Record<NotificationItem["tone"], string> = { info: "#f97316", success: "#059669", warning: "#ea580c" };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-lg transition hover:bg-[#2a1e16]/10"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-[#2a1e16]/12 bg-[#fffdf9]/97 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#2a1e16]/10 px-4 py-3">
            <p className="text-sm font-black">Notifications</p>
            {notifications.length > 0 && (
              <button type="button" onClick={markAllRead} className="text-[11px] font-bold text-orange-600 hover:text-orange-700">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl">✨</div>
                <p className="mt-2 text-xs text-[#2a1e16]/60">You're all caught up.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-[#2a1e16]/6 px-4 py-3 text-left transition hover:bg-[#2a1e16]/5 ${isRead ? "opacity-55" : ""}`}
                  >
                    <span className="text-xl">{n.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#2a1e16]">{n.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#2a1e16]/62">{n.detail}</p>
                    </div>
                    {!isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: toneColor[n.tone] }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
