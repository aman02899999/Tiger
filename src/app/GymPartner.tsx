import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Let's Gym — find a nearby workout partner aligned with your       */
/* goals. Filter by age, goal, level, and distance; send buddy       */
/* requests. Demo data, fully client-side.                           */
/* ---------------------------------------------------------------- */

type Goal = "Muscle Gain" | "Fat Loss" | "Powerlifting" | "Calisthenics" | "Running" | "Yoga" | "General Fitness";
type Level = "Beginner" | "Intermediate" | "Advanced";

interface Partner {
  id: number;
  name: string;
  age: number;
  gender: "M" | "F";
  goal: Goal;
  level: Level;
  distanceKm: number;
  gym: string;
  schedule: string;
  bio: string;
  emoji: string;
  matchTags: string[];
}

const PARTNERS: Partner[] = [
  { id: 1, name: "Rohit Verma", age: 26, gender: "M", goal: "Muscle Gain", level: "Intermediate", distanceKm: 1.2, gym: "Gold's Gym, Sector 18", schedule: "Mon–Sat · 6–8 AM", bio: "3 years lifting, chasing a 100kg bench. Need a spotter who shows up.", emoji: "💪", matchTags: ["Push/Pull/Legs", "Early bird", "Protein bro"] },
  { id: 2, name: "Priya Sharma", age: 24, gender: "F", goal: "Fat Loss", level: "Beginner", distanceKm: 2.5, gym: "Cult.fit, City Centre", schedule: "Weekdays · 7–8 PM", bio: "New to the gym and looking for an accountability partner. Consistency > intensity.", emoji: "🔥", matchTags: ["Cardio + weights", "Evening", "Beginner friendly"] },
  { id: 3, name: "Arjun Singh", age: 31, gender: "M", goal: "Powerlifting", level: "Advanced", distanceKm: 3.8, gym: "Iron Temple, MG Road", schedule: "Tue/Thu/Sat · 5–7 PM", bio: "500kg total. Happy to coach squat/bench/deadlift form in exchange for a training partner.", emoji: "🏋️", matchTags: ["SBD", "Form coaching", "Chalk everywhere"] },
  { id: 4, name: "Sneha Patel", age: 28, gender: "F", goal: "Yoga", level: "Intermediate", distanceKm: 0.8, gym: "Anand Yoga Studio", schedule: "Daily · 6–7 AM", bio: "Morning vinyasa practice. Looking for a flow buddy to stay consistent with sunrise sessions.", emoji: "🧘", matchTags: ["Vinyasa", "Sunrise", "Meditation after"] },
  { id: 5, name: "Karan Mehta", age: 22, gender: "M", goal: "Calisthenics", level: "Intermediate", distanceKm: 4.5, gym: "Central Park Bars", schedule: "Sun–Fri · 5–7 PM", bio: "Working toward the muscle-up and front lever. Outdoor bars, bodyweight only.", emoji: "🤸", matchTags: ["Street workout", "Outdoor", "Skills > size"] },
  { id: 6, name: "Ananya Iyer", age: 27, gender: "F", goal: "Running", level: "Advanced", distanceKm: 5.2, gym: "Marine Drive Track", schedule: "Daily · 5:30 AM", bio: "Marathon in 12 weeks. Need a pacer for long Sunday runs — 21K at 5:45/km.", emoji: "🏃", matchTags: ["Marathon prep", "Long runs", "Strava addict"] },
  { id: 7, name: "Vikram Reddy", age: 35, gender: "M", goal: "Fat Loss", level: "Beginner", distanceKm: 1.9, gym: "Anytime Fitness, HSR", schedule: "Weekdays · 8–9 PM", bio: "Desk job, 15kg to lose. Want a no-judgment partner for late evening sessions.", emoji: "🎯", matchTags: ["Late evening", "Weight loss", "Dad bod reform"] },
  { id: 8, name: "Meera Krishnan", age: 25, gender: "F", goal: "Muscle Gain", level: "Intermediate", distanceKm: 3.1, gym: "Fitness First, Koramangala", schedule: "Mon/Wed/Fri · 7–9 AM", bio: "Glute-focused hypertrophy. Looking for a lifting partner who takes progressive overload seriously.", emoji: "🍑", matchTags: ["Hypertrophy", "Tracking macros", "Hip thrust PR"] },
  { id: 9, name: "Aditya Kapoor", age: 29, gender: "M", goal: "General Fitness", level: "Beginner", distanceKm: 2.2, gym: "Talwalkars, Andheri", schedule: "Flexible", bio: "Just moved to the city — all my gym buddies are back home. Looking to rebuild the crew!", emoji: "🤝", matchTags: ["New in town", "Flexible timing", "Good vibes"] },
  { id: 10, name: "Divya Nair", age: 30, gender: "F", goal: "Powerlifting", level: "Intermediate", distanceKm: 6.7, gym: "Barbell Club, Indiranagar", schedule: "Tue/Thu/Sun · 6–8 PM", bio: "140kg deadlift, aiming for 160. Women who lift heavy — let's platform together.", emoji: "⚡", matchTags: ["Deadlift day best day", "Comp prep", "Women who lift"] },
  { id: 11, name: "Sameer Joshi", age: 23, gender: "M", goal: "Muscle Gain", level: "Beginner", distanceKm: 0.5, gym: "Flex Gym, Sector 12", schedule: "Daily · 6–8 PM", bio: "Skinny guy on a mission to gain 10kg. Learning the ropes, need a consistent partner.", emoji: "🌱", matchTags: ["Bulking", "Newbie gains", "Never skips"] },
  { id: 12, name: "Riya Malhotra", age: 26, gender: "F", goal: "General Fitness", level: "Intermediate", distanceKm: 4.0, gym: "Snap Fitness, Powai", schedule: "Weekends + Wed", bio: "Mix of strength, spin and swimming. Weekend warrior looking for the same energy.", emoji: "🌊", matchTags: ["Cross-training", "Weekends", "Swim + lift"] },
];

const GOALS: Goal[] = ["Muscle Gain", "Fat Loss", "Powerlifting", "Calisthenics", "Running", "Yoga", "General Fitness"];
const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

function matchScore(p: Partner, myGoal: Goal | "Any"): number {
  let score = 60;
  if (myGoal !== "Any" && p.goal === myGoal) score += 25;
  score += Math.max(0, 15 - p.distanceKm * 2);
  return Math.min(99, Math.round(score));
}

export default function GymPartnerPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | "Any">("Any");
  const [level, setLevel] = useState<Level | "Any">("Any");
  const [maxDist, setMaxDist] = useState(10);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 45]);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Partner | null>(null);

  const results = useMemo(
    () =>
      PARTNERS.filter(
        (p) =>
          (goal === "Any" || p.goal === goal) &&
          (level === "Any" || p.level === level) &&
          p.distanceKm <= maxDist &&
          p.age >= ageRange[0] &&
          p.age <= ageRange[1]
      ).sort((a, b) => matchScore(b, goal) - matchScore(a, goal)),
    [goal, level, maxDist, ageRange]
  );

  function sendRequest(id: number) {
    setSent((s) => new Set(s).add(id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Let's Gym 🤝</h1>
          <p className="text-sm text-[#e9f3f5]/68">Find a nearby workout partner who matches your goals — never train alone again</p>
        </div>
        <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-200">
          {results.length} partners near you
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-3xl p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100/70">Filter your ideal partner</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Workout Goal</span>
            <select value={goal} onChange={(e) => setGoal(e.target.value as Goal | "Any")} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-3 text-sm outline-none focus:border-violet-200/40">
              <option value="Any">Any goal</option>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Experience Level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as Level | "Any")} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-3 text-sm outline-none focus:border-violet-200/40">
              <option value="Any">Any level</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Max Distance: <span className="text-[#ffb627]">{maxDist} km</span></span>
            <input type="range" min={1} max={10} step={0.5} value={maxDist} onChange={(e) => setMaxDist(Number(e.target.value))} className="w-full accent-violet-400" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Age: <span className="text-[#ffb627]">{ageRange[0]}–{ageRange[1]}</span></span>
            <div className="flex items-center gap-3">
              <input type="number" min={18} max={ageRange[1]} value={ageRange[0]} onChange={(e) => setAgeRange([Number(e.target.value), ageRange[1]])} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-3 text-sm outline-none focus:border-violet-200/40" />
              <span className="text-[#e9f3f5]/65">—</span>
              <input type="number" min={ageRange[0]} max={65} value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], Number(e.target.value)])} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-3 text-sm outline-none focus:border-violet-200/40" />
            </div>
          </label>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="text-5xl">🔍</div>
          <h3 className="mt-4 text-xl font-black">No partners match those filters</h3>
          <p className="mt-2 text-sm text-[#e9f3f5]/68">Try widening the distance or age range — your gym buddy is out there.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => {
            const score = matchScore(p, goal);
            const requested = sent.has(p.id);
            return (
              <div key={p.id} className="glass-card group rounded-2xl p-5 transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-300/25 to-fuchsia-400/15 text-3xl">{p.emoji}</div>
                    <div>
                      <h3 className="font-black">{p.name}</h3>
                      <p className="text-xs text-[#e9f3f5]/68">{p.age} · {p.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${score >= 85 ? "text-emerald-300" : score >= 70 ? "text-[#ffb627]" : "text-[#e9f3f5]/70"}`}>{score}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e9f3f5]/62">match</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="rounded-full bg-violet-200/12 px-2.5 py-1 text-violet-100">{p.goal}</span>
                  <span className="rounded-full bg-[#e9f3f5]/8 px-2.5 py-1 text-[#e9f3f5]/75">📍 {p.distanceKm} km</span>
                  <span className="rounded-full bg-[#e9f3f5]/8 px-2.5 py-1 text-[#e9f3f5]/75">🕐 {p.schedule}</span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#e9f3f5]/70">{p.bio}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => sendRequest(p.id)}
                    disabled={requested}
                    className={`btn-gloss flex-1 rounded-full py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
                      requested
                        ? "cursor-default border border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                        : "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 text-white"
                    }`}
                  >
                    {requested ? "✓ Request Sent" : "🤝 Team Up"}
                  </button>
                  <button type="button" onClick={() => setSelected(p)} className="rounded-full border border-[#e9f3f5]/15 px-5 py-3 text-xs font-bold text-[#e9f3f5]/75 hover:bg-[#e9f3f5]/8">
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="glass-card w-full max-w-lg rounded-3xl bg-[#0a141f]/95 p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-300/25 to-fuchsia-400/15 text-5xl">{selected.emoji}</div>
                <div>
                  <h2 className="text-2xl font-black">{selected.name}</h2>
                  <p className="text-sm text-[#e9f3f5]/68">{selected.age} · {selected.level} · {selected.goal}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-[#e9f3f5]/15 px-3 py-1.5 text-xs font-bold text-[#e9f3f5]/70 hover:bg-[#e9f3f5]/8">✕</button>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#e9f3f5]/80">"{selected.bio}"</p>
            <div className="mt-5 space-y-2 text-sm text-[#e9f3f5]/75">
              <p>🏟️ <span className="font-bold text-[#e9f3f5]">{selected.gym}</span></p>
              <p>🕐 {selected.schedule}</p>
              <p>📍 {selected.distanceKm} km away</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.matchTags.map((t) => (
                <span key={t} className="rounded-full border border-[#ffb627]/30 bg-[#ffb627]/10 px-3 py-1 text-[11px] font-bold text-[#ffb627]">{t}</span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { sendRequest(selected.id); setSelected(null); }}
              disabled={sent.has(selected.id)}
              className={`btn-gloss mt-6 w-full rounded-full py-4 text-xs font-black uppercase tracking-[0.18em] ${
                sent.has(selected.id)
                  ? "cursor-default border border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                  : "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 text-white"
              }`}
            >
              {sent.has(selected.id) ? "✓ Request Sent" : `🤝 Send Buddy Request to ${selected.name.split(" ")[0]}`}
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: "🎯", title: "Set your filters", desc: "Goal, experience level, age and distance — hone in on exactly what you want in a partner." },
          { icon: "🤝", title: "Send a request", desc: "Found a match? One tap sends a buddy request with your profile and schedule." },
          { icon: "💪", title: "Train together", desc: `Meet at the gym, keep each other accountable, and never lose the workout comradery${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.` },
        ].map((s) => (
          <div key={s.title} className="glass-card rounded-2xl p-5">
            <div className="text-3xl">{s.icon}</div>
            <h3 className="mt-3 font-black">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#e9f3f5]/70">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
