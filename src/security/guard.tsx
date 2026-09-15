/* ═══════════════════════════════════════════════════════════════════
   ACCESS GUARDS
   ───────────────────────────────────────────────────────────────────
   Guards are *presentation*, never protection. Firestore and Storage
   rules are the authority; these components exist so a trainer never
   sees a button that would fail, and so a client is never shown
   somebody else's screen by a routing mistake.

   The rule for this file: a guard may only hide something. If a guard
   is the only thing standing between a user and a write, that is a bug —
   `scripts/test-saas.mjs` asserts the rules deny the write anyway.
   ═══════════════════════════════════════════════════════════════════ */

import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthSystem";
import { can, CAPABILITY_LABELS, type AccessContext, type Capability } from "./permissions";
import type { Role } from "../domain/models";
import { ROLE_LABELS } from "../domain/collections";
import { NoData } from "../ui/kit";

/** Resolved authority for the signed-in session, in one place. */
export function useAccess() {
  const { actor, session, demo } = useAuth();
  const role: Role = session?.claims.role ?? "client";
  return {
    actor,
    role,
    roleLabel: ROLE_LABELS[role],
    gymId: session?.claims.gymId ?? null,
    gymIds: session?.claims.gymIds ?? [],
    entitlements: session?.claims.entitlements ?? [],
    signedIn: Boolean(session),
    demo,
    /** Capability check bound to the live actor. */
    can: (capability: Capability, ctx: AccessContext = {}) => (actor ? can(actor, capability, ctx) : false),
    /** False while claims are still resolving — render a skeleton, not a denial. */
    ready: Boolean(session),
  };
}

export function CapabilityGate({
  capability,
  ctx,
  children,
  fallback = null,
}: {
  capability: Capability;
  ctx?: AccessContext;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const access = useAccess();
  if (!access.ready) return null;
  return access.can(capability, ctx) ? <>{children}</> : <>{fallback}</>;
}

export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const access = useAccess();
  if (!access.ready) return null;
  return roles.includes(access.role) ? <>{children}</> : <>{fallback}</>;
}

/**
 * For a screen reached by a stale link or a role change mid-session.
 * Says what happened and who to ask — never a blank page.
 */
export function AccessDenied({
  capability,
  title = "Not available for your role",
}: {
  capability?: Capability;
  title?: string;
}) {
  const access = useAccess();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-10 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200/80">{access.roleLabel} account</p>
      <p className="mt-3 text-lg font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#e9f3f5]/55">
        {capability
          ? `This screen needs the “${CAPABILITY_LABELS[capability] ?? capability}” permission, which your account does not have. `
          : "Your account does not have access to this screen. "}
        Ask a gym owner or platform admin to change your role — roles are set on the trusted backend and cannot be
        changed from the app.
      </p>
    </div>
  );
}

/** Empty state used when a permitted screen simply has no rows yet. */
export function NothingYet({ what, hint }: { what: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <NoData what={what} />
      {hint && <p className="text-center text-xs text-[#e9f3f5]/40">{hint}</p>}
    </div>
  );
}
