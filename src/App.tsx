import { useMemo, useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { blogs, type BlogPost, type BlogBlock } from "./data/blogs";
import AdminPanel from "./admin/AdminPanel";
import SaaSApp from "./app/SaaSApp";
import { AuthProvider } from "./auth/AuthSystem";
import LegalPage, { type LegalType } from "./legal/LegalPages";
import { CoursesSection } from "./app/Courses";
import { ChallengesSection } from "./app/Challenges";

type ChecklistItem = {
  label: string;
  detail: string;
};

type ThemeKey = "ember" | "royal" | "matrix" | "tigerLife";

const launchChecklist: ChecklistItem[] = [
  {
    label: "Keep every existing feature",
    detail: "Audit screens, buttons, navigation, login, payments, workouts, plans, and settings before changing release code.",
  },
  {
    label: "Create a release build",
    detail: "Use a signed Android App Bundle with the final package name, version code, and production API keys.",
  },
  {
    label: "Pass Play policy checks",
    detail: "Add privacy policy, data safety answers, permissions notes, account deletion flow, and target SDK compliance.",
  },
  {
    label: "Prepare store assets",
    detail: "Create splash, icon, Play Store graphics, screenshots, membership banner, login preview, and Dribbble case study.",
  },
  {
    label: "Test on real devices",
    detail: "Run install, signup, workout start, notifications, purchases, offline states, and crash checks on multiple Android versions.",
  },
];

const lifeCoachSignals = ["Sleep", "Water", "Stress", "Productivity", "Fitness", "Nutrition"];

const optionAFeatures = [
  { title: "Energy Prediction Engine", tag: "82% energy", desc: "Every morning shows Today's Energy and adjusts workouts using sleep, recovery, stress, workload, and nutrition." },
  { title: "Smart Indian Food Scanner", tag: "India first", desc: "Photo scan for roti, dal, rice, sabzi, paneer, and common Indian meals with calories and macros." },
  { title: "Grocery Budget Planner", tag: "Budget smart", desc: "Create monthly grocery lists for INR 3000, 5000, 8000, or 12000 budgets." },
  { title: "Cheapest Protein Finder", tag: "Cost per gram", desc: "Rank eggs, soya chunks, milk, paneer, chicken, and whey by cost per gram protein." },
  { title: "Wedding Mode", tag: "120 day plan", desc: "Select wedding in 120 days and generate a full transformation roadmap." },
  { title: "Travel Mode", tag: "On the road", desc: "Auto-switch to hotel workouts, bodyweight workouts, and restaurant food guidance." },
  { title: "Sleep Debt Tracker", tag: "7 hours debt", desc: "Calculate sleep debt, then reduce training volume and recommend recovery." },
  { title: "Gym Crowd Predictor", tag: "Low crowd", desc: "Predict gym occupancy by time and show low, medium, or high crowd levels." },
  { title: "Health Risk Prediction", tag: "Disclaimer ready", desc: "Estimate obesity, diabetes, and blood pressure risk with clear medical disclaimer." },
  { title: "Damage Control Mode", tag: "No guilt", desc: "After junk food, give calm fixes like walk 30 minutes and reduce 200 calories tomorrow." },
  { title: "Medical Report Analyzer", tag: "AI explanation", desc: "Explain blood test, lipid profile, and CBC reports with normal and improvement areas." },
  { title: "Progress Recognition", tag: "Photo AI", desc: "Detect waist reduction, chest improvement, posture change from photos." },
  { title: "Posture Analysis", tag: "Form health", desc: "Detect rounded shoulders, forward head, and pelvic tilt, then suggest corrections." },
  { title: "Smart Hydration Coach", tag: "Dynamic water", desc: "Adjust water target using weather, weight, and daily activity." },
  { title: "Metabolic Age", tag: "30 to 24", desc: "Show actual age versus metabolic age to keep users motivated." },
  { title: "Restaurant Survival Mode", tag: "Eat out smart", desc: "Enter McDonald's, KFC, Domino's, or restaurant name and get best choices." },
  { title: "Supplement Stack Builder", tag: "Goal stack", desc: "Build goal-based supplement plans for fat loss, muscle gain, strength, recovery." },
  { title: "Achievement System", tag: "Retention", desc: "Unlock Protein Master, Hydration King, Consistency Beast, Fat Loss Warrior badges." },
  { title: "Family Health Dashboard", tag: "Family plan", desc: "Track parents, spouse, and kids from one account." },
  { title: "Mental Fitness Score", tag: "Mind plus body", desc: "Track mood, stress, anxiety, and energy alongside workouts." },
  { title: "Fitness Expense Tracker", tag: "Money clarity", desc: "Track supplements, gym fees, coaching, and equipment investments." },
  { title: "Meal Replacement Finder", tag: "Food backup", desc: "When preferred food is not available, suggest instant alternatives matching macros." },
  { title: "Auto Refeed Planner", tag: "Advanced diet", desc: "Detect diet fatigue and recommend controlled refeed day before adherence drops." },
  { title: "Transformation Forecast", tag: "Future view", desc: "Show expected weight in 30 days and body fat in 90 days on visual timeline." },
  { title: "Injury Risk Predictor", tag: "Safety AI", desc: "Warn users before overtraining by watching sleep debt, soreness, workload, recovery." },
  { title: "Voice Fitness Coach", tag: "Voice AI", desc: "Ask what should I eat now and get instant AI guidance." },
  { title: "Fitness GPS", tag: "Roadmap", desc: "Show roadmap from current weight to goal weight with milestones." },
  { title: "Accountability Partner AI", tag: "Daily coach", desc: "Daily check-ins that say what was missed and how to fix it today without guilt." },
];

const premiumThemes: Record<ThemeKey, { name: string; glow: string; accent: string; label: string }> = {
  ember: { name: "Tiger Ember", glow: "from-orange-400 via-rose-500 to-violet-700", accent: "bg-orange-300", label: "Play Store launch" },
  royal: { name: "Royal Violet", glow: "from-fuchsia-400 via-violet-500 to-sky-500", accent: "bg-fuchsia-300", label: "Premium SaaS mode" },
  matrix: { name: "Neon Lift", glow: "from-lime-300 via-emerald-400 to-cyan-500", accent: "bg-emerald-300", label: "Growth analytics" },
  tigerLife: { name: "Tiger Life Coach", glow: "from-violet-300 via-fuchsia-500 to-[#d8b35a]", accent: "bg-violet-300", label: "Lifestyle OS" },
};

/* Dashboard data available for expansion */

const heroStats = [
  { number: "50K+", label: "Active Users" },
  { number: "28", label: "AI Features" },
  { number: "4.9★", label: "Play Store Rating" },
  { number: "99%", label: "Uptime SLA" },
];

const howItWorks = [
  { step: "01", title: "Download & Set Up", desc: "Sign up in 30 seconds. Enter your goal, current stats, and lifestyle data. The Tiger Life Coach learns you instantly.", icon: "🐅" },
  { step: "02", title: "Get Your AI Plan", desc: "Receive personalized workout, nutrition, sleep, hydration, and stress management plan — every morning, adjusted for today's energy.", icon: "🧠" },
  { step: "03", title: "Scan & Track", desc: "Snap photos of Indian food for instant macros. Log workouts, sleep, and moods. The AI adapts in real time.", icon: "📸" },
  { step: "04", title: "Transform Together", desc: "Watch your Tiger Score climb. Unlock achievements. Share family health dashboard. Reach your goal with an accountability partner AI.", icon: "🏆" },
];

const testimonials = [
  { name: "Rohit S.", role: "Lost 22kg · Mumbai", text: "Beast Calculator ne meri life badal di! 4 mahine mein pehchaana nahi jata ab. Indian meal plan ekdum sahi tha!", avatar: "RS" },
  { name: "Ananya K.", role: "Lost 15kg · Delhi", text: "Pehli baar kisi app ne mujhe Indian foods ka proper macro breakdown diya. Dal, roti, sabzi sab ka calculation!", avatar: "AK" },
  { name: "Siddharth M.", role: "+14kg Muscle · Pune", text: "Royal Pro ki 7-day meal plan follow ki. 6 mahine mein 14kg lean mass gain! Chawal aur paneer se!", avatar: "SM" },
  { name: "Deepika R.", role: "Lost 18kg · Bangalore", text: "Body anatomy visualizer dekh ke samajh aaya mera body fat kitna tha. Streak system amazing hai!", avatar: "DR" },
  { name: "Amit P.", role: "Athlete · Chennai", text: "₹499 mein itna sab kuch? Yaar ye toh London ka subscription bhi sharminda ho jaye iske samne!", avatar: "AP" },
  { name: "Priyanka N.", role: "Lost 12kg · Hyderabad", text: "Before/after photos feature bahut emotional tha. 3 mahine baad apna photo dekha toh bilkul alag tha!", avatar: "PN" },
  { name: "Kartik B.", role: "Lost 25kg · Kolkata", text: "Chawal, roti, sabzi sab ka calorie count! Finally ek app jo samajhta hai Indian eating. Game changer!", avatar: "KB" },
  { name: "Vijay G.", role: "+20kg Bulk · Jaipur", text: "Doodh, paneer, eggs, chicken — sabka proper plan. 8 mahine mein 20kg muscle gain! Beast level!", avatar: "VG" },
];

const faqs = [
  { q: "Is Tiger Fitness Pro free?", a: "Basic features are free forever. Premium Elite membership unlocks AI coaching, medical report analysis, family dashboard, wedding mode, voice coach, and 28+ advanced features starting at ₹199/month." },
  { q: "How does Indian food scanner work?", a: "Our AI model was trained specifically on common Indian dishes — roti, dal, rice, sabzi, paneer, idli, dosa, biryani, and more. Just take a photo and get calories, protein, carbs, and fat estimates instantly." },
  { q: "What is Energy Prediction Engine?", a: "Every morning, we analyze your sleep quality, stress levels, recent training load, nutrition, and recovery status. We give you a Today's Energy percentage and automatically adjust your workout intensity accordingly." },
  { q: "Can my whole family use it?", a: "Yes! Our Family Health Dashboard lets you track parents, spouse, and children under one account. Each person gets personalized recommendations while you see everyone's health overview." },
  { q: "Is health risk prediction accurate?", a: "Our predictions are based on lifestyle patterns, not medical diagnostics. They provide early warnings but come with clear disclaimers stating they do not replace professional medical advice. Always consult your doctor." },
  { q: "Does it work offline?", a: "Core tracking features work offline. AI food scanning, voice coaching, and real-time analytics require internet connection. Downloaded workouts function fully without connectivity." },
  { q: "What makes it different from other apps?", a: "Most apps only track workouts. We track your complete lifestyle — sleep, stress, productivity, food, expenses, family health, injury prevention, mental wellness, and more. One dashboard for everything." },
];

const pricingPlans = [
  { name: "Free", price: "₹0", period: "forever", description: "Start your fitness journey", features: ["Beast Score Calculator (0–100)", "BMI, BMR & TDEE Calculator", "Body Fat % Estimator", "Leaderboard Access", "WOD (Workout of the Day)", "Courses & Knowledge Store"], cta: "Get Started Free", popular: false },
  { name: "Royal Pro", price: "₹499", period: "/month", description: "For serious transformations", features: ["Full 7-Day Indian Meal Plan", "50+ Veg & Non-Veg Foods", "12-Week Transformation Roadmap", "Progress Charts & Weight Graph", "Blood Report Analyser (20+ markers)", "108+ Expert PDF Guides", "10 Certification Courses", "Before/After Photo Upload"], cta: "Start Pro — ₹499/mo", popular: true },
  { name: "Royal Elite", price: "₹1,999", period: "/month", description: "1-on-1 personal coaching", features: ["Everything in Royal Pro", "1-on-1 Personal Trainer Sessions", "Custom Diet Plan by Nutritionist", "Weekly Check-in Calls", "Priority Support & WhatsApp Access", "Monthly Body Composition Analysis", "Exclusive Elite Badge", "Early Access to New Features"], cta: "Go Elite — ₹1999/mo", popular: false },
];

/* ---------------------------------------------------------------- */
/* Components                                                        */
/* ---------------------------------------------------------------- */

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "#hero", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#features", label: "Features" },
    { href: "#blog", label: "Blog" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Reviews" },
    { href: "#faq", label: "FAQ" },
    { href: "#download", label: "Download" },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#07040d]/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#hero" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] font-black text-[#090511] shadow-[0_0_44px_rgba(167,139,250,0.48)]">TF</div>
          <span className="hidden text-sm font-semibold uppercase tracking-[0.32em] text-[#f7f0df]/90 sm:block">Tiger Fitness Pro</span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/10 text-[#f7f0df]/60 hover:text-[#f7f0df]">{link.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a href="#download" className="hidden rounded-full border border-violet-300/30 bg-violet-300/15 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-violet-50 backdrop-blur transition hover:bg-violet-300/25 sm:inline-block">Download Now</a>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/14 text-white/70 lg:hidden">
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#07040d]/95 px-6 pb-6 pt-4 backdrop-blur-2xl lg:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-base font-medium text-[#f7f0df]/78 hover:bg-white/10">{link.label}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative isolate min-h-screen overflow-hidden pt-20">
      <img src="/images/tiger-fitness-luxury-hero.jpg" alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-55 saturate-125 motion-safe:animate-[slowZoom_18s_ease-in-out_infinite_alternate]" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(167,139,250,0.45),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(216,179,90,0.14),transparent_27%),linear-gradient(110deg,rgba(7,4,13,0.98)_0%,rgba(45,17,83,0.78)_48%,rgba(7,4,13,0.52)_100%)]" />
      <div className="absolute inset-0 opacity-28 [background-image:linear-gradient(rgba(247,240,223,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(247,240,223,0.08)_1px,transparent_1px)] [background-size:72px_72px] motion-safe:animate-[gridDrift_26s_linear_infinite]" />
      <div className="absolute left-[-15%] top-[12%] h-72 w-72 rounded-full bg-violet-400/30 blur-3xl motion-safe:animate-[floatGlow_9s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-12%] right-[-8%] h-96 w-96 rounded-full bg-violet-700/35 blur-3xl motion-safe:animate-[floatGlow_11s_ease-in-out_infinite_reverse]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 sm:px-10 lg:px-16">
        <div className="flex flex-1 items-center py-16 lg:py-20">
          <div className="max-w-4xl motion-safe:animate-[fadeUp_900ms_ease-out_both]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/22 bg-violet-200/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.8)] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Now on Play Store</span>
            </div>

            <h1 className="bg-gradient-to-br from-[#f7f0df] via-violet-100 to-[#d8b35a] bg-clip-text text-6xl font-black leading-[0.92] tracking-[-0.07em] text-transparent sm:text-7xl lg:text-8xl xl:text-9xl">
              Train Smarter.<br />Transform Faster.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#f7f0df]/76 sm:text-xl sm:leading-9">
              Most fitness apps only track workouts. <span className="font-semibold text-violet-100">Tiger Fitness Pro</span> improves your entire lifestyle — sleep, nutrition, stress, family health, and more. One AI-powered dashboard.
            </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href="#app" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_22px_80px_rgba(167,139,250,0.36)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_110px_rgba(167,139,250,0.48)]">
                <span className="relative z-10 flex items-center gap-3">
                  🚀 Launch Web App
                </span>
              </a>
              <a href="#features" className="inline-flex items-center justify-center rounded-full border border-[#f7f0df]/20 bg-[#f7f0df]/8 px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] text-[#f7f0df] ring-1 ring-[#f7f0df]/12 backdrop-blur transition hover:bg-[#f7f0df]/14">Explore Features →</a>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {heroStats.map((stat, i) => (
                <div key={stat.label} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/6 p-5 backdrop-blur-xl motion-safe:animate-[fadeUp_800ms_ease-out_both]" style={{ animationDelay: i * 120 + "ms" }}>
                  <p className="text-2xl font-black tracking-[-0.06em] text-[#f7f0df]">{stat.number}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[#f7f0df]/44">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pb-8 h-px max-w-xl overflow-hidden bg-[#f7f0df]/10">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-violet-200 to-transparent motion-safe:animate-[scanLine_3.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}

const SIGNAL_VALUES = lifeCoachSignals.map(() => ({
  width: Math.floor(65 + Math.random() * 30),
  score: Math.floor(70 + Math.random() * 28),
}));

function About() {
  const [theme, setTheme] = useState<ThemeKey>("tigerLife");
  const activeTheme = premiumThemes[theme];
  const isActive = (key: ThemeKey) => theme === key;

  return (
    <section id="about" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(167,139,250,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="motion-safe:animate-[fadeUp_900ms_ease-out_both]">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Why Tiger?</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Not just a fitness app.<br />
              <span className="bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-transparent">Your life operating system.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#f7f0df]/68">
              Tiger Fitness Pro combines AI-powered coaching with India-first intelligence. From wedding transformations to family health dashboards, from Indian food scanning to damage control after cheat meals — we cover the entire lifestyle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {(Object.keys(premiumThemes) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={"rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition " +
                    (isActive(key) ? ("bg-gradient-to-r " + activeTheme.glow + " text-white shadow-[0_0_36px_rgba(255,255,255,0.25)]") : "border border-white/15 bg-white/[0.04] text-white/68 hover:border-violet-300/60")}
                >
                  {premiumThemes[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md motion-safe:animate-[fadeUp_900ms_ease-out_both]" style={{ animationDelay: "200ms" }}>
            <div className="absolute -inset-10 rounded-[3rem] bg-violet-400/18 blur-3xl motion-safe:animate-[floatGlow_8s_ease-in-out_infinite]" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[#f7f0df]/12 bg-[#0b0714]/88 p-6 shadow-[0_35px_140px_rgba(75,28,143,0.42)] backdrop-blur-2xl">
              <div className={"absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-300 via-fuchsia-500 to-[#d8b35a]"} />
              <div className={"absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br " + activeTheme.glow + " opacity-30 blur-3xl motion-safe:animate-[floatGlow_8s_ease-in-out_infinite]"} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7f0df]/44">Today's summary</p>
                    <p className="mt-2 text-3xl font-black text-[#f7f0df]">{activeTheme.name}</p>
                  </div>
                  <div className={"grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br " + activeTheme.glow} />
                </div>
                <div className="mt-7 space-y-4">
                  {lifeCoachSignals.map((signal, i) => (
                    <div key={signal} className="flex items-center justify-between rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/6 p-4">
                      <span className="text-sm font-semibold text-[#f7f0df]/78">{signal}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-[#f7f0df]/10">
                          <div className={"h-full rounded-full bg-gradient-to-r " + activeTheme.glow + " motion-safe:animate-[shineMove_2.8s_ease-in-out_infinite]"} style={{ width: SIGNAL_VALUES[i].width + "%" }} />
                        </div>
                        <span className="w-7 text-right text-xs font-bold text-violet-100">{SIGNAL_VALUES[i].score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const [filter, setFilter] = useState<"all" | "ai" | "india" | "health" | "social">("all");

  const filterMap: Record<string, string[]> = {
    ai: ["Energy Prediction Engine", "Smart Indian Food Scanner", "Medical Report Analyzer", "Progress Recognition", "Posture Analysis", "Injury Risk Predictor", "Voice Fitness Coach"],
    india: ["Smart Indian Food Scanner", "Grocery Budget Planner", "Cheapest Protein Finder", "Wedding Mode", "Restaurant Survival Mode"],
    health: ["Health Risk Prediction", "Medical Report Analyzer", "Posture Analysis", "Metabolic Age", "Sleep Debt Tracker", "Injury Risk Predictor", "Auto Refeed Planner"],
    social: ["Family Health Dashboard", "Achievement System", "Accountability Partner AI", "Mental Fitness Score"],
  };

  const filteredFeatures = filter === "all" ? optionAFeatures : optionAFeatures.filter(f => filterMap[filter]?.includes(f.title));

  const filters = [
    { key: "all" as const, label: "All Features" },
    { key: "ai" as const, label: "AI Powered" },
    { key: "india" as const, label: "India First" },
    { key: "health" as const, label: "Health Intelligence" },
    { key: "social" as const, label: "Social & Gamified" },
  ];

  return (
    <section id="features" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">28+ Premium Features</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">Everything you need to transform.</h2>
          <p className="mt-6 text-lg leading-8 text-[#f7f0df]/62">From Indian food scanning to wedding roadmaps. From family health to voice coaching.</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {filters.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={"rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition " + (filter === f.key ? "bg-violet-200/20 text-violet-50 ring-1 ring-violet-200/30" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/54 hover:bg-[#f7f0df]/10")}>{f.label}</button>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-[1.6rem] border border-[#f7f0df]/10 bg-black/18 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200/35 hover:bg-violet-200/8"
              style={{ animationDelay: index * 40 + "ms" }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 rounded-xl bg-violet-200/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-100/78">{feature.tag}</span>
                <span className="text-sm font-black text-[#f7f0df]/24">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h4 className="mt-5 text-xl font-black tracking-[-0.03em] text-[#f7f0df] group-hover:text-violet-100 transition-colors">{feature.title}</h4>
              <p className="mt-3 text-sm leading-6 text-[#f7f0df]/58">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-[#d8b35a]/18 bg-[#d8b35a]/8 p-6 backdrop-blur-xl">
          <p className="text-sm font-bold text-[#d8b35a]">Medical disclaimer</p>
          <p className="mt-2 text-sm leading-7 text-[#f7f0df]/62">Health risk predictions, medical report analysis, posture analysis, injury risk warnings, and metabolic age are wellness guidance tools only. They do not replace professional medical advice. Always consult a doctor.</p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(167,139,250,0.14),transparent_32%),radial-gradient(circle_at_82%_58%,rgba(216,179,90,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">How It Works</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">4 steps to your best self.</h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:gap-10">
          {howItWorks.map((item, index) => (
            <div
              key={item.step}
              className="group relative rounded-[2rem] border border-[#f7f0df]/12 bg-[#0b0714]/70 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200/30 hover:bg-[#0b0714]/90"
              style={{ animationDelay: index * 150 + "ms" }}
            >
              <div className="flex items-start gap-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-violet-300/20 via-fuchsia-400/15 to-[#d8b35a]/15 border border-violet-200/20 text-3xl shadow-[0_0_36px_rgba(167,139,250,0.15)]">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.34em] text-violet-200/70">{item.step}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#f7f0df] group-hover:text-violet-100 transition-colors">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#f7f0df]/58">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const annualPrices: Record<string, string> = { Free: "₹0", Pro: "₹119", "Elite Family": "₹239" };

function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Pricing</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">One plan for your goal.</h2>
          <p className="mt-6 text-lg leading-8 text-[#f7f0df]/62">Cancel anytime. Start free, upgrade when ready.</p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-violet-200/8 px-5 py-2.5">
            <span className={"text-sm font-semibold transition " + (!annual ? "text-violet-100" : "text-[#f7f0df]/44")}>Monthly</span>
            <button type="button" onClick={() => setAnnual(!annual)} className={"relative h-7 w-[52px] rounded-full transition-colors duration-200 " + (annual ? "bg-violet-300" : "bg-[#f7f0df]/18")}>
              <span className={"absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 " + (annual ? "translate-x-[28px]" : "translate-x-1")} />
            </button>
            <span className={"text-sm font-semibold transition " + (annual ? "text-violet-100" : "text-[#f7f0df]/44")}>Annual (Save 40%)</span>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isFree = plan.price === "₹0";
            const displayPrice = (annual && !isFree) ? annualPrices[plan.name] : plan.price;
            const displayPeriod = isFree ? "forever" : annual ? "/mo, billed yearly" : "/month";
            return (
            <div key={plan.name} className={"relative rounded-[2rem] border p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 " + (plan.popular ? "border-violet-300/40 bg-violet-200/10 shadow-[0_0_60px_rgba(167,139,250,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]" : "border-[#f7f0df]/12 bg-[#0b0714]/60")}>
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 px-5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg">Most Popular</div>}

              <h3 className="text-2xl font-black text-[#f7f0df]">{plan.name}</h3>
              <p className="mt-2 text-sm text-[#f7f0df]/52">{plan.description}</p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-black tracking-[-0.06em] text-[#f7f0df]">{displayPrice}</span>
                <span className="pb-2 text-base font-medium text-[#f7f0df]/48">{displayPeriod}</span>
              </div>

              <a href="#download" className={"mt-8 block rounded-full py-4 text-center text-sm font-black uppercase tracking-[0.18em] transition " + (plan.popular ? "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-600 text-white shadow-[0_16px_60px_rgba(167,139,250,0.3)] hover:shadow-[0_22px_80px_rgba(167,139,250,0.4)]" : "border border-[#f7f0df]/18 bg-[#f7f0df]/8 text-[#f7f0df] hover:bg-[#f7f0df]/14")}>{plan.cta}</a>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-[#f7f0df]/68">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Testimonials</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">Real stories. Real results.</h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-[2rem] border border-[#f7f0df]/12 bg-[#0b0714]/60 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200/25">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (<span key={i} className="text-[#d8b35a] text-lg">&#9733;</span>))}
              </div>
              <p className="text-base leading-7 italic text-[#f7f0df]/74">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-6 flex items-center gap-4 border-t border-[#f7f0df]/10 pt-5">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">{t.avatar}</div>
                <div>
                  <p className="font-bold text-[#f7f0df]">{t.name}</p>
                  <p className="text-xs font-medium text-[#f7f0df]/44">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">FAQ</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Questions? Answered.</h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="overflow-hidden rounded-[1.4rem] border border-[#f7f0df]/10 bg-[#0b0714]/60 backdrop-blur-xl transition-all duration-300">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left"
              >
                <span className="text-base font-bold text-[#f7f0df]">{faq.q}</span>
                <span className={"shrink-0 h-8 w-8 grid place-items-center rounded-full border transition-transform duration-300 " + (openIndex === index ? "rotate-180 border-violet-300 bg-violet-300/20" : "border-[#f7f0df]/16 bg-[#f7f0df]/5")}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </button>
              <div className={"grid transition-all duration-300 ease-out " + (openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm leading-7 text-[#f7f0df]/58">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadCTA() {
  const [checked, setChecked] = useState<number[]>([0]);
  const progress = useMemo(() => Math.round((checked.length / launchChecklist.length) * 100), [checked.length]);

  function toggleItem(index: number) {
    setChecked((current) => current.includes(index) ? current.filter((i) => i !== index) : [...current, index]);
  }

  return (
    <section id="download" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.18),transparent_48%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/22 bg-violet-200/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.8)] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Available on Play Store</span>
          </div>
          <h2 className="text-5xl font-black tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            Ready to transform<br />
            <span className="bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-transparent">your lifestyle?</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#f7f0df]/66">Download Tiger Fitness Pro. Join 50K+ Indians already transforming with our AI Life Coach.</p>
          
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#app" className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-9 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_22px_80px_rgba(167,139,250,0.36)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_110px_rgba(167,139,250,0.48)]">
              🚀 Launch Web App (Free)
            </a>
            <a href="#app" className="flex items-center gap-3 rounded-full border border-[#f7f0df]/20 bg-[#f7f0df]/8 px-9 py-5 text-sm font-bold uppercase tracking-[0.2em] text-[#f7f0df] ring-1 ring-[#f7f0df]/12 backdrop-blur transition hover:bg-[#f7f0df]/14">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M17.581 23.187c-.396.225-.753.27-1.144.158l-6.387-2.91c-.42-.192-.666-.567-.71-1.02v-14.785c.05-.456.295-.83.72-1.026l6.377-2.91c.39-.108.75-.064 1.146.157a1.74 1.74 0 01.79 1.467l.005 19.403a1.74 1.74 0 01-.797 1.466zM4.097 23.188A1.77 1.77 0 013.3 21.73V2.323A1.77 1.77 0 014.097.86C4.493.64 4.85.597 5.24.705l6.387 2.91c.42.196.666.57.714 1.026V19.43c-.048.452-.294.826-.714 1.018l-6.387 2.91c-.39.112-.747.067-1.143-.168z"/></svg>
              Get Android App
            </a>
          </div>
        </div>

        <div className="mt-20 rounded-[2rem] border border-[#f7f0df]/12 bg-[#0b0714]/60 p-8 backdrop-blur-xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Release Readiness</p>
              <h3 className="mt-3 text-3xl font-black text-[#f7f0df]">Play Store Checklist</h3>
            </div>
            <div className="min-w-44">
              <div className="mb-3 flex justify-between text-sm font-semibold text-[#f7f0df]/74"><span>Ready</span><span>{progress}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#f7f0df]/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-[#d8b35a] transition-all duration-500" style={{ width: progress + "%" }} />
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-3">
            {launchChecklist.map((item, index) => {
              const isChecked = checked.includes(index);
              return (
                <button key={item.label} type="button" onClick={() => toggleItem(index)} className="group flex items-start gap-4 rounded-2xl border-t border-[#f7f0df]/10 py-4 text-left transition hover:border-violet-200/40">
                  <span className={"mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm transition " + (isChecked ? "border-violet-200 bg-violet-200 text-[#14050a]" : "border-[#f7f0df]/24 text-[#f7f0df]/60 group-hover:border-violet-200")}>{isChecked ? "\u2713" : index + 1}</span>
                  <div>
                    <span className="block text-lg font-bold text-[#f7f0df]">{item.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#f7f0df]/54">{item.detail}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlockRenderer({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return <p className="text-base leading-7 text-[#f7f0df]/74">{block.text}</p>;
    case "h2":
      return <h2 className="mt-8 text-2xl font-black tracking-[-0.04em] text-[#f7f0df] first:mt-0">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-6 text-xl font-bold text-[#f7f0df]">{block.text}</h3>;
    case "ul":
      return (
        <ul className="mt-3 space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[#f7f0df]/72">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-3 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={item} className="flex items-start gap-3 text-[#f7f0df]/72">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-200/15 text-[10px] font-black text-violet-100">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "stat":
      return (
        <div className="my-6 inline-flex items-baseline gap-3 rounded-2xl border border-violet-200/18 bg-violet-200/8 px-5 py-3">
          <span className="text-3xl font-black tracking-[-0.06em] bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-transparent">{block.value}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f7f0df]/54">{block.label}</span>
        </div>
      );
    case "tip":
      return (
        <div className="my-6 rounded-2xl border border-[#d8b35a]/18 bg-[#d8b35a]/8 p-5">
          <p className="text-sm font-bold text-[#d8b35a] mb-1">Tiger Tip</p>
          <p className="text-sm leading-7 text-[#f7f0df]/70">{block.text}</p>
        </div>
      );
    case "cta":
      return (
        <div className="my-8 rounded-[2rem] border border-violet-300/30 bg-gradient-to-br from-violet-200/12 to-fuchsia-400/8 p-8 backdrop-blur-xl">
          <p className="text-2xl font-black text-[#f7f0df]">{block.title}</p>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#f7f0df]/66">{block.subtitle}</p>
          <a href="#download" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-7 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_60px_rgba(167,139,250,0.3)] transition-all hover:-translate-y-0.5">
            Download Tiger Fitness Pro
          </a>
        </div>
      );
    case "faq":
      return (
        <details className="group mt-3 rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5 open:bg-violet-200/6 transition-colors">
          <summary className="cursor-pointer list-none text-base font-bold text-[#f7f0df] flex justify-between items-center gap-3">
            {block.q}
            <span className="h-6 w-6 grid place-items-center rounded-full bg-violet-200/12 text-violet-100 group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="mt-4 text-sm leading-7 text-[#f7f0df]/66">{block.a}</p>
        </details>
      );
    default:
      return null;
  }
}

function BlogViewer({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#07040d]/96 backdrop-blur-2xl">
      <button type="button" onClick={onClose} className="fixed right-6 top-6 z-10 grid h-12 w-12 place-items-center rounded-full border border-violet-200/20 bg-[#0b0714] text-[#f7f0df] transition hover:bg-violet-200/15">
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      
      <article className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <a href="#blog" onClick={onClose} className="text-sm font-semibold text-violet-100 hover:underline">← Back to Blog</a>
          <span className="rounded-full bg-violet-200/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">{post.category}</span>
          <span className="text-xs text-[#f7f0df]/44">{post.readTime}</span>
          <span className="text-xs text-[#f7f0df]/44">{post.date}</span>
        </div>
        
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-violet-200/15">
          {post.heroImage ? (
            <img
              src={post.heroImage}
              alt={post.heroImageAlt || post.title}
              loading="eager"
              width={1200}
              height={630}
              className="h-56 w-full object-cover sm:h-72 md:h-96"
            />
          ) : (
            <div className="grid h-56 place-items-center bg-gradient-to-br from-violet-200/20 via-fuchsia-400/10 to-[#d8b35a]/10 text-[10rem] sm:h-72 md:h-96">
              {post.heroEmoji}
            </div>
          )}
        </div>
        
        <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.06em] text-[#f7f0df] sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[#f7f0df]/62">{post.seoDescription}</p>
        
        <div className="mt-6 flex items-center gap-3 border-y border-[#f7f0df]/10 py-5">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">{post.author.split(" ").map(n => n[0]).slice(-2).join("")}</div>
          <div>
            <p className="text-sm font-bold text-[#f7f0df]">{post.author}</p>
            <p className="text-xs text-[#f7f0df]/44">{post.date} · {post.readTime}</p>
          </div>
        </div>
        
        <div className="mt-8 space-y-3">
          {post.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
        </div>
        
        <div className="mt-12 rounded-[2rem] border border-violet-200/18 bg-violet-200/6 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100/70 mb-4">Frequently Asked Questions</p>
          <div className="space-y-3">
            {post.faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5 open:bg-violet-200/6 transition-colors">
                <summary className="cursor-pointer list-none text-sm font-bold text-[#f7f0df] flex justify-between items-center gap-3">
                  {faq.q}
                  <span className="h-6 w-6 grid place-items-center rounded-full bg-violet-200/12 text-violet-100 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[#f7f0df]/66">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        
        <div className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[#f7f0df]/14 bg-[#f7f0df]/5 px-3 py-1.5 text-xs font-semibold text-[#f7f0df]/54">#{tag.toLowerCase().replace(/\s+/g, "")}</span>
          ))}
        </div>
      </article>
    </div>
  );
}

function BlogSection() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  
  const categories = ["All", ...Array.from(new Set(blogs.map((b) => b.category)))];
  
  const filteredBlogs = blogs.filter((b) => {
    const matchesCategory = filter === "All" || b.category === filter;
    const matchesSearch = search === "" || b.title.toLowerCase().includes(search.toLowerCase()) || b.seoDescription.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const featured = blogs[0];

  if (activePost) {
    return <BlogViewer post={activePost} onClose={() => setActivePost(null)} />;
  }

  return (
    <section id="blog" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,0.14),transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">The Tiger Blog</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">Fitness knowledge for modern Indians.</h2>
          <p className="mt-6 text-lg leading-8 text-[#f7f0df]/62">20+ expert articles on nutrition, workouts, lifestyle, and performance marketing insights.</p>
        </div>

        <div className="mt-12 rounded-[2rem] border border-violet-200/18 bg-[#0b0714]/70 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-2xl border border-[#f7f0df]/12 bg-[#f7f0df]/5 px-5 py-3">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[#f7f0df]/40"><circle cx={11} cy={11} r={7}/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent text-sm text-[#f7f0df] outline-none placeholder:text-[#f7f0df]/34"
            />
          </div>
        </div>

        <button type="button" onClick={() => setActivePost(featured)} className="group relative mt-8 block w-full overflow-hidden rounded-[2.2rem] border border-violet-200/20 bg-gradient-to-br from-violet-200/12 via-fuchsia-400/8 to-[#d8b35a]/8 backdrop-blur-xl text-left transition-all hover:-translate-y-1 hover:border-violet-200/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(167,139,250,0.18),transparent_50%)]" />
          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:pr-4">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white">Featured Article</span>
                <span className="rounded-full bg-[#f7f0df]/10 px-3 py-1.5 text-xs font-semibold text-[#f7f0df]/68">{featured.category}</span>
                <span className="text-xs text-[#f7f0df]/50">{featured.readTime}</span>
              </div>
              <h3 className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#f7f0df] sm:text-4xl lg:text-5xl">{featured.title}</h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#f7f0df]/62">{featured.seoDescription}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">{featured.author.split(" ").map(n => n[0]).slice(-2).join("")}</div>
                <span className="text-sm text-[#f7f0df]/68">{featured.author} · {featured.date}</span>
              </div>
            </div>
            <div className="relative min-h-[240px] overflow-hidden lg:min-h-full">
              {featured.heroImage ? (
                <img
                  src={featured.heroImage}
                  alt={featured.heroImageAlt || featured.title}
                  loading="eager"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-[#0b0714]/60 text-8xl border-t border-violet-200/15">
                  {featured.heroEmoji}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07040d]/90 via-[#07040d]/30 to-transparent lg:bg-gradient-to-l" />
            </div>
          </div>
        </button>

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setFilter(cat)} className={"rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition " + (filter === cat ? "bg-violet-200/20 text-violet-50 ring-1 ring-violet-200/30" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/54 hover:bg-[#f7f0df]/10")}>{cat}</button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBlogs.map((post) => (
            <article key={post.slug} className="group relative overflow-hidden rounded-[1.8rem] border border-[#f7f0df]/10 bg-[#0b0714]/60 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200/30 hover:bg-[#0b0714]/90">
              <button type="button" onClick={() => setActivePost(post)} className="block h-full w-full p-6">
                <div className="relative mb-5 h-40 -mx-6 -mt-6 overflow-hidden">
                  {post.heroImage ? (
                    <img
                      src={post.heroImage}
                      alt={post.heroImageAlt || post.title}
                      loading="lazy"
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-200/15 via-fuchsia-400/10 to-[#d8b35a]/10 text-7xl">
                      {post.heroEmoji}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0714] via-[#0b0714]/40 to-transparent" />
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-200/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-100/78">{post.category}</span>
                  <span className="text-[10px] font-semibold text-[#f7f0df]/40">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-black leading-[1.15] tracking-[-0.02em] text-[#f7f0df] group-hover:text-violet-100 transition-colors">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#f7f0df]/54">{post.seoDescription}</p>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-violet-100/60 group-hover:text-violet-100 transition-colors">
                  Read article <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogImageGallery() {
  const imageBlogs = blogs.filter((b) => b.heroImage).slice(0, 8);
  return (
    <section className="relative px-6 py-16 sm:px-10 lg:px-16">
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">AI Visual Gallery</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Premium visuals for every guide.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#f7f0df]/54">Every featured article includes an AI-generated image optimized for fast loading, mobile responsiveness, and accessibility.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {imageBlogs.map((post) => (
            <figure key={post.slug} className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-[#f7f0df]/10 bg-[#0b0714]/60">
              <img
                src={post.heroImage}
                alt={post.heroImageAlt || post.title}
                loading="lazy"
                width={400}
                height={500}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07040d]/95 via-[#07040d]/20 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <span className="mb-2 inline-block rounded-full bg-violet-200/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-violet-100">{post.category}</span>
                <p className="line-clamp-2 text-sm font-bold leading-snug text-[#f7f0df]">{post.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#f7f0df]/34">All images AI-generated · Lazy loaded · SEO-optimized alt text · Web-ready JPEG</p>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "subscribers", email.toLowerCase()), {
        email: email.toLowerCase(),
        subscribedAt: new Date().toISOString(),
        source: "landing_page",
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // still show success to user
    }
    setLoading(false);
  }

  return (
    <section className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-violet-200/25 bg-gradient-to-br from-violet-200/14 via-fuchsia-400/10 to-[#d8b35a]/8 p-10 backdrop-blur-xl sm:p-14">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl motion-safe:animate-[floatGlow_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#d8b35a]/15 blur-3xl motion-safe:animate-[floatGlow_9s_ease-in-out_infinite_reverse]" />
        <div className="relative text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Weekly Newsletter</p>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-5xl">Get free fitness tips in your inbox.</h2>
          <p className="mt-5 text-base leading-7 text-[#f7f0df]/66">One email per week. Workouts, Indian diet charts, science, and exclusive discounts. No spam, ever.</p>
          {submitted ? (
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-emerald-300/30 bg-emerald-300/12 px-6 py-4 text-emerald-200">
              <span className="text-xl">🐅</span>
              <span className="font-bold">You're in! Check your inbox for a welcome gift.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="flex-1 rounded-full border border-[#f7f0df]/14 bg-[#f7f0df]/8 px-6 py-4 text-sm text-[#f7f0df] placeholder:text-[#f7f0df]/34 outline-none focus:border-violet-200/40"/>
              <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_60px_rgba(167,139,250,0.35)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
                {loading ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          <p className="mt-5 text-xs text-[#f7f0df]/34">Join 12,000+ Indians. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}

function Footer({ onAdminClick }: { onAdminClick: () => void }) {
  const footerLinks = [
    { heading: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Blog", href: "#blog" }, { label: "Launch App", href: "#app" }] },
    { heading: "Company", links: [{ label: "About", href: "#about" }, { label: "Testimonials", href: "#testimonials" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
    { heading: "Legal", links: [{ label: "Terms of Service", href: "#legal/terms" }, { label: "Privacy Policy", href: "#legal/privacy" }, { label: "Refund Policy", href: "#legal/refund" }, { label: "Disclaimer", href: "#legal/disclaimer" }] },
    { heading: "Support", links: [{ label: "Help Center", href: "#legal/help" }, { label: "Contact", href: "mailto:support@tigerfitpro.in" }, { label: "Status", href: "#" }] },
  ];

  return (
    <footer className="border-t border-[#f7f0df]/10 bg-[#06040d] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] font-black text-[#090511]">TF</div>
              <span className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f7f0df]/84">Tiger Fitness Pro</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#f7f0df]/44">India's most intelligent fitness and lifestyle coaching platform. Built for weddings, families, and everyday warriors.</p>
            <div className="mt-6 flex gap-3">
              {["T", "I", "Y", "D"].map((char, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/44 transition hover:border-violet-300/40 hover:bg-violet-200/10 hover:text-violet-100">
                  <span className="text-xs font-bold">{char}</span>
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7f0df]/44">{section.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link: any) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-[#f7f0df]/54 transition hover:text-violet-100">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#f7f0df]/10 pt-8 sm:flex-row">
          <p className="text-xs text-[#f7f0df]/32">© 2025 Tiger Fitness Pro. All rights reserved.</p>
          <p className="text-xs text-[#f7f0df]/32">Made with 🐅 in India</p>
          <button type="button" onClick={onAdminClick} className="rounded-full border border-[#f7f0df]/8 bg-[#f7f0df]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7f0df]/30 transition hover:border-violet-200/30 hover:text-violet-100">
            🔐 Admin Panel
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- */
/* Main                                                              */
/* ---------------------------------------------------------------- */

function getHashRoute(): string {
  return window.location.hash.replace("#", "") || "";
}

export default function App() {
  const [route, setRoute] = useState(getHashRoute());
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // SaaS App routes
  if (route === "app" || route === "app/login" || route === "app/signup") {
    return (
      <AuthProvider>
        <SaaSApp />
      </AuthProvider>
    );
  }

  // Legal pages
  if (route.startsWith("legal/")) {
    const type = route.replace("legal/", "") as LegalType;
    if (["terms", "privacy", "refund", "disclaimer", "help"].includes(type)) {
      return <LegalPage type={type} onBack={() => (window.location.hash = "")} />;
    }
  }

  // Marketing site
  return (
    <>
      <main className="min-h-screen overflow-hidden bg-[#07040d] text-[#f7f0df] selection:bg-violet-200 selection:text-[#090511]">
        <Nav />
        <Hero />
        <About />
        <Features />
        <HowItWorks />
        <ChallengesSection />
        <CoursesSection />
        <BlogSection />
        <BlogImageGallery />
        <Newsletter />
        <Pricing />
        <Testimonials />
        <FAQ />
        <DownloadCTA />
        <Footer onAdminClick={() => setAdminOpen(true)} />
      </main>
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </>
  );
}
