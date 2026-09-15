/* ═══════════════════════════════════════════════════════════════════
   WORKSPACE SHELL
   ───────────────────────────────────────────────────────────────────
   The SaaS chrome: role-aware navigation, command palette, live
   entitlement badge, and the honest demo banner.

   Routing is intentionally a state machine, not a URL router: the
   product is an installed PWA/Android app where deep links add little,
   and hash routing would fight the marketing site that already owns
   `#app`, `#legal/*`. Section ids stay stable so the legacy consumer
   pages keep working when mounted inside the member workspace.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "../auth/AuthSystem";
import { DataProvider } from "../data/DataProvider";
import OnboardingWizard from "../auth/OnboardingWizard";
import { CheckoutProvider } from "../app/Checkout";
import { Avatar, Button, Chip, IconButton, Spinner, ToastProvider, useToast } from "../ui/kit";
import { cn } from "../utils/cn";
import { ROLE_LABELS } from "../domain/collections";
import EnterWorkspace from "./EnterWorkspace";
import ClientWorkspace from "./ClientWorkspace";
import TrainerStudio from "./TrainerStudio";
import GymConsole from "./GymConsole";
import AdminConsole from "./AdminConsole";

/* ── Navigation model ───────────────────────────────────────────── */

export type NavItem = { id: string; label: string; badge?: string };
export type NavGroup = { group: string; items: NavItem[] };

/* ── Frame ──────────────────────────────────────────────────────── */

export function WorkspaceFrame({
  nav,
  active,
  onSelect,
  children,
  title,
  subtitle,
  actions,
}: {
  nav: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { user, session, gym, logout, demo, switchDemoPersona, demoPersona } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const flat = useMemo(() => nav.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group }))), [nav]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flat.slice(0, 9);
    return flat.filter((item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)).slice(0, 12);
  }, [flat, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const role = session?.claims.role ?? "client";

  return (
    <div className="min-h-screen bg-[#04070e] text-[#e9f3f5]">
      <div className="aurora-mesh pointer-events-none fixed inset-0 opacity-40" aria-hidden />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.06] bg-[#070c15]/95 transition-transform duration-300 lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center gap-3 px-5 pb-5 pt-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-200 via-violet-400 to-fuchsia-400 text-[13px] font-black text-[#04121a]">
              TT
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black uppercase tracking-[0.16em]">Tiger</p>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-[#e9f3f5]/45">
                {gym?.name ?? (role === "super_admin" ? "Platform" : "No gym linked")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-left text-xs text-[#e9f3f5]/50 transition hover:border-white/[0.16] hover:bg-white/[0.06]"
          >
            <span className="text-sm">⌕</span>
            <span className="flex-1">Jump to…</span>
            <kbd className="rounded border border-white/12 px-1.5 py-0.5 text-[10px] font-bold">⌘K</kbd>
          </button>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
            {nav.map((group) => (
              <div key={group.group}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/30">{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelect(item.id);
                          setMobileOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition",
                          isActive
                            ? "border border-violet-300/20 bg-gradient-to-r from-violet-300/15 to-transparent text-violet-50"
                            : "border border-transparent text-[#e9f3f5]/60 hover:bg-white/[0.04] hover:text-[#e9f3f5]",
                        )}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full transition",
                              isActive ? "bg-violet-300" : "bg-white/15",
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge && (
                          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#e9f3f5]/70">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name ?? "Athlete"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{user?.name ?? "Athlete"}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[#e9f3f5]/40">
                  {ROLE_LABELS[role]}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/50 transition hover:border-rose-400/40 hover:text-rose-200"
              >
                Exit
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {demo && <DemoBanner persona={demoPersona} onSwitch={switchDemoPersona} />}

          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#04070e]/85 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-[#e9f3f5]/70 lg:hidden"
                  aria-label="Open navigation"
                >
                  ☰
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black tracking-[-0.03em]">{title}</h1>
                  {subtitle && <p className="truncate text-xs text-[#e9f3f5]/45">{subtitle}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {actions}
                <Chip tone={user?.plan === "Free" ? "muted" : user?.plan === "Pro" ? "aurora" : "solar"} dot>
                  {user?.plan ?? "Free"} plan
                </Chip>
                <IconButton label="Search" onClick={() => setPaletteOpen(true)}>
                  ⌕
                </IconButton>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center bg-[#04070e]/80 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[#0a141f] shadow-[0_50px_140px_-40px_rgba(0,0,0,1)]"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search screens, tools and sections…"
              className="w-full border-b border-white/[0.07] bg-transparent px-5 py-4 text-sm outline-none placeholder:text-[#e9f3f5]/30"
            />
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setPaletteOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm text-[#e9f3f5]/80 transition hover:bg-white/[0.06]"
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#e9f3f5]/35">{item.group}</span>
                </button>
              ))}
              {results.length === 0 && <p className="px-4 py-6 text-sm text-[#e9f3f5]/40">Nothing matches that.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Demo banner ────────────────────────────────────────────────── */

function DemoBanner({
  persona,
  onSwitch,
}: {
  persona: "owner" | "trainer" | "client" | "admin" | null;
  onSwitch: (persona: "owner" | "trainer" | "client" | "admin") => void;
}) {
  const personas: Array<{ id: "client" | "trainer" | "owner" | "admin"; label: string }> = [
    { id: "client", label: "Member" },
    { id: "trainer", label: "Trainer" },
    { id: "owner", label: "Gym owner" },
    { id: "admin", label: "Platform admin" },
  ];
  return (
    <div className="border-b border-amber-300/25 bg-gradient-to-r from-amber-400/12 via-amber-300/8 to-transparent px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-amber-100">
          <span className="mr-2 rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]">
            Demo workspace
          </span>
          Sample data only — nothing is saved and no subscription is active. Connect Firebase to run live.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {personas.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSwitch(item.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition",
                persona === item.id
                  ? "bg-amber-300/25 text-amber-50"
                  : "text-amber-100/60 hover:bg-amber-300/12 hover:text-amber-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Splash & router ────────────────────────────────────────────── */

function Splash({ message = "Preparing your workspace" }: { message?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#04070e] text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-200 via-violet-400 to-fuchsia-400 text-[15px] font-black text-[#04121a]">
          TT
        </div>
        <p className="mt-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[#e9f3f5]/50">
          <Spinner /> {message}
        </p>
      </div>
    </div>
  );
}

function WorkspaceRouter() {
  const { user, authLoading, session } = useAuth();

  if (authLoading) return <Splash />;
  if (!user || !session) return <EnterWorkspace />;
  if (!user.onboardingComplete && session.claims.role === "client") {
    return <OnboardingWizard onComplete={() => undefined} />;
  }

  switch (session.claims.role) {
    case "super_admin":
      return <AdminConsole />;
    case "gym_owner":
      return <GymConsole />;
    case "trainer":
      return <TrainerStudio />;
    default:
      return <ClientWorkspace />;
  }
}

export default function SaasShell() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <CheckoutProvider>
            <WorkspaceRouter />
          </CheckoutProvider>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}

/* ── Small shared pieces used by every workspace ─────────────────── */

export function WorkspaceSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function NotReady({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  const toast = useToast();
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.015] p-8 text-center">
      <p className="text-base font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#e9f3f5]/55">{body}</p>
      <div className="mt-5 flex justify-center gap-3">
        {action}
        <Button variant="outline" size="sm" onClick={() => toast.push("Check the workspace again after the pending step completes.", "info")}>
          What happens next?
        </Button>
      </div>
    </div>
  );
}
