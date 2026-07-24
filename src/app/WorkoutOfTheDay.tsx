import { useMemo, useState } from "react";
import { addXP } from "./Achievements";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Workout of the Day — generate a full, ready-to-do session from     */
/* your goal, available equipment, and time. Deterministic per        */
/* (goal, equipment, time, shuffle) so it's stable until you reroll.  */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

interface Ex { name: string; scheme: string; icon: string; equip: "none" | "dumbbell" | "barbell" | "machine" }

const POOL: Record<string, Ex[]> = {
  strength: [
    { name: "Back Squat", scheme: "5 × 5", icon: "🦵", equip: "barbell" },
    { name: "Bench Press", scheme: "5 × 5", icon: "🏋️", equip: "barbell" },
    { name: "Deadlift", scheme: "3 × 5", icon: "🔩", equip: "barbell" },
    { name: "Overhead Press", scheme: "5 × 5", icon: "🙌", equip: "barbell" },
    { name: "Dumbbell Row", scheme: "4 × 8", icon: "💪", equip: "dumbbell" },
    { name: "Goblet Squat", scheme: "4 × 8", icon: "🦵", equip: "dumbbell" },
    { name: "Push-ups", scheme: "4 × AMRAP", icon: "🤸", equip: "none" },
    { name: "Pull-ups", scheme: "4 × AMRAP", icon: "🧗", equip: "none" },
    { name: "Leg Press", scheme: "4 × 10", icon: "🦿", equip: "machine" },
  ],
  hypertrophy: [
    { name: "Incline DB Press", scheme: "4 × 10", icon: "🏋️", equip: "dumbbell" },
    { name: "Romanian Deadlift", scheme: "4 × 10", icon: "🔩", equip: "barbell" },
    { name: "Lat Pulldown", scheme: "4 × 12", icon: "⬇️", equip: "machine" },
    { name: "Dumbbell Curl", scheme: "3 × 12", icon: "💪", equip: "dumbbell" },
    { name: "Triceps Pushdown", scheme: "3 × 12", icon: "🔽", equip: "machine" },
    { name: "Walking Lunges", scheme: "3 × 12/leg", icon: "🚶", equip: "none" },
    { name: "Lateral Raises", scheme: "3 × 15", icon: "🪽", equip: "dumbbell" },
    { name: "Bodyweight Dips", scheme: "3 × AMRAP", icon: "🤸", equip: "none" },
  ],
  fatloss: [
    { name: "Kettlebell Swings", scheme: "5 × 20", icon: "🔔", equip: "dumbbell" },
    { name: "Burpees", scheme: "5 × 12", icon: "⚡", equip: "none" },
    { name: "Mountain Climbers", scheme: "4 × 40s", icon: "🧗", equip: "none" },
    { name: "Jump Squats", scheme: "4 × 15", icon: "🦘", equip: "none" },
    { name: "DB Thrusters", scheme: "4 × 12", icon: "🏋️", equip: "dumbbell" },
    { name: "High Knees", scheme: "4 × 40s", icon: "🏃", equip: "none" },
    { name: "Rowing Machine", scheme: "5 × 250m", icon: "🚣", equip: "machine" },
    { name: "Plank", scheme: "4 × 45s", icon: "🧘", equip: "none" },
  ],
  endurance: [
    { name: "Easy Run", scheme: "20 min Z2", icon: "🏃", equip: "none" },
    { name: "Air Squats", scheme: "5 × 25", icon: "🦵", equip: "none" },
    { name: "Push-ups", scheme: "5 × 15", icon: "🤸", equip: "none" },
    { name: "Jumping Jacks", scheme: "5 × 50", icon: "⭐", equip: "none" },
    { name: "Bike Intervals", scheme: "6 × 1 min hard", icon: "🚴", equip: "machine" },
    { name: "Walking Lunges", scheme: "4 × 20", icon: "🚶", equip: "none" },
    { name: "Flutter Kicks", scheme: "4 × 40s", icon: "🦵", equip: "none" },
  ],
};

const GOALS = [
  { id: "strength", label: "Strength", icon: "🏋️" },
  { id: "hypertrophy", label: "Muscle", icon: "💪" },
  { id: "fatloss", label: "Fat Loss", icon: "🔥" },
  { id: "endurance", label: "Endurance", icon: "🏃" },
];

const EQUIP = [
  { id: "none", label: "Bodyweight only" },
  { id: "dumbbell", label: "Dumbbells" },
  { id: "full", label: "Full gym" },
];

// Simple deterministic seeded shuffle (no Math.random — stable per inputs).
function seededOrder(len: number, seed: number): number[] {
  const idx = Array.from({ length: len }, (_, i) => i);
  for (let i = len - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export default function WorkoutOfTheDayPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState("strength");
  const [equip, setEquip] = useState("full");
  const [minutes, setMinutes] = useState(45);
  const [shuffle, setShuffle] = useState(0);

  const workout = useMemo(() => {
    const allowed = (e: Ex) =>
      equip === "full" ? true : equip === "dumbbell" ? e.equip === "none" || e.equip === "dumbbell" : e.equip === "none";
    const pool = POOL[goal].filter(allowed);
    // ~1 exercise per 7 minutes, clamped 3–7.
    const count = Math.max(3, Math.min(7, Math.round(minutes / 7)));
    const seed = goal.length * 31 + equip.length * 17 + minutes * 7 + shuffle * 101;
    const order = seededOrder(pool.length, seed);
    return order.slice(0, count).map((i) => pool[i]);
  }, [goal, equip, minutes, shuffle]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Workout of the Day</h1>
        <p className="text-sm text-[#2a1e16]/68">No plan? Generate a full session tailored to your goal, gear, and time</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/65">Goal</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g.id} type="button" onClick={() => setGoal(g.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${goal === g.id ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{g.icon} {g.label}</button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/65">Equipment</p>
        <div className="flex flex-wrap gap-2">
          {EQUIP.map((e) => (
            <button key={e.id} type="button" onClick={() => setEquip(e.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${equip === e.id ? "bg-amber-500/80 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{e.label}</button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/65"><span>Time available</span><span className="text-[#ea580c]">{minutes} min</span></span>
          <input type="range" min={20} max={60} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-orange-400" />
        </label>

        <button type="button" onClick={() => setShuffle((s) => s + 1)} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">🎲 Reroll Workout</button>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Today's Session</p>
          <span className="text-xs text-[#2a1e16]/62">{workout.length} exercises · ~{minutes} min</span>
        </div>
        <ol className="mt-4 space-y-2">
          {workout.map((ex, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500/70 text-sm">{ex.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{i + 1}. {ex.name}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#ea580c]/15 px-3 py-1 text-xs font-black text-[#ea580c]">{ex.scheme}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => { addXP(user?.email, 20); }} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#052e1f]">✓ Completed Today's WOD (+20 XP)</button>
      </div>

      <p className="text-center text-[11px] text-[#2a1e16]/55">Warm up first, keep 60–120s rest between strength sets, and push the last reps. Reroll anytime for variety.</p>
    </div>
  );
}
