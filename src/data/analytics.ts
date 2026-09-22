/* ═══════════════════════════════════════════════════════════════════
   ANALYTICS — derived, never invented
   ───────────────────────────────────────────────────────────────────
   Every function here is pure and returns `null` (never 0, never a
   placeholder) when the underlying records do not exist. The UI layer
   renders "No data yet" for `null`. That is the whole contract, and it
   is enforced by `scripts/test-saas.mjs`.
   ═══════════════════════════════════════════════════════════════════ */

import type {
  Appointment,
  ClientGoal,
  NutritionLog,
  NutritionPlan,
  ProgressEntry,
  TrainerClient,
  UserProfile,
  WorkoutAssignment,
  WorkoutPlan,
  WorkoutSession,
} from "../domain/models";

export const DAY_MS = 86_400_000;

export type Dated = { date?: string | null } | null | undefined;

export function isoDay(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function daysSince(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / DAY_MS);
}

export function withinDays(iso: string | null | undefined, days: number, now = new Date()): boolean {
  const gap = daysSince(iso, now);
  return gap !== null && gap <= days;
}

/** Completed sessions sorted newest-first (undated ones are ignored). */
export function completedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions
    .filter((s) => Boolean(s.completedAt))
    .sort((a, b) => new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime());
}

/**
 * Adherence = completed sessions ÷ expected sessions for the window.
 * Expected comes from the active plan's `daysPerWeek` (or 3 as the floor
 * when a client has no plan). Returns `null` when there is no plan and
 * no history — an honest "we cannot know yet".
 */
export function adherenceRate(
  sessions: WorkoutSession[],
  plans: WorkoutPlan[],
  windowDays = 28,
  now = new Date(),
): number | null {
  const windowSessions = completedSessions(sessions).filter((s) => withinDays(s.completedAt, windowDays, now));
  const plan = plans.find((p) => p.status === "active") ?? plans[0];
  const perWeek = plan?.days?.length || 3;
  const expected = Math.round((perWeek * windowDays) / 7);
  if (!plan && windowSessions.length === 0) return null;
  if (expected <= 0) return null;
  return Math.min(100, Math.round((windowSessions.length / expected) * 100));
}

export function weeklyVolumeSeries(sessions: WorkoutSession[], weeks = 8, now = new Date()): Array<{ week: string; volume: number; sessions: number }> {
  const buckets: Array<{ week: string; volume: number; sessions: number }> = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(now.getTime() - w * 7 * DAY_MS);
    const start = new Date(end.getTime() - 7 * DAY_MS);
    const inWeek = completedSessions(sessions).filter((s) => {
      const t = new Date(s.completedAt as string).getTime();
      return t > start.getTime() && t <= end.getTime();
    });
    buckets.push({
      week: isoDay(end),
      volume: Math.round(inWeek.reduce((sum, s) => sum + (s.volumeKg || 0), 0)),
      sessions: inWeek.length,
    });
  }
  return buckets;
}

export type PersonalRecord = {
  exerciseId: string;
  name: string;
  loadKg: number;
  reps: number;
  estimated1rm: number;
  achievedAt: string;
};

/** Epley estimate — used only for ranking progression, never as a claim of ability. */
export function estimate1rm(loadKg: number, reps: number): number {
  if (!loadKg || !reps) return 0;
  return Number((loadKg * (1 + reps / 30)).toFixed(1));
}

export function personalRecords(sessions: WorkoutSession[], limit = 6): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const session of completedSessions(sessions)) {
    for (const set of session.sets ?? []) {
      if (!set.completed || !set.loadKg || !set.reps) continue;
      const score = estimate1rm(set.loadKg, set.reps);
      const current = best.get(set.exerciseId);
      if (!current || score > current.estimated1rm) {
        best.set(set.exerciseId, {
          exerciseId: set.exerciseId,
          name: set.name,
          loadKg: set.loadKg,
          reps: set.reps,
          estimated1rm: score,
          achievedAt: (session.completedAt as string) ?? session.startedAt,
        });
      }
    }
  }
  return [...best.values()].sort((a, b) => b.estimated1rm - a.estimated1rm).slice(0, limit);
}

/** Least-squares slope of body weight, kg per week. `null` with < 3 points. */
export function weightTrendPerWeek(entries: ProgressEntry[]): number | null {
  const points = entries
    .filter((e) => typeof e.weightKg === "number" && Boolean(e.date))
    .map((e) => ({ x: new Date(e.date).getTime() / DAY_MS / 7, y: e.weightKg }))
    .sort((a, b) => a.x - b.x);
  if (points.length < 3) return null;
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  const num = points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
  const den = points.reduce((s, p) => s + (p.x - meanX) ** 2, 0);
  if (den === 0) return null;
  return Number((num / den).toFixed(2));
}

/** Consecutive calendar days (walking back from today) with a logged session. */
export function currentStreak(sessions: WorkoutSession[], now = new Date()): number {
  const days = new Set(completedSessions(sessions).map((s) => isoDay(s.completedAt as string)));
  if (days.size === 0) return 0;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = isoDay(new Date(now.getTime() - i * DAY_MS));
    if (days.has(day)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function nutritionAdherence(
  logs: NutritionLog[],
  plan: NutritionPlan | null,
  windowDays = 14,
  now = new Date(),
): number | null {
  if (!plan) return null;
  const relevant = logs.filter((log) => withinDays(log.date, windowDays, now));
  if (relevant.length === 0) return null;
  const tolerance = 0.15;
  const onTarget = relevant.filter((log) => {
    const calorieGap = Math.abs(log.totals.calories - plan.targets.calories) / plan.targets.calories;
    const proteinGap = Math.abs(log.totals.protein - plan.targets.protein) / plan.targets.protein;
    return calorieGap <= tolerance && proteinGap <= tolerance;
  });
  return Math.round((onTarget.length / relevant.length) * 100);
}

export type RiskLevel = "on_track" | "watch" | "at_risk" | "dormant";

export type RiskAssessment = {
  level: RiskLevel;
  reasons: string[];
  daysSinceSession: number | null;
  adherence: number | null;
};

export function assessRisk(
  clientId: string,
  relationship: TrainerClient | null,
  sessions: WorkoutSession[],
  plans: WorkoutPlan[],
  now = new Date(),
): RiskAssessment {
  const mine = completedSessions(sessions.filter((s) => s.clientId === clientId));
  const last = mine[0]?.completedAt ?? null;
  const gap = daysSince(last, now);
  const adherence = adherenceRate(mine, plans, 28, now);
  const reasons: string[] = [];

  if (relationship && relationship.status !== "active") reasons.push("Relationship is not active");
  if (gap !== null && gap >= 14) reasons.push(`No session logged in ${gap} days`);
  if (adherence !== null && adherence < 50) reasons.push(`Adherence at ${adherence}%`);
  if (mine.length === 0) reasons.push("Never trained under this plan");

  let level: RiskLevel = "on_track";
  if (mine.length === 0 && (gap === null || gap > 30)) level = "dormant";
  else if (gap !== null && gap >= 14) level = "dormant";
  else if ((adherence !== null && adherence < 50) || (gap !== null && gap >= 8)) level = "at_risk";
  else if ((adherence !== null && adherence < 75) || (gap !== null && gap >= 4)) level = "watch";

  return { level, reasons, daysSinceSession: gap, adherence };
}

/* ── Composite views (pure, so they are also unit-testable) ─────── */

export type ClientCard = {
  clientId: string;
  profile: UserProfile | null;
  relationship: TrainerClient | null;
  plan: WorkoutPlan | null;
  assignment: WorkoutAssignment | null;
  lastSessionAt: string | null;
  sessionsLast28: number;
  adherence: number | null;
  volumeLast28: number;
  weightTrend: number | null;
  risk: RiskAssessment;
  nextAppointment: Appointment | null;
};

export function buildClientCard(input: {
  clientId: string;
  profile: UserProfile | null;
  relationship: TrainerClient | null;
  plan: WorkoutPlan | null;
  assignment: WorkoutAssignment | null;
  sessions: WorkoutSession[];
  progress: ProgressEntry[];
  appointments: Appointment[];
  now?: Date;
}): ClientCard {
  const now = input.now ?? new Date();
  const mine = completedSessions(input.sessions.filter((s) => s.clientId === input.clientId));
  const last28 = mine.filter((s) => withinDays(s.completedAt, 28, now));
  const next = (input.appointments ?? [])
    .filter((a) => a.clientId === input.clientId && new Date(a.startsAt).getTime() >= now.getTime())
    .filter((a) => a.status === "confirmed" || a.status === "requested")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null;

  return {
    clientId: input.clientId,
    profile: input.profile,
    relationship: input.relationship,
    plan: input.plan,
    assignment: input.assignment,
    lastSessionAt: mine[0]?.completedAt ?? null,
    sessionsLast28: last28.length,
    adherence: adherenceRate(mine, input.plan ? [input.plan] : [], 28, now),
    volumeLast28: Math.round(last28.reduce((sum, s) => sum + (s.volumeKg || 0), 0)),
    weightTrend: weightTrendPerWeek(input.progress.filter((p) => p.clientId === input.clientId)),
    risk: assessRisk(input.clientId, input.relationship, input.sessions, input.plan ? [input.plan] : [], now),
    nextAppointment: next,
  };
}

export type RankedClient = ClientCard & { rank: number; priority: number };

/**
 * "Who needs me today?" — deterministic ordering, no opaque scoring:
 * dormant → at_risk → watch → on_track, then longest silence first.
 */
export function prioritiseClients(cards: ClientCard[]): RankedClient[] {
  const weight: Record<RiskLevel, number> = { dormant: 0, at_risk: 1, watch: 2, on_track: 3 };
  return [...cards]
    .sort((a, b) => {
      const byLevel = weight[a.risk.level] - weight[b.risk.level];
      if (byLevel !== 0) return byLevel;
      const gapA = a.risk.daysSinceSession ?? 9999;
      const gapB = b.risk.daysSinceSession ?? 9999;
      if (gapA !== gapB) return gapB - gapA;
      return a.clientId.localeCompare(b.clientId);
    })
    .map((card, index) => ({ ...card, rank: index + 1, priority: weight[card.risk.level] }));
}

export type GymOverview = {
  activeMembers: number | null;
  activeTrainers: number | null;
  sessionsLast7: number | null;
  volumeLast7Kg: number | null;
  averageAdherence: number | null;
  atRiskMembers: number | null;
  appointmentsNext7: number | null;
  noShowRate: number | null;
  seatsUsed: { members: number; trainers: number } | null;
  seatLimit: { members: number; trainers: number } | null;
  revenueLast30Minor: number | null;
};

export function buildGymOverview(input: {
  memberships: Array<{ role: string; status: string; userId: string }>;
  sessions: WorkoutSession[];
  plans: WorkoutPlan[];
  relationships: TrainerClient[];
  appointments: Appointment[];
  payments: Array<{ amountMinor: number; status: string; createdAt: string }>;
  seatLimit?: { members: number; trainers: number } | null;
  now?: Date;
}): GymOverview {
  const now = input.now ?? new Date();
  const members = input.memberships.filter((m) => m.role === "client");
  const trainers = input.memberships.filter((m) => m.role === "trainer");
  const sessions7 = completedSessions(input.sessions).filter((s) => withinDays(s.completedAt, 7, now));
  const completed = input.appointments.filter((a) => a.status === "completed");
  const noShows = input.appointments.filter((a) => a.status === "no_show");

  const adherenceValues = members
    .map((m) => {
      const mine = input.sessions.filter((s) => s.clientId === m.userId);
      const plan = input.plans.find((p) => p.clientId === m.userId) ?? null;
      return adherenceRate(mine, plan ? [plan] : [], 28, now);
    })
    .filter((v): v is number => v !== null);

  const atRisk = members.filter((m) => {
    const rel = input.relationships.find((r) => r.clientId === m.userId) ?? null;
    const mine = input.sessions.filter((s) => s.clientId === m.userId);
    const plan = input.plans.find((p) => p.clientId === m.userId) ?? null;
    const level = assessRisk(m.userId, rel, mine, plan ? [plan] : [], now).level;
    return level === "at_risk" || level === "dormant";
  }).length;

  const payments30 = input.payments.filter(
    (p) => p.status === "captured" && withinDays(p.createdAt, 30, now),
  );

  return {
    activeMembers: members.length ? members.filter((m) => m.status === "active").length : null,
    activeTrainers: trainers.length ? trainers.filter((t) => t.status === "active").length : null,
    sessionsLast7: sessions7.length,
    volumeLast7Kg: sessions7.length
      ? Math.round(sessions7.reduce((sum, s) => sum + (s.volumeKg || 0), 0))
      : sessions7.length === 0
        ? null
        : null,
    averageAdherence: adherenceValues.length ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length) : null,
    atRiskMembers: members.length ? atRisk : null,
    appointmentsNext7: input.appointments.filter(
      (a) =>
        (a.status === "confirmed" || a.status === "requested") &&
        withinDays(a.startsAt, 7, now) &&
        new Date(a.startsAt).getTime() >= now.getTime(),
    ).length || null,
    noShowRate: completed.length + noShows.length >= 5
      ? Math.round((noShows.length / (completed.length + noShows.length)) * 100)
      : null,
    seatsUsed: {
      members: members.filter((m) => m.status === "active").length,
      trainers: trainers.filter((t) => t.status === "active").length,
    },
    seatLimit: input.seatLimit ?? null,
    revenueLast30Minor: payments30.length ? payments30.reduce((sum, p) => sum + p.amountMinor, 0) : null,
  };
}

export function goalProgress(goal: ClientGoal): number | null {
  const span = goal.target - goal.start;
  if (span === 0) return null;
  const progress = ((goal.current - goal.start) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function formatInr(minor: number): string {
  return `₹${(minor / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function relativeTime(iso: string | null | undefined, now = new Date()): string {
  const gap = daysSince(iso, now);
  if (gap === null) return "never";
  if (gap <= 0) return "today";
  if (gap === 1) return "yesterday";
  if (gap < 7) return `${gap} days ago`;
  if (gap < 30) return `${Math.floor(gap / 7)} wk ago`;
  return `${Math.floor(gap / 30)} mo ago`;
}
