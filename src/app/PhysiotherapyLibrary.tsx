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
  {
    id: "elbow-wrist", name: "Elbow & Wrist (Tennis/Golfer's Elbow)", region: "Shoulder", icon: "🖐️",
    about: "Pain at the outer (tennis) or inner (golfer's) elbow is usually a tendon overuse issue from gripping and repetitive strain. Progressive loading of the forearm tendons is the evidence-based fix.",
    causes: ["Repetitive gripping or typing", "Sudden increase in racket/lifting volume", "Weak forearm and grip musculature", "Poor wrist positioning under load"],
    exercises: [
      { name: "Wrist extensor eccentrics", detail: "Support the forearm, hold a light weight, slowly lower the wrist down over 3–4s, assist back up. 3 × 15." },
      { name: "Wrist flexor eccentrics", detail: "Palm up, slowly lower a light weight, assist back up. For golfer's elbow. 3 × 15." },
      { name: "Supination/pronation", detail: "Hold a light hammer or weight, rotate the forearm slowly side to side. 3 × 12." },
      { name: "Grip squeezes", detail: "Squeeze a soft ball or gripper for 5s. 3 × 10, building tolerance gradually." },
    ],
    redFlags: "Numbness/tingling into the fingers, night pain, or loss of grip strength — get assessed for nerve involvement.",
  },
  {
    id: "hamstring", name: "Hamstring Strain Recovery", region: "Hip", icon: "🦵",
    about: "Hamstring strains are common in sprinting and sport. Rushing back is the top cause of re-injury; progressive strengthening — especially eccentric work — is protective.",
    causes: ["Explosive sprinting or kicking", "Inadequate warm-up", "Weak or fatigued hamstrings", "Returning to sport before full strength returns"],
    exercises: [
      { name: "Isometric hamstring holds", detail: "Early stage: press the heel into the floor, holding gentle tension. 5 × 20s." },
      { name: "Single-leg bridge", detail: "Bridge on one leg to load the hamstring and glute. 3 × 10 per side." },
      { name: "Nordic curl (assisted)", detail: "Kneel, lower the torso forward slowly resisting with the hamstrings. Advanced eccentric — the gold standard for prevention. 3 × 5." },
      { name: "Romanian deadlift", detail: "Hip hinge with light load, feeling a hamstring stretch. Progress load slowly. 3 × 10." },
    ],
    redFlags: "A pop with sudden severe pain, large bruising, or a palpable gap in the muscle — seek assessment for a significant tear.",
  },
  {
    id: "plantar-fasciitis", name: "Plantar Fasciitis (Heel Pain)", region: "Ankle", icon: "🦶",
    about: "Sharp heel pain, worst with the first steps in the morning, from irritation of the tissue along the sole. Calf/foot strengthening and load management resolve most cases over time.",
    causes: ["Sudden increase in walking or running", "Tight calves limiting ankle range", "Weak foot intrinsic muscles", "Unsupportive footwear or hard surfaces"],
    exercises: [
      { name: "Calf stretch", detail: "Step back, heel down, lean into a wall to stretch the calf. 3 × 30s per side." },
      { name: "Heel raises with towel", detail: "Toes on a rolled towel, rise onto the balls of the feet slowly. Loads the fascia progressively. 3 × 12." },
      { name: "Plantar fascia stretch", detail: "Cross the foot over the knee, gently pull the toes back until a stretch is felt in the arch. 3 × 20s." },
      { name: "Towel scrunches", detail: "Scrunch a towel toward you with the toes to strengthen the foot muscles. 3 × 15." },
    ],
    redFlags: "Numbness, pain that doesn't improve over weeks, or heel pain after a fall — get assessed.",
  },
  {
    id: "core-athlete", name: "Core Strength & Anti-Rotation", region: "Back", icon: "🎯",
    about: "A strong core resists unwanted movement (extension, flexion, rotation) to protect the spine and transfer force. This is prehab that improves nearly every lift and sport.",
    causes: ["Weak deep stabilizers", "Over-relying on crunches vs stability work", "Poor bracing under load", "Sedentary lifestyle"],
    exercises: [
      { name: "Pallof press", detail: "Hold a band at chest height, press out and resist its pull to rotate you. 3 × 10 per side." },
      { name: "Dead bug", detail: "On your back, extend opposite arm and leg while keeping the lower back flat. 3 × 8 per side." },
      { name: "Plank", detail: "Forearms down, straight line, brace hard. Build from 20s to 60s. 3 rounds." },
      { name: "Suitcase carry", detail: "Walk holding a weight in one hand, resisting the lean. 3 × 30s per side." },
    ],
    redFlags: "Sharp spinal pain or symptoms radiating into the legs — stop and get assessed before loading further.",
  },
  {
    id: "wrist-mobility", name: "Wrist & Forearm Health", region: "Shoulder", icon: "✍️",
    about: "Wrist discomfort from typing, lifting, or pressing responds well to mobility and progressive tendon loading — important for lifters and desk workers alike.",
    causes: ["Prolonged typing or mouse use", "Heavy pressing/front-rack positions", "Weak forearms and grip", "Limited wrist extension range"],
    exercises: [
      { name: "Wrist mobility rocks", detail: "On hands and knees, gently rock forward and back over planted palms. 3 × 10." },
      { name: "Wrist curls", detail: "Light weight, curl the wrist up and lower slowly, both flexion and extension. 3 × 15." },
      { name: "Prayer stretch", detail: "Palms together, lower the hands to stretch the wrists. Then reverse. 3 × 20s each." },
      { name: "Rice bucket / grip work", detail: "Dig and rotate the hands in a bucket of rice, or use a gripper. 2–3 min." },
    ],
    redFlags: "Persistent numbness or tingling in the fingers (possible carpal tunnel) — seek assessment.",
  },
  {
    id: "it-band", name: "IT Band Syndrome (Outer Knee)", region: "Knee", icon: "🎽",
    about: "Pain on the outer knee, common in runners and cyclists, usually from hip weakness and training spikes rather than a 'tight' band that needs aggressive rolling.",
    causes: ["Rapid increase in running/cycling volume", "Weak hip abductors (glute medius)", "Running on cambered surfaces", "Poor running mechanics"],
    exercises: [
      { name: "Side-lying leg raises", detail: "Strengthen the glute medius by lifting the top leg. 3 × 12–15 per side." },
      { name: "Clamshells", detail: "Knees bent, lift the top knee keeping feet together. 3 × 15 per side." },
      { name: "Single-leg balance", detail: "Control hip drop while standing on one leg. 3 × 30s." },
      { name: "Step-downs", detail: "Slow, controlled descents keeping the pelvis level. 3 × 8 per side." },
    ],
    redFlags: "Significant swelling, locking, or instability — get assessed to rule out other joint issues.",
  },
  {
    id: "upper-back", name: "Upper-Back & Thoracic Mobility", region: "Neck", icon: "🔄",
    about: "A stiff mid-back (thoracic spine) from sitting drives neck and shoulder problems and limits overhead lifts. Restoring extension and rotation improves posture and pressing.",
    causes: ["Prolonged slouched sitting", "Limited thoracic extension/rotation", "Weak mid-back musculature", "Rounded-shoulder posture"],
    exercises: [
      { name: "Foam roller extensions", detail: "Roller under the mid-back, gently extend over it. 3 × 8." },
      { name: "Open books", detail: "Side-lying, rotate the top arm open to mobilize rotation. 3 × 8 per side." },
      { name: "Cat-cow", detail: "Flow through spinal flexion and extension. 8–10 rounds." },
      { name: "Band rows", detail: "Row a band to the ribs, squeezing the shoulder blades. 3 × 15." },
    ],
    redFlags: "Sharp mid-back pain, pain with deep breathing, or radiating symptoms — seek assessment.",
  },
  {
    id: "achilles", name: "Achilles Tendon Health", region: "Ankle", icon: "🦿",
    about: "Achilles pain and stiffness, common in runners and jumpers, responds to progressive calf loading — not rest, which weakens the tendon.",
    causes: ["Rapid increase in running/jumping", "Tight or weak calves", "Sudden change to flat or minimalist shoes", "Insufficient warm-up"],
    exercises: [
      { name: "Straight-leg calf raises", detail: "Rise onto the toes, lower slowly. Loads the gastrocnemius. 3 × 15." },
      { name: "Bent-knee calf raises", detail: "Same but with knees slightly bent to target the soleus. 3 × 15." },
      { name: "Eccentric heel drops", detail: "Rise on both feet, lower slowly on one off a step. 3 × 12 per side." },
      { name: "Calf stretch", detail: "Gentle wall stretch, straight and bent knee. 3 × 30s each." },
    ],
    redFlags: "Sudden sharp pain with a 'kicked' sensation, or inability to push off — rule out a rupture urgently.",
  },
  {
    id: "hip-impingement", name: "Hip Impingement & Deep Hip Pain", region: "Hip", icon: "🦴",
    about: "Pinching pain in the front of the hip or groin, often with deep squatting. Improving hip control and mobility and modifying depth usually help; some cases are structural.",
    causes: ["Repetitive deep hip flexion", "Weak deep hip stabilizers", "Limited hip mobility", "Structural bony shape (in some cases)"],
    exercises: [
      { name: "90/90 hip rotations", detail: "Seated, rotate both legs side to side to improve internal and external rotation. 3 × 8 per side." },
      { name: "Hip flexor march", detail: "Standing, march with control to strengthen the deep hip flexors. 3 × 10 per side." },
      { name: "Glute bridge", detail: "Drive through the heels, squeeze the glutes to build posterior hip strength. 3 × 12." },
      { name: "Adductor rock-backs", detail: "In a half-kneeling wide stance, gently rock to mobilize the inner thigh. 3 × 8 per side." },
    ],
    redFlags: "Deep catching, giving way, or pain that limits walking — get assessed for a joint or labral issue.",
  },
  {
    id: "shin-splints", name: "Shin Splints (Medial Tibial Stress)", region: "Ankle", icon: "🦵",
    about: "Aching pain along the inner shin, common when ramping up running. Load management, calf strength, and technique tweaks resolve most cases; persistent cases need screening for stress fracture.",
    causes: ["Rapid increase in running volume", "Weak calves and foot muscles", "Hard surfaces or worn shoes", "Overstriding running mechanics"],
    exercises: [
      { name: "Calf raises", detail: "Both straight- and bent-knee variations to load the calves. 3 × 15 each." },
      { name: "Toe raises", detail: "Lift the toes/front of the foot to strengthen the shin muscles (tibialis). 3 × 15." },
      { name: "Single-leg balance", detail: "Build foot and ankle control. 3 × 30s." },
      { name: "Foot doming", detail: "Gently lift the arch without curling the toes to strengthen intrinsic foot muscles. 3 × 10." },
    ],
    redFlags: "A focal, pinpoint painful spot on the bone, or pain at rest/night — get screened for a stress fracture.",
  },
  {
    id: "rotator-prehab", name: "Rotator Cuff Prehab for Lifters", region: "Shoulder", icon: "🏋️",
    about: "Keeping the rotator cuff and scapular stabilizers strong prevents the shoulder pain that commonly interrupts pressing and pulling training. Prehab is cheaper than rehab.",
    causes: ["Pressing volume outpacing pulling volume", "Neglected cuff and scapular work", "Poor overhead mobility", "Sudden jumps in load"],
    exercises: [
      { name: "Band external rotations", detail: "Elbow at the side, rotate out against a band. 3 × 15 — a cuff staple." },
      { name: "Face pulls", detail: "Pull to the face with high elbows, squeezing the rear delts. 3 × 15." },
      { name: "YTWs", detail: "Prone or on an incline, raise the arms in Y, T, and W shapes. 3 × 8 each." },
      { name: "Band pull-aparts", detail: "Hold a band and pull it apart at chest height. 3 × 20 to balance pressing volume." },
    ],
    redFlags: "Sharp pain with pressing, night pain, or sudden weakness — stop and get assessed.",
  },
  {
    id: "sciatica", name: "Sciatica & Nerve-Related Leg Pain", region: "Back", icon: "⚡",
    about: "Pain, tingling, or numbness radiating from the lower back down the leg, often from nerve irritation. Gentle nerve mobility and core work help many cases; assessment is important.",
    causes: ["Lower-back disc or joint irritation", "Prolonged sitting", "Tight or spasming glutes (piriformis)", "Sudden bending/lifting"],
    exercises: [
      { name: "Sciatic nerve glides", detail: "Seated, gently straighten the knee and flex/point the foot to floss the nerve — never into sharp pain. 2 × 10." },
      { name: "Knee-to-chest", detail: "Lying down, gently draw one knee toward the chest to ease the lower back. 3 × 20s per side." },
      { name: "Bird-dog", detail: "Build gentle core stability without loading the spine. 3 × 8 per side." },
      { name: "Glute stretch", detail: "Figure-four stretch to release the piriformis. 3 × 30s per side." },
    ],
    redFlags: "Progressive weakness, numbness in the saddle area, or loss of bladder/bowel control — seek urgent care.",
  },
  {
    id: "frozen-shoulder", name: "Stiff Shoulder & Mobility Loss", region: "Shoulder", icon: "❄️",
    about: "Gradual loss of shoulder range and stiffness can stem from disuse, guarding after pain, or frozen shoulder. Gentle, consistent mobility work is the mainstay; some cases need medical care.",
    causes: ["Prolonged immobility or guarding", "Post-injury stiffness", "Underlying frozen shoulder (adhesive capsulitis)", "Poor posture and disuse"],
    exercises: [
      { name: "Pendulum swings", detail: "Let the arm hang and gently swing in small circles to loosen the joint. 2 × 30s each direction." },
      { name: "Wall walks", detail: "Walk the fingers up a wall to gradually reclaim overhead range. 3 × 8." },
      { name: "Cross-body stretch", detail: "Gently draw the arm across the body. 3 × 30s." },
      { name: "External rotation with stick", detail: "Use a dowel to gently guide the arm outward. 3 × 10." },
    ],
    redFlags: "Rapidly worsening pain and stiffness, or shoulder locking — get assessed; frozen shoulder benefits from early care.",
  },
  {
    id: "prehab-general", name: "Full-Body Prehab Routine", region: "Hip", icon: "🛡️",
    about: "A short, general prehab circuit that targets the areas most prone to niggles — hips, shoulders, core, and ankles — to keep you training pain-free.",
    causes: ["Skipping mobility and stabilizer work", "Muscle imbalances from repetitive training", "Sedentary hours between workouts", "Neglected small-muscle strength"],
    exercises: [
      { name: "Band pull-aparts", detail: "Balance pressing volume and wake the upper back. 2 × 20." },
      { name: "Glute bridges", detail: "Activate the glutes to protect the back and knees. 2 × 15." },
      { name: "Dead bugs", detail: "Core stability without spinal load. 2 × 10 per side." },
      { name: "Ankle & calf raises", detail: "Strengthen the lower leg for running and jumping. 2 × 15." },
      { name: "90/90 hip switches", detail: "Maintain hip rotation range. 2 × 8 per side." },
    ],
    redFlags: "Any exercise that causes sharp or radiating pain should be stopped and reviewed with a professional.",
  },
  {
    id: "wrist-carpal", name: "Carpal Tunnel & Wrist Nerve Care", region: "Shoulder", icon: "🖐️",
    about: "Tingling and numbness in the thumb and first fingers from median-nerve compression at the wrist, common with repetitive computer work. Nerve glides, ergonomics, and rest help many mild cases.",
    causes: ["Repetitive wrist flexion/typing", "Poor keyboard/mouse ergonomics", "Sustained wrist positions", "Fluid retention in some cases"],
    exercises: [
      { name: "Median nerve glides", detail: "Gently move the wrist and fingers through a sequence to floss the nerve — never into strong symptoms. 2 × 8." },
      { name: "Wrist extensor stretch", detail: "Arm straight, gently pull the hand down and back. 3 × 20s." },
      { name: "Tendon glides", detail: "Move the fingers through fist, hook, and straight positions. 2 × 8." },
      { name: "Grip and release", detail: "Gentle open-and-close of the hand to keep tendons mobile. 2 × 12." },
    ],
    redFlags: "Constant numbness, muscle wasting at the thumb base, or weakness gripping — seek assessment promptly.",
  },
  {
    id: "tension-headache", name: "Tension Headache & Neck Relief", region: "Neck", icon: "🤕",
    about: "Many headaches stem from tight neck and upper-shoulder muscles and forward-head posture. Gentle mobility, strengthening, and stress management often reduce their frequency.",
    causes: ["Sustained forward-head posture", "Upper-trap and neck tension", "Stress and jaw clenching", "Long screen sessions without breaks"],
    exercises: [
      { name: "Chin tucks", detail: "Draw the chin back to strengthen deep neck flexors. 3 × 10." },
      { name: "Upper-trap stretch", detail: "Ear toward shoulder with gentle assist. 3 × 30s per side." },
      { name: "Levator scapulae stretch", detail: "Look toward the armpit, gentle assist, to release the side-back of the neck. 3 × 30s." },
      { name: "Suboccipital release", detail: "Gentle pressure at the skull base (or on a ball) to ease tension. 1–2 min." },
    ],
    redFlags: "Sudden severe 'worst-ever' headache, headache with fever/stiff neck, or neurological symptoms — seek urgent care.",
  },
  {
    id: "balance-fall", name: "Balance & Fall Prevention", region: "Ankle", icon: "⚖️",
    about: "Balance is trainable at any age and protects against falls and ankle injuries. Regular practice improves stability, coordination, and confidence.",
    causes: ["Reduced activity and disuse", "Weak legs and ankle stabilizers", "Poor proprioception after injury", "Inactivity with ageing"],
    exercises: [
      { name: "Single-leg stand", detail: "Balance on one leg 30s; progress to eyes closed or a cushion. 3 rounds." },
      { name: "Heel-to-toe walk", detail: "Walk a straight line placing heel to toe, arms out. 3 × 10 steps." },
      { name: "Tandem stance", detail: "Stand with one foot directly in front of the other; hold and switch. 3 × 30s." },
      { name: "Calf & ankle raises", detail: "Build lower-leg strength for stability. 3 × 15." },
    ],
    redFlags: "Frequent unexplained falls, dizziness, or sudden balance loss — get medically assessed.",
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
          <div className="mt-4 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#34d399]">🎯 About</p>
            <p className="mt-1 text-sm leading-relaxed text-[#f7f0df]/80">{open.about}</p>
          </div>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-fuchsia-300">🔍 Common causes</p>
          <ul className="mt-2 space-y-1.5">
            {open.causes.map((c, i) => <li key={i} className="flex gap-2 text-sm text-[#f7f0df]/75"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />{c}</li>)}
          </ul>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#d8b35a]">🥄 Staged exercise plan</p>
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
