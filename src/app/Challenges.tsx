import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthSystem";
import {
  collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, query, orderBy, limit,
} from "firebase/firestore";
import { db } from "../firebase";

const CHALLENGES = [
  {
    id: "fat-loss-30",
    title: "30-Day Fat Loss Challenge",
    emoji: "🔥",
    description: "Burn fat with structured workouts and a calorie deficit plan over 30 days.",
    entryFee: 299,
    prize: "₹5,000 Cash + TigerFit Trophy",
    duration: "30 Days",
    difficulty: "Intermediate",
    category: "Fat Loss",
    spots: 100,
    enrolled: 67,
    startDate: "2026-07-01",
    tasks: ["Daily 30-min cardio", "Calorie tracking", "Weekly weigh-in check"],
  },
  {
    id: "summer-shred",
    title: "Summer Shred Challenge",
    emoji: "☀️",
    description: "Get shredded for summer with HIIT, strength training, and clean eating.",
    entryFee: 499,
    prize: "₹10,000 Cash + Premium Membership",
    duration: "45 Days",
    difficulty: "Advanced",
    category: "Shred",
    spots: 50,
    enrolled: 31,
    startDate: "2026-07-15",
    tasks: ["HIIT 5x/week", "No junk food", "Progress photo uploads"],
  },
  {
    id: "beast-transformation",
    title: "Beast Transformation Challenge",
    emoji: "💪",
    description: "Full-body transformation with heavy lifting and protein-rich diet.",
    entryFee: 999,
    prize: "₹25,000 + Supplement Bundle + 1 Year Premium",
    duration: "60 Days",
    difficulty: "Expert",
    category: "Muscle Gain",
    spots: 30,
    enrolled: 18,
    startDate: "2026-08-01",
    tasks: ["Heavy compound lifts 6x/week", "2g protein/kg bodyweight", "Bi-weekly measurements"],
  },
  {
    id: "sugar-detox-21",
    title: "21-Day Sugar Detox",
    emoji: "🥗",
    description: "Eliminate sugar, reset metabolism, and develop clean eating habits.",
    entryFee: 199,
    prize: "₹3,000 Grocery Voucher + Certificate",
    duration: "21 Days",
    difficulty: "Beginner",
    category: "Detox",
    spots: 200,
    enrolled: 142,
    startDate: "2026-07-07",
    tasks: ["Zero added sugar", "Meal prep Sundays", "Daily hydration log"],
  },
  {
    id: "monsoon-muscle",
    title: "Monsoon Muscle Builder",
    emoji: "⛈️",
    description: "Build muscle during the monsoon with home workouts and a bulking diet.",
    entryFee: 399,
    prize: "₹8,000 + Gym Equipment Kit",
    duration: "40 Days",
    difficulty: "Intermediate",
    category: "Muscle Gain",
    spots: 75,
    enrolled: 44,
    startDate: "2026-07-20",
    tasks: ["Home workout plan", "Caloric surplus meals", "Weekly strength tests"],
  },
];

const DIFF_COLOR: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-orange-100 text-orange-700",
  Expert: "bg-red-100 text-red-700",
};

export function ChallengesSection() {
  return (
    <section id="challenges" className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            🏆 Fitness Challenges
          </span>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Compete. Win. Transform.</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join structured fitness challenges with real prizes. Pay entry, follow the plan, prove your transformation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHALLENGES.slice(0, 3).map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{c.emoji}</div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{c.title}</h3>
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">{c.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLOR[c.difficulty]}`}>{c.difficulty}</span>
                <span className="text-xs text-gray-400">• {c.duration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600 font-bold">₹{c.entryFee} entry</span>
                <span className="text-xs text-gray-400">{c.spots - c.enrolled} spots left</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="#app/challenges" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            View All Challenges →
          </a>
        </div>
      </div>
    </section>
  );
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [joining, setJoining] = useState<string | null>(null);
  const [myEntries, setMyEntries] = useState<Record<string, { joinedAt: string; lastCheckin?: string }>>({});
  const [leaderboard, setLeaderboard] = useState<Record<string, { name: string; points: number; avatar: string }[]>>({});
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubs = CHALLENGES.map((c) => {
      const ref = doc(db, "challengeEntries", c.id, "participants", user.id);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setMyEntries((prev) => ({ ...prev, [c.id]: snap.data() as { joinedAt: string; lastCheckin?: string } }));
        }
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [user?.id]);

  useEffect(() => {
    const unsubs = CHALLENGES.map((c) => {
      const q = query(collection(db, "challengeEntries", c.id, "participants"), orderBy("points", "desc"), limit(5));
      return onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({ name: d.data().name, points: d.data().points || 0, avatar: d.data().avatar || "👤" }));
        setLeaderboard((prev) => ({ ...prev, [c.id]: rows }));
      });
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  async function joinChallenge(c: typeof CHALLENGES[0]) {
    if (!user) return;
    setJoining(c.id);
    try {
      const ref = doc(db, "challengeEntries", c.id, "participants", user.id);
      await setDoc(ref, {
        name: user.name,
        avatar: (user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() + "XX").slice(0, 2),
        joinedAt: new Date().toISOString(),
        points: 0,
        lastCheckin: null,
      }, { merge: true });
    } finally {
      setJoining(null);
    }
  }

  async function doCheckin(challengeId: string) {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const ref = doc(db, "challengeEntries", challengeId, "participants", user.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.lastCheckin === today) {
      setCheckinMsg("Already checked in today!");
      setTimeout(() => setCheckinMsg(null), 2000);
      return;
    }
    await updateDoc(ref, { lastCheckin: today, points: (data.points || 0) + 10, checkinTs: serverTimestamp() });
    setCheckinMsg("✅ Check-in done! +10 pts");
    setTimeout(() => setCheckinMsg(null), 2000);
  }

  const myChallenges = CHALLENGES.filter((c) => myEntries[c.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black mb-2">🏆 Fitness Challenges</h1>
          <p className="text-orange-100">Compete with real people. Win real prizes. Transform your body.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {checkinMsg && (
          <div className="mb-4 bg-green-100 text-green-800 font-semibold px-4 py-2 rounded-xl text-center">{checkinMsg}</div>
        )}

        <div className="flex gap-2 mb-6">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors ${tab === t ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {t === "all" ? "All Challenges" : `My Challenges (${myChallenges.length})`}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {(tab === "all" ? CHALLENGES : myChallenges).map((c) => {
            const joined = !!myEntries[c.id];
            const lb = leaderboard[c.id] || [];
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex gap-4 items-start">
                      <span className="text-4xl">{c.emoji}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl">{c.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">{c.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLOR[c.difficulty]}`}>{c.difficulty}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.category}</span>
                          <span className="text-xs text-gray-400">⏱ {c.duration}</span>
                          <span className="text-xs text-gray-400">📅 Starts {c.startDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-orange-600">₹{c.entryFee}</div>
                      <div className="text-xs text-gray-400">entry fee</div>
                      <div className="text-xs text-green-600 font-semibold mt-1">🏅 {c.prize}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{c.enrolled} joined</span>
                      <span>{c.spots - c.enrolled} spots left</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(c.enrolled / c.spots) * 100}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Weekly Tasks:</p>
                    <ul className="space-y-1">
                      {c.tasks.map((t, i) => (
                        <li key={i} className="text-xs text-gray-500 flex gap-2"><span>✅</span>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex gap-3 flex-wrap">
                    {joined ? (
                      <>
                        <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold text-sm rounded-xl">✅ Enrolled</span>
                        <button
                          onClick={() => doCheckin(c.id)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors"
                        >
                          Daily Check-in
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => joinChallenge(c)}
                        disabled={joining === c.id}
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
                      >
                        {joining === c.id ? "Joining..." : `Join for ₹${c.entryFee}`}
                      </button>
                    )}
                  </div>
                </div>

                {lb.length > 0 && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Leaderboard</p>
                    <div className="space-y-1">
                      {lb.map((row, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">
                            <span className="font-bold text-gray-400 mr-2">#{i + 1}</span>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-200 text-xs font-bold mr-1">{row.avatar}</span>
                            {row.name}
                          </span>
                          <span className="text-sm font-bold text-orange-600">{row.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {tab === "mine" && myChallenges.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🏅</div>
              <p className="font-semibold text-lg">No challenges joined yet</p>
              <button onClick={() => setTab("all")} className="mt-4 text-orange-500 font-semibold">Browse Challenges →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
