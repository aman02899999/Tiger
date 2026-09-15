/* ═══════════════════════════════════════════════════════════════════
   ENTRY — sign in, create account, or open the labelled demo tenant
   ───────────────────────────────────────────────────────────────────
   Honesty pass: the previous login screen advertised "Join 50,000+
   Indians" and pre-filled demo credentials that silently produced a
   fake account. Both are gone. Claims here are the ones we can stand
   behind, and the demo path is explicitly a demo.
   ═══════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isFirebaseConfigured, missingFirebaseFields } from "../firebase";
import { LIVE_SETUP_STEPS } from "../firebaseConfig";
import { useAuth, type Persona } from "../auth/AuthSystem";
import { Button, Chip, Field, Input, Panel } from "../ui/kit";
import { cn } from "../utils/cn";

const PERSONAS: Array<{ id: Persona; label: string; blurb: string }> = [
  { id: "client", label: "Member", blurb: "Today's assigned session, progress, coach notes" },
  { id: "trainer", label: "Trainer", blurb: "Roster triage, program builder, appointments" },
  { id: "owner", label: "Gym owner", blurb: "Retention board, trainer load, revenue, seats" },
  { id: "admin", label: "Platform admin", blurb: "Tenants, roles, entitlements, audit trail" },
];

export default function EnterWorkspace() {
  const { login, signup, loginWithGoogle, switchDemoPersona, demo } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const firebaseReady = isFirebaseConfigured && Boolean(auth);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "signup" && !accepted) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    const result =
      mode === "login" ? await login(email, password) : await signup(name, email, password);
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  async function forgotPassword() {
    setError("");
    setNotice("");
    if (!email) {
      setError("Enter your email first, then request a reset link.");
      return;
    }
    if (!firebaseReady) {
      setError("Password reset needs a configured Firebase project.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth!, email);
      setNotice(`Reset link sent to ${email}.`);
    } catch {
      setError("Could not send the reset email. Check the address and try again.");
    }
  }

  async function google() {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070e] text-[#e9f3f5]">
      <div className="aurora-mesh pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-200 via-violet-400 to-fuchsia-400 text-sm font-black text-[#04121a]">
              TT
            </span>
            <span className="text-xs font-black uppercase tracking-[0.32em] text-[#e9f3f5]/85">Titan Fitness</span>
          </div>

          <h1 className="mt-10 text-4xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl">
            The operating system for
            <span className="text-aurora"> coached strength</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#e9f3f5]/60">
            One workspace where a gym owner sees retention, a trainer plans the week and a member
            opens the session waiting for them. Every number is derived from records that were
            actually written — there are no decorative statistics anywhere in this product.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              { title: "Trainer roster triage", body: "Dormant members surface first, with the exact reason." },
              { title: "Programs that travel", body: "Build once, deliver to a client, log performance against it." },
              { title: "Verified entitlements", body: "Provider → webhook → entitlement. The browser can only read it." },
              { title: "Gym-scoped by construction", body: "Every record carries a gymId the rules enforce." },
            ].map((item) => (
              <Panel key={item.title} className="bg-white/[0.02] p-4">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#e9f3f5]/50">{item.body}</p>
              </Panel>
            ))}
          </div>
        </div>

        {/* Auth column */}
        <div className="w-full">
          <Panel className="border-white/[0.09] bg-[#080e18]/90 p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                {(["login", "signup"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition",
                      mode === value ? "bg-white/[0.12] text-[#e9f3f5]" : "text-[#e9f3f5]/50",
                    )}
                  >
                    {value === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <Chip tone={firebaseReady ? "vital" : "solar"} dot>
                {firebaseReady ? "Live project" : "No Firebase"}
              </Chip>
            </div>

            {!firebaseReady && (
              <div className="mb-5 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] p-3.5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">Configuration incomplete</p>
                <p className="mt-1.5 text-xs leading-5 text-amber-50/80">
                  Missing {missingFirebaseFields.join(", ")}. Until those are set the app runs the labelled demo
                  workspace and stores nothing — run <code className="rounded bg-black/30 px-1">npm run check:firebase</code>.
                </p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <Field label="Full name">
                  <Input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Ananya Rao" />
                </Field>
              )}
              <Field label="Work email">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@yourgym.com"
                />
              </Field>
              <Field
                label="Password"
                hint={mode === "signup" ? "Minimum 6 characters. Roles and gym links are set by your gym, never here." : undefined}
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </Field>

              {mode === "signup" && (
                <label className="flex items-start gap-3 text-xs text-[#e9f3f5]/55">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    className="mt-0.5 rounded accent-violet-400"
                  />
                  <span>
                    I agree to the <a href="#legal/terms" className="text-violet-100 hover:underline">Terms</a> and{" "}
                    <a href="#legal/privacy" className="text-violet-100 hover:underline">Privacy Policy</a>.
                  </span>
                </label>
              )}

              {error && <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">{error}</p>}
              {notice && <p className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-3 text-xs text-emerald-100">{notice}</p>}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>

              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={forgotPassword} className="text-[#e9f3f5]/50 hover:text-[#e9f3f5]">
                  Forgot password?
                </button>
                <button type="button" onClick={google} className="font-semibold text-violet-100 hover:underline">
                  Continue with Google
                </button>
              </div>
            </form>

            <div className="mt-7 border-t border-white/[0.07] pt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/40">
                {demo ? "Demo workspace is active" : "Explore without an account"}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#e9f3f5]/45">
                Opens a read-mostly sample tenant in memory. Nothing is stored, no entitlement is granted,
                and the amber banner stays on screen so nobody mistakes it for live data.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => switchDemoPersona(persona.id)}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-violet-300/30 hover:bg-white/[0.05]"
                  >
                    <span className="block text-xs font-bold">{persona.label}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-[#e9f3f5]/45">{persona.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <p className="mt-5 text-center text-[11px] text-[#e9f3f5]/35">
            Roles are assigned by gym owners and platform admins through a trusted backend. A client
            account can never promote itself.
          </p>
        </div>
      </div>

      {/* Operator checklist. Shown only once a real project is wired, so it
          reads as "finish these three things", not as a wall of setup for
          somebody who just wants to look around. */}
      {firebaseReady && (
        <Panel className="mx-auto mt-10 w-full max-w-4xl p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e9f3f5]/45">
            Finishing a live deployment
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {LIVE_SETUP_STEPS.map((step) => (
              <div key={step.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#e9f3f5]/55">{step.body}</p>
                <code className="mt-2 block overflow-x-auto rounded bg-black/30 px-2 py-1.5 text-[10px] text-emerald-200/90">
                  {step.command}
                </code>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#e9f3f5]/40">
            Full list in docs/PRODUCTION_READINESS.md §4. Nothing in this app grants a role or a plan by itself —
            claims come from the trusted backend, entitlements from a verified payment webhook.
          </p>
        </Panel>
      )}
    </div>
  );
}
