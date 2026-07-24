import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthSystem'
import { useCheckout } from './Checkout'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface Pose {
  id: number
  name: string
  english: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  benefits: string[]
  muscles: string[]
  contraindications: string[]
  steps: string[]
  figure: string
}

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const POSES: Pose[] = [
  // STANDING POSES
  { id: 1, name: "Tadasana", english: "Mountain Pose", category: "Standing", level: "Beginner", duration: "30–60 sec", benefits: ["Improves posture", "Strengthens thighs and ankles", "Firms abdomen", "Relieves sciatica", "Increases awareness"], muscles: ["Quadriceps", "Core", "Back"], contraindications: ["Headache", "Insomnia"], steps: ["Stand with feet together", "Distribute weight evenly", "Lift kneecaps, engage thighs", "Elongate spine, lift chest", "Arms alongside body, palms forward", "Breathe deeply for 30 seconds"], figure: "mountain" },
  { id: 2, name: "Vrikshasana", english: "Tree Pose", category: "Standing", level: "Beginner", duration: "30–60 sec each side", benefits: ["Improves balance and stability", "Strengthens legs and core", "Opens hips", "Develops concentration", "Calms the mind"], muscles: ["Glutes", "Inner thighs", "Core"], contraindications: ["Vertigo", "High blood pressure (no arms overhead)"], steps: ["Stand tall with feet together and take one slow breath in and out", "Exhale and press all your weight into your right foot", "Place your left sole on your inner right thigh or calf — never on the knee", "Inhale and bring your palms together at your chest", "If steady, raise your arms overhead on your next inhale", "Breathe slowly for 30 seconds, then exhale, lower the foot and switch sides"], figure: "tree" },
  { id: 3, name: "Virabhadrasana I", english: "Warrior I", category: "Standing", level: "Beginner", duration: "30–45 sec each side", benefits: ["Builds strength and stamina", "Opens chest and lungs", "Strengthens shoulders, arms, thighs", "Develops focus and balance", "Energises entire body"], muscles: ["Quadriceps", "Hip flexors", "Shoulders"], contraindications: ["High blood pressure", "Heart problems", "Shoulder issues"], steps: ["From Tadasana, step right foot back 4 feet", "Turn right foot out 45°", "Bend left knee to 90°", "Raise arms overhead, palms facing", "Square hips forward", "Hold 5 breaths, switch sides"], figure: "warrior1" },
  { id: 4, name: "Virabhadrasana II", english: "Warrior II", category: "Standing", level: "Beginner", duration: "30–45 sec each side", benefits: ["Strengthens legs and hips", "Opens chest and shoulders", "Increases stamina", "Relieves backache", "Stimulates abdominal organs"], muscles: ["Quadriceps", "Hamstrings", "Hip abductors"], contraindications: ["Neck problems (keep head forward)", "Diarrhoea"], steps: ["Step your feet about 4 feet apart and breathe in deeply", "Turn your right foot out 90° and your left foot in slightly", "Exhale and bend your right knee until it stacks over the ankle", "Inhale and stretch your arms out parallel to the floor", "Fix your gaze softly over your right fingertips", "Hold for 5 slow breaths, keeping your torso upright — do not lean forward"], figure: "warrior2" },
  { id: 5, name: "Virabhadrasana III", english: "Warrior III", category: "Standing", level: "Intermediate", duration: "20–30 sec each side", benefits: ["Tones entire body", "Improves balance and posture", "Strengthens ankles and legs", "Tones abdomen", "Develops concentration"], muscles: ["Hamstrings", "Glutes", "Core", "Shoulders"], contraindications: ["High blood pressure"], steps: ["Begin in Warrior I and take one steadying breath", "Exhale and shift all your weight onto your front foot", "Inhale and hinge your torso forward from the hips", "Exhale and lift your back leg until it is parallel to the floor", "Reach your arms forward or keep them alongside your body", "Breathe evenly for 20–30 seconds, keeping hips level in one straight line"], figure: "warrior3" },
  { id: 6, name: "Trikonasana", english: "Triangle Pose", category: "Standing", level: "Beginner", duration: "30–60 sec each side", benefits: ["Stretches legs, hips, spine", "Opens chest and shoulders", "Relieves stress and anxiety", "Strengthens thighs", "Improves digestion"], muscles: ["Hamstrings", "IT band", "Obliques", "Thoracic spine"], contraindications: ["Low blood pressure", "Migraine", "Neck injury (don't look up)"], steps: ["Step your feet about 4 feet apart and stand tall on an inhale", "Turn your right foot out 90° and your left foot in slightly", "Inhale and stretch both arms out into a T shape", "Exhale and reach your right hand down to your shin or a block", "Inhale and extend your left arm straight up to the ceiling", "Breathe slowly for 5 breaths, looking up at your left hand (or forward if your neck complains)"], figure: "triangle" },
  { id: 7, name: "Utkatasana", english: "Chair Pose", category: "Standing", level: "Beginner", duration: "30–60 sec", benefits: ["Strengthens thighs, ankles, spine", "Stimulates heart and diaphragm", "Reduces flat feet", "Tones digestive organs", "Builds heat in body"], muscles: ["Quadriceps", "Glutes", "Core", "Back extensors"], contraindications: ["Low blood pressure", "Insomnia", "Knee injury"], steps: ["Stand in Tadasana", "Inhale, raise arms overhead", "Exhale, bend knees as if sitting on chair", "Keep knees behind toes", "Torso leans slightly forward", "Hold 5–10 breaths"], figure: "chair" },
  { id: 8, name: "Garudasana", english: "Eagle Pose", category: "Standing", level: "Intermediate", duration: "30 sec each side", benefits: ["Strengthens calves, ankles, thighs", "Stretches shoulders and upper back", "Improves concentration", "Opens hips", "Challenges balance"], muscles: ["Calves", "Hip external rotators", "Shoulders"], contraindications: ["Knee injury"], steps: ["Stand tall and take one slow breath to find your balance", "Exhale and bend both knees slightly", "Cross your right thigh over your left thigh", "Hook your right foot behind your left calf if you can", "Inhale and cross your left arm over your right, wrapping the forearms", "Lift the elbows to eye level and breathe evenly for 30 seconds, then unwind and switch sides"], figure: "eagle" },
  { id: 9, name: "Parsvakonasana", english: "Extended Side Angle", category: "Standing", level: "Beginner", duration: "30–45 sec each side", benefits: ["Strengthens legs and knees", "Stretches groin and spine", "Stimulates abdominal organs", "Increases stamina", "Stretches chest and lungs"], muscles: ["Hip flexors", "Obliques", "Quadriceps"], contraindications: ["High blood pressure", "Insomnia"], steps: ["Set up in Warrior II and take one full breath", "Exhale and rest your right forearm on your right thigh", "Or, if flexible, place your right hand on the floor outside the foot", "Inhale and sweep your left arm overhead in line with your body", "Turn your gaze up toward the left arm and keep breathing", "Hold 5 slow breaths, making one straight line from left foot to left fingertips"], figure: "sideangle" },
  { id: 10, name: "Uttanasana", english: "Standing Forward Bend", category: "Standing", level: "Beginner", duration: "30–60 sec", benefits: ["Calms brain and nervous system", "Relieves stress and anxiety", "Stretches hamstrings and calves", "Stimulates liver and kidneys", "Improves digestion"], muscles: ["Hamstrings", "Calves", "Back extensors"], contraindications: ["Back injury (bend knees)", "Glaucoma"], steps: ["Stand in Tadasana", "Exhale, hinge from hips", "Bring chest toward thighs", "Let head hang freely", "Fingertips to floor or shins", "Hold 5–10 breaths"], figure: "forwardbend" },

  // SEATED POSES
  { id: 11, name: "Sukhasana", english: "Easy Pose", category: "Seated", level: "Beginner", duration: "5–30 min", benefits: ["Opens hips and groin", "Lengthens spine", "Calms the mind", "Reduces anxiety", "Foundation for meditation"], muscles: ["Hip flexors", "Inner thighs", "Spinal extensors"], contraindications: ["Knee injury", "Hip replacement"], steps: ["Sit on floor or blanket", "Cross legs comfortably", "Place hands on knees (gyan mudra)", "Lengthen spine", "Relax shoulders", "Close eyes, breathe slowly"], figure: "easy" },
  { id: 12, name: "Padmasana", english: "Lotus Pose", category: "Seated", level: "Advanced", duration: "5–30 min", benefits: ["Deep hip opener", "Calms the brain", "Stimulates pelvis and spine", "Keeps joints mobile", "Sacred meditation posture"], muscles: ["Hip external rotators", "Knee ligaments", "Ankles"], contraindications: ["Knee injury", "Ankle injury", "Tight hips"], steps: ["Begin in Sukhasana", "Place right foot on left thigh (half lotus)", "Place left foot on right thigh for full lotus", "Soles of feet face up", "Spine erect, hands in mudra", "Breathe slowly for 5+ minutes"], figure: "lotus" },
  { id: 13, name: "Paschimottanasana", english: "Seated Forward Bend", category: "Seated", level: "Beginner", duration: "30–60 sec", benefits: ["Stretches spine, hamstrings, lower back", "Calms the mind", "Stimulates liver and kidneys", "Improves digestion", "Reduces obesity"], muscles: ["Hamstrings", "Lumbar spine", "Calves"], contraindications: ["Asthma", "Diarrhoea", "Back injury"], steps: ["Sit with legs extended (Dandasana)", "Inhale, extend spine upward", "Exhale, hinge from hips forward", "Reach for feet or use strap", "Lengthen spine on inhale", "Release deeper on exhale"], figure: "seatedforward" },
  { id: 14, name: "Baddha Konasana", english: "Butterfly / Bound Angle", category: "Seated", level: "Beginner", duration: "3–5 min", benefits: ["Opens inner thighs and groin", "Stimulates reproductive organs", "Relieves menstrual cramps", "Helps with childbirth prep", "Stimulates heart and circulation"], muscles: ["Adductors", "Hip flexors", "Inner thighs"], contraindications: ["Groin or knee injury"], steps: ["Sit on floor", "Bend knees, bring soles of feet together", "Hold feet with both hands", "Sit tall, lengthen spine", "Gently flap knees like butterfly wings", "Hold 3–5 minutes, breathe"], figure: "butterfly" },
  { id: 15, name: "Ardha Matsyendrasana", english: "Half Lord of the Fishes", category: "Seated", level: "Intermediate", duration: "30–60 sec each side", benefits: ["Increases spinal rotation", "Stimulates digestive fire", "Energises spine", "Opens shoulders and chest", "Detoxifies organs"], muscles: ["Spinal rotators", "Obliques", "IT band"], contraindications: ["Back injury", "Spinal disc issues"], steps: ["Sit with legs extended", "Bend right knee, place right foot over left leg", "Bend left knee, bring left heel toward right hip", "Twist torso right, place left elbow outside right knee", "Right hand behind you", "Gaze over right shoulder"], figure: "twist" },
  { id: 16, name: "Janu Sirsasana", english: "Head-to-Knee Forward Bend", category: "Seated", level: "Beginner", duration: "30–60 sec each side", benefits: ["Stretches spine, shoulders, hamstrings", "Stimulates liver and kidneys", "Calms the brain", "Relieves anxiety and fatigue", "Therapeutic for high blood pressure"], muscles: ["Hamstrings", "Inner thigh", "Lower back"], contraindications: ["Knee injury", "Diarrhoea"], steps: ["Sit with legs extended", "Bend right knee, place right sole on inner left thigh", "Inhale, extend spine", "Exhale, fold toward extended left leg", "Hold left foot or shin", "5 breaths, switch sides"], figure: "headtoknee" },
  { id: 17, name: "Gomukhasana", english: "Cow Face Pose", category: "Seated", level: "Intermediate", duration: "30–60 sec each side", benefits: ["Deep hip and shoulder opener", "Stretches thighs and ankles", "Opens chest", "Relieves chronic knee and hip pain", "Strengthens spine"], muscles: ["Hip rotators", "Shoulder rotators", "Triceps"], contraindications: ["Knee injury", "Shoulder injury"], steps: ["Sit with legs extended", "Cross right knee over left (knees stacked)", "Raise left arm, bend elbow behind head", "Bring right arm behind back", "Clasp fingers (or use strap)", "Sit tall, breathe 5 times"], figure: "cowface" },
  { id: 18, name: "Dandasana", english: "Staff Pose", category: "Seated", level: "Beginner", duration: "1–5 min", benefits: ["Strengthens back muscles", "Improves posture", "Stretches chest and shoulders", "Tones abdominals", "Foundation for all seated poses"], muscles: ["Core", "Back extensors", "Hamstrings"], contraindications: ["Low back injury (use support)"], steps: ["Sit with legs extended forward", "Flex feet, press thighs down", "Sit up straight, spine perpendicular to floor", "Hands on floor beside hips", "Shoulders back and down", "Hold 1–5 minutes"], figure: "staff" },
  { id: 19, name: "Upavistha Konasana", english: "Wide-Angle Seated Forward Bend", category: "Seated", level: "Intermediate", duration: "1–3 min", benefits: ["Deep inner thigh stretch", "Stimulates abdominal organs", "Strengthens spine", "Opens groins", "Calms the brain"], muscles: ["Inner thighs", "Hamstrings", "Groin"], contraindications: ["Lower back injury"], steps: ["Sit and open legs wide (90–150°)", "Flex feet, engage quadriceps", "Place hands in front", "Walk hands forward as you hinge from hips", "Eventually chest toward floor", "Hold 1–3 minutes"], figure: "wideangleseated" },
  { id: 20, name: "Virasana", english: "Hero Pose", category: "Seated", level: "Beginner", duration: "5–10 min", benefits: ["Stretches thighs and ankles", "Strengthens arches", "Improves digestion", "Relieves leg fatigue", "Calms the mind — great for pranayama"], muscles: ["Quadriceps", "Ankles", "Knees"], contraindications: ["Heart problems (with legs up variation)", "Knee injury"], steps: ["Kneel on floor, knees together", "Separate feet slightly wider than hips", "Lower hips to floor between feet", "Place hands on thighs", "Sit tall, breathe", "Use block if needed"], figure: "hero" },

  // PRONE POSES
  { id: 21, name: "Bhujangasana", english: "Cobra Pose", category: "Prone", level: "Beginner", duration: "15–30 sec", benefits: ["Strengthens spine", "Stretches chest, lungs, shoulders", "Stimulates abdominal organs", "Opens heart and lungs", "Relieves stress and fatigue"], muscles: ["Erector spinae", "Glutes", "Chest"], contraindications: ["Back injury", "Carpal tunnel", "Pregnancy"], steps: ["Lie prone, legs together", "Place hands under shoulders", "Inhale, press into hands, lift chest", "Keep elbows slightly bent", "Roll shoulders back and down", "Hold 15–30 sec, exhale down"], figure: "cobra" },
  { id: 22, name: "Salabhasana", english: "Locust Pose", category: "Prone", level: "Beginner", duration: "30–60 sec", benefits: ["Strengthens entire back body", "Tones buttocks", "Stimulates abdominal organs", "Improves posture", "Reduces stress"], muscles: ["Erector spinae", "Glutes", "Hamstrings", "Shoulders"], contraindications: ["Back injury", "Headache", "Pregnancy"], steps: ["Lie prone, arms alongside body palms down", "Inhale, simultaneously lift head, arms, chest, legs off floor", "Look forward or slightly down", "Reach actively through legs", "Squeeze glutes and inner thighs", "Hold 5 breaths, lower on exhale"], figure: "locust" },
  { id: 23, name: "Dhanurasana", english: "Bow Pose", category: "Prone", level: "Intermediate", duration: "20–30 sec", benefits: ["Opens chest, neck, shoulders", "Stretches entire front of body", "Strengthens back muscles", "Stimulates reproductive organs", "Relieves stress"], muscles: ["Back extensors", "Hip flexors", "Chest", "Quads"], contraindications: ["Low blood pressure", "Migraine", "Insomnia", "Serious lower back/neck injury"], steps: ["Lie prone", "Bend knees, bring heels toward buttocks", "Reach back and hold ankles", "Inhale, lift chest and thighs off floor", "Pull ankles to create bow shape", "Hold 5 breaths"], figure: "bow" },
  { id: 24, name: "Makarasana", english: "Crocodile Pose", category: "Prone", level: "Beginner", duration: "5–10 min", benefits: ["Deep relaxation for back muscles", "Relieves back pain", "Allows spinal decompression", "Calms nervous system", "Excellent counter pose for backbends"], muscles: ["Back muscles (relaxed)", "Neck muscles"], contraindications: ["Pregnancy"], steps: ["Lie prone", "Cross forearms under forehead", "Rest forehead on crossed forearms", "Legs slightly apart, toes pointing out", "Breathe slowly and deeply", "Complete relaxation for 5–10 min"], figure: "crocodile" },
  { id: 25, name: "Salamba Bhujangasana", english: "Sphinx Pose", category: "Prone", level: "Beginner", duration: "1–5 min", benefits: ["Gentle backbend for beginners", "Strengthens spine and glutes", "Stretches chest and shoulders", "Stimulates abdominal organs", "Invigorates the body"], muscles: ["Lower back", "Glutes", "Chest"], contraindications: ["Back injury"], steps: ["Lie prone", "Place forearms on floor, elbows under shoulders", "Press forearms down, lift chest", "Keep hips and thighs on floor", "Roll shoulders back", "Hold 1–5 min with easy breathing"], figure: "sphinx" },
  { id: 26, name: "Ustrasana", english: "Camel Pose", category: "Prone", level: "Intermediate", duration: "30–60 sec", benefits: ["Deep chest and front body opener", "Strengthens back", "Improves posture", "Stimulates thyroid and adrenal glands", "Builds confidence"], muscles: ["Hip flexors", "Chest", "Shoulders", "Back extensors"], contraindications: ["High/low blood pressure", "Migraine", "Insomnia", "Serious neck or back injury"], steps: ["Kneel with knees hip-width apart", "Place hands on lower back", "Gently arch back", "Reach for heels one hand at a time", "Open chest to ceiling", "Tuck chin slightly or release head back"], figure: "camel" },
  { id: 27, name: "Setu Bandha Sarvangasana", english: "Bridge Pose", category: "Supine", level: "Beginner", duration: "30–60 sec", benefits: ["Stretches chest, neck, spine", "Calms the brain", "Reduces anxiety and mild depression", "Strengthens legs and glutes", "Stimulates thyroid"], muscles: ["Glutes", "Hamstrings", "Back extensors", "Core"], contraindications: ["Neck injury"], steps: ["Lie on back, knees bent, feet flat", "Arms alongside body", "Exhale, press feet down", "Lift hips toward ceiling", "Clasp hands under back if comfortable", "Hold 5 breaths"], figure: "bridge" },
  { id: 28, name: "Natarajasana", english: "Dancer's Pose", category: "Standing", level: "Advanced", duration: "20–30 sec each side", benefits: ["Develops balance and concentration", "Stretches shoulders and chest", "Strengthens legs", "Improves posture", "Energises entire body"], muscles: ["Hamstrings", "Hip flexors", "Shoulders", "Core"], contraindications: ["Low blood pressure", "Ankle injury"], steps: ["Stand in Tadasana", "Shift weight to right foot", "Bend left knee, hold left ankle with left hand", "Extend right arm forward", "Lift left leg up and back", "Lean torso slightly forward", "Create the bow shape"], figure: "dancer" },

  // SUPINE POSES
  { id: 29, name: "Savasana", english: "Corpse Pose", category: "Supine", level: "Beginner", duration: "5–20 min", benefits: ["Complete relaxation", "Reduces blood pressure", "Calms nervous system", "Relieves fatigue and mild depression", "Integrates yoga practice"], muscles: ["All muscles (released)"], contraindications: ["Pregnancy (after 1st trimester, elevate upper body)"], steps: ["Lie on back, legs extended", "Feet fall open naturally", "Arms away from body, palms up", "Close eyes", "Release all effort", "Complete stillness for 5–20 min"], figure: "corpse" },
  { id: 30, name: "Halasana", english: "Plow Pose", category: "Supine", level: "Intermediate", duration: "1–5 min", benefits: ["Stretches shoulders and spine", "Calms the brain", "Reduces stress and fatigue", "Stimulates thyroid and prostate glands", "Helps with insomnia"], muscles: ["Hamstrings", "Upper back", "Neck"], contraindications: ["Diarrhoea", "Neck injury", "Asthma", "Menstruation"], steps: ["Lie on back", "Bring legs over head to floor behind", "Support back with hands", "Keep legs straight", "Hold for 1–5 minutes", "Slowly roll out vertebra by vertebra"], figure: "plow" },
  { id: 31, name: "Sarvangasana", english: "Shoulder Stand", category: "Supine", level: "Intermediate", duration: "3–5 min", benefits: ["Queen of asanas", "Regulates thyroid", "Improves circulation", "Calms the brain", "Tones legs and buttocks"], muscles: ["Core", "Upper back", "Neck"], contraindications: ["Neck injury", "High blood pressure", "Menstruation", "Glaucoma"], steps: ["Lie on back", "Lift legs over head (plow first)", "Support back with hands", "Raise legs perpendicular to floor", "Keep weight on shoulders not neck", "Hold 3–5 minutes"], figure: "shoulderstand" },
  { id: 32, name: "Pawanmuktasana", english: "Wind-Relieving Pose", category: "Supine", level: "Beginner", duration: "1–3 min each side", benefits: ["Releases gas from intestines", "Relieves lower back pain", "Massages abdominal organs", "Improves digestion", "Gentle hip stretch"], muscles: ["Glutes", "Lower back", "Hip flexors"], contraindications: ["Pregnancy", "Hernia", "High blood pressure"], steps: ["Lie on back", "Bring right knee to chest", "Clasp hands around shin", "Lift head and nose toward knee", "Hold 1 min, release", "Repeat with left knee, then both"], figure: "windreleasing" },
  { id: 33, name: "Supta Matsyendrasana", english: "Supine Spinal Twist", category: "Supine", level: "Beginner", duration: "1–3 min each side", benefits: ["Releases lower back tension", "Stretches glutes and IT band", "Aids digestion", "Detoxifies organs", "Perfect for end of practice"], muscles: ["Spinal rotators", "Glutes", "IT band", "Chest"], contraindications: ["Hip replacement", "Serious disc issues"], steps: ["Lie on back, both knees bent", "Drop both knees to right side", "Extend arms in T shape", "Gaze left", "Both shoulders flat on floor", "Hold 1–3 min, switch sides"], figure: "supinetwist" },
  { id: 34, name: "Ananda Balasana", english: "Happy Baby Pose", category: "Supine", level: "Beginner", duration: "1–3 min", benefits: ["Gently opens hips and inner thighs", "Releases lower back", "Calms the brain", "Relieves stress and fatigue", "Gently stretches spine"], muscles: ["Inner thighs", "Groin", "Lower back", "Hamstrings"], contraindications: ["Pregnancy", "Knee injury"], steps: ["Lie on back", "Bring knees to chest", "Open knees to armpits", "Hold outsides of feet with hands", "Flex feet, press knees down", "Rock gently side to side"], figure: "happybaby" },
  { id: 35, name: "Viparita Karani", english: "Legs Up the Wall", category: "Supine", level: "Beginner", duration: "5–15 min", benefits: ["Relieves tired legs and feet", "Reduces mild backache", "Calms the mind", "Lowers anxiety", "Improves circulation and lymph drainage"], muscles: ["Hamstrings (gentle)", "Lower back"], contraindications: ["Glaucoma", "Serious neck/back problems"], steps: ["Sit sideways to a wall", "Swing legs up the wall as you lie back", "Hips close to wall, legs vertical", "Arms out to sides, palms up", "Close eyes, breathe", "Hold 5–15 minutes"], figure: "legsupwall" },

  // BALANCING POSES
  { id: 36, name: "Bakasana", english: "Crow Pose", category: "Balance", level: "Intermediate", duration: "10–30 sec", benefits: ["Strengthens wrists, forearms, abdomen", "Opens groins and hip flexors", "Builds focus and courage", "Tones abdominal organs", "Improves balance"], muscles: ["Wrists", "Core", "Hip flexors", "Shoulders"], contraindications: ["Wrist injury", "Carpal tunnel"], steps: ["Squat with feet hip-width", "Place hands on floor shoulder-width", "Lean forward, place knees on backs of upper arms", "Shift weight forward", "Lift feet off floor, squeeze knees to arms", "Find balance, hold 10–30 sec"], figure: "crow" },
  { id: 37, name: "Vasisthasana", english: "Side Plank", category: "Balance", level: "Intermediate", duration: "15–30 sec each side", benefits: ["Strengthens wrists and arms", "Tones entire side body", "Improves balance", "Strengthens core", "Tones legs and buttocks"], muscles: ["Obliques", "Shoulder stabilisers", "Core", "Hip abductors"], contraindications: ["Wrist injury", "Shoulder injury"], steps: ["Start in plank", "Shift weight to right arm", "Stack left foot on right", "Raise left arm to sky", "Create diagonal line from head to feet", "Hold 15–30 sec, switch sides"], figure: "sideplank" },
  { id: 38, name: "Ardha Chandrasana", english: "Half Moon Pose", category: "Balance", level: "Intermediate", duration: "30 sec each side", benefits: ["Strengthens abdomen, ankles, legs", "Stretches hamstrings and calves", "Opens chest and shoulders", "Improves coordination", "Relieves stress"], muscles: ["Glutes", "Hamstrings", "Core", "Hip abductors"], contraindications: ["Headache", "Low blood pressure", "Neck injury"], steps: ["From Triangle, bend front knee", "Place right hand 12 inches in front of right foot", "Lift left leg parallel to floor", "Open hips to the left", "Extend left arm to sky", "Look up, down, or forward"], figure: "halfmoon" },
  { id: 39, name: "Tolasana", english: "Scale / Lifted Lotus", category: "Balance", level: "Advanced", duration: "10–20 sec", benefits: ["Strengthens wrists and arms", "Tones abdominal muscles", "Builds upper body strength", "Develops deep core strength", "Advanced arm balance"], muscles: ["Wrists", "Triceps", "Core", "Hip flexors"], contraindications: ["Wrist injury", "Knee injury (lotus)"], steps: ["Come into Lotus Pose", "Place hands beside hips", "Inhale and press into hands", "Lift entire body off floor", "Hold 10–20 sec", "Lower with control"], figure: "scale" },
  { id: 40, name: "Mayurasana", english: "Peacock Pose", category: "Balance", level: "Advanced", duration: "10–20 sec", benefits: ["Strengthens wrists and forearms", "Tones abdominal organs", "Stimulates digestive system", "Detoxifies the body", "Builds entire body strength"], muscles: ["Wrists", "Core", "Shoulders", "Back"], contraindications: ["Pregnancy", "Wrist/elbow injury", "High blood pressure"], steps: ["Kneel, place hands on floor fingers back", "Place elbows into abdomen", "Lean forward, shift weight", "Extend legs behind", "Hold 10–20 sec"], figure: "peacock" },

  // INVERSIONS
  { id: 41, name: "Adho Mukha Svanasana", english: "Downward-Facing Dog", category: "Inversion", level: "Beginner", duration: "1–3 min", benefits: ["Energises the body", "Stretches shoulders, hamstrings, calves", "Strengthens arms and legs", "Relieves headache and fatigue", "Calms brain and relieves stress"], muscles: ["Hamstrings", "Calves", "Shoulders", "Core", "Arms"], contraindications: ["Carpal tunnel", "Pregnancy (late)", "High blood pressure", "Headache"], steps: ["Start on hands and knees", "Tuck toes, lift knees", "Press hips up and back", "Straighten arms and legs", "Create inverted V shape", "Hold 1–3 minutes, breathe"], figure: "downdog" },
  { id: 42, name: "Sirsasana", english: "Headstand", category: "Inversion", level: "Advanced", duration: "1–5 min", benefits: ["King of asanas", "Calms brain and nervous system", "Relieves stress and mild depression", "Stimulates pituitary and pineal glands", "Strengthens arms and spine"], muscles: ["Shoulders", "Arms", "Core", "Back"], contraindications: ["Neck injury", "Back injury", "High blood pressure", "Menstruation"], steps: ["Clasp hands, place forearms on floor", "Crown of head on floor in clasped hands", "Walk feet in, lift legs up", "Stack hips over shoulders over head", "Hold 1–5 min with practice", "Exit carefully with control"], figure: "headstand" },
  { id: 43, name: "Pincha Mayurasana", english: "Forearm Stand", category: "Inversion", level: "Advanced", duration: "10–30 sec", benefits: ["Strengthens shoulders, arms, core", "Stretches chest and neck", "Improves balance", "Calms brain", "Builds upper body strength"], muscles: ["Shoulders", "Core", "Arms", "Upper back"], contraindications: ["Shoulder/neck injury", "Back injury", "High blood pressure"], steps: ["Place forearms on floor, elbows under shoulders", "Walk feet in until hips above shoulders", "Kick one leg up, then bring both legs up", "Stack hips over shoulders", "Engage core throughout", "Hold 10–30 sec"], figure: "forearmstand" },
  { id: 44, name: "Adho Mukha Vrksasana", english: "Handstand", category: "Inversion", level: "Advanced", duration: "5–30 sec", benefits: ["Full body strength builder", "Improves balance and focus", "Builds confidence", "Strengthens wrists, arms, shoulders", "Stimulates nervous system"], muscles: ["Wrists", "Shoulders", "Core", "All major muscles"], contraindications: ["Wrist injury", "High blood pressure", "Glaucoma", "Heart conditions"], steps: ["Begin in Downward Dog", "Walk hands toward wall", "Kick one leg up to wall, then other", "Stack body vertically", "Engage core, press into fingertips", "Hold 5–30 sec"], figure: "handstand" },

  // RESTORATIVE POSES
  { id: 45, name: "Balasana", english: "Child's Pose", category: "Restorative", level: "Beginner", duration: "1–5 min", benefits: ["Gently stretches hips and thighs", "Relieves back pain", "Calms the brain", "Relieves stress and fatigue", "Rest pose — use anytime during practice"], muscles: ["Hip flexors", "Glutes", "Back extensors"], contraindications: ["Diarrhoea", "Pregnancy", "Knee injury"], steps: ["Kneel, big toes together", "Sit back on heels", "Fold torso forward over thighs", "Extend arms forward or alongside body", "Forehead to mat", "Rest and breathe deeply 1–5 min"], figure: "childs" },
  { id: 46, name: "Matsyasana", english: "Fish Pose", category: "Restorative", level: "Beginner", duration: "30 sec – 1 min", benefits: ["Counter pose for shoulder stand", "Opens chest and throat", "Stretches hip flexors", "Stimulates thyroid and parathyroid", "Tones muscles of belly and neck"], muscles: ["Hip flexors", "Chest", "Neck extensors"], contraindications: ["High/low blood pressure", "Migraine", "Serious neck/lower back injury"], steps: ["Lie on back with legs extended", "Slide hands under buttocks", "Press elbows into floor", "Arch back, lift chest", "Rest crown of head on floor", "Hold 30 sec, counter with forward bend"], figure: "fish" },
  { id: 47, name: "Supta Baddha Konasana", english: "Reclined Butterfly", category: "Restorative", level: "Beginner", duration: "5–20 min", benefits: ["Deep hip and inner thigh release", "Calms the nervous system", "Reduces anxiety", "Excellent for women's health", "Restorative and deeply relaxing"], muscles: ["Inner thighs", "Hip flexors", "Groin"], contraindications: ["Groin/knee injury"], steps: ["Lie on back", "Bring soles of feet together", "Let knees fall to sides", "Support knees with props if needed", "Arms out to sides or on belly", "Close eyes, complete relaxation"], figure: "recliningbutterfly" },
  { id: 48, name: "Yoga Nidra Position", english: "Yoga Sleep Pose", category: "Restorative", level: "Beginner", duration: "20–45 min", benefits: ["Deepest restorative practice", "Equivalent to 4 hours of sleep (30 min session)", "Reprograms subconscious mind", "Reduces trauma and PTSD", "Complete nervous system reset"], muscles: ["All muscles (complete release)"], contraindications: ["Tendency to fall asleep (use seated position)"], steps: ["Lie in Savasana (or seated)", "Set a Sankalpa (intention)", "Systematic body scan from toes to crown", "Follow guided rotation of consciousness", "Stay at threshold between wake and sleep", "30 min = 4 hours deep rest"], figure: "yoganidra" },

  // PRANAYAMA
  { id: 49, name: "Kapalabhati Pranayama", english: "Skull-Shining Breath", category: "Pranayama", level: "Intermediate", duration: "3–5 min", benefits: ["Detoxifies lungs and blood", "Strengthens abdominal muscles", "Clears nasal passages", "Energises and uplifts", "Activates sympathetic nervous system"], muscles: ["Diaphragm", "Abdominals"], contraindications: ["Pregnancy", "Menstruation", "High blood pressure", "Heart conditions"], steps: ["Sit in comfortable position", "Inhale deeply", "Exhale sharply through nose (active)", "Inhalation is passive recoil", "Start with 30 rounds/minute", "Work up to 120 rounds/minute"], figure: "pranayama" },
  { id: 50, name: "Anulom Vilom", english: "Alternate Nostril Breathing", category: "Pranayama", level: "Beginner", duration: "5–10 min", benefits: ["Balances left and right brain hemispheres", "Reduces stress and anxiety", "Purifies nadis (energy channels)", "Improves respiratory health", "Calms the mind instantly"], muscles: ["Respiratory muscles", "Diaphragm"], contraindications: ["Severe respiratory illness"], steps: ["Sit comfortably, spine erect", "Right hand: thumb closes right nostril", "Inhale left 4 counts", "Close both nostrils, hold 16 counts (optional)", "Open right nostril, exhale 8 counts", "Repeat other side — that's 1 round"], figure: "alternatenostril" },
  { id: 51, name: "Bhramari Pranayama", english: "Bee Breath", category: "Pranayama", level: "Beginner", duration: "5–10 min", benefits: ["Immediately calms nervous system", "Relieves anxiety and anger", "Reduces blood pressure", "Enhances concentration", "Soothes migraines and sinuses"], muscles: ["Diaphragm", "Facial muscles"], contraindications: ["Ear infection"], steps: ["Sit comfortably", "Close ears with thumbs", "Place fingers on forehead and eyes", "Inhale deeply", "Exhale making humming sound", "Feel vibration in skull — 5–10 rounds"], figure: "beebreathe" },
]

const CATEGORIES = ['All', 'Standing', 'Seated', 'Prone', 'Supine', 'Balance', 'Inversion', 'Restorative', 'Pranayama']
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced']

/* ------------------------------------------------------------------ */
/* Real demonstration photography (Unsplash CDN)                       */
/* ------------------------------------------------------------------ */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`

// Curated pool of 28 distinct, long-stable Unsplash photos of real humans
// practising yoga / stretching. Every <img> keeps a gradient fallback, so a
// missing photo degrades gracefully.
const PHOTOS: Record<string, string> = {
  p0: U('1544367567-0f2fcb009e0b'),
  p1: U('1506126613408-eca07ce68773'),
  p2: U('1545205597-3d9d02c29597'),
  p3: U('1552196563-55cd4e45efb3'),
  p4: U('1575052814086-f385e2e2ad1b'),
  p5: U('1588286840104-8957b019727f'),
  p6: U('1599901860904-17e6ed7083a0'),
  p7: U('1593811167562-9cef47bfc4d7'),
  p8: U('1573384666979-2ffcf4ac5397'),
  p9: U('1510894347713-fc3ed26fd2e2'),
  p10: U('1562088287-bde35a1ea917'),
  p11: U('1518611012118-696072aa579a'),
  p12: U('1603988363607-e1e4a66962c6'),
  p13: U('1602827114685-efbb2717da9f'),
  p14: U('1544966503-7cc5ac882d5f'),
  p15: U('1573590330099-d6c7355ec595'),
  p16: U('1524863479829-916d8e77f114'),
  p17: U('1571019613454-1cb2f99b2d8b'),
  p18: U('1571019614242-c5c5dee9f50b'),
  p19: U('1552286450-4a669f880062'),
  p20: U('1554344728-77cf90d9ed26'),
  p21: U('1599447421416-3414500d18a5'),
  p22: U('1599447292180-45fd84092ef4'),
  p23: U('1532798442725-41036acc7489'),
  p24: U('1447452001602-7090c7ab2db3'),
  p25: U('1445384763658-0400939829cd'),
  p26: U('1516526995003-435ccce2be97'),
  p27: U('1526401485004-46910ecc8e51'),
  p28: U('1591291621164-2c6367723315'),
  p29: U('1600881333168-2ef49b341f30'),
  p30: U('1601925260368-ae2f83cf8b7f'),
  p31: U('1591258370814-01609b341790'),
  p32: U('1620188467120-5042ed1eb5da'),
  p33: U('1607914660217-754fdd90041d'),
  p34: U('1506629905607-c60f6c3b83f8'),
  p35: U('1550345332-09e3ac987658'),
  p36: U('1518310383802-640c2de311b2'),
  p37: U('1594381898411-846e7d193883'),
  p38: U('1540206395-68808572332f'),
  p39: U('1508050919630-b135e936a37f'),
  p40: U('1600334129128-685c5582fd35'),
  p41: U('1518459031867-a89b944bffe4'),
  p42: U('1549576490-b0b4831ef60a'),
  p43: U('1517637633369-e4cc28755e01'),
  p44: U('1476480862126-209bfaa8edc8'),
  p45: U('1607962837359-5e7e89f86776'),
  p46: U('1517836357463-d25dfeac3438'),
  p47: U('1544216428-729d3c9b71e0'),
  p48: U('1571902943202-507ec2618e8f'),
  p49: U('1518609878373-06d740f60d8b'),
  p50: U('1540479859555-17af45c78602'),
  p51: U('1519758965836-2980f3b0a4b3'),
}

// figure key -> demonstration photo.
// Assigned so that no two poses within the same category share a photo.
const POSE_PHOTOS: Record<string, string> = {
  mountain: PHOTOS.p0,
  tree: PHOTOS.p1,
  warrior1: PHOTOS.p2,
  warrior2: PHOTOS.p3,
  warrior3: PHOTOS.p4,
  triangle: PHOTOS.p5,
  chair: PHOTOS.p6,
  eagle: PHOTOS.p7,
  sideangle: PHOTOS.p8,
  forwardbend: PHOTOS.p9,
  dancer: PHOTOS.p10,
  easy: PHOTOS.p11,
  lotus: PHOTOS.p12,
  seatedforward: PHOTOS.p13,
  butterfly: PHOTOS.p14,
  twist: PHOTOS.p15,
  headtoknee: PHOTOS.p16,
  cowface: PHOTOS.p17,
  staff: PHOTOS.p18,
  wideangleseated: PHOTOS.p19,
  hero: PHOTOS.p20,
  cobra: PHOTOS.p21,
  locust: PHOTOS.p22,
  bow: PHOTOS.p23,
  crocodile: PHOTOS.p24,
  sphinx: PHOTOS.p25,
  camel: PHOTOS.p26,
  bridge: PHOTOS.p27,
  corpse: PHOTOS.p28,
  plow: PHOTOS.p29,
  shoulderstand: PHOTOS.p30,
  windreleasing: PHOTOS.p31,
  supinetwist: PHOTOS.p32,
  happybaby: PHOTOS.p33,
  legsupwall: PHOTOS.p34,
  crow: PHOTOS.p35,
  sideplank: PHOTOS.p36,
  halfmoon: PHOTOS.p37,
  scale: PHOTOS.p38,
  peacock: PHOTOS.p39,
  downdog: PHOTOS.p40,
  headstand: PHOTOS.p41,
  forearmstand: PHOTOS.p42,
  handstand: PHOTOS.p43,
  childs: PHOTOS.p44,
  fish: PHOTOS.p45,
  recliningbutterfly: PHOTOS.p46,
  yoganidra: PHOTOS.p47,
  pranayama: PHOTOS.p48,
  alternatenostril: PHOTOS.p49,
  beebreathe: PHOTOS.p50,
}

/* ------------------------------------------------------------------ */
/* Breathing cues                                                       */
/* ------------------------------------------------------------------ */

const BREATH_BY_CATEGORY: Record<string, string> = {
  Standing: 'Inhale to lengthen the spine, exhale to deepen into the shape. Steady ujjayi breath — 4 counts in, 4 counts out.',
  Seated: 'Slow diaphragmatic breathing. Inhale to grow tall, exhale to soften and release deeper into the pose.',
  Prone: 'Inhale to lift and open the chest, exhale to ground the hips. Never hold the breath in a backbend.',
  Supine: 'Long, quiet exhales — let each out-breath be slightly longer than the in-breath to switch on the parasympathetic system.',
  Balance: 'Fix your gaze (drishti) and keep the breath smooth and shallow-steady. If the breath shakes, the pose shakes.',
  Inversion: 'Calm, even breathing through the nose. Exhale fully to engage the core before lifting.',
  Restorative: 'Effortless natural breath. Count 4 in, 6 out, letting the body grow heavier with every exhale.',
  Pranayama: 'The breath IS the practice — follow the counted rhythm in the steps precisely.',
}

const BREATH_OVERRIDES: Record<string, string> = {
  pranayama: 'Sharp, active exhale from the belly; passive inhale. Rest with natural breath between rounds.',
  alternatenostril: 'Inhale 4 counts through one nostril, exhale 8 counts through the other. Keep the count silky and unforced.',
  beebreathe: 'Deep nasal inhale, then a long humming exhale — feel the vibration behind the eyes and in the skull.',
  cobra: 'Inhale to rise, breathe evenly at the top, exhale to lower with control.',
  downdog: 'Five slow ujjayi breaths, pressing the mat away on each exhale.',
  corpse: 'Release all control of the breath. Simply observe it arriving and leaving.',
}

const breathCue = (pose: Pose) => BREATH_OVERRIDES[pose.figure] ?? BREATH_BY_CATEGORY[pose.category] ?? BREATH_BY_CATEGORY.Seated

/* ------------------------------------------------------------------ */
/* Curated flows                                                        */
/* ------------------------------------------------------------------ */

interface FlowStep { poseId: number; seconds: number }
interface Flow {
  id: string
  name: string
  tagline: string
  level: string
  accent: string
  steps: FlowStep[]
}

const FLOWS: Flow[] = [
  {
    id: 'morning', name: 'Morning Awakening', tagline: 'Wake the spine, fire up circulation and set the tone for the day.',
    level: 'Beginner', accent: '#ea580c',
    steps: [
      { poseId: 1, seconds: 45 }, { poseId: 10, seconds: 45 }, { poseId: 41, seconds: 60 },
      { poseId: 3, seconds: 45 }, { poseId: 4, seconds: 45 }, { poseId: 21, seconds: 30 },
      { poseId: 45, seconds: 60 },
    ],
  },
  {
    id: 'stress', name: 'Stress Relief Evening', tagline: 'Down-shift the nervous system and melt the day away.',
    level: 'Beginner', accent: '#f97316',
    steps: [
      { poseId: 45, seconds: 90 }, { poseId: 14, seconds: 120 }, { poseId: 33, seconds: 90 },
      { poseId: 34, seconds: 90 }, { poseId: 35, seconds: 240 }, { poseId: 29, seconds: 300 },
    ],
  },
  {
    id: 'flex', name: 'Deep Flexibility', tagline: 'Long holds that open hamstrings, hips and the whole back line.',
    level: 'Intermediate', accent: '#fb923c',
    steps: [
      { poseId: 10, seconds: 60 }, { poseId: 13, seconds: 90 }, { poseId: 16, seconds: 60 },
      { poseId: 19, seconds: 120 }, { poseId: 6, seconds: 60 }, { poseId: 17, seconds: 60 },
      { poseId: 47, seconds: 180 },
    ],
  },
  {
    id: 'strength', name: 'Strength & Balance', tagline: 'Warrior lines, arm balances and single-leg control.',
    level: 'Advanced', accent: '#f59e0b',
    steps: [
      { poseId: 7, seconds: 45 }, { poseId: 5, seconds: 30 }, { poseId: 38, seconds: 30 },
      { poseId: 37, seconds: 30 }, { poseId: 36, seconds: 20 }, { poseId: 28, seconds: 30 },
      { poseId: 45, seconds: 60 },
    ],
  },
  {
    id: 'breath', name: 'Breath & Stillness', tagline: 'Pranayama-led reset — the fastest route to a quiet mind.',
    level: 'Beginner', accent: '#059669',
    steps: [
      { poseId: 11, seconds: 120 }, { poseId: 50, seconds: 300 }, { poseId: 51, seconds: 180 },
      { poseId: 48, seconds: 600 },
    ],
  },
]

const fmtTotal = (secs: number) => {
  const m = Math.round(secs / 60)
  return m >= 1 ? `${m} min` : `${secs} sec`
}

/* ------------------------------------------------------------------ */
/* Pose Image — real photo with graceful gradient fallback             */
/* ------------------------------------------------------------------ */

function PoseImage({ figure, alt, className = '' }: { figure: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = POSE_PHOTOS[figure]

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient placeholder — always behind the photo, shown alone if the photo fails */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-[#1e1b4b] to-amber-950" />
      {src && !failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Dark scrim so overlaid text keeps contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0a1e]/85 via-transparent to-transparent" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hold Timer — countdown with animated progress ring                  */
/* ------------------------------------------------------------------ */

const TIMER_PRESETS = [30, 60, 120, 300]

function HoldTimer({ initialSeconds }: { initialSeconds: number }) {
  const [target, setTarget] = useState(initialSeconds)
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { setRunning(false); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  const pick = (s: number) => { setTarget(s); setRemaining(s); setRunning(false) }
  const reset = () => { setRemaining(target); setRunning(false) }

  const done = remaining === 0
  const progress = target > 0 ? (target - remaining) / target : 0
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c] mb-4">Hold Timer</p>
      <div className="flex items-center gap-6">
        {/* Progress ring */}
        <div className="relative h-32 w-32 flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${done ? '#059669' : '#f97316'} 0deg, ${done ? '#059669' : '#fb923c'} ${progress * 360}deg, rgba(247,240,223,0.1) ${progress * 360}deg)`,
              transition: 'background 1s linear',
            }}
          />
          <div className="absolute inset-2 rounded-full bg-[#fffdf9]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black tracking-[-0.04em] tabular-nums ${done ? 'text-emerald-600' : 'text-[#2a1e16]'}`}>
              {done ? 'Om' : `${mm}:${ss}`}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#2a1e16]/62">
              {done ? 'complete' : running ? 'holding' : 'ready'}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TIMER_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => pick(s)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  target === s
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40'
                    : 'bg-black/5 text-[#2a1e16]/62 border border-black/10 hover:text-[#2a1e16]'
                }`}
              >
                {s < 60 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => (done ? reset() : setRunning((r) => !r))}
              className="btn-gloss flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-900/40 hover:from-orange-500 hover:to-amber-500 transition-all"
            >
              {done ? 'Again' : running ? 'Pause' : 'Start Hold'}
            </button>
            <button
              onClick={reset}
              className="rounded-xl border border-black/10 bg-black/5 px-4 py-2.5 text-sm font-semibold text-[#2a1e16]/70 hover:bg-black/10 hover:text-[#2a1e16] transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                       */
/* ------------------------------------------------------------------ */

function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Beginner: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30',
    Intermediate: 'bg-amber-500/20 text-amber-600 border border-amber-500/30',
    Advanced: 'bg-red-500/20 text-red-300 border border-red-500/30',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.2em] ${styles[level] ?? styles.Beginner}`}>
      {level}
    </span>
  )
}

function LockOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#faf4ec]/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600/30 ring-2 ring-orange-500/40">
          <span aria-hidden="true">🔒</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/70">Pro Plan Required</p>
        <button
          onClick={(e) => { e.stopPropagation(); onUpgrade() }}
          className="btn-gloss mt-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-orange-900/40 transition-all duration-200 hover:from-orange-500 hover:to-amber-500"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pose Card                                                            */
/* ------------------------------------------------------------------ */

interface PoseCardProps {
  pose: Pose
  isPracticed: boolean
  locked: boolean
  onClick: () => void
  onUpgrade: () => void
}

function PoseCard({ pose, isPracticed, locked, onClick, onUpgrade }: PoseCardProps) {
  return (
    <div
      className={`group glass-card relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${
        locked ? 'cursor-default' : 'cursor-pointer hover:shadow-xl hover:shadow-orange-900/30 hover:-translate-y-1'
      }`}
      onClick={!locked ? onClick : undefined}
    >
      {isPracticed && !locked && (
        <div className="absolute right-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/30 ring-1 ring-emerald-400/60">
          <span aria-hidden="true">✓</span>
        </div>
      )}

      {/* Real demonstration photo */}
      <div className={locked ? 'blur-sm select-none pointer-events-none' : ''}>
        <PoseImage figure={pose.figure} alt={`${pose.english} (${pose.name}) demonstration`} className="aspect-[4/3] w-full" />
      </div>

      <div className={`flex flex-1 flex-col gap-2 px-4 pb-4 pt-3 ${locked ? 'blur-sm select-none pointer-events-none' : ''}`}>
        <div className="flex items-start justify-between gap-1">
          <div>
            <p className="text-sm font-black tracking-[-0.04em] text-[#ea580c]">{pose.name}</p>
            <p className="text-[11px] text-[#2a1e16]/62 leading-tight">{pose.english}</p>
          </div>
          <LevelBadge level={pose.level} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-500/25">
            {pose.category}
          </span>
          <span className="text-[10px] text-[#2a1e16]/62">{pose.duration}</span>
        </div>

        <ul className="mt-0.5 space-y-0.5">
          {pose.benefits.slice(0, 2).map((b, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[10px] text-[#2a1e16]/62">
              <span className="h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {locked && <LockOverlay onUpgrade={onUpgrade} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detail Modal — photo, instructions, breathing cue, hold timer       */
/* ------------------------------------------------------------------ */

interface DetailModalProps {
  pose: Pose
  isPracticed: boolean
  onTogglePracticed: () => void
  onClose: () => void
}

function DetailModal({ pose, isPracticed, onTogglePracticed, onClose }: DetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${pose.english} details`}>
      <div className="absolute inset-0 bg-[#faf4ec]/80 backdrop-blur-md" />

      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-gold-glow bg-[#0f0a1e] shadow-2xl shadow-orange-900/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-[#2a1e16]/70 transition-colors hover:bg-black/60 hover:text-[#2a1e16]"
        >
          <span aria-hidden="true">✕</span>
        </button>

        {/* Large hero photo */}
        <PoseImage figure={pose.figure} alt={`${pose.english} (${pose.name}) full demonstration`} className="h-64 w-full sm:h-80" />

        {/* Title block overlapping the photo scrim */}
        <div className="relative -mt-20 px-8">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#ea580c]">{pose.name}</h2>
          <p className="text-sm text-[#2a1e16]/70">{pose.english}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LevelBadge level={pose.level} />
            <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-0.5 text-xs font-bold text-orange-600">{pose.category}</span>
            <span className="text-xs text-[#2a1e16]/62">Hold: {pose.duration}</span>
          </div>
        </div>

        <div className="px-8 pb-8 pt-6 space-y-6">
          {/* Hold timer */}
          <HoldTimer initialSeconds={60} />

          {/* Breathing cue */}
          <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-4">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              <span aria-hidden="true">〰️</span>
              Breathing Cue
            </h3>
            <p className="text-sm text-[#2a1e16]/80 leading-relaxed">{breathCue(pose)}</p>
          </section>

          {/* Steps */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Step-by-Step Instructions</h3>
            <ol className="space-y-2">
              {pose.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-600 border border-orange-500/30">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#2a1e16]/80">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Benefits */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Benefits</h3>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {pose.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#2a1e16]/75">
                  <span aria-hidden="true">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          {/* Muscles */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Muscles Engaged</h3>
            <div className="flex flex-wrap gap-2">
              {pose.muscles.map((m, i) => (
                <span key={i} className="rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-600">
                  {m}
                </span>
              ))}
            </div>
          </section>

          {/* Contraindications */}
          {pose.contraindications.length > 0 && pose.contraindications[0] !== '' && (
            <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                <span aria-hidden="true">⚠️</span>
                Contraindications
              </h3>
              <ul className="space-y-1">
                {pose.contraindications.map((c, i) => (
                  <li key={i} className="text-sm text-amber-600/75">{c}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Mark as practiced */}
          <button
            onClick={onTogglePracticed}
            className={`btn-gloss w-full rounded-2xl py-3 text-sm font-bold transition-all duration-200 ${
              isPracticed
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/30'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-900/40 hover:from-orange-500 hover:to-amber-500'
            }`}
          >
            {isPracticed ? 'Practiced — Mark as Incomplete' : 'Mark as Practiced'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Flow Card                                                            */
/* ------------------------------------------------------------------ */

function FlowCard({ flow, onSelectPose }: { flow: Flow; onSelectPose: (p: Pose) => void }) {
  const [open, setOpen] = useState(false)
  const total = flow.steps.reduce((s, st) => s + st.seconds, 0)
  const poses = flow.steps
    .map((st) => ({ step: st, pose: POSES.find((p) => p.id === st.poseId) }))
    .filter((x): x is { step: FlowStep; pose: Pose } => Boolean(x.pose))

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-5 py-4 text-left" aria-expanded={open}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-10 w-1.5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${flow.accent}, transparent)` }} />
            <div className="min-w-0">
              <h3 className="text-base font-black tracking-[-0.04em] text-[#2a1e16] truncate">{flow.name}</h3>
              <p className="text-xs text-[#2a1e16]/62 truncate">{flow.tagline}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="hidden sm:inline"><LevelBadge level={flow.level} /></span>
            <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-bold tabular-nums" style={{ color: flow.accent }}>
              {poses.length} poses · {fmtTotal(total)}
            </span>
            <span aria-hidden="true">▾</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-black/10 px-5 py-4">
          <ol className="space-y-2">
            {poses.map(({ step, pose }, i) => (
              <li key={i}>
                <button
                  onClick={() => onSelectPose(pose)}
                  className="flex w-full items-center gap-3 rounded-xl border border-black/5 bg-black/[0.03] px-3 py-2 text-left transition-all hover:border-orange-500/40 hover:bg-black/[0.06]"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[#faf4ec]" style={{ background: flow.accent }}>
                    {i + 1}
                  </span>
                  <PoseImage figure={pose.figure} alt={`${pose.english} thumbnail`} className="h-10 w-14 flex-shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[#2a1e16]">{pose.english}</span>
                    <span className="block truncate text-[11px] text-[#2a1e16]/62">{pose.name}</span>
                  </span>
                  <span className="flex-shrink-0 text-xs font-bold tabular-nums text-[#ea580c]">{fmtTotal(step.seconds)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Upgrade Modal                                                        */
/* ------------------------------------------------------------------ */

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { openCheckout } = useCheckout()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#faf4ec]/80 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border-gold-glow bg-[#0f0a1e] p-8 shadow-2xl shadow-orange-900/50 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-700 shadow-lg shadow-orange-900/50">
          <span aria-hidden="true">👑</span>
        </div>
        <h2 className="mb-2 text-2xl font-black tracking-[-0.04em] text-[#2a1e16]">Unlock All 52 Poses</h2>
        <p className="mb-6 text-sm text-[#2a1e16]/62">
          Upgrade to The Titan Fitness to access the complete Sacred Asana Library, curated flows, hold timers and guided breathing.
        </p>
        <div className="mb-6 space-y-2">
          {['All 52 Yoga Poses & Pranayama', 'Real photo demonstrations', 'Hold timers & breathing cues', 'Curated flows & sequences', 'Practice tracking & streaks'].map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-orange-500/5 border border-orange-500/15 px-4 py-2">
              <span aria-hidden="true">✓</span>
              <span className="text-sm text-[#2a1e16]/75">{f}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { onClose(); openCheckout('pro') }}
          className="btn-gloss w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-900/40 transition-all hover:from-orange-500 hover:to-amber-500"
        >
          Upgrade to Pro — ₹199/month
        </button>
        <button onClick={onClose} className="mt-3 text-xs text-[#2a1e16]/62 hover:text-[#2a1e16] transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Yoga Page                                                       */
/* ------------------------------------------------------------------ */

export default function YogaPage() {
  const { user } = useAuth()
  const isPro = user?.plan === 'Pro' || user?.plan === 'Elite'

  const [practiced, setPracticed] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('tiger_yoga_practiced')
      return stored ? new Set(JSON.parse(stored) as number[]) : new Set()
    } catch {
      return new Set()
    }
  })

  const [selectedPose, setSelectedPose] = useState<Pose | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [levelFilter, setLevelFilter] = useState('All')
  const [search, setSearch] = useState('')

  const togglePracticed = useCallback((id: number) => {
    setPracticed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem('tiger_yoga_practiced', JSON.stringify([...next])) } catch { /* private mode */ }
      return next
    })
  }, [])

  const filtered = useMemo(() => POSES.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false
    if (levelFilter !== 'All' && p.level !== levelFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.english.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    }
    return true
  }), [categoryFilter, levelFilter, search])

  const practicedCount = practiced.size

  return (
    <div className="min-h-screen bg-[#faf4ec] text-[#2a1e16] font-sans">
      {/* ---- Hero Header ---- */}
      <div
        className="relative px-4 pt-12 pb-8 text-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,88,12,0.18) 0%, transparent 60%)' }}
      >
        {/* Real demonstration hero photo */}
        <img
          src={PHOTOS.p9}
          alt="A person practising yoga at sunrise, flowing through an asana sequence"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#faf4ec]/55 via-[#faf4ec]/70 to-[#faf4ec]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-orange-700/10 blur-3xl" />
          <div className="absolute top-10 left-1/4 h-40 w-40 rounded-full bg-amber-600/10 blur-2xl" />
          <div className="absolute top-10 right-1/4 h-40 w-40 rounded-full bg-orange-500/10 blur-2xl" />
        </div>

        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600/30 to-amber-700/30 border border-orange-500/30 shadow-lg shadow-orange-900/30">
            <span aria-hidden="true">🪷</span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">The Titan Fitness — Yoga Studio</p>
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            <span className="bg-gradient-to-r from-[#ea580c] via-[#2a1e16] to-[#fb923c] bg-clip-text text-transparent">
              Sacred Asana Library
            </span>
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">
            52 Poses &nbsp;•&nbsp; 5 Curated Flows &nbsp;•&nbsp; Ancient Wisdom, Modern Practice
          </p>

          {/* Progress bar */}
          <div className="mx-auto mt-6 max-w-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#2a1e16]/62">Practice Progress</span>
              <span className="text-xs font-bold text-[#ea580c]">{practicedCount} / 52 Mastered</span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-600 via-[#fb923c] to-[#ea580c] transition-all duration-700"
                style={{ width: `${(practicedCount / 52) * 100}%` }}
              />
            </div>
          </div>

          {isPro && (
            <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ea580c]/10 border border-[#ea580c]/30 px-3 py-1">
              <span aria-hidden="true">★</span>
              <span className="text-[11px] font-bold text-[#ea580c]">Pro — Full Library Unlocked</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- How to use this section ---- */}
      <div className="mx-auto max-w-4xl px-4 pb-6 -mt-2">
        <div className="glass-card rounded-2xl p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">How this works — 3 simple steps</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { n: '1', t: 'Choose a pose', d: 'Browse the library or a guided flow. Tap any pose to open its full guide with a real demonstration photo.' },
              { n: '2', t: 'Follow the steps', d: 'Each pose has numbered, one-at-a-time instructions plus breathing cues — just do them in order.' },
              { n: '3', t: 'Hold with the timer', d: 'Start the built-in hold timer, breathe steadily, and mark the pose done to track your progress.' },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-black/8 bg-black/5 p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-sm font-black text-white">{s.n}</div>
                <p className="text-sm font-bold text-[#2a1e16]">{s.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#2a1e16]/68">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Curated Flows ---- */}
      <div className="mx-auto max-w-4xl px-4 pb-2">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Curated Sequences</p>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-[#2a1e16]">Guided Flows</h2>
          </div>
          <p className="text-xs text-[#2a1e16]/62">Tap a flow to see its pose chain</p>
        </div>
        <div className="space-y-3">
          {FLOWS.map((flow) => (
            <FlowCard key={flow.id} flow={flow} onSelectPose={(p) => {
              const locked = !isPro && p.id > 6
              if (locked) setShowUpgrade(true)
              else setSelectedPose(p)
            }} />
          ))}
        </div>
      </div>

      {/* ---- Filters ---- */}
      <div className="sticky top-0 z-30 mt-8 bg-[#faf4ec]/90 backdrop-blur-md border-b border-black/5 px-4 py-3 space-y-3">
        <div className="relative mx-auto max-w-2xl">
          <span aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder="Search poses by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-black/5 border border-black/10 pl-9 pr-4 py-2.5 text-sm text-[#2a1e16] placeholder-[#2a1e16]/62 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a1e16]/62 hover:text-[#2a1e16]">
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-2xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 ${
                categoryFilter === cat
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40'
                  : 'bg-black/5 text-[#2a1e16]/62 border border-black/10 hover:bg-black/10 hover:text-[#2a1e16]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 max-w-2xl mx-auto">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 ${
                levelFilter === lvl
                  ? 'bg-[#ea580c]/20 text-[#ea580c] border border-[#ea580c]/40'
                  : 'bg-black/5 text-[#2a1e16]/62 border border-black/10 hover:bg-black/10 hover:text-[#2a1e16]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Grid ---- */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span aria-hidden="true">🔍</span>
            <p className="text-[#2a1e16]/62 text-sm">No poses match your search.</p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('All'); setLevelFilter('All') }}
              className="mt-3 text-xs text-orange-400 hover:text-orange-600 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-[#2a1e16]/62">Showing {filtered.length} of 52 poses</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((pose) => {
                const locked = !isPro && pose.id > 6
                return (
                  <PoseCard
                    key={pose.id}
                    pose={pose}
                    isPracticed={practiced.has(pose.id)}
                    locked={locked}
                    onClick={() => setSelectedPose(pose)}
                    onUpgrade={() => setShowUpgrade(true)}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {selectedPose && (
        <DetailModal
          pose={selectedPose}
          isPracticed={practiced.has(selectedPose.id)}
          onTogglePracticed={() => togglePracticed(selectedPose.id)}
          onClose={() => setSelectedPose(null)}
        />
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* YogaSection — landing page preview (first 6 poses, no auth needed)  */
/* ------------------------------------------------------------------ */

export function YogaSection() {
  const freePoses = POSES.slice(0, 6)
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null)

  return (
    <section className="bg-[#faf4ec] py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Yoga Library</p>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#2a1e16] sm:text-4xl">
            Sacred{' '}
            <span className="bg-gradient-to-r from-[#ea580c] to-[#fb923c] bg-clip-text text-transparent">
              Asana Library
            </span>
          </h2>
          <p className="mt-3 text-sm text-[#2a1e16]/62 max-w-lg mx-auto">
            52 curated yoga poses with real demonstrations, step-by-step guidance, breathing cues and hold timers.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {freePoses.map((pose) => (
            <div
              key={pose.id}
              onClick={() => setSelectedPose(pose)}
              className="group glass-card flex flex-col items-center gap-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-900/30"
            >
              <PoseImage figure={pose.figure} alt={`${pose.english} demonstration`} className="aspect-square w-full" />
              <div className="px-2 pb-3 text-center">
                <p className="text-xs font-black tracking-[-0.04em] text-[#ea580c] leading-tight">{pose.name}</p>
                <p className="text-[10px] text-[#2a1e16]/62 leading-tight">{pose.english}</p>
                <div className="mt-1.5 flex justify-center"><LevelBadge level={pose.level} /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#2a1e16]/62">
            Showing 6 of 52 poses &nbsp;•&nbsp;{' '}
            <span className="text-orange-600 font-bold">Upgrade to Pro to unlock all</span>
          </p>
        </div>
      </div>

      {selectedPose && (
        <DetailModal
          pose={selectedPose}
          isPracticed={false}
          onTogglePracticed={() => {}}
          onClose={() => setSelectedPose(null)}
        />
      )}
    </section>
  )
}
