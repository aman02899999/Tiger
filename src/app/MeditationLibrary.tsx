import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Meditation Library — a reference of meditation & breathwork         */
/* techniques with step-by-step guidance, benefits, and ideal use.    */
/* Educational content, client-side. No SVG.                          */
/* ---------------------------------------------------------------- */

interface Technique {
  id: string;
  name: string;
  category: "Focus" | "Breathwork" | "Mindfulness" | "Compassion" | "Sleep";
  icon: string;
  duration: string;
  best: string;
  benefits: string;
  steps: string[];
}

const TECHNIQUES: Technique[] = [
  { id: "breath-focus", name: "Focused Breath Awareness", category: "Focus", icon: "🌬️", duration: "5–15 min", best: "Beginners, building a daily habit",
    benefits: "Trains sustained attention, calms the mind, and lowers baseline stress over time.",
    steps: ["Sit comfortably with a tall but relaxed spine.", "Close the eyes and bring attention to the natural breath.", "Notice the sensation of air at the nostrils or the rise of the belly.", "When the mind wanders, gently label it 'thinking' and return to the breath.", "Repeat — the returning is the practice, not a failure."] },
  { id: "box-breathing", name: "Box Breathing", category: "Breathwork", icon: "🟦", duration: "3–5 min", best: "Before stressful events, steadying nerves",
    benefits: "Rapidly regulates the nervous system and sharpens focus under pressure.",
    steps: ["Exhale fully to empty the lungs.", "Inhale through the nose for a count of 4.", "Hold the breath for 4.", "Exhale for 4, then hold empty for 4.", "Repeat the square for several rounds."] },
  { id: "physiological-sigh", name: "Physiological Sigh", category: "Breathwork", icon: "😮‍💨", duration: "1–3 min", best: "Acute stress, quick reset",
    benefits: "One of the fastest evidence-based ways to reduce acute stress and reset breathing.",
    steps: ["Take a normal inhale through the nose.", "Add a second, shorter inhale to fully inflate the lungs.", "Slowly exhale everything through the mouth.", "Repeat 1–3 times and notice the body settle."] },
  { id: "body-scan", name: "Body Scan", category: "Mindfulness", icon: "🧍", duration: "10–20 min", best: "Releasing tension, pre-sleep",
    benefits: "Builds body awareness, releases held tension, and grounds you in the present.",
    steps: ["Lie down or sit comfortably and close the eyes.", "Bring attention to the toes, noticing any sensation.", "Slowly move awareness up through each part of the body.", "Soften and release tension in each area as you pass through.", "Finish by sensing the whole body breathing as one."] },
  { id: "loving-kindness", name: "Loving-Kindness (Metta)", category: "Compassion", icon: "💗", duration: "10–15 min", best: "Improving mood and relationships",
    benefits: "Cultivates goodwill, reduces self-criticism, and increases positive emotion.",
    steps: ["Sit comfortably and bring to mind someone you care about.", "Silently wish them: 'May you be happy, may you be healthy, may you be at peace.'", "Extend the same wishes to yourself.", "Gradually widen the circle to acquaintances, then all beings.", "Rest in the warmth the phrases generate."] },
  { id: "open-awareness", name: "Open Awareness", category: "Mindfulness", icon: "🌌", duration: "10–20 min", best: "Experienced meditators",
    benefits: "Develops spacious, non-reactive awareness of whatever arises.",
    steps: ["Settle with a few breaths as an anchor.", "Release the single focus and let awareness open.", "Notice sounds, sensations, and thoughts as they come and go.", "Don't chase or push anything away — simply observe.", "If you feel lost, return to the breath, then open again."] },
  { id: "4-7-8", name: "4-7-8 Breathing", category: "Sleep", icon: "🌙", duration: "2–5 min", best: "Falling asleep, winding down",
    benefits: "Lengthens the exhale to activate the body's relaxation response and ease into sleep.",
    steps: ["Exhale completely through the mouth.", "Inhale quietly through the nose for a count of 4.", "Hold the breath for a count of 7.", "Exhale through the mouth for a count of 8.", "Repeat for 4 cycles, letting the body soften."] },
  { id: "mantra", name: "Mantra Meditation", category: "Focus", icon: "🕉️", duration: "10–20 min", best: "Quieting a busy mind",
    benefits: "Gives the mind a simple anchor, easing overthinking and deepening calm.",
    steps: ["Choose a word or sound (e.g. 'so-ham', 'peace', or 'Om').", "Sit comfortably and close the eyes.", "Silently repeat the mantra in rhythm with the breath.", "When the mind drifts, return to the mantra.", "Let the repetition become effortless and settling."] },
  { id: "walking", name: "Walking Meditation", category: "Mindfulness", icon: "🚶", duration: "10–20 min", best: "Restlessness, combining movement and calm",
    benefits: "Brings mindful awareness into motion — ideal if sitting still feels difficult.",
    steps: ["Choose a quiet path of 10–20 steps.", "Walk slowly, noticing the lifting, moving, and placing of each foot.", "Let the sensations of walking be your anchor.", "At the end, pause, turn mindfully, and continue.", "When the mind wanders, return to the feeling of the feet."] },
  { id: "gratitude", name: "Gratitude Reflection", category: "Compassion", icon: "🙏", duration: "5–10 min", best: "Boosting mood, ending the day",
    benefits: "Shifts attention toward the positive, improving mood and life satisfaction over time.",
    steps: ["Sit quietly and take a few settling breaths.", "Bring to mind three things you're genuinely grateful for.", "For each, dwell on why it matters and how it feels.", "Let the warmth of appreciation fill the body.", "Close with a wish to carry that feeling forward."] },
  { id: "visualization", name: "Guided Visualization", category: "Focus", icon: "🏞️", duration: "10–15 min", best: "Relaxation, mental rehearsal",
    benefits: "Uses vivid imagery to relax the body or rehearse a goal, calming and motivating.",
    steps: ["Close the eyes and relax with a few deep breaths.", "Picture a calm, safe place in rich detail — sights, sounds, smells.", "Let yourself fully inhabit the scene.", "Alternatively, vividly rehearse succeeding at a goal.", "Return gently, keeping the calm or confidence with you."] },
  { id: "counting-breath", name: "Counting the Breath", category: "Focus", icon: "🔢", duration: "5–10 min", best: "Beginners, busy minds",
    benefits: "Gives the mind a simple task, making it easier to stay anchored than pure breath-watching.",
    steps: ["Sit comfortably and breathe naturally.", "Silently count 'one' on the first exhale, 'two' on the next, up to ten.", "When you reach ten, start again at one.", "If you lose count, simply return to one without judgment.", "The losing and restarting is part of the training."] },
  { id: "raisin", name: "Mindful Eating", category: "Mindfulness", icon: "🍇", duration: "5 min", best: "Building presence, curbing overeating",
    benefits: "Trains present-moment awareness through the senses and improves your relationship with food.",
    steps: ["Take a single piece of food — a raisin or a nut.", "Observe it closely: color, texture, smell.", "Place it in the mouth without chewing; notice the sensations.", "Chew slowly, paying full attention to taste and texture.", "Notice the urge to rush, and stay present through swallowing."] },
  { id: "progressive-relaxation", name: "Progressive Muscle Relaxation", category: "Sleep", icon: "💆", duration: "10–15 min", best: "Physical tension, pre-sleep",
    benefits: "Systematically releases bodily tension, calming the mind through the body.",
    steps: ["Lie down comfortably and close the eyes.", "Tense the muscles of the feet for 5 seconds, then fully release.", "Move up the body — calves, thighs, abdomen, hands, arms, shoulders, face.", "Tense each area, then let go, noticing the contrast.", "Finish by resting in the whole-body relaxation."] },
  { id: "noting", name: "Noting Meditation", category: "Mindfulness", icon: "🏷️", duration: "10–20 min", best: "Deepening awareness, reducing reactivity",
    benefits: "Builds clear awareness by gently labeling experiences as they arise.",
    steps: ["Settle with the breath as a home base.", "As experiences arise, softly note them: 'thinking', 'hearing', 'feeling'.", "Keep the labels light and quick, then return to the breath.", "Don't analyze — just acknowledge and let go.", "This builds the habit of observing rather than getting swept away."] },
  { id: "alternate-nostril", name: "Alternate Nostril Breathing", category: "Breathwork", icon: "👃", duration: "5–10 min", best: "Balance, calm focus",
    benefits: "A traditional pranayama (Nadi Shodhana) said to balance the mind and calm the nervous system.",
    steps: ["Sit tall and rest the left hand on the knee.", "Close the right nostril with the thumb; inhale through the left.", "Close the left nostril; exhale through the right.", "Inhale through the right, then switch and exhale through the left.", "Continue alternating for several smooth rounds."] },
  { id: "candle-gaze", name: "Candle Gazing (Trataka)", category: "Focus", icon: "🕯️", duration: "5–10 min", best: "Concentration, mental steadiness",
    benefits: "A yogic focus practice using a single point to build concentration and still the mind.",
    steps: ["Place a candle at eye level, an arm's length away, in a dim room.", "Gaze softly at the flame without straining or blinking excessively.", "When the eyes water, close them and hold the after-image in the mind.", "Reopen and return the gaze to the flame.", "Finish by resting with the eyes closed."] },
  { id: "rain", name: "RAIN for Difficult Emotions", category: "Compassion", icon: "🌧️", duration: "10 min", best: "Processing hard feelings",
    benefits: "A structured mindfulness method to meet difficult emotions with awareness and kindness.",
    steps: ["Recognize what you're feeling, naming it honestly.", "Allow the feeling to be present without pushing it away.", "Investigate it with curiosity — where do you feel it in the body?", "Nurture yourself with the compassion you'd offer a friend.", "Rest in the awareness that holds the experience."] },
  { id: "sound-meditation", name: "Sound Meditation", category: "Mindfulness", icon: "🔔", duration: "5–15 min", best: "Grounding, easing into stillness",
    benefits: "Uses ambient sound as the anchor, making it accessible when the breath feels elusive.",
    steps: ["Sit or lie comfortably and close the eyes.", "Let your awareness open to the sounds around you.", "Notice near sounds, far sounds, and the silence between them.", "Don't label or judge — just receive each sound as it arises.", "When the mind wanders into thought, return to simply listening."] },
  { id: "coherent-breathing", name: "Coherent Breathing", category: "Breathwork", icon: "🌊", duration: "5–10 min", best: "Daily calm, heart-rate balance",
    benefits: "Breathing at about five breaths per minute balances the nervous system and heart-rate variability.",
    steps: ["Sit comfortably and breathe through the nose.", "Inhale slowly for a count of about 5–6.", "Exhale smoothly for the same count of 5–6.", "Keep the breath even and effortless — no holding.", "Continue for several minutes, letting the rhythm settle you."] },
  { id: "so-hum", name: "So-Hum Meditation", category: "Focus", icon: "🕉️", duration: "10–15 min", best: "Quieting mental chatter",
    benefits: "Pairs a simple mantra with the breath to naturally deepen focus and stillness.",
    steps: ["Sit comfortably and breathe naturally.", "On the inhale, silently hear the sound 'So'.", "On the exhale, silently hear 'Hum'.", "Let the sounds ride the breath without forcing.", "When the mind drifts, gently return to So-Hum."] },
  { id: "self-compassion", name: "Self-Compassion Break", category: "Compassion", icon: "🤗", duration: "5 min", best: "Moments of stress or self-criticism",
    benefits: "A quick practice to meet hard moments with kindness rather than harsh self-judgment.",
    steps: ["Acknowledge the difficulty: 'This is a moment of struggle.'", "Remember you're not alone: 'Struggle is part of being human.'", "Place a hand on the heart and offer yourself warmth.", "Say: 'May I be kind to myself right now.'", "Take a slow breath and continue with a softer inner tone."] },
  { id: "morning-intention", name: "Morning Intention Setting", category: "Mindfulness", icon: "🌅", duration: "3–5 min", best: "Starting the day with focus",
    benefits: "Grounds your day in a chosen focus, improving clarity and follow-through.",
    steps: ["Sit quietly before the day begins and take a few breaths.", "Ask yourself how you want to show up today.", "Choose a simple intention — 'patient', 'focused', 'grateful'.", "Picture living it out during your day.", "Carry the word with you and return to it when needed."] },
  { id: "yoga-nidra", name: "Yoga Nidra (Yogic Sleep)", category: "Sleep", icon: "🛌", duration: "15–30 min", best: "Deep rest, insomnia relief",
    benefits: "A guided body-and-breath practice inducing deep relaxation while remaining aware — as restful as a nap.",
    steps: ["Lie down comfortably on your back and close the eyes.", "Set a simple intention or resolve.", "Move awareness systematically through each part of the body.", "Notice the natural breath without changing it.", "Rest in the spacious, drifting state between waking and sleep."] },
  { id: "affirmations", name: "Affirmation Meditation", category: "Compassion", icon: "💬", duration: "5–10 min", best: "Building confidence, positive mindset",
    benefits: "Reinforces supportive beliefs, gently reshaping self-talk over time.",
    steps: ["Sit comfortably and take a few settling breaths.", "Choose a few positive, believable statements ('I am capable', 'I am improving').", "Silently or softly repeat each with attention and feeling.", "Let the meaning land rather than rushing.", "Close by resting in the calm the phrases create."] },
  { id: "cold-focus", name: "Focus Reset (Micro-Meditation)", category: "Focus", icon: "⏸️", duration: "1–3 min", best: "Work breaks, regaining focus",
    benefits: "A quick reset to clear mental clutter and return to a task with sharper attention.",
    steps: ["Pause and sit back from what you're doing.", "Take three slow, deliberate breaths.", "Notice any tension and consciously release it.", "Bring to mind the one thing you'll focus on next.", "Return to the task with a single, clear priority."] },
  { id: "compassion-others", name: "Compassion for a Difficult Person", category: "Compassion", icon: "🕊️", duration: "10 min", best: "Easing resentment, improving relationships",
    benefits: "Softens anger and resentment by cultivating understanding toward someone you struggle with.",
    steps: ["Settle with a few breaths and recall a neutral or difficult person.", "Remember they, too, want to be happy and avoid suffering.", "Silently offer: 'May you be well, may you be at peace.'", "Notice any resistance without forcing the feeling.", "Return to your own breath, carrying a little more openness."] },
  { id: "bhramari", name: "Bhramari (Humming Bee Breath)", category: "Breathwork", icon: "🐝", duration: "3–5 min", best: "Quick calm, easing anxiety",
    benefits: "The gentle humming vibration soothes the nervous system and quiets mental chatter.",
    steps: ["Sit comfortably and take a slow breath in.", "On the exhale, make a soft, steady humming sound like a bee.", "Feel the vibration in the head and chest.", "Optionally rest the fingers lightly over the ears.", "Repeat for several rounds, keeping the hum smooth."] },
  { id: "trataka-object", name: "Object Focus Meditation", category: "Focus", icon: "🎯", duration: "5–10 min", best: "Concentration training",
    benefits: "Anchors attention on a single object to strengthen focus and calm restlessness.",
    steps: ["Place any small object in front of you at eye level.", "Rest your gaze softly on it without straining.", "Observe its details — color, shape, texture.", "When the mind wanders, gently return to the object.", "Finish by closing the eyes and resting for a moment."] },
  { id: "loving-self", name: "Self-Kindness Meditation", category: "Compassion", icon: "💛", duration: "10 min", best: "Reducing self-criticism",
    benefits: "Directs warmth and goodwill toward yourself, softening harsh inner talk.",
    steps: ["Sit comfortably and place a hand on the heart.", "Bring to mind your own wish to be happy and at ease.", "Silently offer: 'May I be kind to myself. May I be at peace.'", "Let any warmth grow; meet resistance gently.", "Rest in the feeling of goodwill toward yourself."] },
  { id: "reflection-review", name: "Evening Reflection", category: "Mindfulness", icon: "🌆", duration: "5 min", best: "Closing the day, processing",
    benefits: "A calm review of the day builds awareness and lets you release tension before sleep.",
    steps: ["Sit quietly at day's end and take a few breaths.", "Gently recall the day without judgment.", "Notice moments of ease and moments of difficulty.", "Acknowledge what went well and what you'd do differently.", "Let the day go, and rest into the evening."] },
];

const CATS = ["All", "Focus", "Breathwork", "Mindfulness", "Compassion", "Sleep"] as const;

export default function MeditationLibraryPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [open, setOpen] = useState<Technique | null>(null);

  const filtered = useMemo(() => TECHNIQUES.filter((t) => cat === "All" || t.category === cat), [cat]);

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-amber-600 hover:text-amber-100">← Back to techniques</button>
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-3xl">{open.icon}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-600">{open.category}</span>
                <span className="text-[11px] text-[#2a1e16]/55">⏱ {open.duration}</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em]">{open.name}</h1>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#34d399]">🎯 Benefits</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2a1e16]/80">{open.benefits}</p>
          </div>
          <div className="mt-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#38bdf8]">⏰ Best for</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2a1e16]/80">{open.best}</p>
          </div>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#ea580c]">🥄 Step by step</p>
          <ol className="mt-2 space-y-2">
            {open.steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3 text-sm text-[#2a1e16]/78">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/70 text-xs font-black">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Meditation Library</h1>
        <p className="text-sm text-[#2a1e16]/68">Guided techniques and breathwork with step-by-step instructions</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-amber-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((t) => (
          <button key={t.id} type="button" onClick={() => setOpen(t)} className="glass-card flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-amber-200/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-2xl">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">{t.name}</h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-amber-600">{t.category}</span>
              </div>
              <p className="mt-0.5 text-[13px] text-[#2a1e16]/62">⏱ {t.duration} · {t.best}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
