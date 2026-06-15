import { useState, useEffect } from "react";
import { blogs as defaultBlogs, type BlogPost } from "../data/blogs";
import {
  loadData, saveData, generateId,
  defaultFeatures, defaultTestimonials, defaultPricingPlans,
  defaultFAQs, defaultUsers, defaultSubscribers,
  type Feature, type Testimonial,
  type User, type NewsletterSubscriber, type Toast,
} from "./types";

const ADMIN_PASSWORD = "tiger123";

/* ---------------------------------------------------------------- */
/* UI Components                                                     */
/* ---------------------------------------------------------------- */

function Button({ children, variant = "primary", onClick, className = "" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost"; onClick?: () => void; className?: string }) {
  const variants = {
    primary: "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 text-white shadow-[0_12px_40px_rgba(167,139,250,0.3)] hover:shadow-[0_18px_60px_rgba(167,139,250,0.4)]",
    secondary: "border border-[#f7f0df]/18 bg-[#f7f0df]/8 text-[#f7f0df] hover:bg-[#f7f0df]/14",
    danger: "bg-rose-500/20 border border-rose-400/30 text-rose-200 hover:bg-rose-500/30",
    ghost: "text-[#f7f0df]/60 hover:text-[#f7f0df] hover:bg-white/10",
  };
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition-all ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder = "", type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm text-[#f7f0df] outline-none transition placeholder:text-[#f7f0df]/30 focus:border-violet-200/40 focus:bg-[#f7f0df]/10"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm text-[#f7f0df] outline-none transition placeholder:text-[#f7f0df]/30 focus:border-violet-200/40 focus:bg-[#f7f0df]/10"
      />
    </label>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07040d]/95 p-4 backdrop-blur-2xl">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-violet-200/20 bg-[#0b0714]/95 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.6)] sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10">✕</button>
        <h2 className="mb-6 text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed right-5 top-20 z-[300] flex flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className={`flex min-w-[280px] items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl animate-[fadeUp_300ms_ease-out] ${
          t.type === "success" ? "border-emerald-300/30 bg-emerald-300/15" :
          t.type === "error" ? "border-rose-300/30 bg-rose-300/15" :
          "border-violet-200/30 bg-violet-200/15"
        }`}>
          <span className="text-sm font-semibold text-[#f7f0df]">{t.message}</span>
          <button type="button" onClick={() => removeToast(t.id)} className="text-white/60 hover:text-white">✕</button>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Blogs Manager                                                     */
/* ---------------------------------------------------------------- */

function BlogsManager({ pushToast }: { pushToast: (t: Omit<Toast, "id">) => void }) {
  const [blogs, setBlogs] = useState<BlogPost[]>(() => loadData("blogs", defaultBlogs));
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { saveData("blogs", blogs); }, [blogs]);

  const filtered = blogs.filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">Blog Posts</h2>
          <p className="text-sm text-[#f7f0df]/50">{blogs.length} total articles</p>
        </div>
        <div className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-2.5 text-sm text-[#f7f0df] outline-none placeholder:text-[#f7f0df]/30 focus:border-violet-200/40" />
          <Button onClick={() => setEditing({ slug: generateId(), title: "New Article", seoDescription: "", category: "Fitness", author: "Tiger Team", date: new Date().toISOString().split("T")[0], readTime: "5 min read", heroEmoji: "📝", tags: [], blocks: [], faqs: [] } as BlogPost)}>+ Create New</Button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((post) => (
          <div key={post.slug} className="flex items-center justify-between gap-4 rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4 transition hover:bg-[#f7f0df]/10">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="text-3xl">{post.heroEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#f7f0df]">{post.title}</p>
                <p className="text-xs text-[#f7f0df]/40">{post.category} · {post.readTime} · {post.date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(post)}>Edit</Button>
              <Button variant="danger" onClick={() => { if (confirm(`Delete "${post.title}"?`)) setBlogs(blogs.filter((b) => b.slug !== post.slug)); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.title === "New Article" ? "Create Blog Post" : "Edit Blog Post"}>
        {editing && (
          <div className="space-y-4">
            <Input label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Input label="Category" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
            <Input label="Read Time" value={editing.readTime} onChange={(v) => setEditing({ ...editing, readTime: v })} />
            <Input label="Author" value={editing.author} onChange={(v) => setEditing({ ...editing, author: v })} />
            <Input label="Hero Emoji" value={editing.heroEmoji} onChange={(v) => setEditing({ ...editing, heroEmoji: v })} />
            <Textarea label="SEO Description" value={editing.seoDescription} onChange={(v) => setEditing({ ...editing, seoDescription: v })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => {
                const exists = blogs.some((b) => b.slug === editing.slug);
                const updated = exists ? blogs.map((b) => b.slug === editing.slug ? editing : b) : [...blogs, editing];
                setBlogs(updated);
                setEditing(null);
                pushToast({ type: "success", message: "Blog saved!" });
              }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Features Manager                                                  */
/* ---------------------------------------------------------------- */

function FeaturesManager() {
  const [features, setFeatures] = useState<Feature[]>(() => loadData("features", defaultFeatures));
  const [editing, setEditing] = useState<Feature | null>(null);
  useEffect(() => { saveData("features", features); }, [features]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">App Features</h2>
          <p className="text-sm text-[#f7f0df]/50">{features.length} total features</p>
        </div>
        <Button onClick={() => setEditing({ id: generateId(), title: "", tag: "", desc: "", category: "other" })}>+ Create Feature</Button>
      </div>
      <div className="space-y-3">
        {features.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#f7f0df]">{item.title}</p>
              <p className="mt-1 text-xs text-[#f7f0df]/40"><span className="rounded-full bg-violet-200/12 px-2 py-0.5 text-[10px] uppercase">{item.tag}</span> · {item.category}</p>
              <p className="mt-2 text-sm text-[#f7f0df]/54 line-clamp-2">{item.desc}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(item)}>Edit</Button>
              <Button variant="danger" onClick={() => { if (confirm("Delete?")) setFeatures(features.filter((f) => f.id !== item.id)); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.title ? "Edit Feature" : "Create Feature"}>
        {editing && (
          <div className="space-y-4">
            <Input label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Input label="Tag" value={editing.tag} onChange={(v) => setEditing({ ...editing, tag: v })} />
            <Input label="Category (ai/india/health/social/other)" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v as Feature["category"] })} />
            <Textarea label="Description" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => {
                const exists = features.some((f) => f.id === editing.id);
                const updated = exists ? features.map((f) => f.id === editing.id ? editing : f) : [...features, editing];
                setFeatures(updated);
                setEditing(null);
              }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Testimonials Manager                                              */
/* ---------------------------------------------------------------- */

function TestimonialsManager() {
  const [items, setItems] = useState<Testimonial[]>(() => loadData("testimonials", defaultTestimonials));
  useEffect(() => { saveData("testimonials", items); }, [items]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">Testimonials</h2>
          <p className="text-sm text-[#f7f0df]/50">{items.length} total reviews</p>
        </div>
        <span className="text-xs text-[#f7f0df]/40">Manage via data source</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">{item.avatar}</div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#f7f0df]">{item.name}</p>
              <p className="text-xs text-[#f7f0df]/40">{item.role}</p>
              <p className="mt-1 text-sm text-[#f7f0df]/54 line-clamp-1">{item.text}</p>
            </div>
            <Button variant="danger" onClick={() => { if (confirm("Delete?")) setItems(items.filter((i) => i.id !== item.id)); }}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Users Manager                                                     */
/* ---------------------------------------------------------------- */

function UsersManager() {
  const [users, setUsers] = useState<User[]>(() => loadData("users", defaultUsers));
  const [search, setSearch] = useState("");
  useEffect(() => { saveData("users", users); }, [users]);

  const filtered = users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  function updateStatus(id: string, status: User["status"]) {
    setUsers(users.map((u) => u.id === id ? { ...u, status } : u));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">User Management</h2>
          <p className="text-sm text-[#f7f0df]/50">{users.length} total users · {users.filter((u) => u.status === "Active").length} active</p>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-2.5 text-sm text-[#f7f0df] outline-none placeholder:text-[#f7f0df]/30 focus:border-violet-200/40" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#f7f0df]/10">
        <table className="w-full">
          <thead className="bg-[#f7f0df]/5 text-xs uppercase tracking-[0.2em] text-[#f7f0df]/50">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Plan</th>
              <th className="p-4 text-left">Streak</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-[#f7f0df]/5 transition hover:bg-[#f7f0df]/5">
                <td className="p-4">
                  <p className="font-semibold text-[#f7f0df]">{u.name}</p>
                  <p className="text-xs text-[#f7f0df]/40">{u.email}</p>
                </td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${u.plan === "Elite" ? "bg-[#d8b35a]/20 text-[#d8b35a]" : u.plan === "Pro" ? "bg-violet-200/20 text-violet-100" : "bg-[#f7f0df]/10 text-[#f7f0df]/60"}`}>{u.plan}</span>
                </td>
                <td className="p-4 text-sm text-[#f7f0df]/70">{u.workoutStreak} days</td>
                <td className="p-4">
                  <select value={u.status} onChange={(e) => updateStatus(u.id, e.target.value as User["status"])} className="rounded-lg border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-2 py-1 text-xs text-[#f7f0df] outline-none">
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <Button variant="danger" onClick={() => { if (confirm("Delete user?")) setUsers(users.filter((x) => x.id !== u.id)); }}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Subscribers Manager                                               */
/* ---------------------------------------------------------------- */

function SubscribersManager() {
  const [subs, setSubs] = useState<NewsletterSubscriber[]>(() => loadData("subscribers", defaultSubscribers));
  useEffect(() => { saveData("subscribers", subs); }, [subs]);

  return (
    <div>
      <h2 className="mb-2 text-2xl font-black tracking-[-0.04em] text-[#f7f0df]">Newsletter Subscribers</h2>
      <p className="mb-6 text-sm text-[#f7f0df]/50">{subs.length} total subscribers</p>
      <div className="overflow-hidden rounded-2xl border border-[#f7f0df]/10">
        <table className="w-full">
          <thead className="bg-[#f7f0df]/5 text-xs uppercase tracking-[0.2em] text-[#f7f0df]/50">
            <tr>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Source</th>
              <th className="p-4 text-left">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-[#f7f0df]/5">
                <td className="p-4 text-sm text-[#f7f0df]">{s.email}</td>
                <td className="p-4 text-sm text-[#f7f0df]/60">{s.source}</td>
                <td className="p-4 text-sm text-[#f7f0df]/60">{s.joinedDate}</td>
                <td className="p-4 text-right">
                  <Button variant="danger" onClick={() => { if (confirm("Remove?")) setSubs(subs.filter((x) => x.id !== s.id)); }}>Remove</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main Admin Panel                                                  */
/* ---------------------------------------------------------------- */

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (t: Omit<Toast, "id">) => {
    const toast: Toast = { ...t, id: generateId() };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== toast.id)), 3000);
  };

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      pushToast({ type: "success", message: "Welcome, Admin! 🔐" });
    } else {
      pushToast({ type: "error", message: "Invalid password" });
    }
  }

  function resetAll() {
    if (confirm("Reset ALL data to defaults? This cannot be undone.")) {
      ["tfp_blogs", "tfp_features", "tfp_testimonials", "tfp_pricing_plans", "tfp_faqs", "tfp_how_it_works", "tfp_hero_stats", "tfp_users", "tfp_subscribers", "tfp_current_user", "tfp_users_db", "tfp_passwords"].forEach((key) => {
        localStorage.removeItem(key);
      });
      pushToast({ type: "success", message: "All data reset!" });
      window.location.reload();
    }
  }

  const sections = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "blogs", label: "Blog Posts", icon: "📝" },
    { id: "features", label: "App Features", icon: "⚡" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "subscribers", label: "Subscribers", icon: "📧" },
  ];

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#07040d]/98 p-4 backdrop-blur-2xl">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-violet-200/20 bg-[#0b0714]/95 p-8 shadow-[0_40px_140px_rgba(0,0,0,0.6)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-2xl font-black text-[#090511]">TF</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100">Restricted Access</p>
              <h1 className="text-2xl font-black text-[#f7f0df]">Admin Panel</h1>
            </div>
          </div>
          <Input label="Admin Password" type="password" value={password} onChange={setPassword} placeholder="Enter password..." />
          <p className="mt-3 text-xs text-[#f7f0df]/30">Default: <code className="rounded bg-[#f7f0df]/10 px-2 py-0.5 text-violet-100">tiger123</code></p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleLogin} className="flex-1">Unlock Access</Button>
          </div>
          <ToastContainer toasts={toasts} removeToast={(id) => setToasts(toasts.filter((t) => t.id !== id))} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex bg-[#07040d]">
      <aside className="hidden w-64 flex-shrink-0 border-r border-[#f7f0df]/10 bg-[#0b0714]/90 p-6 md:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">TF</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100">Admin</p>
            <p className="text-xs text-[#f7f0df]/40">Tiger Fitness Pro</p>
          </div>
        </div>
        <nav className="space-y-1.5">
          {sections.map((s) => (
            <button key={s.id} type="button" onClick={() => setActiveSection(s.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeSection === s.id ? "bg-violet-200/15 text-violet-100" : "text-[#f7f0df]/54 hover:bg-[#f7f0df]/5 hover:text-[#f7f0df]"}`}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>
        <div className="mt-10 space-y-2">
          <button type="button" onClick={resetAll} className="w-full rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-400/20">Reset All Data</button>
          <button type="button" onClick={onClose} className="w-full rounded-xl border border-[#f7f0df]/10 px-4 py-2.5 text-xs font-bold text-[#f7f0df]/50 hover:bg-[#f7f0df]/5">Exit Admin</button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex gap-2 overflow-x-auto border-b border-[#f7f0df]/10 bg-[#0b0714]/40 px-4 py-3 md:hidden">
          {sections.map((s) => (
            <button key={s.id} type="button" onClick={() => setActiveSection(s.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${activeSection === s.id ? "bg-violet-200/15 text-violet-100" : "text-[#f7f0df]/50"}`}>
              {s.icon} {s.label}
            </button>
          ))}
          <button type="button" onClick={onClose} className="whitespace-nowrap rounded-full border border-[#f7f0df]/10 px-4 py-2 text-xs text-[#f7f0df]/50">Exit</button>
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeSection === "dashboard" && (
            <div>
              <h1 className="mb-2 text-3xl font-black tracking-[-0.04em] text-[#f7f0df]">Admin Dashboard</h1>
              <p className="mb-8 text-sm text-[#f7f0df]/50">Full control of Tiger Fitness Pro application</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: loadData("users", defaultUsers).length, icon: "👥" },
                  { label: "Active Users", value: loadData("users", defaultUsers).filter((u: User) => u.status === "Active").length, icon: "✅" },
                  { label: "Blog Posts", value: loadData("blogs", defaultBlogs).length, icon: "📝" },
                  { label: "Subscribers", value: loadData("subscribers", defaultSubscribers).length, icon: "📧" },
                  { label: "Features", value: loadData("features", defaultFeatures).length, icon: "⚡" },
                  { label: "Testimonials", value: loadData("testimonials", defaultTestimonials).length, icon: "💬" },
                  { label: "FAQs", value: loadData("faqs", defaultFAQs).length, icon: "❓" },
                  { label: "Pricing Plans", value: loadData("pricingPlans", defaultPricingPlans).length, icon: "💰" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/40">{s.label}</p>
                        <p className="mt-3 bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-3xl font-black text-transparent">{s.value}</p>
                      </div>
                      <span className="text-3xl">{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 rounded-2xl border border-violet-200/20 bg-violet-200/5 p-6">
                <h3 className="mb-3 text-lg font-bold text-[#f7f0df]">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveSection("blogs")}>Manage Blogs</Button>
                  <Button onClick={() => setActiveSection("users")}>View Users</Button>
                  <Button onClick={() => setActiveSection("features")}>Edit Features</Button>
                  <Button onClick={() => setActiveSection("subscribers")}>View Subscribers</Button>
                </div>
              </div>
            </div>
          )}
          {activeSection === "blogs" && <BlogsManager pushToast={pushToast} />}
          {activeSection === "features" && <FeaturesManager />}
          {activeSection === "testimonials" && <TestimonialsManager />}
          {activeSection === "users" && <UsersManager />}
          {activeSection === "subscribers" && <SubscribersManager />}
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(toasts.filter((t) => t.id !== id))} />
    </div>
  );
}
