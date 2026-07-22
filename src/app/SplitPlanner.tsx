import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Workout Split Planner — pick how many days a week you can train    */
/* and your experience level, and get a proven weekly split mapped    */
/* to each day with the muscles and a focus cue. Saveable. No SVG.    */
/* ---------------------------------------------------------------- */

interface DayPlan { day: string; focus: string; icon: string; muscles: string; cue: string }

// Curated splits keyed by days/week. Each is a battle-tested template.
const SPLITS: Record<number, { name: string; blurb: string; days: DayPlan[] }> = {
  3: {
    name: "Full-Body 3×",
    blurb: "Best bang-for-buck for beginners and busy lifters — hit everything 3× a week.",
    days: [
      { day: "Mon", focus: "Full Body A", icon: "🏋️", muscles: "Squat · Bench · Row", cue: "Compound-led, 3–4 sets each." },
      { day: "Wed", focus: "Full Body B", icon: "🦵", muscles: "Deadlift · Overhead Press · Pull-up", cue: "Swap the main lifts, keep intensity." },
      { day: "Fri", focus: "Full Body C", icon: "💪", muscles: "Front Squat · Incline · Lat Pulldown", cue: "Finish with arms & core." },
    ],
  },
  4: {
    name: "Upper / Lower",
    blurb: "Two upper and two lower days — great strength/size balance with a rest built in.",
    days: [
      { day: "Mon", focus: "Upper Power", icon: "💪", muscles: "Chest · Back · Shoulders", cue: "Heavy 4–6 reps on the big lifts." },
      { day: "Tue", focus: "Lower Power", icon: "🦵", muscles: "Quads · Hams · Glutes", cue: "Squat & deadlift focus." },
      { day: "Thu", focus: "Upper Hypertrophy", icon: "🏋️", muscles: "Chest · Back · Arms", cue: "8–12 reps, chase the pump." },
      { day: "Fri", focus: "Lower Hypertrophy", icon: "🍑", muscles: "Legs · Calves · Core", cue: "Higher volume, shorter rest." },
    ],
  },
  5: {
    name: "Push / Pull / Legs + Upper/Lower",
    blurb: "The classic PPL rolled into 5 days — high frequency for intermediate lifters.",
    days: [
      { day: "Mon", focus: "Push", icon: "🙌", muscles: "Chest · Shoulders · Triceps", cue: "Press first, isolate after." },
      { day: "Tue", focus: "Pull", icon: "🎣", muscles: "Back · Biceps · Rear delts", cue: "Row & pull-up variations." },
      { day: "Wed", focus: "Legs", icon: "🦵", muscles: "Quads · Hams · Glutes · Calves", cue: "Squat-centred leg day." },
      { day: "Thu", focus: "Upper", icon: "💪", muscles: "Chest · Back · Arms", cue: "Balanced push/pull volume." },
      { day: "Fri", focus: "Lower", icon: "🍑", muscles: "Legs · Core", cue: "Deadlift + accessories." },
    ],
  },
  6: {
    name: "Push / Pull / Legs ×2",
    blurb: "Each muscle twice a week at high volume — for experienced lifters who recover well.",
    days: [
      { day: "Mon", focus: "Push A", icon: "🙌", muscles: "Chest · Shoulders · Triceps", cue: "Strength emphasis." },
      { day: "Tue", focus: "Pull A", icon: "🎣", muscles: "Back · Biceps", cue: "Heavy rows & pulls." },
      { day: "Wed", focus: "Legs A", icon: "🦵", muscles: "Quads · Glutes", cue: "Squat focus." },
      { day: "Thu", focus: "Push B", icon: "💪", muscles: "Shoulders · Chest · Triceps", cue: "Hypertrophy emphasis." },
      { day: "Fri", focus: "Pull B", icon: "🏋️", muscles: "Back · Biceps · Rear delts", cue: "Volume & isolation." },
      { day: "Sat", focus: "Legs B", icon: "🍑", muscles: "Hams · Glutes · Calves", cue: "Deadlift focus." },
    ],
  },
};

const LEVEL_ADVICE: Record<string, { label: string; text: string }> = {
  beginner: { label: "Beginner", text: "Stick to 3–4 days and master form on the compounds before adding volume." },
  intermediate: { label: "Intermediate", text: "4–5 days suits you — progressive overload weekly and track your lifts." },
  advanced: { label: "Advanced", text: "5–6 days works if sleep & nutrition are dialled in. Deload every 6–8 weeks." },
};

function storeKey(email: string | null | undefined) { return `tfp_split_${email ?? "guest"}`; }

export default function SplitPlannerPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(4);
  const [level, setLevel] = useState("intermediate");
  const [saved, setSaved] = useState(false);

  const split = SPLITS[days];
  const restDays = 7 - split.days.length;

  const advice = LEVEL_ADVICE[level];

  const savedPlan = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(storeKey(user?.email)) ?? "null"); } catch { return null; }
  }, [user?.email]);

  function savePlan() {
    try { localStorage.setItem(storeKey(user?.email), JSON.stringify({ days, level, name: split.name })); } catch { /* ignore */ }
    setSaved(true);
    addXP(user?.email, 10);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Workout Split Planner</h1>
        <p className="text-sm text-[#f7f0df]/68">Get a proven weekly training split matched to your schedule</p>
      </div>

      {savedPlan && (
        <div className="glass-card rounded-2xl border-gold-glow p-4 text-sm">
          <span className="text-[#d8b35a]">📌 Your saved split:</span> <span className="font-bold">{savedPlan.name}</span> · {savedPlan.days} days/week
        </div>
      )}

      {/* Controls */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">Days you can train per week</p>
        <div className="flex flex-wrap gap-2">
          {[3, 4, 5, 6].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} className={`rounded-full px-5 py-2.5 text-sm font-black transition ${days === d ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{d} days</button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">Experience level</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LEVEL_ADVICE).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setLevel(k)} className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition ${level === k ? "bg-fuchsia-500/80 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{v.label}</button>
          ))}
        </div>
        <p className="mt-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3 text-[11px] text-[#f7f0df]/68">💡 {advice.text}</p>
      </div>

      {/* Plan */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">{split.name}</p>
            <p className="mt-1 text-sm text-[#f7f0df]/68">{split.blurb}</p>
          </div>
          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-200">{restDays} rest day{restDays === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-5 space-y-2.5">
          {split.days.map((d, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
              <div className="w-10 shrink-0 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-300">{d.day}</span>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-500/70 text-lg">{d.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{d.focus}</p>
                <p className="text-[11px] text-[#f7f0df]/62">{d.muscles}</p>
              </div>
              <p className="hidden max-w-[38%] text-right text-[11px] text-[#f7f0df]/55 sm:block">{d.cue}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={savePlan} className={"btn-gloss mt-5 w-full rounded-full py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition " + (saved ? "bg-emerald-500" : "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700")}>{saved ? "✓ Split Saved! (+10 XP)" : "Save This Split (+10 XP)"}</button>
      </div>

      <p className="text-center text-[11px] text-[#f7f0df]/55">Consistency beats the perfect program — pick a split you can actually stick to every week.</p>
    </div>
  );
}
