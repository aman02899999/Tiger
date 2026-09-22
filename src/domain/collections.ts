/* ═══════════════════════════════════════════════════════════════════
   Firestore collection registry
   ───────────────────────────────────────────────────────────────────
   One source of truth for: collection path, tenant scope, who may write
   on the client, and which composite indexes the query layer needs.
   `scripts/test-saas.mjs` asserts that this registry and
   `firestore.rules` agree collection-for-collection — a rules file that
   silently protects a collection nobody uses, or forgets one that we do,
   is exactly the class of bug that sinks multi-tenant apps.
   ═══════════════════════════════════════════════════════════════════ */

import type { Entitlement, Gym, Membership, Payment, Role, TrainerClient, UserProfile } from "./models";

export type CollectionKey =
  | "gyms"
  | "memberships"
  | "users"
  | "trainerClients"
  | "workoutTemplates"
  | "workoutPlans"
  | "workoutAssignments"
  | "workoutSessions"
  | "nutritionPlans"
  | "nutritionLogs"
  | "progress"
  | "clientGoals"
  | "clientNotes"
  | "appointments"
  | "trainerAvailability"
  | "notifications"
  | "entitlements"
  | "payments"
  | "auditLog";

/**
 * `scope` documents where `gymId` lives for tenant isolation:
 *  - "tenant"  → the document itself carries `gymId`; rules compare it to the claim
 *  - "subject" → the document belongs to a user; gym comes from that user's membership
 *  - "global"  → platform-level, super_admin / trusted backend only
 */
export type TenantScope = "tenant" | "subject" | "global";

export type ClientWriteRule =
  | { kind: "self" } // owner of the record may write
  | { kind: "trainer_of_client" } // an assigned, active trainer may write
  | { kind: "gym_staff" } // gym_owner of the same gym may write
  | { kind: "backend_only" }; // browser may never write — trusted backend only

export type CollectionSpec = {
  key: CollectionKey;
  path: string;
  scope: TenantScope;
  clientWrites: ClientWriteRule[];
  /** Composite indexes required by the query layer (gym-scoped lists). */
  indexes?: string[][];
  note?: string;
};

export const COLLECTIONS: Record<CollectionKey, CollectionSpec> = {
  gyms: {
    key: "gyms",
    path: "gyms",
    scope: "global",
    clientWrites: [],
    note: "Created/updated by the trusted backend (or super_admin). Owners read their own gym.",
  },
  memberships: {
    key: "memberships",
    path: "memberships",
    scope: "tenant",
    clientWrites: [{ kind: "gym_staff" }],
    indexes: [["gymId", "role", "status"], ["userId", "status"]],
  },
  users: {
    key: "users",
    path: "users",
    scope: "subject",
    clientWrites: [{ kind: "self" }],
    indexes: [["gymId", "role"]],
    note: "Self-writes are field-restricted in rules: no role/gymId/plan/commercial fields.",
  },
  trainerClients: {
    key: "trainerClients",
    path: "trainerClients",
    scope: "tenant",
    clientWrites: [{ kind: "gym_staff" }],
    indexes: [["trainerId", "gymId", "status"], ["gymId", "status"]],
  },
  workoutTemplates: {
    key: "workoutTemplates",
    path: "workoutTemplates",
    scope: "tenant",
    clientWrites: [{ kind: "trainer_of_client" }, { kind: "gym_staff" }],
    indexes: [["gymId", "trainerId"]],
  },
  workoutPlans: {
    key: "workoutPlans",
    path: "workoutPlans",
    scope: "tenant",
    clientWrites: [{ kind: "trainer_of_client" }, { kind: "gym_staff" }],
    indexes: [["clientId", "status"], ["gymId", "trainerId"]],
    note: "A client may read their plan but never rewrite the prescription.",
  },
  workoutAssignments: {
    key: "workoutAssignments",
    path: "workoutAssignments",
    scope: "tenant",
    clientWrites: [{ kind: "trainer_of_client" }, { kind: "gym_staff" }],
    indexes: [["clientId", "status"], ["trainerId", "status"]],
  },
  workoutSessions: {
    key: "workoutSessions",
    path: "workoutSessions",
    scope: "tenant",
    clientWrites: [{ kind: "self" }, { kind: "trainer_of_client" }],
    indexes: [["clientId", "completedAt"], ["gymId", "completedAt"]],
    note: "Performance data: the client owns what they did; the trainer may add on their behalf.",
  },
  nutritionPlans: {
    key: "nutritionPlans",
    path: "nutritionPlans",
    scope: "tenant",
    clientWrites: [{ kind: "trainer_of_client" }, { kind: "gym_staff" }],
    indexes: [["clientId", "status"]],
  },
  nutritionLogs: {
    key: "nutritionLogs",
    path: "nutritionLogs",
    scope: "tenant",
    clientWrites: [{ kind: "self" }],
    indexes: [["clientId", "date"]],
  },
  progress: {
    key: "progress",
    path: "progress",
    scope: "tenant",
    clientWrites: [{ kind: "self" }, { kind: "trainer_of_client" }],
    indexes: [["clientId", "date"]],
  },
  clientGoals: {
    key: "clientGoals",
    path: "clientGoals",
    scope: "tenant",
    clientWrites: [{ kind: "self" }, { kind: "trainer_of_client" }],
    indexes: [["clientId", "status"]],
  },
  clientNotes: {
    key: "clientNotes",
    path: "clientNotes",
    scope: "tenant",
    clientWrites: [{ kind: "trainer_of_client" }, { kind: "gym_staff" }],
    indexes: [["clientId", "createdAt"]],
    note: "`trainer_only` notes are hidden from the client by rules, not by UI filtering.",
  },
  appointments: {
    key: "appointments",
    path: "appointments",
    scope: "tenant",
    clientWrites: [{ kind: "self" }, { kind: "trainer_of_client" }],
    indexes: [["trainerId", "startsAt"], ["clientId", "startsAt"], ["gymId", "startsAt"]],
    note: "Clients may request/reschedule their own; only staff may create for others.",
  },
  trainerAvailability: {
    key: "trainerAvailability",
    path: "trainerAvailability",
    scope: "tenant",
    clientWrites: [{ kind: "self" }, { kind: "gym_staff" }],
    indexes: [["trainerId", "weekday"]],
  },
  notifications: {
    key: "notifications",
    path: "notifications",
    scope: "subject",
    clientWrites: [{ kind: "self" }],
    indexes: [["userId", "createdAt"]],
  },
  entitlements: {
    key: "entitlements",
    path: "entitlements",
    scope: "global",
    clientWrites: [{ kind: "backend_only" }],
    note: "Commercial truth. Rules make this read-only for every browser session.",
  },
  payments: {
    key: "payments",
    path: "payments",
    scope: "global",
    clientWrites: [{ kind: "backend_only" }],
    note: "Written by the verified webhook, readable by the payer and by super_admin.",
  },
  auditLog: {
    key: "auditLog",
    path: "auditLog",
    scope: "global",
    clientWrites: [{ kind: "backend_only" }],
    note: "Append-only from the backend. Clients read only their own gym's entries.",
  },
};

export const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[];

/** Every collection the browser is allowed to write to directly. */
export const CLIENT_WRITABLE_COLLECTIONS = COLLECTION_KEYS.filter((key) =>
  COLLECTIONS[key].clientWrites.some((rule) => rule.kind !== "backend_only"),
);

/**
 * Collections no browser session may write at all — the verified webhook or
 * the Admin SDK is the only writer. `gyms` is deliberately *not* here: it
 * carries `clientWrites: []`, meaning "no ordinary client write", and a
 * super_admin session may still update it (see PLATFORM_COLLECTIONS).
 */
export const BACKEND_ONLY_COLLECTIONS = COLLECTION_KEYS.filter((key) => {
  const rules = COLLECTIONS[key].clientWrites;
  return rules.length > 0 && rules.every((rule) => rule.kind === "backend_only");
});

/** Platform-level documents written only by a super_admin session. */
export const PLATFORM_COLLECTIONS = COLLECTION_KEYS.filter((key) => COLLECTIONS[key].clientWrites.length === 0);

export function collectionPath(key: CollectionKey): string {
  return COLLECTIONS[key].path;
}

/** All composite indexes the query layer needs, flattened for `firestore.indexes.json`. */
export function requiredIndexes(): Array<{ collectionGroup: string; fields: string[] }> {
  const out: Array<{ collectionGroup: string; fields: string[] }> = [];
  for (const key of COLLECTION_KEYS) {
    const spec = COLLECTIONS[key];
    for (const fields of spec.indexes ?? []) {
      out.push({ collectionGroup: spec.path, fields });
    }
  }
  return out;
}

/* ── Document id conventions ─────────────────────────────────────── */

export function trainerClientId(trainerId: string, clientId: string): string {
  return `${trainerId}_${clientId}`;
}

export function membershipId(gymId: string, userId: string): string {
  return `${gymId}_${userId}`;
}

export function nutritionLogId(clientId: string, date: string): string {
  return `${clientId}_${date}`;
}

export function availabilityId(trainerId: string, weekday: number, startTime: string): string {
  return `${trainerId}_${weekday}_${startTime.replace(":", "")}`;
}

/* ── Field ownership: what a browser may never move ──────────────── */

/** Profile fields that only the trusted backend / super_admin may set. */
export const PROTECTED_USER_FIELDS = ["role", "gymId", "plan", "entitlement", "subscription"] as const;

export type ProtectedUserField = (typeof PROTECTED_USER_FIELDS)[number];

export function stripProtectedUserFields<T extends Record<string, unknown>>(patch: T): Partial<T> {
  const safe: Record<string, unknown> = { ...patch };
  for (const field of PROTECTED_USER_FIELDS) delete safe[field];
  return safe as Partial<T>;
}

/* ── Query-name helper types (keeps repo signatures readable) ────── */

export type DocOf = {
  gyms: Gym;
  memberships: Membership;
  users: UserProfile;
  trainerClients: TrainerClient;
  entitlements: Entitlement;
  payments: Payment;
};

export type RoleLabel = Record<Role, string>;

export const ROLE_LABELS: RoleLabel = {
  super_admin: "Platform Admin",
  gym_owner: "Gym Owner",
  trainer: "Trainer",
  client: "Member",
};
