/* ═══════════════════════════════════════════════════════════════════
   DOMAIN VALIDATION
   ───────────────────────────────────────────────────────────────────
   Pure predicates. No React, no Firestore, no throws by default — so
   they run identically in the browser, in `scripts/test-saas.mjs` and
   (if you use them) in the trusted backend.

   Two rules this module exists to keep:

     1. A write is only attempted when it is *shaped* correctly. The
        security rules then decide whether the *caller* may make it.
        Shape and authority are different questions; conflating them is
        how "it worked in dev" becomes a production incident.
     2. Anything commercial is never valid input from a browser. There is
        no `validateEntitlementInput` that accepts a plan — the parser
        exists only to read backend-written documents back out.
   ═══════════════════════════════════════════════════════════════════ */

import type {
  Appointment,
  AppointmentStatus,
  ClientGoal,
  ClientNote,
  Entitlement,
  Gym,
  NutritionLog,
  Payment,
  SetLog,
  TrainerAvailability,
  TrainerClient,
  UserProfile,
  WorkoutDay,
  WorkoutPlan,
  WorkoutSession,
} from "./models";

export type ValidationIssue = { field: string; message: string };
export type ValidationResult = { ok: true; issues: [] } | { ok: false; issues: ValidationIssue[] };

const OK: ValidationResult = { ok: true, issues: [] };

function result(issues: ValidationIssue[]): ValidationResult {
  return issues.length === 0 ? OK : { ok: false, issues };
}

export class ValidationError extends Error {
  readonly issues: ValidationIssue[];
  constructor(entity: string, issues: ValidationIssue[]) {
    super(`${entity} failed validation: ${issues.map((i) => `${i.field} ${i.message}`).join("; ")}`);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export function assertValid(entity: string, validation: ValidationResult): void {
  if (!validation.ok) throw new ValidationError(entity, validation.issues);
}

/* ── primitives ─────────────────────────────────────────────────── */

const ID_RE = /^[A-Za-z0-9_-]{3,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isId(value: unknown): value is string {
  return typeof value === "string" && ID_RE.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

/** Calendar day (yyyy-mm-dd) — used for logs that are one-per-day. */
export function isCalendarDay(value: unknown): value is string {
  return typeof value === "string" && DAY_RE.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function inRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max;
}

export function isNonEmptyText(value: unknown, max = 4000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

/* ── tenant primitives ──────────────────────────────────────────── */

/**
 * The one invariant every tenant document shares. `expectedGymId` comes
 * from the caller's claim — a document that carries a different gym id is
 * either a bug or an attack, and both must be refused before the write.
 */
export function validateTenantShape(
  doc: { gymId?: unknown },
  expectedGymId: string | null,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isId(doc.gymId)) issues.push({ field: "gymId", message: "must be a valid gym id" });
  if (expectedGymId === null) {
    issues.push({ field: "gymId", message: "caller has no gym claim — refusing tenant write" });
  } else if (doc.gymId !== expectedGymId) {
    issues.push({ field: "gymId", message: "does not match the caller's gym claim" });
  }
  return result(issues);
}

export function trainerClientIdOf(trainerId: string, clientId: string): string {
  return `${trainerId}_${clientId}`;
}

export function validateTrainerClient(input: {
  id?: string;
  gymId: string;
  trainerId: string;
  clientId: string;
  status: string;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isId(input.trainerId)) issues.push({ field: "trainerId", message: "must be a valid user id" });
  if (!isId(input.clientId)) issues.push({ field: "clientId", message: "must be a valid user id" });
  if (input.trainerId === input.clientId) {
    issues.push({ field: "clientId", message: "a trainer cannot be their own client" });
  }
  if (input.id && input.id !== trainerClientIdOf(input.trainerId, input.clientId)) {
    issues.push({ field: "id", message: "must equal `${trainerId}_${clientId}`" });
  }
  if (!["active", "inactive", "pending"].includes(input.status)) {
    issues.push({ field: "status", message: "must be active, inactive or pending" });
  }
  if (!isId(input.gymId)) issues.push({ field: "gymId", message: "must be a valid gym id" });
  return result(issues);
}

export function validateMembership(input: {
  id?: string;
  gymId: string;
  userId: string;
  role: string;
  status: string;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isId(input.userId)) issues.push({ field: "userId", message: "must be a valid user id" });
  if (!["gym_owner", "trainer", "client"].includes(input.role)) {
    issues.push({ field: "role", message: "super_admin is not a gym membership role" });
  }
  if (!["active", "inactive", "pending"].includes(input.status)) {
    issues.push({ field: "status", message: "must be active, inactive or pending" });
  }
  if (input.id && input.id !== `${input.gymId}_${input.userId}`) {
    issues.push({ field: "id", message: "must equal `${gymId}_${userId}`" });
  }
  return result(issues);
}

/* ── profiles ───────────────────────────────────────────────────── */

export function validateProfilePatch(patch: Partial<UserProfile>): ValidationResult {
  const issues: ValidationIssue[] = [];

  /* Commercial and authority fields never travel through a profile write.
     The rules enforce this too — belt and braces, because a rules
     regression must not become a monetisation hole. */
  for (const field of ["role", "gymId", "plan", "entitlement", "subscription"] as const) {
    if (field in patch) {
      issues.push({ field, message: "is backend-managed and cannot be written from the app" });
    }
  }

  if ("name" in patch && !isNonEmptyText(patch.name, 120)) issues.push({ field: "name", message: "is required" });
  if ("email" in patch && !isEmail(patch.email)) issues.push({ field: "email", message: "must be a valid address" });
  if ("height" in patch && !inRange(patch.height, 50, 260)) issues.push({ field: "height", message: "must be 50–260 cm" });
  if ("weight" in patch && !inRange(patch.weight, 20, 400)) issues.push({ field: "weight", message: "must be 20–400 kg" });
  if ("age" in patch && !inRange(patch.age, 10, 100)) issues.push({ field: "age", message: "must be 10–100" });

  return result(issues);
}

export function validateGym(input: Partial<Gym> & { name?: unknown; slug?: unknown }): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyText(input.name, 120)) issues.push({ field: "name", message: "is required" });
  if (typeof input.slug !== "string" || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(input.slug)) {
    issues.push({ field: "slug", message: "must be a lowercase handle (a-z, 0-9, hyphen)" });
  }
  if (input.seats && (!inRange(input.seats.trainers, 0, 500) || !inRange(input.seats.members, 0, 100_000))) {
    issues.push({ field: "seats", message: "are out of range" });
  }
  if (input.plan && !["trial", "growth", "scale", "enterprise"].includes(input.plan)) {
    issues.push({ field: "plan", message: "is not a gym plan" });
  }
  return result(issues);
}

/* ── training ───────────────────────────────────────────────────── */

export function validateWorkoutDay(day: WorkoutDay): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!inRange(day.dayIndex, 0, 27)) issues.push({ field: "dayIndex", message: "must be 0–27" });
  if (!isNonEmptyText(day.label, 60)) issues.push({ field: "label", message: "is required" });
  if (!Array.isArray(day.blocks) || day.blocks.length === 0) {
    issues.push({ field: "blocks", message: "needs at least one exercise" });
  }
  day.blocks?.forEach((block, index) => {
    if (!isNonEmptyText(block.name, 80)) issues.push({ field: `blocks[${index}].name`, message: "is required" });
    if (!inRange(block.sets, 1, 30)) issues.push({ field: `blocks[${index}].sets`, message: "must be 1–30" });
    if (!isNonEmptyText(block.reps, 20)) issues.push({ field: `blocks[${index}].reps`, message: "is required" });
    if (block.loadKg !== undefined && !inRange(block.loadKg, 0, 1000)) {
      issues.push({ field: `blocks[${index}].loadKg`, message: "must be 0–1000" });
    }
    if (!inRange(block.restSec, 0, 900)) issues.push({ field: `blocks[${index}].restSec`, message: "must be 0–900 s" });
    if (block.rpe !== undefined && !inRange(block.rpe, 1, 10)) {
      issues.push({ field: `blocks[${index}].rpe`, message: "must be 1–10" });
    }
  });
  return result(issues);
}

export function validateWorkoutPlan(input: {
  gymId: string;
  trainerId: string;
  clientId: string;
  name: string;
  days: WorkoutDay[];
  status: string;
  startDate: string;
  endDate?: string | null;
}, expectedGymId: string | null): ValidationResult {
  const issues = validateTenantShape(input, expectedGymId).issues.slice();
  if (!isId(input.trainerId)) issues.push({ field: "trainerId", message: "must be a valid user id" });
  if (!isId(input.clientId)) issues.push({ field: "clientId", message: "must be a valid user id" });
  if (!isNonEmptyText(input.name, 120)) issues.push({ field: "name", message: "is required" });
  if (!["draft", "active", "archived"].includes(input.status)) {
    issues.push({ field: "status", message: "must be draft, active or archived" });
  }
  if (!isCalendarDay(input.startDate)) issues.push({ field: "startDate", message: "must be yyyy-mm-dd" });
  if (input.endDate && !isCalendarDay(input.endDate)) issues.push({ field: "endDate", message: "must be yyyy-mm-dd" });
  if (input.endDate && input.endDate < input.startDate) {
    issues.push({ field: "endDate", message: "cannot precede the start date" });
  }
  if (!Array.isArray(input.days) || input.days.length === 0) {
    issues.push({ field: "days", message: "needs at least one training day" });
  }
  input.days?.forEach((day) => issues.push(...validateWorkoutDay(day).issues.map((i) => ({ ...i, field: `days[${day.dayIndex}].${i.field}` }))));
  return result(issues);
}

export function validateSetLog(set: SetLog): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyText(set.name, 100)) issues.push({ field: "name", message: "is required" });
  if (!inRange(set.setIndex, 0, 60)) issues.push({ field: "setIndex", message: "must be 0–60" });
  if (!inRange(set.reps, 0, 200)) issues.push({ field: "reps", message: "must be 0–200" });
  if (!inRange(set.loadKg, 0, 1000)) issues.push({ field: "loadKg", message: "must be 0–1000" });
  if (set.rpe !== undefined && !inRange(set.rpe, 1, 10)) issues.push({ field: "rpe", message: "must be 1–10" });
  return result(issues);
}

/**
 * Session logging is the client's own activity — allowed — but it must
 * reference *their* gym and attach to a plan they were actually given.
 */
export function validateSessionLog(input: {
  gymId: string;
  clientId: string;
  sets: SetLog[];
  completedAt?: string | null;
  dayLabel?: string;
}, expected: { gymId: string | null; clientId: string }): ValidationResult {
  const issues = validateTenantShape(input, expected.gymId).issues.slice();
  if (input.clientId !== expected.clientId) {
    issues.push({ field: "clientId", message: "a session may only be logged for its own subject" });
  }
  if (!Array.isArray(input.sets) || input.sets.length === 0) {
    issues.push({ field: "sets", message: "log at least one set" });
  }
  input.sets?.forEach((set) => issues.push(...validateSetLog(set).issues.map((i) => ({ ...i, field: `sets[${set.setIndex}].${i.field}` }))));
  if (input.completedAt && !isIsoDate(input.completedAt)) {
    issues.push({ field: "completedAt", message: "must be an ISO timestamp" });
  }
  return result(issues);
}

/** Denormalised volume, computed identically everywhere. */
export function sessionVolumeKg(sets: SetLog[]): number {
  return Math.round(sets.reduce((total, set) => total + (set.completed ? set.loadKg * set.reps : 0), 0) * 10) / 10;
}

export function validateAssignment(input: {
  gymId: string;
  trainerId: string;
  clientId: string;
  planId: string;
  status: string;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const field of ["trainerId", "clientId", "planId"] as const) {
    if (!isId(input[field])) issues.push({ field, message: "must be a valid id" });
  }
  if (!["assigned", "in_progress", "completed", "cancelled"].includes(input.status)) {
    issues.push({ field: "status", message: "is not a valid assignment status" });
  }
  return result(issues);
}

/* ── progress, goals, nutrition ─────────────────────────────────── */

export function validateProgressEntry(input: {
  gymId: string;
  clientId: string;
  date: string;
  weightKg: number;
  bodyFatPct?: number | null;
  waistCm?: number | null;
}, expected: { gymId: string | null; clientId: string }): ValidationResult {
  const issues = validateTenantShape(input, expected.gymId).issues.slice();
  if (input.clientId !== expected.clientId) issues.push({ field: "clientId", message: "must be the signed-in subject" });
  if (!isCalendarDay(input.date)) issues.push({ field: "date", message: "must be yyyy-mm-dd" });
  if (!inRange(input.weightKg, 20, 400)) issues.push({ field: "weightKg", message: "must be 20–400 kg" });
  if (input.bodyFatPct != null && !inRange(input.bodyFatPct, 2, 70)) {
    issues.push({ field: "bodyFatPct", message: "must be 2–70 %" });
  }
  if (input.waistCm != null && !inRange(input.waistCm, 30, 250)) issues.push({ field: "waistCm", message: "must be 30–250 cm" });
  return result(issues);
}

export function validateGoal(input: Pick<ClientGoal, "title" | "metric" | "start" | "target" | "current" | "unit">): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyText(input.title, 120)) issues.push({ field: "title", message: "is required" });
  if (!["weight", "volume", "adherence", "strength", "custom"].includes(input.metric)) {
    issues.push({ field: "metric", message: "is not a tracked metric" });
  }
  for (const field of ["start", "target", "current"] as const) {
    if (!isFiniteNumber(input[field])) issues.push({ field, message: "must be a number" });
  }
  if (input.start === input.target) issues.push({ field: "target", message: "must differ from the starting value" });
  if (!isNonEmptyText(input.unit, 12)) issues.push({ field: "unit", message: "is required" });
  return result(issues);
}

export function validateNutritionLog(input: {
  gymId: string;
  clientId: string;
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  waterMl: number;
}, expected: { gymId: string | null; clientId: string }): ValidationResult {
  const issues = validateTenantShape(input, expected.gymId).issues.slice();
  if (input.clientId !== expected.clientId) issues.push({ field: "clientId", message: "must be the signed-in subject" });
  if (!isCalendarDay(input.date)) issues.push({ field: "date", message: "must be yyyy-mm-dd" });
  for (const [field, max] of [["calories", 20_000], ["protein", 1_000], ["carbs", 2_000], ["fat", 1_000]] as const) {
    if (!inRange(input.totals[field], 0, max)) issues.push({ field: `totals.${field}`, message: `must be 0–${max}` });
  }
  if (!inRange(input.waterMl, 0, 20_000)) issues.push({ field: "waterMl", message: "must be 0–20000 ml" });
  return result(issues);
}

/* ── scheduling ─────────────────────────────────────────────────── */

const CLIENT_SETTABLE_STATUSES: AppointmentStatus[] = ["requested", "rescheduled", "cancelled"];

/**
 * A client may ask for, move, or drop their own appointment. They may not
 * mark themselves `completed` or `no_show` — that is attendance, and
 * attendance belongs to the trainer who watched them walk in.
 */
export function validateAppointmentClientWrite(
  before: Pick<Appointment, "clientId" | "trainerId" | "gymId" | "status" | "startsAt">,
  patch: Partial<Appointment>,
  actor: { uid: string; role: string; gymId: string | null },
): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (before.clientId !== actor.uid && actor.role === "client") {
    issues.push({ field: "clientId", message: "is not yours" });
  }
  if (actor.role === "client" && actor.gymId !== before.gymId) {
    issues.push({ field: "gymId", message: "is outside your gym" });
  }
  if (patch.trainerId && patch.trainerId !== before.trainerId) {
    issues.push({ field: "trainerId", message: "cannot be reassigned from the app" });
  }
  if (patch.status && !CLIENT_SETTABLE_STATUSES.includes(patch.status)) {
    issues.push({ field: "status", message: "must be requested, rescheduled or cancelled" });
  }
  if (patch.startsAt && !isIsoDate(patch.startsAt)) issues.push({ field: "startsAt", message: "must be an ISO timestamp" });
  return result(issues);
}

export function validateAvailability(input: {
  gymId: string;
  trainerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}, expectedGymId: string | null): ValidationResult {
  const issues = validateTenantShape(input, expectedGymId).issues.slice();
  if (!inRange(input.weekday, 0, 6)) issues.push({ field: "weekday", message: "must be 0–6" });
  if (!TIME_RE.test(input.startTime)) issues.push({ field: "startTime", message: "must be HH:MM" });
  if (!TIME_RE.test(input.endTime)) issues.push({ field: "endTime", message: "must be HH:MM" });
  if (TIME_RE.test(input.startTime) && TIME_RE.test(input.endTime) && input.endTime <= input.startTime) {
    issues.push({ field: "endTime", message: "must be after the start time" });
  }
  if (![15, 20, 30, 45, 60, 90, 120].includes(input.slotMinutes)) {
    issues.push({ field: "slotMinutes", message: "must be 15–120" });
  }
  return result(issues);
}

/** Slots a client can actually book, given the trainer's weekly availability. */
export function slotsForDay(availability: TrainerAvailability[], isoDate: string): string[] {
  const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  const slots: string[] = [];
  for (const window of availability.filter((row) => row.weekday === weekday && row.active)) {
    const [startHour, startMinute] = window.startTime.split(":").map(Number);
    const [endHour, endMinute] = window.endTime.split(":").map(Number);
    let cursor = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    while (cursor + window.slotMinutes <= end) {
      slots.push(`${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`);
      cursor += window.slotMinutes;
    }
  }
  return [...new Set(slots)].sort();
}

export function validateNote(input: Pick<ClientNote, "body" | "visibility">): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isNonEmptyText(input.body, 4000)) issues.push({ field: "body", message: "is required" });
  if (!["trainer_only", "shared"].includes(input.visibility)) {
    issues.push({ field: "visibility", message: "must be trainer_only or shared" });
  }
  return result(issues);
}

/* ── commercial documents: parse-only ───────────────────────────── */

/**
 * Reads a backend-written entitlement. There is deliberately no
 * corresponding "build" function in this module: nothing in the browser
 * composes an entitlement, so nothing in the browser can forge one.
 */
export function parseEntitlement(raw: unknown): Entitlement | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!isId(value.subjectId) || !isId(value.id)) return null;
  if (value.subjectType !== "user" && value.subjectType !== "gym") return null;
  if (!["free", "pro", "elite", "gym_growth", "gym_scale", "gym_enterprise"].includes(String(value.plan))) return null;
  if (!["pending", "active", "cancelled", "expired", "refunded", "revoked"].includes(String(value.status))) return null;
  return value as unknown as Entitlement;
}

/** True only for an entitlement that is live right now. */
export function entitlementIsLive(entitlement: Entitlement | null, now = new Date()): boolean {
  if (!entitlement || entitlement.status !== "active") return false;
  if (!entitlement.expiresAt) return true;
  return Date.parse(entitlement.expiresAt) > now.getTime();
}

export function parsePayment(raw: unknown): Payment | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (!isNonEmptyText(value.providerRef, 200)) return null;
  if (!["razorpay", "play", "manual"].includes(String(value.provider))) return null;
  if (!["created", "pending", "captured", "failed", "refunded", "disputed", "revoked"].includes(String(value.status))) {
    return null;
  }
  if (!isFiniteNumber(value.amountMinor) || value.amountMinor < 0) return null;
  return value as unknown as Payment;
}

/* ── cross-entity invariants used by tests and the repos ────────── */

/** Every reference a plan makes must point into the same gym. */
export function planIsCoherent(plan: Pick<WorkoutPlan, "gymId" | "clientId" | "trainerId">, context: {
  relationship: Pick<TrainerClient, "gymId" | "trainerId" | "clientId" | "status"> | null;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!context.relationship) {
    issues.push({ field: "clientId", message: "has no trainer relationship in this gym" });
    return result(issues);
  }
  if (context.relationship.status !== "active") {
    issues.push({ field: "clientId", message: "relationship is not active" });
  }
  if (context.relationship.gymId !== plan.gymId) issues.push({ field: "gymId", message: "does not match the relationship" });
  if (context.relationship.trainerId !== plan.trainerId) issues.push({ field: "trainerId", message: "does not match the relationship" });
  if (context.relationship.clientId !== plan.clientId) issues.push({ field: "clientId", message: "does not match the relationship" });
  return result(issues);
}

/** Human-readable one-liner, used in toasts and in test failure output. */
export function describeIssues(validation: ValidationResult): string {
  return validation.ok ? "" : validation.issues.map((issue) => `${issue.field} ${issue.message}`).join("; ");
}

/** Exported for the storage-rule tests: which folders hold sensitive media. */
export const SENSITIVE_STORAGE_PREFIXES = ["health", "private", "progress"] as const;

export type { NutritionLog, WorkoutSession };
