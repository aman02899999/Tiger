import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Waist-to-Hip Ratio — a quick, WHO-recognized indicator of health   */
/* risk from fat distribution. Enter waist & hip (cm) and get your     */
/* ratio plus a sex-specific risk category. Metric. No SVG.           */
/* ---------------------------------------------------------------- */

type Sex = "male" | "female";

// WHO risk thresholds for waist-to-hip ratio.
const RISK: Record<Sex, { max: number; label: string; color: string }[]> = {
  male: [
    { max: 0.9, label: "Low risk", color: "#34d399" },
    { max: 0.99, label: "Moderate risk", color: "#d8b35a" },
    { max: 99, label: "High risk", color: "#fb7185" },
  ],
  female: [
    { max: 0.8, label: "Low risk", color: "#34d399" },
    { max: 0.84, label: "Moderate risk", color: "#d8b35a" },
    { max: 99, label: "High risk", color: "#fb7185" },
  ],
};

export default function WaistHipRatioPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  const result = useMemo(() => {
    const w = Number(waist), h = Number(hip);
    if (!w || !h || w <= 0 || h <= 0) return null;
    const ratio = w / h;
    if (!isFinite(ratio) || ratio <= 0 || ratio > 2) return null;
    const cat = RISK[sex].find((r) => ratio <= r.max) ?? RISK[sex][RISK[sex].length - 1];
    // Shape descriptor.
    const shape = ratio >= (sex === "male" ? 0.9 : 0.8) ? "Apple 🍎" : "Pear 🍐";
    return { ratio, cat, shape };
  }, [sex, waist, hip]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Waist-to-Hip Ratio</h1>
        <p className="text-sm text-[#f7f0df]/68">A fast health check — where you carry fat matters as much as how much</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/65">Sex</p>
          <div className="inline-flex rounded-full border border-[#f7f0df]/12 bg-[#f7f0df]/5 p-1">
            {(["male", "female"] as Sex[]).map((s) => (
              <button key={s} type="button" onClick={() => setSex(s)} className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${sex === s ? "bg-violet-500 text-white" : "text-[#f7f0df]/62"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/65">Waist (cm) <span className="font-normal normal-case tracking-normal text-[#f7f0df]/45">· at the navel</span></span>
            <input type="number" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/65">Hip (cm) <span className="font-normal normal-case tracking-normal text-[#f7f0df]/45">· widest point</span></span>
            <input type="number" inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
          </label>
        </div>
      </div>

      {result ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${result.cat.color}20 0%, transparent 60%)` }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62">Your Ratio</p>
            <p className="mt-2 text-6xl font-black tabular-nums" style={{ color: result.cat.color }}>{result.ratio.toFixed(2)}</p>
            <p className="mt-2 text-2xl font-black" style={{ color: result.cat.color }}>{result.cat.label}</p>
            <p className="mt-2 text-sm text-[#f7f0df]/68">Body-shape tendency: <span className="font-bold">{result.shape}</span></p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Risk Scale ({sex})</p>
            <div className="flex gap-1">
              {RISK[sex].map((r) => (
                <div key={r.label} className="flex-1 text-center">
                  <div className="h-2 rounded-full" style={{ background: r.label === result.cat.label ? r.color : `${r.color}40` }} />
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.04em] text-[#f7f0df]/55">{r.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">📐</div>
          <p className="mt-3 text-sm text-[#f7f0df]/68">Enter your waist and hip measurements to see your ratio and risk category.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#f7f0df]/55">Carrying fat around the waist (apple shape) raises cardiometabolic risk more than lower-body fat. A single metric — pair it with body-fat % for the full picture.</p>
    </div>
  );
}
