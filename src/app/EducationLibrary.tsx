import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Education Library — a premium, in-depth knowledge base spanning     */
/* fitness, nutrition, physiotherapy, yoga, meditation, and Ayurveda. */
/* Each entry opens a full-length in-place reader. No SVG.            */
/* ---------------------------------------------------------------- */

interface Section { heading: string; text: string }
interface Article {
  id: string;
  title: string;
  category: string;
  read: string;
  summary: string;
  intro: string;
  sections: Section[];
  takeaways: string[];
  tag?: "Free" | "Gold" | "Platinum";
}

const ARTICLES: Article[] = [
  /* ===================== TRAINING ===================== */
  {
    id: "progressive-overload", title: "Progressive Overload: The Engine of Every Result", category: "Training", read: "7 min", tag: "Free",
    summary: "The single principle that separates people who progress from people who plateau.",
    intro: "If you remember one training principle for the rest of your life, make it this one. Progressive overload is the gradual increase of stress placed on the body during training, and it is the fundamental driver of every adaptation — bigger muscles, greater strength, better endurance.",
    sections: [
      { heading: "Why it works", text: "Your body is remarkably efficient. It only builds new muscle or strength when the current demand exceeds what it's comfortably capable of. Give it the same workout forever and it has zero biological reason to change. Present a slightly harder challenge, recover, and it rebuilds a little stronger to meet that challenge next time." },
      { heading: "The many ways to overload", text: "Adding weight is the obvious lever, but it's not the only one. You can add reps, add sets, improve your range of motion, slow the lowering phase (tempo), shorten rest periods, or simply perform the same work with cleaner technique. Beginners progress fastest by adding weight; advanced lifters squeeze progress from the subtler variables." },
      { heading: "How fast to progress", text: "On compound lifts, aim to beat your previous session by a single rep or a small load increase (1.25–2.5 kg) each week. On isolation work, progress is slower — chase reps before weight. Trying to add weight every session indefinitely leads to breakdowns in form and stalled progress." },
      { heading: "Track it or lose it", text: "Human memory is a terrible training log. Write down your sets, reps, and loads. Seeing last week's numbers is what turns 'I think I did okay' into a concrete target to beat. This is where a workout journal earns its keep." },
      { heading: "Plateaus and deloads", text: "Progress is never a straight line. When you stall for 2–3 weeks, take a planned deload — a lighter week at ~60% of your usual volume — to let fatigue dissipate. You'll often return stronger. Plateaus are information, not failure." },
    ],
    takeaways: ["Do slightly more over time — weight, reps, sets, range, or tempo", "Beat your last session by a small margin on the main lifts", "Log every workout so you have a target to beat", "Deload every 6–8 weeks to clear accumulated fatigue"],
  },
  {
    id: "training-splits", title: "Choosing a Training Split That Fits Your Life", category: "Training", read: "8 min", tag: "Gold",
    summary: "Full-body, upper/lower, or PPL — the best split is the one you'll actually do.",
    intro: "There is no single 'best' training split. The right structure depends on how many days you can realistically train, your experience, and your goals. Here's how the main options compare and who each one suits.",
    sections: [
      { heading: "Full-body (3 days)", text: "Every session hits the whole body. Because each muscle is trained 3× per week, it's incredibly efficient for beginners and busy people. High frequency means lots of practice on the big lifts, which accelerates skill and strength gains." },
      { heading: "Upper / Lower (4 days)", text: "Two upper-body days and two lower-body days. This gives more volume per muscle group per session while still hitting everything twice a week — an excellent balance of strength and size for intermediates." },
      { heading: "Push / Pull / Legs (5–6 days)", text: "Organizes training by movement pattern: pushing muscles (chest, shoulders, triceps), pulling muscles (back, biceps), and legs. Run once through for 3 days or twice for 6. Popular with intermediate-to-advanced lifters who recover well and enjoy time in the gym." },
      { heading: "Matching split to recovery", text: "More training days only help if you can recover from them. Sleep, nutrition, and life stress cap how much volume you can productively handle. A well-executed 3-day plan beats a 6-day plan you're too fried to complete." },
    ],
    takeaways: ["3 days → full-body; 4 days → upper/lower; 5–6 days → PPL", "Higher frequency helps beginners learn the lifts faster", "Recovery capacity, not enthusiasm, sets your ceiling on volume", "Consistency beats the theoretically optimal program"],
  },
  {
    id: "warmup-injury", title: "Warming Up and Staying Injury-Free", category: "Training", read: "6 min", tag: "Free",
    summary: "A proper warm-up raises performance and slashes injury risk in ten minutes.",
    intro: "Skipping the warm-up to 'save time' is one of the most common — and costly — mistakes in the gym. A good warm-up prepares your nervous system, joints, and muscles to produce force safely.",
    sections: [
      { heading: "General warm-up", text: "Start with 3–5 minutes of light cardio to raise your core temperature and heart rate. Warm muscles are more pliable and contract more efficiently. Follow with dynamic mobility — leg swings, arm circles, hip openers — rather than long static holds, which can temporarily reduce power output before lifting." },
      { heading: "Specific warm-up sets", text: "Before your working weight, perform 2–3 progressively heavier sets of the exact exercise. This grooves the movement pattern and primes the target muscles without accumulating fatigue." },
      { heading: "Listen to warning signs", text: "Sharp, pinching, or joint-line pain is a stop signal — muscle burn is not. Respect the difference. Persistent niggles are best addressed early with mobility work and load management before they become injuries." },
    ],
    takeaways: ["3–5 min light cardio, then dynamic mobility", "Do 2–3 ramp-up sets before your working weight", "Sharp joint pain = stop; muscular effort = continue", "Ten minutes of prep protects months of progress"],
  },
  /* ===================== NUTRITION ===================== */
  {
    id: "protein-complete", title: "Protein: The Complete Practical Guide", category: "Nutrition", read: "9 min", tag: "Free",
    summary: "How much, when, from where, and why protein is the king of body-composition macros.",
    intro: "Of the three macronutrients, protein is the one most people under-eat and the one that matters most for building muscle, recovering from training, and staying full while losing fat. Here's everything you actually need to know.",
    sections: [
      { heading: "How much you need", text: "For anyone training regularly, 1.6–2.2 grams of protein per kilogram of bodyweight per day is the evidence-based range. Someone who weighs 75 kg should target roughly 120–165 g daily. In a fat-loss phase, aim for the higher end to preserve muscle." },
      { heading: "Timing and distribution", text: "Total daily intake matters most, but distribution helps. Spreading protein across 3–4 meals of ~0.4 g/kg each maximizes the muscle-protein-synthesis signal throughout the day, rather than cramming it into one meal." },
      { heading: "Best sources", text: "Prioritize whole foods: eggs, chicken, fish, lean meat, dairy, paneer, Greek yogurt, tofu, tempeh, lentils, and legumes. Animal sources are 'complete' (all essential amino acids); plant eaters should combine sources (e.g. rice + dal) to cover the full amino-acid profile." },
      { heading: "Do you need powder?", text: "No — but it's convenient. Whey and plant protein powders are simply a fast, cheap way to hit your target when whole food isn't practical. Treat them as a supplement to a food-first diet, not a replacement." },
      { heading: "The satiety bonus", text: "Protein is the most filling macronutrient and has the highest thermic effect — your body burns more calories digesting it. This makes a higher-protein diet one of the most reliable tools for effortless appetite control during a cut." },
    ],
    takeaways: ["Target 1.6–2.2 g/kg bodyweight daily", "Spread across 3–4 meals of ~0.4 g/kg", "Food first; powder is optional convenience", "Higher protein keeps you full and preserves muscle when cutting"],
  },
  {
    id: "calories-energy-balance", title: "Energy Balance: Why Calories Still Rule", category: "Nutrition", read: "8 min", tag: "Free",
    summary: "Fat loss and gain come down to one equation — here's how to use it without obsessing.",
    intro: "Every diet that has ever worked — keto, fasting, vegan, carnivore — works for the same underlying reason: it changed your energy balance. Understanding this frees you from diet dogma.",
    sections: [
      { heading: "The core equation", text: "If you consume fewer calories than you burn, you lose weight. More, and you gain. Your total daily energy expenditure (TDEE) is the sum of your basal metabolic rate, the energy to digest food, your daily movement (NEAT), and your exercise." },
      { heading: "Finding your numbers", text: "Estimate your maintenance calories, then adjust based on real-world results over 2–3 weeks. For fat loss, a deficit of 15–20% is sustainable; for muscle gain, a surplus of 10–15%. The scale plus a tape measure tells you if your estimate was right." },
      { heading: "Why 'slow metabolism' is usually NEAT", text: "Non-exercise activity — walking, fidgeting, standing — varies enormously between people and can account for hundreds of calories a day. When you diet, NEAT often drops unconsciously. Keeping a daily step target protects your deficit." },
      { heading: "Quality still matters", text: "Calories determine weight; food quality determines health, energy, and how you feel. A calorie of soda and a calorie of lentils affect satiety, blood sugar, and micronutrients very differently. Balance both." },
    ],
    takeaways: ["Fat loss = calories in < calories out, always", "Set a 15–20% deficit or 10–15% surplus, then adjust to results", "Protect NEAT with a daily step goal while dieting", "Calories drive weight; food quality drives health"],
  },
  {
    id: "micronutrients-gut", title: "Micronutrients, Fiber, and Gut Health", category: "Nutrition", read: "7 min", tag: "Gold",
    summary: "The vitamins, minerals, and fiber that quietly determine how good you feel.",
    intro: "Macros get the attention, but micronutrients and fiber are what keep your body running well day to day. Deficiencies are common and often masquerade as fatigue, poor recovery, or low mood.",
    sections: [
      { heading: "Eat the rainbow", text: "Different coloured fruits and vegetables carry different phytonutrients and vitamins. Aiming for variety across the week naturally covers most micronutrient bases without needing a spreadsheet." },
      { heading: "Fiber's double role", text: "Fiber feeds your gut bacteria and keeps digestion regular. Aim for 25–38 g per day from vegetables, fruit, legumes, and whole grains. A healthy gut microbiome is linked to immunity, mood, and metabolic health." },
      { heading: "Commonly low nutrients", text: "Vitamin D (especially with limited sun), iron (particularly for menstruating women and plant-based eaters), B12 (for vegans), and omega-3s are the most frequent shortfalls. Test before megadosing — more is not always better." },
    ],
    takeaways: ["Variety of coloured produce covers most micros", "Target 25–38 g fiber daily for gut and metabolic health", "Watch vitamin D, iron, B12, and omega-3 intake", "Test levels before supplementing aggressively"],
  },
  /* ===================== PHYSIOTHERAPY ===================== */
  {
    id: "lower-back-pain", title: "Understanding and Managing Lower-Back Pain", category: "Physiotherapy", read: "9 min", tag: "Gold",
    summary: "The most common musculoskeletal complaint — and why movement usually beats rest.",
    intro: "Up to 80% of people experience lower-back pain at some point. The good news: the vast majority is non-specific and mechanical, not dangerous, and responds well to gradual movement rather than bed rest. (Always rule out red flags with a professional.)",
    sections: [
      { heading: "Rest is rarely the answer", text: "Prolonged bed rest was standard advice decades ago and is now known to slow recovery. Gentle, graded movement keeps tissues nourished, reduces fear, and speeds healing. Motion is lotion for most backs." },
      { heading: "Build a resilient core", text: "The core is a cylinder — abs, obliques, deep stabilizers, and the lower back working together. Exercises like the McGill 'big three' (curl-up, side plank, bird-dog) build endurance in these muscles without loading the spine into painful ranges." },
      { heading: "Hips and hamstrings", text: "Stiff hips and tight hamstrings shift load onto the lumbar spine. Regular hip-flexor stretches, glute activation, and hamstring mobility often relieve back symptoms by restoring movement where it belongs." },
      { heading: "Load management and posture", text: "There is no single 'perfect' posture — the best posture is your next one. Vary positions often, hinge at the hips when lifting, and build tolerance to load gradually. A back that is trained to handle load is a back that stops hurting." },
      { heading: "When to seek help", text: "See a professional promptly for pain with numbness, weakness, loss of bladder/bowel control, unexplained weight loss, or pain following significant trauma. These are red flags that need proper assessment." },
    ],
    takeaways: ["Most back pain is mechanical and improves with movement", "Train core endurance (curl-up, side plank, bird-dog)", "Mobilize hips and hamstrings to offload the spine", "Seek care for numbness, weakness, or other red flags"],
  },
  {
    id: "knee-health", title: "Knee Health and Common Overuse Injuries", category: "Physiotherapy", read: "7 min", tag: "Gold",
    summary: "Runner's knee, jumper's knee, and how to keep your knees strong for life.",
    intro: "The knee is a hinge caught between the hip and the ankle, so its problems often start elsewhere. Most non-traumatic knee pain is an overuse or load-management issue that strength and technique can resolve.",
    sections: [
      { heading: "Patellofemoral pain ('runner's knee')", text: "Pain around or behind the kneecap, often from a rapid increase in running or weak hips. Strengthening the glutes and quads and progressing mileage gradually (no more than ~10% per week) usually resolves it." },
      { heading: "Patellar tendinopathy ('jumper's knee')", text: "Pain at the tendon just below the kneecap, common in jumping sports. It responds to progressive loading — slow, heavy resistance exercise — rather than complete rest, which weakens the tendon further." },
      { heading: "Strength is protective", text: "Strong quads, hamstrings, glutes, and calves distribute forces and protect the joint. Contrary to myth, well-executed squats and lunges build knee resilience — pain-free, controlled loading is medicine for knees." },
    ],
    takeaways: ["Most knee pain is overuse, not damage", "Strengthen hips and quads for kneecap pain", "Load tendons progressively — don't just rest them", "Squats and lunges, done well, build knee resilience"],
  },
  {
    id: "posture-desk", title: "Posture, Desk Work, and Undoing Sitting", category: "Physiotherapy", read: "6 min", tag: "Free",
    summary: "Practical fixes for the aches that come from a sedentary, screen-bound day.",
    intro: "Sitting itself isn't evil — sitting still for hours is the problem. The body craves variety of position. Here's how to counter the effects of desk life.",
    sections: [
      { heading: "Move often", text: "The best posture is the one you change frequently. Set a reminder to stand, walk, or stretch every 30–45 minutes. Even one minute of movement resets muscle tension and circulation." },
      { heading: "Set up your workstation", text: "Screen at eye level, elbows around 90°, feet flat, and lower back gently supported. This reduces the neck and shoulder strain that builds over a long day at a poorly arranged desk." },
      { heading: "Counter-stretches", text: "Open the chest and hip flexors, which shorten from sitting. Doorway chest stretches, standing hip-flexor lunges, and thoracic extensions over a chair back are quick, effective daily resets." },
    ],
    takeaways: ["Change position every 30–45 minutes", "Screen at eye level, elbows ~90°, feet flat", "Stretch the chest and hip flexors daily", "Variety of movement beats any single 'correct' posture"],
  },
  /* ===================== YOGA ===================== */
  {
    id: "yoga-beginners", title: "Yoga for Beginners: Foundations and Benefits", category: "Yoga", read: "8 min", tag: "Free",
    summary: "What yoga actually is, its benefits, and how to start without intimidation.",
    intro: "Yoga is far more than stretching — it's a 5,000-year-old system uniting breath, movement, and awareness. Modern research confirms benefits for flexibility, strength, stress, and mental clarity. You don't need to touch your toes to begin.",
    sections: [
      { heading: "The three pillars", text: "Asana (physical postures) build strength and mobility; pranayama (breath control) calms the nervous system; and dhyana (meditation) trains focus. A complete practice touches all three, but starting with gentle asana and breath is perfect." },
      { heading: "Foundational poses", text: "Learn a handful well before chasing advanced shapes: Mountain (Tadasana), Downward Dog (Adho Mukha Svanasana), Warrior I & II, Child's Pose (Balasana), and Cat-Cow. These build the base for almost everything else." },
      { heading: "Breath leads movement", text: "In yoga, the breath sets the pace. Inhale to lengthen or open, exhale to fold or deepen. Linking breath to movement is what transforms stretching into a moving meditation and down-regulates stress." },
      { heading: "Consistency over intensity", text: "Ten minutes daily beats ninety minutes once a week. A short, regular practice steadily improves mobility and builds the habit. Use props (blocks, straps) freely — they make poses accessible, not lesser." },
    ],
    takeaways: ["Yoga unites posture, breath, and awareness", "Master a few foundational poses before advancing", "Let the breath lead every movement", "Short daily practice beats occasional long sessions"],
  },
  {
    id: "yoga-styles", title: "A Guide to the Major Styles of Yoga", category: "Yoga", read: "7 min", tag: "Gold",
    summary: "Hatha, Vinyasa, Ashtanga, Yin, and more — find the style that fits you.",
    intro: "Walk into any studio and you'll meet a bewildering menu of yoga styles. They mostly differ in pace, intensity, and emphasis. Here's a map to choose wisely.",
    sections: [
      { heading: "Hatha", text: "A gentle, slower-paced practice focusing on holding foundational postures and breath. Ideal for beginners and for building a solid base of alignment and awareness." },
      { heading: "Vinyasa & Ashtanga", text: "Vinyasa 'flows' link postures with breath in a dynamic, sometimes vigorous sequence. Ashtanga is a rigorous, fixed sequence of the same poses each time. Both build heat, strength, and cardiovascular fitness." },
      { heading: "Yin & Restorative", text: "Slow, passive styles holding poses for several minutes to target deep connective tissue and the nervous system. Excellent for recovery, flexibility, and stress relief — a perfect complement to intense training." },
      { heading: "Choosing for your goal", text: "Want a workout? Vinyasa or Ashtanga. Want to de-stress and recover? Yin or Restorative. New and unsure? Start with Hatha. Many people blend styles across the week for balance." },
    ],
    takeaways: ["Hatha: gentle foundation, great for beginners", "Vinyasa/Ashtanga: dynamic, strength and cardio", "Yin/Restorative: deep stretch and recovery", "Blend styles to match energy and goals across the week"],
  },
  /* ===================== MEDITATION ===================== */
  {
    id: "meditation-start", title: "Meditation: How to Actually Start (and Stick With It)", category: "Meditation", read: "8 min", tag: "Free",
    summary: "A practical, jargon-free guide to building a meditation habit that lasts.",
    intro: "Meditation is simple but not always easy. It's the practice of training attention and awareness to achieve a calm, stable mental state. The research on its benefits — for stress, focus, sleep, and emotional regulation — is now substantial.",
    sections: [
      { heading: "The basic technique", text: "Sit comfortably, close your eyes, and bring attention to your breath. When your mind wanders — and it will, constantly — gently notice and return to the breath. That noticing and returning IS the meditation. You're not failing when your mind wanders; the return is the rep." },
      { heading: "Start absurdly small", text: "Begin with just 3–5 minutes a day. The goal early on is consistency, not duration. A tiny daily habit compounds; an ambitious plan you abandon in a week does nothing. Attach it to an existing habit, like right after brushing your teeth." },
      { heading: "Common styles", text: "Focused-attention (on the breath), body scan (moving awareness through the body), loving-kindness (cultivating goodwill), and open-awareness (observing whatever arises). Try each and keep what resonates." },
      { heading: "What to expect", text: "You will not empty your mind — no one does. Progress looks like noticing you've wandered sooner, and being a little less reactive in daily life. The benefits accrue quietly over weeks, not in a single dramatic session." },
    ],
    takeaways: ["Focus on the breath; gently return when the mind wanders", "Start with 3–5 minutes and prioritize consistency", "Anchor it to an existing daily habit", "The goal isn't an empty mind — it's a less reactive one"],
  },
  {
    id: "breathwork", title: "Breathwork and the Nervous System", category: "Meditation", read: "6 min", tag: "Gold",
    summary: "Your breath is a remote control for stress — learn to use it deliberately.",
    intro: "Breathing is the only part of the autonomic nervous system you can consciously control, which makes it a direct lever on your stress state. A few minutes of deliberate breathing can shift you from fight-or-flight to rest-and-digest.",
    sections: [
      { heading: "Why slow exhales calm you", text: "Lengthening the exhale relative to the inhale activates the parasympathetic (calming) branch of the nervous system via the vagus nerve. This slows heart rate and lowers stress almost immediately." },
      { heading: "Box breathing", text: "Inhale 4 counts, hold 4, exhale 4, hold 4. Used by athletes and even military personnel to stay calm under pressure. Two or three minutes can noticeably steady the mind before a stressful event." },
      { heading: "The physiological sigh", text: "A double inhale through the nose followed by a long exhale through the mouth. Research suggests it's one of the fastest ways to reduce acute stress and reset your breathing rhythm." },
    ],
    takeaways: ["Longer exhales trigger the body's calming response", "Box breathing (4-4-4-4) steadies you under pressure", "The physiological sigh rapidly lowers acute stress", "Breath is a conscious lever on an unconscious system"],
  },
  /* ===================== AYURVEDA ===================== */
  {
    id: "ayurveda-intro", title: "Ayurveda 101: The Science of Life", category: "Ayurveda", read: "8 min", tag: "Free",
    summary: "An introduction to India's ancient holistic system of health and balance.",
    intro: "Ayurveda — literally 'the science of life' — is a 5,000-year-old system of medicine and lifestyle from India. Its core idea: health is a state of balance between body, mind, and environment, and each person has a unique constitution to work with.",
    sections: [
      { heading: "The three doshas", text: "Ayurveda describes three functional energies: Vata (air/ether — movement), Pitta (fire/water — transformation), and Kapha (earth/water — structure). Everyone has all three in a unique ratio, and imbalance in your dominant dosha is thought to drive illness." },
      { heading: "Agni: the digestive fire", text: "Central to Ayurveda is Agni, the metabolic 'fire' that governs digestion and transformation. Strong Agni means good digestion and vitality; weak Agni leads to 'ama' (toxins) and disease. Eating your largest meal at midday, when Agni peaks, is a classic recommendation." },
      { heading: "Balance through lifestyle", text: "Rather than one-size-fits-all advice, Ayurveda tailors diet, routine, and herbs to your constitution and the season. A Pitta-dominant person in summer is advised to favour cooling foods; a Vata type benefits from warmth and routine." },
      { heading: "Ayurveda and modern life", text: "You don't need to adopt everything to benefit. Simple, evidence-aligned practices — regular routines, mindful eating, warming spices, adequate rest — draw directly from Ayurvedic wisdom and complement modern fitness and nutrition." },
    ],
    takeaways: ["Ayurveda seeks balance of body, mind, and environment", "Three doshas — Vata, Pitta, Kapha — shape your constitution", "Agni (digestive fire) is central; eat your biggest meal at midday", "Adopt simple practices; consult a practitioner for herbs"],
  },
  {
    id: "ayurveda-herbs-deep", title: "Ayurvedic Herbs: A Practical Reference", category: "Ayurveda", read: "9 min", tag: "Gold",
    summary: "The most valued adaptogens and tonics, what tradition says, and safety notes.",
    intro: "Herbs are a cornerstone of Ayurveda. Many have drawn modern scientific interest as adaptogens — substances thought to help the body resist stress. Here's a practical, safety-minded reference. Always consult a qualified professional before use.",
    sections: [
      { heading: "Ashwagandha", text: "A premier adaptogen used to build strength and resilience and to calm the mind. Modern studies associate it with reduced cortisol and improved measures of strength and sleep in some trials. Typically taken as root powder or standardized extract." },
      { heading: "Triphala", text: "A blend of three fruits (Amalaki, Bibhitaki, Haritaki) traditionally used to support digestion, regularity, and gentle detoxification. Often taken at night with warm water." },
      { heading: "Turmeric (Curcumin)", text: "Valued for anti-inflammatory and antioxidant properties. Absorption improves greatly with black pepper and dietary fat — the basis of the traditional golden-milk preparation." },
      { heading: "Brahmi & Shatavari", text: "Brahmi (Bacopa) is traditionally used to support memory and mental clarity. Shatavari is regarded as a female reproductive and hormonal tonic. Both are examples of herbs used for specific systems rather than general vitality." },
      { heading: "Safety first", text: "Natural does not mean risk-free. Herbs can interact with medications, affect pregnancy, and vary in quality between suppliers. Source from reputable brands and consult a doctor or qualified Ayurvedic practitioner — especially alongside prescription drugs." },
    ],
    takeaways: ["Ashwagandha: stress resilience, strength, sleep", "Triphala: digestion and regularity", "Turmeric: anti-inflammatory; pair with pepper and fat", "Always check interactions and source quality before use"],
  },
  /* ===================== MORE TRAINING ===================== */
  {
    id: "hypertrophy-science", title: "The Science of Muscle Growth", category: "Training", read: "8 min", tag: "Gold",
    summary: "What actually makes muscle grow — and how to program for it.",
    intro: "Muscle growth (hypertrophy) isn't mysterious. It's driven by a handful of well-understood factors, and once you know them, you can cut through the endless noise of fitness marketing.",
    sections: [
      { heading: "Mechanical tension is king", text: "The primary driver of hypertrophy is mechanical tension — challenging your muscles with meaningful load through a full range of motion. Lifting close enough to failure that the last few reps are genuinely hard is what signals growth." },
      { heading: "Volume drives results", text: "Weekly volume — roughly the number of hard sets per muscle group — is the biggest programming lever. Most people grow well on 10–20 hard sets per muscle per week, split across 2+ sessions." },
      { heading: "Proximity to failure", text: "You don't need to hit failure every set, but you need to be close — within 1–3 reps of it. Leaving too much in the tank on every set under-stimulates growth." },
      { heading: "Recovery is where growth happens", text: "You don't grow in the gym; you grow while recovering from it. Adequate protein, sleep, and rest days between training the same muscle are non-negotiable for turning training into muscle." },
    ],
    takeaways: ["Mechanical tension near failure drives growth", "Aim for 10–20 hard sets per muscle per week", "Train each muscle 2+ times weekly", "Muscle is built during recovery, not the workout"],
  },
  {
    id: "womens-training", title: "Women and Strength Training: Myths vs Facts", category: "Training", read: "7 min", tag: "Gold",
    summary: "Debunking the fears that keep many women away from the weights they'd benefit from most.",
    intro: "Strength training is one of the most beneficial things a woman can do for her health, body composition, and confidence — yet myths persist. Let's clear them up.",
    sections: [
      { heading: "You won't get 'bulky'", text: "Women have far lower testosterone than men, making large muscle gains slow and deliberate. Lifting weights builds strength, shape, and tone — not accidental bulk. Visible muscle takes years of dedicated effort." },
      { heading: "Strength supports bone health", text: "Resistance training increases bone density, which is especially important for women, who face higher osteoporosis risk with age. It's preventive medicine you can start at any age." },
      { heading: "Training through the cycle", text: "Energy and performance can vary across the menstrual cycle. Many find they're stronger in the first half; it's fine to push hard then and slightly reduce intensity if needed later. Listen to your body rather than forcing every session." },
    ],
    takeaways: ["Lifting builds shape and strength, not unwanted bulk", "Resistance training protects bone density", "Adjust intensity to how you feel across your cycle", "It's beneficial to start at any age"],
  },
  /* ===================== MORE NUTRITION ===================== */
  {
    id: "supplements-worth-it", title: "Supplements: What's Worth Your Money", category: "Nutrition", read: "8 min", tag: "Gold",
    summary: "A no-hype guide to the few supplements with real evidence — and the many without.",
    intro: "The supplement industry is enormous and largely unregulated. The truth is that a handful of products are genuinely useful, and most of the rest are expensive urine. Here's how to tell the difference.",
    sections: [
      { heading: "The proven few", text: "Creatine monohydrate (strength/power), whey or plant protein (convenience for hitting protein targets), vitamin D (if deficient), omega-3 (if low fish intake), and caffeine (performance) have solid evidence behind them." },
      { heading: "Situationally useful", text: "Electrolytes for heavy sweating, magnesium and zinc if deficient, and melatonin for occasional sleep/jetlag. These help specific situations, not everyone." },
      { heading: "Mostly hype", text: "Fat burners, testosterone boosters, BCAAs (redundant if protein is adequate), and most 'proprietary blends' have weak or no evidence. Save your money for quality food." },
      { heading: "Food first, always", text: "No supplement fixes a poor diet. Supplements fill gaps in an already-good nutrition plan — they are the last 5%, not the foundation." },
    ],
    takeaways: ["Creatine, protein, vitamin D, omega-3, caffeine are proven", "Electrolytes/magnesium/zinc help specific cases", "Fat burners and BCAAs are largely hype", "No pill replaces a good diet"],
  },
  {
    id: "hydration-science", title: "Hydration: How Much Water Do You Really Need?", category: "Nutrition", read: "6 min", tag: "Free",
    summary: "Cutting through the '8 glasses' myth with a practical approach to staying hydrated.",
    intro: "Water regulates temperature, lubricates joints, transports nutrients, and supports nearly every bodily function. But the popular rules of thumb are often oversimplified.",
    sections: [
      { heading: "Individual needs vary", text: "A common starting point is around 30–35 ml per kg of bodyweight daily, but real needs depend on climate, activity, and sweat rate. Athletes and those in hot climates need considerably more." },
      { heading: "Read your body", text: "Pale-yellow urine and infrequent thirst are good signs you're well hydrated. Dark urine, headaches, and fatigue can signal you're behind. Don't wait until you're very thirsty to drink." },
      { heading: "Food and electrolytes count", text: "Fruits, vegetables, and other foods contribute significant water. During prolonged sweating, replace electrolytes (especially sodium) — plain water alone can dilute them." },
    ],
    takeaways: ["Roughly 30–35 ml/kg is a starting point, adjust to conditions", "Pale-yellow urine indicates good hydration", "Food contributes to your water intake", "Replace electrolytes during heavy sweating"],
  },
  /* ===================== MORE RECOVERY / WELLNESS ===================== */
  {
    id: "sleep-optimization", title: "Optimizing Sleep for Recovery and Performance", category: "Physiotherapy", read: "8 min", tag: "Gold",
    summary: "Advanced, practical strategies to get deeper, more restorative sleep.",
    intro: "Sleep is the most powerful recovery tool available, and it's free. Beyond just 'get more', here's how to improve sleep quality — where the real magic happens.",
    sections: [
      { heading: "Consistency is the foundation", text: "Going to bed and waking at the same time daily — even weekends — stabilizes your circadian rhythm, making it easier to fall asleep and wake refreshed. Irregular schedules create a permanent mild jet-lag." },
      { heading: "Light is the master signal", text: "Get bright light (ideally sunlight) early in the day to anchor your rhythm, and dim lights and screens in the evening. Blue light at night suppresses melatonin and delays sleep onset." },
      { heading: "Cool, dark, quiet", text: "A slightly cool room (~18°C), blackout darkness, and quiet dramatically improve sleep depth. Your core temperature needs to drop to initiate and maintain deep sleep." },
      { heading: "Mind the stimulants", text: "Caffeine has a long half-life — cut it 8–10 hours before bed. Alcohol may help you fall asleep but wrecks sleep quality later in the night." },
    ],
    takeaways: ["Keep consistent sleep/wake times, even weekends", "Bright light early, dim light at night", "Cool, dark, quiet room for deep sleep", "No caffeine 8–10 hrs before bed; limit alcohol"],
  },
  {
    id: "fat-loss-plateaus", title: "Breaking Through Fat-Loss Plateaus", category: "Nutrition", read: "7 min", tag: "Gold",
    summary: "Why weight loss stalls and the practical levers to get it moving again.",
    intro: "Almost everyone hits a point where the scale stops moving despite doing 'everything right'. Plateaus are normal physiology, not failure — and they're solvable.",
    sections: [
      { heading: "Metabolic adaptation", text: "As you lose weight, you need fewer calories to run a smaller body, and NEAT often drops. The deficit that worked at the start shrinks. Recalculate your intake for your new bodyweight." },
      { heading: "Hidden calories creep in", text: "Portions drift, 'bites and licks' add up, and tracking gets loose. A few days of honest, precise logging often reveals the culprit without any metabolic mystery." },
      { heading: "Diet breaks help", text: "Periodically eating at maintenance for 1–2 weeks can restore hormones, reduce fatigue, and improve adherence — often making the next deficit phase more effective." },
      { heading: "Move more, not just eat less", text: "Rather than cutting calories dangerously low, raising your daily step target restores the deficit while preserving the food that keeps you sane and full." },
    ],
    takeaways: ["Recalculate calories for your new, lighter bodyweight", "Tighten tracking to catch calorie creep", "Use 1–2 week diet breaks at maintenance", "Add steps before cutting calories further"],
  },
  {
    id: "meal-prep", title: "Meal Prep: Making Healthy Eating Automatic", category: "Nutrition", read: "6 min", tag: "Free",
    summary: "The habit that removes willpower from the equation.",
    intro: "The biggest predictor of dietary success isn't knowledge — it's convenience. When healthy food is ready and unhealthy food takes effort, you eat well by default. That's what meal prep buys you.",
    sections: [
      { heading: "Batch the basics", text: "Cook proteins, grains, and roasted vegetables in bulk once or twice a week. Mix and match them into meals rather than cooking every dish from scratch daily." },
      { heading: "Protein is the anchor", text: "Always prep a couple of protein sources — grilled chicken, boiled eggs, paneer, lentils. Having protein ready is what keeps meals balanced when you're busy or tired." },
      { heading: "Make good choices easy", text: "Keep cut vegetables and pre-portioned snacks visible and accessible. Store treats out of sight. Environment design beats willpower every time." },
    ],
    takeaways: ["Batch-cook proteins, grains, and veg in advance", "Always have ready protein on hand", "Design your environment to make good choices easy", "Convenience, not willpower, drives adherence"],
  },
  {
    id: "cardio-vs-weights", title: "Cardio vs Weights: Do You Need Both?", category: "Training", read: "6 min", tag: "Free",
    summary: "How strength and cardio training complement each other for health and physique.",
    intro: "The cardio-versus-weights debate is a false choice. Each trains different systems, and a complete program uses both. Here's how to balance them for your goal.",
    sections: [
      { heading: "What each does", text: "Resistance training builds muscle, strength, and bone density and shapes your physique. Cardio improves heart health, endurance, and calorie burn. Neither fully replaces the other." },
      { heading: "Balancing for fat loss", text: "Strength training preserves muscle in a deficit so you lose fat, not muscle. Add cardio (especially low-intensity) to increase energy expenditure without excessive fatigue." },
      { heading: "Avoiding interference", text: "Doing hard cardio right before heavy lifting can blunt strength. If you do both in one session, lift first, or separate them by hours. For pure strength goals, keep cardio moderate." },
    ],
    takeaways: ["Weights build muscle; cardio builds heart health", "Keep lifting in a deficit to preserve muscle", "Lift before cardio if combining in one session", "A complete program includes both"],
  },
  {
    id: "mobility-guide", title: "Mobility Training for Lifelong Movement", category: "Physiotherapy", read: "7 min", tag: "Gold",
    summary: "Building usable range of motion that protects joints and improves lifts.",
    intro: "Mobility is active control through a full range of motion — not just passive flexibility. It's what keeps you moving well, lifting deep, and injury-free as the years add up.",
    sections: [
      { heading: "Mobility vs flexibility", text: "Flexibility is how far a joint can be moved passively; mobility is how well you can actively control that range. Usable, controlled range is what carries over to training and daily life." },
      { heading: "The four key areas", text: "Hips, thoracic spine, shoulders, and ankles stiffen most from modern sitting. Spending a few minutes daily on each pays outsized dividends in squat depth, overhead position, and pain-free movement." },
      { heading: "Loaded mobility works best", text: "Deep goblet-squat holds, controlled dumbbell pullovers, and end-range strength drills build mobility that sticks — far more than passive stretching alone." },
    ],
    takeaways: ["Mobility = active control, not just flexibility", "Prioritize hips, t-spine, shoulders, ankles", "Use loaded end-range drills, not just stretching", "A few minutes daily compounds over time"],
  },
  {
    id: "stress-management", title: "Managing Stress for Better Health & Results", category: "Meditation", read: "7 min", tag: "Gold",
    summary: "How chronic stress sabotages progress — and evidence-based ways to control it.",
    intro: "You can't out-train or out-diet chronic stress. Persistently elevated stress hormones impair recovery, drive cravings, and disrupt sleep. Managing it is a training variable, not a luxury.",
    sections: [
      { heading: "Understanding cortisol", text: "Cortisol is a normal, useful hormone — problems arise when it stays elevated from unrelenting stress and poor sleep, promoting fat storage and blunting recovery." },
      { heading: "Proven de-stressors", text: "Breathwork, Zone 2 cardio, time in nature, social connection, and adequate sleep all measurably lower stress. Even a daily 10-minute walk outdoors helps." },
      { heading: "Don't stack stressors", text: "A brutal training program on top of a stressful life season is a recipe for burnout. In high-stress periods, pull training volume back rather than pushing harder." },
    ],
    takeaways: ["Chronic stress blunts recovery and drives cravings", "Use breathwork, Zone 2, nature, and connection", "Prioritize sleep as a stress regulator", "Reduce training load during high-stress periods"],
  },
  {
    id: "beginner-gym", title: "Your First 90 Days in the Gym", category: "Training", read: "8 min", tag: "Free",
    summary: "A calm, practical roadmap for anyone starting out and feeling overwhelmed.",
    intro: "The beginning is the highest-leverage time in your training life — and the most intimidating. Here's how to start simply, build momentum, and avoid the mistakes that derail most newcomers.",
    sections: [
      { heading: "Master the basics first", text: "You don't need a fancy program. Learn a handful of fundamental movements — squat, hinge, push, pull, carry — with good form. These patterns cover the whole body and transfer to everything." },
      { heading: "Full-body, three days a week", text: "As a beginner, training the whole body 3× per week drives the fastest progress. You'll get plenty of practice on the lifts and recover well between sessions." },
      { heading: "Start light, add slowly", text: "Ego is the enemy early on. Begin with weights you can control for the prescribed reps, nail the technique, and add small increments over time. Your connective tissue adapts slower than your muscles." },
      { heading: "Consistency beats intensity", text: "The person who trains moderately for a year beats the one who trains brutally for three weeks and quits. Show up, keep it sustainable, and let the compounding do its work." },
    ],
    takeaways: ["Learn squat, hinge, push, pull, carry with good form", "Full-body 3×/week is ideal for beginners", "Start light and progress in small steps", "Consistency over months beats short bursts of intensity"],
  },
  {
    id: "carbs-guide", title: "Carbohydrates: Friend, Not Foe", category: "Nutrition", read: "7 min", tag: "Gold",
    summary: "Cutting through carb fear to understand how they fuel training and life.",
    intro: "Carbs have been demonized by countless diets, but they're your body's preferred energy source and crucial for hard training. The issue is rarely carbs themselves — it's quantity and quality.",
    sections: [
      { heading: "Your primary fuel", text: "Carbohydrates are stored as glycogen in muscles and liver, powering high-intensity exercise. Train hard on too few carbs and performance, mood, and recovery often suffer." },
      { heading: "Quality matters", text: "Prioritize minimally processed carbs — rice, oats, potatoes, fruit, legumes, whole grains. They come with fiber and micronutrients and keep blood sugar steadier than refined sugar." },
      { heading: "Timing around training", text: "Carbs before and after workouts fuel performance and replenish glycogen. This is when your body handles them best. There's nothing magical about avoiding them at night." },
      { heading: "How much you need", text: "Active people generally do well with 3–6 g/kg per day, scaled to training volume. Endurance athletes need more; those in a fat-loss phase somewhat less." },
    ],
    takeaways: ["Carbs are your body's preferred training fuel", "Favor minimally processed, fiber-rich sources", "Time carbs around workouts for performance", "Scale intake (≈3–6 g/kg) to your activity"],
  },
  {
    id: "fats-guide", title: "Dietary Fat: The Essential Macro", category: "Nutrition", read: "6 min", tag: "Gold",
    summary: "Why fat is essential, which types matter, and how much to eat.",
    intro: "Fat was wrongly vilified for decades. It's essential for hormones, brain health, and absorbing fat-soluble vitamins. The key is choosing the right types and the right amount.",
    sections: [
      { heading: "Why you need it", text: "Dietary fat supports hormone production (including testosterone), cell membranes, and the absorption of vitamins A, D, E, and K. Going too low on fat can disrupt hormones." },
      { heading: "The types that matter", text: "Favor unsaturated fats from olive oil, nuts, seeds, avocado, and fatty fish. Include some saturated fat in moderation. Minimize industrial trans fats, which harm heart health." },
      { heading: "How much", text: "Roughly 0.8–1 g/kg of bodyweight per day is a sensible baseline, adjusted to fit your total calories after protein and carbs are set." },
    ],
    takeaways: ["Fat is essential for hormones and vitamin absorption", "Favor unsaturated fats; moderate saturated; avoid trans", "Don't go too low — hormones suffer", "≈0.8–1 g/kg/day is a solid baseline"],
  },
  {
    id: "recovery-methods", title: "Recovery Methods: What Works and What Doesn't", category: "Physiotherapy", read: "7 min", tag: "Gold",
    summary: "An evidence-based look at the recovery tools worth your time.",
    intro: "Recovery is a booming industry full of gadgets and promises. Some tools genuinely help; many are placebo with a price tag. Here's what the evidence actually supports.",
    sections: [
      { heading: "The non-negotiables", text: "Sleep, nutrition, and managing overall training load are by far the most powerful recovery tools — and they're free. No gadget compensates for neglecting these." },
      { heading: "Genuinely useful", text: "Light active recovery (easy walking, mobility), adequate protein, and hydration reliably help. Massage and foam rolling can reduce soreness and feel good, even if effects are modest." },
      { heading: "Overhyped or situational", text: "Ice baths may blunt muscle-building signals if overused right after strength training. Compression gear and fancy devices offer marginal benefits at best. Save your money for sleep and food." },
    ],
    takeaways: ["Sleep, nutrition, and load management matter most", "Active recovery, protein, and hydration reliably help", "Ice baths can blunt gains post-lifting — use judiciously", "Most recovery gadgets are marginal at best"],
  },
  {
    id: "habit-building", title: "The Science of Building Lasting Habits", category: "Meditation", read: "7 min", tag: "Free",
    summary: "How to make healthy behaviors automatic instead of relying on motivation.",
    intro: "Motivation is unreliable — it comes and goes. Lasting change comes from habits: behaviors so automatic they require little willpower. Here's how to engineer them.",
    sections: [
      { heading: "Start absurdly small", text: "Shrink the habit until it's almost too easy — one push-up, two minutes of meditation, a single healthy meal. Tiny habits build the identity and momentum that bigger ones grow from." },
      { heading: "Anchor to existing routines", text: "Attach a new habit to something you already do ('after I brush my teeth, I meditate'). The existing routine becomes the reliable trigger." },
      { heading: "Make it obvious and easy", text: "Design your environment so the good behavior is the path of least resistance — gym clothes laid out, healthy food visible, phone away from the bed. Friction determines behavior more than willpower." },
      { heading: "Don't break the chain twice", text: "Missing once is human; missing twice starts a new (bad) pattern. Aim to never miss two in a row, and forgive the single slip." },
    ],
    takeaways: ["Shrink habits until they're almost too easy", "Anchor new habits to existing routines", "Reduce friction — design your environment", "Never miss twice in a row"],
  },
  {
    id: "form-fundamentals", title: "Lifting Technique: The Big Five Movements", category: "Training", read: "9 min", tag: "Gold",
    summary: "Step-by-step form cues for the squat, hinge, press, pull, and carry.",
    intro: "Almost every effective exercise is a variation of five fundamental patterns. Master these and you can train the whole body safely for life. Here are the key cues for each.",
    sections: [
      { heading: "The Squat", text: "Feet shoulder-width, toes slightly out. Brace your core, break at the hips and knees together, and sit down between your legs. Keep the chest up, knees tracking over the toes, and drive through the whole foot to stand. Descend to at least parallel if mobility allows." },
      { heading: "The Hip Hinge (Deadlift)", text: "Push the hips back with a soft knee bend, keeping a neutral spine (not rounded). Grip the bar, take the slack out, brace hard, and drive the floor away. The bar stays close to the body; finish by squeezing the glutes — don't lean back." },
      { heading: "The Press", text: "Whether overhead or bench, keep the wrists stacked over the elbows, retract the shoulder blades, and brace the core. Press in a controlled path, lock out without shrugging, and lower under control. Never bounce or flare the elbows aggressively." },
      { heading: "The Pull (Row & Pull-up)", text: "Initiate from the back, not the arms — think of pulling the elbows toward your ribs and squeezing the shoulder blades. Control the lowering phase fully. Avoid using momentum to heave the weight." },
      { heading: "The Carry", text: "Pick up a heavy weight, stand tall with braced core and packed shoulders, and walk with control. Loaded carries build grip, core stability, and total-body strength with almost no technique risk." },
    ],
    takeaways: ["Squat: sit between the legs, chest up, drive through the foot", "Hinge: hips back, neutral spine, bar close", "Press: stacked wrists, braced core, controlled path", "Pull from the back; carry tall and braced"],
  },
  {
    id: "eating-out", title: "Eating Out Without Derailing Progress", category: "Nutrition", read: "6 min", tag: "Free",
    summary: "Practical strategies to enjoy restaurants and social meals while staying on track.",
    intro: "Social eating is part of a good life, and no successful long-term approach requires avoiding restaurants. With a few simple strategies, you can enjoy them without guilt or damage.",
    sections: [
      { heading: "Plan ahead", text: "Check the menu before you go and pick a protein-forward option. Deciding while hungry and surrounded by choices leads to impulse orders; deciding in advance keeps you in control." },
      { heading: "Anchor the meal with protein and veg", text: "Build the plate around a lean protein and vegetables, then enjoy some of the indulgent parts. This keeps you full and satisfied without going overboard." },
      { heading: "Manage the extras", text: "Liquid calories (sodas, cocktails) and bottomless bread add up fast and don't fill you. Be intentional: pick the treats you genuinely want rather than mindlessly eating everything offered." },
      { heading: "One meal doesn't matter", text: "A single big meal won't undo weeks of consistency — it's the daily average over time that counts. Enjoy it, then return to your normal routine at the next meal. Guilt helps nothing." },
    ],
    takeaways: ["Check the menu and decide before you're hungry", "Anchor the plate with protein and vegetables", "Be intentional with liquid calories and extras", "One meal won't derail you — the weekly average matters"],
  },
  {
    id: "goal-setting", title: "Setting Fitness Goals That Actually Stick", category: "Meditation", read: "7 min", tag: "Free",
    summary: "How to set goals that motivate you instead of setting you up to quit.",
    intro: "Vague goals like 'get fit' fail because they give you nothing to aim at or measure. Well-constructed goals create direction, motivation, and a way to track progress.",
    sections: [
      { heading: "Make them specific and measurable", text: "'Squat 100 kg', 'run 5 km without stopping', or 'train 3× a week for a month' beat 'get stronger'. A specific target tells you exactly what to do and when you've succeeded." },
      { heading: "Focus on process, not just outcomes", text: "You can't directly control losing 5 kg, but you can control showing up and hitting your protein target. Process goals (the behaviors) reliably produce the outcomes and keep you motivated day to day." },
      { heading: "Set a realistic timeline", text: "Sustainable change is slower than we'd like. Expect months, not weeks. Timelines that are too aggressive breed disappointment and quitting; realistic ones build lasting momentum." },
      { heading: "Track and celebrate progress", text: "Log your workouts and measurements, and acknowledge small wins along the way. Visible progress is one of the most powerful motivators to keep going." },
    ],
    takeaways: ["Make goals specific and measurable", "Prioritize process goals you can control", "Set realistic, patient timelines", "Track progress and celebrate small wins"],
  },
  {
    id: "menstrual-training", title: "Training Around the Menstrual Cycle", category: "Physiotherapy", read: "6 min", tag: "Gold",
    summary: "How hormonal phases can affect training — and how to work with them.",
    intro: "Hormonal fluctuations across the menstrual cycle can influence energy, strength, and recovery. Understanding the phases lets you train smarter and be kinder to yourself.",
    sections: [
      { heading: "The follicular phase", text: "From the start of menstruation to ovulation, rising estrogen often correlates with higher energy and strength for many people. This can be a great window to push intensity and chase progress." },
      { heading: "The luteal phase", text: "After ovulation, some experience higher fatigue, more perceived effort, and increased body temperature. It's fine to slightly reduce intensity, prioritize recovery, and focus on technique during this phase." },
      { heading: "Individual variation is huge", text: "Not everyone experiences strong effects, and symptoms vary widely. The best approach is to track your own patterns over a few cycles and adjust based on how you actually feel, not rigid rules." },
    ],
    takeaways: ["Follicular phase often suits higher intensity", "Luteal phase may call for more recovery focus", "Effects vary enormously between individuals", "Track your own patterns and adjust to how you feel"],
  },
  {
    id: "deload-periodization", title: "Deloads and Periodization Explained", category: "Training", read: "7 min", tag: "Gold",
    summary: "How to structure training over weeks and months so you keep progressing.",
    intro: "Training hard every session forever doesn't work — fatigue accumulates and progress stalls. Periodization is the deliberate structuring of training to manage fatigue and peak at the right time.",
    sections: [
      { heading: "Why deloads matter", text: "A deload is a planned easier week — reduced weight, volume, or both — every 4–8 weeks. It lets accumulated fatigue dissipate so you can come back stronger. Skipping deloads leads to plateaus and burnout." },
      { heading: "Simple periodization models", text: "Linear periodization gradually increases intensity while reducing volume over a block. Undulating periodization varies intensity and volume within the week. Both work; the key is planned variation rather than random effort." },
      { heading: "Autoregulation", text: "Adjust training based on how you feel day to day using tools like RPE. On a great day, push a bit; on a rough one, back off. This keeps training productive across the ups and downs of life." },
      { heading: "Think in blocks", text: "Structure training in 4–8 week blocks with a clear focus (strength, hypertrophy, etc.), each ending in a deload. This gives progress a rhythm and prevents endless grinding." },
    ],
    takeaways: ["Deload every 4–8 weeks to clear fatigue", "Use planned variation, not random effort", "Autoregulate with RPE around daily readiness", "Train in focused blocks ending with a deload"],
  },
  {
    id: "gut-health", title: "Gut Health and the Microbiome", category: "Nutrition", read: "7 min", tag: "Gold",
    summary: "How the trillions of microbes in your gut affect digestion, immunity, and mood.",
    intro: "Your gut houses trillions of bacteria that influence digestion, immunity, and even mood. Nurturing this microbiome is an underrated pillar of health.",
    sections: [
      { heading: "Feed your bacteria fiber", text: "Beneficial gut bacteria thrive on fiber, especially from a diverse range of plants. Aim for 25–38 g of fiber daily and variety — different plants feed different beneficial microbes." },
      { heading: "Fermented foods", text: "Yogurt, kefir, kimchi, sauerkraut, and other fermented foods introduce live beneficial bacteria and can support a healthy microbiome when eaten regularly." },
      { heading: "What harms the gut", text: "Very low-fiber diets, excessive ultra-processed food, and unnecessary antibiotics can reduce microbial diversity. A varied whole-food diet is the foundation of gut health." },
      { heading: "The gut-brain connection", text: "The gut and brain communicate constantly. A healthy microbiome is linked to better mood and stress resilience, which is why gut health is increasingly seen as central to overall wellbeing." },
    ],
    takeaways: ["Eat diverse, fiber-rich plants to feed good bacteria", "Include fermented foods regularly", "Limit ultra-processed food and needless antibiotics", "Gut health influences mood via the gut-brain axis"],
  },
  {
    id: "flexibility-guide", title: "Stretching and Flexibility: What Actually Works", category: "Physiotherapy", read: "6 min", tag: "Free",
    summary: "When and how to stretch for real, lasting flexibility gains.",
    intro: "Stretching is widely misunderstood. Here's a clear, evidence-based look at what improves flexibility and when different types of stretching are useful.",
    sections: [
      { heading: "Dynamic before, static after", text: "Dynamic stretches (controlled movements through range) are ideal before training to prepare the body. Long static holds are better after training or in dedicated sessions, as they can briefly reduce power if done right before lifting." },
      { heading: "Consistency builds range", text: "Flexibility improves with regular practice, not occasional marathon sessions. Holding stretches for 30–60 seconds, several times a week, gradually increases usable range." },
      { heading: "Strengthen through range", text: "Combining stretching with strength work at end ranges (loaded stretching) produces mobility that lasts and transfers to real movement — more effective than passive stretching alone." },
    ],
    takeaways: ["Dynamic stretches before, static holds after", "Hold 30–60s, consistently, several times a week", "Combine stretching with end-range strength", "Regular practice beats occasional long sessions"],
  },
  {
    id: "motivation-discipline", title: "Motivation vs Discipline: What Really Drives Results", category: "Meditation", read: "6 min", tag: "Free",
    summary: "Why relying on motivation fails, and how to build the discipline that lasts.",
    intro: "Everyone starts motivated. The people who succeed long-term are the ones who keep going when motivation fades. Here's how to build that resilience.",
    sections: [
      { heading: "Motivation is fickle", text: "Motivation is an emotion — it naturally rises and falls. Building your entire approach on feeling motivated means you'll stop the moment that feeling disappears, which it always does." },
      { heading: "Discipline is a system", text: "Discipline isn't grit or willpower alone — it's designing your life so the right action happens by default. Scheduled workouts, prepared meals, and removed temptations do the heavy lifting for you." },
      { heading: "Identity drives behavior", text: "The most durable motivation comes from identity: 'I'm the kind of person who trains and eats well.' When a behavior becomes part of who you are, it no longer requires a daily decision." },
    ],
    takeaways: ["Motivation naturally comes and goes", "Build systems so good actions happen by default", "Anchor behaviors to your identity", "Consistency through discipline beats bursts of motivation"],
  },
  {
    id: "beginner-nutrition", title: "Nutrition Basics: A Beginner's Starting Point", category: "Nutrition", read: "7 min", tag: "Free",
    summary: "Skip the fads — the simple foundations that cover 90% of good nutrition.",
    intro: "Nutrition is drowning in conflicting advice, but the fundamentals are simple and boring — which is exactly why they work. Master these before worrying about anything advanced.",
    sections: [
      { heading: "Prioritize protein", text: "Get a source of protein at every meal — eggs, dairy, meat, fish, legumes, tofu. Protein is the macro most people under-eat and the most important for body composition and fullness." },
      { heading: "Eat plenty of plants", text: "Fill half your plate with vegetables and fruit. They provide fiber, vitamins, minerals, and volume that keeps you full on fewer calories." },
      { heading: "Choose quality carbs and fats", text: "Favor minimally processed carbs (rice, oats, potatoes, fruit) and healthy fats (olive oil, nuts, avocado). You don't need to fear either — just choose good sources most of the time." },
      { heading: "The 80/20 approach", text: "Aim to eat well about 80% of the time and leave room to enjoy treats the other 20%. This is sustainable and prevents the all-or-nothing cycle that derails so many people." },
    ],
    takeaways: ["Protein at every meal", "Half your plate vegetables and fruit", "Choose minimally processed carbs and healthy fats", "Eat well 80% of the time, enjoy the other 20%"],
  },
];

const CATEGORIES = ["All", "Training", "Nutrition", "Physiotherapy", "Yoga", "Meditation", "Ayurveda"];
const TAG_COLOR: Record<string, string> = { Free: "#34d399", Gold: "#d8b35a", Platinum: "#e879f9" };
const CAT_ICON: Record<string, string> = { Training: "🏋️", Nutrition: "🥗", Physiotherapy: "🦴", Yoga: "🧘", Meditation: "🧠", Ayurveda: "🌿" };

export default function EducationLibraryPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Article | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => (cat === "All" || a.category === cat) && (!q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)));
  }, [cat, query]);

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-violet-200 hover:text-violet-100">← Back to library</button>
        <article className="glass-card rounded-2xl p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-200">{CAT_ICON[open.category] ?? ""} {open.category}</span>
            <span className="text-[11px] text-[#f7f0df]/55">{open.read} read</span>
            {open.tag && <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${TAG_COLOR[open.tag]}22`, color: TAG_COLOR[open.tag] }}>{open.tag}</span>}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">{open.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-[#f7f0df]/80">{open.intro}</p>
          <div className="mt-6 space-y-5">
            {open.sections.map((s, i) => (
              <div key={i}>
                <h2 className="text-lg font-black text-violet-100">{s.heading}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#f7f0df]/78">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl border border-[#d8b35a]/20 bg-[#d8b35a]/8 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">Key takeaways</p>
            <ul className="mt-3 space-y-2">
              {open.takeaways.map((t, i) => <li key={i} className="flex gap-2 text-sm text-[#f7f0df]/80"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8b35a]" />{t}</li>)}
            </ul>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Education Library</h1>
        <p className="text-sm text-[#f7f0df]/68">In-depth, evidence-based knowledge across fitness, nutrition, physio, yoga, meditation & Ayurveda</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the knowledge base…" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{c === "All" ? c : `${CAT_ICON[c] ?? ""} ${c}`}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((a) => (
          <button key={a.id} type="button" onClick={() => setOpen(a)} className="glass-card rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200/30">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-violet-200">{CAT_ICON[a.category] ?? ""} {a.category}</span>
              <span className="text-[11px] text-[#f7f0df]/55">{a.read}</span>
              {a.tag && <span className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${TAG_COLOR[a.tag]}22`, color: TAG_COLOR[a.tag] }}>{a.tag}</span>}
            </div>
            <h3 className="mt-3 text-lg font-black leading-tight">{a.title}</h3>
            <p className="mt-1.5 text-sm text-[#f7f0df]/62">{a.summary}</p>
            <p className="mt-3 text-xs font-bold text-violet-200">Read article →</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="glass-card rounded-2xl p-8 text-center text-sm text-[#f7f0df]/60">No articles match your search.</p>}
      </div>
    </div>
  );
}
