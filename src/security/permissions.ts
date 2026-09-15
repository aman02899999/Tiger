/* ═══════════════════════════════════════════════════════════════════
   AUTHORISATION — one pure matrix the UI, the repos and the tests share
   ───────────────────────────────────────────────────────────────────
   Design rules:

   1. `can()` describes what the BROWSER may do. It is an ergonomics and
      UX layer. It is NOT the security boundary — `firestore.rules` is.
      The two are kept in sync by an executable test.
   2. Commercial writes (`entitlement.write`, `payment.write`,
      `subscription.write`) return false for every client-side actor,
      including `super_admin`. Entitlements are a server fact.
   3. Every tenant-scoped decision requires a *positive* match on
      `gymId`. A missing claim never degrades into access.
   ═══════════════════════════════════════════════════════════════════ */

import type { Role } from "../domain/models";

export type Actor = {
  uid: string;
  role: Role;
  gymId: string | null;
  /** All gyms this user holds a membership in (from trusted claims). */
  gymIds?: string[];
};

export type Relationship = {
  trainerId: string;
  clientId: string;
  gymId: string;
  status: "active" | "inactive" | "pending";
};

export type AccessContext = {
  /** Gym that owns the resource. */
  gymId?: string | null;
  /** The user the row belongs to (progress, sessions, notes, appointments…). */
  ownerUserId?: string | null;
  /** Trainer who authored the row. */
  authorTrainerId?: string | null;
  /** Trainer→client relationship row, when one was loaded. */
  relationship?: Relationship | null;
  /** Target role for role-assignment checks. */
  targetRole?: Role | null;
  /** Sub-resource kind for storage-style checks. */
  kind?: "private" | "health" | "avatar" | "public";
};

export type Capability =
  /* tenant administration */
  | "gym.read"
  | "gym.write"
  | "gym.provision"
  | "membership.read"
  | "membership.manage"
  | "role.assign"
  /* people */
  | "user.read"
  | "user.updateSelf"
  | "user.delete"
  | "trainerClient.read"
  | "trainerClient.manage"
  /* training */
  | "template.write"
  | "plan.read"
  | "plan.write"
  | "plan.assign"
  | "session.read"
  | "session.log"
  | "nutritionPlan.write"
  | "nutritionLog.write"
  | "progress.read"
  | "progress.write"
  | "goal.write"
  | "note.read"
  | "note.write"
  | "appointment.read"
  | "appointment.write"
  | "appointment.cancel"
  | "availability.manage"
  /* analytics */
  | "analytics.gym"
  | "analytics.roster"
  | "analytics.self"
  /* commercial — backend only */
  | "entitlement.read"
  | "entitlement.write"
  | "payment.read"
  | "payment.write"
  | "subscription.write"
  /* governance */
  | "audit.read"
  | "storage.read"
  | "storage.write";

export const CAPABILITIES: readonly Capability[] = [
  "gym.read",
  "gym.write",
  "gym.provision",
  "membership.read",
  "membership.manage",
  "role.assign",
  "user.read",
  "user.updateSelf",
  "user.delete",
  "trainerClient.read",
  "trainerClient.manage",
  "template.write",
  "plan.read",
  "plan.write",
  "plan.assign",
  "session.read",
  "session.log",
  "nutritionPlan.write",
  "nutritionLog.write",
  "progress.read",
  "progress.write",
  "goal.write",
  "note.read",
  "note.write",
  "appointment.read",
  "appointment.write",
  "appointment.cancel",
  "availability.manage",
  "analytics.gym",
  "analytics.roster",
  "analytics.self",
  "entitlement.read",
  "entitlement.write",
  "payment.read",
  "payment.write",
  "subscription.write",
  "audit.read",
  "storage.read",
  "storage.write",
] as const;

/** Capabilities no browser session may ever exercise. */
export const BACKEND_ONLY_CAPABILITIES: readonly Capability[] = [
  "entitlement.write",
  "payment.write",
  "subscription.write",
] as const;

/* ── Primitive checks ────────────────────────────────────────────── */

export function isSuperAdmin(actor: Actor): boolean {
  return actor.role === "super_admin";
}

export function gymIdsOf(actor: Actor): string[] {
  const all = new Set<string>();
  if (actor.gymId) all.add(actor.gymId);
  for (const id of actor.gymIds ?? []) if (id) all.add(id);
  return [...all];
}

/** Hard tenant gate: an absent claim is a deny, never a wildcard. */
export function inGym(actor: Actor, gymId: string | null | undefined): boolean {
  if (!gymId) return false;
  return gymIdsOf(actor).includes(gymId);
}

export function isSelf(actor: Actor, ownerUserId: string | null | undefined): boolean {
  return Boolean(ownerUserId) && actor.uid === ownerUserId;
}

/** A trainer may act for a client only through an ACTIVE row in the same gym. */
export function isActiveTrainerOf(
  actor: Actor,
  clientId: string | null | undefined,
  gymId: string | null | undefined,
  relationship: Relationship | null | undefined,
): boolean {
  if (actor.role !== "trainer") return false;
  if (!relationship || !clientId || !gymId) return false;
  return (
    relationship.trainerId === actor.uid &&
    relationship.clientId === clientId &&
    relationship.gymId === gymId &&
    relationship.status === "active" &&
    inGym(actor, gymId)
  );
}

export function isGymOwnerOf(actor: Actor, gymId: string | null | undefined): boolean {
  return actor.role === "gym_owner" && inGym(actor, gymId);
}

/* ── The matrix ──────────────────────────────────────────────────── */

type Decision = (actor: Actor, ctx: AccessContext) => boolean;

const deny: Decision = () => false;

const MATRIX: Record<Capability, Decision> = {
  "gym.read": (a, c) => isSuperAdmin(a) || isGymOwnerOf(a, c.gymId) || inGym(a, c.gymId),
  "gym.write": (a, c) => isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),
  "gym.provision": (a) => isSuperAdmin(a),
  "membership.read": (a, c) =>
    isSuperAdmin(a) || isGymOwnerOf(a, c.gymId) || isSelf(a, c.ownerUserId),
  "membership.manage": (a, c) => isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),
  "role.assign": (a, c) => {
    if (isSuperAdmin(a)) return true;
    if (isGymOwnerOf(a, c.gymId)) return c.targetRole === "trainer" || c.targetRole === "client";
    return false;
  },

  "user.read": (a, c) =>
    isSelf(a, c.ownerUserId) ||
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "user.updateSelf": (a, c) => isSelf(a, c.ownerUserId) || isSuperAdmin(a),
  "user.delete": (a) => isSuperAdmin(a),

  "trainerClient.read": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isSelf(a, c.ownerUserId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "trainerClient.manage": (a, c) => isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),

  "template.write": (a, c) =>
    isSuperAdmin(a) || isGymOwnerOf(a, c.gymId) || (a.role === "trainer" && inGym(a, c.gymId)),

  "plan.read": (a, c) =>
    isSuperAdmin(a) ||
    isSelf(a, c.ownerUserId) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "plan.write": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship) ||
    (a.role === "trainer" && inGym(a, c.gymId) && !c.ownerUserId),

  "plan.assign": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "session.read": (a, c) =>
    isSuperAdmin(a) ||
    isSelf(a, c.ownerUserId) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "session.log": (a, c) =>
    isSuperAdmin(a) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship) ||
    /* A member logs their own training — inside their own tenant. The rules
       require `gymId == claim`, so the capability must agree. */
    (isSelf(a, c.ownerUserId) && inGym(a, c.gymId)),

  "nutritionPlan.write": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "nutritionLog.write": (a, c) =>
    isSuperAdmin(a) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship) ||
    (isSelf(a, c.ownerUserId) && inGym(a, c.gymId)),

  "progress.read": (a, c) =>
    isSelf(a, c.ownerUserId) ||
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "progress.write": (a, c) =>
    isSuperAdmin(a) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship) ||
    (isSelf(a, c.ownerUserId) && inGym(a, c.gymId)),

  "goal.write": (a, c) =>
    isSuperAdmin(a) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship) ||
    (isSelf(a, c.ownerUserId) && inGym(a, c.gymId)),

  "note.read": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "note.write": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "appointment.read": (a, c) =>
    isSelf(a, c.ownerUserId) ||
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "appointment.write": (a, c) =>
    isSuperAdmin(a) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship) ||
    (isSelf(a, c.ownerUserId) && inGym(a, c.gymId)),

  /** Only the client may cancel their own booking; staff may cancel any in their gym. */
  "appointment.cancel": (a, c) =>
    isSelf(a, c.ownerUserId) ||
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship),

  "availability.manage": (a, c) =>
    isSuperAdmin(a) || isGymOwnerOf(a, c.gymId) || (a.role === "trainer" && a.uid === c.authorTrainerId && inGym(a, c.gymId)),

  "analytics.gym": (a, c) => isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),
  "analytics.roster": (a, c) =>
    isSuperAdmin(a) ||
    isGymOwnerOf(a, c.gymId) ||
    (a.role === "trainer" && a.uid === c.authorTrainerId && inGym(a, c.gymId)),
  "analytics.self": (a, c) => isSelf(a, c.ownerUserId) || isSuperAdmin(a),

  "entitlement.read": (a, c) =>
    isSelf(a, c.ownerUserId) || isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),
  "entitlement.write": deny,
  "payment.read": (a, c) => isSelf(a, c.ownerUserId) || isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),
  "payment.write": deny,
  "subscription.write": deny,

  "audit.read": (a, c) => isSuperAdmin(a) || isGymOwnerOf(a, c.gymId),

  "storage.read": (a, c) => {
    if (c.kind === "public") return true;
    if (isSelf(a, c.ownerUserId)) return true;
    if (isSuperAdmin(a)) return true;
    if (isGymOwnerOf(a, c.gymId)) return true;
    if (c.kind === "health") return isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship);
    return isActiveTrainerOf(a, c.ownerUserId, c.gymId, c.relationship);
  },

  "storage.write": (a, c) => {
    if (c.kind === "public") return false;
    if (isSelf(a, c.ownerUserId)) return true;
    if (isSuperAdmin(a)) return true;
    if (isGymOwnerOf(a, c.gymId)) return true;
    return false;
  },
};

export function can(actor: Actor, capability: Capability, ctx: AccessContext = {}): boolean {
  if (!actor || !actor.uid) return false;
  if (!ROLE_WEIGHT[actor.role]) return false;
  return MATRIX[capability]?.(actor, ctx) ?? false;
}

const ROLE_WEIGHT: Record<Role, number> = {
  super_admin: 4,
  gym_owner: 3,
  trainer: 2,
  client: 1,
};

export function canAny(actor: Actor, capabilities: Capability[], ctx: AccessContext = {}): boolean {
  return capabilities.some((capability) => can(actor, capability, ctx));
}

export function capabilitiesFor(role: Role): Capability[] {
  const actor: Actor = { uid: "__probe__", role, gymId: "g", gymIds: ["g"] };
  const ctx: AccessContext = {
    gymId: "g",
    ownerUserId: "__probe__",
    authorTrainerId: "__probe__",
    relationship: { trainerId: "__probe__", clientId: "__probe__", gymId: "g", status: "active" },
  };
  return CAPABILITIES.filter((capability) => can(actor, capability, ctx));
}

/**
 * Errors thrown by the repo layer when a capability check fails. Kept
 * deliberately distinct from Firebase errors so the UI can show an
 * honest "you don't have access" instead of a generic failure.
 */
export class PermissionError extends Error {
  readonly capability: Capability;

  constructor(capability: Capability, message?: string) {
    super(message ?? `Missing permission: ${capability}`);
    this.name = "PermissionError";
    this.capability = capability;
  }
}

export function assertCan(actor: Actor, capability: Capability, ctx: AccessContext = {}): void {
  if (!can(actor, capability, ctx)) throw new PermissionError(capability);
}

/** Human-readable capability descriptions for the admin UI and docs. */
export const CAPABILITY_LABELS: Partial<Record<Capability, string>> = {
  "gym.read": "View gym profile",
  "gym.write": "Edit gym profile & branding",
  "gym.provision": "Create gyms and appoint owners",
  "membership.manage": "Invite or remove trainers and members",
  "role.assign": "Change a member's role",
  "trainerClient.manage": "Assign clients to trainers",
  "plan.write": "Create and edit training programs",
  "plan.assign": "Deliver a program to a client",
  "session.log": "Log a training session",
  "progress.write": "Record measurements and progress",
  "note.write": "Write coach notes",
  "appointment.write": "Book or reschedule appointments",
  "availability.manage": "Publish bookable hours",
  "analytics.gym": "See gym-wide analytics",
  "analytics.roster": "See roster analytics",
  "analytics.self": "See personal analytics",
  "entitlement.read": "View subscription entitlements",
  "entitlement.write": "Grant or revoke entitlements (server only)",
  "payment.read": "View payment history",
  "payment.write": "Record payments (server only)",
  "audit.read": "Read the audit trail",
};
