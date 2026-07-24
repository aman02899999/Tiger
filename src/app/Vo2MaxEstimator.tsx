import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* VO₂ Max & Fitness Age — estimate cardiorespiratory fitness two     */
/* ways: the Cooper 12-minute run test, or the resting-HR method.     */
/* Shows VO₂ max, a fitness category, and an estimated "fitness age". */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

type Method = "cooper" | "resting";
type Sex = "male" | "female";

// Age/sex VO₂max norms (ml/kg/min) → rough "excellent" reference midpoints
// used to derive a fitness-age estimate.
function referenceVo2(age: number, sex: Sex): number {
  // Approximate average VO₂max by age for an average adult.
  const base = sex === "male" ? 45 : 38;
  return base - Math.max(0, age - 25) * 0.3;
}

const CATEGORIES = [
  { max: 30, label: "Poor", color: "#fb7185" },
  { max: 37, label: "Fair", color: "#ea580c" },
  { max: 44, label: "Good", color: "#f97316" },
  { max: 51, label: "Excellent", color: "#34d399" },
  { max: 200, label: "Superior", color: "#38bdf8" },
];

export default function Vo2MaxEstimatorPage() {
  const { user } = useAuth();
  const [method, setMethod] = useState<Method>("cooper");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(String(user?.age ?? 30));
  const [distance, setDistance] = useState(""); // metres in 12 min
  const [resting, setResting] = useState(""); // resting HR

  const result = useMemo(() => {
    const a = Number(age);
    if (!a || a <= 0) return null;
    let vo2: number | null = null;
    if (method === "cooper") {
      const d = Number(distance);
      if (d > 0) vo2 = (d - 504.9) / 44.73; // Cooper test formula
    } else {
      const rest = Number(resting);
      if (rest > 0) {
        const maxHR = 208 - 0.7 * a; // Tanaka
        vo2 = 15.3 * (maxHR / rest); // Uth–Sørensen resting-HR method
      }
    }
    if (vo2 == null || !isFinite(vo2) || vo2 <= 0 || vo2 > 90) return null;
    const cat = CATEGORIES.find((c) => vo2! <= c.max) ?? CATEGORIES[CATEGORIES.length - 1];

    // Fitness age: the age at which this VO₂max is average for this sex.
    const base = sex === "male" ? 45 : 38;
    let fitnessAge = 25 + (base - vo2) / 0.3;
    fitnessAge = Math.max(18, Math.min(80, Math.round(fitnessAge)));

    return { vo2, cat, fitnessAge, ref: referenceVo2(a, sex) };
  }, [method, sex, age, distance, resting]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">VO₂ Max &amp; Fitness Age</h1>
        <p className="text-sm text-[#2a1e16]/68">Estimate your cardio fitness and see how young your heart really is</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="mb-4 inline-flex rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 p-1">
          {([["cooper", "12-min run"], ["resting", "Resting HR"]] as [Method, string][]).map(([m, label]) => (
            <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${method === m ? "bg-orange-500 text-white" : "text-[#2a1e16]/62"}`}>{label}</button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Sex</p>
            <div className="inline-flex rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 p-1">
              {(["male", "female"] as Sex[]).map((s) => (
                <button key={s} type="button" onClick={() => setSex(s)} className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.1em] transition ${sex === s ? "bg-amber-500/80 text-white" : "text-[#2a1e16]/62"}`}>{s}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Age</span>
            <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
          {method === "cooper" ? (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Distance covered in 12 min (metres)</span>
              <input type="number" inputMode="numeric" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="e.g. 2400" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
            </label>
          ) : (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Resting heart rate (bpm)</span>
              <input type="number" inputMode="numeric" value={resting} onChange={(e) => setResting(e.target.value)} placeholder="e.g. 58" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
            </label>
          )}
        </div>
      </div>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${result.cat.color}20 0%, transparent 60%)` }}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">VO₂ Max</p>
              <p className="mt-2 text-5xl font-black tabular-nums" style={{ color: result.cat.color }}>{result.vo2.toFixed(1)}</p>
              <p className="text-[11px] text-[#2a1e16]/55">ml/kg/min</p>
              <p className="mt-3 text-xl font-black" style={{ color: result.cat.color }}>{result.cat.label}</p>
            </div>
            <div className="glass-card rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.14) 0%, transparent 60%)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">Estimated Fitness Age</p>
              <p className="mt-2 text-5xl font-black tabular-nums text-emerald-600">{result.fitnessAge}</p>
              <p className="text-[11px] text-[#2a1e16]/55">years</p>
              <p className="mt-3 text-sm font-bold text-[#2a1e16]/75">{result.fitnessAge < Number(age) ? `🎉 ${Number(age) - result.fitnessAge} yrs younger than your age!` : result.fitnessAge > Number(age) ? "Room to improve — keep training!" : "Right on par with your age."}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Where you sit</p>
            <div className="flex gap-1">
              {CATEGORIES.map((c) => (
                <div key={c.label} className="flex-1 text-center">
                  <div className="h-2 rounded-full" style={{ background: c.label === result.cat.label ? c.color : `${c.color}40` }} />
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[#2a1e16]/55">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🫁</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">{method === "cooper" ? "Run/walk as far as you can in 12 minutes, then enter the distance." : "Enter your resting heart rate (measure it first thing in the morning)."}</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Estimates only — VO₂ max is best measured in a lab, but these methods track your progress well over time.</p>
    </div>
  );
}
