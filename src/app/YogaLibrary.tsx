import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Yoga Library — a reference of foundational asanas with Sanskrit     */
/* names, step-by-step cues, benefits, and difficulty. Educational     */
/* content, client-side. No SVG.                                       */
/* ---------------------------------------------------------------- */

interface Pose {
  id: string;
  name: string;
  sanskrit: string;
  level: "Beginner" | "Intermediate";
  type: "Standing" | "Seated" | "Backbend" | "Balance" | "Restorative";
  icon: string;
  benefits: string;
  steps: string[];
  breath: string;
}

const POSES: Pose[] = [
  { id: "tadasana", name: "Mountain Pose", sanskrit: "Tadasana", level: "Beginner", type: "Standing", icon: "⛰️",
    benefits: "Improves posture, balance, and body awareness; the foundation of all standing poses.",
    steps: ["Stand with feet hip-width, weight even across both feet.", "Engage the thighs, lengthen the tailbone down.", "Roll the shoulders back and down, arms alongside the body.", "Crown of the head reaches up, chin parallel to the floor."],
    breath: "Breathe slow and steady, grounding down through the feet on each exhale." },
  { id: "downdog", name: "Downward-Facing Dog", sanskrit: "Adho Mukha Svanasana", level: "Beginner", type: "Standing", icon: "🐕",
    benefits: "Stretches hamstrings, calves, and shoulders; builds arm strength; energizes the body.",
    steps: ["From hands and knees, tuck the toes and lift the hips up and back.", "Straighten the legs as much as comfortable; bend knees if hamstrings are tight.", "Press the hands firmly, spread the fingers.", "Let the head hang, ears between the arms; form an inverted V."],
    breath: "Hold for 5 breaths, pedaling the feet to ease into the stretch." },
  { id: "warrior2", name: "Warrior II", sanskrit: "Virabhadrasana II", level: "Beginner", type: "Standing", icon: "🗡️",
    benefits: "Strengthens legs and core, opens the hips and chest, builds stamina and focus.",
    steps: ["Step the feet wide, turn the front foot out 90°.", "Bend the front knee over the ankle, thigh toward parallel.", "Extend the arms out at shoulder height, gaze over the front hand.", "Keep the torso upright, shoulders stacked over the hips."],
    breath: "Sink deeper into the front leg with each exhale; hold 5 breaths per side." },
  { id: "tree", name: "Tree Pose", sanskrit: "Vrksasana", level: "Beginner", type: "Balance", icon: "🌳",
    benefits: "Develops balance, focus, and ankle/leg stability; calms the mind.",
    steps: ["From Mountain, shift weight to one foot.", "Place the other foot on the ankle, calf, or inner thigh (never the knee).", "Bring the palms together at the heart or overhead.", "Fix your gaze on a still point to steady your balance."],
    breath: "Steady, even breaths; a calm breath makes balance easier. Hold 5 breaths per side." },
  { id: "cobra", name: "Cobra Pose", sanskrit: "Bhujangasana", level: "Beginner", type: "Backbend", icon: "🐍",
    benefits: "Strengthens the spine, opens the chest, counters slouching; gentle backbend.",
    steps: ["Lie face-down, hands under the shoulders, elbows close.", "Press the tops of the feet down.", "On an inhale, lift the chest using the back muscles, minimal arm push.", "Keep the shoulders down, gaze forward and slightly up."],
    breath: "Lift on the inhale, soften on the exhale; hold 3–5 breaths." },
  { id: "seated-fold", name: "Seated Forward Fold", sanskrit: "Paschimottanasana", level: "Beginner", type: "Seated", icon: "🙇",
    benefits: "Stretches the hamstrings and spine; calms the nervous system.",
    steps: ["Sit with legs extended, spine tall.", "Inhale to lengthen; exhale to hinge forward from the hips.", "Reach toward the feet, keeping the back long rather than rounding.", "Rest hands on the shins, ankles, or feet — wherever you reach."],
    breath: "Fold a little deeper on each exhale; never force. Hold 5–8 breaths." },
  { id: "childs", name: "Child's Pose", sanskrit: "Balasana", level: "Beginner", type: "Restorative", icon: "🧎",
    benefits: "Gently stretches the back and hips; deeply calming rest position.",
    steps: ["From hands and knees, bring the big toes together, knees wide.", "Sink the hips back toward the heels.", "Walk the hands forward, rest the forehead on the mat.", "Let the whole body soften and breathe into the back."],
    breath: "Long, slow breaths into the back body; stay as long as feels good." },
  { id: "bridge", name: "Bridge Pose", sanskrit: "Setu Bandha Sarvangasana", level: "Intermediate", type: "Backbend", icon: "🌉",
    benefits: "Strengthens glutes and back, opens the chest and hip flexors; gentle inversion.",
    steps: ["Lie on your back, knees bent, feet hip-width near the hips.", "Press the feet down and lift the hips toward the ceiling.", "Roll the shoulders under, optionally clasp the hands beneath you.", "Keep the knees over the ankles, thighs parallel."],
    breath: "Lift on an inhale; hold 5 breaths, then lower slowly on an exhale." },
  { id: "pigeon", name: "Pigeon Pose", sanskrit: "Eka Pada Rajakapotasana", level: "Intermediate", type: "Seated", icon: "🕊️",
    benefits: "Deep hip opener; releases the glutes and hip rotators, easing back tension.",
    steps: ["From Down Dog, bring one knee forward behind the wrist, shin angled.", "Extend the other leg straight back, hips square.", "Stay upright or fold forward over the front shin.", "Support the front hip with a folded blanket if needed."],
    breath: "Breathe into the hip, releasing tension on each exhale. Hold 5–10 breaths per side." },
  { id: "corpse", name: "Corpse Pose", sanskrit: "Savasana", level: "Beginner", type: "Restorative", icon: "😌",
    benefits: "Total relaxation; integrates the practice, lowers stress, and calms the mind.",
    steps: ["Lie flat on your back, legs relaxed and slightly apart.", "Arms rest alongside the body, palms up.", "Close the eyes and release all effort.", "Let the body feel heavy and completely supported."],
    breath: "Natural, effortless breathing; remain 5–10 minutes to close a practice." },
];

const TYPES = ["All", "Standing", "Seated", "Backbend", "Balance", "Restorative"] as const;
const LEVEL_COLOR: Record<string, string> = { Beginner: "#34d399", Intermediate: "#d8b35a" };

export default function YogaLibraryPage() {
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Pose | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return POSES.filter((p) => (type === "All" || p.type === type) && (!q || p.name.toLowerCase().includes(q) || p.sanskrit.toLowerCase().includes(q)));
  }, [type, query]);

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-violet-200 hover:text-violet-100">← Back to poses</button>
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-3xl">{open.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-200">{open.type}</span>
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${LEVEL_COLOR[open.level]}22`, color: LEVEL_COLOR[open.level] }}>{open.level}</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em]">{open.name}</h1>
              <p className="text-sm italic text-[#f7f0df]/60">{open.sanskrit}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#f7f0df]/80"><span className="font-bold text-[#d8b35a]">Benefits: </span>{open.benefits}</p>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">How to do it</p>
          <ol className="mt-2 space-y-2">
            {open.steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3 text-sm text-[#f7f0df]/78">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500/70 text-xs font-black">{i + 1}</span>{s}
              </li>
            ))}
          </ol>

          <p className="mt-5 rounded-xl border border-sky-400/20 bg-sky-400/8 p-3 text-[13px] text-[#f7f0df]/75"><span className="font-bold text-sky-200">🌬️ Breath: </span>{open.breath}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Yoga Library</h1>
        <p className="text-sm text-[#f7f0df]/68">Foundational asanas with Sanskrit names, step-by-step cues and benefits</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search poses…" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${type === t ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpen(p)} className="glass-card flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-2xl">{p.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">{p.name}</h3>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: `${LEVEL_COLOR[p.level]}22`, color: LEVEL_COLOR[p.level] }}>{p.level}</span>
              </div>
              <p className="text-[12px] italic text-[#f7f0df]/55">{p.sanskrit}</p>
              <p className="mt-0.5 line-clamp-1 text-[13px] text-[#f7f0df]/62">{p.benefits}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
