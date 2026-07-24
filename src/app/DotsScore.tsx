import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* DOTS Strength Score — the modern relative-strength metric used in   */
/* powerlifting. It normalizes your total (or a single lift) for       */
/* bodyweight so lifters of any size can compare fairly. Metric (kg).  */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

type Sex = "male" | "female";

// Official DOTS polynomial coefficients.
const COEF: Record<Sex, number[]> = {
  //        a,            b,           c,             d,               e
  male:   [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093],
  female: [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706],
};

function dotsCoefficient(sex: Sex, bw: number): number {
  const [a, b, c, d, e] = COEF[sex];
  const denom = a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4;
  return 500 / denom;
}

// Rough interpretation bands for a full-power total DOTS score.
const BANDS = [
  { max: 200, label: "Beginner", color: "#0284c7" },
  { max: 300, label: "Novice", color: "#059669" },
  { max: 400, label: "Intermediate", color: "#f97316" },
  { max: 500, label: "Advanced", color: "#ea580c" },
  { max: 9999, label: "Elite", color: "#fb923c" },
];

export default function DotsScorePage() {
  const { user } = useAuth();
  const [sex, setSex] = useState<Sex>("male");
  const [bw, setBw] = useState(String(user?.weight ?? 80));
  const [squat, setSquat] = useState("");
  const [bench, setBench] = useState("");
  const [deadlift, setDeadlift] = useState("");

  const result = useMemo(() => {
    const w = Number(bw);
    if (!w || w < 30 || w > 250) return null;
    const total = (Number(squat) || 0) + (Number(bench) || 0) + (Number(deadlift) || 0);
    if (total <= 0) return null;
    const coeff = dotsCoefficient(sex, w);
    const score = total * coeff;
    if (!isFinite(score) || score <= 0) return null;
    const band = BANDS.find((b) => score <= b.max) ?? BANDS[BANDS.length - 1];
    return { total, score, band };
  }, [sex, bw, squat, bench, deadlift]);

  const lifts = [
    { v: squat, set: setSquat, label: "Squat (kg)", icon: "🦵" },
    { v: bench, set: setBench, label: "Bench (kg)", icon: "🏋️" },
    { v: deadlift, set: setDeadlift, label: "Deadlift (kg)", icon: "🔩" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">DOTS Strength Score</h1>
        <p className="text-sm text-[#2a1e16]/68">Compare your strength fairly at any bodyweight — the modern powerlifting metric</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Sex</p>
            <div className="inline-flex rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 p-1">
              {(["male", "female"] as Sex[]).map((s) => (
                <button key={s} type="button" onClick={() => setSex(s)} className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.1em] transition ${sex === s ? "bg-orange-500 text-white" : "text-[#2a1e16]/62"}`}>{s}</button>
              ))}
            </div>
          </div>
          <label className="block flex-1 min-w-[140px]">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Bodyweight (kg)</span>
            <input type="number" inputMode="decimal" value={bw} onChange={(e) => setBw(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {lifts.map((f) => (
            <label key={f.label} className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">{f.icon} {f.label}</span>
              <input type="number" inputMode="decimal" value={f.v} onChange={(e) => f.set(e.target.value)} placeholder="best 1RM" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
            </label>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#2a1e16]/55">Enter one lift for a single-lift score, or all three for your full powerlifting total.</p>
      </div>

      {result ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${result.band.color}20 0%, transparent 60%)` }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">Your DOTS Score</p>
            <p className="mt-2 text-6xl font-black tabular-nums" style={{ color: result.band.color }}>{result.score.toFixed(1)}</p>
            <p className="mt-2 text-2xl font-black" style={{ color: result.band.color }}>{result.band.label}</p>
            <p className="mt-2 text-sm text-[#2a1e16]/68">Total lifted: <span className="font-bold tabular-nums">{result.total} kg</span></p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Strength Level</p>
            <div className="flex gap-1">
              {BANDS.map((b) => (
                <div key={b.label} className="flex-1 text-center">
                  <div className="h-2 rounded-full" style={{ background: b.label === result.band.label ? b.color : `${b.color}40` }} />
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[#2a1e16]/55">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🏆</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter your bodyweight and at least one lift to see your DOTS score.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">DOTS replaced the older Wilks formula as the fairest way to compare lifters across bodyweights.</p>
    </div>
  );
}
