import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthSystem'

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
  { id: 2, name: "Vrikshasana", english: "Tree Pose", category: "Standing", level: "Beginner", duration: "30–60 sec each side", benefits: ["Improves balance and stability", "Strengthens legs and core", "Opens hips", "Develops concentration", "Calms the mind"], muscles: ["Glutes", "Inner thighs", "Core"], contraindications: ["Vertigo", "High blood pressure (no arms overhead)"], steps: ["Stand in Tadasana", "Shift weight to right foot", "Place left foot on inner right thigh", "Bring palms together at heart", "Raise arms overhead if comfortable", "Hold 30 sec, switch sides"], figure: "tree" },
  { id: 3, name: "Virabhadrasana I", english: "Warrior I", category: "Standing", level: "Beginner", duration: "30–45 sec each side", benefits: ["Builds strength and stamina", "Opens chest and lungs", "Strengthens shoulders, arms, thighs", "Develops focus and balance", "Energises entire body"], muscles: ["Quadriceps", "Hip flexors", "Shoulders"], contraindications: ["High blood pressure", "Heart problems", "Shoulder issues"], steps: ["From Tadasana, step right foot back 4 feet", "Turn right foot out 45°", "Bend left knee to 90°", "Raise arms overhead, palms facing", "Square hips forward", "Hold 5 breaths, switch sides"], figure: "warrior1" },
  { id: 4, name: "Virabhadrasana II", english: "Warrior II", category: "Standing", level: "Beginner", duration: "30–45 sec each side", benefits: ["Strengthens legs and hips", "Opens chest and shoulders", "Increases stamina", "Relieves backache", "Stimulates abdominal organs"], muscles: ["Quadriceps", "Hamstrings", "Hip abductors"], contraindications: ["Neck problems (keep head forward)", "Diarrhoea"], steps: ["Stand with feet 4 feet apart", "Turn right foot out 90°, left foot in 15°", "Bend right knee over right ankle", "Extend arms parallel to floor", "Gaze over right fingertips", "Keep torso perpendicular to floor"], figure: "warrior2" },
  { id: 5, name: "Virabhadrasana III", english: "Warrior III", category: "Standing", level: "Intermediate", duration: "20–30 sec each side", benefits: ["Tones entire body", "Improves balance and posture", "Strengthens ankles and legs", "Tones abdomen", "Develops concentration"], muscles: ["Hamstrings", "Glutes", "Core", "Shoulders"], contraindications: ["High blood pressure"], steps: ["Begin in Warrior I", "Shift weight to front foot", "Lean torso forward", "Lift back leg until parallel to floor", "Extend arms forward or alongside body", "Create one straight line from hands to heel"], figure: "warrior3" },
  { id: 6, name: "Trikonasana", english: "Triangle Pose", category: "Standing", level: "Beginner", duration: "30–60 sec each side", benefits: ["Stretches legs, hips, spine", "Opens chest and shoulders", "Relieves stress and anxiety", "Strengthens thighs", "Improves digestion"], muscles: ["Hamstrings", "IT band", "Obliques", "Thoracic spine"], contraindications: ["Low blood pressure", "Migraine", "Neck injury (don't look up)"], steps: ["Stand with feet 4 feet apart", "Right foot out 90°, left in 15°", "Extend arms to T", "Reach right hand down to shin/floor", "Extend left arm straight up", "Look up at left hand"], figure: "triangle" },
  { id: 7, name: "Utkatasana", english: "Chair Pose", category: "Standing", level: "Beginner", duration: "30–60 sec", benefits: ["Strengthens thighs, ankles, spine", "Stimulates heart and diaphragm", "Reduces flat feet", "Tones digestive organs", "Builds heat in body"], muscles: ["Quadriceps", "Glutes", "Core", "Back extensors"], contraindications: ["Low blood pressure", "Insomnia", "Knee injury"], steps: ["Stand in Tadasana", "Inhale, raise arms overhead", "Exhale, bend knees as if sitting on chair", "Keep knees behind toes", "Torso leans slightly forward", "Hold 5–10 breaths"], figure: "chair" },
  { id: 8, name: "Garudasana", english: "Eagle Pose", category: "Standing", level: "Intermediate", duration: "30 sec each side", benefits: ["Strengthens calves, ankles, thighs", "Stretches shoulders and upper back", "Improves concentration", "Opens hips", "Challenges balance"], muscles: ["Calves", "Hip external rotators", "Shoulders"], contraindications: ["Knee injury"], steps: ["Stand in Tadasana", "Bend knees slightly", "Cross right thigh over left", "Wrap right foot behind left calf", "Cross left arm over right at elbows", "Wrap forearms, lift to eye level"], figure: "eagle" },
  { id: 9, name: "Parsvakonasana", english: "Extended Side Angle", category: "Standing", level: "Beginner", duration: "30–45 sec each side", benefits: ["Strengthens legs and knees", "Stretches groin and spine", "Stimulates abdominal organs", "Increases stamina", "Stretches chest and lungs"], muscles: ["Hip flexors", "Obliques", "Quadriceps"], contraindications: ["High blood pressure", "Insomnia"], steps: ["From Warrior II", "Bring right forearm to right thigh", "Or right hand to floor outside right foot", "Extend left arm overhead in line with body", "Turn gaze up to left arm", "Create straight line from left foot to left hand"], figure: "sideangle" },
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
  { id: 25, name: "Sphinx Pose", english: "Salamba Bhujangasana", category: "Prone", level: "Beginner", duration: "1–5 min", benefits: ["Gentle backbend for beginners", "Strengthens spine and glutes", "Stretches chest and shoulders", "Stimulates abdominal organs", "Invigorates the body"], muscles: ["Lower back", "Glutes", "Chest"], contraindications: ["Back injury"], steps: ["Lie prone", "Place forearms on floor, elbows under shoulders", "Press forearms down, lift chest", "Keep hips and thighs on floor", "Roll shoulders back", "Hold 1–5 min with easy breathing"], figure: "sphinx" },
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
  { id: 52, name: "Shavasana with Yoga Nidra", english: "Conscious Relaxation", category: "Restorative", level: "Beginner", duration: "15–45 min", benefits: ["Complete mind-body restoration", "Integration of all prior asanas", "Deep healing state", "Reduces cortisol by 40%", "Profound stress relief"], muscles: ["All muscles relaxed"], contraindications: ["None — suitable for everyone"], steps: ["Lie flat on back", "Eyes closed, jaw relaxed", "Feet fall naturally open", "Begin with 5 deep breaths", "Scan body from feet to crown", "Allow complete dissolution of effort"], figure: "shavasana" },
]

const CATEGORIES = ['All', 'Standing', 'Seated', 'Prone', 'Supine', 'Balance', 'Inversion', 'Restorative', 'Pranayama']
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced']

/* ------------------------------------------------------------------ */
/* Pose Image (real photos from Unsplash)                              */
/* ------------------------------------------------------------------ */

// Maps each pose figure key → Unsplash search terms so every pose gets
// a relevant, consistently cached photo (source.unsplash.com CDN-caches
// per unique URL).
const POSE_IMAGES: Record<string, string> = {
  mountain:          'yoga,tadasana,mountain-pose,standing',
  tree:              'yoga,tree-pose,vrksasana,one-leg-balance',
  warrior1:          'yoga,warrior-one,virabhadrasana,arms-overhead',
  warrior2:          'yoga,warrior-two,side-lunge,arms-extended',
  warrior3:          'yoga,warrior-three,balance,horizontal-body',
  triangle:          'yoga,triangle-pose,trikonasana,side-stretch',
  chair:             'yoga,chair-pose,utkatasana,squat-yoga',
  eagle:             'yoga,eagle-pose,garudasana,balance-twist',
  sideangle:         'yoga,side-angle,parsvakonasana,lunge',
  forwardbend:       'yoga,forward-fold,uttanasana,hamstring-stretch',
  dancer:            'yoga,dancer-pose,natarajasana,backbend-balance',
  easy:              'yoga,easy-pose,sukhasana,cross-legged',
  lotus:             'yoga,lotus-pose,padmasana,meditation-seated',
  seatedforward:     'yoga,seated-forward-bend,paschimottanasana',
  butterfly:         'yoga,butterfly-pose,baddha-konasana,hip-opener',
  twist:             'yoga,seated-spinal-twist,ardha-matsyendrasana',
  headtoknee:        'yoga,head-to-knee,janu-sirsasana,forward-fold',
  cowface:           'yoga,cow-face-pose,gomukhasana,hip-stretch',
  staff:             'yoga,staff-pose,dandasana,seated-upright',
  wideangleseated:   'yoga,wide-angle-seated,splits,inner-thigh',
  hero:              'yoga,hero-pose,virasana,kneeling',
  cobra:             'yoga,cobra-pose,bhujangasana,backbend',
  locust:            'yoga,locust-pose,salabhasana,back-strengthening',
  bow:               'yoga,bow-pose,dhanurasana,full-backbend',
  crocodile:         'yoga,makarasana,prone-relaxation,rest',
  sphinx:            'yoga,sphinx-pose,gentle-backbend,forearms',
  camel:             'yoga,camel-pose,ustrasana,kneeling-backbend',
  bridge:            'yoga,bridge-pose,setu-bandha,hips-lifted',
  corpse:            'yoga,savasana,corpse-pose,relaxation,lying',
  plow:              'yoga,plow-pose,halasana,legs-over-head',
  shoulderstand:     'yoga,shoulder-stand,sarvangasana,inversion',
  windreleasing:     'yoga,wind-relieving,pawanmuktasana,knee-to-chest',
  supinetwist:       'yoga,supine-twist,spinal-rotation,lying-down',
  happybaby:         'yoga,happy-baby-pose,ananda-balasana,hip-opener',
  legsupwall:        'yoga,legs-up-wall,viparita-karani,restorative',
  yoganidra:         'yoga,yoga-nidra,deep-relaxation,savasana',
  shavasana:         'yoga,shavasana,final-relaxation,body-still',
  fish:              'yoga,fish-pose,matsyasana,chest-opener',
  recliningbutterfly:'yoga,reclining-butterfly,supta-baddha,restorative',
  crow:              'yoga,crow-pose,bakasana,arm-balance',
  sideplank:         'yoga,side-plank,vasisthasana,core-strength',
  halfmoon:          'yoga,half-moon,ardha-chandrasana,one-leg-standing',
  scale:             'yoga,scale-pose,tolasana,arm-balance-lotus',
  peacock:           'yoga,peacock-pose,mayurasana,arm-balance',
  downdog:           'yoga,downward-dog,inverted-v,inversion',
  headstand:         'yoga,headstand,sirsasana,inversion-advanced',
  forearmstand:      'yoga,forearm-stand,pincha-mayurasana,inversion',
  handstand:         'yoga,handstand,adho-mukha-vrksasana,inversion',
  childs:            'yoga,child-pose,balasana,rest,kneeling-fold',
  pranayama:         'yoga,pranayama,breathing,meditation-sitting',
  alternatenostril:  'yoga,alternate-nostril-breathing,anulom-vilom',
  beebreathe:        'yoga,bee-breath,bhramari,pranayama-breathing',
}

interface PoseFigureProps {
  figure: string
  size?: number
}

function PoseFigure({ figure, size = 120 }: PoseFigureProps) {
  const keywords = POSE_IMAGES[figure] ?? 'yoga,asana,pose,practice'
  const imageUrl = `https://source.unsplash.com/featured/400x533/?${encodeURIComponent(keywords)}`
  const height = Math.round(size * 1.33)

  return (
    <div
      style={{ width: size, height, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg,#3b0764,#1e1b4b)', flexShrink: 0 }}
    >
      <img
        src={imageUrl}
        alt={figure.replace(/([a-z])([A-Z])/g, '$1 $2')}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

// ---- dead code below; kept only so TypeScript doesn't complain about imports ----
function _unusedFigureContent(figure: string): null {
  switch (figure) {
      case 'mountain':
        return (
          <>
            <circle cx="60" cy="18" r="12" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,30 Q 60,28 68,30 L 70,80 Q 60,83 50,80 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,35 L 38,65 L 35,75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,35 L 82,65 L 85,75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 54,80 L 50,115 L 48,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 66,80 L 70,115 L 72,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'tree':
        return (
          <>
            <circle cx="60" cy="18" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 53,29 Q 60,27 67,29 L 67,75 Q 60,78 53,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 53,35 L 52,8" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 67,35 L 68,8" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 55,75 L 50,120 L 48,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 65,75 L 52,100 L 48,115" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'warrior1':
        return (
          <>
            <circle cx="60" cy="15" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 53,26 Q 60,24 67,26 L 68,72 Q 60,75 52,72 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 53,30 L 45,5" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 67,30 L 75,5" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 55,72 L 45,100 L 40,140" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 65,72 L 80,110 L 90,140" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'warrior2':
        return (
          <>
            <circle cx="60" cy="18" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 53,29 Q 60,27 67,29 L 67,75 Q 60,78 53,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 53,35 L 20,35" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 67,35 L 100,35" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 55,75 L 35,120 L 25,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 65,75 L 85,120 L 95,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'downdog':
        return (
          <>
            <circle cx="60" cy="55" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 50,62 L 70,62 L 80,30 L 40,30 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 40,30 L 18,55" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 80,30 L 102,55" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 40,30 L 28,70 L 25,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 80,30 L 92,70 L 95,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'childs':
        return (
          <>
            <circle cx="28" cy="120" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 38,112 L 85,100 L 90,80 L 55,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 38,112 L 15,115" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 38,112 L 15,108" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 87,95 L 88,140" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 90,85 L 92,138" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'cobra':
        return (
          <>
            <circle cx="60" cy="35" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 48,46 L 72,46 L 78,90 Q 60,95 42,90 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 48,50 L 30,75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 72,50 L 90,75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 50,90 L 45,130 L 42,155" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,90 L 75,130 L 78,155" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'bridge':
        return (
          <>
            <circle cx="60" cy="145" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 48,132 L 72,132 L 75,105 Q 60,95 45,105 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 48,132 L 30,140" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 72,132 L 90,140" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 50,105 L 45,70 L 42,40" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,105 L 75,70 L 78,40" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'seatedforward':
        return (
          <>
            <circle cx="35" cy="55" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 44,62 L 70,50 L 85,30 Q 78,25 65,28 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 44,62 L 20,75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 44,62 L 18,70" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 72,50 L 80,75 L 85,110" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 78,48 L 86,73 L 90,108" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'lotus':
        return (
          <>
            <circle cx="60" cy="20" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,31 Q 60,29 68,31 L 70,75 Q 60,78 50,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,45 L 40,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,45 L 80,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 54,75 L 30,95 L 20,80" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 66,75 L 90,95 L 100,80" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'warrior3':
        return (
          <>
            <circle cx="30" cy="50" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 40,55 L 80,55 L 80,70 L 40,70 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 40,60 L 10,60" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 40,65 L 10,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,62 L 95,40 L 110,30" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 62,62 L 62,110 L 62,145" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'triangle':
        return (
          <>
            <circle cx="48" cy="30" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 40,40 Q 50,38 58,40 L 60,75 Q 50,78 40,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 40,50 L 25,85" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 58,50 L 85,20" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 42,75 L 25,120 L 15,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 58,75 L 80,120 L 90,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'chair':
        return (
          <>
            <circle cx="60" cy="15" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,26 Q 60,24 68,26 L 66,68 Q 60,72 54,68 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,30 L 46,8" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,30 L 74,8" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 54,68 L 48,110 L 46,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 66,68 L 72,110 L 74,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'eagle':
        return (
          <>
            <circle cx="60" cy="18" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,29 Q 60,27 68,29 L 67,75 Q 60,78 53,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,38 L 68,38 L 68,28 L 52,28" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 60,75 L 55,115 L 53,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 60,75 L 65,115 L 67,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'sideangle':
        return (
          <>
            <circle cx="40" cy="30" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 32,40 Q 42,38 50,40 L 55,80 Q 42,85 32,80 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 32,50 L 25,90" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 50,50 L 90,15" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 35,80 L 20,120 L 12,155" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 52,80 L 80,115 L 95,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'forwardbend':
        return (
          <>
            <circle cx="60" cy="55" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 50,62 Q 60,60 70,62 L 68,95 Q 60,98 52,95 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 50,70 L 35,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,70 L 85,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 52,95 L 48,130 L 46,155" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,95 L 72,130 L 74,155" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'easy':
        return (
          <>
            <circle cx="60" cy="22" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,33 Q 60,31 68,33 L 68,78 Q 60,81 52,78 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,50 L 38,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,50 L 82,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 52,78 L 30,100 L 20,90" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,78 L 90,100 L 100,90" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'butterfly':
        return (
          <>
            <circle cx="60" cy="22" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,33 Q 60,31 68,33 L 68,80 Q 60,83 52,80 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,50 L 40,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,50 L 80,65" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 52,80 L 25,110 L 15,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,80 L 95,110 L 105,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'twist':
        return (
          <>
            <circle cx="60" cy="22" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,33 Q 60,31 70,33 L 72,78 Q 62,83 50,80 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,45 L 35,60" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,45 L 90,40" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 52,80 L 45,120 L 40,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,78 L 80,110 L 85,140" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'corpse':
        return (
          <>
            <circle cx="20" cy="65" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 30,58 L 100,58 L 100,72 L 30,72 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 35,58 L 30,40" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,58 L 75,40" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 90,72 L 92,110 L 88,145" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 100,72 L 105,110 L 102,145" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'crow':
        return (
          <>
            <circle cx="60" cy="28" r="10" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 50,38 Q 60,36 70,38 L 72,75 Q 60,80 48,75 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 48,50 L 30,90 L 25,110" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 72,50 L 90,90 L 95,110" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 50,75 L 38,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 70,75 L 82,100" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      case 'pranayama':
      case 'alternatenostril':
      case 'beebreathe':
        return (
          <>
            <circle cx="60" cy="22" r="11" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,33 Q 60,31 68,33 L 68,80 Q 60,83 52,80 Z" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} stroke="rgba(167,139,250,0.4)" strokeWidth="1" />
            <path d="M 52,45 L 72,38 L 80,28" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,45 L 75,58" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 52,80 L 40,115 L 38,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
            <path d="M 68,80 L 80,115 L 82,150" fill="none" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" filter={`url(#${glowId})`} />
          </>
        )
      default: return null
    }
  return null
}

/* ------------------------------------------------------------------ */
/* Level Badge                                                          */
/* ------------------------------------------------------------------ */

function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Beginner: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    Intermediate: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    Advanced: 'bg-red-500/20 text-red-300 border border-red-500/30',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${styles[level] ?? styles.Beginner}`}>
      {level}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Lock Overlay for Pro-gated Poses                                     */
/* ------------------------------------------------------------------ */

function LockOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#07040d]/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600/30 ring-2 ring-violet-500/40">
          <svg className="h-6 w-6 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-xs font-medium text-[#f7f0df]/70">Pro Plan Required</p>
        <button
          onClick={(e) => { e.stopPropagation(); onUpgrade() }}
          className="mt-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-900/40 transition-all duration-200 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-700/50"
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
  isPro: boolean
  isPracticed: boolean
  locked: boolean
  onClick: () => void
  onUpgrade: () => void
}

function PoseCard({ pose, isPro: _isPro, isPracticed, locked, onClick, onUpgrade }: PoseCardProps) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        locked
          ? 'border-violet-500/10 cursor-default'
          : 'border-violet-500/20 cursor-pointer hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-900/30 hover:-translate-y-1'
      } bg-[#0f0a1e]`}
      onClick={!locked ? onClick : undefined}
    >
      {/* Practiced indicator */}
      {isPracticed && !locked && (
        <div className="absolute right-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/50">
          <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* SVG illustration area */}
      <div className={`relative flex items-center justify-center py-5 ${locked ? 'blur-sm select-none pointer-events-none' : ''}`}
        style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)' }}>
        <PoseFigure figure={pose.figure} size={70} />
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 px-4 pb-4 ${locked ? 'blur-sm select-none pointer-events-none' : ''}`}>
        <div className="flex items-start justify-between gap-1">
          <div>
            <p className="text-xs font-semibold text-[#d8b35a] tracking-wide">{pose.name}</p>
            <p className="text-[11px] text-[#f7f0df]/50 leading-tight">{pose.english}</p>
          </div>
          <LevelBadge level={pose.level} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300 border border-violet-500/20">
            {pose.category}
          </span>
          <span className="text-[10px] text-[#f7f0df]/40">{pose.duration}</span>
        </div>

        <ul className="mt-0.5 space-y-0.5">
          {pose.benefits.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[10px] text-[#f7f0df]/55">
              <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Lock overlay */}
      {locked && <LockOverlay onUpgrade={onUpgrade} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detail Modal                                                         */
/* ------------------------------------------------------------------ */

interface DetailModalProps {
  pose: Pose
  isPracticed: boolean
  onTogglePracticed: () => void
  onClose: () => void
}

function DetailModal({ pose, isPracticed, onTogglePracticed, onClose }: DetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#07040d]/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-violet-500/20 bg-[#0f0a1e] shadow-2xl shadow-violet-900/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#f7f0df]/60 transition-colors hover:bg-white/10 hover:text-[#f7f0df]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div
          className="relative flex flex-col items-center gap-1 px-8 pt-8 pb-6"
          style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.15) 0%, transparent 65%)' }}
        >
          <div className="mb-2">
            <PoseFigure figure={pose.figure} size={100} />
          </div>
          <h2 className="text-2xl font-bold text-[#d8b35a] tracking-wide">{pose.name}</h2>
          <p className="text-sm text-[#f7f0df]/60">{pose.english}</p>
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <LevelBadge level={pose.level} />
            <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-0.5 text-xs text-violet-300">{pose.category}</span>
            <span className="text-xs text-[#f7f0df]/40">{pose.duration}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 space-y-6">
          {/* Steps */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f7f0df]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">1</span>
              Step-by-Step Instructions
            </h3>
            <ol className="space-y-2">
              {pose.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300 border border-violet-500/30">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#f7f0df]/75">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Benefits */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#f7f0df]">Benefits</h3>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {pose.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#f7f0df]/70">
                  <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          {/* Muscles */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#f7f0df]">Muscles Engaged</h3>
            <div className="flex flex-wrap gap-2">
              {pose.muscles.map((m, i) => (
                <span key={i} className="rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-1 text-xs text-violet-300">
                  {m}
                </span>
              ))}
            </div>
          </section>

          {/* Contraindications */}
          {pose.contraindications.length > 0 && pose.contraindications[0] !== '' && (
            <section>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Contraindications
                </h3>
                <ul className="space-y-1">
                  {pose.contraindications.map((c, i) => (
                    <li key={i} className="text-sm text-amber-200/60">{c}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Mark as practiced */}
          <button
            onClick={onTogglePracticed}
            className={`w-full rounded-2xl py-3 text-sm font-semibold transition-all duration-200 ${
              isPracticed
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-purple-500'
            }`}
          >
            {isPracticed ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Practiced — Mark as Incomplete
              </span>
            ) : (
              'Mark as Practiced'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Upgrade Modal                                                        */
/* ------------------------------------------------------------------ */

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#07040d]/80 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-violet-500/30 bg-[#0f0a1e] p-8 shadow-2xl shadow-violet-900/50 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-900/50">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[#f7f0df]">Unlock All 52 Poses</h2>
        <p className="mb-6 text-sm text-[#f7f0df]/55">
          Upgrade to Tiger Fitness Pro to access the complete Sacred Asana Library, personalised sequences, and guided audio.
        </p>
        <div className="mb-6 space-y-2">
          {['All 52 Yoga Poses & Pranayama', 'Step-by-step guided instructions', 'Practice tracking & streaks', 'Custom yoga sequences', 'Audio-guided sessions'].map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-violet-500/5 border border-violet-500/15 px-4 py-2">
              <svg className="h-4 w-4 flex-shrink-0 text-[#d8b35a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-[#f7f0df]/70">{f}</span>
            </div>
          ))}
        </div>
        <button className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition-all hover:from-violet-500 hover:to-purple-500">
          Upgrade to Pro — ₹999/month
        </button>
        <button onClick={onClose} className="mt-3 text-xs text-[#f7f0df]/30 hover:text-[#f7f0df]/60 transition-colors">
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

  const savePracticed = useCallback((next: Set<number>) => {
    setPracticed(next)
    localStorage.setItem('tiger_yoga_practiced', JSON.stringify([...next]))
  }, [])

  const togglePracticed = useCallback((id: number) => {
    setPracticed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('tiger_yoga_practiced', JSON.stringify([...next]))
      return next
    })
  }, [])

  useEffect(() => {
    // keep savePracticed stable – nothing to do here
  }, [savePracticed])

  const filtered = POSES.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false
    if (levelFilter !== 'All' && p.level !== levelFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.english.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    }
    return true
  })

  const practicedCount = practiced.size

  return (
    <div className="min-h-screen bg-[#07040d] text-[#f7f0df] font-sans">
      {/* ---- Hero Header ---- */}
      <div
        className="relative px-4 pt-12 pb-8 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 60%)' }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-violet-700/10 blur-3xl" />
          <div className="absolute top-10 left-1/4 h-40 w-40 rounded-full bg-purple-600/8 blur-2xl" />
          <div className="absolute top-10 right-1/4 h-40 w-40 rounded-full bg-violet-500/8 blur-2xl" />
        </div>

        <div className="relative">
          {/* Lotus icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-700/30 border border-violet-500/30 shadow-lg shadow-violet-900/30">
            <svg className="h-7 w-7 text-violet-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c0 0-4 3-4 7s4 7 4 7 4-3 4-7-4-7-4-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10c0 0-2 2-2 5s3 5 9 5 9-2 9-5-2-5-2-5" />
            </svg>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-[#d8b35a] via-[#f7f0df] to-violet-300 bg-clip-text text-transparent">
              Sacred Asana Library
            </span>
          </h1>
          <p className="mt-2 text-sm text-[#f7f0df]/50 tracking-widest uppercase">
            52 Poses &nbsp;•&nbsp; Ancient Wisdom &nbsp;•&nbsp; Modern Practice
          </p>

          {/* Progress bar */}
          <div className="mx-auto mt-6 max-w-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#f7f0df]/50">Practice Progress</span>
              <span className="text-xs font-semibold text-[#d8b35a]">{practicedCount} / 52 Mastered</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-[#d8b35a] transition-all duration-700"
                style={{ width: `${(practicedCount / 52) * 100}%` }}
              />
            </div>
          </div>

          {/* Pro badge */}
          {isPro && (
            <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#d8b35a]/10 border border-[#d8b35a]/30 px-3 py-1">
              <svg className="h-3.5 w-3.5 text-[#d8b35a]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[11px] font-semibold text-[#d8b35a]">Pro — Full Library Unlocked</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- Filters ---- */}
      <div className="sticky top-0 z-30 bg-[#07040d]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative mx-auto max-w-2xl">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f7f0df]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search poses by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/8 pl-9 pr-4 py-2.5 text-sm text-[#f7f0df] placeholder-[#f7f0df]/25 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f7f0df]/30 hover:text-[#f7f0df]/60">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide max-w-2xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                categoryFilter === cat
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                  : 'bg-white/5 text-[#f7f0df]/50 border border-white/8 hover:bg-white/10 hover:text-[#f7f0df]/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Level pills */}
        <div className="flex gap-1.5 max-w-2xl mx-auto">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                levelFilter === lvl
                  ? 'bg-[#d8b35a]/20 text-[#d8b35a] border border-[#d8b35a]/40'
                  : 'bg-white/5 text-[#f7f0df]/50 border border-white/8 hover:bg-white/10 hover:text-[#f7f0df]/80'
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
            <svg className="mb-4 h-12 w-12 text-violet-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[#f7f0df]/40 text-sm">No poses match your search.</p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('All'); setLevelFilter('All') }}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-[#f7f0df]/35">
              Showing {filtered.length} of 52 poses
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((pose) => {
                const locked = !isPro && pose.id > 6
                return (
                  <PoseCard
                    key={pose.id}
                    pose={pose}
                    isPro={isPro}
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

      {/* ---- Detail Modal ---- */}
      {selectedPose && (
        <DetailModal
          pose={selectedPose}
          isPracticed={practiced.has(selectedPose.id)}
          onTogglePracticed={() => togglePracticed(selectedPose.id)}
          onClose={() => setSelectedPose(null)}
        />
      )}

      {/* ---- Upgrade Modal ---- */}
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
    <section className="bg-[#07040d] py-16 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold tracking-widest text-violet-400 uppercase">Yoga Library</p>
          <h2 className="text-3xl font-black text-[#f7f0df] sm:text-4xl">
            Sacred{' '}
            <span className="bg-gradient-to-r from-[#d8b35a] to-violet-300 bg-clip-text text-transparent">
              Asana Library
            </span>
          </h2>
          <p className="mt-3 text-sm text-[#f7f0df]/50 max-w-lg mx-auto">
            52 curated yoga poses with step-by-step guidance, benefits, and muscle activation. Begin your practice today.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {freePoses.map((pose) => (
            <div
              key={pose.id}
              onClick={() => setSelectedPose(pose)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-violet-500/20 bg-[#0f0a1e] p-4 cursor-pointer transition-all duration-300 hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-900/30"
            >
              <div className="relative" style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }}>
                <PoseFigure figure={pose.figure} size={55} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-[#d8b35a] leading-tight">{pose.name}</p>
                <p className="text-[9px] text-[#f7f0df]/40 leading-tight">{pose.english}</p>
              </div>
              <LevelBadge level={pose.level} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#f7f0df]/40">
            Showing 6 of 52 poses &nbsp;•&nbsp;{' '}
            <span className="text-violet-400">Upgrade to Pro to unlock all</span>
          </p>
        </div>
      </div>

      {/* Quick modal from section */}
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
