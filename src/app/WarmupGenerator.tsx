import { useMemo, useState } from "react";
import { addXP } from "./Achievements";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Warm-Up Generator — pick what you're training and how long you    */
/* have, and get a tailored dynamic warm-up with timed steps you can  */
/* run through with a built-in per-move timer. No SVG.                */
/* ---------------------------------------------------------------- */

interface Move { name: string; seconds: number; cue: string; icon: string }

const GENERAL: Move[] = [
  { name: "Light cardio (jog / skip / bike)", seconds: 120, cue: "Raise your heart rate and body temp.", icon: "🏃" },
  { name: "Arm circles", seconds: 30, cue: "Small to big, both directions.", icon: "🔄" },
  { name: "Leg swings", seconds: 40, cue: "Front-to-back and side-to-side, each leg.", icon: "🦵" },
  { name: "Hip circles", seconds: 30, cue: "Open the hips in slow circles.", icon: "🌀" },
];

const BY_FOCUS: Record<string, Move[]> = {
  push: [
    { name: "Band pull-aparts", seconds: 40, cue: "Wake up the upper back and rear delts.", icon: "🎗️" },
    { name: "Scapular push-ups", seconds: 30, cue: "Protract and retract, arms straight.", icon: "💠" },
    { name: "Wall slides", seconds: 40, cue: "Groove overhead shoulder mobility.", icon: "🧱" },
    { name: "Light warm-up sets", seconds: 60, cue: "2 progressively heavier sets before working weight.", icon: "🏋️" },
  ],
  pull: [
    { name: "Dead hangs", seconds: 40, cue: "Decompress the spine and prep the grip.", icon: "🧗" },
    { name: "Band pull-aparts", seconds: 40, cue: "Activate the mid-back.", icon: "🎗️" },
    { name: "Cat-cow", seconds: 40, cue: "Mobilize the whole spine.", icon: "🐱" },
    { name: "Light lat pulldowns", seconds: 60, cue: "Feel the lats engage before heavy pulls.", icon: "⬇️" },
  ],
  legs: [
    { name: "Bodyweight squats", seconds: 45, cue: "Slow and deep, feel the range open up.", icon: "🦵" },
    { name: "Walking lunges", seconds: 45, cue: "Long strides, knee to floor.", icon: "🚶" },
    { name: "Glute bridges", seconds: 40, cue: "Fire up the glutes before squats/deadlifts.", icon: "🍑" },
    { name: "Ankle rocks", seconds: 30, cue: "Drive knees over toes for squat depth.", icon: "🦶" },
    { name: "Light warm-up sets", seconds: 60, cue: "Ramp up to your working weight.", icon: "🏋️" },
  ],
  core: [
    { name: "Cat-cow", seconds: 40, cue: "Warm the spine through flexion & extension.", icon: "🐱" },
    { name: "Dead bugs", seconds: 40, cue: "Brace the core, move limbs slowly.", icon: "🐞" },
    { name: "Bird dogs", seconds: 40, cue: "Opposite arm/leg, stay stable.", icon: "🐕" },
  ],
  cardio: [
    { name: "Brisk walk / easy jog", seconds: 180, cue: "Ease in — don't start at full pace.", icon: "🚶" },
    { name: "High knees", seconds: 30, cue: "Build tempo gradually.", icon: "🏃" },
    { name: "Butt kicks", seconds: 30, cue: "Loosen the hamstrings.", icon: "🦿" },
    { name: "Ankle bounces", seconds: 30, cue: "Prime the calves & achilles.", icon: "🦶" },
  ],
  fullbody: [
    { name: "Bodyweight squats", seconds: 40, cue: "Open the hips and knees.", icon: "🦵" },
    { name: "Push-ups (easy)", seconds: 30, cue: "Prep the pressing muscles.", icon: "💪" },
    { name: "Band pull-aparts", seconds: 40, cue: "Balance the upper back.", icon: "🎗️" },
    { name: "World's greatest stretch", seconds: 60, cue: "Full-body mobility flow, each side.", icon: "🌍" },
  ],
};

const FOCUS = [
  { id: "push", label: "Push", icon: "💪" },
  { id: "pull", label: "Pull", icon: "🏋️" },
  { id: "legs", label: "Legs", icon: "🦵" },
  { id: "core", label: "Core", icon: "🔥" },
  { id: "cardio", label: "Cardio", icon: "🏃" },
  { id: "fullbody", label: "Full Body", icon: "🌍" },
];

export default function WarmupGeneratorPage() {
  const { user } = useAuth();
  const [focus, setFocus] = useState("push");
  const [minutes, setMinutes] = useState(6);
  const [routine, setRoutine] = useState<Move[] | null>(null);

  const generated = useMemo(() => {
    const pool = [...GENERAL, ...(BY_FOCUS[focus] ?? [])];
    const budget = minutes * 60;
    const out: Move[] = [];
    let total = 0;
    for (const m of pool) {
      if (total + m.seconds <= budget + 20) { out.push(m); total += m.seconds; }
    }
    return out.length ? out : pool.slice(0, 3);
  }, [focus, minutes]);

  function generate() {
    setRoutine(generated);
  }

  const totalSec = routine ? routine.reduce((s, m) => s + m.seconds, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Warm-Up Generator</h1>
        <p className="text-sm text-[#2a1e16]/68">Get a tailored dynamic warm-up before you train — injury-proof your session</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/65">Today you're training…</p>
        <div className="flex flex-wrap gap-2">
          {FOCUS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFocus(f.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${focus === f.id ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/65"><span>Time available</span><span className="text-[#ea580c]">{minutes} min</span></span>
          <input type="range" min={3} max={12} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-orange-400" />
        </label>

        <button type="button" onClick={generate} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Generate My Warm-Up</button>
      </div>

      {routine && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Your warm-up · ~{Math.round(totalSec / 60)} min</p>
            <span className="text-xs text-[#2a1e16]/62">{routine.length} moves</span>
          </div>
          <ol className="mt-4 space-y-2">
            {routine.map((m, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500/70 text-sm">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.name} <span className="text-[#ea580c]">· {m.seconds}s</span></p>
                  <p className="text-[11px] text-[#2a1e16]/62">{m.cue}</p>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => { addXP(user?.email, 8); }}
            className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#052e1f]"
          >
            ✓ Warm-up Done (+8 XP)
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">A proper warm-up raises your performance and cuts injury risk — never skip it.</p>
    </div>
  );
}
