/* ═══════════════════════════════════════════════════════════════════
   DEMO WORKSPACE SEED
   ───────────────────────────────────────────────────────────────────
   Deterministic sample tenant used ONLY by the in-memory DemoSource.
   It is deliberately expressed in the same shapes as real Firestore
   documents, so every screen, analytics function and empty-state path
   is exercised exactly as it would be in production.

   This data is never written to Firestore, never counts as an
   entitlement and is always rendered behind the "Demo Workspace"
   banner. Numbers are generated from a fixed seed so screenshots and
   tests are stable.
   ═══════════════════════════════════════════════════════════════════ */

import type { BaseDoc } from "./datasource";
import { availabilityId, membershipId, nutritionLogId, trainerClientId } from "../domain/collections";
import type { CollectionKey } from "../domain/collections";

/** Mulberry32 — tiny deterministic PRNG. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260915);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number, dp = 0): number => {
  const value = min + rand() * (max - min);
  return dp === 0 ? Math.round(value) : Number(value.toFixed(dp));
};

const DAY = 86_400_000;
/** Anchored "today" so the demo dataset always looks current. */
const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);

function dayOffset(days: number): string {
  return new Date(TODAY.getTime() + days * DAY).toISOString();
}
function dateOnly(days: number): string {
  return new Date(TODAY.getTime() + days * DAY).toISOString().slice(0, 10);
}

export const DEMO_GYM_ID = "gym_iron_arc_blr";
const OWNER = "demo_owner";
const TRAINERS = ["demo_trainer_a", "demo_trainer_b", "demo_trainer_c", "demo_trainer_d"];

const CLIENT_NAMES = [
  "Ananya Rao", "Vikram Shetty", "Meera Nair", "Rohit Kulkarni", "Sana Fernandes",
  "Arjun Menon", "Divya Iyer", "Kabir Shah", "Priya Reddy", "Nikhil Jain",
  "Tanvi Deshpande", "Imran Qureshi", "Riya Bose", "Aditya Hegde", "Neha Pillai",
  "Siddharth Ghosh", "Lakshmi Varma", "Farhan Ali", "Ishita Chandra", "Varun Nambiar",
];

const GOALS = ["fat-loss", "muscle-gain", "maintenance", "wedding", "general", "rehab"] as const;

const EXERCISES = [
  { id: "ex_back_squat", name: "Back Squat", focus: "Legs", base: 60 },
  { id: "ex_bench", name: "Barbell Bench Press", focus: "Push", base: 45 },
  { id: "ex_deadlift", name: "Conventional Deadlift", focus: "Pull", base: 80 },
  { id: "ex_overhead", name: "Overhead Press", focus: "Push", base: 30 },
  { id: "ex_row", name: "Barbell Row", focus: "Pull", base: 40 },
  { id: "ex_pullup", name: "Weighted Pull-Up", focus: "Pull", base: 5 },
  { id: "ex_rdl", name: "Romanian Deadlift", focus: "Hamstrings", base: 50 },
  { id: "ex_split_squat", name: "Bulgarian Split Squat", focus: "Legs", base: 12 },
  { id: "ex_lateral", name: "Lateral Raise", focus: "Shoulders", base: 6 },
  { id: "ex_leg_press", name: "Leg Press", focus: "Legs", base: 90 },
  { id: "ex_cable_row", name: "Seated Cable Row", focus: "Pull", base: 35 },
  { id: "ex_incline_db", name: "Incline Dumbbell Press", focus: "Push", base: 18 },
] as const;

function fullBodyDays(count: number) {
  const templates = [
    { label: "Lower Strength", focus: "Squat · hinge · core", ids: [0, 6, 9, 7] },
    { label: "Upper Push", focus: "Horizontal + vertical press", ids: [1, 3, 11, 8] },
    { label: "Upper Pull", focus: "Row · pull-up volume", ids: [4, 5, 10, 8] },
    { label: "Conditioning", focus: "Zone 2 + carries", ids: [7, 9, 6, 2] },
  ];
  return Array.from({ length: count }, (_, index) => {
    const t = templates[index % templates.length];
    return {
      dayIndex: index,
      label: t.label,
      focus: t.focus,
      blocks: t.ids.map((exIndex, blockIndex) => {
        const ex = EXERCISES[exIndex];
        return {
          exerciseId: ex.id,
          name: ex.name,
          sets: between(3, 5),
          reps: blockIndex === 0 ? "5-6" : "8-12",
          loadKg: between(Math.round(ex.base * 0.6), Math.round(ex.base * 1.4)),
          restSec: blockIndex === 0 ? 180 : 90,
          rpe: between(6, 9),
        };
      }),
    };
  });
}

type Rows = Partial<Record<CollectionKey, BaseDoc[]>>;

export function buildDemoSeed(): Rows {
  const gyms: BaseDoc[] = [
    {
      id: DEMO_GYM_ID,
      name: "Iron Arc Strength Club",
      slug: "iron-arc",
      ownerId: OWNER,
      plan: "scale",
      status: "active",
      seats: { trainers: 15, members: 500 },
      branding: { accent: "#5eead4", tagline: "Coached strength, measured." },
      joinCode: "IRON-ARC-24",
      city: "Bengaluru",
      country: "IN",
      createdAt: dayOffset(-640),
      updatedAt: dayOffset(-3),
    },
    {
      id: "gym_harbour_crossfit",
      name: "Harbour Conditioning Co.",
      slug: "harbour",
      ownerId: "demo_owner_other",
      plan: "growth",
      status: "active",
      seats: { trainers: 5, members: 150 },
      city: "Kochi",
      country: "IN",
      createdAt: dayOffset(-300),
      updatedAt: dayOffset(-20),
    },
  ];

  const users: BaseDoc[] = [
    {
      id: OWNER,
      name: "Rhea Malhotra",
      email: "owner@ironarc.demo",
      avatar: "RM",
      phone: "+91 98450 11223",
      age: 39,
      gender: "female",
      height: 168,
      weight: 62,
      goal: "maintenance",
      role: "gym_owner",
      gymId: DEMO_GYM_ID,
      joinDate: dateOnly(-640),
      onboardingComplete: true,
      preferences: { emailNotifications: true, pushNotifications: true, weeklyReports: true, aiCoach: false, units: "metric" },
      createdAt: dayOffset(-640),
      updatedAt: dayOffset(-2),
    },
  ];

  const memberships: BaseDoc[] = [
    {
      id: membershipId(DEMO_GYM_ID, OWNER),
      gymId: DEMO_GYM_ID,
      userId: OWNER,
      role: "gym_owner",
      status: "active",
      createdAt: dayOffset(-640),
      updatedAt: dayOffset(-640),
    },
  ];

  const trainerProfiles = [
    { name: "Karthik Subramanian", speciality: "Powerlifting", cohort: "Strength block" },
    { name: "Zoya Khan", speciality: "Fat loss & metabolic", cohort: "Transformation 12w" },
    { name: "Dev Prakash", speciality: "Rehab & mobility", cohort: "Return-to-lift" },
    { name: "Aditi Sharma", speciality: "Hybrid athlete", cohort: "Race prep" },
  ];

  TRAINERS.forEach((id, index) => {
    const profile = trainerProfiles[index];
    users.push({
      id,
      name: profile.name,
      email: `${id.replace("demo_", "")}@ironarc.demo`,
      avatar: profile.name.split(" ").map((p) => p[0]).join(""),
      phone: `+91 98${between(100, 999)} 6${between(10000, 99999)}`,
      age: between(26, 44),
      gender: index === 1 || index === 3 ? "female" : "male",
      height: between(158, 188),
      weight: between(56, 92),
      goal: "general",
      role: "trainer",
      gymId: DEMO_GYM_ID,
      joinDate: dateOnly(-between(120, 500)),
      onboardingComplete: true,
      preferences: { emailNotifications: true, pushNotifications: true, weeklyReports: true, aiCoach: true, units: "metric" },
      createdAt: dayOffset(-between(120, 500)),
      updatedAt: dayOffset(-1),
    });
    memberships.push({
      id: membershipId(DEMO_GYM_ID, id),
      gymId: DEMO_GYM_ID,
      userId: id,
      role: "trainer",
      status: "active",
      createdAt: dayOffset(-between(120, 500)),
      updatedAt: dayOffset(-1),
    });
  });

  const trainerClients: BaseDoc[] = [];
  const workoutPlans: BaseDoc[] = [];
  const workoutAssignments: BaseDoc[] = [];
  const workoutSessions: BaseDoc[] = [];
  const progress: BaseDoc[] = [];
  const nutritionPlans: BaseDoc[] = [];
  const nutritionLogs: BaseDoc[] = [];
  const clientGoals: BaseDoc[] = [];
  const clientNotes: BaseDoc[] = [];
  const appointments: BaseDoc[] = [];

  CLIENT_NAMES.forEach((name, index) => {
    const clientId = `demo_client_${String(index + 1).padStart(2, "0")}`;
    const trainerId = TRAINERS[index % TRAINERS.length];
    const goal = GOALS[index % GOALS.length];
    const age = between(22, 52);
    const startWeight = between(58, 104, 1);
    const trend = goal === "fat-loss" ? -0.35 : goal === "muscle-gain" ? 0.22 : 0.05;
    /* Two clients are deliberately "at risk" so the risk board has signal. */
    const atRisk = index % 7 === 3;
    const silent = index % 7 === 5;
    const joinedDaysAgo = between(40, 420);
    const streakActive = !atRisk && !silent;

    users.push({
      id: clientId,
      name,
      email: `${clientId.replace("demo_", "")}@member.demo`,
      avatar: name.split(" ").map((p) => p[0]).join(""),
      phone: `+91 9${between(100000000, 999999999)}`,
      age,
      gender: index % 3 === 0 ? "female" : "male",
      height: between(150, 190),
      weight: startWeight - trend * 8,
      goal,
      role: "client",
      gymId: DEMO_GYM_ID,
      joinDate: dateOnly(-joinedDaysAgo),
      onboardingComplete: true,
      preferences: { emailNotifications: true, pushNotifications: !silent, weeklyReports: true, aiCoach: true, units: "metric" },
      createdAt: dayOffset(-joinedDaysAgo),
      updatedAt: dayOffset(-between(0, 6)),
    });

    memberships.push({
      id: membershipId(DEMO_GYM_ID, clientId),
      gymId: DEMO_GYM_ID,
      userId: clientId,
      role: "client",
      status: atRisk && index % 2 === 0 ? "inactive" : "active",
      createdAt: dayOffset(-joinedDaysAgo),
      updatedAt: dayOffset(-between(0, 10)),
    });

    trainerClients.push({
      id: trainerClientId(trainerId, clientId),
      gymId: DEMO_GYM_ID,
      trainerId,
      clientId,
      status: atRisk ? "inactive" : "active",
      cohort: trainerProfiles[TRAINERS.indexOf(trainerId)].cohort,
      startedAt: dayOffset(-joinedDaysAgo),
      createdAt: dayOffset(-joinedDaysAgo),
      updatedAt: dayOffset(-between(0, 5)),
    });

    const planId = `plan_${clientId}`;
    const days = fullBodyDays(4);
    workoutPlans.push({
      id: planId,
      gymId: DEMO_GYM_ID,
      trainerId,
      clientId,
      templateId: null,
      name: `${goal === "wedding" ? "Wedding Countdown" : goal === "fat-loss" ? "Lean Phase" : goal === "muscle-gain" ? "Hypertrophy Block" : "Foundation"} · ${4}-day`,
      goal,
      status: "active",
      startDate: dateOnly(-28),
      endDate: dateOnly(56),
      days,
      trainerNotes: "Keep RPE ≤ 8 on the main lift while we build the base. Log every set.",
      createdAt: dayOffset(-30),
      updatedAt: dayOffset(-6),
    });

    const assignmentId = `asg_${clientId}`;
    workoutAssignments.push({
      id: assignmentId,
      gymId: DEMO_GYM_ID,
      trainerId,
      clientId,
      planId,
      assignedAt: dayOffset(-28),
      dueAt: dayOffset(56),
      status: "in_progress",
      createdAt: dayOffset(-28),
      updatedAt: dayOffset(-2),
    });

    const sessionsToGenerate = silent ? 3 : between(9, 22);
    for (let s = sessionsToGenerate; s > 0; s--) {
      const daysAgo = silent ? between(12, 26) : Math.round((s * 2.4) + between(0, 1));
      if (daysAgo > 180) continue;
      const day = days[s % days.length];
      const sets = day.blocks.flatMap((block) =>
        Array.from({ length: block.sets }, (_, setIndex) => ({
          exerciseId: block.exerciseId,
          name: block.name,
          setIndex,
          reps: between(5, 12),
          loadKg: Math.round((block.loadKg ?? 20) * (1 + (sessionsToGenerate - s) * 0.012)),
          rpe: between(6, 10),
          completed: true,
        })),
      );
      const volumeKg = sets.reduce((sum, set) => sum + set.reps * set.loadKg, 0);
      workoutSessions.push({
        id: `sess_${clientId}_${s}`,
        gymId: DEMO_GYM_ID,
        clientId,
        trainerId,
        planId,
        assignmentId,
        dayIndex: day.dayIndex,
        dayLabel: day.label,
        startedAt: dayOffset(-daysAgo),
        completedAt: dayOffset(-daysAgo),
        sets,
        volumeKg,
        sessionRpe: between(6, 9),
        source: "client",
        notes: "",
        createdAt: dayOffset(-daysAgo),
      });
    }

    clientGoals.push({
      id: `goal_${clientId}`,
      gymId: DEMO_GYM_ID,
      clientId,
      title:
        goal === "fat-loss" ? "Reach target body weight" :
        goal === "muscle-gain" ? "Add lean mass" :
        goal === "wedding" ? "Wedding-day conditioning" : "Improve consistency",
      metric: goal === "fat-loss" || goal === "muscle-gain" ? "weight" : "adherence",
      start: startWeight,
      target: Number((startWeight + trend * 12).toFixed(1)),
      current: Number((startWeight + trend * 6).toFixed(1)),
      unit: goal === "fat-loss" || goal === "muscle-gain" ? "kg" : "%",
      dueDate: dateOnly(90),
      status: "active",
      createdAt: dayOffset(-joinedDaysAgo),
      updatedAt: dayOffset(-4),
    });

    for (let m = 8; m >= 0; m--) {
      progress.push({
        id: `prog_${clientId}_${m}`,
        gymId: DEMO_GYM_ID,
        clientId,
        date: dateOnly(-m * 7),
        weightKg: Number((startWeight + trend * (8 - m)).toFixed(1)),
        bodyFatPct: goal === "fat-loss" ? Number((26 - (8 - m) * 0.4).toFixed(1)) : null,
        waistCm: Number((88 - (8 - m) * 0.5).toFixed(1)),
        createdAt: dayOffset(-m * 7),
      });
    }

    nutritionPlans.push({
      id: `nutri_${clientId}`,
      gymId: DEMO_GYM_ID,
      trainerId,
      clientId,
      targets: {
        calories: between(1500, 2600),
        protein: between(110, 190),
        carbs: between(140, 280),
        fat: between(45, 85),
      },
      hydrationMl: 3000,
      meals: [
        { label: "Breakfast", time: "07:30", items: ["3 egg whites + 1 whole egg", "2 slices multigrain", "Black coffee"], calories: 380 },
        { label: "Lunch", time: "13:00", items: ["2 roti", "Dal", "Paneer sabzi", "Curd"], calories: 620 },
        { label: "Pre-workout", time: "18:00", items: ["Banana", "Whey scoop"], calories: 260 },
        { label: "Dinner", time: "21:00", items: ["Grilled chicken", "Salad", "Quinoa"], calories: 520 },
      ],
      status: "active",
      createdAt: dayOffset(-26),
      updatedAt: dayOffset(-8),
    });

    if (!silent) {
      for (let d = 13; d >= 0; d--) {
        if (!streakActive && d % 3 === 0) continue;
        nutritionLogs.push({
          id: nutritionLogId(clientId, dateOnly(-d)),
          gymId: DEMO_GYM_ID,
          clientId,
          date: dateOnly(-d),
          totals: {
            calories: between(1500, 2700),
            protein: between(90, 195),
            carbs: between(120, 300),
            fat: between(40, 95),
          },
          waterMl: between(1800, 3800),
          updatedAt: dayOffset(-d),
        });
      }
    }

    const noteBodies = [
      "Left shoulder felt tight on incline press — swapped to neutral grip, no pain reported since.",
      "Sleep averaging 6h. Cutting conditioning volume next week and holding the main lift.",
      "Hit a 5kg squat PR with clean depth. Ready to progress the top set next block.",
      "Travelling for 10 days — sent the hotel-bodyweight version of the plan.",
    ];
    const noteCount = between(1, 3);
    for (let n = 0; n < noteCount; n++) {
      clientNotes.push({
        id: `note_${clientId}_${n}`,
        gymId: DEMO_GYM_ID,
        trainerId,
        clientId,
        body: pick(noteBodies),
        visibility: n === 0 ? "shared" : "trainer_only",
        createdAt: dayOffset(-between(2, 40)),
      });
    }
  });

  /* Appointments: a realistic two-week schedule around "today". */
  const apptTypes = ["pt", "assessment", "consult", "class", "checkin"] as const;
  for (let i = 0; i < 26; i++) {
    const clientIndex = i % CLIENT_NAMES.length;
    const clientId = `demo_client_${String(clientIndex + 1).padStart(2, "0")}`;
    const trainerId = TRAINERS[clientIndex % TRAINERS.length];
    const dayOffsetValue = between(-10, 14);
    const hour = between(6, 20);
    const startsAt = new Date(TODAY.getTime() + dayOffsetValue * DAY);
    startsAt.setHours(hour, [0, 30][i % 2], 0, 0);
    const endsAt = new Date(startsAt.getTime() + 60 * 60_000);
    const status =
      dayOffsetValue < 0 ? pick(["completed", "completed", "no_show", "cancelled"] as const)
      : dayOffsetValue === 0 ? pick(["confirmed", "requested", "confirmed"] as const)
      : pick(["confirmed", "confirmed", "requested"] as const);
    appointments.push({
      id: `appt_${i + 1}`,
      gymId: DEMO_GYM_ID,
      trainerId,
      clientId,
      type: apptTypes[i % apptTypes.length],
      status,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: i % 3 === 0 ? "Studio 2" : "Main floor",
      notes: i % 4 === 0 ? "Bring lifting belt" : "",
      statusBy: status === "requested" ? clientId : trainerId,
      createdAt: dayOffset(dayOffsetValue - 3),
      updatedAt: dayOffset(dayOffsetValue - 1),
    });
  }

  const trainerAvailability: BaseDoc[] = [];
  for (const trainerId of TRAINERS) {
    for (const weekday of [1, 2, 3, 4, 5, 6]) {
      const startTime = weekday === 6 ? "08:00" : "06:00";
      const endTime = weekday === 6 ? "12:00" : "11:00";
      trainerAvailability.push({
        id: availabilityId(trainerId, weekday, startTime),
        gymId: DEMO_GYM_ID,
        trainerId,
        weekday,
        startTime,
        endTime,
        slotMinutes: 60,
        active: true,
        createdAt: dayOffset(-200),
        updatedAt: dayOffset(-30),
      });
    }
  }

  const entitlements: BaseDoc[] = [
    {
      id: DEMO_GYM_ID,
      subjectType: "gym",
      subjectId: DEMO_GYM_ID,
      gymId: DEMO_GYM_ID,
      plan: "gym_scale",
      status: "active",
      source: "razorpay",
      startedAt: dayOffset(-120),
      expiresAt: dayOffset(245),
      seats: { trainers: 15, members: 500 },
      providerRef: "sub_demo_scale",
      updatedAt: dayOffset(-30),
    },
    {
      id: OWNER,
      subjectType: "user",
      subjectId: OWNER,
      gymId: DEMO_GYM_ID,
      plan: "elite",
      status: "active",
      source: "manual",
      startedAt: dayOffset(-400),
      expiresAt: null,
      updatedAt: dayOffset(-400),
    },
    ...[0, 1, 2, 3].map((index) => ({
      id: `demo_client_${String(index + 1).padStart(2, "0")}`,
      subjectType: "user",
      subjectId: `demo_client_${String(index + 1).padStart(2, "0")}`,
      gymId: DEMO_GYM_ID,
      plan: "pro",
      status: "active",
      source: "razorpay",
      startedAt: dayOffset(-60),
      expiresAt: dayOffset(30),
      providerRef: `pay_demo_${index}`,
      updatedAt: dayOffset(-10),
    })),
  ];

  const payments: BaseDoc[] = [
    {
      id: "pay_demo_gym_1",
      gymId: DEMO_GYM_ID,
      userId: OWNER,
      provider: "razorpay",
      providerRef: "pay_R4nd0mGymScale",
      amountMinor: 999_900,
      currency: "INR",
      status: "captured",
      plan: "gym_scale",
      createdAt: dayOffset(-30),
      verifiedAt: dayOffset(-30),
      verifiedBy: "webhook:razorpay",
    },
    {
      id: "pay_demo_member_1",
      gymId: DEMO_GYM_ID,
      userId: "demo_client_01",
      provider: "razorpay",
      providerRef: "pay_R4nd0mMember",
      amountMinor: 19_900,
      currency: "INR",
      status: "captured",
      plan: "pro",
      createdAt: dayOffset(-10),
      verifiedAt: dayOffset(-10),
      verifiedBy: "webhook:razorpay",
    },
  ];

  const notifications: BaseDoc[] = [
    {
      id: "notif_1",
      gymId: DEMO_GYM_ID,
      userId: OWNER,
      title: "3 members flagged at risk",
      body: "Adherence below 50% for two consecutive weeks.",
      kind: "system",
      read: false,
      createdAt: dayOffset(-1),
    },
    {
      id: "notif_2",
      gymId: DEMO_GYM_ID,
      userId: "demo_client_01",
      title: "New session assigned",
      body: "Upper Pull is waiting in Today's session.",
      kind: "workout",
      read: false,
      createdAt: dayOffset(-1),
    },
  ];

  const auditLog: BaseDoc[] = [
    {
      id: "audit_1",
      actorId: OWNER,
      actorRole: "gym_owner",
      gymId: DEMO_GYM_ID,
      action: "membership.manage",
      entity: "memberships",
      entityId: membershipId(DEMO_GYM_ID, "demo_client_01"),
      at: dayOffset(-12),
      meta: { added: "demo_client_01" },
    },
  ];

  return {
    gyms,
    memberships,
    users,
    trainerClients,
    workoutTemplates: [],
    workoutPlans,
    workoutAssignments,
    workoutSessions,
    nutritionPlans,
    nutritionLogs,
    progress,
    clientGoals,
    clientNotes,
    appointments,
    trainerAvailability,
    notifications,
    entitlements,
    payments,
    auditLog,
  };
}
