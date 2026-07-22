import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Muscle Anatomy — an interactive front/back body map. Tap any      */
/* muscle zone (or a list item) to see its name, Latin name, region, */
/* what it does, a training tip, and the best exercises for it.      */
/* Zones are CSS-positioned over a stylized silhouette — no SVG.     */
/* ---------------------------------------------------------------- */

type View = "front" | "back";

interface Muscle {
  id: string;
  name: string;
  latin: string;
  region: string;
  view: View;
  emoji: string;
  fn: string;          // what it does
  tip: string;         // training note
  exercises: string[];
  // position on the body map (percent of the figure box)
  x: number; y: number; w: number; h: number;
}

const MUSCLES: Muscle[] = [
  // ---- FRONT ----
  { id: "traps-f", name: "Trapezius (upper)", latin: "Trapezius", region: "Neck / Upper back", view: "front", emoji: "🔺", fn: "Elevates and shrugs the shoulders; supports the neck and head.", tip: "Trained with shrugs and any heavy carry or deadlift.", exercises: ["Barbell shrugs", "Farmer's carries", "Face pulls"], x: 41, y: 11, w: 18, h: 6 },
  { id: "delts-f", name: "Deltoids (front/side)", latin: "Deltoideus", region: "Shoulders", view: "front", emoji: "🛡️", fn: "Raises the arm forward and out to the side; caps the shoulder.", tip: "Lateral raises build width; overhead presses build the whole cap.", exercises: ["Overhead press", "Lateral raises", "Front raises"], x: 20, y: 17, w: 16, h: 8 },
  { id: "delts-f2", name: "Deltoids (front/side)", latin: "Deltoideus", region: "Shoulders", view: "front", emoji: "🛡️", fn: "Raises the arm forward and out to the side; caps the shoulder.", tip: "Lateral raises build width; overhead presses build the whole cap.", exercises: ["Overhead press", "Lateral raises", "Front raises"], x: 64, y: 17, w: 16, h: 8 },
  { id: "chest", name: "Pectorals", latin: "Pectoralis major", region: "Chest", view: "front", emoji: "💠", fn: "Pushes the arms forward and together; the main pressing muscle.", tip: "Vary incline/flat/decline to hit upper, mid, and lower chest.", exercises: ["Bench press", "Incline dumbbell press", "Push-ups", "Cable flyes"], x: 32, y: 22, w: 36, h: 12 },
  { id: "biceps", name: "Biceps", latin: "Biceps brachii", region: "Arms (front)", view: "front", emoji: "💪", fn: "Bends the elbow and rotates the forearm; the classic 'flex' muscle.", tip: "Control the negative — biceps grow from the lowering phase too.", exercises: ["Barbell curls", "Hammer curls", "Chin-ups"], x: 13, y: 29, w: 13, h: 11 },
  { id: "biceps2", name: "Biceps", latin: "Biceps brachii", region: "Arms (front)", view: "front", emoji: "💪", fn: "Bends the elbow and rotates the forearm; the classic 'flex' muscle.", tip: "Control the negative — biceps grow from the lowering phase too.", exercises: ["Barbell curls", "Hammer curls", "Chin-ups"], x: 74, y: 29, w: 13, h: 11 },
  { id: "abs", name: "Abdominals", latin: "Rectus abdominis", region: "Core", view: "front", emoji: "🧊", fn: "Flexes the spine and braces the trunk; the 'six-pack' muscle.", tip: "Abs are revealed by low body fat, not just crunches — diet matters most.", exercises: ["Hanging leg raises", "Cable crunches", "Planks"], x: 39, y: 35, w: 22, h: 14 },
  { id: "obliques", name: "Obliques", latin: "Obliquus externus", region: "Core (sides)", view: "front", emoji: "🌀", fn: "Rotates and side-bends the trunk; stabilizes the core.", tip: "Anti-rotation work (Pallof press) protects the spine better than twists.", exercises: ["Russian twists", "Side planks", "Pallof press"], x: 30, y: 36, w: 8, h: 13 },
  { id: "forearms", name: "Forearm flexors", latin: "Flexor group", region: "Arms (lower)", view: "front", emoji: "✊", fn: "Grip strength and wrist movement; carries every heavy lift.", tip: "Heavy deadlifts and carries build grip more than direct curls.", exercises: ["Wrist curls", "Dead hangs", "Farmer's carries"], x: 10, y: 42, w: 11, h: 12 },
  { id: "forearms2", name: "Forearm flexors", latin: "Flexor group", region: "Arms (lower)", view: "front", emoji: "✊", fn: "Grip strength and wrist movement; carries every heavy lift.", tip: "Heavy deadlifts and carries build grip more than direct curls.", exercises: ["Wrist curls", "Dead hangs", "Farmer's carries"], x: 79, y: 42, w: 11, h: 12 },
  { id: "quads", name: "Quadriceps", latin: "Quadriceps femoris", region: "Legs (front)", view: "front", emoji: "🦵", fn: "Straightens the knee; the powerhouse of squats and sprints.", tip: "Full-depth squats and leg extensions hit all four quad heads.", exercises: ["Back squats", "Leg press", "Lunges", "Leg extensions"], x: 31, y: 52, w: 16, h: 18 },
  { id: "quads2", name: "Quadriceps", latin: "Quadriceps femoris", region: "Legs (front)", view: "front", emoji: "🦵", fn: "Straightens the knee; the powerhouse of squats and sprints.", tip: "Full-depth squats and leg extensions hit all four quad heads.", exercises: ["Back squats", "Leg press", "Lunges", "Leg extensions"], x: 53, y: 52, w: 16, h: 18 },
  { id: "tibialis", name: "Tibialis anterior", latin: "Tibialis anterior", region: "Lower leg (front)", view: "front", emoji: "🦴", fn: "Lifts the foot (dorsiflexion); protects shins and improves ankle health.", tip: "Often neglected — tibialis raises help prevent shin splints.", exercises: ["Tibialis raises", "Toe walks", "Banded dorsiflexion"], x: 34, y: 72, w: 12, h: 14 },

  // ---- BACK ----
  { id: "traps-b", name: "Trapezius", latin: "Trapezius", region: "Upper back", view: "back", emoji: "🔻", fn: "Moves and stabilizes the shoulder blades; the diamond of the upper back.", tip: "Rows and face pulls build the mid/lower traps for posture.", exercises: ["Face pulls", "Barbell rows", "Shrugs"], x: 36, y: 13, w: 28, h: 10 },
  { id: "rear-delt", name: "Rear deltoids", latin: "Deltoideus posterior", region: "Shoulders (rear)", view: "back", emoji: "🛡️", fn: "Pulls the arm backward; balances the pressing-heavy front delts.", tip: "Most people are weak here — prioritize rear-delt flyes.", exercises: ["Reverse flyes", "Face pulls", "Bent-over lateral raises"], x: 22, y: 18, w: 14, h: 7 },
  { id: "rear-delt2", name: "Rear deltoids", latin: "Deltoideus posterior", region: "Shoulders (rear)", view: "back", emoji: "🛡️", fn: "Pulls the arm backward; balances the pressing-heavy front delts.", tip: "Most people are weak here — prioritize rear-delt flyes.", exercises: ["Reverse flyes", "Face pulls", "Bent-over lateral raises"], x: 64, y: 18, w: 14, h: 7 },
  { id: "lats", name: "Latissimus dorsi", latin: "Latissimus dorsi", region: "Back (wings)", view: "back", emoji: "🦇", fn: "Pulls the arms down and back; creates the V-taper 'wings'.", tip: "Pull-ups and pulldowns build width; rows build thickness.", exercises: ["Pull-ups", "Lat pulldowns", "Barbell rows"], x: 30, y: 26, w: 40, h: 15 },
  { id: "triceps", name: "Triceps", latin: "Triceps brachii", region: "Arms (back)", view: "back", emoji: "🔱", fn: "Straightens the elbow; makes up ~2/3 of your upper-arm size.", tip: "Want bigger arms? Train triceps as hard as biceps.", exercises: ["Close-grip bench", "Dips", "Rope pushdowns", "Overhead extensions"], x: 14, y: 29, w: 13, h: 12 },
  { id: "triceps2", name: "Triceps", latin: "Triceps brachii", region: "Arms (back)", view: "back", emoji: "🔱", fn: "Straightens the elbow; makes up ~2/3 of your upper-arm size.", tip: "Want bigger arms? Train triceps as hard as biceps.", exercises: ["Close-grip bench", "Dips", "Rope pushdowns", "Overhead extensions"], x: 73, y: 29, w: 13, h: 12 },
  { id: "erectors", name: "Lower back", latin: "Erector spinae", region: "Spine", view: "back", emoji: "🪢", fn: "Extends and stabilizes the spine; braces every heavy lift.", tip: "Deadlifts and back extensions strengthen it — brace, don't round.", exercises: ["Deadlifts", "Back extensions", "Good mornings"], x: 40, y: 40, w: 20, h: 12 },
  { id: "glutes", name: "Glutes", latin: "Gluteus maximus", region: "Hips", view: "back", emoji: "🍑", fn: "Extends the hip; the strongest muscle and key to power & posture.", tip: "Hip thrusts and deep squats are unbeatable for glute growth.", exercises: ["Hip thrusts", "Squats", "Romanian deadlifts", "Bulgarian split squats"], x: 33, y: 52, w: 34, h: 11 },
  { id: "hamstrings", name: "Hamstrings", latin: "Biceps femoris", region: "Legs (back)", view: "back", emoji: "🦿", fn: "Bends the knee and extends the hip; balances the quads.", tip: "Romanian deadlifts and curls prevent the common quad-dominance.", exercises: ["Romanian deadlifts", "Leg curls", "Nordic curls"], x: 32, y: 63, w: 15, h: 15 },
  { id: "hamstrings2", name: "Hamstrings", latin: "Biceps femoris", region: "Legs (back)", view: "back", emoji: "🦿", fn: "Bends the knee and extends the hip; balances the quads.", tip: "Romanian deadlifts and curls prevent the common quad-dominance.", exercises: ["Romanian deadlifts", "Leg curls", "Nordic curls"], x: 53, y: 63, w: 15, h: 15 },
  { id: "calves", name: "Calves", latin: "Gastrocnemius / Soleus", region: "Lower leg (back)", view: "back", emoji: "🐐", fn: "Points the toes (plantarflexion); powers jumping and sprinting.", tip: "Train both straight-leg (gastroc) and bent-leg (soleus) raises.", exercises: ["Standing calf raises", "Seated calf raises", "Jump rope"], x: 34, y: 80, w: 13, h: 13 },
  { id: "calves2", name: "Calves", latin: "Gastrocnemius / Soleus", region: "Lower leg (back)", view: "back", emoji: "🐐", fn: "Points the toes (plantarflexion); powers jumping and sprinting.", tip: "Train both straight-leg (gastroc) and bent-leg (soleus) raises.", exercises: ["Standing calf raises", "Seated calf raises", "Jump rope"], x: 53, y: 80, w: 13, h: 13 },
];

export default function MuscleAnatomyPage() {
  const [view, setView] = useState<View>("front");
  const [selected, setSelected] = useState<string | null>(null);

  const zones = useMemo(() => MUSCLES.filter((m) => m.view === view), [view]);
  const active = MUSCLES.find((m) => m.id === selected) ?? null;
  // list is de-duplicated (left/right zones share a name)
  const listItems = useMemo(() => {
    const seen = new Set<string>();
    return zones.filter((m) => { if (seen.has(m.name)) return false; seen.add(m.name); return true; });
  }, [zones]);

  const isSelected = (m: Muscle) => active?.name === m.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Muscle Anatomy</h1>
        <p className="text-sm text-[#f7f0df]/68">Tap any muscle on the body — or in the list — to learn what it does</p>
      </div>

      {/* Front / Back toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-[#f7f0df]/12 bg-[#f7f0df]/5 p-1">
          {(["front", "back"] as View[]).map((v) => (
            <button key={v} type="button" onClick={() => { setView(v); setSelected(null); }} className={`rounded-full px-6 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${view === v ? "bg-violet-500 text-white" : "text-[#f7f0df]/62"}`}>
              {v === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Body map */}
        <div className="glass-card rounded-3xl p-6">
          <div className="relative mx-auto w-full max-w-[300px]" style={{ aspectRatio: "3 / 5.2" }}>
            {/* stylized silhouette behind the zones */}
            <div aria-hidden className="absolute left-1/2 top-0 h-[9%] w-[15%] -translate-x-1/2 rounded-full bg-[#f7f0df]/8" />
            <div aria-hidden className="absolute left-1/2 top-[10%] h-[45%] w-[52%] -translate-x-1/2 rounded-[40%_40%_30%_30%] bg-[#f7f0df]/5" />
            <div aria-hidden className="absolute left-1/2 top-[52%] h-[46%] w-[46%] -translate-x-1/2 rounded-[30%_30%_40%_40%] bg-[#f7f0df]/4" />

            {zones.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                aria-label={m.name}
                title={m.name}
                className="absolute rounded-2xl border transition"
                style={{
                  left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%`,
                  background: isSelected(m) ? "linear-gradient(135deg, rgba(167,139,250,0.6), rgba(232,121,249,0.5))" : "rgba(167,139,250,0.16)",
                  borderColor: isSelected(m) ? "rgba(232,121,249,0.8)" : "rgba(167,139,250,0.3)",
                  boxShadow: isSelected(m) ? "0 0 20px rgba(167,139,250,0.5)" : "none",
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-[#f7f0df]/50">{view === "front" ? "Anterior view" : "Posterior view"} · highlighted = selected</p>
        </div>

        {/* Detail or list */}
        <div className="space-y-3">
          {active ? (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl">{active.emoji}</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">{active.name}</h2>
                  <p className="text-xs italic text-[#f7f0df]/60">{active.latin} · {active.region}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-[#f7f0df]/15 px-3 py-1.5 text-xs text-[#f7f0df]/70 hover:bg-[#f7f0df]/8">✕</button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#f7f0df]/82">{active.fn}</p>
              <div className="mt-4 rounded-xl border border-[#d8b35a]/20 bg-[#d8b35a]/8 p-3">
                <p className="text-xs leading-relaxed text-[#f7f0df]/78">💡 {active.tip}</p>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-300">Best exercises</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.exercises.map((ex) => (
                    <span key={ex} className="rounded-full border border-violet-200/25 bg-violet-200/8 px-3 py-1.5 text-[11px] font-bold text-violet-100">{ex}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">{view === "front" ? "Front" : "Back"} muscles ({listItems.length})</p>
              <div className="space-y-1.5">
                {listItems.map((m) => (
                  <button key={m.id} type="button" onClick={() => setSelected(m.id)} className="flex w-full items-center gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3 text-left transition hover:bg-[#f7f0df]/10">
                    <span className="text-xl">{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{m.name}</p>
                      <p className="text-[11px] italic text-[#f7f0df]/55">{m.latin}</p>
                    </div>
                    <span className="text-[#f7f0df]/40">›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
