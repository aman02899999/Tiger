import { useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types & Data ----------------------------- */

type BodyPartId = "neck" | "shoulder" | "lowerback" | "knee" | "ankle" | "wrist" | "hip";

interface Progression {
  early: string;
  mid: string;
  late: string;
}

interface RehabExercise {
  id: string;
  name: string;
  dose: string; // sets / reps / hold
  hold: number; // suggested hold/rest seconds for the timer
  image: string;
  alt: string;
  steps: string[];
  mistakes: string[];
  stopIf: string[];
  progression: Progression;
}

interface BodyPart {
  id: BodyPartId;
  label: string;
  icon: string;
  blurb: string;
  image: string;
  alt: string;
  exercises: RehabExercise[];
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

const BODY_PARTS: BodyPart[] = [
  {
    id: "neck",
    label: "Neck",
    icon: "🦴",
    blurb: "Cervical mobility, deep flexor endurance and postural control.",
    image: IMG("photo-1544367567-0f2fcb009e0b"),
    alt: "Woman in a seated stretch position focusing on neck and upper spine alignment",
    exercises: [
      {
        id: "neck-chin-tuck",
        name: "Chin Tucks",
        dose: "3 sets × 10 reps · 5s hold",
        hold: 5,
        image: IMG("photo-1571019613454-1cb2f99b2d8b"),
        alt: "Person practicing controlled head and neck positioning during mobility work",
        steps: [
          "Sit or stand tall with shoulders relaxed and eyes level.",
          "Glide your chin straight back, as if making a gentle double chin.",
          "Keep your gaze forward — do not nod down or tilt up.",
          "Hold 5 seconds, feeling the deep front-of-neck muscles work, then relax.",
        ],
        mistakes: [
          "Nodding the head down instead of gliding it backward.",
          "Shrugging the shoulders up toward the ears.",
          "Forcing the movement — it should feel gentle, never strained.",
        ],
        stopIf: [
          "Stop if you feel dizziness, pins-and-needles into the arms, or a sharp headache.",
          "Stop if pain radiates below the shoulder blade.",
        ],
        progression: {
          early: "Perform lying on your back with a folded towel under the head, 5–8 gentle reps.",
          mid: "Seated or standing chin tucks, 10 reps with a 5-second hold.",
          late: "Add gentle resistance with two fingers on the chin, or combine with band rows.",
        },
      },
      {
        id: "neck-isometrics",
        name: "Isometric Neck Holds",
        dose: "2 sets × 5 reps each direction · 6s hold",
        hold: 6,
        image: IMG("photo-1518611012118-696072aa579a"),
        alt: "Athlete performing controlled isometric hold during a stretching session",
        steps: [
          "Place your palm against your forehead.",
          "Push your head gently into your hand without letting the head move.",
          "Hold 6 seconds at roughly 25–50% effort, then relax fully.",
          "Repeat with the hand on the back and each side of the head.",
        ],
        mistakes: [
          "Pushing at maximum effort in the early stage — start gentle.",
          "Holding your breath during the hold.",
          "Letting the head actually move — the contraction should be static.",
        ],
        stopIf: [
          "Stop if symptoms travel down the arm or you feel numbness or tingling.",
          "Stop if a headache builds during or after the set.",
        ],
        progression: {
          early: "25% effort, 3-second holds, front and back directions only.",
          mid: "50% effort, 6-second holds, all four directions.",
          late: "Longer 10-second holds and diagonal directions for sport-specific control.",
        },
      },
      {
        id: "neck-levator-stretch",
        name: "Levator Scapulae Stretch",
        dose: "3 reps each side · 30s hold",
        hold: 30,
        image: IMG("photo-1541534741688-6078c6bfb5c5"),
        alt: "Person performing a deep side neck and shoulder stretch on a mat",
        steps: [
          "Sit tall and anchor one hand under your thigh or behind your back.",
          "Turn your head 45° away from the anchored side.",
          "Gently draw your nose toward your armpit with the free hand.",
          "Hold 30 seconds at a mild stretch — around 3/10 intensity.",
        ],
        mistakes: [
          "Pulling into pain rather than a comfortable stretch.",
          "Rotating the trunk instead of isolating the neck.",
          "Bouncing at end range.",
        ],
        stopIf: [
          "Stop if you feel nerve-type symptoms (burning, tingling) into the arm or hand.",
          "Stop if dizziness or visual changes occur.",
        ],
        progression: {
          early: "15-second gentle holds, 2 reps per side.",
          mid: "30-second holds, 3 reps per side, added light overpressure.",
          late: "Combine with thoracic mobility drills and scapular strengthening.",
        },
      },
      {
        id: "neck-thoracic-ext",
        name: "Thoracic Extension over Foam Roller",
        dose: "2 sets × 10 reps · slow tempo",
        hold: 20,
        image: IMG("photo-1607962837359-5e7e89f86776"),
        alt: "Athlete performing spinal extension mobility work on the gym floor",
        steps: [
          "Lie on your back with a foam roller across your mid-back, knees bent.",
          "Support your head with your hands, elbows pointing forward.",
          "Gently arch backward over the roller, exhaling as you extend.",
          "Return to neutral and shift the roller one segment up or down; repeat.",
        ],
        mistakes: [
          "Extending through the lower back instead of the mid-back.",
          "Placing the roller on the neck or lower lumbar spine.",
          "Rushing the reps — move slowly with the breath.",
        ],
        stopIf: [
          "Stop if you feel sharp mid-back pain, rib pain, or numbness.",
          "Avoid this drill if you have osteoporosis without professional clearance.",
        ],
        progression: {
          early: "Gentle range with a rolled towel instead of a roller.",
          mid: "Full foam-roller extensions, 10 controlled reps.",
          late: "Add overhead reach with a light stick to combine mobility and control.",
        },
      },
    ],
  },
  {
    id: "shoulder",
    label: "Shoulder",
    icon: "💪",
    blurb: "Rotator cuff capacity, scapular control and overhead tolerance.",
    image: IMG("photo-1574680096145-d05b474e2155"),
    alt: "Person training the shoulder with a resistance band in a rehabilitation setting",
    exercises: [
      {
        id: "sh-pendulum",
        name: "Pendulum Swings",
        dose: "2 sets × 60s each direction",
        hold: 60,
        image: IMG("photo-1522898467493-49726bf28798"),
        alt: "Physiotherapist guiding a patient through assisted shoulder movement",
        steps: [
          "Lean forward, supporting yourself on a table with the healthy arm.",
          "Let the affected arm hang completely relaxed.",
          "Shift your body weight in small circles so the arm swings passively.",
          "Perform clockwise, counter-clockwise, and front-to-back sweeps.",
        ],
        mistakes: [
          "Actively swinging the arm with shoulder muscles — the motion comes from the body.",
          "Circles that are too large too early.",
          "Tensing the neck and trap while the arm hangs.",
        ],
        stopIf: [
          "Stop if pain sharply exceeds 3/10 or lingers more than 30 minutes afterward.",
          "Stop if you feel clunking with pain or the arm feels unstable.",
        ],
        progression: {
          early: "Small unweighted circles, 30 seconds per direction.",
          mid: "Larger sweeps, 60 seconds, add gentle front-to-back and side-to-side.",
          late: "Hold a light dumbbell (0.5–1 kg) for gentle traction as tolerated.",
        },
      },
      {
        id: "sh-external-rotation",
        name: "Band External Rotation",
        dose: "3 sets × 12–15 reps · 2s eccentric",
        hold: 45,
        image: IMG("photo-1517836357463-d25dfeac3438"),
        alt: "Close-up of a resistance band external rotation exercise for the rotator cuff",
        steps: [
          "Anchor a light band at elbow height; stand side-on with elbow bent 90°.",
          "Tuck a rolled towel between your elbow and ribs.",
          "Rotate the forearm outward, keeping the elbow pinned to your side.",
          "Return slowly over 2 seconds — the lowering phase is where the cuff adapts.",
        ],
        mistakes: [
          "Letting the elbow drift away from the body.",
          "Shrugging or leaning the trunk to cheat the rep.",
          "Using a band that is too heavy and sacrificing control.",
        ],
        stopIf: [
          "Stop if you feel pinching at the top or front of the shoulder.",
          "Stop if pain exceeds 3/10 during, or the shoulder aches into the night.",
        ],
        progression: {
          early: "Isometric holds against a wall, 5 × 10 seconds at low effort.",
          mid: "Light band, 3 × 12–15 with slow eccentrics.",
          late: "Heavier band or cable at 90° abduction (athletic position).",
        },
      },
      {
        id: "sh-wall-slide",
        name: "Serratus Wall Slides",
        dose: "3 sets × 10 reps · slow",
        hold: 30,
        image: IMG("photo-1573384666979-2b8ac2a5e623"),
        alt: "Athlete performing controlled arm elevation work against resistance",
        steps: [
          "Stand facing a wall, forearms on the wall at shoulder height.",
          "Press the forearms lightly into the wall and slide them upward.",
          "As you reach up, let the shoulder blades rotate and wrap around the ribs.",
          "Slide back down with control, keeping the ribs gently tucked.",
        ],
        mistakes: [
          "Arching the lower back to gain height.",
          "Shrugging the shoulders instead of upwardly rotating the blades.",
          "Losing pressure into the wall (the serratus switches off).",
        ],
        stopIf: [
          "Stop if you feel a painful arc between 60–120° of elevation.",
          "Stop if numbness or deadness spreads down the arm.",
        ],
        progression: {
          early: "Partial-range slides below shoulder height.",
          mid: "Full-range slides, add a mini-band around the wrists.",
          late: "Wall slides with lift-off at the top, or foam-roller slides with load.",
        },
      },
      {
        id: "sh-prone-ytw",
        name: "Prone Y-T-W Raises",
        dose: "3 sets × 8 reps each letter · 3s hold",
        hold: 3,
        image: IMG("photo-1552196563-55cd4e45efb3"),
        alt: "Woman performing prone posterior shoulder strengthening on a mat",
        steps: [
          "Lie face down with the forehead resting on a folded towel.",
          "Y: arms overhead at 45°, thumbs up — lift, hold 3s, lower.",
          "T: arms straight out to the sides — squeeze the blades, lift, hold.",
          "W: elbows bent, pull the elbows toward your hips as you lift.",
        ],
        mistakes: [
          "Lifting the chest off the floor and extending the lumbar spine.",
          "Initiating from the hands instead of the shoulder blades.",
          "Jerky reps — each lift should be smooth with a controlled hold.",
        ],
        stopIf: [
          "Stop if sharp pain occurs at the top or back of the shoulder.",
          "Stop if you cannot lift the arm without hiking the whole shoulder girdle.",
        ],
        progression: {
          early: "Perform on an incline bench with tiny range, no weight.",
          mid: "Flat prone with bodyweight, 3-second holds.",
          late: "Add 0.5–2 kg plates or perform on a stability ball.",
        },
      },
      {
        id: "sh-sleeper",
        name: "Cross-Body & Sleeper Stretch",
        dose: "3 reps each · 30s hold",
        hold: 30,
        image: IMG("photo-1540206395-68808572332f"),
        alt: "Person stretching the posterior shoulder with a cross-body arm stretch",
        steps: [
          "Cross-body: pull the affected arm across your chest with the other hand.",
          "Keep the shoulder blade still — stretch should be felt at the back of the shoulder.",
          "Sleeper: lie on the affected side, shoulder and elbow at 90°.",
          "Gently press the forearm toward the floor until a mild stretch appears; hold 30s.",
        ],
        mistakes: [
          "Pushing into front-of-shoulder pinching (that is compression, not stretch).",
          "Rolling the body backward during the sleeper stretch.",
          "Aggressive overpressure — posterior capsule responds to gentle, long holds.",
        ],
        stopIf: [
          "Stop if you feel pinching in the front of the shoulder or nerve symptoms.",
          "Skip the sleeper stretch in the first weeks after dislocation unless cleared.",
        ],
        progression: {
          early: "Cross-body stretch only, 15-second gentle holds.",
          mid: "Add the sleeper stretch, 30-second holds.",
          late: "Combine with loaded end-range work (e.g., light overhead carries).",
        },
      },
    ],
  },
  {
    id: "lowerback",
    label: "Lower Back",
    icon: "🧘",
    blurb: "Spine-sparing core endurance and graded return to hinging and load.",
    image: IMG("photo-1599901860904-17e6ed7083a0"),
    alt: "Person practicing spinal mobility and core control on a yoga mat",
    exercises: [
      {
        id: "lb-mcgill-curlup",
        name: "McGill Curl-Up",
        dose: "3 sets × 6 reps · 10s hold",
        hold: 10,
        image: IMG("photo-1434682881908-b43d0467b798"),
        alt: "Athlete performing an abdominal bracing exercise lying on the floor",
        steps: [
          "Lie on your back, one knee bent, hands under the natural arch of the lower back.",
          "Brace the abdomen as if about to take a light punch.",
          "Lift the head and shoulders a few centimetres — the spine does not flex.",
          "Hold 10 seconds breathing normally, lower slowly, switch legs halfway.",
        ],
        mistakes: [
          "Doing a full sit-up curl — the motion is tiny and the back stays neutral.",
          "Tucking the chin to the chest and yanking with the neck.",
          "Holding the breath instead of breathing behind the brace.",
        ],
        stopIf: [
          "Stop if pain travels below the knee or you feel new numbness.",
          "Stop immediately and seek care for bowel/bladder changes or saddle numbness.",
        ],
        progression: {
          early: "3–5 second holds, 4 reps, minimal lift.",
          mid: "10-second holds, 3 × 6 with full brace.",
          late: "Add breathing challenges and longer holds; progress to loaded carries.",
        },
      },
      {
        id: "lb-birddog",
        name: "Bird Dog",
        dose: "3 sets × 8 reps each side · 8s hold",
        hold: 8,
        image: IMG("photo-1518310383802-640c2de311b2"),
        alt: "Woman on all fours performing the bird dog spinal stability exercise",
        steps: [
          "Start on all fours, hands under shoulders, knees under hips.",
          "Brace lightly, then reach one arm forward and the opposite leg back.",
          "Keep the pelvis and lower back completely still — imagine balancing a cup of water.",
          "Hold 8 seconds, return with control, sweep the knee and elbow together, repeat.",
        ],
        mistakes: [
          "Letting the hips rotate or the lower back sag into extension.",
          "Lifting the leg higher than the hip line.",
          "Rushing — control matters far more than range.",
        ],
        stopIf: [
          "Stop if you get sharp centralized back pain or leg symptoms worsen.",
          "Regress to arm-only or leg-only if you cannot keep the pelvis level.",
        ],
        progression: {
          early: "Arm-only and leg-only versions, 5-second holds.",
          mid: "Full opposite arm/leg, 8-second holds.",
          late: "Add a mini-band, draw squares with the hand/foot, or elbow-to-knee taps.",
        },
      },
      {
        id: "lb-glute-bridge",
        name: "Glute Bridge",
        dose: "3 sets × 12 reps · 3s top hold",
        hold: 3,
        image: IMG("photo-1544033527-b192daee1f5b"),
        alt: "Person performing a hip bridge exercise on an exercise mat",
        steps: [
          "Lie on your back, knees bent, feet hip-width and close to the hips.",
          "Exhale, squeeze the glutes and lift the hips until knees–hips–shoulders align.",
          "Hold 3 seconds at the top without arching the lower back.",
          "Lower one vertebra at a time with control.",
        ],
        mistakes: [
          "Driving through the lower back instead of the glutes (you feel it in the spine).",
          "Pushing the hips so high the ribs flare.",
          "Letting the knees fall inward or outward.",
        ],
        stopIf: [
          "Stop if hamstring cramping is severe or back pain increases rep to rep.",
          "Stop if leg pain, numbness or tingling appears.",
        ],
        progression: {
          early: "Small-range bridges, 2 × 8, no hold.",
          mid: "Full bridges with 3-second holds, 3 × 12.",
          late: "Single-leg bridges, feet-elevated bridges, then loaded hip thrusts.",
        },
      },
      {
        id: "lb-side-plank",
        name: "Side Plank",
        dose: "3 sets × 20–30s each side",
        hold: 30,
        image: IMG("photo-1517963879433-6ad2b056d712"),
        alt: "Athlete holding a side plank position during a core training session",
        steps: [
          "Lie on your side, elbow under the shoulder, knees bent (short lever).",
          "Lift the hips so the body forms a straight line from knees to head.",
          "Breathe steadily and keep the top shoulder stacked over the bottom one.",
          "Hold 20–30 seconds, lower with control, repeat on the other side.",
        ],
        mistakes: [
          "Letting the hips sag toward the floor.",
          "Rolling the top shoulder forward.",
          "Straining the neck — keep the head in line with the spine.",
        ],
        stopIf: [
          "Stop if you feel sharp back or shoulder pain during the hold.",
          "Shorten the hold rather than shaking through it — quality over duration.",
        ],
        progression: {
          early: "Knees-bent side plank, 10–15 second holds.",
          mid: "Full side plank from the feet, 20–30 seconds.",
          late: "Add leg raises, rotations (thread-the-needle) or feet-elevated holds.",
        },
      },
      {
        id: "lb-hip-hinge",
        name: "Hip Hinge Pattern (Dowel Drill)",
        dose: "3 sets × 10 reps · slow",
        hold: 30,
        image: IMG("photo-1571019614242-c5c5dee9f50b"),
        alt: "Person practicing a hip hinge movement pattern in the gym",
        steps: [
          "Hold a dowel or broomstick along your spine: head, mid-back, and tailbone touching.",
          "Soften the knees and push the hips straight back.",
          "Hinge until you feel the hamstrings load, keeping all three contact points.",
          "Drive the hips forward to stand tall, squeezing the glutes.",
        ],
        mistakes: [
          "Losing contact at the lower back (rounding) or the head (over-arching).",
          "Squatting down instead of hinging back.",
          "Rushing into load before the pattern is clean.",
        ],
        stopIf: [
          "Stop if pain moves further down the leg as you hinge (peripheralization).",
          "Stop if you cannot keep a neutral spine even at partial range.",
        ],
        progression: {
          early: "Hinge to a box or wall-tap with tiny range.",
          mid: "Full-range dowel hinges, 3 × 10.",
          late: "Kettlebell Romanian deadlifts, then barbell hinging with load.",
        },
      },
    ],
  },
  {
    id: "knee",
    label: "Knee",
    icon: "🦵",
    blurb: "Quad capacity, load tolerance and single-leg confidence.",
    image: IMG("photo-1532798442725-41036acc7489"),
    alt: "Athlete performing a deep lower-body stretch outdoors",
    exercises: [
      {
        id: "kn-quad-sets",
        name: "Quad Sets & Terminal Knee Extension",
        dose: "3 sets × 15 reps · 5s hold",
        hold: 5,
        image: IMG("photo-1506126613408-eca07ce68773"),
        alt: "Person activating the thigh muscles during floor-based rehabilitation",
        steps: [
          "Sit with the leg straight and a rolled towel under the knee.",
          "Push the back of the knee down into the towel, tightening the thigh.",
          "Watch the kneecap glide upward as the quad contracts; hold 5 seconds.",
          "For TKE: straighten the knee fully against a band anchored in front of you.",
        ],
        mistakes: [
          "Lifting the whole leg instead of isolating the quad.",
          "Weak, half-hearted contractions — squeeze hard enough to see the muscle.",
          "Letting the knee snap into extension with the band.",
        ],
        stopIf: [
          "Stop if the knee swells noticeably after the session.",
          "Stop if you feel deep joint pain rather than muscle effort.",
        ],
        progression: {
          early: "Quad sets only, 3 × 10 with 5-second holds.",
          mid: "Banded terminal knee extensions, 3 × 15.",
          late: "Progress to leg press, split squats and step-downs.",
        },
      },
      {
        id: "kn-slr",
        name: "Straight Leg Raise",
        dose: "3 sets × 10 reps · 3s hold",
        hold: 3,
        image: IMG("photo-1549476464-37392f717541"),
        alt: "Person lying on a mat performing a controlled straight leg raise",
        steps: [
          "Lie on your back with the affected leg straight, other knee bent.",
          "Tighten the quad first, locking the knee straight.",
          "Lift the leg to the height of the opposite knee.",
          "Hold 3 seconds, lower slowly without letting the knee bend.",
        ],
        mistakes: [
          "Losing the quad set so the knee sags during the lift (extension lag).",
          "Arching the lower back to help the lift.",
          "Dropping the leg quickly instead of lowering with control.",
        ],
        stopIf: [
          "Stop if you cannot keep the knee straight — regress to quad sets.",
          "Stop if hip or back pain takes over the movement.",
        ],
        progression: {
          early: "Bodyweight raises, small range, 2 × 8.",
          mid: "Full raises with 3-second holds, 3 × 10.",
          late: "Add a 1–2 kg ankle weight or perform in four directions.",
        },
      },
      {
        id: "kn-wall-sit",
        name: "Wall Sit (Isometric)",
        dose: "3–5 sets × 30–45s hold",
        hold: 45,
        image: IMG("photo-1544367567-0f2fcb009e0b"),
        alt: "Athlete holding a static wall sit position against a gym wall",
        steps: [
          "Lean against a wall, feet about 40 cm from it, hip-width apart.",
          "Slide down to a comfortable knee angle (start around 45°, progress to 90°).",
          "Press the whole foot into the floor and the back flat into the wall.",
          "Hold 30–45 seconds at an effort around 4–6/10, breathe normally.",
        ],
        mistakes: [
          "Going straight to 90° when the tendon is irritable.",
          "Knees drifting inward past the big toe.",
          "Resting hands on thighs to unload the quads.",
        ],
        stopIf: [
          "Stop if pain rises above 3–4/10 during the hold or worsens next morning.",
          "Stop if the knee gives way or you feel sharp catching.",
        ],
        progression: {
          early: "Shallow angle (30–45°), 20-second holds.",
          mid: "70–90°, 30–45 second holds, 3–5 sets.",
          late: "Single-leg wall sits or Spanish squat holds with a band.",
        },
      },
      {
        id: "kn-step-down",
        name: "Eccentric Step-Down",
        dose: "3 sets × 8 reps each leg · 3s lowering",
        hold: 60,
        image: IMG("photo-1571019613454-1cb2f99b2d8b"),
        alt: "Runner descending steps demonstrating controlled single-leg loading",
        steps: [
          "Stand on a low step (10–15 cm) on the affected leg.",
          "Keep the pelvis level and the knee tracking over the middle of the foot.",
          "Lower the free heel toward the floor over 3 slow seconds.",
          "Lightly tap the heel, then drive back up through the standing leg.",
        ],
        mistakes: [
          "Letting the knee collapse inward (valgus) as you lower.",
          "Dropping the opposite hip instead of staying level.",
          "Descending fast — the 3-second eccentric is the exercise.",
        ],
        stopIf: [
          "Stop if sharp pain occurs under or around the kneecap above 3/10.",
          "Stop if the knee feels unstable or gives way.",
        ],
        progression: {
          early: "Sit-to-stand from a high chair, 3 × 8.",
          mid: "10–15 cm step-downs with 3-second lowering.",
          late: "20 cm step, add load, then introduce hop-and-land drills.",
        },
      },
    ],
  },
  {
    id: "ankle",
    label: "Ankle",
    icon: "🦶",
    blurb: "Calf-tendon loading, dorsiflexion range and single-leg balance.",
    image: IMG("photo-1518611012118-696072aa579a"),
    alt: "Runner on outdoor steps showing ankle loading during push-off",
    exercises: [
      {
        id: "ak-alphabet",
        name: "Ankle Alphabet & Pumps",
        dose: "2 sets × full A–Z · pumps 2×20",
        hold: 60,
        image: IMG("photo-1541534741688-6078c6bfb5c5"),
        alt: "Person seated on a mat mobilizing the foot and ankle",
        steps: [
          "Sit with the leg supported and the foot hanging free.",
          "Draw every letter of the alphabet with the big toe, moving only the ankle.",
          "Keep movements slow and as large as comfort allows.",
          "Finish with 20 up-down ankle pumps to help swelling drain.",
        ],
        mistakes: [
          "Moving from the hip or knee instead of the ankle.",
          "Tiny, rushed letters — range is the goal.",
          "Working through sharp pain rather than mild stretch.",
        ],
        stopIf: [
          "Stop if you cannot bear any weight at all — get assessed to rule out fracture.",
          "Stop if numbness or colour changes appear in the foot.",
        ],
        progression: {
          early: "Alphabet and pumps only, several times daily, elevated.",
          mid: "Add resistance-band ankle work in all four directions.",
          late: "Progress to weight-bearing calf raises and balance drills.",
        },
      },
      {
        id: "ak-calf-raise",
        name: "Calf Raises (Bent & Straight Knee)",
        dose: "3 sets × 12 reps · 2s down",
        hold: 30,
        image: IMG("photo-1607962837359-5e7e89f86776"),
        alt: "Athlete rising onto the balls of the feet during calf strengthening",
        steps: [
          "Stand tall holding light fingertip support on a wall or rail.",
          "Rise up onto the balls of both feet as high as possible.",
          "Lower down slowly over 2 seconds.",
          "Repeat with knees slightly bent to bias the soleus muscle.",
        ],
        mistakes: [
          "Bouncing at the bottom instead of controlling the lowering phase.",
          "Rolling onto the outside of the foot at the top.",
          "Skipping the bent-knee version — the soleus does most Achilles work.",
        ],
        stopIf: [
          "Stop if Achilles pain exceeds 4/10 during, or is worse the next morning.",
          "Stop and seek review for a sudden 'snap' sensation in the calf.",
        ],
        progression: {
          early: "Two-leg raises from the floor, 3 × 10.",
          mid: "Single-leg raises from the floor, 3 × 12.",
          late: "Single-leg raises off a step with added load, then hopping drills.",
        },
      },
      {
        id: "ak-balance",
        name: "Single-Leg Balance Series",
        dose: "3 sets × 30s each leg",
        hold: 30,
        image: IMG("photo-1574680096145-d05b474e2155"),
        alt: "Person balancing on one leg during an outdoor mobility session",
        steps: [
          "Stand on the affected leg with a soft knee, near support if needed.",
          "Hold steady for 30 seconds with tall posture.",
          "Progress: eyes closed, then head turns, then standing on a folded towel.",
          "Finally add reaching tasks — tap the free foot to clock positions.",
        ],
        mistakes: [
          "Locking the knee and gripping with the toes the whole time.",
          "Holding onto support constantly instead of light touch.",
          "Progressing before 30 clean seconds are easy at each stage.",
        ],
        stopIf: [
          "Stop if swelling increases after sessions or the ankle repeatedly gives way.",
          "Recurrent giving-way deserves professional assessment.",
        ],
        progression: {
          early: "Eyes open on firm ground, fingertip support.",
          mid: "Eyes closed and unstable surface (towel/cushion).",
          late: "Hop-and-stick landings and sport-specific cutting drills.",
        },
      },
      {
        id: "ak-knee-to-wall",
        name: "Knee-to-Wall Dorsiflexion",
        dose: "3 sets × 10 reps each side · 5s hold",
        hold: 5,
        image: IMG("photo-1522898467493-49726bf28798"),
        alt: "Person in a lunge position mobilizing the front ankle toward a wall",
        steps: [
          "Face a wall in a small lunge, front foot 8–10 cm away from it.",
          "Drive the front knee toward the wall, keeping the heel glued to the floor.",
          "Touch the wall (or reach maximum comfortable range), hold 5 seconds.",
          "Track progress by moving the foot back 1 cm as range improves.",
        ],
        mistakes: [
          "Letting the heel lift off the floor.",
          "Knee diving inward instead of tracking over the second toe.",
          "Forcing through a pinching feeling at the front of the ankle.",
        ],
        stopIf: [
          "Stop if you feel a bony pinch at the front of the ankle joint.",
          "Stop if the stretch reproduces your original injury pain sharply.",
        ],
        progression: {
          early: "Seated ankle rocks with body weight only.",
          mid: "Standing knee-to-wall with holds, 3 × 10.",
          late: "Loaded dorsiflexion (goblet squat pauses, weighted lunges).",
        },
      },
    ],
  },
  {
    id: "wrist",
    label: "Wrist",
    icon: "✋",
    blurb: "Grip strength, forearm tendon capacity and load tolerance for pressing.",
    image: IMG("photo-1517836357463-d25dfeac3438"),
    alt: "Physiotherapist mobilizing a patient's wrist and forearm",
    exercises: [
      {
        id: "wr-flexor-stretch",
        name: "Wrist Flexor & Extensor Stretch",
        dose: "3 reps each direction · 30s hold",
        hold: 30,
        image: IMG("photo-1573384666979-2b8ac2a5e623"),
        alt: "Therapist assisting a gentle wrist stretch during a treatment session",
        steps: [
          "Extend one arm forward with the elbow straight, palm up.",
          "Use the other hand to gently draw the fingers down and back (flexor stretch).",
          "Turn the palm down and draw the back of the hand toward you (extensor stretch).",
          "Hold each for 30 seconds at a mild, comfortable stretch.",
        ],
        mistakes: [
          "Yanking on the fingers instead of a slow, sustained pull.",
          "Bending the elbow, which unloads the stretch.",
          "Stretching into nerve symptoms rather than a muscle stretch.",
        ],
        stopIf: [
          "Stop if you feel tingling into the fingers — that is nerve, not muscle.",
          "Stop if pain localises to a specific bony spot on the wrist.",
        ],
        progression: {
          early: "Gentle 15-second holds within pain-free range.",
          mid: "30-second holds with light overpressure.",
          late: "Weight-bearing stretches on all fours, rocking gently backward.",
        },
      },
      {
        id: "wr-eccentric",
        name: "Eccentric Wrist Curls",
        dose: "3 sets × 12 reps · 4s lowering",
        hold: 45,
        image: IMG("photo-1552196563-55cd4e45efb3"),
        alt: "Close-up of forearm training with a light dumbbell in the gym",
        steps: [
          "Sit with the forearm supported on a bench, hand over the edge, light dumbbell in hand.",
          "Palm down for extensors (tennis elbow), palm up for flexors (golfer's elbow).",
          "Use the free hand to help lift the weight up.",
          "Lower slowly over 4 seconds using only the working arm.",
        ],
        mistakes: [
          "Lowering fast — the slow eccentric is the therapeutic stimulus.",
          "Choosing a weight so heavy the wrist shakes through range.",
          "Lifting the forearm off the bench to cheat.",
        ],
        stopIf: [
          "Stop if pain exceeds 4/10 during or remains elevated 24 hours later.",
          "Stop if numbness appears in the ring and little fingers.",
        ],
        progression: {
          early: "Isometric holds mid-range, 5 × 30 seconds, very light.",
          mid: "Eccentric-only curls with 1–3 kg, 3 × 12.",
          late: "Full concentric-eccentric curls, then loaded carries and grip work.",
        },
      },
      {
        id: "wr-pronation",
        name: "Pronation / Supination Rotations",
        dose: "3 sets × 10 reps each way · slow",
        hold: 30,
        image: IMG("photo-1540206395-68808572332f"),
        alt: "Person rotating the forearm with light resistance during rehab training",
        steps: [
          "Hold a hammer or light dumbbell loaded at one end, elbow bent 90° at your side.",
          "Slowly rotate the palm up (supination) until comfortable end range.",
          "Rotate palm down (pronation) with the same control.",
          "Keep the elbow pinned to the ribs throughout.",
        ],
        mistakes: [
          "Swinging the weight with momentum.",
          "Letting the shoulder rotate instead of the forearm.",
          "Gripping so hard the forearm pumps out early.",
        ],
        stopIf: [
          "Stop if you feel clicking with pain on the pinkie side of the wrist.",
          "Stop if elbow pain sharpens with each rep.",
        ],
        progression: {
          early: "No weight — open-hand rotations through comfortable range.",
          mid: "Hammer rotations, 3 × 10 each direction.",
          late: "Heavier offset load and faster tempo for racquet/barbell sports.",
        },
      },
      {
        id: "wr-grip",
        name: "Progressive Grip Training",
        dose: "3 sets × 10 squeezes · 5s hold",
        hold: 5,
        image: IMG("photo-1599901860904-17e6ed7083a0"),
        alt: "Athlete gripping training equipment during a strength session",
        steps: [
          "Start with a soft ball or rolled towel in the palm.",
          "Squeeze firmly to about 50–70% effort and hold 5 seconds.",
          "Relax fully between reps — full release matters as much as the squeeze.",
          "Progress to firmer objects, then towel-wrung twists and dead hangs.",
        ],
        mistakes: [
          "Maximal crushing from day one.",
          "Only training the squeeze — add finger extension with a rubber band.",
          "Ignoring the wrist position — keep it neutral, not collapsed.",
        ],
        stopIf: [
          "Stop if gripping reproduces sharp wrist pain above 4/10.",
          "Stop if the hand feels cold, pale, or tingly afterwards.",
        ],
        progression: {
          early: "Soft ball squeezes at 50% effort.",
          mid: "Firm gripper or towel twists, 3 × 10.",
          late: "Timed dead hangs and loaded carries for full grip capacity.",
        },
      },
    ],
  },
  {
    id: "hip",
    label: "Hip",
    icon: "🏃",
    blurb: "Glute strength, hip mobility and lateral stability for running and lifting.",
    image: IMG("photo-1434682881908-b43d0467b798"),
    alt: "Person in an outdoor deep hip stretch during a mobility session",
    exercises: [
      {
        id: "hp-clamshell",
        name: "Clamshells",
        dose: "3 sets × 15 reps each side · 2s hold",
        hold: 2,
        image: IMG("photo-1518310383802-640c2de311b2"),
        alt: "Woman lying on her side performing a hip strengthening exercise",
        steps: [
          "Lie on your side, hips and knees bent about 45°, heels together.",
          "Stack the hips vertically and keep the pelvis still.",
          "Open the top knee like a clamshell without rolling the pelvis back.",
          "Hold 2 seconds at the top, feeling the side of the hip work; lower slowly.",
        ],
        mistakes: [
          "Rolling the pelvis backward to fake a bigger range.",
          "Letting the feet lift apart — heels stay glued.",
          "Feeling it only in the front of the hip (adjust angle, reduce range).",
        ],
        stopIf: [
          "Stop if pinching occurs in the groin at the top of the movement.",
          "Stop if the outside of the hip becomes sharply painful to lie on.",
        ],
        progression: {
          early: "Small range, bodyweight, 2 × 10.",
          mid: "Full range with 2-second holds, 3 × 15.",
          late: "Add a mini-band above the knees, then side-plank clamshells.",
        },
      },
      {
        id: "hp-flexor-stretch",
        name: "Half-Kneeling Hip Flexor Stretch",
        dose: "3 reps each side · 30s hold",
        hold: 30,
        image: IMG("photo-1544033527-b192daee1f5b"),
        alt: "Person holding a deep lunge stretch for the front of the hip",
        steps: [
          "Kneel on one knee with the other foot forward (use a cushion under the knee).",
          "Tuck the tailbone under and squeeze the glute of the kneeling side.",
          "Shift the whole body slightly forward until a stretch appears at the front of the hip.",
          "Reach the same-side arm overhead to deepen; hold 30 seconds.",
        ],
        mistakes: [
          "Arching the lower back instead of shifting the pelvis forward.",
          "Lunging so far the front knee collapses inward.",
          "Chasing intensity — the posterior tilt IS the stretch.",
        ],
        stopIf: [
          "Stop if you feel deep groin pinching or clicking with pain.",
          "Stop if back pain increases while stretching.",
        ],
        progression: {
          early: "Gentle 15-second holds without the overhead reach.",
          mid: "30-second holds with overhead reach and side bend.",
          late: "Rear-foot-elevated (couch) stretch for a stronger stimulus.",
        },
      },
      {
        id: "hp-band-walk",
        name: "Lateral Band Walks",
        dose: "3 sets × 12 steps each way",
        hold: 45,
        image: IMG("photo-1517963879433-6ad2b056d712"),
        alt: "Athlete stepping sideways against a resistance band around the legs",
        steps: [
          "Place a mini-band just above the knees (easier) or ankles (harder).",
          "Sit into a quarter-squat athletic stance, chest up.",
          "Step sideways leading with the knee, keeping constant band tension.",
          "Take 12 controlled steps one way, then return — no feet dragging together.",
        ],
        mistakes: [
          "Standing tall and losing the athletic stance.",
          "Letting the trailing foot slide in and kill band tension.",
          "Knees caving inward against the band.",
        ],
        stopIf: [
          "Stop if the outside of the hip burns into sharp pain rather than fatigue.",
          "Stop if you feel snapping at the side of the hip with pain.",
        ],
        progression: {
          early: "Band above knees, shallow stance.",
          mid: "Band at ankles, deeper stance, 3 × 12 steps.",
          late: "Monster walks, band at feet, or add a goblet-hold load.",
        },
      },
      {
        id: "hp-sl-rdl",
        name: "Single-Leg Romanian Deadlift",
        dose: "3 sets × 8 reps each leg · slow",
        hold: 60,
        image: IMG("photo-1571019614242-c5c5dee9f50b"),
        alt: "Person performing a single-leg hinge exercise with control in the gym",
        steps: [
          "Stand on one leg with a soft knee, other foot lightly touching behind (kickstand).",
          "Hinge at the hip, reaching the chest forward and the free leg back.",
          "Keep hips square to the floor — imagine headlights on your pelvis pointing down.",
          "Lower until the hamstring loads, then drive the hips forward to stand.",
        ],
        mistakes: [
          "Rotating the pelvis open toward the ceiling.",
          "Rounding the back to reach lower than your hamstrings allow.",
          "Rushing — balance and control are the entire point.",
        ],
        stopIf: [
          "Stop if you feel back pain rather than hamstring/glute effort.",
          "Stop if the standing hip pinches deep in the groin.",
        ],
        progression: {
          early: "Kickstand RDL holding light support.",
          mid: "Free-standing single-leg RDL, bodyweight, 3 × 8.",
          late: "Add a kettlebell or dumbbell; progress load weekly as tolerated.",
        },
      },
    ],
  },
];

/* ------------------------------ POLICE data ----------------------------- */

const POLICE = [
  { letter: "P", name: "Protection", desc: "Protect from further injury, use brace/sling if needed." },
  { letter: "O", name: "Optimal Loading", desc: "Gentle movement to promote healing — avoid bed rest." },
  { letter: "L", name: "Ice", desc: "Apply ice pack 15–20 min every 2 hours for the first 48 h." },
  { letter: "I", name: "Compression", desc: "Compression bandage to reduce swelling." },
  { letter: "C", name: "Elevation", desc: "Keep injured area elevated above heart level." },
  { letter: "E", name: "Early Movement", desc: "Begin guided range-of-motion exercises when tolerated." },
];

const RECOVERY_TIPS = [
  {
    icon: "🧊",
    title: "Ice vs Heat",
    accent: "text-orange-600",
    border: "border-orange-500/25",
    points: [
      "Ice in the first 48–72 h after acute injury: 15–20 min, cloth barrier, every 2–3 h.",
      "Heat for stiff, chronic aches and before exercise: 15–20 min to relax tissue.",
      "Never ice before training a stiff joint, and never heat a hot, swollen one.",
    ],
  },
  {
    icon: "😴",
    title: "Sleep & Recovery",
    accent: "text-amber-600",
    border: "border-amber-500/25",
    points: [
      "Aim for 7–9 hours — most tissue repair and growth hormone release happens in deep sleep.",
      "Under 6 hours of sleep is linked to significantly higher injury rates in athletes.",
      "Protein spread across the day (1.6–2.2 g/kg) supports tendon and muscle repair.",
    ],
  },
  {
    icon: "⏳",
    title: "Tissue Healing Timelines",
    accent: "text-[#ea580c]",
    border: "border-[#ea580c]/25",
    points: [
      "Muscle strains: ~2–6 weeks. Ligament sprains: ~6–12 weeks depending on grade.",
      "Tendinopathy: 12+ weeks of progressive loading — there is no shortcut.",
      "Bone: ~6–12 weeks. Pain easing early does NOT mean the tissue is fully remodeled.",
    ],
  },
];

const SEE_A_PRO = [
  "Numbness, tingling, or weakness that spreads down a limb",
  "Night pain that wakes you or constant pain unrelated to movement",
  "A joint that locks, gives way, or is visibly deformed",
  "Inability to bear weight, or swelling that keeps increasing after 72 h",
  "Bowel or bladder changes, or saddle numbness — emergency care immediately",
  "No meaningful improvement after 2 weeks of sensible self-management",
];

/* --------------------------- Shared UI pieces --------------------------- */

const FALLBACK_GRADIENT =
  "linear-gradient(135deg, rgba(249,115,22,0.35) 0%, rgba(251,146,60,0.25) 50%, rgba(234,88,12,0.3) 100%)";

function RehabImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center ${className ?? ""}`}
        style={{ background: FALLBACK_GRADIENT }}
      >
        <span className="text-4xl opacity-70" aria-hidden>
          🩺
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
      {children}
    </span>
  );
}

/* ------------------------------ Hold Timer ------------------------------ */

function HoldTimer({ seconds }: { seconds: number }) {
  const [duration, setDuration] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const presets = [15, 30, 45, 60];

  return (
    <div className="rounded-xl border border-[#2a1e16]/10 bg-[#faf4ec]/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Hold / Rest Timer</p>
        <span
          className={`font-mono text-2xl font-black tabular-nums ${
            remaining === 0 ? "text-emerald-400" : "text-[#2a1e16]"
          }`}
        >
          {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#2a1e16]/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-[#ea580c] transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            if (remaining === 0) setRemaining(duration);
            setRunning((r) => !r);
          }}
          className="btn-gloss rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-1.5 text-sm font-bold text-white"
        >
          {running ? "Pause" : remaining === 0 ? "Restart" : "Start"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(duration);
          }}
          className="rounded-full border border-[#2a1e16]/15 px-4 py-1.5 text-sm font-semibold text-[#2a1e16]/70 transition-colors hover:border-[#2a1e16]/35 hover:text-[#2a1e16]"
        >
          Reset
        </button>
        <div className="ml-auto flex gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => {
                setRunning(false);
                setDuration(p);
                setRemaining(p);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs font-bold transition-colors ${
                duration === p
                  ? "border-[#ea580c]/60 bg-[#ea580c]/15 text-[#ea580c]"
                  : "border-[#2a1e16]/12 text-[#2a1e16]/62 hover:border-[#2a1e16]/30"
              }`}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
      {remaining === 0 && <p className="mt-2 text-xs font-semibold text-emerald-400">Done — nice hold. Shake it out.</p>}
    </div>
  );
}

/* ---------------------------- Exercise Modal ---------------------------- */

type Stage = "early" | "mid" | "late";
const STAGES: { key: Stage; label: string }[] = [
  { key: "early", label: "Early Stage" },
  { key: "mid", label: "Mid Stage" },
  { key: "late", label: "Late Stage" },
];

function ExerciseModal({
  exercise,
  done,
  onToggleDone,
  onClose,
}: {
  exercise: RehabExercise;
  done: boolean;
  onToggleDone: () => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("mid");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.name} details`}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-[#2a1e16]/12 bg-[#fffdf9]/95 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <RehabImg src={exercise.image} alt={exercise.alt} className="h-56 w-full sm:h-72" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fffdf9] via-[#fffdf9]/30 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close exercise details"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#2a1e16]/20 bg-black/50 text-[#2a1e16] transition-colors hover:bg-black/80"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">{exercise.dose}</p>
            <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#2a1e16] sm:text-3xl">{exercise.name}</h3>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <HoldTimer seconds={exercise.hold} />

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">How to perform</p>
            <ol className="space-y-2">
              {exercise.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#2a1e16]/80">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Common Mistakes</p>
              <ul className="space-y-1.5">
                {exercise.mistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-[#2a1e16]/70">
                    <span aria-hidden>⚠</span> {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400">Stop If…</p>
              <ul className="space-y-1.5">
                {exercise.stopIf.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-[#2a1e16]/70">
                    <span aria-hidden>🛑</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Progression Levels</p>
            <div className="mb-3 flex gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                    stage === s.key
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-600"
                      : "border-[#2a1e16]/12 text-[#2a1e16]/62 hover:border-[#2a1e16]/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="rounded-xl border border-[#2a1e16]/10 bg-[#faf4ec]/60 p-4 text-sm leading-relaxed text-[#2a1e16]/80">
              {exercise.progression[stage]}
            </p>
          </div>

          <button
            onClick={onToggleDone}
            className={`btn-gloss w-full rounded-2xl px-5 py-3 text-sm font-black tracking-wide transition-all ${
              done
                ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-600"
                : "bg-gradient-to-r from-orange-600 to-amber-600 text-white"
            }`}
          >
            {done ? "✓ Completed — tap to undo" : "Mark as Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Main Page ------------------------------- */

const DONE_KEY = "tiger-physio-done-v1";

export function PhysioSection() {
  return <PhysioRehabPage />;
}

export default function PhysioRehabPage() {
  const [activePart, setActivePart] = useState<BodyPartId>("shoulder");
  const [openExercise, setOpenExercise] = useState<RehabExercise | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(DONE_KEY);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify([...doneIds]));
    } catch {
      /* storage unavailable */
    }
  }, [doneIds]);

  const part = useMemo(() => BODY_PARTS.find((b) => b.id === activePart)!, [activePart]);
  const doneInPart = part.exercises.filter((e) => doneIds.has(e.id)).length;
  const progressPct = Math.round((doneInPart / part.exercises.length) * 100);

  const toggleDone = (id: string) =>
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="min-h-screen bg-[#faf4ec] px-4 py-10 text-[#2a1e16] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-[#2a1e16]/10">
          <RehabImg
            src={IMG("photo-1576091160399-112ba8d25d1d")}
            alt="Healthcare professional reviewing a patient's rehabilitation plan"
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf4ec] via-[#faf4ec]/92 to-[#faf4ec]/55" />
          <div className="relative px-6 py-12 sm:px-10 sm:py-16">
            <SectionLabel>Physiotherapy & Injury Rehab</SectionLabel>
            <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              Recover Smarter.{" "}
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-[#ea580c] bg-clip-text text-transparent">
                Come Back Stronger.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#2a1e16]/70 sm:text-base">
              Evidence-based rehab programs for seven body regions — step-by-step exercises, hold timers,
              red-flag safety checks and staged progressions, all in one hub.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.2em]">
              <span className="rounded-full border border-[#ea580c]/40 bg-[#ea580c]/10 px-3 py-1 text-[#ea580c]">7 body regions</span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-600">30 exercises</span>
              <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-orange-600">3 stages each</span>
            </div>
          </div>
        </header>

        {/* How this works — 3 steps */}
        <section>
          <div className="glass-card rounded-2xl p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">How this works — 3 simple steps</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { n: "1", t: "Select the body part that hurts", d: "Tap the region below — neck, shoulder, back, knee and more. Each card lists the symptoms it helps." },
                { n: "2", t: "Do the exercises in order", d: "Follow the numbered steps with the real demonstration photo. Use the hold timer and only go as far as a gentle stretch — never sharp pain." },
                { n: "3", t: "Progress through the stages", d: "Start at Early recovery. As pain settles and movement improves, move up to Mid then Late stage exercises." },
              ].map((s) => (
                <div key={s.n} className="rounded-xl border border-[#2a1e16]/8 bg-[#2a1e16]/5 p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-sm font-black text-white">{s.n}</div>
                  <p className="text-sm font-bold text-[#2a1e16]">{s.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#2a1e16]/68">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Body part selector */}
        <section>
          <div className="mb-6 text-center">
            <SectionLabel>Choose your focus</SectionLabel>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Where does it hurt?</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {BODY_PARTS.map((b) => {
              const active = b.id === activePart;
              const done = b.exercises.filter((e) => doneIds.has(e.id)).length;
              return (
                <button
                  key={b.id}
                  onClick={() => setActivePart(b.id)}
                  aria-pressed={active}
                  className={`glass-card group rounded-2xl border p-4 text-center transition-all ${
                    active
                      ? "border-gold-glow border-[#ea580c]/60 bg-gradient-to-b from-orange-600/25 to-amber-600/10"
                      : "border-[#2a1e16]/10 bg-[#fffdf9]/60 hover:border-[#2a1e16]/25"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {b.icon}
                  </span>
                  <p className={`mt-2 text-sm font-black tracking-[-0.02em] ${active ? "text-[#2a1e16]" : "text-[#2a1e16]/75"}`}>
                    {b.label}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#2a1e16]/62">
                    {done}/{b.exercises.length} done
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active body part detail */}
        <section className="glass-card overflow-hidden rounded-3xl border border-[#2a1e16]/10 bg-[#fffdf9]/60">
          <div className="relative">
            <RehabImg src={part.image} alt={part.alt} className="h-44 w-full sm:h-56" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fffdf9] via-[#fffdf9]/40 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">
                  {part.exercises.length}-exercise session
                </p>
                <h3 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">{part.label} Rehab Program</h3>
              </div>
              <div className="min-w-[180px]">
                <div className="mb-1 flex justify-between text-xs font-bold text-[#2a1e16]/70">
                  <span>Session progress</span>
                  <span className="text-[#ea580c]">{progressPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#2a1e16]/12">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-[#ea580c] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <p className="mb-5 text-sm leading-relaxed text-[#2a1e16]/62">{part.blurb}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {part.exercises.map((ex, i) => {
                const done = doneIds.has(ex.id);
                return (
                  <div
                    key={ex.id}
                    className={`group overflow-hidden rounded-2xl border transition-all ${
                      done ? "border-emerald-500/35 bg-emerald-500/5" : "border-[#2a1e16]/10 bg-[#faf4ec]/60 hover:border-orange-500/40"
                    }`}
                  >
                    <button
                      onClick={() => setOpenExercise(ex)}
                      className="block w-full text-left"
                      aria-label={`Open ${ex.name} details`}
                    >
                      <div className="relative">
                        <RehabImg src={ex.image} alt={ex.alt} className="h-36 w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#faf4ec]/95 via-transparent to-transparent" />
                        <span className="absolute left-3 top-3 rounded-full border border-[#2a1e16]/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2a1e16]/80">
                          Exercise {i + 1}
                        </span>
                        {done && (
                          <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-sm font-black text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-black tracking-[-0.02em] text-[#2a1e16]">{ex.name}</h4>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">{ex.dose}</p>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#2a1e16]/62">{ex.steps[0]}</p>
                      </div>
                    </button>
                    <div className="flex items-center justify-between border-t border-[#2a1e16]/8 px-4 py-2.5">
                      <button
                        onClick={() => setOpenExercise(ex)}
                        className="text-xs font-bold text-orange-600 transition-colors hover:text-amber-600"
                      >
                        View steps, timer & progressions →
                      </button>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#2a1e16]/62">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleDone(ex.id)}
                          className="h-4 w-4 accent-emerald-500"
                          aria-label={`Mark ${ex.name} as done`}
                        />
                        Done
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            {doneInPart === part.exercises.length && (
              <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 text-center text-sm font-bold text-emerald-600">
                Session complete — great work. Recheck symptoms tomorrow before progressing.
              </p>
            )}
          </div>
        </section>

        {/* POLICE protocol */}
        <section className="glass-card rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-900/20 via-[#fffdf9]/60 to-amber-900/10 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-black text-white">
              Rx
            </div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em]">POLICE Protocol</h2>
              <p className="text-xs text-[#2a1e16]/62">Immediate management for a fresh injury (first 72 hours)</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {POLICE.map((item) => (
              <div key={item.letter} className="flex gap-3 rounded-xl border border-[#2a1e16]/8 bg-[#faf4ec]/60 p-4">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-black text-white">
                  {item.letter}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2a1e16]">{item.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#2a1e16]/62">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recovery tips */}
        <section>
          <div className="mb-6 text-center">
            <SectionLabel>Recovery Science</SectionLabel>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Heal Faster Between Sessions</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {RECOVERY_TIPS.map((tip) => (
              <div key={tip.title} className={`glass-card rounded-2xl border ${tip.border} bg-[#fffdf9]/60 p-5`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {tip.icon}
                  </span>
                  <h3 className={`text-base font-black tracking-[-0.02em] ${tip.accent}`}>{tip.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {tip.points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#2a1e16]/70">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${tip.accent}`} aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* When to see a professional */}
        <section className="border-gold-glow rounded-3xl border border-[#ea580c]/30 bg-gradient-to-br from-[#ea580c]/10 to-amber-900/5 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#ea580c]/40 bg-[#ea580c]/15 text-2xl" aria-hidden>
              ⚕️
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">When to see a professional</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">Self-rehab has limits. Know yours.</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {SEE_A_PRO.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#2a1e16]/75">
                    <span className="text-red-400" aria-hidden>
                      ▸
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-[#2a1e16]/62">
                Medical disclaimer: this content is educational and does not replace professional medical advice.
                Always consult a qualified physiotherapist or physician before starting a rehabilitation program,
                especially after acute injury or surgery.
              </p>
            </div>
          </div>
        </section>
      </div>

      {openExercise && (
        <ExerciseModal
          exercise={openExercise}
          done={doneIds.has(openExercise.id)}
          onToggleDone={() => toggleDone(openExercise.id)}
          onClose={() => setOpenExercise(null)}
        />
      )}
    </div>
  );
}
