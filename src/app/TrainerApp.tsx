import { useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { useCheckout } from "./Checkout";
import PhysioRehabPage from "./PhysioRehab";
import MeditationPage from "./Meditation";
import BloodReportPage from "./BloodReport";
import DietCalculator from "./DietCalculator";
import WorkoutBuilderPage from "./WorkoutBuilder";
import PDFStorePage from "./PDFStore";
import PhysiotherapyLibraryPage from "./PhysiotherapyLibrary";

/* ---------------------------------------------------------------- */
/* Trainer Workspace — a dedicated shell for coaches to manage their  */
/* personal-training clients: fees, attendance, targets, and custom   */
/* plans, plus pro tools (physio, diet, blood reports, workout        */
/* builder, meditation, PDF library) and a trainer subscription.      */
/* Client data persists per trainer in localStorage. No SVG.          */
/* ---------------------------------------------------------------- */

interface Payment { date: string; amount: number }
interface Client {
  id: string;
  name: string;
  phone: string;
  goal: string;
  fee: number;
  cycle: "monthly" | "session" | "quarterly";
  startDate: string;
  target: string;
  plan: string;
  status: "active" | "paused";
  payments: Payment[];
  attendance: string[]; // ISO dates present
}

type View = "dashboard" | "clients" | "attendance" | "fees" | "plans" | "physio" | "physiolib" | "diet" | "blood" | "builder" | "meditation" | "pdf" | "subscription";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function key(email: string | null | undefined) { return `tfp_trainer_clients_${email ?? "guest"}`; }
function loadClients(email: string | null | undefined): Client[] {
  try { return JSON.parse(localStorage.getItem(key(email)) ?? "[]"); } catch { return []; }
}
function uid() { return "c" + Math.abs(Math.floor((Date.now() % 1e9) + performance.now())).toString(36); }

const NAV: { group: string; items: { id: View; icon: string; label: string }[] }[] = [
  { group: "Coaching", items: [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "clients", icon: "👥", label: "Clients" },
    { id: "attendance", icon: "✅", label: "Attendance" },
    { id: "fees", icon: "💰", label: "Fees & Revenue" },
    { id: "plans", icon: "🗂️", label: "Client Plans" },
  ]},
  { group: "Pro Tools", items: [
    { id: "builder", icon: "🗒️", label: "Workout Builder" },
    { id: "diet", icon: "🥗", label: "Diet Calculator" },
    { id: "blood", icon: "🩸", label: "Blood Report" },
    { id: "physio", icon: "🦴", label: "Physio & Rehab" },
    { id: "physiolib", icon: "📚", label: "Physio Library" },
    { id: "meditation", icon: "🧘", label: "Meditation Guide" },
    { id: "pdf", icon: "📄", label: "PDF Library" },
  ]},
  { group: "Account", items: [
    { id: "subscription", icon: "👑", label: "Trainer Plans" },
  ]},
];

const TRAINER_TIERS = [
  { id: "Free", name: "Solo", price: "Free", clients: "Up to 3 clients", features: ["Client roster & profiles", "Attendance & fee tracking", "Basic plan notes", "Core pro tools"], accent: "#2a1e16" },
  { id: "Coach", name: "Coach", price: "₹799/mo", clients: "Up to 40 clients", features: ["Everything in Solo", "Unlimited plans & targets", "Full pro-tools suite", "Revenue analytics", "Priority support"], accent: "#ea580c", popular: true },
  { id: "Studio", name: "Studio", price: "₹1,999/mo", clients: "Unlimited clients + team", features: ["Everything in Coach", "Multi-trainer team seats", "Branded client PDFs", "Bulk messaging & reminders", "Dedicated onboarding"], accent: "#059669" },
];

export default function TrainerApp() {
  const { user, updateUser, logout } = useAuth();
  const { openCheckout } = useCheckout();
  const [view, setView] = useState<View>("dashboard");
  const [clients, setClients] = useState<Client[]>(() => loadClients(user?.email));
  const [mobileOpen, setMobileOpen] = useState(false);

  const trainerPlan = user?.trainerPlan ?? "Free";

  function persist(next: Client[]) {
    setClients(next);
    try { localStorage.setItem(key(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
  }

  return (
    <div className="flex min-h-screen bg-[#faf4ec] text-[#2a1e16]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-orange-300/20 bg-[#fffdf9]/98 backdrop-blur-2xl transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ boxShadow: "4px 0 40px rgba(120,60,10,0.06)" }}>
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-400 via-amber-500 to-emerald-600 text-sm font-black text-white">TT</div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em]">Trainer Studio</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#2a1e16]/60">{trainerPlan} Plan</p>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#2a1e16]/45">{g.group}</p>
                <div className="space-y-1">
                  {g.items.map((it) => (
                    <button key={it.id} type="button" onClick={() => { setView(it.id); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${view === it.id ? "bg-gradient-to-r from-orange-400/20 to-amber-400/10 text-orange-800 border border-orange-300/30" : "text-[#2a1e16]/70 hover:bg-[#2a1e16]/5 border border-transparent"}`}>
                      <span className="text-base">{it.icon}</span>{it.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="rounded-2xl border border-orange-300/20 bg-orange-400/8 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-emerald-600 text-xs font-black text-white">{user?.avatar}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user?.name}</p><p className="truncate text-[10px] text-[#2a1e16]/60">Coach</p></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => updateUser({ role: "general" })} className="flex-1 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 py-2 text-[11px] font-bold text-[#2a1e16]/70 hover:bg-orange-400/10">Member view</button>
              <button type="button" onClick={logout} className="flex-1 rounded-xl border border-rose-400/20 bg-rose-400/10 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-400/20">Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[#2a1e16]/10 bg-[#fffdf9]/70 px-6 py-4 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl border border-[#2a1e16]/12 px-3 py-2 text-sm">☰ Menu</button>
          <span className="text-sm font-bold">Trainer Studio</span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:p-6 lg:p-10">
          {view === "dashboard" && <TrainerDashboard clients={clients} onGo={setView} trainerPlan={trainerPlan} />}
          {view === "clients" && <ClientsManager clients={clients} persist={persist} trainerPlan={trainerPlan} onUpgrade={() => setView("subscription")} />}
          {view === "attendance" && <AttendanceView clients={clients} persist={persist} />}
          {view === "fees" && <FeesView clients={clients} persist={persist} />}
          {view === "plans" && <PlansView clients={clients} persist={persist} />}
          {view === "builder" && <WorkoutBuilderPage />}
          {view === "diet" && <DietCalculator />}
          {view === "blood" && <BloodReportPage />}
          {view === "physio" && <PhysioRehabPage />}
          {view === "physiolib" && <PhysiotherapyLibraryPage />}
          {view === "meditation" && <MeditationPage />}
          {view === "pdf" && <PDFStorePage />}
          {view === "subscription" && <TrainerSubscription current={trainerPlan} onPick={(id) => { if (id === "Free") updateUser({ trainerPlan: "Free" }); else openCheckout(id === "Coach" ? "pro" : "elite"); }} />}
        </main>
      </div>
    </div>
  );
}

/* ===================== Dashboard ===================== */
function TrainerDashboard({ clients, onGo, trainerPlan }: { clients: Client[]; onGo: (v: View) => void; trainerPlan: string }) {
  const active = clients.filter((c) => c.status === "active").length;
  const monthRevenue = clients.reduce((s, c) => s + c.payments.filter((p) => p.date.slice(0, 7) === todayISO().slice(0, 7)).reduce((a, p) => a + p.amount, 0), 0);
  const dueCount = clients.filter((c) => feeStatus(c) === "due").length;
  const presentToday = clients.filter((c) => c.attendance.includes(todayISO())).length;

  const stats = [
    { label: "Active clients", value: active, icon: "👥", color: "#ea580c" },
    { label: "This month", value: `₹${monthRevenue.toLocaleString("en-IN")}`, icon: "💰", color: "#059669" },
    { label: "Fees due", value: dueCount, icon: "⏰", color: "#fb7185" },
    { label: "Present today", value: `${presentToday}/${clients.length}`, icon: "✅", color: "#0284c7" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">Coach Dashboard</p>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Your training business at a glance</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/60">{s.label}</p>
                <p className="mt-2 text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="text-5xl">🧑‍🏫</div>
          <p className="mt-3 text-lg font-black">Add your first client</p>
          <p className="mt-1 text-sm text-[#2a1e16]/62">Build your roster, then track fees, attendance, targets and plans.</p>
          <button type="button" onClick={() => onGo("clients")} className="btn-gloss mt-5 rounded-full bg-gradient-to-r from-orange-400 to-amber-600 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">+ Add a client</button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Recent clients</p>
            <button type="button" onClick={() => onGo("clients")} className="text-xs font-bold text-orange-700">Manage all →</button>
          </div>
          <div className="space-y-2">
            {clients.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/[0.03] p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-400/15 text-sm font-black text-orange-700">{c.name.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{c.name}</p><p className="text-[11px] text-[#2a1e16]/55">{c.goal || "—"}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${feeStatus(c) === "due" ? "bg-rose-400/15 text-rose-600" : "bg-emerald-500/15 text-emerald-700"}`}>{feeStatus(c) === "due" ? "Fee due" : "Paid"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {trainerPlan === "Free" && clients.length >= 3 && (
        <div className="glass-card rounded-2xl border-gold-glow p-5 text-center">
          <p className="text-sm font-black text-[#ea580c]">You've hit the Solo plan limit (3 clients)</p>
          <p className="mt-1 text-xs text-[#2a1e16]/62">Upgrade to Coach for up to 40 clients and the full pro-tools suite.</p>
          <button type="button" onClick={() => onGo("subscription")} className="btn-gloss mt-3 rounded-full bg-gradient-to-r from-orange-400 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">See Trainer Plans</button>
        </div>
      )}
    </div>
  );
}

function feeStatus(c: Client): "paid" | "due" {
  // "Due" if no payment covers the current month (for monthly/quarterly) or none at all.
  if (c.payments.length === 0) return "due";
  const last = c.payments.map((p) => p.date).sort().at(-1)!;
  const monthsSince = monthsBetween(last, todayISO());
  if (c.cycle === "session") return "paid"; // session-based: tracked per session, treat as paid
  if (c.cycle === "quarterly") return monthsSince >= 3 ? "due" : "paid";
  return monthsSince >= 1 ? "due" : "paid";
}
function monthsBetween(a: string, b: string) {
  const [ay, am] = a.split("-").map(Number); const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/* ===================== Clients CRUD ===================== */
const BLANK: Omit<Client, "id" | "payments" | "attendance"> = { name: "", phone: "", goal: "", fee: 2000, cycle: "monthly", startDate: todayISO(), target: "", plan: "", status: "active" };

function ClientsManager({ clients, persist, trainerPlan, onUpgrade }: { clients: Client[]; persist: (c: Client[]) => void; trainerPlan: string; onUpgrade: () => void }) {
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(BLANK);
  const [adding, setAdding] = useState(false);

  const limit = trainerPlan === "Free" ? 3 : trainerPlan === "Coach" ? 40 : Infinity;
  const atLimit = clients.length >= limit;

  function startAdd() {
    if (atLimit) { onUpgrade(); return; }
    setForm(BLANK); setEditing(null); setAdding(true);
  }
  function startEdit(c: Client) { setForm({ ...c }); setEditing(c); setAdding(true); }
  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      persist(clients.map((c) => c.id === editing.id ? { ...editing, ...form } : c));
    } else {
      persist([...clients, { ...form, id: uid(), payments: [], attendance: [] }]);
    }
    setAdding(false); setEditing(null);
  }
  function remove(id: string) {
    if (!confirm("Remove this client and all their records?")) return;
    persist(clients.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Clients</h1>
          <p className="text-sm text-[#2a1e16]/68">{clients.length}{limit !== Infinity ? ` / ${limit}` : ""} clients · {trainerPlan} plan</p>
        </div>
        <button type="button" onClick={startAdd} className="btn-gloss rounded-full bg-gradient-to-r from-orange-400 to-amber-600 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">+ Add client</button>
      </div>

      {adding && (
        <div className="glass-card rounded-2xl p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">{editing ? "Edit client" : "New client"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { k: "name", label: "Name", ph: "Full name" },
              { k: "phone", label: "Phone", ph: "Mobile number" },
              { k: "goal", label: "Goal", ph: "e.g. Fat loss, strength" },
              { k: "startDate", label: "Start date", type: "date" },
            ].map((f) => (
              <label key={f.k} className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">{f.label}</span>
                <input type={f.type ?? "text"} value={(form as any)[f.k]} placeholder={f.ph} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-400/50" />
              </label>
            ))}
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Fee (₹)</span>
              <input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-400/50" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Billing cycle</span>
              <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value as Client["cycle"] })} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-3 py-2.5 text-sm outline-none">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="session">Per session</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Target</span>
              <input value={form.target} placeholder="e.g. Lose 6 kg in 12 weeks" onChange={(e) => setForm({ ...form, target: e.target.value })} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-400/50" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={save} className="btn-gloss rounded-full bg-gradient-to-r from-orange-400 to-amber-600 px-6 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">{editing ? "Save changes" : "Add client"}</button>
            <button type="button" onClick={() => { setAdding(false); setEditing(null); }} className="rounded-full border border-[#2a1e16]/12 px-6 py-2.5 text-xs font-bold text-[#2a1e16]/70">Cancel</button>
          </div>
        </div>
      )}

      {atLimit && !adding && (
        <div className="glass-card rounded-2xl border-gold-glow p-4 text-center text-sm">
          <span className="font-black text-[#ea580c]">Plan limit reached.</span> <button type="button" onClick={onUpgrade} className="font-bold text-orange-700 underline">Upgrade</button> to add more clients.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {clients.map((c) => (
          <div key={c.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-emerald-600 text-sm font-black text-white">{c.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate font-black">{c.name}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${c.status === "active" ? "bg-emerald-500/15 text-emerald-700" : "bg-[#2a1e16]/10 text-[#2a1e16]/55"}`}>{c.status}</span></div>
                <p className="text-[11px] text-[#2a1e16]/55">{c.goal || "No goal set"} · ₹{c.fee}/{c.cycle === "session" ? "session" : c.cycle === "quarterly" ? "qtr" : "mo"}</p>
                {c.target && <p className="mt-1 text-[12px] text-[#2a1e16]/70">🎯 {c.target}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 font-bold ${feeStatus(c) === "due" ? "bg-rose-400/15 text-rose-600" : "bg-emerald-500/15 text-emerald-700"}`}>{feeStatus(c) === "due" ? "Fee due" : "Paid"}</span>
                  <span className="rounded-full bg-[#2a1e16]/8 px-2 py-0.5 text-[#2a1e16]/60">{c.attendance.length} sessions</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => startEdit(c)} className="flex-1 rounded-lg border border-[#2a1e16]/12 py-1.5 text-[11px] font-bold text-[#2a1e16]/70 hover:bg-orange-400/10">Edit</button>
              <button type="button" onClick={() => remove(c.id)} className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-[11px] font-bold text-rose-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== Attendance ===================== */
function AttendanceView({ clients, persist }: { clients: Client[]; persist: (c: Client[]) => void }) {
  const [date, setDate] = useState(todayISO());
  function toggle(c: Client) {
    const has = c.attendance.includes(date);
    const attendance = has ? c.attendance.filter((d) => d !== date) : [...c.attendance, date];
    persist(clients.map((x) => x.id === c.id ? { ...x, attendance } : x));
  }
  const present = clients.filter((c) => c.attendance.includes(date)).length;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Attendance</h1><p className="text-sm text-[#2a1e16]/68">Mark who showed up — {present}/{clients.length} present</p></div>
      <div className="glass-card rounded-2xl p-4">
        <label className="text-sm font-bold">Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ml-2 rounded-lg border border-[#2a1e16]/12 bg-[#fffdf9] px-3 py-1.5 text-sm" /></label>
      </div>
      {clients.length === 0 ? <p className="glass-card rounded-2xl p-8 text-center text-sm text-[#2a1e16]/60">Add clients first to track attendance.</p> : (
        <div className="grid gap-2 md:grid-cols-2">
          {clients.map((c) => {
            const present = c.attendance.includes(date);
            return (
              <button key={c.id} type="button" onClick={() => toggle(c)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${present ? "border-emerald-400/40 bg-emerald-400/10" : "border-[#2a1e16]/10 bg-[#2a1e16]/[0.03]"}`}>
                <div className={`grid h-8 w-8 place-items-center rounded-full ${present ? "bg-emerald-500 text-white" : "border-2 border-[#2a1e16]/20"}`}>{present && "✓"}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{c.name}</p><p className="text-[11px] text-[#2a1e16]/55">{c.attendance.length} total sessions</p></div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===================== Fees ===================== */
function FeesView({ clients, persist }: { clients: Client[]; persist: (c: Client[]) => void }) {
  function collect(c: Client) {
    persist(clients.map((x) => x.id === c.id ? { ...x, payments: [...x.payments, { date: todayISO(), amount: c.fee }] } : x));
  }
  const monthTotal = clients.reduce((s, c) => s + c.payments.filter((p) => p.date.slice(0, 7) === todayISO().slice(0, 7)).reduce((a, p) => a + p.amount, 0), 0);
  const allTime = clients.reduce((s, c) => s + c.payments.reduce((a, p) => a + p.amount, 0), 0);
  const due = clients.filter((c) => feeStatus(c) === "due");
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Fees &amp; Revenue</h1><p className="text-sm text-[#2a1e16]/68">Collect fees and track your income</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-emerald-700">₹{monthTotal.toLocaleString("en-IN")}</p><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/60">This month</p></div>
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-[#ea580c]">₹{allTime.toLocaleString("en-IN")}</p><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/60">All time</p></div>
        <div className="glass-card rounded-2xl p-5 text-center"><p className="text-2xl font-black text-rose-600">{due.length}</p><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/60">Fees due</p></div>
      </div>
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Collect fees</p>
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/[0.03] p-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{c.name}</p><p className="text-[11px] text-[#2a1e16]/55">₹{c.fee}/{c.cycle} · last paid {c.payments.at(-1)?.date ?? "never"}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${feeStatus(c) === "due" ? "bg-rose-400/15 text-rose-600" : "bg-emerald-500/15 text-emerald-700"}`}>{feeStatus(c)}</span>
              <button type="button" onClick={() => collect(c)} className="btn-gloss rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white">Collect ₹{c.fee}</button>
            </div>
          ))}
          {clients.length === 0 && <p className="text-center text-sm text-[#2a1e16]/60">No clients yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ===================== Plans ===================== */
function PlansView({ clients, persist }: { clients: Client[]; persist: (c: Client[]) => void }) {
  const [selId, setSelId] = useState(clients[0]?.id ?? "");
  const sel = clients.find((c) => c.id === selId) ?? clients[0];
  if (!sel) return <div className="space-y-6"><div><h1 className="text-3xl font-black tracking-[-0.04em]">Client Plans</h1></div><p className="glass-card rounded-2xl p-8 text-center text-sm text-[#2a1e16]/60">Add a client to build their custom plan.</p></div>;
  function update(field: "plan" | "target", val: string) {
    persist(clients.map((c) => c.id === sel!.id ? { ...c, [field]: val } : c));
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Client Plans</h1><p className="text-sm text-[#2a1e16]/68">Build a custom plan and target for each client</p></div>
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {clients.map((c) => (
            <button key={c.id} type="button" onClick={() => setSelId(c.id)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${sel.id === c.id ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/70"}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-6">
        <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">🎯 Target</span>
          <input value={sel.target} onChange={(e) => update("target", e.target.value)} placeholder="e.g. Build 3 kg lean mass in 16 weeks" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-400/50" />
        </label>
        <label className="mt-4 block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">🗒️ Custom plan (workouts, diet, notes)</span>
          <textarea value={sel.plan} onChange={(e) => update("plan", e.target.value)} rows={12} placeholder={"Week 1 — Push/Pull/Legs\nMon: Push (bench 4x8, OHP 3x10…)\nDiet: 2200 kcal, 160g protein\nNotes: check knee on squats"} className="w-full resize-y rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm leading-relaxed outline-none focus:border-orange-400/50" />
        </label>
        <p className="mt-2 text-[11px] text-[#2a1e16]/55">Use the Workout Builder and Diet Calculator (Pro Tools) to design the plan, then paste the summary here for {sel.name}.</p>
      </div>
    </div>
  );
}

/* ===================== Trainer Subscription ===================== */
function TrainerSubscription({ current, onPick }: { current: string; onPick: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Trainer Plans</h1><p className="text-sm text-[#2a1e16]/68">Grow your coaching business — plans built for trainers, separate from member plans</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        {TRAINER_TIERS.map((t) => {
          const isCurrent = current === t.id;
          return (
            <div key={t.id} className={`relative rounded-3xl border p-7 ${t.popular ? "border-orange-400/40 bg-orange-400/8 shadow-[0_0_60px_rgba(234,88,12,0.12)]" : "border-[#2a1e16]/10 bg-[#fffdf9]"}`}>
              {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-400 to-amber-600 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">Most Popular</div>}
              <h3 className="text-2xl font-black" style={{ color: t.accent }}>{t.name}</h3>
              <p className="mt-1 text-sm text-[#2a1e16]/62">{t.clients}</p>
              <p className="mt-4 text-3xl font-black">{t.price}</p>
              <ul className="mt-5 space-y-2">
                {t.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-[#2a1e16]/75"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.accent }} />{f}</li>)}
              </ul>
              {isCurrent ? (
                <div className="mt-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Current plan</div>
              ) : (
                <button type="button" onClick={() => onPick(t.id)} className="btn-gloss mt-6 w-full rounded-full py-3 text-xs font-black uppercase tracking-[0.16em] text-white" style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.accent}cc)` }}>{t.id === "Free" ? "Switch to Solo" : `Upgrade to ${t.name}`}</button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-[#2a1e16]/55">Trainer subscriptions are billed separately from personal member plans.</p>
    </div>
  );
}
