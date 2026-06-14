import { useState } from "react";
import { useAuth } from "./AuthSystem";

type Step = "goal" | "body" | "activity" | "plan" | "done";

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState<Step>("goal");
  const [data, setData] = useState({
    goal: user?.goal || "general",
    age: user?.age || 25,
    gender: user?.gender || "male",
    height: user?.height || 170,
    weight: user?.weight || 70,
    activity: "moderate",
    plan: "Free" as "Free" | "Pro" | "Elite",
  });

  const steps: Step[] = ["goal", "body", "activity", "plan", "done"];
  const progress = ((steps.indexOf(step) + 1) / steps.length) * 100;

  function handleFinish() {
    completeOnboarding(data);
    onComplete();
  }

  return (
    <div className="min-h-screen bg-[#07040d] text-[#f7f0df] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">TF</div>
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7f0df]/70">Onboarding</span>
            </div>
            <span className="text-xs font-bold text-violet-100">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-[#d8b35a] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step 1: Goal */}
        {step === "goal" && (
          <div className="animate-[fadeUp_400ms_ease-out]">
            <h1 className="text-4xl font-black tracking-[-0.05em]">What's your goal?</h1>
            <p className="mt-2 text-sm text-[#f7f0df]/50">We'll personalize everything based on this.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { id: "fat-loss", icon: "🔥", label: "Fat Loss", desc: "Lose weight and get lean" },
                { id: "muscle-gain", icon: "💪", label: "Muscle Gain", desc: "Build strength and size" },
                { id: "wedding", icon: "💍", label: "Wedding Ready", desc: "120-day transformation" },
                { id: "maintenance", icon: "⚖️", label: "Maintenance", desc: "Stay fit and healthy" },
                { id: "general", icon: "", label: "General Fitness", desc: "Overall wellness" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { setData({ ...data, goal: g.id as any }); setStep("body"); }}
                  className={`rounded-2xl border p-5 text-left transition ${data.goal === g.id ? "border-violet-300/50 bg-violet-200/10" : "border-[#f7f0df]/10 bg-[#f7f0df]/5 hover:bg-[#f7f0df]/10"}`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <p className="mt-3 text-lg font-bold">{g.label}</p>
                  <p className="text-xs text-[#f7f0df]/50">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Body */}
        {step === "body" && (
          <div className="animate-[fadeUp_400ms_ease-out]">
            <h1 className="text-4xl font-black tracking-[-0.05em]">Tell us about yourself.</h1>
            <p className="mt-2 text-sm text-[#f7f0df]/50">Helps us calculate your personalized plan.</p>
            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Age</span>
                <input type="number" value={data.age} onChange={(e) => setData({ ...data, age: +e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40" />
              </label>
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Gender</span>
                <div className="grid grid-cols-3 gap-3">
                  {["male", "female", "other"].map((g) => (
                    <button key={g} type="button" onClick={() => setData({ ...data, gender: g as any })} className={`rounded-xl border p-3 text-sm font-bold capitalize ${data.gender === g ? "border-violet-300/50 bg-violet-200/10" : "border-[#f7f0df]/10 bg-[#f7f0df]/5"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Height (cm)</span>
                  <input type="number" value={data.height} onChange={(e) => setData({ ...data, height: +e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Weight (kg)</span>
                  <input type="number" value={data.weight} onChange={(e) => setData({ ...data, weight: +e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40" />
                </label>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setStep("goal")} className="rounded-full border border-[#f7f0df]/18 bg-[#f7f0df]/8 px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]">Back</button>
              <button type="button" onClick={() => setStep("activity")} className="flex-1 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-4 text-xs font-black uppercase tracking-[0.2em] text-white">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Activity */}
        {step === "activity" && (
          <div className="animate-[fadeUp_400ms_ease-out]">
            <h1 className="text-4xl font-black tracking-[-0.05em]">How active are you?</h1>
            <p className="mt-2 text-sm text-[#f7f0df]/50">We'll adjust workout intensity accordingly.</p>
            <div className="mt-8 space-y-3">
              {[
                { id: "sedentary", icon: "🛋️", label: "Sedentary", desc: "Little to no exercise" },
                { id: "light", icon: "🚶", label: "Light", desc: "1-2 days/week" },
                { id: "moderate", icon: "🏃", label: "Moderate", desc: "3-4 days/week" },
                { id: "active", icon: "💪", label: "Active", desc: "5-6 days/week" },
                { id: "very-active", icon: "🔥", label: "Very Active", desc: "Athlete level" },
              ].map((a) => (
                <button key={a.id} type="button" onClick={() => setData({ ...data, activity: a.id })} className={`w-full flex items-center gap-4 rounded-2xl border p-5 text-left transition ${data.activity === a.id ? "border-violet-300/50 bg-violet-200/10" : "border-[#f7f0df]/10 bg-[#f7f0df]/5 hover:bg-[#f7f0df]/10"}`}>
                  <span className="text-3xl">{a.icon}</span>
                  <div>
                    <p className="font-bold">{a.label}</p>
                    <p className="text-xs text-[#f7f0df]/50">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setStep("body")} className="rounded-full border border-[#f7f0df]/18 bg-[#f7f0df]/8 px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]">Back</button>
              <button type="button" onClick={() => setStep("plan")} className="flex-1 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-4 text-xs font-black uppercase tracking-[0.2em] text-white">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Plan */}
        {step === "plan" && (
          <div className="animate-[fadeUp_400ms_ease-out]">
            <h1 className="text-4xl font-black tracking-[-0.05em]">Choose your plan.</h1>
            <p className="mt-2 text-sm text-[#f7f0df]/50">Upgrade anytime. Cancel anytime.</p>
            <div className="mt-8 grid gap-3">
              {[
                { id: "Free", price: "₹0", period: "forever", features: ["Basic workouts", "5 AI sessions/month", "Community"] },
                { id: "Pro", price: "₹199", period: "/month", features: ["Everything in Free", "Unlimited AI", "Food scanner", "Wedding mode"], popular: true },
                { id: "Elite", price: "₹399", period: "/month", features: ["Everything in Pro", "Family dashboard", "Medical analyzer", "Voice coach"] },
              ].map((p) => (
                <button key={p.id} type="button" onClick={() => setData({ ...data, plan: p.id as any })} className={`relative rounded-2xl border p-5 text-left transition ${(p as any).popular ? "border-violet-300/50 bg-violet-200/10" : "border-[#f7f0df]/10 bg-[#f7f0df]/5"} ${data.plan === p.id ? "ring-2 ring-violet-300" : ""}`}>
                  {(p as any).popular && <span className="absolute -top-2 right-5 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Most Popular</span>}
                  <div className="flex items-baseline justify-between">
                    <p className="text-xl font-black">{p.id}</p>
                    <div className="text-right">
                      <span className="text-3xl font-black">{p.price}</span>
                      <span className="text-xs text-[#f7f0df]/50">{p.period}</span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => <li key={f} className="flex items-center gap-2 text-xs text-[#f7f0df]/60"><span className="h-1 w-1 rounded-full bg-violet-300" />{f}</li>)}
                  </ul>
                </button>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setStep("activity")} className="rounded-full border border-[#f7f0df]/18 bg-[#f7f0df]/8 px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]">Back</button>
              <button type="button" onClick={handleFinish} className="flex-1 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-4 text-xs font-black uppercase tracking-[0.2em] text-white">Start My Journey 🐅</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
