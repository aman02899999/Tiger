import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthSystem';

// ─── SVG Figures ─────────────────────────────────────────────────────────────

const MEDITATION_IMAGES: Record<string, string> = {
  sitting_lotus:      'meditation,lotus-pose,cross-legged,seated-mindfulness',
  breathing_deep:     'meditation,deep-breathing,pranayama,breath-awareness',
  body_scan:          'meditation,body-scan,lying-down,relaxation,savasana',
  loving_kindness:    'meditation,loving-kindness,metta,heart-meditation',
  walking:            'meditation,walking-meditation,mindful-walking,kinhin',
  visualization:      'meditation,visualization,guided-imagery,calm-mind',
  focused_attention:  'meditation,focused-attention,mindfulness,concentration',
  open_monitoring:    'meditation,open-awareness,mindfulness,sitting-peaceful',
}

const MeditationFigure: React.FC<{ pose: string; size?: number }> = ({ pose, size = 180 }) => {
  const keywords = MEDITATION_IMAGES[pose] ?? 'meditation,mindfulness,calm,peaceful'
  const imageUrl = `https://source.unsplash.com/featured/400x500/?${encodeURIComponent(keywords)}`
  return (
    <div style={{ width: size, height: Math.round(size * 1.25), borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#3b0764,#1e1b4b)', flexShrink: 0 }}>
      <img
        src={imageUrl}
        alt={pose.replace(/_/g, ' ')}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

// dead code: old SVG figures (replaced by photos above)

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

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// ─── Section Component ────────────────────────────────────────────────────────

export function MeditationSection() {
  const { user } = useAuth();
  const isPro = user?.plan === 'pro' || user?.plan === 'elite' || user?.plan === 'annual';

  const [activeSection, setActiveSection] = useState('what');
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(0);
  const [practiceMinutes, setPracticeMinutes] = useState(10);
  const [practiceLog, setPracticeLog] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tiger_meditation_log');
    if (saved) setPracticeLog(JSON.parse(saved));
  }, []);

  const logSession = () => {
    const today = new Date().toISOString().split('T')[0];
    if (!practiceLog.includes(today)) {
      const updated = [...practiceLog, today].slice(-365);
      setPracticeLog(updated);
      localStorage.setItem('tiger_meditation_log', JSON.stringify(updated));
    }
  };

  const navSections = [
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
            <h3 className="text-2xl font-bold text-[#d8b35a] mb-2">{sectionName} — Pro Feature</h3>
            <p className="text-[#f7f0df]/70 mb-6">Unlock the complete meditation curriculum, guided scripts, and personalized roadmap with Tiger Pro.</p>
            <button
              onClick={() => window.location.hash = '#premium'}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/40"
            >
              Upgrade to Pro — ₹499/month
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#07040d', color: '#f7f0df', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-8" style={{ background: 'linear-gradient(135deg, #0f0720 0%, #1a0a3a 50%, #070418 100%)' }}>
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                background: i % 3 === 0 ? '#d8b35a' : '#7c3aed',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.1,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <span className="text-[#d8b35a] text-sm font-semibold">🧘 PREMIUM MEDITATION STUDIO</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #f7f0df 0%, #d8b35a 50%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The Science &amp; Art of<br />Inner Stillness
          </h1>
          <p className="text-[#f7f0df]/70 text-lg max-w-2xl mx-auto mb-10">
            From your first breath of awareness to advanced states of consciousness — a complete evidence-based journey from beginner to master.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { num: '500M+', label: 'Practitioners worldwide' },
              { num: '700+', label: 'Scientific studies' },
              { num: '12', label: 'Proven techniques' },
              { num: '7', label: 'Stages of mastery' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <div className="text-2xl font-black text-[#d8b35a]">{s.num}</div>
                <div className="text-xs text-[#f7f0df]/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Nav */}
      <div className="sticky top-0 z-20 mb-8 overflow-x-auto" style={{ background: 'rgba(7,4,13,0.95)', borderBottom: '1px solid rgba(124,58,237,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {navSections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
              style={{
                background: activeSection === s.id ? 'rgba(124,58,237,0.3)' : 'transparent',
                color: activeSection === s.id ? '#d8b35a' : '#f7f0df99',
                border: activeSection === s.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
              }}
            >
              {!s.free && !isPro && <span className="text-xs">🔒</span>}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section: What is Meditation ─────────────────────────────────────── */}
      {activeSection === 'what' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-black text-[#d8b35a] mb-4">What is Meditation?</h2>
              <p className="text-[#f7f0df]/80 text-lg leading-relaxed mb-4">
                Meditation is the practice of training attention and awareness — cultivating a clear, calm, and stable mind. It is not about stopping thoughts, achieving bliss, or "emptying" the mind. It is about observing experience with greater clarity and equanimity.
              </p>
              <p className="text-[#f7f0df]/70 leading-relaxed mb-4">
                Practiced for 2,500+ years across every major civilization, meditation has been rigorously studied by modern neuroscience and validated as one of the most effective interventions for mental health, cognitive performance, and overall wellbeing.
              </p>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(216,179,90,0.1)', border: '1px solid rgba(216,179,90,0.3)' }}>
                <p className="text-[#d8b35a] italic text-sm">"You should sit in meditation for twenty minutes every day — unless you're too busy; then you should sit for an hour." — Zen proverb</p>
              </div>
            </div>
            <div className="flex justify-center">
              <MeditationFigure pose="sitting_lotus" size={220} />
            </div>
          </div>

          {/* Neuroscience */}
          <div>
            <h3 className="text-2xl font-bold text-[#f7f0df] mb-4">What Happens in the Brain</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { region: 'Prefrontal Cortex', change: 'Thickens with practice', effect: 'Better decision-making, focus, and emotional regulation', icon: '🧠' },
                { region: 'Amygdala', change: 'Shrinks in size', effect: 'Reduced fear response and emotional reactivity', icon: '⚡' },
                { region: 'Default Mode Network', change: 'Activity decreases', effect: 'Less rumination, mind-wandering, and self-referential thinking', icon: '🌊' },
                { region: 'Hippocampus', change: 'Increases in grey matter', effect: 'Better memory, learning, and stress regulation', icon: '📚' },
                { region: 'Insula', change: 'Enhanced activation', effect: 'Greater body awareness and empathy', icon: '💓' },
                { region: 'Corpus Callosum', change: 'Strengthened connection', effect: 'Better integration between brain hemispheres', icon: '🔗' },
              ].map((b, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <div className="font-bold text-[#d8b35a] text-sm mb-1">{b.region}</div>
                  <div className="text-[#7c3aed] text-xs mb-2 font-medium">{b.change}</div>
                  <div className="text-[#f7f0df]/70 text-xs">{b.effect}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Types */}
          <div>
            <h3 className="text-2xl font-bold text-[#f7f0df] mb-4">The Landscape of Meditation</h3>
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
                <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-xs font-bold text-[#f7f0df]">{t.name}</div>
                  <div className="text-xs text-[#f7f0df]/50 mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Benefits ─────────────────────────────────────────────── */}
      {activeSection === 'benefits' && (
        <div className="space-y-8">
          <h2 className="text-3xl font-black text-[#d8b35a]">Evidence-Based Benefits</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.05))', border: '1px solid rgba(124,58,237,0.3)' }}>
              <h3 className="text-xl font-bold text-[#7c3aed] mb-4">🧠 Mental Health</h3>
              {benefits.mental.map((b, i) => (
                <div key={i} className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-black text-[#d8b35a] w-16 shrink-0">{b.stat}</div>
                  <div>
                    <div className="text-[#f7f0df] font-medium text-sm">{b.label}</div>
                    <div className="text-[#f7f0df]/50 text-xs">{b.source}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,95,70,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <h3 className="text-xl font-bold text-emerald-400 mb-4">💪 Physical Health</h3>
              {benefits.physical.map((b, i) => (
                <div key={i} className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-black text-[#d8b35a] w-16 shrink-0">{b.stat}</div>
                  <div>
                    <div className="text-[#f7f0df] font-medium text-sm">{b.label}</div>
                    <div className="text-[#f7f0df]/50 text-xs">{b.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex justify-center items-center">
              <MeditationFigure pose="open_monitoring" size={200} />
            </div>
            <div className="space-y-4">
              {[
                { category: 'Emotional', items: ['Greater emotional regulation', 'Increased empathy and compassion', 'Reduced anger reactivity', 'More authentic self-expression'] },
                { category: 'Cognitive', items: ['Better working memory', 'Enhanced creativity', 'Faster information processing', 'Reduced cognitive decline with age'] },
              ].map((cat, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div className="font-bold text-[#d8b35a] mb-3">{cat.category} Benefits</div>
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-[#f7f0df]/80 mb-2">
                      <span className="text-[#7c3aed]">✓</span> {item}
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
            <h2 className="text-3xl font-black text-[#d8b35a]">How to Meditate — Complete Guide</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div className="flex justify-center">
                <MeditationFigure pose="focused_attention" size={200} />
              </div>
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
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
              <div key={i} className="flex gap-6 p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="text-5xl font-black text-[#7c3aed]/30 shrink-0 w-12">{s.step}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#d8b35a] mb-2">{s.title}</h3>
                  <p className="text-[#f7f0df]/80 leading-relaxed">{s.instruction}</p>
                </div>
                <div className="shrink-0 hidden md:block">
                  <MeditationFigure pose={s.figure} size={80} />
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
            <h2 className="text-3xl font-black text-[#d8b35a]">Your Meditation Journey — 7 Stages</h2>
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
                        <span className="font-black text-lg" style={{ color: stage.color }}>{stage.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${stage.color}22`, color: stage.color }}>{stage.level}</span>
                        <span className="text-[#f7f0df]/60 text-sm">{stage.period} · {stage.duration}</span>
                      </div>
                      <div className="text-[#f7f0df]/70 text-sm mt-1">{stage.focus}</div>
                    </div>
                    <span className="text-[#f7f0df]/40">{expandedStage === i ? '▲' : '▼'}</span>
                  </button>
                  {expandedStage === i && (
                    <div className="px-5 pb-5 grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs font-bold text-[#d8b35a] mb-2 uppercase tracking-wider">Practices</div>
                        {stage.techniques.map((t, j) => <div key={j} className="text-sm text-[#f7f0df]/80 mb-1">• {t}</div>)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">Common Challenges</div>
                        {stage.challenges.map((c, j) => <div key={j} className="text-sm text-[#f7f0df]/70 mb-1">⚠ {c}</div>)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">Milestones</div>
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
            <h2 className="text-3xl font-black text-[#d8b35a]">12 Meditation Techniques</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {techniques.map(t => (
                <div key={t.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(255,255,255,0.02)' }}>
                  <button
                    onClick={() => setExpandedTechnique(expandedTechnique === t.id ? null : t.id)}
                    className="w-full flex gap-4 p-5 text-left"
                  >
                    <div className="shrink-0">
                      <MeditationFigure pose={t.figure} size={70} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#f7f0df]">{t.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{
                          background: t.difficulty === 'Beginner' ? 'rgba(16,185,129,0.2)' : t.difficulty === 'Intermediate' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                          color: t.difficulty === 'Beginner' ? '#10b981' : t.difficulty === 'Intermediate' ? '#f59e0b' : '#ef4444',
                        }}>{t.difficulty}</span>
                      </div>
                      <div className="text-xs text-[#7c3aed] mb-2">{t.origin}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {t.bestFor.slice(0, 3).map((b, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>{b}</span>
                        ))}
                      </div>
                      <div className="text-xs text-[#f7f0df]/50">⏱ {t.duration}</div>
                    </div>
                  </button>
                  {expandedTechnique === t.id && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
                      <p className="text-[#f7f0df]/70 text-sm mb-4 mt-4">{t.description}</p>
                      <div className="mb-4">
                        <div className="text-xs font-bold text-[#d8b35a] mb-2 uppercase tracking-wider">Instructions</div>
                        {t.steps.map((s, i) => (
                          <div key={i} className="flex gap-2 text-sm text-[#f7f0df]/80 mb-2">
                            <span className="text-[#7c3aed] shrink-0">{i + 1}.</span>
                            {s}
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(216,179,90,0.08)', border: '1px solid rgba(216,179,90,0.25)' }}>
                        <div className="text-xs font-bold text-[#d8b35a] mb-2">📢 Guided Script Excerpt</div>
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
            <h2 className="text-3xl font-black text-[#d8b35a] mb-6">Every Meditator Faces These</h2>
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(255,255,255,0.02)' }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-medium text-[#f7f0df]">{faq.q}</span>
                  <span className="text-[#7c3aed] text-xl shrink-0">{expandedFaq === i ? '−' : '+'}</span>
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5 text-[#f7f0df]/75 leading-relaxed border-t" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
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
            <h2 className="text-3xl font-black text-[#d8b35a]">Build Your Daily Practice</h2>

            {/* Session Logger */}
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.05))', border: '1px solid rgba(124,58,237,0.3)' }}>
              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <h3 className="font-bold text-[#d8b35a] text-lg">Log Today's Session</h3>
                  <div className="text-[#f7f0df]/60 text-sm">{practiceLog.length} sessions logged · {Math.max(0, 7 - (practiceLog.slice(-7).length))} sessions to complete this week's goal</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPracticeMinutes(Math.max(5, practiceMinutes - 5))} className="w-8 h-8 rounded-full text-[#f7f0df] font-bold" style={{ background: 'rgba(124,58,237,0.3)' }}>−</button>
                    <span className="text-[#d8b35a] font-black text-xl w-16 text-center">{practiceMinutes} min</span>
                    <button onClick={() => setPracticeMinutes(Math.min(120, practiceMinutes + 5))} className="w-8 h-8 rounded-full text-[#f7f0df] font-bold" style={{ background: 'rgba(124,58,237,0.3)' }}>+</button>
                  </div>
                  <button
                    onClick={logSession}
                    className="px-6 py-3 rounded-xl font-bold text-[#07040d]"
                    style={{ background: 'linear-gradient(135deg, #d8b35a, #b8943a)' }}
                  >
                    Log Session ✓
                  </button>
                </div>
              </div>

              {/* Last 30 days heatmap */}
              <div className="mt-6">
                <div className="text-xs text-[#f7f0df]/50 mb-2">Last 30 days</div>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const practiced = practiceLog.includes(dateStr);
                    return (
                      <div
                        key={i}
                        className="w-6 h-6 rounded"
                        title={dateStr}
                        style={{ background: practiced ? '#7c3aed' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}
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
                <div key={i} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <h3 className="font-bold text-[#d8b35a] mb-3">{r.title}</h3>
                  {r.items.map((item, j) => (
                    <div key={j} className="text-sm text-[#f7f0df]/70 mb-2 flex gap-2">
                      <span className="text-[#7c3aed]">•</span> {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Resources */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(216,179,90,0.2)' }}>
              <h3 className="font-bold text-[#d8b35a] mb-4">Recommended Resources</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-[#f7f0df]/50 mb-2 uppercase">Books</div>
                  {['The Mind Illuminated — Culadasa', 'Waking Up — Sam Harris', 'Full Catastrophe Living — Jon Kabat-Zinn', 'The Miracle of Mindfulness — Thich Nhat Hanh'].map((b, i) => (
                    <div key={i} className="text-sm text-[#f7f0df]/75 mb-1">📖 {b}</div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#f7f0df]/50 mb-2 uppercase">Apps &amp; Teachers</div>
                  {['Waking Up (Sam Harris) — secular', 'Insight Timer — free guided meditations', 'S.N. Goenka — 10-day Vipassana retreats', 'Tara Brach — RAIN technique, PTSD-informed'].map((a, i) => (
                    <div key={i} className="text-sm text-[#f7f0df]/75 mb-1">🧘 {a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ProGate>
      )}
    </div>
  );
}

// ─── Full Page ────────────────────────────────────────────────────────────────

export default function MeditationPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10" style={{ background: '#07040d', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto">
        <MeditationSection />
      </div>
    </div>
  );
}
