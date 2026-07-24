/* ---------------------------------------------------------------- */
/* Tools Hub — a landing page organizing every calculator, generator, */
/* and tracker in the app into categorized cards. Each navigates to   */
/* its section. No SVG.                                                */
/* ---------------------------------------------------------------- */

interface Item { id: string; icon: string; label: string; desc: string }
interface Group { title: string; accent: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: "🏋️ Training Tools", accent: "#f97316", items: [
      { id: "wod", icon: "🎲", label: "Workout of the Day", desc: "Generate a full session" },
      { id: "warmup", icon: "🔥", label: "Warm-Up Generator", desc: "Tailored dynamic warm-up" },
      { id: "cooldown", icon: "🧊", label: "Cool-Down & Stretch", desc: "Targeted recovery routine" },
      { id: "splitplanner", icon: "🗓️", label: "Split Planner", desc: "Build a weekly split" },
      { id: "intervaltimer", icon: "⏱️", label: "Interval Timer", desc: "Tabata / EMOM / HIIT" },
      { id: "toolbox", icon: "🧰", label: "Fitness Toolbox", desc: "10+ pro calculators" },
    ],
  },
  {
    title: "💪 Strength Calculators", accent: "#fb923c", items: [
      { id: "strengthstandards", icon: "📊", label: "Strength Standards", desc: "Rank your lifts" },
      { id: "dots", icon: "🏆", label: "DOTS Score", desc: "Relative-strength score" },
      { id: "rpe", icon: "🎚️", label: "RPE Load Calculator", desc: "Autoregulate your loads" },
      { id: "strengthlab", icon: "🏋️", label: "Strength Lab", desc: "1RM, plates & PRs" },
    ],
  },
  {
    title: "📐 Body & Progress", accent: "#059669", items: [
      { id: "bodyfat", icon: "📏", label: "Body Fat Estimator", desc: "U.S. Navy method" },
      { id: "whr", icon: "📐", label: "Waist-to-Hip Ratio", desc: "Health-risk indicator" },
      { id: "weightgoal", icon: "🎯", label: "Weight Goal Projector", desc: "Project your finish date" },
      { id: "bodymetrics", icon: "📐", label: "Body Metrics", desc: "Track measurements" },
      { id: "vo2max", icon: "🫁", label: "VO₂ Max & Fitness Age", desc: "Estimate cardio fitness" },
    ],
  },
  {
    title: "🏃 Cardio & Heart", accent: "#0284c7", items: [
      { id: "pace", icon: "⏱️", label: "Pace Calculator", desc: "Pace & race predictions" },
      { id: "cardio", icon: "🏃", label: "Cardio & Steps", desc: "Log movement & burn" },
      { id: "hrzones", icon: "❤️", label: "Heart-Rate Zones", desc: "Your five training zones" },
      { id: "readiness", icon: "🔋", label: "Recovery Readiness", desc: "Daily readiness score" },
    ],
  },
  {
    title: "🍽️ Nutrition Tools", accent: "#ea580c", items: [
      { id: "macrobuilder", icon: "🍽️", label: "Macro Builder", desc: "Set your macro targets" },
      { id: "burnconvert", icon: "🔥", label: "Calorie Burn Converter", desc: "Work off any treat" },
      { id: "portion", icon: "✋", label: "Hand-Portion Guide", desc: "Portion without scales" },
      { id: "hydration", icon: "💧", label: "Hydration Tracker", desc: "Hit your daily water goal" },
      { id: "diet", icon: "🥗", label: "Auto Diet", desc: "Generate a diet plan" },
    ],
  },
];

export default function ToolsHubPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Tools Hub</h1>
        <p className="text-sm text-[#2a1e16]/68">Every calculator, generator &amp; tracker in one place — {total} tools</p>
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

      <p className="text-center text-[11px] text-[#2a1e16]/55">Tap any tool to open it. Many auto-fill from your profile stats.</p>
    </div>
  );
}
