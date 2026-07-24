import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* RPE Load Calculator — autoregulation for lifters. Enter a weight    */
/* you lifted for some reps at a given RPE, get your estimated 1RM,    */
/* then a table of target loads for any reps × RPE. Metric. No SVG.    */
/* ---------------------------------------------------------------- */

// RPE → %1RM table (reps across the top, RPE down the side).
// Values are the classic Reactive Training Systems percentages.
const RPE_PCT: Record<number, number[]> = {
  // reps:   1      2      3      4      5      6      7      8
  10: [1.000, 0.955, 0.922, 0.892, 0.863, 0.837, 0.811, 0.786],
  9.5: [0.978, 0.939, 0.907, 0.878, 0.850, 0.824, 0.799, 0.774],
  9: [0.955, 0.922, 0.892, 0.863, 0.837, 0.811, 0.786, 0.762],
  8.5: [0.939, 0.907, 0.878, 0.850, 0.824, 0.799, 0.774, 0.751],
  8: [0.922, 0.892, 0.863, 0.837, 0.811, 0.786, 0.762, 0.739],
  7.5: [0.907, 0.878, 0.850, 0.824, 0.799, 0.774, 0.751, 0.723],
  7: [0.892, 0.863, 0.837, 0.811, 0.786, 0.762, 0.739, 0.707],
};

const RPE_OPTIONS = [10, 9.5, 9, 8.5, 8, 7.5, 7];
const REPS = [1, 2, 3, 4, 5, 6, 7, 8];

function pct(rpe: number, reps: number): number | null {
  const row = RPE_PCT[rpe];
  if (!row || reps < 1 || reps > 8) return null;
  return row[reps - 1];
}

export default function RpeCalculatorPage() {
  const [weight, setWeight] = useState("100");
  const [reps, setReps] = useState(5);
  const [rpe, setRpe] = useState(8);
  const [round, setRound] = useState(2.5); // rounding increment

  const est1rm = useMemo(() => {
    const w = Number(weight);
    const p = pct(rpe, reps);
    if (!w || w <= 0 || !p) return null;
    return w / p;
  }, [weight, reps, rpe]);

  const table = useMemo(() => {
    if (!est1rm) return null;
    return RPE_OPTIONS.map((r) => ({
      rpe: r,
      loads: REPS.map((rp) => {
        const p = pct(r, rp);
        if (!p) return null;
        const load = est1rm * p;
        return Math.round(load / round) * round;
      }),
    }));
  }, [est1rm, round]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">RPE Load Calculator</h1>
        <p className="text-sm text-[#2a1e16]/68">Autoregulate your training — find the right weight for any reps and effort</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Weight lifted (kg)</span>
            <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Reps done</span>
            <select value={reps} onChange={(e) => setReps(Number(e.target.value))} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-3 py-2.5 text-sm outline-none">
              {REPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">At RPE</span>
            <select value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-3 py-2.5 text-sm outline-none">
              {RPE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Round to</span>
          {[1.25, 2.5, 5].map((r) => (
            <button key={r} type="button" onClick={() => setRound(r)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${round === r ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/62"}`}>{r} kg</button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#2a1e16]/55">RPE = reps in reserve: RPE 8 ≈ 2 reps left in the tank, RPE 10 = none.</p>
      </div>

      {est1rm ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.16) 0%, transparent 60%)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">Estimated 1-Rep Max</p>
            <p className="mt-2 text-5xl font-black tabular-nums text-orange-700">{(Math.round(est1rm / round) * round).toFixed(1)}<span className="text-xl"> kg</span></p>
          </div>

          <div className="glass-card overflow-x-auto rounded-2xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Target Loads (kg)</p>
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[10px] font-black uppercase tracking-[0.1em] text-[#2a1e16]/55">RPE ＼ Reps</th>
                  {REPS.map((r) => <th key={r} className="p-2 text-center text-xs font-black text-orange-700">{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {table!.map((row) => (
                  <tr key={row.rpe} className="border-t border-[#2a1e16]/8">
                    <td className="p-2 text-xs font-black text-[#ea580c]">{row.rpe}</td>
                    {row.loads.map((l, i) => (
                      <td key={i} className={`p-2 text-center tabular-nums ${row.rpe === rpe && REPS[i] === reps ? "rounded-md bg-orange-500/25 font-black text-orange-700" : "text-[#2a1e16]/75"}`}>{l ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🏋️</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter a weight, reps, and RPE to estimate your 1RM and target loads.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Percentages from the RTS RPE chart. Use these as a starting point and adjust to how the bar actually feels.</p>
    </div>
  );
}
