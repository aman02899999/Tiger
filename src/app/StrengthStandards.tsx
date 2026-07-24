import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Strength Standards — enter your bodyweight, sex, and top lifts,   */
/* and see your rank (Untrained → Elite) for each, based on          */
/* bodyweight-ratio standards. Shows where you sit on a tier bar.    */
/* Client-side only, no persistence needed. No SVG.                  */
/* ---------------------------------------------------------------- */

type Sex = "male" | "female";

// Approximate 1RM / bodyweight ratios for the 5 tier boundaries
// (Untrained, Novice, Intermediate, Advanced, Elite thresholds).
// Sourced from common strength-standard tables; illustrative, not exact.
const RATIOS: Record<Sex, Record<string, number[]>> = {
  male: {
    bench:    [0.5, 0.75, 1.0, 1.5, 2.0],
    squat:    [0.75, 1.25, 1.5, 2.0, 2.75],
    deadlift: [1.0, 1.5, 2.0, 2.5, 3.0],
    ohp:      [0.35, 0.55, 0.8, 1.1, 1.4],
  },
  female: {
    bench:    [0.3, 0.5, 0.75, 1.0, 1.5],
    squat:    [0.5, 0.75, 1.25, 1.5, 2.0],
    deadlift: [0.5, 1.0, 1.25, 1.75, 2.5],
    ohp:      [0.2, 0.35, 0.5, 0.75, 1.0],
  },
};

const LIFTS = [
  { key: "bench", label: "Bench Press", icon: "🏋️" },
  { key: "squat", label: "Squat", icon: "🦵" },
  { key: "deadlift", label: "Deadlift", icon: "🔥" },
  { key: "ohp", label: "Overhead Press", icon: "💪" },
];

const TIERS = [
  { name: "Untrained", color: "#94a3b8" },
  { name: "Novice", color: "#0284c7" },
  { name: "Intermediate", color: "#059669" },
  { name: "Advanced", color: "#ea580c" },
  { name: "Elite", color: "#fb923c" },
];

function tierFor(ratio: number, thresholds: number[]) {
  // thresholds = [novice, intermediate-ish...]; returns 0..5 (0 = below untrained)
  let tier = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (ratio >= thresholds[i]) tier = i + 1;
  }
  return tier; // 0 = beginner-of-beginner, 5 = elite+
}

export default function StrengthStandardsPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [bw, setBw] = useState(75);
  const [lifts, setLifts] = useState<Record<string, string>>({});

  const results = useMemo(() => {
    return LIFTS.map((l) => {
      const val = parseFloat(lifts[l.key] ?? "");
      if (!val || !bw) return { ...l, ratio: 0, tier: -1 };
      const ratio = val / bw;
      const thresholds = RATIOS[sex][l.key];
      const tier = tierFor(ratio, thresholds);
      return { ...l, ratio, tier, thresholds };
    });
  }, [lifts, bw, sex]);

  const overall = useMemo(() => {
    const rated = results.filter((r) => r.tier >= 0);
    if (!rated.length) return null;
    const avg = rated.reduce((s, r) => s + r.tier, 0) / rated.length;
    const idx = Math.max(0, Math.min(4, Math.round(avg) - 1));
    return TIERS[idx];
  }, [results]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Strength Standards</h1>
        <p className="text-sm text-[#2a1e16]/68">See how your lifts rank — from Untrained to Elite</p>
      </div>

      {/* Inputs */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/65">Sex</p>
            <div className="inline-flex rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 p-1">
              {(["male", "female"] as Sex[]).map((s) => (
                <button key={s} type="button" onClick={() => setSex(s)} className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${sex === s ? "bg-orange-500 text-white" : "text-[#2a1e16]/62"}`}>{s}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/65">Bodyweight (kg)</span>
            <input type="number" value={bw} onChange={(e) => setBw(Math.max(1, Number(e.target.value)))} className="w-32 rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {LIFTS.map((l) => (
            <label key={l.key} className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65"><span>{l.icon}</span>{l.label} 1RM (kg)</span>
              <input type="number" value={lifts[l.key] ?? ""} onChange={(e) => setLifts({ ...lifts, [l.key]: e.target.value })} placeholder="—" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
            </label>
          ))}
        </div>
      </div>

      {/* Overall */}
      {overall && (
        <div className="glass-card rounded-2xl p-6 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${overall.color}18 0%, transparent 60%)` }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">Overall Rank</p>
          <p className="mt-1 text-4xl font-black" style={{ color: overall.color }}>{overall.name}</p>
        </div>
      )}

      {/* Per-lift results */}
      <div className="space-y-3">
        {results.map((r) => {
          if (r.tier < 0) return null;
          const tier = TIERS[Math.max(0, Math.min(4, r.tier - 1))];
          const pct = Math.min(100, (r.tier / 5) * 100);
          return (
            <div key={r.key} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black">{r.icon} {r.label}</p>
                <div className="text-right">
                  <span className="text-sm font-black" style={{ color: tier.color }}>{tier.name}</span>
                  <span className="ml-2 text-xs text-[#2a1e16]/62">{r.ratio.toFixed(2)}× bw</span>
                </div>
              </div>
              {/* tier bar */}
              <div className="mt-3 flex gap-1">
                {TIERS.map((t, i) => (
                  <div key={t.name} className="h-2 flex-1 rounded-full" style={{ background: i < r.tier ? t.color : "rgba(247,240,223,0.08)" }} />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] font-bold uppercase tracking-[0.08em] text-[#2a1e16]/45">
                {TIERS.map((t) => <span key={t.name}>{t.name.slice(0, 4)}</span>)}
              </div>
              <p className="sr-only">{pct}%</p>
            </div>
          );
        })}
      </div>

      {results.every((r) => r.tier < 0) && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🏋️</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter at least one lift above to see your strength rank.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Standards are approximate bodyweight-ratio guidelines — great for direction, not gospel.</p>
    </div>
  );
}
