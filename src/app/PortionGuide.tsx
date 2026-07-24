import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Hand-Portion Guide — estimate portions without scales or apps      */
/* using your own hand as the measuring tool, plus a per-meal target  */
/* of hand-portions scaled to your bodyweight and goal. No SVG.       */
/* ---------------------------------------------------------------- */

const HAND_RULES = [
  { part: "Palm", icon: "✋", macro: "Protein", note: "1 palm ≈ one protein serving (~20–30g protein)", color: "#f97316" },
  { part: "Fist", icon: "✊", macro: "Vegetables", note: "1 fist ≈ one veg serving — fill up here", color: "#34d399" },
  { part: "Cupped hand", icon: "🤲", macro: "Carbs", note: "1 cupped hand ≈ one carb serving (rice, oats, roti)", color: "#ea580c" },
  { part: "Thumb", icon: "👍", macro: "Fats", note: "1 thumb ≈ one fat serving (oil, nut butter, cheese)", color: "#fb7185" },
];

const GOALS: Record<string, { label: string; protein: number; carb: number; fat: number; veg: number; blurb: string }> = {
  // servings per MEAL (assuming ~3–4 meals/day) as a simple heuristic
  fatloss: { label: "Fat Loss", protein: 2, carb: 1, fat: 1, veg: 2, blurb: "Higher protein & veg, tighter carbs." },
  maintain: { label: "Maintain", protein: 2, carb: 2, fat: 1, veg: 2, blurb: "Balanced across the board." },
  muscle: { label: "Build Muscle", protein: 2, carb: 3, fat: 1, veg: 1, blurb: "More carbs to fuel training & growth." },
};

export default function PortionGuidePage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState("maintain");

  const plan = GOALS[goal];

  // Bigger athletes (heavier bodyweight) get an extra protein palm.
  const proteinPortions = useMemo(() => {
    const bw = user?.weight ?? 75;
    return plan.protein + (bw >= 90 ? 1 : 0);
  }, [plan.protein, user?.weight]);

  const perMeal = [
    { icon: "✋", label: "Protein", count: proteinPortions, unit: "palm", color: "#f97316" },
    { icon: "🤲", label: "Carbs", count: plan.carb, unit: "cupped hand", color: "#ea580c" },
    { icon: "✊", label: "Veg", count: plan.veg, unit: "fist", color: "#34d399" },
    { icon: "👍", label: "Fats", count: plan.fat, unit: "thumb", color: "#fb7185" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Hand-Portion Guide</h1>
        <p className="text-sm text-[#2a1e16]/68">No scales, no logging — portion your plate using just your hand</p>
      </div>

      {/* The rules */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Your hand is your measuring tool</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {HAND_RULES.map((r) => (
            <div key={r.part} className="flex items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl" style={{ background: `${r.color}22` }}>{r.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-black" style={{ color: r.color }}>{r.part} = {r.macro}</p>
                <p className="text-[11px] text-[#2a1e16]/62">{r.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal → per-meal target */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/65">Your goal</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GOALS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setGoal(k)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${goal === k ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{v.label}</button>
          ))}
        </div>
        <p className="mt-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3 text-[11px] text-[#2a1e16]/68">💡 {plan.blurb}</p>

        <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Aim for this each meal</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {perMeal.map((m) => (
            <div key={m.label} className="rounded-2xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4 text-center">
              <div className="text-3xl">{m.icon}</div>
              <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: m.color }}>{m.count}×</p>
              <p className="text-[11px] font-bold text-[#2a1e16]/75">{m.label}</p>
              <p className="text-[9px] uppercase tracking-[0.08em] text-[#2a1e16]/50">{m.count === 1 ? m.unit : `${m.unit}s`}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-[#2a1e16]/55">Hand sizes scale with body size, so portions self-adjust to the person. Simple, portable, and surprisingly accurate.</p>
    </div>
  );
}
