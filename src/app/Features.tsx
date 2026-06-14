import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Roadmap - Step by step goal guide                                 */
/* ---------------------------------------------------------------- */

export function GoalRoadmap() {
  const { user } = useAuth();
  if (!user) return null;

  const roadmap: any = {
    "fat-loss": [
      { week: "Week 1-2", title: "Foundation Phase", tasks: ["Calculate TDEE & create 500 kcal deficit", "Start tracking all meals", "3x full-body workouts/week", "Walk 8K steps daily", "Sleep 7+ hours"] },
      { week: "Week 3-4", title: "Acceleration", tasks: ["Add 2 HIIT sessions", "Increase protein to 2g/kg", "Progressive overload in gym", "Weekly progress photos", "Reduce sodium intake"] },
      { week: "Week 5-8", title: "Intensification", tasks: ["Push deficit to 600 kcal if plateau", "Add morning fasted cardio", "Increase steps to 10K", "Try intermittent fasting", "Monitor energy levels"] },
      { week: "Week 9-12", title: "Peak Phase", tasks: ["Refeed day every 10 days", "Maintain strict tracking", "Add ab-specific work", "Final transformation photos", "Plan maintenance phase"] },
    ],
    "muscle-gain": [
      { week: "Week 1-2", title: "Base Building", tasks: ["Calculate TDEE + 300 kcal surplus", "Eat 2g protein per kg", "4x push/pull/legs split", "Sleep 8+ hours", "Track all lifts"] },
      { week: "Week 3-6", title: "Hypertrophy Focus", tasks: ["Progressive overload weekly", "Add drop sets on last set", "Increase carbs around workout", "Creatine 5g daily", "Weekly body measurements"] },
      { week: "Week 7-10", title: "Strength Phase", tasks: ["Lower reps (5-8) heavy compounds", "Deload week every 4th week", "Increase surplus if stalled", "Add accessory work", "Monitor body fat"] },
      { week: "Week 11-12", title: "Peak & Assess", tasks: ["Final strength test", "Transformation photos", "Calculate FFMI progress", "Plan next phase", "Celebrate gains!"] },
    ],
    wedding: [
      { week: "Week 1-4", title: "Assessment & Setup", tasks: ["Complete onboarding quiz", "Set realistic wedding goal", "Start AI meal planning", "3x workouts/week", "Daily 10K steps"] },
      { week: "Week 5-8", title: "Consistent Progress", tasks: ["Follow AI plan strictly", "Weekly check-ins with coach", "Increase workout intensity", "Reduce alcohol & sugar", "Sleep optimization"] },
      { week: "Week 9-12", title: "Transformation Push", tasks: ["Add extra cardio sessions", "Tighten nutrition tracking", "Progress photos every 2 weeks", "Wedding outfit fitting", "Stay motivated!"] },
      { week: "Week 13-16", title: "Final Polish", tasks: ["Peak week protocol", "Reduce sodium 3 days before", "Hydrate extra", "Final transformation photos", "Enjoy your big day!"] },
    ],
    maintenance: [
      { week: "Ongoing", title: "Sustainable Habits", tasks: ["Eat at TDEE maintenance", "4x mixed workouts/week", "Flexible dieting 80/20 rule", "Regular progress checks", "Enjoy life while staying fit"] },
    ],
    general: [
      { week: "Month 1", title: "Build Foundation", tasks: ["Complete health assessment", "Set SMART fitness goals", "Establish workout routine", "Improve sleep hygiene", "Start food tracking"] },
      { week: "Month 2-3", title: "Progress & Adapt", tasks: ["Increase workout intensity", "Refine nutrition based on goals", "Build consistency streaks", "Try new activities", "Track progress metrics"] },
      { week: "Month 4+", title: "Mastery", tasks: ["Achieve primary goal", "Set new challenges", "Help others in community", "Maintain long-term habits", "Celebrate achievements"] },
    ],
  };

  const steps = roadmap[user.goal] || roadmap.general;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Your Goal Roadmap</h1>
        <p className="text-sm text-[#f7f0df]/50">Step-by-step guide to achieve your {user.goal.replace("-", " ")} goal</p>
      </div>

      <div className="space-y-6">
        {steps.map((phase: any, i: number) => (
          <div key={i} className="relative rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
            <div className="absolute -left-3 top-6 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">{i + 1}</div>
            <div className="ml-6">
              <div className="flex items-baseline gap-3">
                <span className="rounded-full bg-violet-200/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-100">{phase.week}</span>
                <h3 className="text-xl font-black">{phase.title}</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {phase.tasks.map((task: string, j: number) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                    <span className="text-sm text-[#f7f0df]/72">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Transformations - Before/After photos                            */
/* ---------------------------------------------------------------- */

export function Transformations() {
  const { user } = useAuth();
  const [transformations, setTransformations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`tfp_transformations_${user?.id}`) || "[]"); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", beforeDate: "", afterDate: "", weightBefore: "", weightAfter: "", notes: "" });

  useEffect(() => { if (user) localStorage.setItem(`tfp_transformations_${user.id}`, JSON.stringify(transformations)); }, [transformations, user]);

  function addTransformation() {
    const newT = { ...form, id: Date.now(), userId: user?.id };
    setTransformations([...transformations, newT]);
    setForm({ title: "", beforeDate: "", afterDate: "", weightBefore: "", weightAfter: "", notes: "" });
    setShowForm(false);
  }

  const dummyTransformations = [
    { title: "Rahul's Wedding Transformation", before: "92 kg", after: "78 kg", duration: "120 days", user: "Rahul S." },
    { title: "Priya's Post-Pregnancy Journey", before: "72 kg", after: "58 kg", duration: "6 months", user: "Priya M." },
    { title: "Arjun's Muscle Gain", before: "65 kg", after: "78 kg", duration: "8 months", user: "Arjun K." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Transformation Journey</h1>
          <p className="text-sm text-[#f7f0df]/50">Track your before & after progress</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
          {showForm ? "Close" : "+ Add Transformation"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-6">
          <h3 className="mb-4 font-bold">New Transformation Entry</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none" placeholder="My 3-Month Journey" /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Before Date</span><input type="date" value={form.beforeDate} onChange={(e) => setForm({ ...form, beforeDate: e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">After Date</span><input type="date" value={form.afterDate} onChange={(e) => setForm({ ...form, afterDate: e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Weight Before (kg)</span><input value={form.weightBefore} onChange={(e) => setForm({ ...form, weightBefore: e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none" placeholder="85" /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Weight After (kg)</span><input value={form.weightAfter} onChange={(e) => setForm({ ...form, weightAfter: e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none" placeholder="75" /></label>
            <label className="block"><span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">Notes</span><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none" placeholder="Lost 10kg in 3 months!" /></label>
          </div>
          <button type="button" onClick={addTransformation} className="mt-6 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white">Save Transformation</button>
        </div>
      )}

      {/* User Transformations */}
      {transformations.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold">Your Transformations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {transformations.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
                <h3 className="text-lg font-bold">{t.title}</h3>
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-center"><p className="text-xs text-[#f7f0df]/50">Before</p><p className="text-2xl font-black">{t.weightBefore} kg</p></div>
                  <span className="text-2xl">→</span>
                  <div className="text-center"><p className="text-xs text-[#f7f0df]/50">After</p><p className="text-2xl font-black text-emerald-300">{t.weightAfter} kg</p></div>
                </div>
                <p className="mt-3 text-sm text-[#f7f0df]/60">{t.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Transformations */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Community Success Stories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {dummyTransformations.map((t, i) => (
            <div key={i} className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-violet-200/8 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">Featured</p>
              <h3 className="mt-2 text-lg font-bold">{t.title}</h3>
              <p className="mt-1 text-sm text-[#f7f0df]/60">by {t.user}</p>
              <div className="mt-4 flex items-center justify-between">
                <div><p className="text-xs text-[#f7f0df]/50">Before</p><p className="text-xl font-black">{t.before}</p></div>
                <div><p className="text-xs text-[#f7f0df]/50">After</p><p className="text-xl font-black text-emerald-300">{t.after}</p></div>
                <div><p className="text-xs text-[#f7f0df]/50">Duration</p><p className="text-sm font-bold">{t.duration}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Referrals & Wallet                                                */
/* ---------------------------------------------------------------- */

export function Referrals() {
  const { user } = useAuth();
  const referralCode = useMemo(() => user?.id?.slice(-6).toUpperCase() || "DEMO01", [user]);
  const wallet = useMemo(() => { try { return JSON.parse(localStorage.getItem(`tfp_wallet_${user?.id}`) || '{"balance": 0, "transactions": []}'); } catch { return { balance: 0, transactions: [] }; } }, [user]);
  const [upiId, setUpiId] = useState("");

  function updateWallet(newBalance: number, transaction: any) {
    const updated = { balance: newBalance, transactions: [transaction, ...wallet.transactions] };
    localStorage.setItem(`tfp_wallet_${user?.id}`, JSON.stringify(updated));
    window.location.reload();
  }

  function handleRedeem() {
    if (wallet.balance < 500) { alert("Minimum ₹500 required to redeem!"); return; }
    if (!upiId) { alert("Please enter UPI ID!"); return; }
    if (!confirm(`Redeem ₹${wallet.balance} to ${upiId}?`)) return;
    
    const request = { userId: user?.id, amount: wallet.balance, upiId, date: new Date().toISOString(), status: "pending" };
    const requests = JSON.parse(localStorage.getItem("tfp_redemption_requests") || "[]");
    requests.push(request);
    localStorage.setItem("tfp_redemption_requests", JSON.stringify(requests));
    
    updateWallet(0, { type: "redeem", amount: wallet.balance, upiId, date: new Date().toISOString(), status: "pending" });
    alert("Redemption request submitted! Admin will process it within 24-48 hours.");
  }

  // Dummy referral earnings for demo
  useEffect(() => {
    if (wallet.balance === 0 && wallet.transactions.length === 0) {
      const dummyTx = [
        { type: "referral", amount: 100, date: "2025-06-01", from: "Rahul S." },
        { type: "referral", amount: 100, date: "2025-06-05", from: "Priya M." },
        { type: "referral", amount: 100, date: "2025-06-10", from: "Arjun K." },
      ];
      updateWallet(300, dummyTx[0]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Referrals & Wallet</h1>
        <p className="text-sm text-[#f7f0df]/50">Earn ₹100 for every friend who joins</p>
      </div>

      {/* Wallet Balance */}
      <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/15 to-violet-200/8 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8b35a]">Wallet Balance</p>
        <p className="mt-3 bg-gradient-to-r from-[#d8b35a] to-orange-400 bg-clip-text text-6xl font-black text-transparent">₹{wallet.balance}</p>
        <p className="mt-2 text-sm text-[#f7f0df]/60">{wallet.balance < 500 ? `₹${500 - wallet.balance} more to redeem` : "Ready to redeem!"}</p>
        
        {wallet.balance >= 500 && (
          <div className="mt-6 space-y-3">
            <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="Enter UPI ID (e.g., yourname@paytm)" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
            <button type="button" onClick={handleRedeem} className="w-full rounded-full bg-gradient-to-r from-[#d8b35a] to-orange-400 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#090511]">💸 Redeem to UPI</button>
          </div>
        )}
      </div>

      {/* Referral Code */}
      <div className="rounded-2xl border border-violet-200/20 bg-violet-200/10 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-100">Your Referral Code</p>
        <div className="mt-3 flex items-center gap-3">
          <code className="flex-1 rounded-xl bg-[#0b0714] px-4 py-3 text-2xl font-black text-violet-100">{referralCode}</code>
          <button type="button" onClick={() => { navigator.clipboard.writeText(referralCode); alert("Code copied!"); }} className="rounded-full bg-violet-200/20 px-5 py-3 text-xs font-bold text-violet-100">Copy</button>
        </div>
        <p className="mt-3 text-sm text-[#f7f0df]/60">Share this code with friends. When they sign up and purchase a plan, you earn ₹100!</p>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-4 font-bold">Transaction History</h3>
        {wallet.transactions.length === 0 ? (
          <p className="text-sm text-[#f7f0df]/50">No transactions yet. Start referring friends!</p>
        ) : (
          <div className="space-y-3">
            {wallet.transactions.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-[#f7f0df]/8 bg-[#f7f0df]/5 p-4">
                <div>
                  <p className="font-bold capitalize">{t.type === "referral" ? `Referral from ${t.from || "User"}` : "Redemption"}</p>
                  <p className="text-xs text-[#f7f0df]/50">{t.date}</p>
                </div>
                <p className={`font-bold ${t.type === "referral" ? "text-emerald-300" : "text-rose-300"}`}>{t.type === "referral" ? "+" : "-"}₹{t.amount}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-4 font-bold">How Referrals Work</h3>
        <div className="space-y-3 text-sm text-[#f7f0df]/68">
          <p>1️⃣ Share your referral code with friends</p>
          <p>2️⃣ They sign up using your code</p>
          <p>3️⃣ When they purchase Pro or Elite plan, you earn ₹100</p>
          <p>4️⃣ Redeem when balance reaches ₹500 minimum</p>
          <p>5️⃣ Money sent to your UPI within 24-48 hours after admin approval</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Leaderboard                                                       */
/* ---------------------------------------------------------------- */

export function Leaderboard() {
  // Dummy data that shuffles daily based on date
  const todaySeed = new Date().getDate();
  const dummyUsers = useMemo(() => {
    const users = [
      { name: "Rahul Sharma", score: 9850, streak: 47, avatar: "RS" },
      { name: "Priya Mehta", score: 9420, streak: 42, avatar: "PM" },
      { name: "Arjun Kapoor", score: 9180, streak: 38, avatar: "AK" },
      { name: "Ananya Singh", score: 8950, streak: 35, avatar: "AS" },
      { name: "Vikram Patel", score: 8720, streak: 33, avatar: "VP" },
      { name: "Neha Gupta", score: 8540, streak: 31, avatar: "NG" },
      { name: "Rohan Verma", score: 8320, streak: 29, avatar: "RV" },
      { name: "Kavya Reddy", score: 8100, streak: 27, avatar: "KR" },
    ];
    // Shuffle based on date
    return users.sort((a, b) => ((a.score + todaySeed) % 100) - ((b.score + todaySeed) % 100)).reverse();
  }, [todaySeed]);

  const { user } = useAuth();
  const myScore = 7850; // Dummy score for current user
  const myRank = dummyUsers.findIndex((u) => u.score < myScore) + 1 || 9;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Monthly Leaderboard</h1>
        <p className="text-sm text-[#f7f0df]/50">Top 3 win ₹15,000 supplement stack!</p>
      </div>

      {/* Top 3 */}
      <div className="grid gap-4 md:grid-cols-3">
        {dummyUsers.slice(0, 3).map((u, i) => (
          <div key={u.name} className={`relative rounded-2xl border p-6 ${i === 0 ? "border-[#d8b35a]/40 bg-gradient-to-br from-[#d8b35a]/15 to-violet-200/8" : "border-[#f7f0df]/10 bg-[#f7f0df]/5"}`}>
            {i === 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#d8b35a] px-4 py-1 text-xs font-black text-[#090511]">🏆 1st Place</div>}
            {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-300 px-4 py-1 text-xs font-black text-[#090511]">🥈 2nd Place</div>}
            {i === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-400 px-4 py-1 text-xs font-black text-[#090511]">🥉 3rd Place</div>}
            <div className="mt-3 flex flex-col items-center text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-2xl font-black text-[#090511]">{u.avatar}</div>
              <p className="mt-4 text-lg font-bold">{u.name}</p>
              <p className="mt-2 bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-4xl font-black text-transparent">{u.score.toLocaleString()}</p>
              <p className="text-xs text-[#f7f0df]/50">Tiger Score</p>
              <p className="mt-2 text-sm">🔥 {u.streak} day streak</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Rank */}
      <div className="rounded-2xl border border-violet-200/30 bg-violet-200/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-lg font-black text-[#090511]">{user?.avatar}</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100">Your Rank</p>
              <p className="text-2xl font-black">#{myRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100">Your Score</p>
            <p className="text-3xl font-black text-violet-100">{myScore.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-4 font-bold">Full Rankings</h3>
        <div className="space-y-3">
          {dummyUsers.map((u, i) => (
            <div key={u.name} className="flex items-center justify-between rounded-xl border border-[#f7f0df]/8 bg-[#f7f0df]/5 p-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-[#f7f0df]/30">#{i + 1}</span>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">{u.avatar}</div>
                <div>
                  <p className="font-bold">{u.name}</p>
                  <p className="text-xs text-[#f7f0df]/50">🔥 {u.streak} day streak</p>
                </div>
              </div>
              <p className="text-lg font-black text-violet-100">{u.score.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Info */}
      <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-violet-200/8 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8b35a]">🏆 Monthly Prize</p>
        <h3 className="mt-2 text-2xl font-black">₹15,000 Supplement Stack</h3>
        <p className="mt-2 text-sm text-[#f7f0df]/66">Top 3 users with highest Tiger Score win premium supplement stacks worth ₹15,000. Tiger Score includes daily activity, streak maintenance, transformation uploads, and goal completion.</p>
        <p className="mt-4 text-xs text-[#f7f0df]/40">Leaderboard resets on the 1st of every month. Winners announced on the 3rd.</p>
      </div>
    </div>
  );
}
