import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Weight Goal Projector — enter current weight, target, and a safe  */
/* weekly rate, and see your projected finish date, weekly milestone */
/* markers, and the daily calorie shift needed. Client-side. No SVG. */
/* ---------------------------------------------------------------- */

const KCAL_PER_KG = 7700; // ~7,700 kcal per kg of body mass

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function WeightGoalProjectorPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(String(user?.weight ?? 80));
  const [target, setTarget] = useState("72");
  const [rate, setRate] = useState(0.5); // kg per week

  const plan = useMemo(() => {
    const cur = Number(current), tgt = Number(target);
    if (!cur || !tgt || cur === tgt || rate <= 0) return null;
    const losing = tgt < cur;
    const totalChange = Math.abs(cur - tgt);
    const weeks = Math.ceil(totalChange / rate);
    const dailyKcal = Math.round((rate * KCAL_PER_KG) / 7);

    const now = new Date();
    const finish = new Date(now.getTime() + weeks * 7 * 86400000);

    // milestone markers every ~25% of the journey
    const milestones = [0.25, 0.5, 0.75, 1].map((frac) => {
      const w = losing ? cur - totalChange * frac : cur + totalChange * frac;
      const d = new Date(now.getTime() + Math.round(weeks * frac) * 7 * 86400000);
      return { pct: Math.round(frac * 100), weight: w, date: d };
    });

    return { losing, weeks, dailyKcal, finish, totalChange, milestones };
  }, [current, target, rate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Weight Goal Projector</h1>
        <p className="text-sm text-[#2a1e16]/68">See exactly when you'll hit your goal — and what it takes to get there</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Current weight (kg)</span>
            <input type="number" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Target weight (kg)</span>
            <input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65"><span>Weekly rate</span><span className="text-[#ea580c]">{rate.toFixed(2)} kg/week</span></span>
          <input type="range" min={0.1} max={1} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-orange-400" />
          <span className="mt-1 block text-[10px] text-[#2a1e16]/50">0.25–0.75 kg/week is the sustainable, muscle-sparing range for most people.</span>
        </label>
      </div>

      {plan ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.14) 0%, transparent 60%)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">You'll reach {target} kg by</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">{fmtDate(plan.finish)}</p>
            <p className="mt-2 text-sm text-[#2a1e16]/68">{plan.losing ? "Losing" : "Gaining"} {plan.totalChange.toFixed(1)} kg over {plan.weeks} week{plan.weeks === 1 ? "" : "s"}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ea580c]/30 bg-[#ea580c]/10 px-5 py-3">
              <span className="text-lg">{plan.losing ? "🔻" : "🔺"}</span>
              <span className="text-sm font-black text-[#ea580c]">{plan.losing ? "Eat" : "Add"} ~{plan.dailyKcal} kcal/day {plan.losing ? "below" : "above"} maintenance</span>
            </div>
          </div>

          {/* milestone timeline */}
          <div className="glass-card rounded-2xl p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Milestones</p>
            <div className="space-y-3">
              {plan.milestones.map((m) => (
                <div key={m.pct} className="flex items-center gap-4">
                  <div className="w-12 shrink-0 text-right">
                    <span className="text-sm font-black text-[#ea580c]">{m.pct}%</span>
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#2a1e16]/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-400" style={{ width: `${m.pct}%` }} />
                  </div>
                  <div className="w-40 shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums">{m.weight.toFixed(1)} kg</p>
                    <p className="text-[10px] text-[#2a1e16]/55">{fmtDate(m.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🎯</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter a current and a different target weight to see your projection.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Projections assume a steady rate. Real progress isn't perfectly linear — adjust as you go.</p>
    </div>
  );
}
