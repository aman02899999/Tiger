/* ═══════════════════════════════════════════════════════════════════
   TENANT CLIENT — the only way the UI touches persistent data
   ───────────────────────────────────────────────────────────────────
   Responsibilities, in order:

     1. Stamp `gymId` on every tenant-scoped write from the session
        claim (never from a form field).
     2. Refuse writes the actor's capabilities do not cover, with a
        typed error instead of a silent no-op.
     3. Shape raw documents into the composite views screens need
        (roster, client 360, gym overview) using pure analytics.
     4. Keep queries provably safe for Firestore rules: trainer queries
        filter on `trainerId == uid`, owner queries on `gymId == claim`.

   What it deliberately does NOT do: authorise. Rules do that. This
   layer makes the correct thing easy and the incorrect thing loud.
   ═══════════════════════════════════════════════════════════════════ */

import {
  buildClientCard,
  buildGymOverview,
  completedSessions,
  prioritiseClients,
  type ClientCard,
  type GymOverview,
  type RankedClient,
} from "./analytics";
import type { BaseDoc, DataSource, QueryOptions } from "./datasource";
import { isLive, nowIso } from "./datasource";
import { collectionPath, membershipId, nutritionLogId, stripProtectedUserFields, trainerClientId, type CollectionKey } from "../domain/collections";
import type {
  Appointment,
  AppointmentStatus,
  ClientGoal,
  ClientNote,
  Entitlement,
  AuditEvent,
  Gym,
  GymPlan,
  Membership,
  NutritionLog,
  NutritionPlan,
  Payment,
  ProgressEntry,
  SessionClaims,
  SetLog,
  TrainerAvailability,
  TrainerClient,
  UserProfile,
  WorkoutAssignment,
  WorkoutDay,
  WorkoutPlan,
  WorkoutSession,
  WorkoutTemplate,
} from "../domain/models";
import {
  PermissionError,
  assertCan,
  can,
  type AccessContext,
  type Actor,
  type Capability,
} from "../security/permissions";

const IN_CHUNK = 10;

function chunk<T>(items: T[], size = IN_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export class TenantClient {
  constructor(
    readonly actor: Actor,
    readonly source: DataSource,
    readonly claims: SessionClaims,
  ) {}

  get demo(): boolean {
    return this.source.kind === "demo";
  }

  get live(): boolean {
    return isLive();
  }

  get gymId(): string | null {
    return this.actor.gymId;
  }

  /* ── primitives ─────────────────────────────────────────────── */

  private ctx(overrides: AccessContext = {}): AccessContext {
    return { gymId: this.gymId, ...overrides };
  }

  private guard(capability: Capability, overrides: AccessContext = {}): void {
    assertCan(this.actor, capability, this.ctx(overrides));
  }

  /** Tenant-scoped writes must never be written without a gym. */
  private requireGym(): string {
    if (!this.gymId) {
      throw new Error("This action needs a gym context. Ask a gym owner for an invite, or switch workspace.");
    }
    return this.gymId;
  }

  /** Tenant-scoped list. `tenantKey` is the field carrying the gym id. */
  private async listScoped<T extends BaseDoc>(
    key: CollectionKey,
    capability: Capability,
    ctx: AccessContext,
    opts: QueryOptions = {},
  ): Promise<T[]> {
    if (!can(this.actor, capability, this.ctx(ctx))) return [];
    try {
      return await this.source.list<T>(key, opts);
    } catch (error) {
      if (this.demo) return [];
      throw error;
    }
  }

  /* ── gym & membership ───────────────────────────────────────── */

  async getGym(gymId = this.gymId): Promise<Gym | null> {
    if (!gymId || !can(this.actor, "gym.read", this.ctx({ gymId }))) return null;
    return this.source.get<Gym>("gyms", gymId);
  }

  async listMemberships(gymId = this.gymId): Promise<Membership[]> {
    if (!gymId) return [];
    return this.listScoped<Membership>("memberships", "membership.read", { gymId }, {
      filters: [{ field: "gymId", op: "==", value: gymId }],
    });
  }

  async listGymMembers(gymId = this.gymId, role: "trainer" | "client" = "client"): Promise<Membership[]> {
    if (!gymId) return [];
    return this.listScoped<Membership>("memberships", "membership.read", { gymId }, {
      filters: [
        { field: "gymId", op: "==", value: gymId },
        { field: "role", op: "==", value: role },
      ],
    });
  }

  async listTrainerClients(trainerId?: string, gymId = this.gymId): Promise<TrainerClient[]> {
    if (!gymId) return [];
    const mine = trainerId ?? this.actor.uid;
    const ctx: AccessContext = { gymId, ownerUserId: mine, authorTrainerId: mine };
    return this.listScoped<TrainerClient>("trainerClients", "trainerClient.read", ctx, {
      filters: [
        { field: "gymId", op: "==", value: gymId },
        { field: "trainerId", op: "==", value: mine },
      ],
    });
  }

  async listAllRelationships(gymId = this.gymId): Promise<TrainerClient[]> {
    if (!gymId) return [];
    /* A trainer's authority is limited to their own rows, and Firestore's
       rules refuse the broader query outright — so do not attempt it. */
    if (this.actor.role === "trainer") return this.listTrainerClients(this.actor.uid, gymId);
    return this.listScoped<TrainerClient>("trainerClients", "trainerClient.read", { gymId }, {
      filters: [{ field: "gymId", op: "==", value: gymId }],
    });
  }

  async getRelationship(clientId: string, trainerId = this.actor.uid, gymId = this.gymId): Promise<TrainerClient | null> {
    if (!gymId) return null;
    return this.source.get<TrainerClient>("trainerClients", trainerClientId(trainerId, clientId));
  }

  async createRelationship(input: { trainerId: string; clientId: string; cohort?: string; gymId?: string }): Promise<TrainerClient> {
    const gymId = input.gymId ?? this.gymId;
    this.guard("trainerClient.manage", { gymId });
    if (!gymId) throw new Error("Cannot create a relationship without a gym.");
    const id = trainerClientId(input.trainerId, input.clientId);
    const row: Omit<TrainerClient, "id"> = {
      gymId,
      trainerId: input.trainerId,
      clientId: input.clientId,
      status: "active",
      cohort: input.cohort ?? "",
      startedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return this.source.create<TrainerClient>("trainerClients", row, id);
  }

  async setRelationshipStatus(clientId: string, status: TrainerClient["status"], trainerId = this.actor.uid): Promise<void> {
    this.guard("trainerClient.manage", { ownerUserId: clientId });
    await this.source.update("trainerClients", trainerClientId(trainerId, clientId), {
      status,
      updatedAt: nowIso(),
    });
    await this.recordAudit("trainerClient.status", "trainerClients", trainerClientId(trainerId, clientId), { status });
  }

  async addMember(input: { userId: string; role: "trainer" | "client"; gymId?: string }): Promise<Membership> {
    const gymId = input.gymId ?? this.gymId;
    this.guard("membership.manage", { gymId, targetRole: input.role });
    if (!gymId) throw new Error("Cannot add a member without a gym.");
    const id = membershipId(gymId, input.userId);
    const row: Omit<Membership, "id"> = {
      gymId,
      userId: input.userId,
      role: input.role,
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const created = await this.source.create<Membership>("memberships", row, id);
    await this.recordAudit("membership.manage", "memberships", id, { role: input.role });
    return created;
  }

  /* ── people ─────────────────────────────────────────────────── */

  async getUser(userId: string): Promise<UserProfile | null> {
    if (!can(this.actor, "user.read", this.ctx({ ownerUserId: userId }))) return null;
    try {
      const profile = await this.source.get<UserProfile>("users", userId);
      if (!profile) return null;
      /* A trainer may only see a profile through an active relationship. */
      if (
        this.actor.role === "trainer" &&
        userId !== this.actor.uid &&
        !can(this.actor, "user.read", this.ctx({ ownerUserId: userId }))
      ) {
        return null;
      }
      return profile;
    } catch {
      return null;
    }
  }

  async listUsers(userIds: string[]): Promise<UserProfile[]> {
    const unique = [...new Set(userIds)].filter(Boolean);
    if (unique.length === 0) return [];
    const batches = await Promise.all(
      chunk(unique).map((ids) =>
        this.source.list<UserProfile>("users", { filters: [{ field: "id", op: "in", value: ids }] }).catch(() => []),
      ),
    );
    return batches.flat();
  }

  async updateProfile(userId: string, patch: Partial<UserProfile>): Promise<void> {
    this.guard("user.updateSelf", { ownerUserId: userId });
    /* Commercial and identity fields are owned by the trusted backend. */
    const safe = stripProtectedUserFields(patch as Record<string, unknown>);
    await this.source.update("users", userId, { ...safe, updatedAt: nowIso() });
  }

  /* ── training ───────────────────────────────────────────────── */

  async listPlans(opts: { clientId?: string; trainerId?: string; gymId?: string } = {}): Promise<WorkoutPlan[]> {
    const gymId = opts.gymId ?? this.gymId;
    const filters: QueryOptions["filters"] = [];
    if (gymId) filters.push({ field: "gymId", op: "==", value: gymId });
    if (opts.clientId) filters.push({ field: "clientId", op: "==", value: opts.clientId });
    if (opts.trainerId) filters.push({ field: "trainerId", op: "==", value: opts.trainerId });
    const ownerUserId = opts.clientId ?? null;
    if (opts.clientId && !can(this.actor, "plan.read", this.ctx({ ownerUserId }))) return [];
    if (!opts.clientId && this.actor.role === "client") {
      filters.push({ field: "clientId", op: "==", value: this.actor.uid });
    }
    if (!opts.clientId && this.actor.role === "trainer" && !opts.trainerId) {
      filters.push({ field: "trainerId", op: "==", value: this.actor.uid });
    }
    return this.listScoped<WorkoutPlan>("workoutPlans", "plan.read", { gymId, ownerUserId }, { filters });
  }

  /**
   * Authoring context for a plan. The relationship is loaded *before* the
   * authority check, because trainer authority is defined by that row and
   * nothing else — without it a trainer could never legitimately save work.
   */
  private async planWriteContext(clientId: string, gymId: string | null): Promise<AccessContext> {
    const relationship = await this.getRelationship(clientId, this.actor.uid, gymId);
    return { gymId, ownerUserId: clientId, authorTrainerId: this.actor.uid, relationship };
  }

  async savePlan(input: {
    plan: Partial<WorkoutPlan> & { clientId: string; name: string; days: WorkoutDay[] };
    planId?: string;
  }): Promise<WorkoutPlan> {
    const gymId = this.gymId;
    const ctx = await this.planWriteContext(input.plan.clientId, gymId);
    this.guard("plan.write", ctx);
    this.guard("plan.assign", ctx);

    const payload = {
      gymId,
      trainerId: this.actor.uid,
      clientId: input.plan.clientId,
      templateId: input.plan.templateId ?? null,
      name: input.plan.name,
      goal: input.plan.goal ?? "general",
      status: input.plan.status ?? "active",
      startDate: input.plan.startDate ?? nowIso().slice(0, 10),
      endDate: input.plan.endDate ?? null,
      days: input.plan.days,
      trainerNotes: input.plan.trainerNotes ?? "",
      updatedAt: nowIso(),
    };

    if (input.planId) {
      await this.source.update("workoutPlans", input.planId, payload);
      await this.recordAudit("plan.update", "workoutPlans", input.planId, { clientId: input.plan.clientId });
      return { id: input.planId, ...payload } as WorkoutPlan;
    }
    const created = await this.source.create<WorkoutPlan>("workoutPlans", {
      ...payload,
      createdAt: nowIso(),
    } as Omit<WorkoutPlan, "id">);
    await this.recordAudit("plan.create", "workoutPlans", created.id, { clientId: input.plan.clientId });
    return created;
  }

  async assignPlan(input: { clientId: string; planId: string; dueAt?: string | null }): Promise<WorkoutAssignment> {
    const gymId = this.gymId;
    const relationship = await this.getRelationship(input.clientId);
    this.guard("plan.assign", { gymId, ownerUserId: input.clientId, relationship });
    const created = await this.source.create<WorkoutAssignment>("workoutAssignments", {
      gymId,
      trainerId: this.actor.uid,
      clientId: input.clientId,
      planId: input.planId,
      assignedAt: nowIso(),
      dueAt: input.dueAt ?? null,
      status: "in_progress",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    } as Omit<WorkoutAssignment, "id">);
    await this.notify(input.clientId, "New program assigned", "Your trainer published a new training block.", "workout");
    await this.recordAudit("plan.assign", "workoutAssignments", created.id, { clientId: input.clientId });
    return created;
  }

  async listAssignments(clientId?: string, gymId = this.gymId): Promise<WorkoutAssignment[]> {
    const filters: QueryOptions["filters"] = [];
    if (gymId) filters.push({ field: "gymId", op: "==", value: gymId });
    const target = clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    if (target) filters.push({ field: "clientId", op: "==", value: target });
    if (!target && this.actor.role === "trainer") filters.push({ field: "trainerId", op: "==", value: this.actor.uid });
    return this.listScoped<WorkoutAssignment>("workoutAssignments", "plan.read", {
      gymId,
      ownerUserId: target ?? null,
    }, { filters });
  }

  async listSessions(opts: { clientId?: string; trainerId?: string; limit?: number } = {}): Promise<WorkoutSession[]> {
    const filters: QueryOptions["filters"] = [];
    if (this.gymId && this.actor.role !== "trainer") filters.push({ field: "gymId", op: "==", value: this.gymId });
    const clientId = opts.clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    if (clientId) filters.push({ field: "clientId", op: "==", value: clientId });
    if (!clientId && this.actor.role === "trainer") filters.push({ field: "trainerId", op: "==", value: opts.trainerId ?? this.actor.uid });
    return this.listScoped<WorkoutSession>("workoutSessions", "session.read", {
      gymId: this.gymId,
      ownerUserId: clientId ?? null,
    }, {
      filters,
      orderBy: { field: "completedAt", dir: "desc" },
      limit: opts.limit ?? 300,
    });
  }

  async logSession(input: {
    clientId?: string;
    planId?: string | null;
    assignmentId?: string | null;
    dayIndex: number;
    dayLabel: string;
    sets: SetLog[];
    sessionRpe?: number;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
  }): Promise<WorkoutSession> {
    const clientId = input.clientId ?? this.actor.uid;
    const relationship = clientId === this.actor.uid ? null : await this.getRelationship(clientId);
    this.guard("session.log", { gymId: this.gymId, ownerUserId: clientId, relationship });
    const volumeKg = Math.round(
      input.sets.filter((s) => s.completed).reduce((sum, s) => sum + s.reps * s.loadKg, 0),
    );
    const created = await this.source.create<WorkoutSession>("workoutSessions", {
      gymId: this.gymId,
      clientId,
      trainerId: clientId === this.actor.uid ? null : this.actor.uid,
      planId: input.planId ?? null,
      assignmentId: input.assignmentId ?? null,
      dayIndex: input.dayIndex,
      dayLabel: input.dayLabel,
      startedAt: input.startedAt ?? nowIso(),
      completedAt: input.completedAt ?? nowIso(),
      sets: input.sets,
      volumeKg,
      sessionRpe: input.sessionRpe ?? null,
      notes: input.notes ?? "",
      source: clientId === this.actor.uid ? "client" : "trainer",
      createdAt: nowIso(),
    } as Omit<WorkoutSession, "id">);
    await this.recordAudit("session.log", "workoutSessions", created.id, { clientId, volumeKg });
    return created;
  }

  async listTemplates(gymId = this.gymId): Promise<WorkoutTemplate[]> {
    if (!gymId) return [];
    return this.listScoped<WorkoutTemplate>("workoutTemplates", "plan.read", { gymId }, {
      filters: [{ field: "gymId", op: "==", value: gymId }],
    });
  }

  async saveTemplate(input: Omit<WorkoutTemplate, "id" | "createdAt" | "updatedAt" | "gymId" | "trainerId"> & { id?: string }): Promise<WorkoutTemplate> {
    this.guard("template.write", { gymId: this.gymId });
    const payload = {
      gymId: this.gymId,
      trainerId: this.actor.uid,
      name: input.name,
      goal: input.goal,
      level: input.level,
      daysPerWeek: input.daysPerWeek,
      days: input.days,
      updatedAt: nowIso(),
    };
    if (input.id) {
      await this.source.update("workoutTemplates", input.id, payload);
      return { id: input.id, ...payload } as WorkoutTemplate;
    }
    return this.source.create<WorkoutTemplate>("workoutTemplates", { ...payload, createdAt: nowIso() } as Omit<WorkoutTemplate, "id">);
  }

  /* ── nutrition, progress, goals, notes ──────────────────────── */

  async listNutritionPlans(clientId?: string, gymId = this.gymId): Promise<NutritionPlan[]> {
    const filters: QueryOptions["filters"] = [];
    if (gymId) filters.push({ field: "gymId", op: "==", value: gymId });
    const target = clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    if (target) filters.push({ field: "clientId", op: "==", value: target });
    return this.listScoped<NutritionPlan>("nutritionPlans", "plan.read", { gymId, ownerUserId: target ?? null }, { filters });
  }

  async saveNutritionPlan(input: Omit<NutritionPlan, "id" | "createdAt" | "updatedAt" | "gymId" | "trainerId"> & { id?: string }): Promise<NutritionPlan> {
    const relationship = await this.getRelationship(input.clientId);
    this.guard("nutritionPlan.write", { gymId: this.gymId, ownerUserId: input.clientId, relationship });
    const payload = {
      gymId: this.gymId,
      trainerId: this.actor.uid,
      clientId: input.clientId,
      targets: input.targets,
      hydrationMl: input.hydrationMl,
      meals: input.meals,
      status: input.status,
      updatedAt: nowIso(),
    };
    if (input.id) {
      await this.source.update("nutritionPlans", input.id, payload);
      return { id: input.id, ...payload } as NutritionPlan;
    }
    return this.source.create<NutritionPlan>("nutritionPlans", { ...payload, createdAt: nowIso() } as Omit<NutritionPlan, "id">);
  }

  async listNutritionLogs(clientId?: string, gymId = this.gymId): Promise<NutritionLog[]> {
    const target = clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    const filters: QueryOptions["filters"] = [];
    if (gymId) filters.push({ field: "gymId", op: "==", value: gymId });
    if (target) filters.push({ field: "clientId", op: "==", value: target });
    return this.listScoped<NutritionLog>("nutritionLogs", "session.read", { gymId, ownerUserId: target ?? null }, { filters });
  }

  async upsertNutritionLog(input: { clientId?: string; date: string; totals: NutritionLog["totals"]; waterMl: number }): Promise<NutritionLog> {
    const gymId = this.requireGym();
    const clientId = input.clientId ?? this.actor.uid;
    const relationship = clientId === this.actor.uid ? null : await this.getRelationship(clientId);
    this.guard("nutritionLog.write", { gymId: this.gymId, ownerUserId: clientId, relationship });
    const id = nutritionLogId(clientId, input.date);
    const payload = {
      gymId,
      clientId,
      date: input.date,
      totals: input.totals,
      waterMl: input.waterMl,
      updatedAt: nowIso(),
    };
    const existing = await this.source.get<NutritionLog>("nutritionLogs", id);
    if (existing) {
      await this.source.update("nutritionLogs", id, payload);
      return { id, ...payload };
    }
    return this.source.create<NutritionLog>("nutritionLogs", payload as Omit<NutritionLog, "id">, id);
  }

  async listProgress(clientId?: string, gymId = this.gymId): Promise<ProgressEntry[]> {
    const target = clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    const filters: QueryOptions["filters"] = [];
    if (gymId) filters.push({ field: "gymId", op: "==", value: gymId });
    if (target) filters.push({ field: "clientId", op: "==", value: target });
    return this.listScoped<ProgressEntry>("progress", "progress.read", { gymId, ownerUserId: target ?? null }, {
      filters,
      orderBy: { field: "date", dir: "asc" },
    });
  }

  async addProgress(entry: Omit<ProgressEntry, "id" | "createdAt" | "gymId">): Promise<ProgressEntry> {
    const relationship = entry.clientId === this.actor.uid ? null : await this.getRelationship(entry.clientId);
    this.guard("progress.write", { gymId: this.gymId, ownerUserId: entry.clientId, relationship });
    return this.source.create<ProgressEntry>("progress", {
      ...entry,
      gymId: this.gymId,
      createdAt: nowIso(),
    } as Omit<ProgressEntry, "id">);
  }

  async listGoals(clientId?: string, gymId = this.gymId): Promise<ClientGoal[]> {
    const target = clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    const filters: QueryOptions["filters"] = [];
    if (gymId) filters.push({ field: "gymId", op: "==", value: gymId });
    if (target) filters.push({ field: "clientId", op: "==", value: target });
    return this.listScoped<ClientGoal>("clientGoals", "progress.read", { gymId, ownerUserId: target ?? null }, { filters });
  }

  async saveGoal(goal: Omit<ClientGoal, "id" | "createdAt" | "updatedAt" | "gymId"> & { id?: string }): Promise<ClientGoal> {
    const relationship = goal.clientId === this.actor.uid ? null : await this.getRelationship(goal.clientId);
    this.guard("goal.write", { gymId: this.gymId, ownerUserId: goal.clientId, relationship });
    const payload = {
      gymId: this.gymId,
      clientId: goal.clientId,
      title: goal.title,
      metric: goal.metric,
      start: goal.start,
      target: goal.target,
      current: goal.current,
      unit: goal.unit,
      dueDate: goal.dueDate ?? null,
      status: goal.status,
      updatedAt: nowIso(),
    };
    if (goal.id) {
      await this.source.update("clientGoals", goal.id, payload);
      return { id: goal.id, ...payload } as ClientGoal;
    }
    return this.source.create<ClientGoal>("clientGoals", { ...payload, createdAt: nowIso() } as Omit<ClientGoal, "id">);
  }

  async listNotes(clientId: string): Promise<ClientNote[]> {
    const relationship = await this.getRelationship(clientId);
    const allowed = can(this.actor, "note.read", this.ctx({ ownerUserId: clientId, relationship }));
    if (!allowed) return [];
    return this.source.list<ClientNote>("clientNotes", {
      filters: [
        { field: "gymId", op: "==", value: this.gymId },
        { field: "clientId", op: "==", value: clientId },
      ],
      orderBy: { field: "createdAt", dir: "desc" },
    });
  }

  async addNote(input: { clientId: string; body: string; visibility: ClientNote["visibility"] }): Promise<ClientNote> {
    const relationship = await this.getRelationship(input.clientId);
    this.guard("note.write", { gymId: this.gymId, ownerUserId: input.clientId, relationship });
    return this.source.create<ClientNote>("clientNotes", {
      gymId: this.gymId,
      trainerId: this.actor.uid,
      clientId: input.clientId,
      body: input.body,
      visibility: input.visibility,
      createdAt: nowIso(),
    } as Omit<ClientNote, "id">);
  }

  /* ── scheduling ─────────────────────────────────────────────── */

  async listAppointments(opts: { clientId?: string; trainerId?: string; from?: string } = {}): Promise<Appointment[]> {
    const filters: QueryOptions["filters"] = [];
    if (this.gymId && this.actor.role !== "trainer") filters.push({ field: "gymId", op: "==", value: this.gymId });
    const clientId = opts.clientId ?? (this.actor.role === "client" ? this.actor.uid : undefined);
    if (clientId) filters.push({ field: "clientId", op: "==", value: clientId });
    else if (this.actor.role === "trainer") filters.push({ field: "trainerId", op: "==", value: opts.trainerId ?? this.actor.uid });
    return this.listScoped<Appointment>("appointments", "appointment.read", {
      gymId: this.gymId,
      ownerUserId: clientId ?? null,
    }, {
      filters,
      orderBy: { field: "startsAt", dir: "asc" },
      limit: 120,
    });
  }

  async bookAppointment(input: {
    clientId: string;
    trainerId?: string;
    type: Appointment["type"];
    startsAt: string;
    endsAt: string;
    location?: string;
    notes?: string;
  }): Promise<Appointment> {
    const relationship = input.clientId === this.actor.uid ? null : await this.getRelationship(input.clientId);
    this.guard("appointment.write", { gymId: this.gymId, ownerUserId: input.clientId, relationship });
    const created = await this.source.create<Appointment>("appointments", {
      gymId: this.gymId,
      trainerId: input.trainerId ?? this.actor.uid,
      clientId: input.clientId,
      type: input.type,
      status: input.clientId === this.actor.uid ? "requested" : "confirmed",
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location ?? "",
      notes: input.notes ?? "",
      statusBy: this.actor.uid,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    } as Omit<Appointment, "id">);
    await this.notify(
      input.clientId === this.actor.uid ? (input.trainerId ?? this.actor.uid) : input.clientId,
      "Appointment update",
      `${input.type.toUpperCase()} on ${input.startsAt.slice(0, 10)} at ${input.startsAt.slice(11, 16)}`,
      "appointment",
    );
    return created;
  }

  async setAppointmentStatus(appointmentId: string, status: AppointmentStatus, clientId: string): Promise<void> {
    const relationship = clientId === this.actor.uid ? null : await this.getRelationship(clientId);
    this.guard(status === "cancelled" ? "appointment.cancel" : "appointment.write", {
      gymId: this.gymId,
      ownerUserId: clientId,
      relationship,
    });
    await this.source.update("appointments", appointmentId, {
      status,
      statusBy: this.actor.uid,
      updatedAt: nowIso(),
    });
    await this.recordAudit("appointment.status", "appointments", appointmentId, { status });
  }

  async listAvailability(trainerId?: string, gymId = this.gymId): Promise<TrainerAvailability[]> {
    const target = trainerId ?? this.actor.uid;
    if (!gymId) return [];
    return this.listScoped<TrainerAvailability>("trainerAvailability", "appointment.read", {
      gymId,
      authorTrainerId: target,
    }, {
      filters: [
        { field: "gymId", op: "==", value: gymId },
        { field: "trainerId", op: "==", value: target },
      ],
    });
  }

  async setAvailability(rows: Array<Omit<TrainerAvailability, "id" | "createdAt" | "updatedAt" | "gymId" | "trainerId">>): Promise<void> {
    this.guard("availability.manage", { gymId: this.gymId, authorTrainerId: this.actor.uid });
    const existing = await this.listAvailability(this.actor.uid);
    await Promise.all(existing.map((row) => this.source.remove("trainerAvailability", row.id)));
    await Promise.all(
      rows.map((row) =>
        this.source.create<TrainerAvailability>("trainerAvailability", {
          ...row,
          gymId: this.gymId,
          trainerId: this.actor.uid,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        } as Omit<TrainerAvailability, "id">),
      ),
    );
  }

  /* ── commercial (read-only in the browser) ──────────────────── */

  async getEntitlement(subjectId: string): Promise<Entitlement | null> {
    if (!can(this.actor, "entitlement.read", this.ctx({ ownerUserId: subjectId }))) return null;
    try {
      return await this.source.get<Entitlement>("entitlements", subjectId);
    } catch {
      return null;
    }
  }

  /** Subscription for the active gym, whichever seat the user holds. */
  async getGymEntitlement(gymId = this.gymId): Promise<Entitlement | null> {
    if (!gymId) return null;
    if (!can(this.actor, "entitlement.read", this.ctx({ gymId }))) return null;
    try {
      return await this.source.get<Entitlement>("entitlements", gymId);
    } catch {
      return null;
    }
  }

  async listPayments(gymId = this.gymId): Promise<Payment[]> {
    const filters: QueryOptions["filters"] = gymId ? [{ field: "gymId", op: "==", value: gymId }] : [];
    if (this.actor.role === "client") {
      filters.push({ field: "userId", op: "==", value: this.actor.uid });
    }
    return this.listScoped<Payment>("payments", "payment.read", { gymId }, {
      filters,
      orderBy: { field: "createdAt", dir: "desc" },
      limit: 100,
    });
  }

  async recordAudit(action: string, entity: string, entityId: string, meta?: AuditMeta): Promise<void> {
    /* Demo mode does not fabricate an audit trail; the backend writes it. */
    if (this.demo) return;
    try {
      await this.source.create("auditLog", {
        actorId: this.actor.uid,
        actorRole: this.actor.role,
        gymId: this.gymId,
        action,
        entity,
        entityId,
        at: nowIso(),
        meta: meta ?? null,
      });
    } catch {
      /* Audit is best-effort from the client; the backend keeps the authoritative log. */
    }
  }

  async notify(userId: string, title: string, body: string, kind: string): Promise<void> {
    if (this.demo) return;
    try {
      await this.source.create("notifications", {
        gymId: this.gymId,
        userId,
        title,
        body,
        kind,
        read: false,
        createdAt: nowIso(),
      });
    } catch {
      /* Notifications are advisory. */
    }
  }

  /* ── platform administration (super_admin) ──────────────────── */

  async listGyms(limit = 100): Promise<Gym[]> {
    if (!can(this.actor, "gym.provision")) return [];
    try {
      return await this.source.list<Gym>("gyms", { orderBy: { field: "createdAt", dir: "desc" }, limit });
    } catch {
      return [];
    }
  }

  async listAllUsers(limit = 300): Promise<UserProfile[]> {
    if (!isSuperAdminActor(this.actor)) return [];
    try {
      return await this.source.list<UserProfile>("users", { limit });
    } catch {
      return [];
    }
  }

  async listAllMemberships(limit = 500): Promise<Membership[]> {
    if (!isSuperAdminActor(this.actor)) return [];
    try {
      return await this.source.list<Membership>("memberships", { limit });
    } catch {
      return [];
    }
  }

  async listAudit(gymId?: string | null, limit = 100): Promise<AuditEvent[]> {
    if (!can(this.actor, "audit.read", this.ctx({ gymId: gymId ?? this.gymId }))) return [];
    try {
      return await this.source.list<AuditEvent>("auditLog", {
        filters: gymId ? [{ field: "gymId", op: "==", value: gymId }] : [],
        orderBy: { field: "at", dir: "desc" },
        limit,
      });
    } catch {
      return [];
    }
  }

  async listAllEntitlements(limit = 200): Promise<Entitlement[]> {
    if (!isSuperAdminActor(this.actor)) return [];
    try {
      return await this.source.list<Entitlement>("entitlements", { limit });
    } catch {
      return [];
    }
  }

  /* ── composite views ────────────────────────────────────────── */

  async loadClientCards(clientIds: string[]): Promise<ClientCard[]> {
    const relationships = await this.listAllRelationships();

    /* Filter by authority BEFORE reading, so demo mode is exactly as strict
       as the security rules are in live mode. A trainer who is not assigned
       to a client must get nothing for that client — not a card with blanks. */
    const readable = clientIds.filter((id) =>
      can(
        this.actor,
        "user.read",
        this.ctx({ ownerUserId: id, relationship: relationships.find((row) => row.clientId === id) ?? null }),
      ),
    );
    if (readable.length === 0) return [];

    const [profiles, plans, assignments, sessions, progress, appointments] = await Promise.all([
      this.listUsers(readable),
      this.listPlans(),
      this.listAssignments(),
      this.listSessions(),
      this.listProgress(),
      this.listAppointments(),
    ]);

    const wanted = readable.filter((id) => id !== this.actor.uid);
    return wanted.map((clientId) =>
      buildClientCard({
        clientId,
        profile: profiles.find((p) => p.id === clientId) ?? null,
        relationship: relationships.find((r) => r.clientId === clientId) ?? null,
        plan: plans.find((p) => p.clientId === clientId) ?? null,
        assignment: assignments.find((a) => a.clientId === clientId) ?? null,
        sessions,
        progress,
        appointments,
      }),
    );
  }

  async loadRoster(): Promise<RankedClient[]> {
    const relationships = await this.listTrainerClients();
    const ids = relationships.map((r) => r.clientId);
    if (ids.length === 0) return [];
    return prioritiseClients(await this.loadClientCards(ids));
  }

  async loadGymOverview(): Promise<GymOverview> {
    const gymId = this.gymId;
    const [gym, memberships, relationships, sessions, plans, appointments, payments] = await Promise.all([
      this.getGym(gymId),
      this.listMemberships(gymId),
      this.listAllRelationships(gymId),
      this.listSessions({ limit: 800 }),
      this.listPlans(),
      this.listAppointments(),
      this.listPayments(gymId),
    ]);
    return buildGymOverview({
      memberships,
      sessions,
      plans,
      relationships,
      appointments,
      payments,
      seatLimit: gym?.seats ?? null,
    });
  }

  async loadClientHome(clientId = this.actor.uid): Promise<{
    cards: ClientCard[];
    sessions: WorkoutSession[];
    plan: WorkoutPlan | null;
    assignment: WorkoutAssignment | null;
    nutritionPlan: NutritionPlan | null;
    nutritionLogs: NutritionLog[];
    progress: ProgressEntry[];
    goals: ClientGoal[];
    notes: ClientNote[];
    appointments: Appointment[];
    nextSessionDay: WorkoutDay | null;
  }> {
    const [planRows, assignments, sessions, nutritionPlans, nutritionLogs, progress, goals, appointments] = await Promise.all([
      this.listPlans({ clientId }),
      this.listAssignments(clientId),
      this.listSessions({ clientId }),
      this.listNutritionPlans(clientId),
      this.listNutritionLogs(clientId),
      this.listProgress(clientId),
      this.listGoals(clientId),
      this.listAppointments({ clientId }),
    ]);
    const plan = planRows.find((p) => p.status === "active") ?? planRows[0] ?? null;
    const assignment = assignments.find((a) => a.status === "in_progress") ?? assignments[0] ?? null;
    const done = completedSessions(sessions).length;
    const nextSessionDay = plan ? plan.days[done % Math.max(plan.days.length, 1)] ?? null : null;
    let notes: ClientNote[] = [];
    try {
      notes = await this.listNotes(clientId);
    } catch {
      notes = [];
    }
    return {
      cards: [],
      sessions,
      plan,
      assignment,
      nutritionPlan: nutritionPlans[0] ?? null,
      nutritionLogs,
      progress,
      goals,
      notes,
      appointments,
      nextSessionDay,
    };
  }

  /** Readable view of the Firestore path for a collection (diagnostics only). */
  path(key: CollectionKey): string {
    return collectionPath(key);
  }
}

export type AuditMeta = Record<string, string | number | boolean | null>;

function isSuperAdminActor(actor: Actor): boolean {
  return actor.role === "super_admin";
}

/* ── Tenant provisioning helpers (super_admin / backend shaped) ── */

export type ProvisionGymInput = {
  name: string;
  slug: string;
  ownerId: string;
  plan: GymPlan;
  seats: { trainers: number; members: number };
  city?: string;
  country?: string;
};

export { PermissionError };
