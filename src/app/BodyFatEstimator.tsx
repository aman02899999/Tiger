import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Body Fat Estimator — U.S. Navy tape method. Enter a few tape      */
/* measurements + height and get an estimated body-fat %, category,  */
/* and lean/fat mass split. All client-side, metric (cm/kg). No SVG. */
/* ---------------------------------------------------------------- */

type Sex = "male" | "female";

// U.S. Navy body-fat formulas (metric, using log10).
function navyBodyFat(sex: Sex, heightCm: number, neckCm: number, waistCm: number, hipCm: number): number | null {
  if (heightCm <= 0 || neckCm <= 0 || waistCm <= 0) return null;
  const log10 = (x: number) => Math.log(x) / Math.LN10;
  if (sex === "male") {
    if (waistCm - neckCm <= 0) return null;
    return 495 / (1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)) - 450;
  }
  if (hipCm <= 0 || waistCm + hipCm - neckCm <= 0) return null;
  return 495 / (1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.221 * log10(heightCm)) - 450;
}

const CATEGORIES: Record<Sex, { max: number; label: string; color: string }[]> = {
  male: [
    { max: 6, label: "Essential", color: "#38bdf8" },
    { max: 14, label: "Athletic", color: "#34d399" },
    { max: 18, label: "Fitness", color: "#a78bfa" },
    { max: 25, label: "Average", color: "#d8b35a" },
    { max: 100, label: "Above average", color: "#fb7185" },
  ],
  female: [
    { max: 14, label: "Essential", color: "#38bdf8" },
    { max: 21, label: "Athletic", color: "#34d399" },
    { max: 25, label: "Fitness", color: "#a78bfa" },
    { max: 32, label: "Average", color: "#d8b35a" },
    { max: 100, label: "Above average", color: "#fb7185" },
  ],
};

export default function BodyFatEstimatorPage() {
  const { user } = useAuth();
  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState(String(user?.height ?? 175));
  const [weight, setWeight] = useState(String(user?.weight ?? 75));
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  const result = useMemo(() => {
    const bf = navyBodyFat(sex, Number(height), Number(neck), Number(waist), Number(hip));
    if (bf == null || !isFinite(bf) || bf <= 0 || bf > 70) return null;
    const cat = CATEGORIES[sex].find((c) => bf <= c.max) ?? CATEGORIES[sex][CATEGORIES[sex].length - 1];
    const w = Number(weight) || 0;
    const fatMass = w ? (bf / 100) * w : 0;
    const leanMass = w ? w - fatMass : 0;
    return { bf, cat, fatMass, leanMass };
  }, [sex, height, weight, neck, waist, hip]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Body Fat Estimator</h1>
        <p className="text-sm text-[#f7f0df]/68">Estimate your body-fat % with the U.S. Navy tape method — just a measuring tape needed</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f7f0df]/65">Sex</p>
          <div className="inline-flex rounded-full border border-[#f7f0df]/12 bg-[#f7f0df]/5 p-1">
            {(["male", "female"] as Sex[]).map((s) => (
              <button key={s} type="button" onClick={() => setSex(s)} className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${sex === s ? "bg-violet-500 text-white" : "text-[#f7f0df]/62"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: height, set: setHeight, label: "Height (cm)", hint: "" },
            { v: weight, set: setWeight, label: "Weight (kg)", hint: "for mass split" },
            { v: neck, set: setNeck, label: "Neck (cm)", hint: "below the larynx" },
            { v: waist, set: setWaist, label: sex === "male" ? "Waist (cm)" : "Waist (cm)", hint: sex === "male" ? "at the navel" : "narrowest point" },
            ...(sex === "female" ? [{ v: hip, set: setHip, label: "Hip (cm)", hint: "widest point" }] : []),
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/65">{f.label}{f.hint && <span className="ml-1 font-normal text-[#f7f0df]/45 normal-case tracking-normal">· {f.hint}</span>}</span>
              <input type="number" inputMode="decimal" value={f.v} onChange={(e) => f.set(e.target.value)} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
            </label>
          ))}
        </div>
      </div>

      {result ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${result.cat.color}18 0%, transparent 60%)` }}>
            <div className="relative mx-auto h-40 w-40">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${result.cat.color} ${Math.min(result.bf, 45) / 45 * 360}deg, rgba(247,240,223,0.1) ${Math.min(result.bf, 45) / 45 * 360}deg)`, transition: "background 0.6s ease" }} />
              <div className="absolute inset-[10px] grid place-items-center rounded-full bg-[#0b0714]">
                <div>
                  <p className="text-4xl font-black tabular-nums" style={{ color: result.cat.color }}>{result.bf.toFixed(1)}<span className="text-lg">%</span></p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#f7f0df]/62">body fat</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-2xl font-black" style={{ color: result.cat.color }}>{result.cat.label}</p>
          </div>

          {result.fatMass > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-2xl font-black tabular-nums text-[#d8b35a]">{result.leanMass.toFixed(1)} kg</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/62">Lean mass</p>
              </div>
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-2xl font-black tabular-nums text-fuchsia-300">{result.fatMass.toFixed(1)} kg</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/62">Fat mass</p>
              </div>
            </div>
          )}

          {/* category scale */}
          <div className="glass-card rounded-2xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Where you sit</p>
            <div className="flex gap-1">
              {CATEGORIES[sex].map((c) => (
                <div key={c.label} className="flex-1 text-center">
                  <div className="h-2 rounded-full" style={{ background: result.bf <= c.max && (CATEGORIES[sex].indexOf(c) === 0 || result.bf > CATEGORIES[sex][CATEGORIES[sex].indexOf(c) - 1].max) ? c.color : `${c.color}40` }} />
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[#f7f0df]/55">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">📏</div>
          <p className="mt-3 text-sm text-[#f7f0df]/68">Fill in your height, neck, and waist{sex === "female" ? " and hip" : ""} measurements to see your estimate.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#f7f0df]/55">The tape method is an estimate (±3–4%). For accuracy use a DEXA scan — but this is great for tracking change over time.</p>
    </div>
  );
}
