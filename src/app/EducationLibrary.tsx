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
