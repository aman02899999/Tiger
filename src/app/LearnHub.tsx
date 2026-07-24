/* ---------------------------------------------------------------- */
/* Learn Hub — a landing page that organizes every learning feature:  */
/* interactive quizzes & games, reference libraries, and content.     */
/* Each card navigates to its section. No SVG.                        */
/* ---------------------------------------------------------------- */

interface Item { id: string; icon: string; label: string; desc: string }
interface Group { title: string; accent: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: "🎮 Quizzes & Games", accent: "#f97316", items: [
      { id: "doshaquiz", icon: "🧬", label: "Dosha Quiz", desc: "Discover your Ayurvedic mind-body type" },
      { id: "healthiq", icon: "🧠", label: "Health IQ Quiz", desc: "Test your health & fitness knowledge" },
      { id: "mythbuster", icon: "🎭", label: "Myth or Fact", desc: "Bust common fitness myths" },
      { id: "splitfinder", icon: "🧭", label: "Split Finder", desc: "Find your ideal training split" },
      { id: "thisorthat", icon: "⚖️", label: "This or That", desc: "Nutrition comparison game" },
      { id: "calorieguess", icon: "🔢", label: "Calorie Guess", desc: "Sharpen your calorie intuition" },
      { id: "trivia", icon: "🧠", label: "Fitness Trivia", desc: "Daily 5-question quiz" },
      { id: "brainteaser", icon: "🧩", label: "Brain Teaser", desc: "A new riddle every day" },
    ],
  },
  {
    title: "🃏 Study Tools", accent: "#fb923c", items: [
      { id: "flashcards", icon: "🃏", label: "Flashcards", desc: "Flip cards to learn key concepts" },
      { id: "glossary", icon: "📖", label: "Glossary", desc: "A–Z dictionary of fitness terms" },
    ],
  },
  {
    title: "📚 Reference Libraries", accent: "#059669", items: [
      { id: "education", icon: "🎓", label: "Education Library", desc: "In-depth articles, all domains" },
      { id: "physiolib", icon: "🦴", label: "Physiotherapy Library", desc: "Rehab & prehab protocols" },
      { id: "yogalib", icon: "🧘", label: "Yoga Library", desc: "Poses with step-by-step cues" },
      { id: "meditationlib", icon: "🧠", label: "Meditation Library", desc: "Techniques & breathwork" },
      { id: "ayurvedalib", icon: "🌿", label: "Ayurveda Library", desc: "130+ herbs, remedies & routines" },
      { id: "medicine", icon: "⚕️", label: "Medicine Library", desc: "OTC medicine & supplement guide" },
    ],
  },
  {
    title: "📰 Content & Coaching", accent: "#ea580c", items: [
      { id: "blog", icon: "📝", label: "Blog", desc: "Trending reads & tips" },
      { id: "newsletter", icon: "📧", label: "Newsletter", desc: "Weekly email digest" },
      { id: "courses", icon: "📚", label: "Courses", desc: "Structured learning paths" },
      { id: "aicoach", icon: "🤖", label: "AI Coach", desc: "Personalized guidance" },
      { id: "pdfstore", icon: "📄", label: "PDF Store", desc: "Downloadable guides" },
    ],
  },
];

export default function LearnHubPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const totalFeatures = GROUPS.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Learn Hub</h1>
        <p className="text-sm text-[#2a1e16]/68">Your knowledge center — {totalFeatures} ways to learn, test yourself, and go deeper</p>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em]" style={{ color: g.accent }}>{g.title}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((it) => (
              <button key={it.id} type="button" onClick={() => onNavigate(it.id)} className="glass-card group flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5" style={{ borderColor: `${g.accent}20` }}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl transition-transform group-hover:scale-110" style={{ background: `${g.accent}1f` }}>{it.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-black leading-tight">{it.label}</p>
                  <p className="mt-0.5 text-[12px] text-[#2a1e16]/60">{it.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Tap any card to dive in. Earn XP as you learn and test yourself.</p>
    </div>
  );
}
