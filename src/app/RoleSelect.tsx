import { useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Role Select — shown once after onboarding. Choose whether you're   */
/* a general member (personal dashboard) or a trainer (client-        */
/* management workspace). Persisted to the profile. No SVG.           */
/* ---------------------------------------------------------------- */

const ROLES = [
  {
    id: "general" as const,
    icon: "🏃",
    title: "I'm here for myself",
    subtitle: "General Member",
    accent: "#ea580c",
    points: ["Personal AI dashboard", "Workouts, nutrition & wellness", "150+ tools, libraries & courses", "Track your own progress"],
  },
  {
    id: "trainer" as const,
    icon: "🧑‍🏫",
    title: "I train clients",
    subtitle: "Coach / Trainer",
    accent: "#059669",
    points: ["Manage all your clients in one place", "Fees, attendance, targets & plans", "Build custom plans per client", "Pro tools: physio, diet, blood reports & more"],
  },
];

export default function RoleSelect() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);

  async function choose(role: "general" | "trainer") {
    setSaving(role);
    await updateUser({ role });
    // updateUser updates local state; the app re-renders into the right shell.
  }

  return (
    <div className="min-h-screen bg-[#faf4ec] text-[#2a1e16]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</span>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">How will you use The Titan Fitness?</h1>
          <p className="mt-2 text-sm text-[#2a1e16]/68">Pick the experience that fits you. You can switch later in Settings.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={!!saving}
              onClick={() => choose(r.id)}
              className="light-card group relative overflow-hidden rounded-3xl p-8 text-left transition hover:-translate-y-1 disabled:opacity-60"
              style={{ borderColor: `${r.accent}33` }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${r.accent}, transparent)` }} />
              <div className="grid h-16 w-16 place-items-center rounded-2xl text-4xl transition-transform group-hover:scale-110" style={{ background: `${r.accent}1a` }}>{r.icon}</div>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: r.accent }}>{r.subtitle}</p>
              <h2 className="mt-1 text-2xl font-black">{r.title}</h2>
              <ul className="mt-4 space-y-2">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-[#2a1e16]/75">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.accent }} />{p}
                  </li>
                ))}
              </ul>
              <div className="btn-gloss mt-6 rounded-full py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white" style={{ background: r.accent }}>
                {saving === r.id ? "Setting up…" : "Continue →"}
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-[#2a1e16]/50">Trainers get a dedicated client-management workspace with its own subscription. Members get the full personal fitness app.</p>
      </div>
    </div>
  );
}
