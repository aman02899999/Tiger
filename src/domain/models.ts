/* ═══════════════════════════════════════════════════════════════════
   TIGER — CANONICAL DOMAIN MODEL
   ───────────────────────────────────────────────────────────────────
   Pure types. No React, no Firebase, no browser APIs — so the whole
   model (and the rules derived from it) is testable in plain Node.

   Tenancy rule: every persistent, gym-owned document carries `gymId`.
   Commercial rule: only `entitlements`, `payments`, `subscriptions` and
   `auditLog` are trusted-backend-write-only; everything else has an
   explicit owner on the client or trainer side.
   ═══════════════════════════════════════════════════════════════════ */

export type Role = "super_admin" | "gym_owner" | "trainer" | "client";

export const ROLES: readonly Role[] = ["super_admin", "gym_owner", "trainer", "client"] as const;

export type Id = string;

/** ISO-8601 timestamp. Firestore `Timestamp` values are normalised to this on read. */
export type Iso = string;

export type RecordStatus = "active" | "inactive" | "pending";

/* ── Tenant ─────────────────────────────────────────────────────── */

export type GymPlan = "trial" | "growth" | "scale" | "enterprise";
export type GymStatus = "active" | "suspended" | "closed";

export type Gym = {
  id: Id;
  name: string;
  /** URL-safe handle used for join links: `tiger.fit/join/<slug>`. */
  slug: string;
  ownerId: Id;
  plan: GymPlan;
  status: GymStatus;
  seats: { trainers: number; members: number };
  branding?: { logoUrl?: string; accent?: string; tagline?: string };
  /** Short-lived code a trainer/member enters to request membership. */
  joinCode?: string;
  city?: string;
  country?: string;
  createdAt: Iso;
  updatedAt: Iso;
};

/** Which gyms a user belongs to, and in which role. A user may hold several. */
export type Membership = {
  id: Id; // `${gymId}_${userId}`
  gymId: Id;
  userId: Id;
  role: Exclude<Role, "super_admin">;
  status: RecordStatus;
  createdAt: Iso;
  updatedAt: Iso;
};

export type TrainerClient = {
  id: Id; // `${trainerId}_${clientId}`
  gymId: Id;
  trainerId: Id;
  clientId: Id;
  status: RecordStatus;
  /** Free-text tag the trainer uses to group the roster (e.g. "post-natal"). */
  cohort?: string;
  startedAt: Iso;
  createdAt: Iso;
  updatedAt: Iso;
};

/* ── People ─────────────────────────────────────────────────────── */

export type GoalKind = "fat-loss" | "muscle-gain" | "maintenance" | "wedding" | "general" | "rehab";

export type UserProfile = {
  id: Id;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  goal: GoalKind;
  /** Read-only mirror of the auth claim. Never trusted for authorisation. */
  role: Role;
  /** Read-only mirror of the auth claim. */
  gymId: Id | null;
  joinDate: Iso;
  onboardingComplete: boolean;
  preferences: UserPreferences;
  createdAt: Iso;
  updatedAt: Iso;
};

export type UserPreferences = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  aiCoach: boolean;
  units: "metric" | "imperial";
};

/** Trainer-owned free text about a client. `shared` notes are client-visible. */
export type ClientNote = {
  id: Id;
  gymId: Id;
  trainerId: Id;
  clientId: Id;
  body: string;
  visibility: "trainer_only" | "shared";
  createdAt: Iso;
};

/* ── Training ───────────────────────────────────────────────────── */

export type ExercisePrescription = {
  exerciseId: Id;
  name: string;
  sets: number;
  reps: string; // "8-10", "AMRAP", "30s"
  loadKg?: number;
  restSec: number;
  rpe?: number;
  tempo?: string;
  notes?: string;
};

export type WorkoutDay = {
  dayIndex: number; // 0-based index inside the plan
  label: string; // "Push A", "Zone 2", "Mobility"
  focus: string;
  blocks: ExercisePrescription[];
};

export type PlanStatus = "draft" | "active" | "archived";

/** A reusable program owned by a trainer or gym. */
export type WorkoutTemplate = {
  id: Id;
  gymId: Id;
  trainerId: Id;
  name: string;
  goal: GoalKind;
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  days: WorkoutDay[];
  createdAt: Iso;
  updatedAt: Iso;
};

/** A concrete program delivered to one client. */
export type WorkoutPlan = {
  id: Id;
  gymId: Id;
  trainerId: Id;
  clientId: Id;
  templateId?: Id | null;
  name: string;
  goal: GoalKind;
  status: PlanStatus;
  startDate: Iso;
  endDate?: Iso | null;
  days: WorkoutDay[];
  trainerNotes?: string;
  createdAt: Iso;
  updatedAt: Iso;
};

export type AssignmentStatus = "assigned" | "in_progress" | "completed" | "cancelled";

export type WorkoutAssignment = {
  id: Id;
  gymId: Id;
  trainerId: Id;
  clientId: Id;
  planId: Id;
  assignedAt: Iso;
  dueAt?: Iso | null;
  status: AssignmentStatus;
  createdAt: Iso;
  updatedAt: Iso;
};

export type SetLog = {
  exerciseId: Id;
  name: string;
  setIndex: number;
  reps: number;
  loadKg: number;
  rpe?: number;
  completed: boolean;
};

export type SessionSource = "client" | "trainer";

export type WorkoutSession = {
  id: Id;
  gymId: Id;
  clientId: Id;
  trainerId?: Id | null;
  planId?: Id | null;
  assignmentId?: Id | null;
  dayIndex: number;
  dayLabel: string;
  startedAt: Iso;
  completedAt: Iso | null;
  sets: SetLog[];
  /** Denormalised for cheap analytics: sum(reps × load). */
  volumeKg: number;
  sessionRpe?: number;
  notes?: string;
  source: SessionSource;
  createdAt: Iso;
};

/* ── Nutrition ──────────────────────────────────────────────────── */

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionPlan = {
  id: Id;
  gymId: Id;
  trainerId: Id;
  clientId: Id;
  targets: MacroTargets;
  hydrationMl: number;
  meals: Array<{ label: string; time: string; items: string[]; calories: number }>;
  status: RecordStatus;
  createdAt: Iso;
  updatedAt: Iso;
};

export type NutritionLog = {
  id: Id; // `${clientId}_${date}`
  gymId: Id;
  clientId: Id;
  date: Iso; // yyyy-mm-dd
  totals: MacroTargets;
  waterMl: number;
  updatedAt: Iso;
};

/* ── Body & progress ────────────────────────────────────────────── */

export type ProgressEntry = {
  id: Id;
  gymId: Id;
  clientId: Id;
  date: Iso;
  weightKg: number;
  bodyFatPct?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  photoUrl?: string | null;
  createdAt: Iso;
};

export type ClientGoal = {
  id: Id;
  gymId: Id;
  clientId: Id;
  title: string;
  metric: "weight" | "volume" | "adherence" | "strength" | "custom";
  start: number;
  target: number;
  current: number;
  unit: string;
  dueDate?: Iso | null;
  status: "active" | "achieved" | "missed";
  createdAt: Iso;
  updatedAt: Iso;
};

/* ── Scheduling ─────────────────────────────────────────────────── */

export type AppointmentType = "pt" | "assessment" | "consult" | "class" | "checkin";
export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type Appointment = {
  id: Id;
  gymId: Id;
  trainerId: Id;
  clientId: Id;
  type: AppointmentType;
  status: AppointmentStatus;
  /** ISO datetime of the slot start / end. */
  startsAt: Iso;
  endsAt: Iso;
  location?: string;
  notes?: string;
  /** Whoever last changed the status, for the audit trail. */
  statusBy?: Id | null;
  createdAt: Iso;
  updatedAt: Iso;
};

export type TrainerAvailability = {
  id: Id; // `${trainerId}_${weekday}_${start}`
  gymId: Id;
  trainerId: Id;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // "06:00"
  endTime: string; // "11:00"
  slotMinutes: number;
  active: boolean;
  createdAt: Iso;
  updatedAt: Iso;
};

/* ── Commercial (trusted backend writes only) ───────────────────── */

export type EntitlementPlan = "free" | "pro" | "elite" | "gym_growth" | "gym_scale" | "gym_enterprise";
export type EntitlementStatus = "pending" | "active" | "cancelled" | "expired" | "refunded" | "revoked";
export type EntitlementSource = "razorpay" | "play" | "manual" | "trial" | "gym_seat";

export type Entitlement = {
  id: Id; // userId or gymId — the entitlement subject
  subjectType: "user" | "gym";
  subjectId: Id;
  gymId: Id | null;
  plan: EntitlementPlan;
  status: EntitlementStatus;
  source: EntitlementSource;
  startedAt: Iso;
  expiresAt: Iso | null;
  seats?: { trainers: number; members: number };
  /** Provider-side reference (order/purchase token). Never a secret. */
  providerRef?: string | null;
  revokedReason?: string | null;
  updatedAt: Iso;
};

export type PaymentStatus =
  | "created"
  | "pending"
  | "captured"
  | "failed"
  | "refunded"
  | "disputed"
  | "revoked";

export type Payment = {
  id: Id;
  gymId: Id | null;
  userId: Id;
  provider: "razorpay" | "play" | "manual";
  providerRef: string;
  amountMinor: number; // paise
  currency: "INR" | "USD";
  status: PaymentStatus;
  plan: EntitlementPlan;
  createdAt: Iso;
  verifiedAt: Iso | null;
  verifiedBy: string | null;
  failureReason?: string | null;
};

export type AuditEvent = {
  id: Id;
  actorId: Id;
  actorRole: Role;
  gymId: Id | null;
  action: string;
  entity: string;
  entityId: Id;
  at: Iso;
  meta?: Record<string, string | number | boolean | null>;
};

export type NotificationItem = {
  id: Id;
  gymId: Id | null;
  userId: Id;
  title: string;
  body: string;
  kind: "workout" | "appointment" | "billing" | "social" | "system";
  read: boolean;
  createdAt: Iso;
};

/* ── Auth session (what the UI is allowed to assume) ────────────── */

export type SessionClaims = {
  role: Role;
  gymId: Id | null;
  /** Gym ids the user holds a membership in (from the trusted backend). */
  gymIds: Id[];
  entitlements: EntitlementPlan[];
};

export type AuthSession = {
  uid: Id;
  email: string | null;
  profile: UserProfile | null;
  claims: SessionClaims;
  /** True when running the labelled in-memory Demo Workspace. */
  demo: boolean;
};
