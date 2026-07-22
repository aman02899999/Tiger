import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Physiotherapy Library — rehab & prehab protocols organized by body */
/* region. Each entry explains the issue, red flags, and a staged     */
/* exercise plan. Educational only — not a diagnosis. No SVG.         */
/* ---------------------------------------------------------------- */

interface Protocol {
  id: string;
  name: string;
  region: "Back" | "Knee" | "Shoulder" | "Neck" | "Hip" | "Ankle";
  icon: string;
  about: string;
  causes: string[];
  exercises: { name: string; detail: string }[];
  redFlags: string;
}

const PROTOCOLS: Protocol[] = [
  {
    id: "low-back", name: "Lower-Back Care & Core Stability", region: "Back", icon: "🦴",
    about: "Non-specific lower-back pain is extremely common and usually mechanical. The goal is to restore confident movement, build core endurance, and gradually rebuild load tolerance.",
    causes: ["Sudden increase in lifting or sitting", "Weak or under-trained core and glutes", "Poor movement mechanics under load", "Prolonged static postures"],
    exercises: [
      { name: "Curl-up (McGill)", detail: "Lie on your back, one knee bent, hands under the lower back. Lift head and shoulders slightly, brace the abs. Hold 8–10s. 3 × 5 reps." },
      { name: "Side plank", detail: "On your side, forearm down, hips lifted. Keep a straight line head-to-feet. Build from 15s to 45s per side, 3 rounds." },
      { name: "Bird-dog", detail: "On hands and knees, extend opposite arm and leg, stay level and braced. Hold 5s. 3 × 8 per side." },
      { name: "Hip hinge drill", detail: "Practice hinging at the hips with a neutral spine (dowel on the back touching head, mid-back, tailbone). Groove the pattern before adding load." },
    ],
    redFlags: "Numbness, leg weakness, loss of bladder/bowel control, unexplained weight loss, or pain after major trauma — seek medical care promptly.",
  },
  {
    id: "runners-knee", name: "Patellofemoral Pain (Runner's Knee)", region: "Knee", icon: "🦵",
    about: "Pain around or behind the kneecap, often from rapid training increases or weak hips. Strengthening and smart load management resolve most cases.",
    causes: ["Rapid mileage or intensity spikes", "Weak glutes and quadriceps", "Poor running/landing mechanics", "Sudden change of footwear or terrain"],
    exercises: [
      { name: "Spanish squat / wall sit", detail: "Isometric quad hold with a band or against a wall, knees ~60°. Hold 30–45s × 4. Reduces pain and builds quad tolerance." },
      { name: "Side-lying hip abduction", detail: "Lift the top leg straight up to strengthen the glute medius. 3 × 12–15 per side." },
      { name: "Step-downs", detail: "Slowly lower off a low step under control, tracking the knee over the toes. 3 × 8–10 per side." },
      { name: "Glute bridge", detail: "Drive through the heels to lift the hips, squeeze the glutes. 3 × 12." },
    ],
    redFlags: "Significant swelling, locking, giving way, or inability to bear weight — get assessed to rule out structural injury.",
  },
  {
    id: "shoulder-impingement", name: "Shoulder Health & Rotator Cuff", region: "Shoulder", icon: "💪",
    about: "Shoulder pain with overhead movement is often related to rotator-cuff and scapular control rather than damage. Building cuff strength and posture restores pain-free motion.",
    causes: ["Weak rotator cuff and scapular stabilizers", "Sudden overhead volume increase", "Rounded-shoulder desk posture", "Neglected pulling volume vs pressing"],
    exercises: [
      { name: "Band external rotation", detail: "Elbow at side, rotate the forearm outward against a band. 3 × 15. Strengthens the external rotators." },
      { name: "Scapular wall slides", detail: "Back to wall, slide arms overhead keeping contact. Trains upward rotation and control. 3 × 10." },
      { name: "Prone Y-T-W raises", detail: "Face-down, raise arms in Y, T, and W shapes to build the mid/lower traps. 3 × 8 each." },
      { name: "Face pulls", detail: "Pull a band/cable to the face, elbows high, squeezing the rear delts. 3 × 15." },
    ],
    redFlags: "Pain following a fall, sudden loss of strength, or inability to lift the arm — seek assessment for possible tear.",
  },
  {
    id: "neck-tension", name: "Neck Tension & Tech-Neck Relief", region: "Neck", icon: "🧣",
    about: "Neck and upper-trap tension from screen time is widespread. Gentle mobility, deep-neck-flexor strength, and posture variety relieve most cases.",
    causes: ["Forward-head posture at screens", "Prolonged static positions", "Stress-driven muscle tension", "Weak deep neck flexors"],
    exercises: [
      { name: "Chin tucks", detail: "Gently draw the chin straight back (making a 'double chin'), lengthening the neck. Hold 5s. 3 × 10." },
      { name: "Upper-trap stretch", detail: "Ear toward shoulder, gentle hand assist. Hold 30s per side." },
      { name: "Thoracic extension", detail: "Over a chair back or foam roller, gently extend the mid-back to offload the neck. 3 × 8." },
      { name: "Scapular retractions", detail: "Squeeze shoulder blades together and down. 3 × 12." },
    ],
    redFlags: "Radiating arm pain, numbness/tingling, dizziness, or pain after trauma — get evaluated.",
  },
  {
    id: "hip-mobility", name: "Hip Mobility & Glute Activation", region: "Hip", icon: "🍑",
    about: "Stiff, weak hips drive knee and back problems. Restoring hip mobility and glute strength improves squats, running, and daily movement.",
    causes: ["Prolonged sitting shortening hip flexors", "Under-active glutes", "Limited squat/hinge practice", "Previous injury compensation"],
    exercises: [
      { name: "Couch stretch", detail: "Rear shin up against a wall/couch, tuck the pelvis to stretch the hip flexor. 60s per side." },
      { name: "90/90 hip switches", detail: "Seated, rotate both legs side to side to mobilize internal/external rotation. 3 × 8 per side." },
      { name: "Clamshells", detail: "Side-lying, knees bent, lift the top knee keeping feet together. 3 × 15 per side." },
      { name: "Hip airplanes", detail: "Single-leg hinge with controlled hip rotation for balance and control. 3 × 6 per side." },
    ],
    redFlags: "Deep groin pain, clicking with pain, or sharp catching — seek assessment for joint issues.",
  },
  {
    id: "ankle-sprain", name: "Ankle Sprain Recovery & Balance", region: "Ankle", icon: "🦶",
    about: "After the acute phase of a sprain, progressive loading and balance training restore strength and prevent re-injury — the most common outcome of under-rehabbing.",
    causes: ["Rolling the ankle on uneven ground", "Weak stabilizers after prior sprains", "Poor balance/proprioception", "Returning to sport too soon"],
    exercises: [
      { name: "Ankle alphabet", detail: "Trace the alphabet with the toes to restore range gently. 2 sets, early stage." },
      { name: "Calf raises", detail: "Rise onto the toes, control the descent. Progress to single-leg. 3 × 15." },
      { name: "Single-leg balance", detail: "Stand on one leg 30s; progress to eyes closed or on a cushion. 3 rounds." },
      { name: "Resisted eversion", detail: "Band around the foot, turn the sole outward to strengthen the peroneals. 3 × 15." },
    ],
    redFlags: "Inability to bear weight, severe swelling/deformity, or numbness — rule out fracture before loading.",
  },
];

const REGIONS = ["All", "Back", "Knee", "Shoulder", "Neck", "Hip", "Ankle"] as const;

export default function PhysiotherapyLibraryPage() {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("All");
  const [open, setOpen] = useState<Protocol | null>(null);

  const filtered = useMemo(() => PROTOCOLS.filter((p) => region === "All" || p.region === region), [region]);

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-sky-200 hover:text-sky-100">← Back to protocols</button>
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/15 text-3xl">{open.icon}</span>
            <div>
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-200">{open.region}</span>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em]">{open.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#f7f0df]/80">{open.about}</p>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">Common causes</p>
          <ul className="mt-2 space-y-1.5">
            {open.causes.map((c, i) => <li key={i} className="flex gap-2 text-sm text-[#f7f0df]/75"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />{c}</li>)}
          </ul>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">Staged exercise plan</p>
          <div className="mt-3 space-y-2.5">
            {open.exercises.map((e, i) => (
              <div key={i} className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
                <p className="text-sm font-black text-[#f7f0df]">{i + 1}. {e.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#f7f0df]/68">{e.detail}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-[11px] text-[#f7f0df]/75"><span className="font-bold text-rose-200">🚩 Red flags — see a professional: </span>{open.redFlags}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Physiotherapy Library</h1>
        <p className="text-sm text-[#f7f0df]/68">Rehab & prehab protocols by body region — build resilience, move pain-free</p>
      </div>

      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/10 p-4">
        <p className="text-[11px] leading-relaxed text-[#f7f0df]/70">🩺 Educational guidance for general aches and prehab — not a diagnosis or treatment plan. For persistent, severe, or worsening pain, or any red-flag symptom, consult a qualified physiotherapist or doctor.</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button key={r} type="button" onClick={() => setRegion(r)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${region === r ? "bg-sky-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpen(p)} className="glass-card flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-200/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-2xl">{p.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black leading-tight">{p.name}</h3>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[#f7f0df]/62">{p.about}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
