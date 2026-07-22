import { useMemo, useState } from "react";
import { addXP } from "./Achievements";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Cool-Down & Stretching Generator — pick the muscles you just       */
/* trained and get a targeted static-stretch + mobility routine to    */
/* aid recovery and flexibility. Complements the Warm-Up Generator.   */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

interface Stretch { name: string; seconds: number; cue: string; icon: string }

const GENERAL: Stretch[] = [
  { name: "Slow diaphragmatic breathing", seconds: 60, cue: "Down-regulate — long exhales, drop the shoulders.", icon: "🌬️" },
  { name: "Child's pose", seconds: 45, cue: "Sink the hips back, lengthen the spine.", icon: "🧎" },
];

const BY_FOCUS: Record<string, Stretch[]> = {
  push: [
    { name: "Doorway chest stretch", seconds: 40, cue: "Forearm on the frame, rotate away — each side.", icon: "🚪" },
    { name: "Overhead triceps stretch", seconds: 30, cue: "Elbow behind head, gentle pull — each arm.", icon: "💪" },
    { name: "Cross-body shoulder stretch", seconds: 30, cue: "Draw the arm across, feel the rear delt.", icon: "🤝" },
  ],
  pull: [
    { name: "Lat stretch (hang or wall)", seconds: 40, cue: "Reach long, let the lats decompress.", icon: "🧗" },
    { name: "Seated forward fold", seconds: 45, cue: "Hinge from the hips, soft knees.", icon: "🙇" },
    { name: "Biceps wall stretch", seconds: 30, cue: "Palm on wall, turn away — each arm.", icon: "💪" },
  ],
  legs: [
    { name: "Standing quad stretch", seconds: 40, cue: "Heel to glute, knees together — each side.", icon: "🦵" },
    { name: "Seated hamstring stretch", seconds: 45, cue: "Reach toward the toes, keep the back long.", icon: "🦿" },
    { name: "Figure-four glute stretch", seconds: 40, cue: "Ankle over knee, sink back — each side.", icon: "🍑" },
    { name: "Couch/hip-flexor stretch", seconds: 40, cue: "Rear shin up, tuck the pelvis — each side.", icon: "🛋️" },
    { name: "Calf stretch on wall", seconds: 30, cue: "Back heel down, lean in — each leg.", icon: "🦶" },
  ],
  core: [
    { name: "Cobra / press-up", seconds: 30, cue: "Gently extend the spine, hips down.", icon: "🐍" },
    { name: "Supine spinal twist", seconds: 40, cue: "Knees to one side, shoulders flat — each side.", icon: "🌀" },
    { name: "Cat-cow", seconds: 40, cue: "Flow through flexion and extension.", icon: "🐱" },
  ],
  cardio: [
    { name: "Easy walk to cool the HR", seconds: 120, cue: "Bring the heart rate down gradually.", icon: "🚶" },
    { name: "Standing quad stretch", seconds: 30, cue: "Heel to glute — each side.", icon: "🦵" },
    { name: "Calf & achilles stretch", seconds: 30, cue: "Step back, heel down — each leg.", icon: "🦶" },
    { name: "Hip-flexor lunge stretch", seconds: 40, cue: "Sink into a low lunge — each side.", icon: "🏃" },
  ],
  fullbody: [
    { name: "Standing forward fold", seconds: 40, cue: "Hang heavy, release the neck.", icon: "🙇" },
    { name: "World's greatest stretch", seconds: 60, cue: "Lunge, rotate, reach — each side.", icon: "🌍" },
    { name: "Supine spinal twist", seconds: 40, cue: "Decompress the spine — each side.", icon: "🌀" },
    { name: "Figure-four glute stretch", seconds: 40, cue: "Open the hips — each side.", icon: "🍑" },
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

export default function CooldownGeneratorPage() {
  const { user } = useAuth();
  const [focus, setFocus] = useState("legs");
  const [minutes, setMinutes] = useState(5);
  const [routine, setRoutine] = useState<Stretch[] | null>(null);

  const generated = useMemo(() => {
    const pool = [...(BY_FOCUS[focus] ?? []), ...GENERAL];
    const budget = minutes * 60;
    const out: Stretch[] = [];
    let total = 0;
    for (const s of pool) {
      if (total + s.seconds <= budget + 20) { out.push(s); total += s.seconds; }
    }
    return out.length ? out : pool.slice(0, 3);
  }, [focus, minutes]);

  const totalSec = routine ? routine.reduce((s, m) => s + m.seconds, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Cool-Down &amp; Stretch</h1>
        <p className="text-sm text-[#f7f0df]/68">Wind down with targeted stretches — recover faster and stay flexible</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">What did you just train?</p>
        <div className="flex flex-wrap gap-2">
          {FOCUS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFocus(f.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${focus === f.id ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#f7f0df]/65"><span>Time available</span><span className="text-[#d8b35a]">{minutes} min</span></span>
          <input type="range" min={3} max={10} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-violet-400" />
        </label>

        <button type="button" onClick={() => setRoutine(generated)} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-teal-300 via-emerald-500 to-teal-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Generate Cool-Down</button>
      </div>

      {routine && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">Your cool-down · ~{Math.round(totalSec / 60)} min</p>
            <span className="text-xs text-[#f7f0df]/62">{routine.length} stretches</span>
          </div>
          <ol className="mt-4 space-y-2">
            {routine.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/70 text-sm">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.name} <span className="text-[#d8b35a]">· {s.seconds}s</span></p>
                  <p className="text-[11px] text-[#f7f0df]/62">{s.cue}</p>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => { addXP(user?.email, 8); }} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#052e1f]">✓ Cool-down Done (+8 XP)</button>
        </div>
      )}

      <p className="text-center text-[11px] text-[#f7f0df]/55">Hold each stretch to mild tension — never pain. Stretching post-workout aids recovery and long-term mobility.</p>
    </div>
  );
}
