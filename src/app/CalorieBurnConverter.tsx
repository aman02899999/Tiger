import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Calorie Burn Converter — enter how many calories you want to burn  */
/* (or pick a common treat) and see how long each activity would take */
/* to work it off, scaled to your bodyweight via MET values. No SVG.  */
/* ---------------------------------------------------------------- */

// MET values → kcal/min = MET * 3.5 * kg / 200.
const ACTIVITIES = [
  { id: "walk", label: "Walking", icon: "🚶", met: 3.5 },
  { id: "run", label: "Running", icon: "🏃", met: 9.8 },
  { id: "cycle", label: "Cycling", icon: "🚴", met: 7.5 },
  { id: "swim", label: "Swimming", icon: "🏊", met: 8.0 },
  { id: "jump", label: "Jump Rope", icon: "🪢", met: 11.0 },
  { id: "yoga", label: "Yoga", icon: "🧘", met: 3.0 },
  { id: "hiit", label: "HIIT", icon: "⚡", met: 8.5 },
  { id: "dance", label: "Dancing", icon: "💃", met: 5.0 },
];

// Common treats for one-tap input.
const TREATS = [
  { label: "Samosa", kcal: 260, icon: "🥟" },
  { label: "Gulab Jamun", kcal: 150, icon: "🍮" },
  { label: "Slice of Pizza", kcal: 285, icon: "🍕" },
  { label: "Chocolate Bar", kcal: 230, icon: "🍫" },
  { label: "Masala Chai + Biscuit", kcal: 120, icon: "☕" },
  { label: "Cola (can)", kcal: 140, icon: "🥤" },
];

function fmtMin(min: number): string {
  if (!isFinite(min) || min <= 0) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function CalorieBurnConverterPage() {
  const { user } = useAuth();
  const bw = user?.weight ?? 70;
  const [kcal, setKcal] = useState("300");

  const rows = useMemo(() => {
    const target = Number(kcal);
    if (!target || target <= 0) return null;
    return ACTIVITIES.map((a) => {
      const perMin = (a.met * 3.5 * bw) / 200;
      return { ...a, minutes: target / perMin };
    }).sort((x, y) => x.minutes - y.minutes);
  }, [kcal, bw]);

  const maxMin = rows ? Math.max(...rows.map((r) => r.minutes)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Calorie Burn Converter</h1>
        <p className="text-sm text-[#2a1e16]/68">See exactly how much movement it takes to work off any treat</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Calories to burn</span>
          <input type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
        </label>
        <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Or pick a treat</p>
        <div className="flex flex-wrap gap-2">
          {TREATS.map((t) => (
            <button key={t.label} type="button" onClick={() => setKcal(String(t.kcal))} className="flex items-center gap-1.5 rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 px-3.5 py-1.5 text-xs font-bold text-[#2a1e16]/72 transition hover:text-[#2a1e16]">
              <span>{t.icon}</span>{t.label} <span className="text-[#ea580c]">{t.kcal}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#2a1e16]/55">Estimates scaled to your bodyweight ({bw} kg). Heavier bodies burn more per minute.</p>
      </div>

      {rows ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Time to burn {kcal} kcal</p>
          <div className="space-y-2.5">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500/25 text-lg">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{r.label}</p>
                    <p className="text-sm font-black tabular-nums text-orange-700">{fmtMin(r.minutes)}</p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#2a1e16]/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: `${maxMin ? (r.minutes / maxMin) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🔥</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter a calorie amount or pick a treat to see the numbers.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">You can't out-train a bad diet — but seeing the trade-off helps keep treats in perspective.</p>
    </div>
  );
}
