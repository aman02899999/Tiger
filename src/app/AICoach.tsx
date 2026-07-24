import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* AI Coach — conversational fitness Q&A with typing indicator and   */
/* quick-question chips. Rule-based responses, fully client-side.    */
/* ---------------------------------------------------------------- */

interface Msg {
  role: "user" | "coach";
  text: string;
}

const KNOWLEDGE: { match: RegExp; reply: (name: string) => string }[] = [
  {
    match: /protein|प्रोटीन/i,
    reply: () =>
      "For muscle building, aim for 1.6–2.2g of protein per kg of bodyweight daily. 🥚 Great Indian sources: paneer (18g/100g), dal + rice combo, eggs, chicken breast (31g/100g), whey after workouts. Spread it across 4–5 meals for best absorption.",
  },
  {
    match: /fat loss|lose (weight|fat)|cutting|belly/i,
    reply: (name) =>
      `${name}, fat loss = calorie deficit + patience. Start with a 300–500 kcal daily deficit, keep protein high (2g/kg) to protect muscle, walk 8–10k steps, and lift 3–4× a week. Belly fat goes last — no spot reduction exists, consistency wins. 🔥`,
  },
  {
    match: /muscle|bulk|gain|mass/i,
    reply: () =>
      "To build muscle: eat a 200–300 kcal surplus, hit each muscle 2× per week, progressive overload (add weight or reps every session), sleep 7–9 hours. Track your lifts — if the numbers go up over months, you're growing. 💪",
  },
  {
    match: /sleep|recovery|rest day|sore/i,
    reply: () =>
      "Recovery is where growth happens! 😴 Target 7–9 hours of sleep, take 1–2 rest days per week, and don't fear soreness — light movement (walking, yoga) actually speeds it up. If a joint hurts (not muscle), rest it and check the Physio & Rehab section.",
  },
  {
    match: /water|hydrat/i,
    reply: () =>
      "Aim for 3–4L daily, more on training days. 💧 A good check: pale yellow urine. Use the Daily Rewards water tracker — you even earn 25 XP for hitting your goal!",
  },
  {
    match: /creatine/i,
    reply: () =>
      "Creatine monohydrate is the most researched supplement in existence — 3–5g daily, any time of day, no loading needed, no cycling needed. It's safe for healthy kidneys and gives ~5–10% strength boost. The 1–2kg water weight gain is normal and good. 💊",
  },
  {
    match: /beginner|start|new|शुरू/i,
    reply: (name) =>
      `Welcome ${name}! ⚡ Start simple: 3 full-body workouts per week (try our Core Crusher or Push plans), 8k steps daily, protein at every meal, and sleep 7+. Master consistency for 8 weeks before optimizing anything else. Your only competition is yesterday's you.`,
  },
  {
    match: /motivat|lazy|skip|मन नहीं/i,
    reply: () =>
      "Motivation fades — systems last. 🎯 Shrink the goal: commit to just 10 minutes today. Once you start, you'll usually finish. Also check your streak on the dashboard — don't break the chain! Discipline is choosing what you want MOST over what you want NOW.",
  },
  {
    match: /diet|meal|khana|खाना|eat/i,
    reply: () =>
      "Head to the Auto Diet section for a personalized plan! Quick template: breakfast = protein + complex carbs (eggs + oats), lunch = dal/chicken + rice + salad, snack = fruit + nuts, dinner = paneer/fish + roti + sabzi. 🍛 Track calories for 2 weeks to learn portions.",
  },
  {
    match: /cardio|running|walk/i,
    reply: () =>
      "Cardio guideline: 150+ min moderate per week for heart health. For fat loss, walking 8–10k steps daily beats occasional intense runs (easier to recover, easier to sustain). Do cardio after weights or on separate days so it doesn't eat your strength gains. 🏃",
  },
];

const FALLBACKS = [
  "Great question! ⚡ My strongest areas: training splits, protein & nutrition, fat loss, muscle gain, sleep, creatine, cardio, and motivation. Try asking about one of those — or tap a quick question below.",
  "I want to give you accurate advice — could you rephrase that? I'm best at workout, diet, recovery, and supplement questions. 💪",
];

const QUICK_QUESTIONS = [
  "How much protein do I need?",
  "How do I lose belly fat?",
  "Is creatine safe?",
  "I feel lazy today, motivate me",
  "Best beginner plan?",
];

export default function AICoachPage() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "Titan";
  const [messages, setMessages] = useState<Msg[]>([
    { role: "coach", text: `Hey ${name}! ⚡ I'm your AI Coach — ask me anything about training, nutrition, recovery, or supplements. Let's get you results.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fallbackIdx = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    const hit = KNOWLEDGE.find((k) => k.match.test(q));
    const reply = hit ? hit.reply(name) : FALLBACKS[fallbackIdx.current++ % FALLBACKS.length];
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "coach", text: reply }]);
    }, 900 + Math.min(reply.length * 4, 1400));
  }

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[480px] flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">AI Coach</h1>
        <p className="text-sm text-[#2a1e16]/68">24/7 answers on training, nutrition & recovery</p>
      </div>

      {/* chat window */}
      <div className="glass-card flex min-h-0 flex-1 flex-col rounded-3xl">
        <div className="flex items-center gap-3 border-b border-[#2a1e16]/8 px-6 py-4">
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange-300 via-amber-500 to-[#ea580c] text-lg">
            ⚡
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#fffdf9] bg-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-black">Coach Titan</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Online · replies instantly</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-[0_8px_24px_rgba(249,115,22,0.25)]"
                    : "rounded-bl-md border border-[#2a1e16]/10 bg-[#2a1e16]/6 text-[#2a1e16]/92"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#2a1e16]/10 bg-[#2a1e16]/6 px-5 py-4">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-orange-300" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* quick chips */}
        <div className="flex gap-2 overflow-x-auto px-6 pb-3">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="whitespace-nowrap rounded-full border border-orange-200/25 bg-orange-200/8 px-4 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-200/18"
            >
              {q}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="flex gap-3 border-t border-[#2a1e16]/8 px-6 py-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask your coach anything…"
            className="min-w-0 flex-1 rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/6 px-5 py-3 text-sm outline-none placeholder:text-[#2a1e16]/45 focus:border-orange-200/40"
          />
          <button
            type="button"
            onClick={() => send(input)}
            className="btn-gloss rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-7 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
          >
            Send ➤
          </button>
        </div>
      </div>
    </div>
  );
}
