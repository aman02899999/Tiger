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
  { id: "warrior1", name: "Warrior I", sanskrit: "Virabhadrasana I", level: "Beginner", type: "Standing", icon: "⚔️",
    benefits: "Strengthens legs and back, opens the chest and hip flexors, builds focus and stability.",
    steps: ["Step one foot back, angle it 45°, front knee bent over the ankle.", "Square the hips toward the front.", "Reach both arms overhead, palms facing.", "Lift the chest and gaze slightly upward."],
    breath: "Ground down on the exhale, lengthen up on the inhale; hold 5 breaths per side." },
  { id: "triangle", name: "Triangle Pose", sanskrit: "Trikonasana", level: "Beginner", type: "Standing", icon: "📐",
    benefits: "Stretches the hips, hamstrings, and side body; strengthens the legs and improves balance.",
    steps: ["Stand wide, turn the front foot out 90°.", "Extend over the front leg, hinging at the hip.", "Rest the front hand on the shin or a block; reach the top arm up.", "Open the chest toward the ceiling, gaze up at the top hand."],
    breath: "Lengthen the spine on each inhale; hold 5 breaths per side." },
  { id: "cat-cow", name: "Cat-Cow", sanskrit: "Marjaryasana-Bitilasana", level: "Beginner", type: "Backbend", icon: "🐱",
    benefits: "Mobilizes the entire spine, relieves back tension, and links breath to movement.",
    steps: ["Start on hands and knees, wrists under shoulders, knees under hips.", "Inhale: drop the belly, lift the chest and tailbone (Cow).", "Exhale: round the spine, tuck the chin and tailbone (Cat).", "Flow smoothly between the two."],
    breath: "One movement per breath — inhale to Cow, exhale to Cat; 8–10 rounds." },
  { id: "chair", name: "Chair Pose", sanskrit: "Utkatasana", level: "Intermediate", type: "Standing", icon: "🪑",
    benefits: "Builds strength in the legs, glutes, and core; generates heat and stamina.",
    steps: ["Stand with feet together or hip-width.", "Bend the knees and sink the hips back as if sitting in a chair.", "Reach the arms overhead, biceps by the ears.", "Keep the weight in the heels, chest lifted."],
    breath: "Hold steady for 5 breaths, sinking a little lower on each exhale." },
  { id: "seated-twist", name: "Seated Spinal Twist", sanskrit: "Ardha Matsyendrasana", level: "Beginner", type: "Seated", icon: "🌀",
    benefits: "Improves spinal mobility, aids digestion, and releases back tension.",
    steps: ["Sit with legs extended, then bend one knee and place the foot outside the opposite thigh.", "Inhale to lengthen the spine.", "Exhale and twist toward the bent knee, hand behind you for support.", "Use the opposite elbow against the knee to deepen gently."],
    breath: "Lengthen on the inhale, twist a little more on the exhale; hold 5 breaths per side." },
  { id: "boat", name: "Boat Pose", sanskrit: "Navasana", level: "Intermediate", type: "Balance", icon: "⛵",
    benefits: "Strengthens the core, hip flexors, and spine; builds balance and focus.",
    steps: ["Sit and lean back slightly, lifting the feet off the floor.", "Balance on the sit bones, shins parallel to the floor (or legs straight if able).", "Extend the arms forward alongside the legs.", "Keep the chest lifted and spine long, not rounded."],
    breath: "Breathe steadily; avoid holding the breath. Hold 3–5 breaths, build over time." },
  { id: "camel", name: "Camel Pose", sanskrit: "Ustrasana", level: "Intermediate", type: "Backbend", icon: "🐫",
    benefits: "Opens the chest, hip flexors, and front body; counters hunching and boosts energy.",
    steps: ["Kneel with knees hip-width, tops of the feet down.", "Place the hands on the lower back for support.", "Lift the chest and gently arch back, leading with the heart.", "If comfortable, reach for the heels; keep the neck relaxed."],
    breath: "Lift and open on each inhale; come out slowly. Hold 3–5 breaths." },
  { id: "extended-side-angle", name: "Extended Side Angle", sanskrit: "Utthita Parsvakonasana", level: "Intermediate", type: "Standing", icon: "📐",
    benefits: "Strengthens the legs and core, stretches the side body, groin, and hips.",
    steps: ["From Warrior II, lower the front forearm to the front thigh (or hand to the floor).", "Extend the top arm over the ear, creating a long line from heel to fingertips.", "Keep the front knee tracking over the ankle.", "Open the chest toward the ceiling."],
    breath: "Lengthen the top side on each inhale; hold 5 breaths per side." },
  { id: "happy-baby", name: "Happy Baby", sanskrit: "Ananda Balasana", level: "Beginner", type: "Restorative", icon: "🍼",
    benefits: "Gently opens the hips and lower back; deeply calming and stress-relieving.",
    steps: ["Lie on your back and draw the knees toward the armpits.", "Hold the outsides of the feet or the shins.", "Keep the ankles over the knees, soles facing up.", "Gently rock side to side to massage the lower back."],
    breath: "Soften into gravity with each exhale; stay 5–10 breaths." },
  { id: "legs-up-wall", name: "Legs Up the Wall", sanskrit: "Viparita Karani", level: "Beginner", type: "Restorative", icon: "🧱",
    benefits: "Relieves tired legs, calms the nervous system, and aids recovery and sleep.",
    steps: ["Sit sideways against a wall, then swing the legs up as you lie back.", "Rest the legs vertically against the wall, arms relaxed.", "Let the whole body soften and settle.", "Place a folded blanket under the hips for support if desired."],
    breath: "Long, slow breaths; remain 5–15 minutes to unwind." },
  { id: "half-moon", name: "Half Moon Pose", sanskrit: "Ardha Chandrasana", level: "Intermediate", type: "Balance", icon: "🌗",
    benefits: "Builds balance, leg and core strength, and opens the hips and chest.",
    steps: ["From Triangle, bend the front knee and place the bottom hand on the floor ahead.", "Lift the back leg parallel to the floor.", "Stack the hips and reach the top arm to the ceiling.", "Gaze forward or up; use a block under the bottom hand for support."],
    breath: "Steady breathing keeps balance; hold 5 breaths per side." },
  { id: "low-lunge", name: "Low Lunge", sanskrit: "Anjaneyasana", level: "Beginner", type: "Standing", icon: "🏃",
    benefits: "Deeply stretches the hip flexors and quads; opens the chest.",
    steps: ["From a lunge, lower the back knee to the floor.", "Sink the hips forward and down to feel the front of the back hip open.", "Reach the arms overhead, lifting the chest.", "Keep the front knee over the ankle."],
    breath: "Sink a little deeper on each exhale; hold 5 breaths per side." },
  { id: "garland", name: "Garland Pose (Yogi Squat)", sanskrit: "Malasana", level: "Beginner", type: "Seated", icon: "🧘",
    benefits: "Opens the hips, groin, and ankles; improves squat mobility and digestion.",
    steps: ["Stand with feet slightly wider than hips, toes turned out.", "Lower into a deep squat, hips toward the floor.", "Bring the palms together at the heart, elbows pressing the knees open.", "Lengthen the spine; use a folded blanket under the heels if they lift."],
    breath: "Breathe steadily, pressing the knees open on the exhale; hold 5–8 breaths." },
  { id: "locust", name: "Locust Pose", sanskrit: "Salabhasana", level: "Intermediate", type: "Backbend", icon: "🦗",
    benefits: "Strengthens the entire back body — spine, glutes, and hamstrings; improves posture.",
    steps: ["Lie face-down, arms alongside the body.", "On an inhale, lift the chest, arms, and legs off the floor.", "Reach back through the fingertips and toes.", "Keep the neck long, gaze down and slightly forward."],
    breath: "Lift on the inhale, hold for 3–5 breaths, release with control." },
  { id: "wide-fold", name: "Wide-Legged Forward Fold", sanskrit: "Prasarita Padottanasana", level: "Beginner", type: "Standing", icon: "🙌",
    benefits: "Stretches the hamstrings and inner thighs; calms the mind; gentle inversion.",
    steps: ["Stand with feet wide, parallel.", "Hinge at the hips and fold forward, hands to the floor.", "Let the crown of the head drop toward the mat.", "Keep a slight bend in the knees if the hamstrings are tight."],
    breath: "Lengthen on inhale, fold on exhale; hold 5–8 breaths." },
  { id: "reclined-twist", name: "Reclined Twist", sanskrit: "Supta Matsyendrasana", level: "Beginner", type: "Restorative", icon: "🌀",
    benefits: "Releases the spine and lower back, aids digestion, and relaxes the whole body.",
    steps: ["Lie on your back and hug both knees in.", "Let the knees drop to one side, arms extended in a T.", "Turn the gaze to the opposite hand.", "Keep both shoulders grounded; breathe into the twist."],
    breath: "Soften deeper with each exhale; hold 5–8 breaths per side." },
  { id: "eagle", name: "Eagle Pose", sanskrit: "Garudasana", level: "Intermediate", type: "Balance", icon: "🦅",
    benefits: "Builds balance and focus; stretches the shoulders and upper back, strengthens the legs.",
    steps: ["From standing, bend the knees slightly.", "Cross one thigh over the other, hooking the foot behind the calf if possible.", "Wrap the opposite arm under and around, palms toward each other.", "Sink the hips and lift the elbows; fix your gaze on one point."],
    breath: "Steady breaths keep you balanced; hold 5 breaths per side." },
  { id: "gate", name: "Gate Pose", sanskrit: "Parighasana", level: "Beginner", type: "Standing", icon: "🚪",
    benefits: "Stretches the side body and hamstrings; opens the chest and improves breathing capacity.",
    steps: ["Kneel and extend one leg out to the side, foot flat.", "Rest the same-side hand down the extended leg.", "Reach the opposite arm up and over, creating a long side stretch.", "Keep the chest open, gazing up if comfortable."],
    breath: "Lengthen the top side on each inhale; hold 5 breaths per side." },
  { id: "dolphin", name: "Dolphin Pose", sanskrit: "Ardha Pincha Mayurasana", level: "Intermediate", type: "Standing", icon: "🐬",
    benefits: "Strengthens the shoulders, arms, and core; prepares the body for inversions.",
    steps: ["From forearms and knees, tuck the toes and lift the hips up and back.", "Keep the forearms parallel, pressing them firmly down.", "Straighten the legs as much as comfortable, heels reaching toward the floor.", "Relax the neck, gaze toward the feet."],
    breath: "Hold for 5 breaths, breathing steadily into the shoulders." },
  { id: "sphinx", name: "Sphinx Pose", sanskrit: "Salamba Bhujangasana", level: "Beginner", type: "Backbend", icon: "🐊",
    benefits: "A gentle backbend that strengthens the spine and opens the chest without strain.",
    steps: ["Lie face-down, forearms on the floor, elbows under the shoulders.", "Press the forearms down and lift the chest.", "Draw the shoulders back and down, lengthening the neck.", "Keep the hips and legs relaxed on the mat."],
    breath: "Breathe smoothly into the chest; hold 5–10 breaths." },
  { id: "standing-fold", name: "Standing Forward Fold", sanskrit: "Uttanasana", level: "Beginner", type: "Standing", icon: "🙇",
    benefits: "Stretches the hamstrings and spine, relieves tension, and calms the mind.",
    steps: ["Stand tall, then hinge at the hips to fold forward.", "Let the head and arms hang heavy toward the floor.", "Bend the knees as needed to keep the back long.", "Hold opposite elbows and sway gently if you like."],
    breath: "Release a little more on each exhale; hold 5–8 breaths." },
  { id: "thread-needle", name: "Thread the Needle", sanskrit: "Parsva Balasana", level: "Beginner", type: "Restorative", icon: "🧵",
    benefits: "Releases the upper back, shoulders, and neck; a gentle spinal twist.",
    steps: ["Start on hands and knees.", "Slide one arm underneath the body, palm up, reaching to the opposite side.", "Rest the shoulder and cheek on the mat.", "Keep the hips high over the knees; breathe into the upper back."],
    breath: "Soften on each exhale; hold 5–8 breaths per side." },
  { id: "warrior3", name: "Warrior III", sanskrit: "Virabhadrasana III", level: "Intermediate", type: "Balance", icon: "✈️",
    benefits: "Builds balance, core, and posterior-chain strength; sharpens focus.",
    steps: ["From standing, shift weight onto one leg.", "Hinge forward as the back leg lifts behind you.", "Bring the torso and lifted leg parallel to the floor.", "Reach the arms forward or back alongside the body, forming one long line."],
    breath: "Steady breath maintains balance; hold 5 breaths per side." },
  { id: "bow", name: "Bow Pose", sanskrit: "Dhanurasana", level: "Intermediate", type: "Backbend", icon: "🏹",
    benefits: "Opens the whole front body, strengthens the back, and improves spinal flexibility.",
    steps: ["Lie face-down and bend both knees.", "Reach back and hold the ankles.", "On an inhale, lift the chest and thighs, drawing the feet back and up.", "Keep the knees hip-width; breathe steadily."],
    breath: "Lift on the inhale, hold 3–5 breaths, release with control." },
  { id: "fish", name: "Fish Pose", sanskrit: "Matsyasana", level: "Intermediate", type: "Backbend", icon: "🐟",
    benefits: "Opens the chest and throat, counters hunching, and stimulates the upper back.",
    steps: ["Lie on your back, hands under the hips, palms down.", "Press the forearms and elbows down to lift the chest.", "Gently drop the crown of the head toward the mat.", "Keep the weight on the elbows, not the head or neck."],
    breath: "Breathe into the open chest; hold 5 breaths, then release." },
  { id: "plank-pose", name: "Plank Pose", sanskrit: "Phalakasana", level: "Beginner", type: "Standing", icon: "🪵",
    benefits: "Builds core, shoulder, and arm strength; foundational for many transitions.",
    steps: ["From hands and knees, step the feet back to a straight line.", "Stack the shoulders over the wrists, spread the fingers.", "Brace the core and squeeze the glutes; heels reach back.", "Keep the hips level — neither sagging nor piking up."],
    breath: "Breathe steadily; hold 20–45s, building over time." },
  { id: "side-plank-yoga", name: "Side Plank", sanskrit: "Vasisthasana", level: "Intermediate", type: "Balance", icon: "📏",
    benefits: "Strengthens the obliques, shoulders, and wrists; improves lateral stability.",
    steps: ["From plank, shift weight onto one hand and the outer edge of that foot.", "Stack the top foot on the bottom, or stagger for stability.", "Lift the hips and reach the top arm to the ceiling.", "Keep a straight line from head to heels."],
    breath: "Steady breath supports the hold; hold 3–5 breaths per side." },
  { id: "supported-fish", name: "Supported Reclined Bound Angle", sanskrit: "Supta Baddha Konasana", level: "Beginner", type: "Restorative", icon: "🦋",
    benefits: "Gently opens the hips and chest; deeply relaxing and restorative.",
    steps: ["Lie back, optionally over a bolster or cushion along the spine.", "Bring the soles of the feet together, knees falling open.", "Support the knees with cushions if there's any strain.", "Rest the arms open, palms up, and relax completely."],
    breath: "Slow, easy breaths; remain 3–10 minutes to unwind." },
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
