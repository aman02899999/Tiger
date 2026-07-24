import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Newsletter — subscribe to the weekly email digest (persisted per   */
/* user) and browse the archive of past issues in an in-place reader. */
/* Client-side only. No SVG.                                          */
/* ---------------------------------------------------------------- */

interface Issue {
  id: string;
  title: string;
  date: string;
  preview: string;
  sections: { heading: string; text: string }[];
}

const ISSUES: Issue[] = [
  { id: "n1", title: "The Titan Weekly #12 — Protein, Plateaus & Progress", date: "Jul 20, 2026", preview: "This week: the real reason your fat loss stalled, a 10-minute mobility flow, and the one supplement worth your money.", sections: [
    { heading: "💡 Tip of the week", text: "When the scale stalls, don't slash calories — add steps first. A 2,000-step daily bump often restarts progress without the misery of eating less." },
    { heading: "🍽️ Nutrition focus", text: "Aim for a palm of protein at every meal. It's the single highest-leverage change most people can make for body composition and hunger control." },
    { heading: "🏋️ Move of the week", text: "The suitcase carry: walk 30 seconds holding a weight in one hand, resisting the lean. It builds core stability and grip with almost zero injury risk." },
    { heading: "📖 Worth reading", text: "Our new blog post on breaking weight-loss plateaus breaks down exactly why progress stalls and how to restart it." },
  ] },
  { id: "n2", title: "The Titan Weekly #11 — Sleep Like an Athlete", date: "Jul 13, 2026", preview: "Why sleep is your best recovery tool, a simple wind-down routine, and how to fix your worst sleep habit.", sections: [
    { heading: "😴 Theme: Recovery", text: "You build muscle and burn fat while you sleep. Chronic under-sleeping quietly sabotages everything else you're doing." },
    { heading: "🌙 Try this", text: "Set a consistent bedtime — even on weekends. Irregular sleep timing acts like a permanent mild jet-lag on your body." },
    { heading: "☕ Fix your habit", text: "Cut caffeine 8–10 hours before bed. Its long half-life means an afternoon coffee can still be in your system at midnight." },
    { heading: "🧘 Wind down", text: "Try 4-7-8 breathing in bed: inhale 4, hold 7, exhale 8. It lengthens the exhale to ease you into sleep." },
  ] },
  { id: "n3", title: "The Titan Weekly #10 — Cardio, Simplified", date: "Jul 6, 2026", preview: "How much cardio you really need, the magic of Zone 2, and why walking is underrated.", sections: [
    { heading: "🏃 The big idea", text: "Most health benefits of cardio appear at modest doses. You don't need to run marathons — consistency at a sustainable amount wins." },
    { heading: "💚 Zone 2", text: "Comfortable, conversational-pace cardio builds your aerobic engine with minimal fatigue. 2–4 sessions of 30–60 minutes a week is plenty." },
    { heading: "🚶 Don't skip walking", text: "Daily steps drive your NEAT — a huge, underrated part of your energy balance. A daily step target is one of the easiest fat-loss tools." },
    { heading: "🔥 Trending post", text: "Read 'The Power of a Daily Walk After Meals' on the blog for a tiny habit with outsized benefits." },
  ] },
  { id: "n4", title: "The Titan Weekly #9 — Ayurveda for Modern Life", date: "Jun 29, 2026", preview: "A gentle introduction to the doshas, three easy daily rituals, and the golden-milk recipe.", sections: [
    { heading: "🌿 This week: Ayurveda", text: "You don't need to adopt everything to benefit. Simple practices — warm water on waking, mindful eating, warming spices — draw straight from Ayurvedic wisdom." },
    { heading: "🌅 Three easy rituals", text: "Scrape your tongue each morning, drink warm water on waking, and eat your largest meal at midday when digestion peaks." },
    { heading: "🥛 Recipe", text: "Golden milk: simmer milk with turmeric, a pinch of black pepper, ginger, and a little honey. A soothing bedtime ritual." },
    { heading: "📚 Go deeper", text: "The Ayurveda Library now has 130+ entries — herbs, remedies, routines and therapies, each with how and when to use it." },
  ] },
  { id: "n5", title: "The Titan Weekly #8 — Strength for Everyone", date: "Jun 22, 2026", preview: "Debunking the 'bulky' myth, building muscle after 40, and the five movements that matter most.", sections: [
    { heading: "💪 Theme: Strength", text: "Resistance training is one of the most beneficial things you can do — for your physique, bones, metabolism, and confidence." },
    { heading: "🚫 Myth-buster", text: "Lifting won't make you 'bulky'. Building visible muscle is slow and deliberate; what you get is strength, shape, and tone." },
    { heading: "🎯 The Big Five", text: "Almost every great exercise is a squat, hinge, push, pull, or carry. Master these patterns and you can train the whole body for life." },
    { heading: "🕰️ Never too late", text: "You can build strength and muscle at any age. After 40, just respect recovery a little more and keep progressing." },
  ] },
  { id: "n6", title: "The Titan Weekly #7 — Mind & Mood", date: "Jun 15, 2026", preview: "Meditation for beginners, breathwork for stress, and building habits that actually stick.", sections: [
    { heading: "🧠 Theme: Mental fitness", text: "Your mind is trainable like a muscle. A few minutes of daily practice compounds into real calm and focus over time." },
    { heading: "🧘 Start meditating", text: "Begin with just 3–5 minutes. Focus on the breath; when the mind wanders, gently return. The returning IS the practice." },
    { heading: "🌬️ Stress reset", text: "The physiological sigh — a double inhale then a long exhale — is one of the fastest ways to calm acute stress." },
    { heading: "🔁 Habit tip", text: "Anchor new habits to existing ones ('after I brush my teeth, I meditate') and never miss two days in a row." },
  ] },
];

function subKey(email: string | null | undefined) { return `tfp_newsletter_${email ?? "guest"}`; }

export default function NewsletterPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [freq, setFreq] = useState("weekly");
  const [subscribed, setSubscribed] = useState(false);
  const [open, setOpen] = useState<Issue | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(subKey(user?.email)) ?? "null");
      if (saved?.subscribed) { setSubscribed(true); setFreq(saved.freq ?? "weekly"); if (saved.email) setEmail(saved.email); }
    } catch { /* ignore */ }
  }, [user?.email]);

  const validEmail = useMemo(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()), [email]);

  function subscribe() {
    if (!validEmail) return;
    setSubscribed(true);
    try { localStorage.setItem(subKey(user?.email), JSON.stringify({ subscribed: true, email: email.trim(), freq })); } catch { /* ignore */ }
  }
  function unsubscribe() {
    setSubscribed(false);
    try { localStorage.setItem(subKey(user?.email), JSON.stringify({ subscribed: false })); } catch { /* ignore */ }
  }

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-orange-700 hover:text-orange-700">← Back to newsletter</button>
        <article className="glass-card rounded-2xl p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ea580c]">📧 {open.date}</p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em]">{open.title}</h1>
          <p className="mt-3 text-sm italic text-[#2a1e16]/65">{open.preview}</p>
          <div className="mt-5 space-y-3">
            {open.sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4">
                <p className="text-sm font-black text-orange-700">{s.heading}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#2a1e16]/80">{s.text}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Email Newsletter</h1>
        <p className="text-sm text-[#2a1e16]/68">Get the best of The Titan delivered — tips, workouts & reads, weekly</p>
      </div>

      {/* Signup card */}
      <div className="glass-card rounded-3xl p-8" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.16) 0%, transparent 60%)" }}>
        {subscribed ? (
          <div className="text-center">
            <div className="text-5xl">🎉</div>
            <p className="mt-3 text-xl font-black text-emerald-600">You're subscribed!</p>
            <p className="mt-1 text-sm text-[#2a1e16]/68">The next <span className="font-bold text-[#2a1e16]">{freq}</span> issue will arrive at <span className="font-bold text-[#2a1e16]">{email}</span>.</p>
            <button type="button" onClick={unsubscribe} className="mt-5 rounded-full border border-[#2a1e16]/15 bg-[#2a1e16]/5 px-5 py-2 text-xs font-bold text-[#2a1e16]/60 transition hover:bg-rose-400/10 hover:text-rose-600">Unsubscribe</button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-4xl">📬</div>
              <p className="mt-2 text-xl font-black">Join 40,000+ readers</p>
              <p className="mt-1 text-sm text-[#2a1e16]/68">Actionable fitness, nutrition & wellness tips. No spam, unsubscribe anytime.</p>
            </div>
            <div className="mx-auto mt-5 max-w-md space-y-3">
              <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-orange-200/40" />
              <div className="flex justify-center gap-2">
                {["weekly", "biweekly", "monthly"].map((f) => (
                  <button key={f} type="button" onClick={() => setFreq(f)} className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${freq === f ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68"}`}>{f}</button>
                ))}
              </div>
              <button type="button" onClick={subscribe} disabled={!validEmail} className="btn-gloss w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-50">Subscribe Free</button>
              {!validEmail && email.length > 0 && <p className="text-center text-[11px] text-rose-600">Enter a valid email address.</p>}
            </div>
          </>
        )}
      </div>

      {/* Archive */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">📚 Past issues</p>
        <div className="grid gap-3 md:grid-cols-2">
          {ISSUES.map((iss) => (
            <button key={iss.id} type="button" onClick={() => setOpen(iss)} className="glass-card rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-orange-200/30">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2a1e16]/50">📧 {iss.date}</p>
              <h3 className="mt-1.5 text-base font-black leading-tight">{iss.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] text-[#2a1e16]/62">{iss.preview}</p>
              <p className="mt-3 text-[11px] font-bold text-orange-700">Read issue →</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
