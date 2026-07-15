import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthSystem';

// ─── Photography (Unsplash CDN, with gradient fallback) ──────────────────────

const IMG = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

const MEDITATION_IMAGES: Record<string, { id: string; alt: string }> = {
  sitting_lotus:     { id: 'photo-1506126613408-eca07ce68773', alt: 'Woman meditating in lotus pose on a wooden deck overlooking nature' },
  breathing_deep:    { id: 'photo-1545389336-cf090694435e',    alt: 'Man practicing deep breathing meditation on a rock by the ocean' },
  body_scan:         { id: 'photo-1544367567-0f2fcb009e0b',    alt: 'Person lying in a relaxed savasana yoga posture outdoors' },
  loving_kindness:   { id: 'photo-1499209974431-9dddcece7f88', alt: 'Woman meditating peacefully on a dock at sunrise' },
  walking:           { id: 'photo-1476611317561-60117649dd94', alt: 'Person meditating in silhouette at sunset in open nature' },
  visualization:     { id: 'photo-1441974231531-c6227db76b6e', alt: 'Sunlight streaming through a calm green forest' },
  focused_attention: { id: 'photo-1552196563-55cd4e45efb3',    alt: 'Woman in seated meditation practicing focused attention in a bright studio' },
  open_monitoring:   { id: 'photo-1469474968028-56623f02e42e', alt: 'Golden light over mountain landscape evoking open awareness' },
  hero_meditation:   { id: 'photo-1447452001602-7090c7ab2db3', alt: 'Two people meditating cross-legged in silhouette at sunset' },
  calm_home:         { id: 'photo-1593811167562-9cef47bfc4d7', alt: 'Woman meditating calmly in a quiet living room at home' },
  candle_calm:       { id: 'photo-1518241353330-0f7941c2d9b5', alt: 'Person meditating in soft candlelight with hands resting' },
  studio_seated:     { id: 'photo-1599901860904-17e6ed7083a0', alt: 'Woman seated upright in meditation posture indoors' },
  mat_rest:          { id: 'photo-1591228127791-8e2eaef098d3', alt: 'Person resting in meditation on a yoga mat' },
  lake_still:        { id: 'photo-1474418397713-7ede21d49118', alt: 'Person meditating in stillness beside a calm lake' },
  sunrise_energy:    { id: 'photo-1470137237906-d8a4f71e1966', alt: 'Person greeting the sunrise in silhouette during morning meditation' },
  beach_breath:      { id: 'photo-1532798442725-41036acc7489', alt: 'Woman practicing slow breathing meditation on a quiet beach' },
  sunset_pose:       { id: 'photo-1524863479829-916d8e77f114', alt: 'Woman in a steady meditation pose against a sunset sky' },
};

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 55%, #0f0720 100%)';

const MeditationFigure: React.FC<{ pose: string; size?: number; rounded?: number }> = ({ pose, size = 180, rounded = 16 }) => {
  const meta = MEDITATION_IMAGES[pose] ?? MEDITATION_IMAGES.sitting_lotus;
  return (
    <div
      style={{
        width: size,
        height: Math.round(size * 1.25),
        borderRadius: rounded,
        overflow: 'hidden',
        background: FALLBACK_GRADIENT,
        flexShrink: 0,
        boxShadow: '0 8px 32px rgba(124,58,237,0.25)',
      }}
    >
      <img
        src={IMG(meta.id)}
        alt={meta.alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Technique {
  id: string;
  name: string;
  origin: string;
  figure: string;
  bestFor: string[];
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  steps: string[];
  script: string;
}

interface Stage {
  period: string;
  label: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  focus: string;
  techniques: string[];
  challenges: string[];
  milestones: string[];
  color: string;
}

interface GuidedSession {
  id: string;
  title: string;
  category: string;
  minutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  premium: boolean;
  figure: string;
  description: string;
  benefit: string; // plain-words one-liner
  steps: string[]; // numbered, one action per step
  benefits: string[];
}

interface BreathTechnique {
  id: string;
  name: string;
  tagline: string;
  // seconds per phase; 0 = phase skipped
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const guidedSessions: GuidedSession[] = [
  { id: 'stress-sos', title: 'Stress Relief SOS', category: 'Stress', minutes: 8, level: 'Beginner', premium: false, figure: 'breathing_deep',
    description: 'A fast 8-minute reset for a stressed body — long slow exhales plus grounding through your feet and hands.',
    benefit: 'In plain words: 8 minutes of long exhales that calm your body down fast.',
    steps: [
      'Sit on a chair, feet flat on the floor, hands on thighs.',
      'Close your eyes or look softly at the floor.',
      'Breathe in through the nose for 4 seconds, out for 6 seconds — repeat for 5 minutes.',
      'If a thought pulls you away, name it "thinking" and go back to the exhale.',
      'Finish with 3 minutes just feeling your feet on the ground.',
    ],
    benefits: ['Lowers cortisol fast', 'Releases jaw & shoulder tension', 'Restores clear thinking'] },
  { id: 'deep-sleep', title: 'Deep Sleep Descent', category: 'Sleep', minutes: 20, level: 'Beginner', premium: false, figure: 'body_scan',
    description: 'A slow 20-minute body scan done lying in bed that walks you down into sleep, one body region at a time.',
    benefit: 'In plain words: relax each body part in order until you drift off.',
    steps: [
      'Lie on your back in bed, arms at your sides, eyes closed.',
      'Take 3 slow breaths, letting each exhale be longer than the inhale.',
      'Move attention slowly from the top of your head down to your toes, ~1 minute per region.',
      'At each region, soften the muscles as you breathe out.',
      'If thoughts appear, let them pass and return to the body part you were on.',
      'It is fine to fall asleep before the end — that is the goal.',
    ],
    benefits: ['Faster sleep onset', 'Deeper slow-wave sleep', 'Quieted racing mind'] },
  { id: 'laser-focus', title: 'Laser Focus Primer', category: 'Focus', minutes: 10, level: 'Beginner', premium: false, figure: 'focused_attention',
    description: 'Ten minutes of single-point breath counting to warm up your attention before deep work, study, or competition.',
    benefit: 'In plain words: count breaths for 10 minutes so your mind stops jumping around.',
    steps: [
      'Sit upright on a chair, back straight but relaxed, eyes closed.',
      'Feel the air moving at the tip of your nose.',
      'Count each exhale silently: 1, 2, 3… up to 10, then start over.',
      'If you lose count or drift into thought, calmly start again at 1.',
      'At 10 minutes, open your eyes and go straight to your task.',
    ],
    benefits: ['Sharper sustained attention', 'Reduced task-switching', 'Pre-performance calm'] },
  { id: 'anxiety-anchor', title: 'Anxiety Anchor', category: 'Anxiety', minutes: 12, level: 'Beginner', premium: true, figure: 'calm_home',
    description: 'A 12-minute grounding routine: name what your five senses notice, then anchor in slow breathing.',
    benefit: 'In plain words: use your senses to get out of your head, then breathe slowly.',
    steps: [
      'Sit anywhere you feel safe; keep your eyes open with a soft gaze.',
      'Name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, 1 you can taste.',
      'Now close your eyes and place a hand on your belly.',
      'Breathe in for 4 seconds and out for 6 seconds for the rest of the session.',
      'When anxious thoughts come, treat them like passing traffic — noticed, not followed.',
    ],
    benefits: ['Interrupts panic spirals', 'Re-engages the prefrontal cortex', 'Builds felt safety'] },
  { id: 'gratitude-glow', title: 'Gratitude Glow', category: 'Gratitude', minutes: 10, level: 'Beginner', premium: true, figure: 'loving_kindness',
    description: 'Ten minutes savoring three real things you are grateful for — one at a time, in full detail.',
    benefit: 'In plain words: replay three good things slowly and let the feeling sink in.',
    steps: [
      'Sit comfortably, close your eyes, and place one hand over your heart.',
      'Take 5 slow breaths to settle.',
      'Bring up one genuine gratitude and picture it for ~2 minutes: who, where, how it felt.',
      'Repeat with a second, then a third gratitude.',
      'If your mind wanders, return to the picture, not the words.',
    ],
    benefits: ['Elevates baseline mood', 'Strengthens relationships', 'Counters negativity bias'] },
  { id: 'full-body-scan', title: 'Full Body Scan', category: 'Body Scan', minutes: 25, level: 'Beginner', premium: true, figure: 'mat_rest',
    description: 'The classic 25-minute MBSR sweep — crown to toes — done awake on a mat to release stored muscle tension.',
    benefit: 'In plain words: notice and relax every part of your body while staying awake.',
    steps: [
      'Lie on a mat (not your bed), arms slightly away from your body, eyes closed.',
      'Start at the crown of your head and sweep attention downward.',
      'Pause at each region — face, neck, shoulders, arms, chest, belly, hips, legs, feet.',
      'Just notice sensations: warmth, tingling, tightness. No need to change anything.',
      'On each exhale, let that region soften.',
      'End by feeling the whole body breathing as one for 2 minutes.',
    ],
    benefits: ['Deep muscular release', 'Improved interoception', 'Chronic pain relief'] },
  { id: 'morning-ignite', title: 'Morning Energy Ignite', category: 'Morning Energy', minutes: 7, level: 'Beginner', premium: true, figure: 'sunrise_energy',
    description: 'Seven minutes of brisk breath waves plus one clear intention — a caffeine-free way to switch your day on.',
    benefit: 'In plain words: quick energizing breaths and one sentence about what today is for.',
    steps: [
      'Sit tall near a window or outside, eyes open, gaze toward the light.',
      'Take 10 brisk breaths: sharp inhale through the nose, relaxed exhale.',
      'Rest for 30 seconds breathing normally; repeat the wave 3 times.',
      'Silently finish this sentence once: "Today matters because…".',
      'Stand up, stretch your arms overhead, and start your day.',
    ],
    benefits: ['Natural alertness boost', 'Clear daily intention', 'Positive momentum'] },
  { id: 'metta-heart', title: 'Loving-Kindness Heart Opener', category: 'Compassion', minutes: 15, level: 'Intermediate', premium: true, figure: 'candle_calm',
    description: 'Fifteen minutes of classical metta — repeating kind phrases for yourself, a loved one, a stranger, and everyone.',
    benefit: 'In plain words: practice wishing people well until it becomes a habit.',
    steps: [
      'Sit comfortably, close your eyes, and let your face relax.',
      'Silently repeat for yourself: "May I be happy. May I be healthy. May I be safe."',
      'After ~4 minutes, picture a loved one and repeat the phrases for them.',
      'Then a neutral person (a cashier, a neighbour), then someone difficult.',
      'Finish by extending the phrases to all beings everywhere.',
      'If the feeling is not there, that is fine — the repetition is the practice.',
    ],
    benefits: ['Increases self-compassion', 'Dissolves resentment', 'Boosts positive emotion 25%'] },
  { id: 'athlete-visual', title: 'Athlete Visualization Lab', category: 'Performance', minutes: 12, level: 'Intermediate', premium: true, figure: 'visualization',
    description: 'Twelve minutes of mental rehearsal — run your lift, race, or match in vivid multi-sensory detail.',
    benefit: 'In plain words: rehearse your performance in your head so your body already knows it.',
    steps: [
      'Sit or lie down somewhere quiet; close your eyes.',
      'Take 5 slow breaths to settle your body.',
      'Picture the venue: what you see, hear, and smell before you start.',
      'Run the performance in real time — every movement, in first person.',
      'If it goes wrong in your mind, rewind and replay it going right.',
      'Finish by repeating once: "I am calm, prepared, and ready."',
    ],
    benefits: ['Primes motor pathways', 'Pre-competition composure', 'Confidence under pressure'] },
  { id: 'walking-nature', title: 'Mindful Nature Walk', category: 'Movement', minutes: 15, level: 'Beginner', premium: true, figure: 'walking',
    description: 'A 15-minute slow walk outdoors where each step and breath is the meditation — no sitting required.',
    benefit: 'In plain words: walk slowly, feel every step, and let nature hold your attention.',
    steps: [
      'Find a quiet path; stand still and take 3 breaths before you start.',
      'Walk at half your normal pace, phone away.',
      'Feel each footfall land: heel, then arch, then toes.',
      'Breathe in for 2–3 steps, out for 2–3 steps.',
      'Keep your gaze soft and slightly ahead; when the mind wanders, return to your feet.',
    ],
    benefits: ['Meditation for restless minds', 'Doubles as active recovery', 'Deepens nature connection'] },
  { id: 'open-sky', title: 'Open Sky Awareness', category: 'Insight', minutes: 20, level: 'Advanced', premium: true, figure: 'open_monitoring',
    description: 'Twenty minutes of open monitoring — rest as wide-open awareness while thoughts and sounds drift through like clouds.',
    benefit: 'In plain words: instead of focusing on one thing, watch everything come and go.',
    steps: [
      'Sit upright, hands resting on thighs, eyes closed or half-open.',
      'Spend 5 minutes settling on the breath first.',
      'Then let go of the breath as an anchor — attend to whatever arises.',
      'Note each experience lightly: "sound", "thought", "itch" — and let it pass.',
      'Do not chase or push away anything; stay as the observer.',
      'If you get lost, return briefly to the breath, then open up again.',
    ],
    benefits: ['Non-reactive equanimity', 'Insight into thought patterns', 'Effortless presence'] },
];

const breathTechniques: BreathTechnique[] = [
  { id: 'box',      name: 'Box Breathing',    tagline: 'Navy SEAL calm under pressure', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  { id: '478',      name: '4-7-8 Breath',     tagline: 'The natural tranquilizer',      inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  { id: 'coherent', name: 'Coherent 5-5',     tagline: 'Heart-rate variability sweet spot', inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
  { id: 'calm',     name: 'Extended Exhale',  tagline: 'Longer out-breath, deeper calm', inhale: 4, holdIn: 2, exhale: 6, holdOut: 0 },
];

const techniques: Technique[] = [
  {
    id: 'breath',
    name: 'Mindfulness of Breath',
    origin: 'Buddhist (Anapanasati)',
    figure: 'focused_attention',
    bestFor: ['Beginners', 'Anxiety', 'Focus', 'Stress'],
    duration: '10–20 minutes',
    difficulty: 'Beginner',
    description: 'The foundational meditation — anchor awareness on the breath\'s natural rhythm. Each breath becomes a doorway back to the present moment.',
    steps: [
      'Sit comfortably with spine erect, eyes gently closed',
      'Take 3 deep breaths to settle, then let breathing return to normal',
      'Place attention at the nostrils or belly where breath is most noticeable',
      'Notice the sensation of each in-breath and out-breath',
      'When mind wanders (it will), gently return attention to the breath',
      'Continue for your chosen duration without forcing or controlling breath',
    ],
    script: '"Feel the cool air entering your nostrils… the gentle rise of your chest… the warm release of each exhale. Your breath is always here, always now. When the mind wanders, simply return — no judgment, just return."',
  },
  {
    id: 'bodyscan',
    name: 'Body Scan Meditation',
    origin: 'MBSR (Jon Kabat-Zinn)',
    figure: 'body_scan',
    bestFor: ['Sleep', 'Pain Relief', 'Relaxation', 'Trauma Healing'],
    duration: '20–45 minutes',
    difficulty: 'Beginner',
    description: 'Systematically move awareness through the body, releasing tension and cultivating somatic presence. Clinically proven to reduce chronic pain by 40%.',
    steps: [
      'Lie in savasana or sit comfortably — choose a posture where you can stay awake',
      'Begin at the crown of the head and slowly sweep awareness downward',
      'Pause at each region: face, neck, shoulders, arms, hands, chest, belly, back, hips, legs, feet',
      'Notice sensations without trying to change them — warmth, tingling, tension, numbness',
      'On each exhale, allow that region to soften and release',
      'Complete with whole-body awareness, feeling the body as one unified field',
    ],
    script: '"Bring your awareness to the top of your head. Simply notice whatever is there — any sensation, any feeling… Now let your awareness drift down like warm sunlight, melting tension as it goes…"',
  },
  {
    id: 'metta',
    name: 'Loving-Kindness (Metta)',
    origin: 'Theravada Buddhism',
    figure: 'loving_kindness',
    bestFor: ['Depression', 'Self-Compassion', 'Relationships', 'Anger'],
    duration: '15–30 minutes',
    difficulty: 'Beginner',
    description: 'Cultivate unconditional love and goodwill — first toward yourself, then expanding outward to all beings. Studies show it increases positive emotions by 25%.',
    steps: [
      'Sit comfortably, place one hand on your heart',
      'Begin by silently repeating for yourself: "May I be happy. May I be healthy. May I be safe. May I live with ease."',
      'Feel the warmth of these wishes filling your chest',
      'Expand to a loved one — visualize them, repeat the phrases',
      'Expand to a neutral person, then a difficult person',
      'Finally extend to all beings everywhere — "May all beings be happy and free"',
    ],
    script: '"Picture yourself as you are right now. Offer yourself these words of kindness: May I be happy. May I be healthy. May I be free from suffering. May I know peace…"',
  },
  {
    id: 'tm',
    name: 'Transcendental Meditation',
    origin: 'Vedic tradition / Maharishi Mahesh Yogi',
    figure: 'sitting_lotus',
    bestFor: ['Stress', 'Hypertension', 'Deep Rest', 'Performance'],
    duration: '20 minutes × 2 daily',
    difficulty: 'Beginner',
    description: 'Effortlessly repeat a mantra to transcend thought and access deep rest. 700+ peer-reviewed studies document its effects on stress, cognition, and cardiovascular health.',
    steps: [
      'Sit comfortably with eyes closed — no special posture needed',
      'Begin silently repeating your mantra (traditionally assigned by a teacher; use "So Hum" as a universal alternative)',
      'Do not concentrate on the mantra — let it repeat naturally, effortlessly',
      'When thoughts arise, simply return to the mantra without frustration',
      'After 20 minutes, stop repeating and rest for 2–3 minutes before opening eyes',
      'Practice twice daily — morning and late afternoon',
    ],
    script: 'Silently, effortlessly, as if it\'s whispering itself: "So… Hum… So… Hum…" Don\'t try to concentrate. Let the mantra arise on its own like a distant sound fading into silence.',
  },
  {
    id: 'zazen',
    name: 'Zen Meditation (Zazen)',
    origin: 'Japanese Zen Buddhism',
    figure: 'sitting_lotus',
    bestFor: ['Clarity', 'Presence', 'Discipline', 'Insight'],
    duration: '25–40 minutes',
    difficulty: 'Intermediate',
    description: 'Just sitting. No goals, no techniques — pure presence. The most stripped-down meditation practice, asking only that you show up completely.',
    steps: [
      'Sit in full or half lotus on a zafu (cushion), spine naturally upright',
      'Eyes half-open, cast downward at 45°, unfocused',
      'Hands in cosmic mudra: left on right, thumbs lightly touching',
      'Simply sit. Breathe naturally. Make no effort to control the mind',
      'When lost in thought, return — not to the breath, but to just sitting',
      'Ring a bell at the start and end; bow to close the practice',
    ],
    script: 'There is nothing to achieve. Nowhere to go. Just this: the weight of the body, the rise and fall of breath, the sound of the room. Just sitting.',
  },
  {
    id: 'vipassana',
    name: 'Vipassana Insight Meditation',
    origin: 'Theravada Buddhism (S.N. Goenka)',
    figure: 'focused_attention',
    bestFor: ['Deep Insight', 'Emotional Processing', 'Liberation', 'Advanced Practice'],
    duration: '45–60 minutes (or 10-day retreats)',
    difficulty: 'Advanced',
    description: 'Observe the impermanent nature of all sensations without reacting. Considered one of the most profound practices for psychological transformation.',
    steps: [
      'Begin with 20 minutes of breath awareness to calm the mind',
      'Scan from head to feet, noticing every sensation — pleasant, unpleasant, neutral',
      'Observe each sensation as it arises, peaks, and passes away',
      'The key: do not react with craving (to pleasant) or aversion (to unpleasant)',
      'If strong emotions arise, observe them as sensations in the body',
      'End with metta — dedicate the merit of your practice to all beings',
    ],
    script: 'Every sensation arises and passes. The pleasant sensation — it\'s already changing. The unpleasant one — already diminishing. Nothing is permanent. Just observe. Just witness.',
  },
  {
    id: 'visualization',
    name: 'Guided Visualization',
    origin: 'Modern / Psychosynthesis',
    figure: 'visualization',
    bestFor: ['Creativity', 'Performance', 'Healing', 'Goal Setting'],
    duration: '15–25 minutes',
    difficulty: 'Beginner',
    description: 'Use the mind\'s eye to create healing, performance, and transformation. Used by Olympic athletes, surgeons, and CEOs to prime neural pathways for success.',
    steps: [
      'Lie down or sit in a fully relaxed position',
      'Close eyes and take 5 slow breaths to shift into alpha brainwave state',
      'Choose your scene: a healing place in nature, or a future version of yourself',
      'Engage all senses — what do you see, hear, smell, feel in this visualization?',
      'For performance visualization: run through the skill/scenario in vivid detail',
      'Affirm the feeling: "I am calm, confident, capable" as you see it',
    ],
    script: '"Imagine a place of perfect peace — perhaps a forest clearing, or a warm beach at sunset. See the colors around you… feel the temperature… hear the sounds. This is your sanctuary."',
  },
  {
    id: 'walking',
    name: 'Walking Meditation (Kinhin)',
    origin: 'Zen / Theravada Buddhism',
    figure: 'walking',
    bestFor: ['ADHD', 'Restlessness', 'Outdoor Practice', 'Integration'],
    duration: '10–30 minutes',
    difficulty: 'Beginner',
    description: 'Transform walking into a moving contemplation. Ideal for those who struggle to sit still — each step becomes a moment of complete presence.',
    steps: [
      'Find a quiet path, 10–20 steps long, indoors or outdoors',
      'Stand still, take 3 breaths, set the intention to be fully present',
      'Walk at half your normal pace. Feel each part of the footfall: heel, arch, toes',
      'Coordinate breath with steps: inhale for 2–3 steps, exhale for 2–3 steps',
      'When you reach the end of the path, pause, turn mindfully, continue',
      'Let peripheral vision soften; keep gaze ahead and slightly down',
    ],
    script: 'Feel the ground receiving each step. There is nowhere to arrive. This step — just this step. The heel meets earth. The toes release. Walking home to the present moment.',
  },
  {
    id: 'chakra',
    name: 'Chakra Meditation',
    origin: 'Hindu Tantra / Yoga',
    figure: 'sitting_lotus',
    bestFor: ['Energy Work', 'Emotional Balance', 'Spiritual Growth', 'Creativity'],
    duration: '20–40 minutes',
    difficulty: 'Intermediate',
    description: 'Journey through the seven energy centers of the body, clearing blockages and cultivating balance from root to crown.',
    steps: [
      'Sit in comfortable meditation posture, spine tall',
      'Begin at the root chakra (base of spine) — visualize deep red light; feel groundedness',
      'Move to sacral (below navel) — orange; feel creativity and flow',
      'Solar plexus — yellow; feel confidence and personal power',
      'Heart — green; feel love, compassion, openness',
      'Throat — blue; feel truth, expression, authenticity',
      'Third eye — indigo; feel intuition, clarity, vision. Crown — violet; feel connection to all',
    ],
    script: '"A warm red light glows at the base of your spine, roots reaching into the earth. Safe. Grounded. Moving now to a warm orange glow below your navel… creativity, flow, joy…"',
  },
  {
    id: 'nidra',
    name: 'Yoga Nidra (Sleep Meditation)',
    origin: 'Tantric Yoga',
    figure: 'body_scan',
    bestFor: ['Sleep', 'Trauma Recovery', 'Deep Rest', 'Reprogramming Beliefs'],
    duration: '30–60 minutes',
    difficulty: 'Beginner',
    description: 'Enter the hypnagogic state between waking and sleep where the subconscious becomes accessible. 45 minutes = 3 hours of sleep for neural restoration.',
    steps: [
      'Lie in savasana with blankets — be completely comfortable and warm',
      'Set a Sankalpa (resolve/intention): a positive statement you repeat 3 times at start and end',
      'Rotate awareness through 61 body parts in a specific sequence',
      'Move through pairs of opposites: heaviness/lightness, warmth/cold, pleasure/pain',
      'Enter visualization phase — receive images without analysis',
      'Return to Sankalpa, then to full waking awareness slowly',
    ],
    script: '"You are lying comfortably… do not sleep, yet do not resist sleep… stay in the borderland… Right thumb… right index finger… middle finger… ring finger… little finger… palm… back of hand…"',
  },
  {
    id: 'breathing478',
    name: '4-7-8 Breath (Relaxing Breath)',
    origin: 'Dr. Andrew Weil / Pranayama',
    figure: 'breathing_deep',
    bestFor: ['Anxiety', 'Sleep Onset', 'Panic Attacks', 'Blood Pressure'],
    duration: '4 cycles × 3–4 rounds',
    difficulty: 'Beginner',
    description: 'A natural tranquilizer for the nervous system. Activates the parasympathetic response within 60 seconds. Dr. Weil calls it "the most powerful relaxation technique."',
    steps: [
      'Exhale completely through your mouth with a whoosh sound',
      'Close your mouth and inhale quietly through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale completely through your mouth with a whoosh for 8 counts',
      'This completes one cycle. Repeat 3 more times (4 cycles total)',
      'Practice twice daily. Do not do more than 4 cycles in first month',
    ],
    script: 'In for 4… hold 2… 3… 4… 5… 6… 7… and release for 8 — whoooosh. Feel the nervous system settle. One more time. Breathe in 1… 2… 3… 4…',
  },
  {
    id: 'boxbreath',
    name: 'Box Breathing (Navy SEAL Technique)',
    origin: 'Military / Ancient Pranayama',
    figure: 'breathing_deep',
    bestFor: ['Performance', 'Focus', 'Pre-stress Events', 'Emotional Regulation'],
    duration: '5–10 minutes',
    difficulty: 'Beginner',
    description: 'Used by Navy SEALs before combat and by elite athletes before competition. Equals the autonomic nervous system in under 5 minutes.',
    steps: [
      'Sit tall, shoulders relaxed',
      'Exhale all air from your lungs',
      'Inhale through the nose for 4 slow counts',
      'Hold at the top — lungs full — for 4 counts',
      'Exhale slowly through the mouth for 4 counts',
      'Hold at the bottom — lungs empty — for 4 counts. Repeat.',
    ],
    script: 'Inhale: 1… 2… 3… 4. Hold: 1… 2… 3… 4. Exhale: 1… 2… 3… 4. Hold empty: 1… 2… 3… 4. This is the box. Breathe the box.',
  },
];

const stages: Stage[] = [
  {
    period: 'Week 1–2',
    label: 'Foundation',
    level: 'Beginner',
    duration: '5 min/day',
    focus: 'Establishing the habit. No expectations.',
    techniques: ['Mindfulness of Breath', '4-7-8 Breathing'],
    challenges: ['Mind feels too busy', 'Forgetting to practice', '"Am I doing this right?"'],
    milestones: ['Sat for 5 minutes without stopping', 'Noticed when mind wandered', 'Completed 7 days in a row'],
    color: '#10b981',
  },
  {
    period: 'Week 3–4',
    label: 'Settling',
    level: 'Beginner',
    duration: '10 min/day',
    focus: 'Extending sessions. Exploring body scan.',
    techniques: ['Body Scan', 'Mindfulness of Breath', 'Loving-Kindness (intro)'],
    challenges: ['Sleepiness during practice', 'Physical restlessness', 'Inconsistent motivation'],
    milestones: ['10 minutes feels manageable', 'Noticed body sensations clearly', 'Had first moments of genuine stillness'],
    color: '#3b82f6',
  },
  {
    period: 'Month 2',
    label: 'Deepening',
    level: 'Beginner',
    duration: '15–20 min/day',
    focus: 'Dealing with resistance. Building concentration.',
    techniques: ['Loving-Kindness', 'Vipassana basics', 'Walking Meditation'],
    challenges: ['Difficult emotions surfacing', 'Doubting the practice', 'Boredom'],
    milestones: ['Noticed emotional patterns clearly', 'Applied mindfulness in daily life', 'Felt genuine peace during session'],
    color: '#8b5cf6',
  },
  {
    period: 'Month 3',
    label: 'Concentration',
    level: 'Beginner',
    duration: '30 min/day',
    focus: 'Samatha (calm abiding). Glimpses of jhana.',
    techniques: ['Extended breath focus', 'Chakra meditation', 'Yoga Nidra'],
    challenges: ['Plateau feeling', 'Strong hindrances (desire, aversion)', 'Over-efforting'],
    milestones: ['30 minutes flows naturally', 'Extended periods of stillness', 'Noticeable reduction in anxiety/reactivity'],
    color: '#d8b35a',
  },
  {
    period: 'Months 4–6',
    label: 'Integration',
    level: 'Intermediate',
    duration: '30–45 min/day',
    focus: 'Weaving mindfulness into daily life. Open monitoring.',
    techniques: ['Open Monitoring', 'Vipassana insight', 'TM or Zazen'],
    challenges: ['Spiritual bypassing', 'Integration challenges', 'Relationship changes'],
    milestones: ['Meditation extends into daily activities', 'Less reactivity in difficult situations', 'Sitting with discomfort without reacting'],
    color: '#f97316',
  },
  {
    period: 'Months 6–12',
    label: 'Ripening',
    level: 'Intermediate',
    duration: '45–60 min/day',
    focus: 'Advanced techniques. Retreat practice.',
    techniques: ['Vipassana (extended)', 'Zazen', 'Retreat practice'],
    challenges: ['Dark night of the soul', 'Disorientation', 'Need for skilled guidance'],
    milestones: ['Completed a silent retreat', 'Experience of deep equanimity', 'Non-judgmental awareness becomes default'],
    color: '#ec4899',
  },
  {
    period: 'Year 2+',
    label: 'Awakening',
    level: 'Advanced',
    duration: '60+ min/day',
    focus: 'Non-dual awareness. Living meditation.',
    techniques: ['Mahamudra', 'Dzogchen', 'Self-inquiry (Ramana style)', 'Koan practice'],
    challenges: ['Paradox of trying vs. not-trying', 'Understanding vs. realization', 'Teacher relationship'],
    milestones: ['Sustained witness consciousness', 'Meditation and life are no longer separate', 'Genuine compassion without effort'],
    color: '#7c3aed',
  },
];

const benefits = {
  mental: [
    { stat: '58%', label: 'Reduction in anxiety symptoms', source: 'JAMA Internal Medicine' },
    { stat: '40%', label: 'Decrease in perceived stress', source: 'Harvard Medical School' },
    { stat: '30%', label: 'Improvement in focus & attention', source: 'MIT Neuroscience' },
    { stat: '65%', label: 'Reduction in depressive relapse', source: 'Oxford MBCT Study' },
  ],
  physical: [
    { stat: '23%', label: 'Reduction in cortisol levels', source: 'Psychoneuroendocrinology' },
    { stat: '35%', label: 'Better sleep quality', source: 'Sleep Medicine Reviews' },
    { stat: '28%', label: 'Immune cell activity increase', source: 'Brain, Behavior & Immunity' },
    { stat: '15%', label: 'Blood pressure reduction', source: 'American Heart Association' },
  ],
};

const faqs = [
  {
    q: '"My mind won\'t stop thinking — I must be doing it wrong."',
    a: 'The mind thinking IS the meditation. You haven\'t failed when thoughts arise — you succeed when you notice them. Every moment of awareness is a moment of meditation. The practice is the returning, not the absence of thoughts.',
  },
  {
    q: '"I keep falling asleep during meditation."',
    a: 'This means your body is sleep-deprived (very common) or you\'re meditating lying down too soon. Solutions: Meditate in the morning before fatigue builds, sit upright (spine supports wakefulness), try eyes half-open, or do walking meditation instead.',
  },
  {
    q: '"I feel physical pain — my legs go numb."',
    a: 'Normal. You can shift position mindfully when discomfort becomes distracting. Over time, sessions on a meditation cushion (zafu) reduce this significantly. Never push through sharp or shooting pain — that\'s injury, not practice.',
  },
  {
    q: '"I don\'t have time — my schedule is too busy."',
    a: 'The people who most need meditation are those who feel they have no time. Start with 5 minutes. Research shows even 8 minutes daily produces measurable brain changes. Attach it to an existing habit: morning coffee, before lunch, after brushing teeth.',
  },
  {
    q: '"Strong emotions or memories come up. What do I do?"',
    a: 'This is the practice working. Unprocessed experiences surface when the mind quietens. Observe the emotion as a physical sensation in the body — where is it? What does it feel like? Don\'t story-tell about it. If it\'s overwhelming, open your eyes and breathe slowly. A trauma-informed teacher can help.',
  },
  {
    q: '"How will I know if I\'m making progress?"',
    a: 'Not by blissful sessions (those come and go) but by your daily life: Are you slightly less reactive? Is there a brief pause before you respond in anger? Do you recover from stress faster? Does suffering bother you just a little less? These are the real fruits of practice.',
  },
];

// ─── Local storage stats (per user email) ────────────────────────────────────

interface MedStats {
  totalMinutes: number;
  sessions: number;
  log: string[]; // ISO dates practiced
}

const emptyStats: MedStats = { totalMinutes: 0, sessions: 0, log: [] };

function statsKey(email?: string | null) {
  return `tiger_meditation_stats_${email || 'guest'}`;
}

function loadStats(email?: string | null): MedStats {
  try {
    const raw = localStorage.getItem(statsKey(email));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalMinutes: Number(parsed.totalMinutes) || 0,
        sessions: Number(parsed.sessions) || 0,
        log: Array.isArray(parsed.log) ? parsed.log : [],
      };
    }
    // migrate legacy log
    const legacy = localStorage.getItem('tiger_meditation_log');
    if (legacy) {
      const log: string[] = JSON.parse(legacy);
      return { totalMinutes: log.length * 10, sessions: log.length, log };
    }
  } catch { /* ignore corrupt storage */ }
  return { ...emptyStats };
}

function computeStreak(log: string[]): number {
  const set = new Set(log);
  let streak = 0;
  const d = new Date();
  // today counts if practiced; otherwise start from yesterday
  if (!set.has(d.toISOString().split('T')[0])) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().split('T')[0])) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ─── Breathing Coach ─────────────────────────────────────────────────────────

type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

const PHASE_ORDER: BreathPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

const PHASE_LABEL: Record<BreathPhase, string> = {
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Hold Empty',
};

const BreathingCoach: React.FC<{ onSessionComplete: (minutes: number) => void }> = ({ onSessionComplete }) => {
  const [techniqueId, setTechniqueId] = useState('box');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseSeconds, setPhaseSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const creditedRef = useRef(0);

  const technique = breathTechniques.find(t => t.id === techniqueId) ?? breathTechniques[0];

  const nextPhase = useCallback((current: BreathPhase): BreathPhase => {
    let idx = PHASE_ORDER.indexOf(current);
    for (let step = 0; step < 4; step++) {
      idx = (idx + 1) % 4;
      const p = PHASE_ORDER[idx];
      if (technique[p] > 0) return p;
    }
    return 'inhale';
  }, [technique]);

  // 1-second engine
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed(e => e + 1);
      setPhaseSeconds(s => {
        const limit = technique[phase] || 1;
        if (s + 1 >= limit) {
          const np = nextPhase(phase);
          if (np === 'inhale') setCycles(c => c + 1);
          setPhase(np);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase, technique, nextPhase]);

  const reset = (nextId?: string) => {
    setRunning(false);
    setPhase('inhale');
    setPhaseSeconds(0);
    setCycles(0);
    // credit whole minutes practiced before reset
    const wholeMin = Math.floor(elapsed / 60) - creditedRef.current;
    if (wholeMin > 0) {
      onSessionComplete(wholeMin);
      creditedRef.current += wholeMin;
    }
    setElapsed(0);
    creditedRef.current = 0;
    if (nextId) setTechniqueId(nextId);
  };

  const expanded = phase === 'inhale' || phase === 'holdIn';
  const transitionSec = phase === 'inhale' || phase === 'exhale' ? technique[phase] : 0.4;
  const scale = running ? (expanded ? 1 : 0.62) : 0.8;
  const remaining = Math.max(0, (technique[phase] || 0) - phaseSeconds);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="glass-card border-gold-glow rounded-3xl p-6 md:p-10 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.14), transparent 70%)' }} />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(216,179,90,0.10), transparent 70%)' }} />

      <div className="relative z-10">
        <div className="text-center mb-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e879f9]">Breathing Coach</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-black tracking-[-0.04em] text-center text-[#f7f0df] mb-6">
          Find Your Rhythm
        </h3>

        {/* technique selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Breathing techniques">
          {breathTechniques.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={techniqueId === t.id}
              onClick={() => reset(t.id)}
              className={`btn-gloss px-4 py-2 rounded-xl text-sm font-bold transition-all ${techniqueId === t.id ? 'text-[#07040d]' : 'text-[#f7f0df]/70 hover:text-[#f7f0df]'}`}
              style={techniqueId === t.id
                ? { background: 'linear-gradient(135deg, #a78bfa, #e879f9)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(167,139,250,0.25)' }}
            >
              {t.name}
              <span className="block text-[10px] font-medium opacity-80">
                {[t.inhale, t.holdIn, t.exhale, t.holdOut].filter(Boolean).join('-')}
              </span>
            </button>
          ))}
        </div>

        {/* breathing circle */}
        <div className="flex justify-center mb-8">
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            {/* outer rings */}
            {[1, 0.8, 0.6].map((r, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 280 * r,
                  height: 280 * r,
                  border: `1px solid rgba(167,139,250,${0.12 + i * 0.06})`,
                  transform: `scale(${scale + i * 0.04})`,
                  transition: `transform ${transitionSec}s ease-in-out`,
                }}
              />
            ))}
            {/* glow halo */}
            <div
              className="absolute rounded-full"
              style={{
                width: 220,
                height: 220,
                background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(232,121,249,0.18) 50%, transparent 72%)',
                filter: 'blur(6px)',
                transform: `scale(${scale * 1.15})`,
                transition: `transform ${transitionSec}s ease-in-out`,
              }}
            />
            {/* core circle */}
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                width: 180,
                height: 180,
                background: 'linear-gradient(135deg, rgba(167,139,250,0.9) 0%, rgba(124,58,237,0.85) 45%, rgba(216,179,90,0.75) 100%)',
                boxShadow: '0 0 60px rgba(167,139,250,0.45), inset 0 0 40px rgba(255,255,255,0.15)',
                transform: `scale(${scale})`,
                transition: `transform ${transitionSec}s ease-in-out`,
              }}
            >
              <div className="text-center select-none">
                <div className="text-xl font-black tracking-[-0.04em] text-[#07040d]">
                  {running ? PHASE_LABEL[phase] : 'Ready'}
                </div>
                {running && (
                  <div className="text-4xl font-black text-[#07040d]/80" aria-live="polite">{remaining}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* stats + controls */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-black text-[#d8b35a]">{cycles}</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62">Cycles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-[#a78bfa]">{mins}:{String(secs).padStart(2, '0')}</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62">Session</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-[#e879f9]">{technique.name}</div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62">{technique.tagline}</div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setRunning(r => !r)}
            className="btn-gloss px-10 py-3.5 rounded-2xl font-black text-[#07040d] text-lg"
            style={{ background: running ? 'linear-gradient(135deg, #e879f9, #a78bfa)' : 'linear-gradient(135deg, #d8b35a, #b8943a)' }}
          >
            {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Begin Breathing'}
          </button>
          {elapsed > 0 && (
            <button
              onClick={() => reset()}
              className="btn-gloss px-6 py-3.5 rounded-2xl font-bold text-[#f7f0df]/80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              End &amp; Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Meditation Timer with progress ring ─────────────────────────────────────

const TIMER_CHOICES = [5, 10, 15, 20];

const MeditationTimer: React.FC<{ onComplete: (minutes: number) => void }> = ({ onComplete }) => {
  const [targetMin, setTargetMin] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          onComplete(targetMin);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, targetMin, onComplete]);

  const pick = (m: number) => {
    setTargetMin(m);
    setSecondsLeft(m * 60);
    setRunning(false);
    setDone(false);
  };

  const total = targetMin * 60;
  const progress = total > 0 ? (total - secondsLeft) / total : 0;
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#a78bfa]">Meditation Timer</span>
      <h3 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df] mt-1 mb-6">Sit. Breathe. Be.</h3>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* progress ring */}
        <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
          <div
            role="img"
            aria-label={`Timer: ${mm} minutes ${ss} seconds remaining`}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#a78bfa 0deg, #e879f9 ${progress * 198}deg, #d8b35a ${progress * 360}deg, rgba(167,139,250,0.15) ${progress * 360}deg)`,
              transition: 'background 1s linear',
            }}
          />
          <div className="absolute inset-[10px] rounded-full bg-[#0b0714]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-black tracking-[-0.04em] text-[#f7f0df]">
              {mm}:{String(ss).padStart(2, '0')}
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62">
              {done ? 'Complete' : running ? 'Meditating' : 'Ready'}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex flex-wrap gap-2 mb-6">
            {TIMER_CHOICES.map(m => (
              <button
                key={m}
                onClick={() => pick(m)}
                className={`btn-gloss px-5 py-2.5 rounded-xl font-bold text-sm ${targetMin === m ? 'text-[#07040d]' : 'text-[#f7f0df]/70'}`}
                style={targetMin === m
                  ? { background: 'linear-gradient(135deg, #d8b35a, #b8943a)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(216,179,90,0.25)' }}
              >
                {m} min
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { if (done) pick(targetMin); else setRunning(r => !r); }}
              className="btn-gloss px-8 py-3 rounded-2xl font-black text-[#07040d]"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #e879f9)' }}
            >
              {done ? 'Again' : running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => pick(targetMin)}
              className="btn-gloss px-6 py-3 rounded-2xl font-bold text-[#f7f0df]/80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              Reset
            </button>
          </div>
          {done && (
            <p className="mt-4 text-sm text-[#d8b35a] font-bold">
              Session complete — {targetMin} minutes added to your practice. Well done.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Section Component ────────────────────────────────────────────────────────

export function MeditationSection() {
  const { user } = useAuth();
  const isPro = user?.plan === 'Pro' || user?.plan === 'Elite';

  const [activeSection, setActiveSection] = useState('studio');
  const [openSession, setOpenSession] = useState<GuidedSession | null>(null);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(0);
  const [sessionFilter, setSessionFilter] = useState('All');
  const [practiceMinutes, setPracticeMinutes] = useState(10);
  const [stats, setStats] = useState<MedStats>(emptyStats);

  useEffect(() => {
    setStats(loadStats(user?.email));
  }, [user?.email]);

  const addPractice = useCallback((minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const log = prev.log.includes(today) ? prev.log : [...prev.log, today].slice(-365);
      const next = { totalMinutes: prev.totalMinutes + minutes, sessions: prev.sessions + 1, log };
      try { localStorage.setItem(statsKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [user?.email]);

  const streak = useMemo(() => computeStreak(stats.log), [stats.log]);

  const logSession = () => addPractice(practiceMinutes);

  const sessionCategories = useMemo(
    () => ['All', ...Array.from(new Set(guidedSessions.map(s => s.category)))],
    [],
  );
  const visibleSessions = sessionFilter === 'All'
    ? guidedSessions
    : guidedSessions.filter(s => s.category === sessionFilter);

  const navSections = [
    { id: 'studio', label: 'Studio', free: true },
    { id: 'sessions', label: 'Session Library', free: true },
    { id: 'what', label: 'What is Meditation', free: true },
    { id: 'benefits', label: 'Benefits', free: true },
    { id: 'howto', label: 'How To', free: false },
    { id: 'roadmap', label: 'Roadmap', free: false },
    { id: 'techniques', label: 'Techniques', free: false },
    { id: 'challenges', label: 'Challenges', free: false },
    { id: 'practice', label: 'Daily Practice', free: false },
  ];

  const ProGate: React.FC<{ children: React.ReactNode; sectionName: string }> = ({ children, sectionName }) => {
    if (isPro) return <>{children}</>;
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none opacity-40">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-[#07040d]/80 to-[#07040d] rounded-2xl">
          <div className="text-center p-8 max-w-md">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-black tracking-[-0.04em] text-[#d8b35a] mb-2">{sectionName} — Pro Feature</h3>
            <p className="text-[#f7f0df]/70 mb-6">Unlock the complete meditation curriculum, guided scripts, and personalized roadmap with Titan Pro.</p>
            <button
              onClick={() => { window.location.hash = '#premium'; }}
              className="btn-gloss px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-900/40"
            >
              Upgrade to Pro — ₹499/month
            </button>
          </div>
        </div>
      </div>
    );
  };

  const statTiles = [
    { value: `${streak}`, unit: streak === 1 ? 'day' : 'days', label: 'Current Streak', color: '#d8b35a' },
    { value: `${stats.totalMinutes}`, unit: 'min', label: 'Minutes Meditated', color: '#a78bfa' },
    { value: `${stats.sessions}`, unit: '', label: 'Sessions Completed', color: '#e879f9' },
    { value: `${stats.log.slice(-7).length}`, unit: '/ 7', label: 'Days This Week', color: '#10b981' },
  ];

  return (
    <div style={{ background: '#07040d', color: '#f7f0df', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-8 border-gold-glow" style={{ background: 'linear-gradient(135deg, #0f0720 0%, #1a0a3a 50%, #070418 100%)' }}>
        <div className="absolute inset-0" aria-hidden="true">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${(i % 4) + 1}px`,
                height: `${(i % 4) + 1}px`,
                background: i % 3 === 0 ? '#d8b35a' : i % 3 === 1 ? '#a78bfa' : '#e879f9',
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                opacity: 0.15 + (i % 5) * 0.1,
              }}
            />
          ))}
        </div>
        {/* hero photo strip */}
        <div className="absolute inset-y-0 right-0 w-1/2 hidden lg:block" aria-hidden="true" style={{ background: FALLBACK_GRADIENT }}>
          <img
            src={IMG(MEDITATION_IMAGES.hero_meditation.id, 1200)}
            alt={MEDITATION_IMAGES.hero_meditation.alt}
            loading="lazy"
            className="w-full h-full object-cover opacity-40"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #0f0720 0%, transparent 60%)' }} />
        </div>
        <div className="relative z-10 px-8 py-16 lg:pr-[45%]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)' }}>
            <span className="text-[#d8b35a] text-xs font-bold uppercase tracking-[0.2em]">🧘 Premium Meditation Studio</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.04em] mb-4" style={{ background: 'linear-gradient(135deg, #f7f0df 0%, #d8b35a 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The Science &amp; Art of<br />Inner Stillness
          </h1>
          <p className="text-[#f7f0df]/70 text-lg max-w-2xl mb-10">
            From your first breath of awareness to advanced states of consciousness — a complete evidence-based journey from beginner to master.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {[
              { num: '500M+', label: 'Practitioners worldwide' },
              { num: '700+', label: 'Scientific studies' },
              { num: '12+', label: 'Guided sessions' },
              { num: '7', label: 'Stages of mastery' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl font-black tracking-[-0.04em] text-[#d8b35a]">{s.num}</div>
                <div className="text-xs text-[#f7f0df]/62 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Practice stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statTiles.map((t, i) => (
          <div key={i} className="glass-card rounded-2xl p-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-[-0.04em]" style={{ color: t.color }}>{t.value}</span>
              {t.unit && <span className="text-sm font-bold text-[#f7f0df]/62">{t.unit}</span>}
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62 mt-1">{t.label}</div>
          </div>
        ))}
      </div>

      {/* How this works — 3 steps */}
      <div className="glass-card rounded-2xl p-5 mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">How this works — 3 simple steps</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: '1', t: 'Pick a technique or session', d: 'Choose a breathing technique (like Box Breathing) or a guided session from the library that matches how you feel.' },
            { n: '2', t: 'Follow the animated circle', d: 'Watch the glowing circle expand and shrink. Breathe in as it grows, out as it shrinks — the phase and seconds show on screen.' },
            { n: '3', t: 'Build your daily streak', d: 'Finish a session to log your minutes. Come back each day to grow your streak and calm your mind over time.' },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-white/8 bg-white/5 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-black text-white">{s.n}</div>
              <p className="text-sm font-bold text-[#f7f0df]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#f7f0df]/68">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Nav */}
      <div className="sticky top-0 z-20 mb-8 overflow-x-auto rounded-xl" style={{ background: 'rgba(7,4,13,0.95)', borderBottom: '1px solid rgba(167,139,250,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {navSections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
              style={{
                background: activeSection === s.id ? 'rgba(167,139,250,0.25)' : 'transparent',
                color: activeSection === s.id ? '#d8b35a' : 'rgba(247,240,223,0.62)',
                border: activeSection === s.id ? '1px solid rgba(167,139,250,0.5)' : '1px solid transparent',
              }}
            >
              {!s.free && !isPro && <span className="text-xs">🔒</span>}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section: Studio (Breathing Coach + Timer) ─────────────────────── */}
      {activeSection === 'studio' && (
        <div className="space-y-8">
          <BreathingCoach onSessionComplete={addPractice} />

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <MeditationTimer onComplete={addPractice} />
            <div className="glass-card rounded-3xl overflow-hidden relative min-h-[280px]" style={{ background: FALLBACK_GRADIENT }}>
              <img
                src={IMG(MEDITATION_IMAGES.loving_kindness.id, 1000)}
                alt="Woman meditating peacefully on a dock at sunrise over calm water"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 20%, rgba(7,4,13,0.92) 100%)' }} />
              <div className="absolute bottom-0 p-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e879f9]">Today's Intention</span>
                <p className="text-xl font-black tracking-[-0.04em] text-[#f7f0df] mt-1">
                  "Between stimulus and response there is a space. In that space is our power to choose."
                </p>
                <p className="text-sm text-[#f7f0df]/62 mt-2">— Viktor Frankl</p>
              </div>
            </div>
          </div>

          {/* 30-day heatmap */}
          <div className="glass-card rounded-3xl p-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#a78bfa]">Consistency</span>
            <h3 className="text-xl font-black tracking-[-0.04em] text-[#f7f0df] mt-1 mb-4">Last 30 Days</h3>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                const dateStr = date.toISOString().split('T')[0];
                const practiced = stats.log.includes(dateStr);
                return (
                  <div
                    key={i}
                    className="w-6 h-6 rounded"
                    title={dateStr}
                    style={{
                      background: practiced ? 'linear-gradient(135deg, #a78bfa, #e879f9)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(167,139,250,0.2)',
                      boxShadow: practiced ? '0 0 8px rgba(167,139,250,0.5)' : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Guided Session Library ───────────────────────────────── */}
      {activeSection === 'sessions' && (
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e879f9]">Guided Library</span>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a] mt-1">12 Guided Sessions</h2>
            <p className="text-[#f7f0df]/70 mt-2">Curated for every state of mind — from pre-workout focus to post-training recovery and deep sleep.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sessionCategories.map(c => (
              <button
                key={c}
                onClick={() => setSessionFilter(c)}
                className={`btn-gloss px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] ${sessionFilter === c ? 'text-[#07040d]' : 'text-[#f7f0df]/62'}`}
                style={sessionFilter === c
                  ? { background: 'linear-gradient(135deg, #a78bfa, #e879f9)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(167,139,250,0.25)' }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleSessions.map(s => {
              const locked = s.premium && !isPro;
              const img = MEDITATION_IMAGES[s.figure] ?? MEDITATION_IMAGES.sitting_lotus;
              return (
                <div key={s.id} className={`glass-card rounded-3xl overflow-hidden flex flex-col ${locked ? '' : 'hover:-translate-y-1'} transition-transform`}>
                  <div className="relative h-40 shrink-0" style={{ background: FALLBACK_GRADIENT }}>
                    <img
                      src={IMG(img.id)}
                      alt={img.alt}
                      loading="lazy"
                      className={`w-full h-full object-cover ${locked ? 'opacity-40 grayscale' : ''}`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,4,13,0.9) 100%)' }} />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-[#07040d]" style={{ background: 'linear-gradient(135deg, #d8b35a, #b8943a)' }}>
                        {s.category}
                      </span>
                      {s.premium && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-[0.2em]" style={{ background: 'rgba(7,4,13,0.75)', color: '#e879f9', border: '1px solid rgba(232,121,249,0.4)' }}>
                          {locked ? '🔒 Pro' : '✦ Pro'}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <h3 className="text-lg font-black tracking-[-0.04em] text-[#f7f0df]">{s.title}</h3>
                      <span className="text-xs font-bold text-[#f7f0df]/70 shrink-0 ml-2">{s.minutes} min</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                        background: s.level === 'Beginner' ? 'rgba(16,185,129,0.2)' : s.level === 'Intermediate' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: s.level === 'Beginner' ? '#34d399' : s.level === 'Intermediate' ? '#fbbf24' : '#f87171',
                      }}>{s.level}</span>
                    </div>
                    <p className="text-sm text-[#f7f0df]/70 mb-4 flex-1">{s.description}</p>
                    <div className="mb-4">
                      {s.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#f7f0df]/70 mb-1">
                          <span className="text-[#a78bfa]">✓</span> {b}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        if (locked) { window.location.hash = '#premium'; return; }
                        setOpenSession(s);
                      }}
                      className="btn-gloss w-full py-2.5 rounded-xl font-bold text-sm"
                      style={locked
                        ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(232,121,249,0.35)', color: '#e879f9' }
                        : { background: 'linear-gradient(135deg, #a78bfa, #e879f9)', color: '#07040d' }}
                    >
                      {locked ? 'Unlock with Pro' : 'View Guided Practice →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section: What is Meditation ─────────────────────────────────────── */}
      {activeSection === 'what' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a] mb-4">What is Meditation?</h2>
              <p className="text-[#f7f0df]/80 text-lg leading-relaxed mb-4">
                Meditation is the practice of training attention and awareness — cultivating a clear, calm, and stable mind. It is not about stopping thoughts, achieving bliss, or "emptying" the mind. It is about observing experience with greater clarity and equanimity.
              </p>
              <p className="text-[#f7f0df]/70 leading-relaxed mb-4">
                Practiced for 2,500+ years across every major civilization, meditation has been rigorously studied by modern neuroscience and validated as one of the most effective interventions for mental health, cognitive performance, and overall wellbeing.
              </p>
              <div className="p-4 rounded-xl border-gold-glow" style={{ background: 'rgba(216,179,90,0.08)' }}>
                <p className="text-[#d8b35a] italic text-sm">"You should sit in meditation for twenty minutes every day — unless you're too busy; then you should sit for an hour." — Zen proverb</p>
              </div>
            </div>
            <div className="flex justify-center">
              <MeditationFigure pose="sitting_lotus" size={220} rounded={24} />
            </div>
          </div>

          {/* Neuroscience */}
          <div>
            <h3 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df] mb-4">What Happens in the Brain</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { region: 'Prefrontal Cortex', change: 'Thickens with practice', effect: 'Better decision-making, focus, and emotional regulation', icon: '🧠' },
                { region: 'Amygdala', change: 'Shrinks in size', effect: 'Reduced fear response and emotional reactivity', icon: '⚡' },
                { region: 'Default Mode Network', change: 'Activity decreases', effect: 'Less rumination, mind-wandering, and self-referential thinking', icon: '🌊' },
                { region: 'Hippocampus', change: 'Increases in grey matter', effect: 'Better memory, learning, and stress regulation', icon: '📚' },
                { region: 'Insula', change: 'Enhanced activation', effect: 'Greater body awareness and empathy', icon: '💓' },
                { region: 'Corpus Callosum', change: 'Strengthened connection', effect: 'Better integration between brain hemispheres', icon: '🔗' },
              ].map((b, i) => (
                <div key={i} className="glass-card p-4 rounded-xl">
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <div className="font-bold text-[#d8b35a] text-sm mb-1">{b.region}</div>
                  <div className="text-[#a78bfa] text-xs mb-2 font-medium">{b.change}</div>
                  <div className="text-[#f7f0df]/70 text-xs">{b.effect}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Types */}
          <div>
            <h3 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df] mb-4">The Landscape of Meditation</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { name: 'Focused Attention', icon: '🎯', desc: 'Single-point concentration' },
                { name: 'Open Monitoring', icon: '🌐', desc: 'Panoramic awareness' },
                { name: 'Loving-Kindness', icon: '💗', desc: 'Cultivating compassion' },
                { name: 'Mantra / TM', icon: '🕉️', desc: 'Sound-based transcendence' },
                { name: 'Visualization', icon: '✨', desc: 'Mental imagery practice' },
                { name: 'Body Scan', icon: '🔍', desc: 'Somatic awareness' },
                { name: 'Walking', icon: '🚶', desc: 'Moving meditation' },
                { name: 'Breath Work', icon: '💨', desc: 'Pranayama techniques' },
                { name: 'Yoga Nidra', icon: '😴', desc: 'Sleep-edge awareness' },
                { name: 'Zen / Vipassana', icon: '🌸', desc: 'Insight traditions' },
              ].map((t, i) => (
                <div key={i} className="glass-card p-3 rounded-xl text-center">
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-xs font-bold text-[#f7f0df]">{t.name}</div>
                  <div className="text-xs text-[#f7f0df]/62 mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Benefits ─────────────────────────────────────────────── */}
      {activeSection === 'benefits' && (
        <div className="space-y-8">
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a]">Evidence-Based Benefits</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(79,70,229,0.05))' }}>
              <h3 className="text-xl font-black tracking-[-0.04em] text-[#a78bfa] mb-4">🧠 Mental Health</h3>
              {benefits.mental.map((b, i) => (
                <div key={i} className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a] w-16 shrink-0">{b.stat}</div>
                  <div>
                    <div className="text-[#f7f0df] font-medium text-sm">{b.label}</div>
                    <div className="text-[#f7f0df]/62 text-xs">{b.source}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-card p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,95,70,0.05))' }}>
              <h3 className="text-xl font-black tracking-[-0.04em] text-emerald-400 mb-4">💪 Physical Health</h3>
              {benefits.physical.map((b, i) => (
                <div key={i} className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a] w-16 shrink-0">{b.stat}</div>
                  <div>
                    <div className="text-[#f7f0df] font-medium text-sm">{b.label}</div>
                    <div className="text-[#f7f0df]/62 text-xs">{b.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex justify-center items-center">
              <MeditationFigure pose="open_monitoring" size={200} rounded={24} />
            </div>
            <div className="space-y-4">
              {[
                { category: 'Emotional', items: ['Greater emotional regulation', 'Increased empathy and compassion', 'Reduced anger reactivity', 'More authentic self-expression'] },
                { category: 'Cognitive', items: ['Better working memory', 'Enhanced creativity', 'Faster information processing', 'Reduced cognitive decline with age'] },
              ].map((cat, i) => (
                <div key={i} className="glass-card p-4 rounded-xl">
                  <div className="font-bold text-[#d8b35a] mb-3">{cat.category} Benefits</div>
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-[#f7f0df]/80 mb-2">
                      <span className="text-[#a78bfa]">✓</span> {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section: How To ───────────────────────────────────────────────── */}
      {activeSection === 'howto' && (
        <ProGate sectionName="How To Meditate">
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a]">How to Meditate — Complete Guide</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div className="flex justify-center">
                <MeditationFigure pose="focused_attention" size={200} rounded={24} />
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-[#d8b35a] mb-3">Before You Begin</h3>
                <div className="space-y-2 text-sm text-[#f7f0df]/80">
                  <div>⏰ <strong>Time:</strong> Morning is ideal. Your practice, your rules.</div>
                  <div>📍 <strong>Place:</strong> Quiet, comfortable, consistent spot</div>
                  <div>🪑 <strong>Posture:</strong> Dignified, not rigid. Chair is fine.</div>
                  <div>⏱️ <strong>Duration:</strong> Start at 5 min. Build slowly.</div>
                  <div>📵 <strong>Phone:</strong> Off. Or in another room.</div>
                </div>
              </div>
            </div>

            {[
              { step: 1, title: 'Arrive', figure: 'sitting_lotus', instruction: 'Sit comfortably. Take 3 natural breaths. Feel the weight of your body in the seat, the contact of feet on the floor. You\'re here. This is the beginning.' },
              { step: 2, title: 'Anchor', figure: 'breathing_deep', instruction: 'Choose your anchor — usually the breath. Feel the sensation of air entering the nostrils, the gentle rise of the belly, the release of the exhale. This is home base.' },
              { step: 3, title: 'Notice', figure: 'focused_attention', instruction: 'The mind will wander. It always does. When you notice you\'ve been thinking — about work, a conversation, a memory — that noticing IS the practice. It\'s the moment of waking up.' },
              { step: 4, title: 'Return', figure: 'sitting_lotus', instruction: 'Without frustration, without judgment, gently bring attention back to the breath. Every return is a bicep curl for the mind. Hundreds of returns = hundreds of reps.' },
              { step: 5, title: 'Continue', figure: 'breathing_deep', instruction: 'Keep returning. Keep noticing. A session with many distractions and many returns is not a failed session — it\'s excellent training. The turbulent day is the best gym.' },
              { step: 6, title: 'Close', figure: 'loving_kindness', instruction: 'When your timer sounds, don\'t jump up. Rest in open awareness for 1 minute. Offer goodwill: "May I be well. May all beings be well." Open eyes slowly. Carry the quality of attention forward.' },
            ].map((s, i) => (
              <div key={i} className="glass-card flex gap-6 p-6 rounded-2xl">
                <div className="text-5xl font-black text-[#a78bfa]/40 shrink-0 w-12">{s.step}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-black tracking-[-0.04em] text-[#d8b35a] mb-2">{s.title}</h3>
                  <p className="text-[#f7f0df]/80 leading-relaxed">{s.instruction}</p>
                </div>
                <div className="shrink-0 hidden md:block">
                  <MeditationFigure pose={s.figure} size={80} rounded={12} />
                </div>
              </div>
            ))}
          </div>
        </ProGate>
      )}

      {/* ── Section: Roadmap ──────────────────────────────────────────────── */}
      {activeSection === 'roadmap' && (
        <ProGate sectionName="Beginner to Advanced Roadmap">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a]">Your Meditation Journey — 7 Stages</h2>
            <p className="text-[#f7f0df]/70">The path is not linear. Progress appears in daily life before it appears in sessions. Trust the process.</p>
            <div className="space-y-4">
              {stages.map((stage, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${stage.color}33` }}>
                  <button
                    onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                    style={{ background: `linear-gradient(135deg, ${stage.color}18, transparent)` }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0" style={{ background: stage.color, color: '#07040d' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-black tracking-[-0.04em] text-lg" style={{ color: stage.color }}>{stage.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${stage.color}22`, color: stage.color }}>{stage.level}</span>
                        <span className="text-[#f7f0df]/62 text-sm">{stage.period} · {stage.duration}</span>
                      </div>
                      <div className="text-[#f7f0df]/70 text-sm mt-1">{stage.focus}</div>
                    </div>
                    <span className="text-[#f7f0df]/62">{expandedStage === i ? '▲' : '▼'}</span>
                  </button>
                  {expandedStage === i && (
                    <div className="px-5 pb-5 grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs font-bold text-[#d8b35a] mb-2 uppercase tracking-[0.2em]">Practices</div>
                        {stage.techniques.map((t, j) => <div key={j} className="text-sm text-[#f7f0df]/80 mb-1">• {t}</div>)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-400 mb-2 uppercase tracking-[0.2em]">Common Challenges</div>
                        {stage.challenges.map((c, j) => <div key={j} className="text-sm text-[#f7f0df]/70 mb-1">⚠ {c}</div>)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-[0.2em]">Milestones</div>
                        {stage.milestones.map((m, j) => <div key={j} className="text-sm text-[#f7f0df]/80 mb-1">✓ {m}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ProGate>
      )}

      {/* ── Section: Techniques ───────────────────────────────────────────── */}
      {activeSection === 'techniques' && (
        <ProGate sectionName="Techniques Library">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a]">12 Meditation Techniques</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {techniques.map(t => (
                <div key={t.id} className="glass-card rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedTechnique(expandedTechnique === t.id ? null : t.id)}
                    className="w-full flex gap-4 p-5 text-left"
                  >
                    <div className="shrink-0">
                      <MeditationFigure pose={t.figure} size={70} rounded={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#f7f0df]">{t.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{
                          background: t.difficulty === 'Beginner' ? 'rgba(16,185,129,0.2)' : t.difficulty === 'Intermediate' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                          color: t.difficulty === 'Beginner' ? '#34d399' : t.difficulty === 'Intermediate' ? '#fbbf24' : '#f87171',
                        }}>{t.difficulty}</span>
                      </div>
                      <div className="text-xs text-[#a78bfa] mb-2">{t.origin}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {t.bestFor.slice(0, 3).map((b, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{b}</span>
                        ))}
                      </div>
                      <div className="text-xs text-[#f7f0df]/62">⏱ {t.duration}</div>
                    </div>
                  </button>
                  {expandedTechnique === t.id && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
                      <p className="text-[#f7f0df]/70 text-sm mb-4 mt-4">{t.description}</p>
                      <div className="mb-4">
                        <div className="text-xs font-bold text-[#d8b35a] mb-2 uppercase tracking-[0.2em]">Instructions</div>
                        {t.steps.map((s, i) => (
                          <div key={i} className="flex gap-2 text-sm text-[#f7f0df]/80 mb-2">
                            <span className="text-[#a78bfa] shrink-0">{i + 1}.</span>
                            {s}
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-xl border-gold-glow" style={{ background: 'rgba(216,179,90,0.06)' }}>
                        <div className="text-xs font-bold text-[#d8b35a] mb-2 uppercase tracking-[0.2em]">📢 Guided Script Excerpt</div>
                        <p className="text-[#f7f0df]/80 text-sm italic">{t.script}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ProGate>
      )}

      {/* ── Section: Challenges ───────────────────────────────────────────── */}
      {activeSection === 'challenges' && (
        <ProGate sectionName="Common Challenges">
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a] mb-6">Every Meditator Faces These</h2>
            {faqs.map((faq, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-medium text-[#f7f0df]">{faq.q}</span>
                  <span className="text-[#a78bfa] text-xl shrink-0">{expandedFaq === i ? '−' : '+'}</span>
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5 text-[#f7f0df]/75 leading-relaxed border-t" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
                    <p className="mt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ProGate>
      )}

      {/* ── Section: Daily Practice ───────────────────────────────────────── */}
      {activeSection === 'practice' && (
        <ProGate sectionName="Daily Practice Builder">
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#d8b35a]">Build Your Daily Practice</h2>

            {/* Session Logger */}
            <div className="glass-card border-gold-glow p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(79,70,229,0.05))' }}>
              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <h3 className="font-black tracking-[-0.04em] text-[#d8b35a] text-lg">Log Today's Session</h3>
                  <div className="text-[#f7f0df]/62 text-sm">{stats.sessions} sessions logged · {Math.max(0, 7 - stats.log.slice(-7).length)} sessions to complete this week's goal</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPracticeMinutes(Math.max(5, practiceMinutes - 5))} className="btn-gloss w-8 h-8 rounded-full text-[#f7f0df] font-bold" style={{ background: 'rgba(167,139,250,0.3)' }} aria-label="Decrease minutes">−</button>
                    <span className="text-[#d8b35a] font-black text-xl w-16 text-center">{practiceMinutes} min</span>
                    <button onClick={() => setPracticeMinutes(Math.min(120, practiceMinutes + 5))} className="btn-gloss w-8 h-8 rounded-full text-[#f7f0df] font-bold" style={{ background: 'rgba(167,139,250,0.3)' }} aria-label="Increase minutes">+</button>
                  </div>
                  <button
                    onClick={logSession}
                    className="btn-gloss px-6 py-3 rounded-xl font-bold text-[#07040d]"
                    style={{ background: 'linear-gradient(135deg, #d8b35a, #b8943a)' }}
                  >
                    Log Session ✓
                  </button>
                </div>
              </div>

              {/* Last 30 days heatmap */}
              <div className="mt-6">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/62 mb-2">Last 30 days</div>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const practiced = stats.log.includes(dateStr);
                    return (
                      <div
                        key={i}
                        className="w-6 h-6 rounded"
                        title={dateStr}
                        style={{ background: practiced ? '#a78bfa' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Suggested routines */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Morning Ritual (20 min)',
                  icon: '🌅',
                  items: ['2 min — Settle and arrive', '5 min — Body scan to wake up', '10 min — Mindfulness of breath', '3 min — Loving-kindness to start the day'],
                },
                {
                  title: 'Midday Reset (5 min)',
                  icon: '☀️',
                  items: ['1 min — 4-7-8 breathing to shift state', '3 min — Body scan (standing or seated)', '1 min — Set intention for afternoon'],
                },
                {
                  title: 'Evening Wind-Down (30 min)',
                  icon: '🌙',
                  items: ['5 min — Breath awareness to transition', '20 min — Yoga Nidra for deep rest', '5 min — Gratitude reflection'],
                },
              ].map((r, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl">
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <h3 className="font-bold text-[#d8b35a] mb-3">{r.title}</h3>
                  {r.items.map((item, j) => (
                    <div key={j} className="text-sm text-[#f7f0df]/70 mb-2 flex gap-2">
                      <span className="text-[#a78bfa]">•</span> {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Resources */}
            <div className="glass-card border-gold-glow p-6 rounded-2xl">
              <h3 className="font-black tracking-[-0.04em] text-[#d8b35a] mb-4">Recommended Resources</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-[#f7f0df]/62 mb-2 uppercase tracking-[0.2em]">Books</div>
                  {['The Mind Illuminated — Culadasa', 'Waking Up — Sam Harris', 'Full Catastrophe Living — Jon Kabat-Zinn', 'The Miracle of Mindfulness — Thich Nhat Hanh'].map((b, i) => (
                    <div key={i} className="text-sm text-[#f7f0df]/75 mb-1">📖 {b}</div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#f7f0df]/62 mb-2 uppercase tracking-[0.2em]">Apps &amp; Teachers</div>
                  {['Waking Up (Sam Harris) — secular', 'Insight Timer — free guided meditations', 'S.N. Goenka — 10-day Vipassana retreats', 'Tara Brach — RAIN technique, PTSD-informed'].map((a, i) => (
                    <div key={i} className="text-sm text-[#f7f0df]/75 mb-1">🧘 {a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ProGate>
      )}

      {/* Guided-practice modal — honest written steps + a timer link (no fake video) */}
      {openSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setOpenSession(null)}>
          <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#0b0714]/95" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-44 shrink-0" style={{ background: FALLBACK_GRADIENT }}>
              <img
                src={IMG((MEDITATION_IMAGES[openSession.figure] ?? MEDITATION_IMAGES.sitting_lotus).id, 900)}
                alt={(MEDITATION_IMAGES[openSession.figure] ?? MEDITATION_IMAGES.sitting_lotus).alt}
                loading="lazy"
                className="h-full w-full rounded-t-3xl object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 rounded-t-3xl" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(11,7,20,0.95) 100%)' }} />
              <button onClick={() => setOpenSession(null)} className="absolute right-3 top-3 rounded-full border border-[#f7f0df]/20 bg-black/40 px-3 py-1.5 text-xs text-[#f7f0df]/80 hover:bg-black/60">✕</button>
              <div className="absolute bottom-3 left-5 right-5">
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#07040d]" style={{ background: 'linear-gradient(135deg,#d8b35a,#b8943a)' }}>Guided written practice</span>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">{openSession.title}</h2>
                <p className="text-xs font-bold text-[#f7f0df]/70">{openSession.minutes} min · {openSession.level} · {openSession.category}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#f7f0df]/80">{openSession.description}</p>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a78bfa]">Follow these steps</p>
                <ol className="mt-3 space-y-2.5">
                  {openSession.steps.map((st, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#f7f0df]/82">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black text-[#07040d]" style={{ background: 'linear-gradient(135deg,#a78bfa,#e879f9)' }}>{i + 1}</span>
                      {st}
                    </li>
                  ))}
                </ol>
              </div>
              <button
                onClick={() => { setOpenSession(null); setActiveSection('studio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn-gloss mt-6 w-full rounded-xl py-3 text-sm font-bold text-[#07040d]"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#e879f9)' }}
              >
                ⏱ Start the breathing timer for this practice
              </button>
              <p className="mt-2 text-center text-[11px] text-[#f7f0df]/55">Read the steps, then use the breathing coach &amp; timer to practise. This is a written guide, not a video.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Full Page ────────────────────────────────────────────────────────────────

export default function MeditationPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10" style={{ background: '#07040d', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto">
        <MeditationSection />
      </div>
    </div>
  );
}
