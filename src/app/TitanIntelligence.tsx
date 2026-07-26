import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import {
  buildInsights,
  collectTitanData,
  energyScore,
  goalChance,
  nextBestAction,
  sleepDebt,
  titanScore,
  type Insight,
  type Severity,
  type TitanData,
} from "./insights";
import { Tilt3DCard } from "../components/interactive/Interactive3D";

/* ═══════════════════════════════════════════════════════════════════
   TITAN INTELLIGENCE — the dashboard's problem-solving surface.
   Replaces four hardcoded stat tiles with derived scores plus a ranked
   list of what's actually wrong and the one action that fixes it.
   ═══════════════════════════════════════════════════════════════════ */

const SEVERITY_STYLE: Record<Severity, { ring: string; chip: string; label: string; glow: string }> = {
  critical: {
    ring: "border-rose-400/40",
    chip: "bg-rose-400/15 text-rose-200 border-rose-400/30",
    label: "Fix this first",
    glow: "rgba(255,94,91,0.35)",
  },
  warning: {
    ring: "border-amber-400/40",
    chip: "bg-amber-400/15 text-amber-200 border-amber-400/30",
    label: "Needs attention",
    glow: "rgba(255,182,39,0.30)",
  },
  opportunity: {
    ring: "border-sky-400/35",
    chip: "bg-sky-400/15 text-sky-200 border-sky-400/30",
    label: "Quick win",
    glow: "rgba(59,157,255,0.28)",
  },
  win: {
    ring: "border-emerald-400/35",
    chip: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
    label: "Working well",
    glow: "rgba(52,224,138,0.26)",
  },
};

/** Animated 0–100 dial. Pure CSS conic gradient, no SVG. */
function ScoreDial({
  value,
  label,
  hint,
  estimated,
  accent,
  size = 132,
}: {
  value: number;
  label: string;
  hint: string;
  estimated: boolean;
  accent: string;
  size?: number;
}) {
  const [shown, setShown] = useState(0);

  // Ease the needle up on mount so the number feels "measured".
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = shown;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const deg = (shown / 100) * 360;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative grid place-items-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${accent} ${deg}deg, rgba(233,243,245,0.07) ${deg}deg)`,
          filter: estimated ? "saturate(0.45)" : undefined,
        }}
      >
        <div className="absolute inset-[10px] grid place-items-center rounded-full bg-[#0a141f]">
          <span className="text-3xl font-black tabular-nums text-[#e9f3f5]">{Math.round(shown)}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/50">
            {estimated ? "estimate" : "/ 100"}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e9f3f5]/80">{label}</p>
        <p className="mt-1 max-w-[15rem] text-[11px] leading-4 text-[#e9f3f5]/50">{hint}</p>
      </div>
    </div>
  );
}

/** A single ranked insight card. */
function InsightCard({
  insight,
  onNavigate,
  primary = false,
}: {
  insight: Insight;
  onNavigate: (section: string) => void;
  primary?: boolean;
}) {
  const s = SEVERITY_STYLE[insight.severity];
  return (
    <div
      className={`glass-3d relative rounded-2xl border p-5 ${s.ring}`}
      style={primary ? { boxShadow: `0 18px 60px ${s.glow}` } : undefined}
    >
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9f3f5]/6 text-2xl">
          {insight.icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${s.chip}`}>
            {s.label}
          </span>
          <h4 className="mt-2 text-base font-black leading-snug text-[#e9f3f5]">{insight.title}</h4>
          <p className="mt-1.5 text-sm leading-6 text-[#e9f3f5]/70">{insight.body}</p>
          {insight.action && (
            <button
              type="button"
              onClick={() => onNavigate(insight.action!.section)}
              className="btn-gloss mt-4 rounded-full bg-gradient-to-r from-teal-300 to-sky-400 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#04121a] transition hover:brightness-110"
            >
              {insight.action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Horizontal pillar breakdown for the Titan Score. */
function PillarBars({ pillars }: { pillars: { key: string; label: string; value: number }[] }) {
  return (
    <div className="space-y-2.5">
      {pillars.map((p) => (
        <div key={p.key} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/60">
            {p.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e9f3f5]/8">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${p.value}%`,
                background:
                  p.value === 0
                    ? "rgba(233,243,245,0.15)"
                    : p.value < 40
                    ? "linear-gradient(90deg,#ff8a75,#ff5e5b)"
                    : p.value < 70
                    ? "linear-gradient(90deg,#ffd166,#ffb627)"
                    : "linear-gradient(90deg,#5eead4,#3b9dff)",
              }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-black tabular-nums text-[#e9f3f5]/80">
            {p.value === 0 ? "—" : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TitanIntelligence({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<TitanData | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Re-read on mount and whenever the user returns to the tab, so logging
  // something on another screen is reflected immediately.
  useEffect(() => {
    const refresh = () => setData(collectTitanData(user));
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user]);

  const model = useMemo(() => {
    if (!data) return null;
    const energy = energyScore(data);
    const titan = titanScore(data);
    const goal = goalChance(data);
    const insights = buildInsights(data);
    return {
      energy,
      titan,
      goal,
      insights,
      nba: nextBestAction(insights),
      debt: sleepDebt(data.sleep),
    };
  }, [data]);

  if (!model) return null;

  const { energy, titan, goal, insights, nba } = model;
  const visible = showAll ? insights : insights.slice(0, 3);
  const problems = insights.filter((i) => i.severity !== "win").length;

  return (
    <section className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-200/80">
            🧠 Titan Intelligence
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
            {problems === 0 ? "Everything's on track." : `${problems} thing${problems === 1 ? "" : "s"} to fix today`}
          </h2>
        </div>
        {titan.confidence < 1 && (
          <span className="rounded-full border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#e9f3f5]/55">
            {Math.round(titan.confidence * 100)}% data coverage
          </span>
        )}
      </div>

      {/* ── Scores ─────────────────────────────────────────────── */}
      <Tilt3DCard className="rounded-3xl" max={4} lift={14}>
        <div className="glass-3d rounded-3xl p-6">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              <ScoreDial
                value={energy.value}
                label="Today's Energy"
                hint={energy.detail}
                estimated={energy.estimated}
                accent="linear-gradient(90deg,#5eead4,#3b9dff)"
              />
              <ScoreDial
                value={titan.value}
                label="Titan Score"
                hint={titan.detail}
                estimated={titan.estimated}
                accent="linear-gradient(90deg,#ffd166,#ffb627)"
              />
              <ScoreDial
                value={goal.value}
                label="Goal Chance"
                hint={goal.detail}
                estimated={goal.estimated}
                accent="linear-gradient(90deg,#34e08a,#16c172)"
              />
            </div>

            <div className="min-w-0">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#e9f3f5]/55">
                What builds your Titan Score
              </p>
              <PillarBars pillars={titan.pillars} />
              <p className="mt-4 text-[11px] leading-5 text-[#e9f3f5]/45">
                Scores are computed from what you've actually logged — never invented. Pillars showing “—”
                have no data yet, and are excluded rather than counted as zero.
              </p>
            </div>
          </div>
        </div>
      </Tilt3DCard>

      {/* ── Next best action ───────────────────────────────────── */}
      {nba && (
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#e9f3f5]/55">
            Do this next
          </p>
          <InsightCard insight={nba} onNavigate={onNavigate} primary />
        </div>
      )}

      {/* ── Full ranked list ───────────────────────────────────── */}
      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#e9f3f5]/55">
          Everything we noticed
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {visible
            .filter((i) => !nba || i.id !== nba.id)
            .map((i) => (
              <InsightCard key={i.id} insight={i} onNavigate={onNavigate} />
            ))}
        </div>
        {insights.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="mt-3 w-full rounded-2xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#e9f3f5]/65 transition hover:border-teal-300/30 hover:text-teal-100"
          >
            {showAll ? "Show less" : `Show ${insights.length - 3} more insight${insights.length - 3 === 1 ? "" : "s"}`}
          </button>
        )}
      </div>
    </section>
  );
}
