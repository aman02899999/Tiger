import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { blogs, type BlogPost, type BlogBlock } from "./data/blogs";
import AdminPanel from "./admin/AdminPanel";
import SaaSApp from "./app/SaaSApp";
import { AuthProvider } from "./auth/AuthSystem";
import LegalPage, { type LegalType } from "./legal/LegalPages";
import { CoursesSection } from "./app/Courses";
import { ChallengesSection } from "./app/Challenges";
import { motion } from "framer-motion";
import {
  AuroraBackdrop,
  CountUp,
  FloatingChips,
  MagneticButton,
  Marquee,
  Parallax,
  Reveal,
  ScrollProgressBar,
  Tilt3DCard,
} from "./components/interactive/Interactive3D";

const HeroOrb = lazy(() => import("./components/HeroOrb"));

/* `FadeUp` was replaced by <Reveal>, which uses a shared IntersectionObserver
   + pure-CSS transition instead of one framer-motion subscription per card. */

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
  { title: "Ayurveda Hub", tag: "37 conditions", desc: "Complete Ayurvedic protocols for 37 health conditions — herbs, formulations, diet, dosha analysis, and yoga." },
  { title: "PDF Expert Library", tag: "22 guides", desc: "22 expert PDF guides covering cycles, nutrition, hormones, training, women's health, and recovery — ₹199 to ₹599 each." },
  { title: "Physio & Rehab Protocols", tag: "Evidence-based", desc: "POLICE protocol and evidence-based rehab programs for shoulder, knee, back, ankle, hip, and elbow injuries." },
  { title: "Blood Report AI — 40+ Markers", tag: "India clinical", desc: "Upload blood test PDF or enter values — get smart fitness, nutrition, and Ayurvedic recommendations per marker." },
  { title: "Certification Courses", tag: "10 courses", desc: "CPT, Sports Nutrition, Fat Loss Specialist, Physio Diploma — RFC-certified LinkedIn-shareable digital badges." },
  { title: "Smart Meal Planner", tag: "17 conditions", desc: "Formula-based 7-day Indian meal plan for 17 health conditions — veg, non-veg, vegan, goal-specific, budget-aware." },
];

/**
 * Accent moods. Each is a valid, psychology-led pairing within the Aurora
 * Performance system — warm/solar for reward, azure for focus, vital green
 * for growth, and the signature teal→amber for the default lifestyle OS.
 */
const premiumThemes: Record<ThemeKey, { name: string; glow: string; accent: string; label: string }> = {
  ember: { name: "Titan Solar", glow: "from-amber-300 via-orange-400 to-rose-500", accent: "bg-amber-300", label: "Reward & momentum" },
  royal: { name: "Deep Focus", glow: "from-sky-300 via-blue-500 to-teal-600", accent: "bg-sky-300", label: "Discipline mode" },
  matrix: { name: "Vital Growth", glow: "from-emerald-300 via-teal-400 to-cyan-500", accent: "bg-emerald-300", label: "Growth analytics" },
  tigerLife: { name: "Titan Aurora", glow: "from-teal-300 via-sky-400 to-amber-300", accent: "bg-teal-300", label: "Lifestyle OS" },
};

/* Dashboard data available for expansion */

type HeroStat = {
  number: string;
  label: string;
  /** When set, the tile animates a count-up instead of printing `number`. */
  count?: number;
  suffix?: string;
  decimals?: number;
};

const heroStats: HeroStat[] = [
  { number: "50K+", label: "Active Users", count: 50, suffix: "K+" },
  { number: "35+", label: "Premium Features", count: 35, suffix: "+" },
  { number: "4.9★", label: "Play Store Rating", count: 4.9, decimals: 1, suffix: "★" },
  { number: "22", label: "Expert PDF Guides", count: 22 },
];

const howItWorks = [
  { step: "01", title: "Download & Set Up", desc: "Sign up in 30 seconds. Enter your goal, current stats, and lifestyle data. The Titan Life Coach learns you instantly.", icon: "⚡" },
  { step: "02", title: "Get Your AI Plan", desc: "Receive personalized workout, nutrition, sleep, hydration, and stress management plan — every morning, adjusted for today's energy.", icon: "🧠" },
  { step: "03", title: "Scan & Track", desc: "Snap photos of Indian food for instant macros. Log workouts, sleep, and moods. The AI adapts in real time.", icon: "📸" },
  { step: "04", title: "Transform Together", desc: "Watch your Titan Score climb. Unlock achievements. Share family health dashboard. Reach your goal with an accountability partner AI.", icon: "🏆" },
];

const testimonials = [
  { name: "Rohit S.", role: "Lost 22kg · Mumbai", text: "Beast Calculator ne meri life badal di! 4 mahine mein pehchaana nahi jata ab. Indian meal plan ekdum sahi tha!", avatar: "RS" },
  { name: "Ananya K.", role: "Lost 15kg · Delhi", text: "Pehli baar kisi app ne mujhe Indian foods ka proper macro breakdown diya. Dal, roti, sabzi sab ka calculation!", avatar: "AK" },
  { name: "Siddharth M.", role: "+14kg Muscle · Pune", text: "Titan Pro ki 7-day meal plan follow ki. 6 mahine mein 14kg lean mass gain! Chawal aur paneer se!", avatar: "SM" },
  { name: "Deepika R.", role: "Lost 18kg · Bangalore", text: "Body anatomy visualizer dekh ke samajh aaya mera body fat kitna tha. Streak system amazing hai!", avatar: "DR" },
  { name: "Amit P.", role: "Athlete · Chennai", text: "₹499 mein itna sab kuch? Yaar ye toh London ka subscription bhi sharminda ho jaye iske samne!", avatar: "AP" },
  { name: "Priyanka N.", role: "Lost 12kg · Hyderabad", text: "Before/after photos feature bahut emotional tha. 3 mahine baad apna photo dekha toh bilkul alag tha!", avatar: "PN" },
  { name: "Kartik B.", role: "Lost 25kg · Kolkata", text: "Chawal, roti, sabzi sab ka calorie count! Finally ek app jo samajhta hai Indian eating. Game changer!", avatar: "KB" },
  { name: "Vijay G.", role: "+20kg Bulk · Jaipur", text: "Doodh, paneer, eggs, chicken — sabka proper plan. 8 mahine mein 20kg muscle gain! Beast level!", avatar: "VG" },
];

const faqs = [
  { q: "Is The Titan Fitness free?", a: "Basic features are free forever. Premium Elite membership unlocks AI coaching, medical report analysis, family dashboard, wedding mode, voice coach, and 28+ advanced features starting at ₹199/month." },
  { q: "How does Indian food scanner work?", a: "Our AI model was trained specifically on common Indian dishes — roti, dal, rice, sabzi, paneer, idli, dosa, biryani, and more. Just take a photo and get calories, protein, carbs, and fat estimates instantly." },
  { q: "What is Energy Prediction Engine?", a: "Every morning, we analyze your sleep quality, stress levels, recent training load, nutrition, and recovery status. We give you a Today's Energy percentage and automatically adjust your workout intensity accordingly." },
  { q: "Can my whole family use it?", a: "Yes! Our Family Health Dashboard lets you track parents, spouse, and children under one account. Each person gets personalized recommendations while you see everyone's health overview." },
  { q: "Is health risk prediction accurate?", a: "Our predictions are based on lifestyle patterns, not medical diagnostics. They provide early warnings but come with clear disclaimers stating they do not replace professional medical advice. Always consult your doctor." },
  { q: "Does it work offline?", a: "Core tracking features work offline. AI food scanning, voice coaching, and real-time analytics require internet connection. Downloaded workouts function fully without connectivity." },
  { q: "What makes it different from other apps?", a: "Most apps only track workouts. We track your complete lifestyle — sleep, stress, productivity, food, expenses, family health, injury prevention, mental wellness, and more. One dashboard for everything." },
];

const pricingPlans = [
  { name: "Free", price: "₹0", period: "forever", description: "Start your fitness journey", features: ["Beast Score Calculator (0–100)", "BMI, BMR & TDEE Calculator", "Body Fat % Estimator", "Leaderboard Access", "WOD (Workout of the Day)", "Courses & Knowledge Store", "Ayurveda Hub (view only)", "Community Leaderboard"], cta: "Get Started Free", popular: false },
  { name: "Titan Pro", price: "₹499", period: "/month", description: "For serious transformations", features: ["Full 7-Day Indian Meal Plan", "12-Week Transformation Roadmap", "Blood Report AI Analyser (40+ markers)", "Ayurveda Hub — Full Access", "Physio & Injury Rehab Protocols", "22 Expert PDF Guides", "10 Certification Courses", "Before/After Photo Upload", "Streak Freeze Protection", "PDF Export for meal plans"], cta: "Start Titan Pro — ₹499/mo", popular: true },
  { name: "Titan Elite", price: "₹1,999", period: "/month", description: "1-on-1 personal coaching", features: ["Everything in Titan Pro", "1-on-1 Personal Trainer Sessions", "Custom Meal Plan by Coach", "Weekly Check-in Calls", "Priority WhatsApp Support", "Advanced Body Composition Analysis", "Exclusive Elite Badge", "Early Feature Access"], cta: "Go Elite — ₹1999/mo", popular: false },
  { name: "Titan Annual", price: "₹4,999", period: "/year", description: "Best value — save ₹1,000", features: ["All Titan Pro & Elite features", "12-month full access", "Exclusive RFC merchandise discount", "Certificate of completion", "Priority support all year", "Locked-in price guarantee"], cta: "Get Annual — ₹4,999/yr", popular: false },
];

/* ---------------------------------------------------------------- */
/* Components                                                        */
/* ---------------------------------------------------------------- */

const NAV_LINKS = [
  { href: "#hero", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#blog", label: "Blog" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
  { href: "#download", label: "Download" },
];

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("hero");

  // Solidify the bar once past the hero, and highlight whichever section
  // is currently under the fold line.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    let ticking = false;

    function update() {
      setScrolled(window.scrollY > 24);
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={
        "fixed left-0 right-0 top-0 z-50 transition-all duration-500 " +
        (scrolled
          ? "border-b border-teal-300/12 bg-[#04070e]/88 shadow-[0_10px_40px_rgba(1,6,12,0.55)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent backdrop-blur-sm")
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-10">
        <a href="#hero" className="group flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 via-sky-400 to-amber-300 font-black text-[#04121a] shadow-[0_0_36px_rgba(45,212,191,0.45)] transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
            TT
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/30 to-transparent" />
          </div>
          <span className="hidden text-sm font-semibold uppercase tracking-[0.32em] text-[#e9f3f5]/90 sm:block">The Titan Fitness</span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 " +
                  (isActive ? "text-teal-100" : "text-[#e9f3f5]/60 hover:text-[#e9f3f5]")
                }
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-teal-300/25 bg-teal-300/12"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <MagneticButton
            href="#download"
            strength={0.25}
            className="hidden rounded-full border border-teal-300/30 bg-teal-300/12 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-teal-50 backdrop-blur transition hover:bg-teal-300/22 sm:inline-block"
          >
            Download Now
          </MagneticButton>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/14 text-white/70 transition hover:border-teal-300/40 hover:text-teal-100 lg:hidden"
          >
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {menuOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
            </svg>
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: menuOpen ? "auto" : 0, opacity: menuOpen ? 1 : 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden border-t border-white/10 bg-[#04070e]/96 backdrop-blur-2xl lg:hidden"
      >
        <div className="px-6 pb-6 pt-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={
                "block rounded-xl px-4 py-3 text-base font-medium transition " +
                (active === link.href.slice(1)
                  ? "bg-teal-300/12 text-teal-100"
                  : "text-[#e9f3f5]/78 hover:bg-white/10")
              }
            >
              {link.label}
            </a>
          ))}
        </div>
      </motion.div>
    </nav>
  );
}

const heroChips = [
  { label: "Energy 82%", icon: "⚡", x: "4%", y: "16%", delay: 0 },
  { label: "Streak 46d", icon: "🔥", x: "72%", y: "8%", delay: 1.1 },
  { label: "Sleep 7h 40m", icon: "😴", x: "0%", y: "68%", delay: 2.2 },
  { label: "Titan Score 94", icon: "🏆", x: "76%", y: "74%", delay: 1.6 },
];

const trustSignals = [
  "50,000+ Active Users",
  "4.9★ Play Store",
  "AI Indian Food Scanner",
  "22 Expert Guides",
  "Family Health Dashboard",
  "Ayurveda + Modern Science",
  "Made in India",
];

function Hero() {
  return (
    <section id="hero" className="grain relative isolate min-h-screen overflow-hidden pt-20">
      {/* Depth layer 1 — photographic base, slowest parallax */}
      <Parallax depth={-60} className="absolute inset-0">
        <img
          src="/images/tiger-fitness-luxury-hero.jpg"
          alt=""
          className="h-[115%] w-full scale-105 object-cover opacity-40 saturate-[0.85] motion-safe:animate-[slowZoom_22s_ease-in-out_infinite_alternate]"
          aria-hidden
        />
      </Parallax>

      {/* Depth layer 2 — colour grade toward the aurora palette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(94,234,212,0.30),transparent_34%),radial-gradient(circle_at_84%_16%,rgba(59,157,255,0.22),transparent_32%),radial-gradient(circle_at_60%_92%,rgba(255,182,39,0.12),transparent_38%),linear-gradient(112deg,rgba(4,7,14,0.97)_0%,rgba(11,47,74,0.72)_46%,rgba(4,7,14,0.60)_100%)]" />

      {/* Depth layer 3 — animated aurora curtains + perspective floor */}
      <AuroraBackdrop variant="strong" />

      {/* Depth layer 4 — drifting tech grid */}
      <div className="absolute inset-0 opacity-[0.20] [background-image:linear-gradient(rgba(94,234,212,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(94,234,212,0.10)_1px,transparent_1px)] [background-size:72px_72px] motion-safe:animate-[gridDrift_26s_linear_infinite]" />

      {/* Depth layer 5 — levitating glass stat chips */}
      <FloatingChips items={heroChips} />

      <div className="relative z-10 flex min-h-screen flex-col px-6 sm:px-10 lg:px-16">
        <div className="flex flex-1 items-center py-16 lg:py-20">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
            {/* ── Left: copy ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/25 bg-teal-200/10 px-4 py-2 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(94,234,212,0.9)]" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-100">Now on Play Store</span>
              </div>

              <h1 className="text-3xl font-black leading-[0.92] tracking-[-0.07em] sm:text-5xl md:text-6xl xl:text-7xl">
                <span className="block text-[#e9f3f5]">Train Smarter.</span>
                <span className="text-aurora block">Transform Faster.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#e9f3f5]/80 sm:text-xl sm:leading-9">
                Most fitness apps only track workouts.{" "}
                <span className="font-semibold text-teal-100">The Titan Fitness</span> improves your entire
                lifestyle — sleep, nutrition, stress, family health, and more. One AI-powered dashboard.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <MagneticButton
                  href="#app"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-teal-300 via-sky-400 to-teal-600 px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-[#04121a] shadow-[0_22px_80px_rgba(45,212,191,0.40)] transition-shadow duration-300 hover:shadow-[0_30px_110px_rgba(45,212,191,0.55)]"
                >
                  <span className="relative z-10 flex items-center gap-3">🚀 Launch Web App</span>
                </MagneticButton>
                <MagneticButton
                  href="#features"
                  strength={0.2}
                  className="inline-flex items-center justify-center rounded-full border border-[#e9f3f5]/20 bg-[#e9f3f5]/8 px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] text-[#e9f3f5] ring-1 ring-[#e9f3f5]/12 backdrop-blur transition hover:border-teal-300/40 hover:bg-[#e9f3f5]/14"
                >
                  Explore Features →
                </MagneticButton>
              </div>

              {/* Animated, tilting stat tiles */}
              <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {heroStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.1 }}
                  >
                    <Tilt3DCard className="h-full rounded-2xl" max={12} lift={16}>
                      <div className="glass-3d h-full rounded-2xl p-5">
                        <p className="text-2xl font-black tracking-[-0.06em] text-[#e9f3f5]">
                          {stat.count !== undefined ? (
                            <CountUp
                              value={stat.count}
                              decimals={stat.decimals ?? 0}
                              suffix={stat.suffix ?? ""}
                            />
                          ) : (
                            stat.number
                          )}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[#e9f3f5]/70">
                          {stat.label}
                        </p>
                      </div>
                    </Tilt3DCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── Right: interactive 3D Titan Core ───────────────── */}
            <motion.div
              className="relative hidden items-center justify-center lg:flex"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            >
              <div
                className="absolute inset-0 rounded-full bg-teal-500/10 blur-3xl"
                style={{ animation: "pulseGlow 4s ease-in-out infinite" }}
              />
              <Suspense fallback={<div className="h-96 w-96 animate-pulse rounded-full bg-teal-500/5" />}>
                <HeroOrb className="h-96 w-96 lg:h-[520px] lg:w-[520px]" />
              </Suspense>
              <p className="pointer-events-none absolute bottom-2 text-[10px] font-bold uppercase tracking-[0.3em] text-teal-100/40">
                Move cursor · click to charge
              </p>
            </motion.div>
          </div>
        </div>

        {/* Trust marquee */}
        <div className="pb-10">
          <Marquee items={trustSignals} />
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#about"
        aria-label="Scroll to next section"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-teal-100/50 transition hover:text-teal-100 lg:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <span className="grid h-9 w-6 place-items-start rounded-full border border-teal-200/30 p-1.5">
          <span className="h-2 w-1 animate-bounce rounded-full bg-teal-300" />
        </span>
      </a>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(45,212,191,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="motion-safe:animate-[fadeUp_900ms_ease-out_both]">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Why Titan?</p>
            <h2 className="mt-5 text-2xl sm:text-4xl lg:text-6xl font-black tracking-[-0.05em]">
              Not just a fitness app.<br />
              <span className="bg-gradient-to-r from-violet-200 to-[#ffb627] bg-clip-text text-transparent">Your life operating system.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#e9f3f5]/68">
              The Titan Fitness combines AI-powered coaching with India-first intelligence. From wedding transformations to family health dashboards, from Indian food scanning to damage control after cheat meals — we cover the entire lifestyle.
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

          {/* Live "life OS" dashboard — tilts in 3D, layers lift on hover */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-10 rounded-[3rem] bg-teal-400/18 blur-3xl motion-safe:animate-[floatGlow_8s_ease-in-out_infinite]" />
            <Tilt3DCard className="rounded-[2.5rem]" max={11} lift={30} scale={1.03}>
              {/* No overflow-hidden / backdrop-blur on this node: both are
                  grouping values that would flatten the layer-z-* children. */}
              <div className="relative rounded-[2.5rem] border border-[#e9f3f5]/12 bg-[#0a141f]/90 p-6 shadow-[0_35px_140px_rgba(11,47,74,0.5)]">
                <span className="clip-3d" aria-hidden>
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-sky-400 to-amber-300" />
                  <span className={"absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br " + activeTheme.glow + " opacity-30 blur-3xl motion-safe:animate-[floatGlow_8s_ease-in-out_infinite]"} />
                </span>
                <div className="relative">
                  <div className="layer-z-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e9f3f5]/65">Today's summary</p>
                      <motion.p
                        key={activeTheme.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-2 text-3xl font-black text-[#e9f3f5]"
                      >
                        {activeTheme.name}
                      </motion.p>
                    </div>
                    <div className={"grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br " + activeTheme.glow + " shadow-[0_10px_30px_rgba(45,212,191,0.3)]"} />
                  </div>
                  <div className="layer-z-1 mt-7 space-y-4">
                    {lifeCoachSignals.map((signal, i) => (
                      <div key={signal} className="flex items-center justify-between rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/6 p-4">
                        <span className="text-sm font-semibold text-[#e9f3f5]/78">{signal}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-[#e9f3f5]/10">
                            <motion.div
                              className={"h-full rounded-full bg-gradient-to-r " + activeTheme.glow}
                              initial={{ width: 0 }}
                              whileInView={{ width: SIGNAL_VALUES[i].width + "%" }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                          <span className="w-7 text-right text-xs font-bold tabular-nums text-teal-100">{SIGNAL_VALUES[i].score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Tilt3DCard>
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
    <section id="features" className="relative overflow-hidden px-6 py-28 sm:px-10 lg:px-16">
      <AuroraBackdrop />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-teal-100">28+ Premium Features</p>
          <h2 className="mt-5 text-2xl font-black tracking-[-0.05em] sm:text-4xl lg:text-6xl">
            Everything you need to <span className="text-aurora">transform.</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#e9f3f5]/62">From Indian food scanning to wedding roadmaps. From family health to voice coaching.</p>
        </Reveal>

        <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Feature categories">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={
                "relative rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-300 " +
                (filter === f.key
                  ? "text-[#04121a]"
                  : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68 hover:border-teal-300/35 hover:bg-[#e9f3f5]/10 hover:text-[#e9f3f5]")
              }
            >
              {filter === f.key && (
                <motion.span
                  layoutId="feature-filter-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-300 to-sky-400 shadow-[0_8px_28px_rgba(45,212,191,0.35)]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredFeatures.map((feature, index) => (
            <Reveal key={feature.title} delay={Math.min(index, 8) * 45} className="h-full">
              <Tilt3DCard className="h-full rounded-[1.6rem]" max={8} lift={26}>
                <div className="group glass-3d h-full rounded-[1.6rem] p-6">
                  <div className="layer-z-1 flex items-start justify-between gap-3">
                    <span className="shrink-0 rounded-xl bg-teal-200/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100">
                      {feature.tag}
                    </span>
                    <span className="text-sm font-black text-[#e9f3f5]/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="layer-z-2 mt-5 text-xl font-black tracking-[-0.03em] text-[#e9f3f5] transition-colors group-hover:text-teal-100">
                    {feature.title}
                  </h4>
                  <p className="layer-z-1 mt-3 text-sm leading-6 text-[#e9f3f5]/72">{feature.desc}</p>
                </div>
              </Tilt3DCard>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-[#ffb627]/18 bg-[#ffb627]/8 p-6 backdrop-blur-xl">
          <p className="text-sm font-bold text-[#ffb627]">Medical disclaimer</p>
          <p className="mt-2 text-sm leading-7 text-[#e9f3f5]/62">Health risk predictions, medical report analysis, posture analysis, injury risk warnings, and metabolic age are wellness guidance tools only. They do not replace professional medical advice. Always consult a doctor.</p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-28 sm:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(45,212,191,0.14),transparent_32%),radial-gradient(circle_at_82%_58%,rgba(255,182,39,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">How It Works</p>
          <h2 className="mt-5 text-2xl sm:text-4xl lg:text-6xl font-black tracking-[-0.05em]">4 steps to your best self.</h2>
        </div>

        <div className="mt-16 grid gap-5 sm:gap-8 md:grid-cols-2 lg:gap-10">
          {howItWorks.map((item, index) => (
            <Reveal key={item.step} delay={index * 90} className="h-full">
              <Tilt3DCard className="h-full rounded-[2rem]" max={7} lift={22}>
                <div className="group glass-3d relative h-full rounded-[2rem] p-8">
                  {/* Oversized ghost numeral for depth. The clipping lives on
                      a .clip-3d child so the card keeps preserve-3d. */}
                  <span className="clip-3d" aria-hidden>
                    <span className="absolute -right-3 -top-8 select-none text-[7rem] font-black leading-none text-[#e9f3f5]/[0.035]">
                      {item.step}
                    </span>
                  </span>
                  <div className="relative flex items-start gap-6">
                    <div className="layer-z-3 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] border border-teal-200/20 bg-gradient-to-br from-teal-300/20 via-sky-400/15 to-amber-300/15 text-3xl shadow-[0_0_36px_rgba(45,212,191,0.18)] transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </div>
                    <div className="layer-z-1">
                      <p className="text-xs font-black uppercase tracking-[0.34em] text-teal-200/80">{item.step}</p>
                      <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#e9f3f5] transition-colors group-hover:text-teal-100">{item.title}</h3>
                      <p className="mt-3 text-base leading-7 text-[#e9f3f5]/72">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </Tilt3DCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const annualPrices: Record<string, string> = { Free: "₹0", "Titan Pro": "₹299", "Titan Elite": "₹1,199", "Titan Annual": "₹4,999" };

function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-28 sm:px-10 lg:px-16">
      <AuroraBackdrop />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-teal-100">Pricing</p>
          <h2 className="mt-5 text-2xl font-black tracking-[-0.05em] sm:text-4xl lg:text-6xl">
            One plan for <span className="text-aurora">your goal.</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#e9f3f5]/62">Cancel anytime. Start free, upgrade when ready.</p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-teal-200/24 bg-teal-200/8 px-5 py-2.5 backdrop-blur">
            <span className={"text-sm font-semibold transition " + (!annual ? "text-teal-100" : "text-[#e9f3f5]/65")}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              aria-label="Toggle annual billing"
              onClick={() => setAnnual(!annual)}
              className={"relative h-7 w-[52px] rounded-full transition-colors duration-300 " + (annual ? "bg-gradient-to-r from-teal-300 to-sky-400" : "bg-[#e9f3f5]/18")}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md"
                style={{ left: annual ? 28 : 4 }}
              />
            </button>
            <span className={"text-sm font-semibold transition " + (annual ? "text-teal-100" : "text-[#e9f3f5]/65")}>
              Annual <span className="text-amber-300">(Save 40%)</span>
            </span>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {pricingPlans.map((plan, i) => {
            const isFree = plan.price === "₹0";
            const displayPrice = annual && !isFree ? annualPrices[plan.name] : plan.price;
            const displayPeriod = isFree ? "forever" : annual ? "/mo, billed yearly" : "/month";
            return (
              <Reveal key={plan.name} delay={i * 80} className="h-full">
                <Tilt3DCard
                  className="h-full rounded-[2rem]"
                  max={plan.popular ? 6 : 8}
                  lift={plan.popular ? 34 : 20}
                  scale={plan.popular ? 1.03 : 1.02}
                >
                  <div
                    className={
                      "relative h-full rounded-[2rem] p-5 sm:p-8 " +
                      (plan.popular
                        ? "glass-3d border-teal-300/45 shadow-[0_0_90px_rgba(45,212,191,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] [--glass-bg:rgba(94,234,212,0.10)]"
                        : "glass-3d")
                    }
                  >
                    {plan.popular && (
                      <div className="layer-z-3 absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-300 to-sky-400 px-5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#04121a] shadow-[0_10px_30px_rgba(45,212,191,0.45)]">
                        Most Popular
                      </div>
                    )}

                    <div className="layer-z-1">
                      <h3 className="text-2xl font-black text-[#e9f3f5]">{plan.name}</h3>
                      <p className="mt-2 text-sm text-[#e9f3f5]/68">{plan.description}</p>

                      <div className="mt-6 flex items-end gap-1">
                        <span className="text-5xl font-black tracking-[-0.06em] text-[#e9f3f5] tabular-nums">{displayPrice}</span>
                        <span className="pb-2 text-base font-medium text-[#e9f3f5]/65">{displayPeriod}</span>
                      </div>
                    </div>

                    <MagneticButton
                      href="#download"
                      strength={plan.popular ? 0.24 : 0.14}
                      className={
                        "layer-z-2 mt-8 block rounded-full py-4 text-center text-sm font-black uppercase tracking-[0.18em] transition " +
                        (plan.popular
                          ? "bg-gradient-to-r from-teal-300 via-sky-400 to-teal-600 text-[#04121a] shadow-[0_16px_60px_rgba(45,212,191,0.35)] hover:shadow-[0_22px_80px_rgba(45,212,191,0.5)]"
                          : "border border-[#e9f3f5]/18 bg-[#e9f3f5]/8 text-[#e9f3f5] hover:border-teal-300/35 hover:bg-[#e9f3f5]/14")
                      }
                    >
                      {plan.cta}
                    </MagneticButton>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3 text-sm text-[#e9f3f5]/68">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300 shadow-[0_0_8px_rgba(94,234,212,0.8)]" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Tilt3DCard>
              </Reveal>
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
          <h2 className="mt-5 text-2xl sm:text-4xl lg:text-6xl font-black tracking-[-0.05em]">Real stories. Real results.</h2>
        </div>

        <div className="mt-14 grid gap-5 sm:gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 70} className="h-full">
              <Tilt3DCard className="h-full rounded-[2rem]" max={7} lift={20}>
                <div className="glass-3d group relative h-full rounded-[2rem] p-5 sm:p-8">
                  <span className="clip-3d" aria-hidden>
                    <span className="absolute -right-2 -top-10 select-none font-serif text-[9rem] leading-none text-teal-200/[0.06]">
                      &ldquo;
                    </span>
                  </span>
                  <div className="layer-z-1 relative">
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-lg text-amber-300">&#9733;</span>
                      ))}
                    </div>
                    <p className="text-base italic leading-7 text-[#e9f3f5]/82">&ldquo;{t.text}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-4 border-t border-[#e9f3f5]/10 pt-5">
                      <div className="layer-z-2 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-teal-300 via-sky-400 to-amber-300 text-sm font-black text-[#04121a] shadow-[0_0_22px_rgba(45,212,191,0.35)]">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-[#e9f3f5]">{t.name}</p>
                        <p className="text-xs font-medium text-[#e9f3f5]/70">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt3DCard>
            </Reveal>
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
            <div key={faq.q} className="glass-card overflow-hidden rounded-[1.4rem] transition-all duration-300">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left"
              >
                <span className="text-base font-bold text-[#e9f3f5]">{faq.q}</span>
                <span className={"shrink-0 h-8 w-8 grid place-items-center rounded-full border transition-all duration-300 " + (openIndex === index ? "rotate-180 border-violet-300 bg-violet-300/20" : "border-[#e9f3f5]/16 bg-[#e9f3f5]/5")}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </button>
              <div className={"grid transition-all duration-300 ease-out " + (openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm leading-7 text-[#e9f3f5]/78">{faq.a}</p>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.18),transparent_48%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/22 bg-violet-200/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(126,242,168,0.8)] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-100">Available on Play Store</span>
          </div>
          <h2 className="text-5xl font-black tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            Ready to transform<br />
            <span className="bg-gradient-to-r from-violet-200 to-[#ffb627] bg-clip-text text-transparent">your lifestyle?</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#e9f3f5]/66">Download The Titan Fitness. Join 50K+ Indians already transforming with our AI Life Coach.</p>
          
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#app" className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-9 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_22px_80px_rgba(45,212,191,0.36)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_110px_rgba(45,212,191,0.48)]">
              🚀 Launch Web App (Free)
            </a>
            <a href="#app" className="flex items-center gap-3 rounded-full border border-[#e9f3f5]/20 bg-[#e9f3f5]/8 px-9 py-5 text-sm font-bold uppercase tracking-[0.2em] text-[#e9f3f5] ring-1 ring-[#e9f3f5]/12 backdrop-blur transition hover:bg-[#e9f3f5]/14">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M17.581 23.187c-.396.225-.753.27-1.144.158l-6.387-2.91c-.42-.192-.666-.567-.71-1.02v-14.785c.05-.456.295-.83.72-1.026l6.377-2.91c.39-.108.75-.064 1.146.157a1.74 1.74 0 01.79 1.467l.005 19.403a1.74 1.74 0 01-.797 1.466zM4.097 23.188A1.77 1.77 0 013.3 21.73V2.323A1.77 1.77 0 014.097.86C4.493.64 4.85.597 5.24.705l6.387 2.91c.42.196.666.57.714 1.026V19.43c-.048.452-.294.826-.714 1.018l-6.387 2.91c-.39.112-.747.067-1.143-.168z"/></svg>
              Get Android App
            </a>
          </div>
        </div>

        <div className="mt-20 rounded-[2rem] border border-[#e9f3f5]/12 bg-[#0a141f]/60 p-8 backdrop-blur-xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Release Readiness</p>
              <h3 className="mt-3 text-3xl font-black text-[#e9f3f5]">Play Store Checklist</h3>
            </div>
            <div className="min-w-44">
              <div className="mb-3 flex justify-between text-sm font-semibold text-[#e9f3f5]/74"><span>Ready</span><span>{progress}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e9f3f5]/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-[#ffb627] transition-all duration-500" style={{ width: progress + "%" }} />
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-3">
            {launchChecklist.map((item, index) => {
              const isChecked = checked.includes(index);
              return (
                <button key={item.label} type="button" onClick={() => toggleItem(index)} className="group flex items-start gap-4 rounded-2xl border-t border-[#e9f3f5]/10 py-4 text-left transition hover:border-violet-200/40">
                  <span className={"mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm transition " + (isChecked ? "border-violet-200 bg-violet-200 text-[#04121a]" : "border-[#e9f3f5]/24 text-[#e9f3f5]/60 group-hover:border-violet-200")}>{isChecked ? "\u2713" : index + 1}</span>
                  <div>
                    <span className="block text-lg font-bold text-[#e9f3f5]">{item.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#e9f3f5]/68">{item.detail}</span>
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
      return <p className="text-base leading-7 text-[#e9f3f5]/74">{block.text}</p>;
    case "h2":
      return <h2 className="mt-8 text-2xl font-black tracking-[-0.04em] text-[#e9f3f5] first:mt-0">{block.text}</h2>;
    case "h3":
      return <h3 className="mt-6 text-xl font-bold text-[#e9f3f5]">{block.text}</h3>;
    case "ul":
      return (
        <ul className="mt-3 space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[#e9f3f5]/72">
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
            <li key={item} className="flex items-start gap-3 text-[#e9f3f5]/72">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-200/15 text-[10px] font-black text-violet-100">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "stat":
      return (
        <div className="my-6 inline-flex items-baseline gap-3 rounded-2xl border border-violet-200/18 bg-violet-200/8 px-5 py-3">
          <span className="text-3xl font-black tracking-[-0.06em] bg-gradient-to-r from-violet-200 to-[#ffb627] bg-clip-text text-transparent">{block.value}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e9f3f5]/68">{block.label}</span>
        </div>
      );
    case "tip":
      return (
        <div className="my-6 rounded-2xl border border-[#ffb627]/18 bg-[#ffb627]/8 p-5">
          <p className="text-sm font-bold text-[#ffb627] mb-1">Titan Tip</p>
          <p className="text-sm leading-7 text-[#e9f3f5]/70">{block.text}</p>
        </div>
      );
    case "cta":
      return (
        <div className="my-8 rounded-[2rem] border border-violet-300/30 bg-gradient-to-br from-violet-200/12 to-fuchsia-400/8 p-8 backdrop-blur-xl">
          <p className="text-2xl font-black text-[#e9f3f5]">{block.title}</p>
          <p className="mt-3 max-w-lg text-sm leading-7 text-[#e9f3f5]/66">{block.subtitle}</p>
          <a href="#download" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-7 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_60px_rgba(45,212,191,0.3)] transition-all hover:-translate-y-0.5">
            Download The Titan Fitness
          </a>
        </div>
      );
    case "faq":
      return (
        <details className="group mt-3 rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-5 open:bg-violet-200/6 transition-colors">
          <summary className="cursor-pointer list-none text-base font-bold text-[#e9f3f5] flex justify-between items-center gap-3">
            {block.q}
            <span className="h-6 w-6 grid place-items-center rounded-full bg-violet-200/12 text-violet-100 group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="mt-4 text-sm leading-7 text-[#e9f3f5]/66">{block.a}</p>
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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#04070e]/96 backdrop-blur-2xl">
      <button type="button" onClick={onClose} className="fixed right-6 top-6 z-10 grid h-12 w-12 place-items-center rounded-full border border-violet-200/20 bg-[#0a141f] text-[#e9f3f5] transition hover:bg-violet-200/15">
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      
      <article className="mx-auto max-w-3xl px-6 pb-24 pt-28 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <a href="#blog" onClick={onClose} className="text-sm font-semibold text-violet-100 hover:underline">← Back to Blog</a>
          <span className="rounded-full bg-violet-200/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">{post.category}</span>
          <span className="text-xs text-[#e9f3f5]/65">{post.readTime}</span>
          <span className="text-xs text-[#e9f3f5]/65">{post.date}</span>
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
            <div className="grid h-56 place-items-center bg-gradient-to-br from-violet-200/20 via-fuchsia-400/10 to-[#ffb627]/10 text-[10rem] sm:h-72 md:h-96">
              {post.heroEmoji}
            </div>
          )}
        </div>
        
        <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.06em] text-[#e9f3f5] sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[#e9f3f5]/62">{post.seoDescription}</p>
        
        <div className="mt-6 flex items-center gap-3 border-y border-[#e9f3f5]/10 py-5">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#ffb627] text-sm font-black text-[#04121a]">{post.author.split(" ").map(n => n[0]).slice(-2).join("")}</div>
          <div>
            <p className="text-sm font-bold text-[#e9f3f5]">{post.author}</p>
            <p className="text-xs text-[#e9f3f5]/65">{post.date} · {post.readTime}</p>
          </div>
        </div>
        
        <div className="mt-8 space-y-3">
          {post.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
        </div>
        
        <div className="mt-12 rounded-[2rem] border border-violet-200/18 bg-violet-200/6 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100/70 mb-4">Frequently Asked Questions</p>
          <div className="space-y-3">
            {post.faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-5 open:bg-violet-200/6 transition-colors">
                <summary className="cursor-pointer list-none text-sm font-bold text-[#e9f3f5] flex justify-between items-center gap-3">
                  {faq.q}
                  <span className="h-6 w-6 grid place-items-center rounded-full bg-violet-200/12 text-violet-100 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[#e9f3f5]/66">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        
        <div className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[#e9f3f5]/14 bg-[#e9f3f5]/5 px-3 py-1.5 text-xs font-semibold text-[#e9f3f5]/68">#{tag.toLowerCase().replace(/\s+/g, "")}</span>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,191,0.14),transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">The Titan Blog</p>
          <h2 className="mt-5 text-2xl sm:text-4xl lg:text-6xl font-black tracking-[-0.05em]">Fitness knowledge for modern Indians.</h2>
          <p className="mt-6 text-lg leading-8 text-[#e9f3f5]/62">20+ expert articles on nutrition, workouts, lifestyle, and performance marketing insights.</p>
        </div>

        <div className="mt-12 rounded-[2rem] border border-violet-200/18 bg-[#0a141f]/70 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 px-5 py-3">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[#e9f3f5]/40"><circle cx={11} cy={11} r={7}/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent text-sm text-[#e9f3f5] outline-none placeholder:text-[#e9f3f5]/34"
            />
          </div>
        </div>

        <button type="button" onClick={() => setActivePost(featured)} className="group relative mt-8 block w-full overflow-hidden rounded-[2.2rem] border border-violet-200/20 bg-gradient-to-br from-violet-200/12 via-fuchsia-400/8 to-[#ffb627]/8 backdrop-blur-xl text-left transition-all hover:-translate-y-1 hover:border-violet-200/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(45,212,191,0.18),transparent_50%)]" />
          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:pr-4">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white">Featured Article</span>
                <span className="rounded-full bg-[#e9f3f5]/10 px-3 py-1.5 text-xs font-semibold text-[#e9f3f5]/68">{featured.category}</span>
                <span className="text-xs text-[#e9f3f5]/68">{featured.readTime}</span>
              </div>
              <h3 className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#e9f3f5] sm:text-4xl lg:text-5xl">{featured.title}</h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#e9f3f5]/62">{featured.seoDescription}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#ffb627] text-xs font-black text-[#04121a]">{featured.author.split(" ").map(n => n[0]).slice(-2).join("")}</div>
                <span className="text-sm text-[#e9f3f5]/68">{featured.author} · {featured.date}</span>
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
                <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-[#0a141f]/60 text-8xl border-t border-violet-200/15">
                  {featured.heroEmoji}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#04070e]/90 via-[#04070e]/30 to-transparent lg:bg-gradient-to-l" />
            </div>
          </div>
        </button>

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setFilter(cat)} className={"rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition " + (filter === cat ? "bg-violet-200/20 text-violet-50 ring-1 ring-violet-200/30" : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68 hover:bg-[#e9f3f5]/10")}>{cat}</button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBlogs.map((post) => (
            <article key={post.slug} className="group relative overflow-hidden rounded-[1.8rem] border border-[#e9f3f5]/10 bg-[#0a141f]/60 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200/30 hover:bg-[#0a141f]/90">
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
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-200/15 via-fuchsia-400/10 to-[#ffb627]/10 text-7xl">
                      {post.heroEmoji}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a141f] via-[#0a141f]/40 to-transparent" />
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-200/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-100/78">{post.category}</span>
                  <span className="text-[10px] font-semibold text-[#e9f3f5]/40">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-black leading-[1.15] tracking-[-0.02em] text-[#e9f3f5] group-hover:text-violet-100 transition-colors">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#e9f3f5]/68">{post.seoDescription}</p>
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
          <p className="max-w-md text-sm leading-6 text-[#e9f3f5]/68">Every featured article includes an AI-generated image optimized for fast loading, mobile responsiveness, and accessibility.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {imageBlogs.map((post) => (
            <figure key={post.slug} className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-[#e9f3f5]/10 bg-[#0a141f]/60">
              <img
                src={post.heroImage}
                alt={post.heroImageAlt || post.title}
                loading="lazy"
                width={400}
                height={500}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04070e]/95 via-[#04070e]/20 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <span className="mb-2 inline-block rounded-full bg-violet-200/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-violet-100">{post.category}</span>
                <p className="line-clamp-2 text-sm font-bold leading-snug text-[#e9f3f5]">{post.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#e9f3f5]/34">All images AI-generated · Lazy loaded · SEO-optimized alt text · Web-ready JPEG</p>
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
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-violet-200/25 bg-gradient-to-br from-violet-200/14 via-fuchsia-400/10 to-[#ffb627]/8 p-10 backdrop-blur-xl sm:p-14">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl motion-safe:animate-[floatGlow_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#ffb627]/15 blur-3xl motion-safe:animate-[floatGlow_9s_ease-in-out_infinite_reverse]" />
        <div className="relative text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-violet-100">Weekly Newsletter</p>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-5xl">Get free fitness tips in your inbox.</h2>
          <p className="mt-5 text-base leading-7 text-[#e9f3f5]/66">One email per week. Workouts, Indian diet charts, science, and exclusive discounts. No spam, ever.</p>
          {submitted ? (
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-emerald-300/30 bg-emerald-300/12 px-6 py-4 text-emerald-200">
              <span className="text-xl">⚡</span>
              <span className="font-bold">You're in! Check your inbox for a welcome gift.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="flex-1 rounded-full border border-[#e9f3f5]/14 bg-[#e9f3f5]/8 px-6 py-4 text-sm text-[#e9f3f5] placeholder:text-[#e9f3f5]/34 outline-none focus:border-violet-200/40"/>
              <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_60px_rgba(45,212,191,0.35)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
                {loading ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          <p className="mt-5 text-xs text-[#e9f3f5]/34">Join 12,000+ Indians. Unsubscribe anytime.</p>
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
    <footer className="border-t border-[#e9f3f5]/10 bg-[#030610] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#ffb627] font-black text-[#04121a]">TT</div>
              <span className="text-sm font-semibold uppercase tracking-[0.28em] text-[#e9f3f5]/84">The Titan Fitness</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#e9f3f5]/65">India's most intelligent fitness and lifestyle coaching platform. Built for weddings, families, and everyday warriors.</p>
            <div className="mt-6 flex gap-3">
              {["T", "I", "Y", "D"].map((char, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/65 transition hover:border-violet-300/40 hover:bg-violet-200/10 hover:text-violet-100">
                  <span className="text-xs font-bold">{char}</span>
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e9f3f5]/65">{section.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link: any) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-[#e9f3f5]/68 transition hover:text-violet-100">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#e9f3f5]/10 pt-8 sm:flex-row">
          <p className="text-xs text-[#e9f3f5]/32">© 2025 The Titan Fitness. All rights reserved.</p>
          <p className="text-xs text-[#e9f3f5]/32">Made with ⚡ in India</p>
          <button type="button" onClick={onAdminClick} className="rounded-full border border-[#e9f3f5]/8 bg-[#e9f3f5]/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/30 transition hover:border-violet-200/30 hover:text-violet-100">
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
      <main className="min-h-screen overflow-hidden bg-[#04070e] text-[#e9f3f5] selection:bg-teal-200 selection:text-[#04121a]">
        <ScrollProgressBar />
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
