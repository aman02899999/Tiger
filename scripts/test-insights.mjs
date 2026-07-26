#!/usr/bin/env node
/**
 * Unit tests for the Titan Intelligence engine.
 *
 * The engine is pure, so we can exercise it without a browser. Run with:
 *   node scripts/test-insights.mjs
 *
 * It type-strips the TS source (Node 22 can't import .ts directly here) by
 * compiling with the project's tsc into a temp ESM file.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const dir = mkdtempSync(join(tmpdir(), "titan-"));
execSync(
  `npx tsc src/app/insights.ts --outDir ${dir} --module esnext --target es2022 --moduleResolution bundler`,
  { stdio: "inherit" }
);
// calorieTarget lives in a .tsx file; extract just that pure function so we
// can test the nutrition maths without pulling in React.
{
  const src = readFileSync("src/app/NutritionTracker.tsx", "utf8");
  const start = src.indexOf("export function calorieTarget");
  const end = src.indexOf("function Ring(");
  writeFileSync(join(dir, "nutrition.ts"), src.slice(start, end));
  execSync(
    `npx tsc ${join(dir, "nutrition.ts")} --outDir ${dir} --module esnext --target es2022 --moduleResolution bundler`,
    { stdio: "inherit" }
  );
}
writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));

const M = await import(join(dir, "insights.js"));

/* ── helpers ─────────────────────────────────────────────────────── */
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const base = (over = {}) => ({
  sleep: [], metrics: [], mood: [], consistency: {},
  readiness: null, waterMl: 0, waterGoalMl: 3000,
  user: { email: "t@t.com", goal: "fat-loss", streak: 0 },
  ...over,
});

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("\nsleepDebt");
test("returns 0 with no data", () => {
  assert.equal(M.sleepDebt([]), 0);
});
test("computes debt against an 8h target", () => {
  const sleep = [0, 1, 2].map((i) => ({ date: day(i), hours: 6, quality: 3 }));
  assert.equal(M.sleepDebt(sleep), 6); // 3 nights x 2h short
});
test("ignores nights older than 7 days", () => {
  const sleep = [{ date: day(30), hours: 2, quality: 1 }];
  assert.equal(M.sleepDebt(sleep), 0);
});
test("surplus sleep yields negative debt", () => {
  const sleep = [{ date: day(0), hours: 9, quality: 5 }];
  assert.equal(M.sleepDebt(sleep), -1);
});

console.log("\nenergyScore");
test("flags itself estimated when there is no data", () => {
  const s = M.energyScore(base());
  assert.equal(s.estimated, true);
  assert.equal(s.confidence, 0);
});
test("an explicit readiness check-in wins outright", () => {
  const s = M.energyScore(base({ readiness: { answers: {}, score: 41 } }));
  assert.equal(s.value, 41);
  assert.equal(s.confidence, 1);
  assert.equal(s.estimated, false);
});
test("good sleep scores higher than bad sleep", () => {
  const good = M.energyScore(base({ sleep: [{ date: day(0), hours: 8, quality: 5 }] }));
  const bad = M.energyScore(base({ sleep: [{ date: day(0), hours: 4, quality: 1 }] }));
  assert.ok(good.value > bad.value, `${good.value} !> ${bad.value}`);
  assert.equal(good.estimated, false);
});
test("high stress drags energy down", () => {
  const sleep = [{ date: day(0), hours: 8, quality: 5 }];
  const calm = M.energyScore(base({ sleep, mood: [{ date: day(0), moodId: "ok", stress: 1, note: "" }] }));
  const tense = M.energyScore(base({ sleep, mood: [{ date: day(0), moodId: "ok", stress: 5, note: "" }] }));
  assert.ok(calm.value > tense.value, `${calm.value} !> ${tense.value}`);
});
test("stays within 0..100", () => {
  const s = M.energyScore(base({
    sleep: [{ date: day(0), hours: 99, quality: 5 }],
    consistency: { [day(0)]: 4, [day(1)]: 4, [day(2)]: 4 },
  }));
  assert.ok(s.value >= 0 && s.value <= 100, `out of range: ${s.value}`);
});

console.log("\ntitanScore");
test("is zero and estimated with no data", () => {
  const s = M.titanScore(base());
  assert.equal(s.value, 0);
  assert.equal(s.estimated, true);
});
test("does not punish a user who only tracks one pillar", () => {
  // 16 active days in 4 weeks = a perfect training pillar.
  const consistency = {};
  for (let i = 0; i < 16; i++) consistency[day(i)] = 3;
  const s = M.titanScore(base({ consistency }));
  // Re-normalisation must keep this high, not collapse it to ~34.
  assert.ok(s.value >= 95, `expected >=95, got ${s.value}`);
  assert.ok(s.confidence < 0.5, "confidence should reflect the missing pillars");
});
test("reports all five pillars", () => {
  assert.equal(M.titanScore(base()).pillars.length, 5);
});
test("pillar weights sum to 1", () => {
  const total = M.titanScore(base()).pillars.reduce((s, p) => s + p.weight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`);
});

console.log("\ngoalChance");
test("neutral 50 with no data", () => {
  const g = M.goalChance(base());
  assert.equal(g.value, 50);
  assert.equal(g.estimated, true);
});
test("losing weight on a fat-loss goal improves the odds", () => {
  const consistency = {};
  for (let i = 0; i < 12; i++) consistency[day(i)] = 2;
  const losing = M.goalChance(base({
    consistency,
    metrics: [
      { date: day(0), values: { weight: 78 } },
      { date: day(21), values: { weight: 82 } },
    ],
  }));
  const gaining = M.goalChance(base({
    consistency,
    metrics: [
      { date: day(0), values: { weight: 82 } },
      { date: day(21), values: { weight: 78 } },
    ],
  }));
  assert.ok(losing.value > gaining.value, `${losing.value} !> ${gaining.value}`);
});

test("never promises 100% (or 0%) certainty", () => {
  const consistency = {};
  for (let i = 0; i < 16; i++) consistency[day(i)] = 3;
  const perfect = M.goalChance(base({
    consistency,
    sleep: Array.from({ length: 7 }, (_, i) => ({ date: day(i), hours: 8.1, quality: 5 })),
    mood: Array.from({ length: 5 }, (_, i) => ({ date: day(i), moodId: "x", stress: 1, note: "" })),
    waterMl: 3000,
    metrics: [
      { date: day(0), values: { weight: 76 } },
      { date: day(28), values: { weight: 80 } },
    ],
    user: { email: "c", goal: "fat-loss", streak: 30 },
  }));
  assert.ok(perfect.value <= 95, `should cap at 95, got ${perfect.value}`);
  assert.ok(perfect.value >= 5);
});

console.log("\nbuildInsights");
test("never returns empty (cold start is handled)", () => {
  const list = M.buildInsights(base());
  assert.ok(list.length > 0);
  assert.ok(list.some((i) => i.id === "welcome"));
});
test("severe sleep debt is surfaced as critical", () => {
  const sleep = [0, 1, 2, 3].map((i) => ({ date: day(i), hours: 5, quality: 2 }));
  const list = M.buildInsights(base({ sleep }));
  const hit = list.find((i) => i.id === "sleep-debt-high");
  assert.ok(hit, "expected sleep-debt-high");
  assert.equal(hit.severity, "critical");
});
test("critical insights sort above wins", () => {
  const sleep = [0, 1, 2, 3].map((i) => ({ date: day(i), hours: 5, quality: 2 }));
  const list = M.buildInsights(base({ sleep, user: { email: "a", goal: "fat-loss", streak: 30 } }));
  const crit = list.findIndex((i) => i.severity === "critical");
  const win = list.findIndex((i) => i.severity === "win");
  assert.ok(crit >= 0 && win >= 0, "need both severities present");
  assert.ok(crit < win, "critical must outrank win");
});
test("detects overtraining (high frequency + low sleep)", () => {
  const consistency = {};
  for (let i = 0; i < 7; i++) consistency[day(i)] = 3;
  const sleep = Array.from({ length: 7 }, (_, i) => ({ date: day(i), hours: 6, quality: 2 }));
  const list = M.buildInsights(base({ consistency, sleep }));
  assert.ok(list.some((i) => i.id === "overtraining-risk"));
});
test("every insight has a non-empty title and body", () => {
  for (const d of [base(), base({ sleep: [{ date: day(0), hours: 5, quality: 2 }] })]) {
    for (const i of M.buildInsights(d)) {
      assert.ok(i.title.length > 0, "empty title");
      assert.ok(i.body.length > 20, `thin body on ${i.id}`);
    }
  }
});
test("insight ids are unique", () => {
  const consistency = {};
  for (let i = 0; i < 7; i++) consistency[day(i)] = 3;
  const list = M.buildInsights(base({
    consistency,
    sleep: Array.from({ length: 7 }, (_, i) => ({ date: day(i), hours: 5, quality: 2 })),
    mood: Array.from({ length: 5 }, (_, i) => ({ date: day(i), moodId: "x", stress: 5, note: "" })),
  }));
  assert.equal(new Set(list.map((i) => i.id)).size, list.length);
});
test("actions always point at a real app section", () => {
  const known = new Set([
    "workouts", "calendar", "sleeprecovery", "readiness", "bodymetrics",
    "nutrition", "hearthealth", "moodjournal", "consistency", "aicoach",
  ]);
  const datasets = [base(), base({ waterMl: 300 }), base({ consistency: { [day(9)]: 1 } })];
  for (const d of datasets) {
    for (const i of M.buildInsights(d)) {
      if (i.action) assert.ok(known.has(i.action.section), `unknown section ${i.action.section}`);
    }
  }
});

console.log("\nnextBestAction");
test("skips wins and returns something actionable", () => {
  const sleep = [0, 1, 2, 3].map((i) => ({ date: day(i), hours: 5, quality: 2 }));
  const list = M.buildInsights(base({ sleep, user: { email: "a", goal: "fat-loss", streak: 30 } }));
  const nba = M.nextBestAction(list);
  assert.ok(nba);
  assert.ok(nba.action, "must have an action");
  assert.notEqual(nba.severity, "win");
});

const N = await import(join(dir, "nutrition.js"));

console.log("\ncalorieTarget");
test("fat-loss target sits below maintenance", () => {
  const cut = N.calorieTarget({ age: 30, height: 175, weight: 80, gender: "male", goal: "fat-loss" });
  const keep = N.calorieTarget({ age: 30, height: 175, weight: 80, gender: "male", goal: "maintenance" });
  assert.ok(cut.kcal < keep.kcal, `${cut.kcal} !< ${keep.kcal}`);
});
test("muscle-gain target sits above maintenance", () => {
  const gain = N.calorieTarget({ age: 30, height: 175, weight: 80, gender: "male", goal: "muscle-gain" });
  const keep = N.calorieTarget({ age: 30, height: 175, weight: 80, gender: "male", goal: "maintenance" });
  assert.ok(gain.kcal > keep.kcal);
});
test("women get the -161 Mifflin constant (lower target)", () => {
  const f = N.calorieTarget({ age: 30, height: 175, weight: 80, gender: "female", goal: "maintenance" });
  const m = N.calorieTarget({ age: 30, height: 175, weight: 80, gender: "male", goal: "maintenance" });
  assert.ok(f.kcal < m.kcal);
});
test("protein scales at 1.8 g/kg", () => {
  assert.equal(N.calorieTarget({ weight: 80 }).protein, 144);
});
test("targets stay physiologically sane", () => {
  const t = N.calorieTarget({ age: 28, height: 175, weight: 78, gender: "male", goal: "fat-loss" });
  assert.ok(t.kcal > 1200 && t.kcal < 4000, `implausible: ${t.kcal}`);
});
test("handles a null user without throwing", () => {
  const t = N.calorieTarget(null);
  assert.ok(t.kcal > 0 && t.protein > 0);
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} assertions passed.\n`);
