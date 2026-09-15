/* ═══════════════════════════════════════════════════════════════════
   DOMAIN HOOKS
   ───────────────────────────────────────────────────────────────────
   The only place a screen should read tenant data from. Every hook:

     • goes through `TenantClient`, so the gym id and actor come from the
       session rather than from the component,
     • returns `{ data, loading, error, reload }` with `data === null`
       until a real answer arrives — never a placeholder number,
     • is safe to mount before claims resolve (`enabled` is false, so no
       query fires that the rules would reject).

   Screens that want a spinner use `loading`; screens that want honesty
   render `NothingYet` when `data` is an empty array.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useDataContext, type AsyncState } from "./DataProvider";
import type { TenantClient } from "./repos";
import type { RankedClient, GymOverview, ClientCard } from "./analytics";
import type {
  Appointment,
  AuditEvent,
  ClientGoal,
  ClientNote,
  Entitlement,
  Gym,
  Membership,
  Payment,
  TrainerAvailability,
  TrainerClient,
  UserProfile,
  WorkoutAssignment,
  WorkoutPlan,
  WorkoutSession,
  WorkoutTemplate,
} from "../domain/models";

export type { AsyncState };

/* ── Session-scoped identity ────────────────────────────────────── */

/** The signed-in actor's own profile row (never a demo placeholder). */
export function useMyProfile(): AsyncState<UserProfile | null> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const uid = session?.uid ?? null;
  return useAsyncData(
    () => (tenant && uid ? tenant.getUser(uid) : Promise.resolve(null)),
    [uid, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && uid) },
  );
}

/** Gym document for the current tenant. */
export function useGym(): AsyncState<Gym | null> {
  const tenant = useTenantOrNull();
  return useAsyncData(() => (tenant ? tenant.getGym() : Promise.resolve(null)), [tenant?.gymId ?? null], {
    enabled: Boolean(tenant),
  });
}

/* ── Trainer surfaces ───────────────────────────────────────────── */

/** Ranked roster: who needs attention first, with the evidence attached. */
export function useRoster(): AsyncState<RankedClient[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && session?.claims.role === "trainer";
  return useAsyncData(() => (tenant ? tenant.loadRoster() : Promise.resolve([])), [session?.uid ?? null, ready], {
    enabled: ready,
  });
}

/** One client's full card — the client-360 header. */
export function useClientCard(clientId: string | null): AsyncState<ClientCard | null> {
  const tenant = useTenantOrNull();
  const ready = Boolean(tenant && clientId);
  return useAsyncData(
    async () => {
      if (!tenant || !clientId) return null;
      const [card] = await tenant.loadClientCards([clientId]);
      return card ?? null;
    },
    [clientId, tenant?.gymId ?? null],
    { enabled: ready },
  );
}

export function useClientPlans(clientId: string | null): AsyncState<WorkoutPlan[]> {
  const tenant = useTenantOrNull();
  return useAsyncData(
    () => (tenant && clientId ? tenant.listPlans({ clientId }) : Promise.resolve([])),
    [clientId, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && clientId) },
  );
}

export function useClientSessions(clientId: string | null, limit = 200): AsyncState<WorkoutSession[]> {
  const tenant = useTenantOrNull();
  return useAsyncData(
    () => (tenant && clientId ? tenant.listSessions({ clientId, limit }) : Promise.resolve([])),
    [clientId, limit, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && clientId) },
  );
}

export function useClientNotes(clientId: string | null): AsyncState<ClientNote[]> {
  const tenant = useTenantOrNull();
  return useAsyncData(
    () => (tenant && clientId ? tenant.listNotes(clientId) : Promise.resolve([])),
    [clientId, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && clientId) },
  );
}

export function useTemplates(): AsyncState<WorkoutTemplate[]> {
  const tenant = useTenantOrNull();
  return useAsyncData(() => (tenant ? tenant.listTemplates() : Promise.resolve([])), [tenant?.gymId ?? null], {
    enabled: Boolean(tenant),
  });
}

/* ── Client surfaces ────────────────────────────────────────────── */

export type ClientHome = Awaited<ReturnType<TenantClient["loadClientHome"]>>;

/** Today's screen for a member: assignment, plan day, streak, next session. */
export function useClientHome(clientId?: string | null): AsyncState<ClientHome | null> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const subject = clientId ?? session?.uid ?? null;
  return useAsyncData(
    () => (tenant && subject ? tenant.loadClientHome(subject) : Promise.resolve(null)),
    [subject, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && subject) },
  );
}

export function useMyAssignments(): AsyncState<WorkoutAssignment[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const uid = session?.uid ?? null;
  return useAsyncData(
    () => (tenant && uid ? tenant.listAssignments(uid) : Promise.resolve([])),
    [uid, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && uid) },
  );
}

export function useMyGoals(): AsyncState<ClientGoal[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const uid = session?.uid ?? null;
  return useAsyncData(
    () => (tenant && uid ? tenant.listGoals(uid) : Promise.resolve([])),
    [uid, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && uid) },
  );
}

/* ── Gym owner surfaces ─────────────────────────────────────────── */

export function useGymOverview(): AsyncState<GymOverview | null> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && (session?.claims.role === "gym_owner" || session?.claims.role === "super_admin");
  return useAsyncData(() => (tenant ? tenant.loadGymOverview() : Promise.resolve(null)), [tenant?.gymId ?? null, ready], {
    enabled: ready,
  });
}

export function useGymMembers(role: "trainer" | "client"): AsyncState<Membership[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && (session?.claims.role === "gym_owner" || session?.claims.role === "super_admin");
  return useAsyncData(
    () => (tenant ? tenant.listGymMembers(tenant.gymId ?? "", role) : Promise.resolve([])),
    [role, tenant?.gymId ?? null, ready],
    { enabled: ready },
  );
}

export function useGymRelationships(): AsyncState<TrainerClient[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && session?.claims.role !== "client";
  return useAsyncData(
    () => (tenant ? tenant.listAllRelationships() : Promise.resolve([])),
    [tenant?.gymId ?? null, ready],
    { enabled: ready },
  );
}

/* ── Scheduling ─────────────────────────────────────────────────── */

export function useAppointments(clientId?: string | null): AsyncState<Appointment[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const uid = session?.uid ?? null;
  return useAsyncData(
    () => {
      if (!tenant) return Promise.resolve([]);
      if (session?.claims.role === "trainer") return tenant.listAppointments({ trainerId: uid ?? undefined });
      return tenant.listAppointments({ clientId: clientId ?? uid ?? undefined });
    },
    [uid, clientId ?? null, session?.claims.role ?? null, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && uid) },
  );
}

export function useAvailability(trainerId?: string | null): AsyncState<TrainerAvailability[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const subject = trainerId ?? session?.uid ?? null;
  return useAsyncData(
    () => (tenant ? tenant.listAvailability(subject ?? undefined) : Promise.resolve([])),
    [subject, tenant?.gymId ?? null],
    { enabled: Boolean(tenant) },
  );
}

/* ── Commercial (read-only by rule) ─────────────────────────────── */

/** Live entitlement for a subject. `null` means *no entitlement*, not "free". */
export function useEntitlement(subjectId?: string | null): AsyncState<Entitlement | null> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const subject = subjectId ?? session?.uid ?? null;
  return useAsyncData(
    () => (tenant && subject ? tenant.getEntitlement(subject) : Promise.resolve(null)),
    [subject, tenant?.gymId ?? null],
    { enabled: Boolean(tenant && subject) },
  );
}

export function useGymEntitlement(): AsyncState<Entitlement | null> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && session?.claims.role === "gym_owner";
  return useAsyncData(() => (tenant ? tenant.getGymEntitlement() : Promise.resolve(null)), [tenant?.gymId ?? null, ready], {
    enabled: ready,
  });
}

export function usePayments(): AsyncState<Payment[]> {
  const tenant = useTenantOrNull();
  return useAsyncData(() => (tenant ? tenant.listPayments() : Promise.resolve([])), [tenant?.gymId ?? null], {
    enabled: Boolean(tenant),
  });
}

export function useAuditTrail(limit = 100): AsyncState<AuditEvent[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const role = session?.claims.role ?? null;
  const ready = Boolean(tenant) && (role === "gym_owner" || role === "super_admin");
  return useAsyncData(() => (tenant ? tenant.listAudit(role === "super_admin" ? null : tenant.gymId, limit) : Promise.resolve([])), [role, limit, tenant?.gymId ?? null], {
    enabled: ready,
  });
}

/* ── Admin surfaces ─────────────────────────────────────────────── */

export function useAllGyms(): AsyncState<Gym[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && session?.claims.role === "super_admin";
  return useAsyncData(() => (tenant ? tenant.listGyms() : Promise.resolve([])), [ready], { enabled: ready });
}

export function useAllUsers(): AsyncState<UserProfile[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && session?.claims.role === "super_admin";
  return useAsyncData(() => (tenant ? tenant.listAllUsers() : Promise.resolve([])), [ready], { enabled: ready });
}

export function useAllEntitlements(): AsyncState<Entitlement[]> {
  const tenant = useTenantOrNull();
  const { session } = useAuth();
  const ready = Boolean(tenant) && session?.claims.role === "super_admin";
  return useAsyncData(() => (tenant ? tenant.listAllEntitlements() : Promise.resolve([])), [ready], { enabled: ready });
}

/* ── Mutations ──────────────────────────────────────────────────── */

export type MutationState = { pending: boolean; error: Error | null };

/**
 * Wraps a write so screens get `pending`/`error` without repeating
 * try/catch/finally, and so every write ends in either a reload or a
 * surfaced message — never a silent no-op.
 */
export function useTenantMutation(onDone?: () => void) {
  const [state, setState] = useState<MutationState>({ pending: false, error: null });

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setState({ pending: true, error: null });
      try {
        await action();
        onDone?.();
        setState({ pending: false, error: null });
        return true;
      } catch (error) {
        setState({ pending: false, error: error instanceof Error ? error : new Error(String(error)) });
        return false;
      }
    },
    [onDone],
  );

  return { ...state, run, reset: () => setState({ pending: false, error: null }) };
}

/* ── internals ──────────────────────────────────────────────────── */

/**
 * Hooks are mounted in a few places before the provider resolves (the
 * sign-in screen previews, the admin console's shell). Returning null
 * there keeps them from throwing while still refusing to invent data.
 */
function useTenantOrNull() {
  const { client, ready } = useDataContext();
  return useMemo(() => (ready ? client : null), [client, ready]);
}
