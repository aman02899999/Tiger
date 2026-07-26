/* ═══════════════════════════════════════════════════════════════════
   TITAN INTELLIGENCE — the app's problem-solving engine.
   ───────────────────────────────────────────────────────────────────
   Until now the dashboard printed hardcoded numbers ("82% energy",
   "94 Titan Score", "87% goal chance") that never changed, no matter
   what the user logged. Every feature page wrote real data to
   localStorage, but nothing ever read it back across features.

   This module is the missing layer: it reads every store, derives
   HONEST scores, and — most importantly — turns them into ranked,
   actionable fixes. It is deliberately pure (data in → insight out)
   so it can be unit-tested without React or a browser.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Stored shapes (mirrors of what each feature page writes) ────── */

export interface Night { date: string; hours: number; quality: number } // quality 1..5
export interface MetricEntry { date: string; values: Partial<Record<string, number>> }
export interface MoodEntry { date: string; moodId: string; stress: number; note: string }
export type ConsistencyMap = Record<string, number>; // isoDate -> intensity 0..4
export interface ReadinessDay { answers: Record<string, number>; score: number }

export interface UserLike {
  email?: string | null;
  name?: string;
  age?: number;
  height?: number;
  weight?: number;
  goal?: string;
  streak?: number;
  stats?: { totalWorkouts?: number };
}

export interface TitanData {
  sleep: Night[];
  metrics: MetricEntry[];
  mood: MoodEntry[];
  consistency: ConsistencyMap;
  readiness: ReadinessDay | null;
  waterMl: number;
  waterGoalMl: number;
  user: UserLike | null;
}

/* ── Date helpers ────────────────────────────────────────────────── */

export function isoDay(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

/* ── Safe localStorage reader ────────────────────────────────────── */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Pull every store the app writes into one snapshot. */
export function collectTitanData(user: UserLike | null): TitanData {
  const who = user?.email ?? "guest";
  const today = isoDay();
  return {
    sleep: read<Night[]>(`tfp_sleep_${who}`, []),
    metrics: read<MetricEntry[]>(`tfp_metrics_${who}`, []),
    mood: read<MoodEntry[]>(`tfp_mood_journal_${who}`, []),
    consistency: read<ConsistencyMap>(`tfp_consistency_${who}`, {}),
    readiness: read<ReadinessDay | null>(`tfp_readiness_${who}_${today}`, null),
    waterMl: Number(read<number | string>(`tfp_water_${who}_${today}`, 0)) || 0,
    waterGoalMl: 3000,
    user,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   SCORES — every one is derived, and every one reports its confidence
   so the UI can say "log more to sharpen this" instead of bluffing.
   ═══════════════════════════════════════════════════════════════════ */

export interface Score {
  value: number;          // 0..100
  /** How much real data backs this number, 0..1. */
  confidence: number;
  /** True when we had nothing to go on and returned a neutral default. */
  estimated: boolean;
  detail: string;
}

/** Sleep debt in hours across the last 7 nights, vs an 8h target. */
export function sleepDebt(sleep: Night[], target = 8): number {
  const week = sleep.filter((n) => n.date >= daysAgo(6));
  if (!week.length) return 0;
  return Math.round(week.reduce((s, n) => s + (target - n.hours), 0) * 10) / 10;
}

/**
 * Today's Energy — the number the whole dashboard leads with.
 * Priority: an explicit readiness check-in wins; otherwise we infer it
 * from last night's sleep, recent stress and training load.
 */
export function energyScore(d: TitanData): Score {
  if (d.readiness) {
    return {
      value: clamp(Math.round(d.readiness.score)),
      confidence: 1,
      estimated: false,
      detail: "From today's recovery check-in",
    };
  }

  const parts: number[] = [];
  let confidence = 0;

  const lastNight = d.sleep.find((n) => n.date === isoDay()) ?? d.sleep[0];
  if (lastNight) {
    // 8h and quality 5 => 100. Hours weighted 70%, subjective quality 30%.
    const hoursScore = clamp((lastNight.hours / 8) * 100);
    const qualityScore = clamp((lastNight.quality / 5) * 100);
    parts.push(hoursScore * 0.7 + qualityScore * 0.3);
    confidence += 0.5;
  }

  const recentMood = d.mood.find((m) => m.date >= daysAgo(1));
  if (recentMood) {
    // stress 1 (calm) => 100, stress 5 (overwhelmed) => 20
    parts.push(clamp(110 - recentMood.stress * 20));
    confidence += 0.3;
  }

  // Heavy load in the last 3 days drags energy down.
  const load = [0, 1, 2].reduce((s, i) => s + (d.consistency[daysAgo(i)] ?? 0), 0);
  if (load > 0) {
    parts.push(clamp(100 - (load - 3) * 12, 45, 100));
    confidence += 0.2;
  }

  if (!parts.length) {
    return { value: 70, confidence: 0, estimated: true, detail: "Log sleep to personalise this" };
  }
  return {
    value: clamp(Math.round(mean(parts))),
    confidence: Math.min(1, confidence),
    estimated: false,
    detail: "Inferred from sleep, stress & training load",
  };
}

/**
 * Titan Score — a single composite of the five habits that actually
 * drive results. Each pillar is scored 0..100 then weighted.
 */
export function titanScore(d: TitanData): Score & { pillars: { key: string; label: string; value: number; weight: number }[] } {
  const activeDays = Object.keys(d.consistency).filter((k) => k >= daysAgo(27) && d.consistency[k] > 0).length;
  const training = clamp((activeDays / 16) * 100); // ~4x/week over 4 weeks = 100

  const week = d.sleep.filter((n) => n.date >= daysAgo(6));
  const sleepPillar = week.length ? clamp((mean(week.map((n) => n.hours)) / 8) * 100) : 0;

  const recentMood = d.mood.filter((m) => m.date >= daysAgo(6));
  const stressPillar = recentMood.length ? clamp(110 - mean(recentMood.map((m) => m.stress)) * 20) : 0;

  const hydration = d.waterGoalMl > 0 ? clamp((d.waterMl / d.waterGoalMl) * 100) : 0;

  const logged = d.metrics.filter((m) => m.date >= daysAgo(27)).length;
  const tracking = clamp((logged / 4) * 100); // weekly weigh-in = 100

  const pillars = [
    { key: "training", label: "Training", value: Math.round(training), weight: 0.34 },
    { key: "sleep", label: "Sleep", value: Math.round(sleepPillar), weight: 0.26 },
    { key: "stress", label: "Stress", value: Math.round(stressPillar), weight: 0.16 },
    { key: "hydration", label: "Hydration", value: Math.round(hydration), weight: 0.12 },
    { key: "tracking", label: "Tracking", value: Math.round(tracking), weight: 0.12 },
  ];

  const present = pillars.filter((p) => p.value > 0);
  const confidence = present.length / pillars.length;
  // Re-normalise across pillars we actually have data for, so a user who
  // only logs training isn't punished down to 34/100.
  const totalWeight = present.reduce((s, p) => s + p.weight, 0) || 1;
  const value = present.length
    ? Math.round(present.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight)
    : 0;

  return {
    value,
    confidence,
    estimated: present.length === 0,
    detail: `${present.length}/5 pillars tracked`,
    pillars,
  };
}

/**
 * Goal chance — probability-style estimate of hitting the user's goal,
 * driven by consistency and (where available) real trend direction.
 */
export function goalChance(d: TitanData): Score {
  const t = titanScore(d);
  if (t.estimated) {
    return { value: 50, confidence: 0, estimated: true, detail: "Start logging to forecast this" };
  }

  let value = t.value;

  // Weight trend, if we have two readings a week apart.
  const weights = d.metrics
    .filter((m) => m.values.weight != null)
    .slice(0, 8)
    .map((m) => ({ date: m.date, w: m.values.weight as number }));

  let trendNote = "";
  if (weights.length >= 2) {
    const newest = weights[0];
    const oldest = weights[weights.length - 1];
    const delta = newest.w - oldest.w;
    const goal = d.user?.goal ?? "general";
    const movingRight =
      (goal === "fat-loss" || goal === "wedding") ? delta < -0.2 :
      goal === "muscle-gain" ? delta > 0.2 :
      Math.abs(delta) < 1.5;
    value = clamp(value + (movingRight ? 12 : -10));
    trendNote = movingRight ? " · trend on track" : " · trend needs a nudge";
  }

  const streak = d.user?.streak ?? 0;
  if (streak >= 7) value = clamp(value + 5);

  // Never show 100%. Adherence is never certain, and promising certainty
  // is both dishonest and demotivating the first time life gets in the way.
  value = clamp(value, 5, 95);

  return {
    value: Math.round(value),
    confidence: t.confidence,
    estimated: false,
    detail: `Based on your habits${trendNote}`,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   INSIGHTS — the actual "problem solver".
   Each insight names a specific problem, explains why it matters, and
   gives ONE next action wired to a real screen in the app.
   ═══════════════════════════════════════════════════════════════════ */

export type Severity = "critical" | "warning" | "opportunity" | "win";

export interface Insight {
  id: string;
  severity: Severity;
  icon: string;
  title: string;
  /** Plain-language explanation of the problem and its consequence. */
  body: string;
  /** The single next action. */
  action?: { label: string; section: string };
  /** Higher sorts first. */
  priority: number;
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 1000,
  warning: 700,
  opportunity: 400,
  win: 100,
};

/**
 * Produce a ranked list of what to do about the user's data.
 * Ordering: severity first, then per-insight priority.
 */
export function buildInsights(d: TitanData): Insight[] {
  const out: Insight[] = [];

  // True cold start: a brand-new account. Three separate "you aren't
  // tracking X" nags is a hostile first impression, so we show a single
  // welcoming next step instead and let the nags appear once the user
  // has actually started logging.
  const hasAnyData =
    d.sleep.length > 0 ||
    d.metrics.length > 0 ||
    d.mood.length > 0 ||
    Object.keys(d.consistency).length > 0 ||
    d.readiness != null ||
    d.waterMl > 0;

  if (!hasAnyData) {
    return [
      {
        id: "welcome",
        severity: "opportunity",
        icon: "👋",
        title: "Let's build your baseline",
        body:
          "Log one workout, one night of sleep and one weigh-in. That's enough for Titan Intelligence to start " +
          "spotting patterns and telling you exactly what to fix.",
        action: { label: "Start with a workout", section: "workouts" },
        priority: 40,
      },
    ];
  }

  /* ── Sleep ──────────────────────────────────────────────────── */
  const debt = sleepDebt(d.sleep);
  const week = d.sleep.filter((n) => n.date >= daysAgo(6));

  if (week.length >= 3 && debt >= 7) {
    out.push({
      id: "sleep-debt-high",
      severity: "critical",
      icon: "😴",
      title: `You're carrying ${debt}h of sleep debt`,
      body:
        "Under-sleeping blunts recovery, raises appetite and cuts strength. This is the single biggest thing " +
        "holding your results back right now — training harder won't fix it.",
      action: { label: "Open Sleep & Recovery", section: "sleeprecovery" },
      priority: 95,
    });
  } else if (week.length >= 3 && debt >= 3.5) {
    out.push({
      id: "sleep-debt-mild",
      severity: "warning",
      icon: "🌙",
      title: `${debt}h of sleep debt this week`,
      body: "You're slightly under. An extra 30–45 minutes for the next three nights clears this before it compounds.",
      action: { label: "Log tonight's sleep", section: "sleeprecovery" },
      priority: 70,
    });
  }

  /* ── Stress ─────────────────────────────────────────────────── */
  const recentMood = d.mood.filter((m) => m.date >= daysAgo(6));
  const avgStress = recentMood.length ? mean(recentMood.map((m) => m.stress)) : 0;
  if (recentMood.length >= 3 && avgStress >= 4) {
    out.push({
      id: "stress-high",
      severity: "critical",
      icon: "🌩️",
      title: "Stress has been high all week",
      body:
        "Sustained stress keeps cortisol elevated, which slows fat loss and recovery. Ten minutes of breathing " +
        "work today will do more for your progress than an extra set.",
      action: { label: "Start a breathing session", section: "hearthealth" },
      priority: 90,
    });
  }

  /* ── Overtraining: hard days with poor recovery ─────────────── */
  const load7 = Array.from({ length: 7 }, (_, i) => d.consistency[daysAgo(i)] ?? 0);
  const activeCount = load7.filter((v) => v > 0).length;
  const avgSleep = week.length ? mean(week.map((n) => n.hours)) : 8;
  if (activeCount >= 6 && avgSleep < 7) {
    out.push({
      id: "overtraining-risk",
      severity: "warning",
      icon: "⚠️",
      title: "Injury risk climbing",
      body:
        `You trained ${activeCount} of the last 7 days on ${avgSleep.toFixed(1)}h average sleep. ` +
        "That combination is where most avoidable injuries happen. Take a deload or a full rest day.",
      action: { label: "Check recovery readiness", section: "readiness" },
      priority: 88,
    });
  }

  /* ── Consistency gap ────────────────────────────────────────── */
  if (activeCount === 0 && Object.keys(d.consistency).length > 0) {
    out.push({
      id: "inactive-week",
      severity: "warning",
      icon: "🔄",
      title: "No sessions logged in 7 days",
      body:
        "Momentum is the hardest thing to rebuild and the easiest to keep. Don't try to make up for lost time — " +
        "just do one short session today to restart the streak.",
      action: { label: "Start a 25-min workout", section: "workouts" },
      priority: 85,
    });
  } else if (activeCount >= 1 && activeCount <= 2) {
    out.push({
      id: "low-frequency",
      severity: "opportunity",
      icon: "📈",
      title: `Only ${activeCount} session${activeCount === 1 ? "" : "s"} this week`,
      body:
        "Three sessions a week is the threshold where progress becomes reliable. One more session would put you there.",
      action: { label: "Plan your week", section: "calendar" },
      priority: 60,
    });
  }

  /* ── Hydration ──────────────────────────────────────────────── */
  if (d.waterMl > 0 && d.waterMl < d.waterGoalMl * 0.5) {
    const short = ((d.waterGoalMl - d.waterMl) / 1000).toFixed(1);
    out.push({
      id: "hydration-low",
      severity: "opportunity",
      icon: "💧",
      title: `${short}L behind on water`,
      body: "Even 2% dehydration measurably reduces strength output and makes hunger feel like appetite. Easy fix.",
      action: { label: "Log a glass", section: "nutrition" },
      priority: 45,
    });
  }

  /* ── Tracking gaps — we can't help with what we can't see ───── */
  if (!d.sleep.length) {
    out.push({
      id: "no-sleep-data",
      severity: "opportunity",
      icon: "🛏️",
      title: "Sleep isn't being tracked",
      body:
        "Sleep is the strongest predictor of recovery, and it's the one input we're missing. Logging takes five " +
        "seconds and immediately sharpens your Energy score.",
      action: { label: "Log last night", section: "sleeprecovery" },
      priority: 55,
    });
  }
  if (!d.metrics.length) {
    out.push({
      id: "no-metrics",
      severity: "opportunity",
      icon: "📐",
      title: "No body measurements yet",
      body:
        "The scale alone lies — waist and arm measurements reveal recomposition the scale hides. One entry now " +
        "gives you a baseline to beat.",
      action: { label: "Add a baseline", section: "bodymetrics" },
      priority: 50,
    });
  }
  if (!d.readiness) {
    out.push({
      id: "no-readiness",
      severity: "opportunity",
      icon: "🔋",
      title: "Today's readiness check-in is open",
      body: "Thirty seconds, five questions. It replaces every estimate below with your real numbers for today.",
      action: { label: "Check in now", section: "readiness" },
      priority: 58,
    });
  }

  /* ── Wins — reinforce what's working (behavioural anchoring) ── */
  const streak = d.user?.streak ?? 0;
  if (streak >= 7) {
    out.push({
      id: "streak-win",
      severity: "win",
      icon: "🔥",
      title: `${streak}-day streak — protect it`,
      body: "You're in the top tier of consistency. Even a 10-minute session counts to keep this alive.",
      priority: 30,
    });
  }
  if (week.length >= 5 && avgSleep >= 7.5) {
    out.push({
      id: "sleep-win",
      severity: "win",
      icon: "✅",
      title: `Sleep is dialled in (${avgSleep.toFixed(1)}h avg)`,
      body: "This is the foundation most people never get right. Recovery, appetite and mood all compound from here.",
      priority: 28,
    });
  }

  const weights = d.metrics.filter((m) => m.values.weight != null);
  if (weights.length >= 2) {
    const delta = (weights[0].values.weight as number) - (weights[weights.length - 1].values.weight as number);
    const goal = d.user?.goal ?? "general";
    if ((goal === "fat-loss" || goal === "wedding") && delta <= -0.5) {
      out.push({
        id: "trend-win",
        severity: "win",
        icon: "📉",
        title: `Down ${Math.abs(delta).toFixed(1)}kg and trending right`,
        body: "Your current approach is working. The correct move is to change nothing and keep going.",
        priority: 32,
      });
    }
    if (goal === "muscle-gain" && delta >= 0.5) {
      out.push({
        id: "trend-win-gain",
        severity: "win",
        icon: "📈",
        title: `Up ${delta.toFixed(1)}kg — gaining as planned`,
        body: "Steady gain with training volume this high is exactly the pattern you want.",
        priority: 32,
      });
    }
  }

  /* ── Cold start ─────────────────────────────────────────────── */
  if (!out.length) {
    out.push({
      id: "welcome",
      severity: "opportunity",
      icon: "👋",
      title: "Let's build your baseline",
      body:
        "Log one workout, one night of sleep and one weigh-in. That's enough for Titan Intelligence to start " +
        "spotting patterns and telling you exactly what to fix.",
      action: { label: "Start with a workout", section: "workouts" },
      priority: 40,
    });
  }

  return out.sort(
    (a, b) => SEVERITY_RANK[b.severity] + b.priority - (SEVERITY_RANK[a.severity] + a.priority)
  );
}

/** The one thing to do next — drives the dashboard's primary CTA. */
export function nextBestAction(insights: Insight[]): Insight | null {
  return insights.find((i) => i.action && i.severity !== "win") ?? null;
}
