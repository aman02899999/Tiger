import { useState } from "react";

const POLICE = [
  { letter: "P", name: "Protection", desc: "Protect from further injury, use brace/sling if needed." },
  { letter: "O", name: "Optimal Loading", desc: "Gentle movement to promote healing — avoid bed rest." },
  { letter: "L", name: "Ice", desc: "Apply ice pack 15–20 min every 2 hours for the first 48 h." },
  { letter: "I", name: "Compression", desc: "Compression bandage to reduce swelling." },
  { letter: "C", name: "Elevation", desc: "Keep injured area elevated above heart level." },
  { letter: "E", name: "Early Movement", desc: "Begin guided range-of-motion exercises when tolerated." },
];

type InjuryKey = "shoulder" | "knee" | "back" | "ankle" | "hip" | "elbow";

interface Protocol {
  label: string;
  injuries: string[];
  phases: { title: string; content: string }[];
  returnCriteria: string;
  redFlags: string;
}

const PROTOCOLS: Record<InjuryKey, Protocol> = {
  shoulder: {
    label: "Shoulder",
    injuries: ["Rotator cuff tear", "Shoulder impingement", "AC joint sprain", "Frozen shoulder"],
    phases: [
      { title: "Phase 1 — Days 1–7", content: "Rest, ice, anti-inflammatory medication, pendulum exercises." },
      { title: "Phase 2 — Week 2–4", content: "Passive range of motion, wall slides, pendulum swings." },
      { title: "Phase 3 — Week 4–8", content: "Strengthening: external rotation with band, side-lying ER, prone Y/T/W." },
      { title: "Phase 4 — Week 8–12", content: "Sport-specific training, overhead press progression." },
    ],
    returnCriteria: "Full ROM, no pain, 90% strength vs opposite side.",
    redFlags: "Severe pain, numbness, visible deformity → see doctor immediately.",
  },
  knee: {
    label: "Knee",
    injuries: ["ACL tear", "Meniscus tear", "Patellofemoral pain", "IT band syndrome"],
    phases: [
      { title: "Phase 1 — Days 1–3", content: "POLICE protocol, quad sets, heel slides." },
      { title: "Phase 2 — Week 1–3", content: "Straight leg raises, mini squats 0–45°, stationary cycling." },
      { title: "Phase 3 — Week 3–8", content: "Single-leg press, step-ups, lateral band walks." },
      { title: "Phase 4 — Week 8–16", content: "Running progression, agility drills, jump training." },
    ],
    returnCriteria: "Single-leg squat 10 reps, hop test 90% limb symmetry index.",
    redFlags: "Locking, giving way, gross instability → see orthopedic surgeon.",
  },
  back: {
    label: "Back",
    injuries: ["Disc herniation", "Muscle strain", "Sciatica", "Facet joint pain"],
    phases: [
      { title: "Phase 1 — Acute", content: "McKenzie extension if centralization occurs, walking, avoid prolonged sitting." },
      { title: "Phase 2 — Sub-acute", content: "Core activation: dead bug, bird dog, glute bridges." },
      { title: "Phase 3 — Rebuilding", content: "Hip hinge pattern, Romanian deadlift, McGill Big 3." },
      { title: "Phase 4 — Load", content: "Loaded compound movements with proper bracing technique." },
    ],
    returnCriteria: "Pain-free ADLs, 80% strength, no neurological symptoms.",
    redFlags: "Bowel/bladder dysfunction, saddle anaesthesia → emergency care immediately.",
  },
  ankle: {
    label: "Ankle",
    injuries: ["Lateral ankle sprain (inversion)", "Achilles tendinopathy", "High ankle sprain"],
    phases: [
      { title: "Phase 1 — Day 1–3", content: "POLICE protocol, ankle pumps, towel scrunches." },
      { title: "Phase 2 — Week 1–2", content: "ROM circles, seated calf raises, balance board." },
      { title: "Phase 3 — Week 2–4", content: "Single-leg balance, standing calf raises, side shuffles." },
      { title: "Phase 4 — Week 4–8", content: "Hop and land drills, lateral plyometrics, sport-specific drills." },
    ],
    returnCriteria: "Single-leg balance 30 sec, no swelling, full dorsiflexion.",
    redFlags: "Inability to bear weight, significant bruising spreading upward → rule out fracture.",
  },
  hip: {
    label: "Hip",
    injuries: ["Hip flexor strain", "IT band syndrome", "Greater trochanteric bursitis", "Labral tear"],
    phases: [
      { title: "Phase 1 — Acute", content: "Hip flexor stretching, avoid aggravating positions and compressive loads." },
      { title: "Phase 2 — Activation", content: "Clamshells, side-lying hip abduction, glute bridges." },
      { title: "Phase 3 — Strength", content: "Single-leg RDL, lateral band walks, step-ups." },
      { title: "Phase 4 — Return", content: "Return to running, progressive sport-specific loading." },
    ],
    returnCriteria: "Pain-free single-leg stance, full ROM, symmetric hip strength.",
    redFlags: "Deep groin pain, clicking with pain, restricted ROM → labral pathology evaluation.",
  },
  elbow: {
    label: "Elbow",
    injuries: ["Tennis elbow (lateral epicondylitis)", "Golfer's elbow (medial epicondylitis)", "Bicep tendinopathy"],
    phases: [
      { title: "Phase 1 — Rest", content: "Rest from aggravating grips, wrist extension stretches, ice." },
      { title: "Phase 2 — Eccentric", content: "Eccentric wrist extensions — Tyler Twist with theraband." },
      { title: "Phase 3 — Load", content: "Progressive loading: reverse curls, wrist curls, pronation/supination." },
      { title: "Phase 4 — Sport", content: "Sport-specific grip training, return to racquet/club/barbell." },
    ],
    returnCriteria: "Pain-free gripping, 80% grip strength vs opposite side.",
    redFlags: "Numbness/tingling in ring or little finger, elbow locking → nerve evaluation.",
  },
};

const PREHAB = [
  {
    title: "Shoulder Prehab",
    color: "from-violet-600/30 to-fuchsia-600/20",
    border: "border-violet-500/30",
    accent: "text-violet-400",
    exercises: [
      { name: "Band Pull-Aparts", sets: "3×15" },
      { name: "Face Pulls", sets: "3×15" },
      { name: "YWT Raises (prone)", sets: "3×10 each" },
      { name: "Serratus Wall Slide", sets: "3×12" },
      { name: "Side-Lying External Rotation", sets: "3×12" },
      { name: "Overhead Band Reach", sets: "3×10" },
    ],
  },
  {
    title: "Knee Prehab",
    color: "from-fuchsia-600/30 to-pink-600/20",
    border: "border-fuchsia-500/30",
    accent: "text-fuchsia-400",
    exercises: [
      { name: "VMO Quad Sets", sets: "3×20" },
      { name: "Terminal Knee Extension", sets: "3×15" },
      { name: "Single-Leg Balance", sets: "3×30 sec" },
      { name: "Lateral Band Walks", sets: "3×15 steps" },
      { name: "Wall Sits", sets: "3×45 sec" },
      { name: "Step-Downs (eccentric)", sets: "3×10" },
    ],
  },
  {
    title: "Back Prehab (McGill Big 3)",
    color: "from-[#d8b35a]/20 to-amber-600/10",
    border: "border-[#d8b35a]/30",
    accent: "text-[#d8b35a]",
    exercises: [
      { name: "McGill Curl-Up", sets: "3×8 (10 sec hold)" },
      { name: "Side Plank", sets: "3×20 sec each side" },
      { name: "Bird Dog", sets: "3×8 each side (8 sec hold)" },
      { name: "Glute Bridge", sets: "3×15" },
      { name: "Dead Bug", sets: "3×8 each side" },
      { name: "Cat-Cow Mobility", sets: "2×10 slow" },
    ],
  },
];

const INJURY_TABS: InjuryKey[] = ["shoulder", "knee", "back", "ankle", "hip", "elbow"];

function PoliceCard() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 via-[#0b0714]/60 to-fuchsia-900/10 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black text-white">
          Rx
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#f7f0df]">POLICE Protocol</h2>
          <p className="text-xs text-[#f7f0df]/50">Immediate injury management framework</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {POLICE.map((item) => (
          <div
            key={item.letter}
            className="flex gap-3 rounded-xl border border-[#f7f0df]/8 bg-[#07040d]/60 p-4"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black text-white">
              {item.letter}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f7f0df]">{item.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#f7f0df]/60">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InjuryProtocol({ injuryKey }: { injuryKey: InjuryKey }) {
  const p = PROTOCOLS[injuryKey];
  return (
    <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#0b0714]/60 p-6">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-[#f7f0df]">{p.label} Rehab Protocol</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {p.injuries.map((inj) => (
            <span
              key={inj}
              className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-0.5 text-xs font-medium text-fuchsia-300"
            >
              {inj}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {p.phases.map((ph, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#f7f0df]/8 bg-[#07040d]/70 p-4"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-violet-300">{ph.title}</p>
            </div>
            <p className="pl-8 text-xs leading-relaxed text-[#f7f0df]/70">{ph.content}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400">Return-to-Sport Criteria</p>
          <p className="text-sm leading-relaxed text-[#f7f0df]/80">{p.returnCriteria}</p>
        </div>
        <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-400">Red Flags</p>
          <p className="text-sm leading-relaxed text-[#f7f0df]/80">{p.redFlags}</p>
        </div>
      </div>
    </div>
  );
}

function PrehabilSection() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[#f7f0df]">Prehabilitation Programs</h2>
      <div className="grid gap-5 lg:grid-cols-3">
        {PREHAB.map((prog) => (
          <div
            key={prog.title}
            className={`rounded-2xl border ${prog.border} bg-gradient-to-br ${prog.color} p-5`}
          >
            <h3 className={`mb-4 text-base font-bold ${prog.accent}`}>{prog.title}</h3>
            <div className="space-y-2.5">
              {prog.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f7f0df]/10 text-[10px] font-bold text-[#f7f0df]/60">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#f7f0df]/85">{ex.name}</span>
                  </div>
                  <span className={`shrink-0 rounded-full border ${prog.border} px-2 py-0.5 text-xs font-semibold ${prog.accent}`}>
                    {ex.sets}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhysioSection() {
  return (
    <section className="bg-[#07040d] px-4 py-16 text-[#f7f0df]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Physiotherapy & Rehab
          </span>
          <h2 className="text-3xl font-black text-[#f7f0df]">Recover Smarter. Come Back Stronger.</h2>
          <p className="mt-3 text-[#f7f0df]/60">
            Evidence-based rehabilitation protocols for the most common sports injuries.
          </p>
        </div>
        <PoliceCard />
        <div className="mt-8">
          <PrehabilSection />
        </div>
      </div>
    </section>
  );
}

export default function PhysioRehabPage() {
  const [activeInjury, setActiveInjury] = useState<InjuryKey>("shoulder");

  return (
    <div className="min-h-screen bg-[#07040d] px-4 py-8 text-[#f7f0df] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-violet-400">
              Physiotherapy & Injury Rehab
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#f7f0df] sm:text-4xl">
            Recover Smarter.{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-[#d8b35a] bg-clip-text text-transparent">
              Come Back Stronger.
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#f7f0df]/55">
            Evidence-based rehabilitation protocols, phased recovery timelines, and prehabilitation programs designed to
            keep you training for life.
          </p>
        </div>

        <PoliceCard />

        <div>
          <h2 className="mb-4 text-xl font-bold text-[#f7f0df]">Injury-Specific Protocols</h2>
          <div className="mb-5 flex flex-wrap gap-2">
            {INJURY_TABS.map((key) => (
              <button
                key={key}
                onClick={() => setActiveInjury(key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeInjury === key
                    ? "border-fuchsia-500 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/30"
                    : "border-[#f7f0df]/15 bg-[#f7f0df]/5 text-[#f7f0df]/65 hover:border-[#f7f0df]/30 hover:text-[#f7f0df]"
                }`}
              >
                {PROTOCOLS[key].label}
              </button>
            ))}
          </div>
          <InjuryProtocol injuryKey={activeInjury} />
        </div>

        <PrehabilSection />

        <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-amber-900/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d8b35a]/40 bg-[#d8b35a]/15 text-xl">
              ⚕️
            </div>
            <div>
              <p className="font-bold text-[#d8b35a]">Medical Disclaimer</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[#f7f0df]/60">
                This content is for educational purposes only and does not replace professional medical advice. Always
                consult a qualified physiotherapist or physician before starting a rehabilitation program, especially
                following acute injury or surgery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
