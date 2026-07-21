import { useMemo } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Achievements & XP Hub — levels, badges, streak rewards.           */
/* XP is stored per-user in localStorage (key: tfp_xp_<email>).      */
/* ---------------------------------------------------------------- */

export function getXP(email?: string | null): number {
  try {
    return parseInt(localStorage.getItem(`tfp_xp_${email ?? "guest"}`) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function addXP(email: string | null | undefined, amount: number): number {
  const next = getXP(email) + amount;
  try {
    localStorage.setItem(`tfp_xp_${email ?? "guest"}`, String(next));
  } catch { /* storage unavailable */ }
  return next;
}

export const LEVELS = [
  { name: "Rookie", icon: "🐣", min: 0 },
  { name: "Grinder", icon: "🔨", min: 300 },
  { name: "Warrior", icon: "⚔️", min: 800 },
  { name: "Beast", icon: "🦁", min: 1600 },
  { name: "Titan", icon: "⚡", min: 2800 },
  { name: "Legend", icon: "👑", min: 4500 },
  { name: "Titan God", icon: "⚡", min: 7000 },
];

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: (ctx: { xp: number; workouts: number; streak: number }) => boolean;
  progress: (ctx: { xp: number; workouts: number; streak: number }) => [number, number];
}

export const BADGES: Badge[] = [
  { id: "first", icon: "🎯", title: "First Blood", desc: "Complete your first workout", unlocked: (c) => c.workouts >= 1, progress: (c) => [c.workouts, 1] },
  { id: "five", icon: "🖐️", title: "High Five", desc: "Complete 5 workouts", unlocked: (c) => c.workouts >= 5, progress: (c) => [c.workouts, 5] },
  { id: "twenty", icon: "🔥", title: "On Fire", desc: "Complete 20 workouts", unlocked: (c) => c.workouts >= 20, progress: (c) => [c.workouts, 20] },
  { id: "fifty", icon: "💪", title: "Iron Addict", desc: "Complete 50 workouts", unlocked: (c) => c.workouts >= 50, progress: (c) => [c.workouts, 50] },
  { id: "streak3", icon: "🌱", title: "Habit Seed", desc: "Reach a 3-day streak", unlocked: (c) => c.streak >= 3, progress: (c) => [c.streak, 3] },
  { id: "streak7", icon: "📅", title: "Week Warrior", desc: "Reach a 7-day streak", unlocked: (c) => c.streak >= 7, progress: (c) => [c.streak, 7] },
  { id: "streak30", icon: "🗓️", title: "Unstoppable", desc: "Reach a 30-day streak", unlocked: (c) => c.streak >= 30, progress: (c) => [c.streak, 30] },
  { id: "xp500", icon: "⚡", title: "Charged Up", desc: "Earn 500 XP", unlocked: (c) => c.xp >= 500, progress: (c) => [c.xp, 500] },
  { id: "xp2000", icon: "🚀", title: "Rocket Fuel", desc: "Earn 2,000 XP", unlocked: (c) => c.xp >= 2000, progress: (c) => [c.xp, 2000] },
  { id: "xp5000", icon: "💎", title: "Diamond Grind", desc: "Earn 5,000 XP", unlocked: (c) => c.xp >= 5000, progress: (c) => [c.xp, 5000] },
];

export default function AchievementsPage() {
  const { user } = useAuth();
  const xp = getXP(user?.email);
  const ctx = useMemo(
    () => ({ xp, workouts: user?.stats?.totalWorkouts ?? 0, streak: user?.streak ?? 0 }),
    [xp, user]
  );

  const levelIdx = LEVELS.reduce((acc, l, i) => (xp >= l.min ? i : acc), 0);
  const level = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1];
  const levelProgress = next ? (xp - level.min) / (next.min - level.min) : 1;
  const unlockedCount = BADGES.filter((b) => b.unlocked(ctx)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Achievements</h1>
        <p className="text-sm text-[#f7f0df]/68">Earn XP from workouts, level up, unlock badges</p>
      </div>

      {/* Level card */}
      <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(216,179,90,0.6) 0%, transparent 70%)" }}
        />
        <div className="flex flex-wrap items-center gap-6">
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-violet-300/25 to-[#d8b35a]/20 text-6xl shadow-[0_0_40px_rgba(216,179,90,0.2)]">
            {level.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d8b35a]">Level {levelIdx + 1}</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.02em]">{level.name}</h2>
            <p className="mt-1 text-sm text-[#f7f0df]/68">
              {xp.toLocaleString()} XP{next ? ` · ${(next.min - xp).toLocaleString()} XP to ${next.name} ${next.icon}` : " · Max level reached!"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-[#d8b35a]">{unlockedCount}<span className="text-xl text-[#f7f0df]/60">/{BADGES.length}</span></p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/65">Badges</p>
          </div>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#f7f0df]/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-400 to-[#d8b35a] transition-all duration-1000"
            style={{ width: `${Math.min(levelProgress * 100, 100)}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#f7f0df]/62">
          <span>{level.icon} {level.name}</span>
          {next && <span>{next.icon} {next.name}</span>}
        </div>
      </div>

      {/* Level ladder */}
      <div className="flex flex-wrap gap-3">
        {LEVELS.map((l, i) => (
          <div
            key={l.name}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
              i <= levelIdx
                ? "border border-[#d8b35a]/40 bg-[#d8b35a]/12 text-[#d8b35a]"
                : "border border-[#f7f0df]/10 bg-[#f7f0df]/4 text-[#f7f0df]/62"
            }`}
          >
            <span>{l.icon}</span>
            <span>{l.name}</span>
            <span className="text-[10px] opacity-70">{l.min.toLocaleString()}+</span>
          </div>
        ))}
      </div>

      {/* Badges grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BADGES.map((b) => {
          const done = b.unlocked(ctx);
          const [cur, target] = b.progress(ctx);
          return (
            <div
              key={b.id}
              className={`rounded-2xl p-5 transition-all ${
                done
                  ? "glass-card border-gold-glow"
                  : "border border-[#f7f0df]/8 bg-[#f7f0df]/3 opacity-75"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className={`text-4xl ${done ? "" : "grayscale"}`}>{b.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black">{b.title}</h3>
                  <p className="mt-0.5 text-xs text-[#f7f0df]/68">{b.desc}</p>
                </div>
                {done && <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">✓ Done</span>}
              </div>
              {!done && (
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#f7f0df]/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400" style={{ width: `${Math.min((cur / target) * 100, 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-right text-[10px] font-bold text-[#f7f0df]/62">{Math.min(cur, target).toLocaleString()} / {target.toLocaleString()}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
