import { useState } from "react";
import { useAuth } from "../auth/AuthSystem";

export default function LoginPage({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@tigerfitpro.in");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(email, password);
    setLoading(false);
    if (res.success) onSuccess();
    else setError(res.message);
  }

  async function handleDemo() {
    setLoading(true);
    setError("");
    const res = await login("demo@tigerfitpro.in", "demo123");
    setLoading(false);
    if (res.success) onSuccess();
    else setError(res.message);
  }

  return (
    <div className="min-h-screen bg-[#07040d] text-[#f7f0df] flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="/images/tiger-fitness-luxury-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700/90 via-[#0b0714]/85 to-[#07040d]/95" />
        <div className="relative z-10 flex flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] font-black text-[#090511]">TF</div>
            <span className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f7f0df]/90">Tiger Fitness Pro</span>
          </div>
          <div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-[-0.05em]">
              Your lifestyle<br /><span className="bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-transparent">operating system.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#f7f0df]/70 max-w-md">
              Join 50,000+ Indians transforming their lives with AI-powered workouts, nutrition, sleep tracking, and family health.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[{ v: "50K+", l: "Users" }, { v: "4.9★", l: "Rating" }, { v: "28+", l: "AI Features" }].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-2xl font-black text-[#f7f0df]">{s.v}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#f7f0df]/50">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#f7f0df]/40">© 2025 Tiger Fitness Pro · Made with 🐅 in India</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 lg:hidden mb-8">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">TF</div>
              <span className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f7f0df]/90">Tiger Fitness Pro</span>
            </div>
            <h2 className="text-4xl font-black tracking-[-0.05em]">Welcome back.</h2>
            <p className="mt-2 text-sm text-[#f7f0df]/50">Sign in to continue your transformation.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40 focus:bg-[#f7f0df]/10" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40 focus:bg-[#f7f0df]/10" placeholder="Enter your password" />
            </label>

            {error && <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}

            <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_60px_rgba(167,139,250,0.35)] transition-all hover:shadow-[0_24px_80px_rgba(167,139,250,0.45)] disabled:opacity-60">
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#f7f0df]/10" /></div>
              <div className="relative flex justify-center"><span className="bg-[#07040d] px-4 text-xs text-[#f7f0df]/40">OR CONTINUE WITH</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={handleDemo} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/5 py-3 text-sm font-semibold text-[#f7f0df]/70 hover:bg-[#f7f0df]/10 disabled:opacity-50">
                🔑 Demo Account
              </button>
              <button type="button" disabled title="Google login coming soon" className="flex items-center justify-center gap-2 rounded-xl border border-[#f7f0df]/8 bg-[#f7f0df]/3 py-3 text-sm font-semibold text-[#f7f0df]/30 cursor-not-allowed">
                <svg width={16} height={16} viewBox="0 0 48 48" className="opacity-40"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.3 0-9.7-3.5-11.3-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2c-.4.4 6.7-4.9 6.7-14.9 0-1.2-.1-2.3-.4-3.5z"/></svg>
                Google (soon)
              </button>
            </div>

            <p className="text-center text-sm text-[#f7f0df]/50 pt-4">
              Don't have an account? <button type="button" onClick={onSwitch} className="font-bold text-violet-100 hover:underline">Sign up free</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) { setError("Please accept Terms & Privacy to continue."); return; }
    setLoading(true);
    setError("");
    const res = await signup(name, email, password);
    setLoading(false);
    if (res.success) onSuccess();
    else setError(res.message);
  }

  return (
    <div className="min-h-screen bg-[#07040d] text-[#f7f0df] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="/images/tiger-fitness-luxury-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700/90 via-[#0b0714]/85 to-[#07040d]/95" />
        <div className="relative z-10 flex flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] font-black text-[#090511]">TF</div>
            <span className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f7f0df]/90">Tiger Fitness Pro</span>
          </div>
          <div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-[-0.05em]">
              Start your<br /><span className="bg-gradient-to-r from-violet-200 to-[#d8b35a] bg-clip-text text-transparent">transformation.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#f7f0df]/70 max-w-md">
              Free forever. No credit card required. Unlock 28+ AI-powered features for a healthier lifestyle.
            </p>
            <div className="mt-10 space-y-3 max-w-md">
              {["🎯 Personalized AI workout & diet plans", "📸 Smart Indian food scanner", "💍 Wedding mode, family dashboard & more"].map((f) => (
                <p key={f} className="text-base text-[#f7f0df]/80">{f}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 lg:hidden mb-8">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">TF</div>
              <span className="text-sm font-semibold uppercase tracking-[0.32em] text-[#f7f0df]/90">Tiger Fitness Pro</span>
            </div>
            <h2 className="text-4xl font-black tracking-[-0.05em]">Create account.</h2>
            <p className="mt-2 text-sm text-[#f7f0df]/50">Join 50,000+ Indians. Free forever.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Full Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40 focus:bg-[#f7f0df]/10" placeholder="Rahul Sharma" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40 focus:bg-[#f7f0df]/10" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3.5 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40 focus:bg-[#f7f0df]/10" placeholder="Minimum 6 characters" />
            </label>

            <label className="flex items-start gap-3 text-xs text-[#f7f0df]/60">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 rounded accent-violet-400" />
              <span>I agree to the <a href="#legal/terms" className="text-violet-100 hover:underline">Terms of Service</a> and <a href="#legal/privacy" className="text-violet-100 hover:underline">Privacy Policy</a></span>
            </label>

            {error && <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}

            <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_60px_rgba(167,139,250,0.35)] transition hover:shadow-[0_24px_80px_rgba(167,139,250,0.45)] disabled:opacity-60">
              {loading ? "Creating account…" : "Create Free Account"}
            </button>

            <p className="text-center text-sm text-[#f7f0df]/50 pt-4">
              Already have an account? <button type="button" onClick={onSwitch} className="font-bold text-violet-100 hover:underline">Sign in</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
