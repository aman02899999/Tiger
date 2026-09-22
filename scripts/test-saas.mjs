#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * TIGER — SAAS & SECURITY PROOF SUITE
 * ───────────────────────────────────────────────────────────────────
 * Executable evidence for the security work. Everything here runs on
 * plain Node with no Firebase project, no network and no emulator:
 *
 *   1. PERMISSION MATRIX      every role × capability decision
 *   2. TENANT ISOLATION       cross-gym / cross-trainer / cross-client
 *   3. ENTITLEMENT READ-ONLY  the browser cannot grant itself anything
 *   4. PAYMENT VERIFICATION   signature, pricing, idempotency, refunds,
 *                             Google Play product mapping and expiry
 *   5. RULES INVARIANTS       firestore.rules & storage.rules, parsed
 *   6. REGISTRY ↔ RULES       every collection accounted for, both ways
 *   7. INDEXES                firestore.indexes.json matches the queries
 *   8. DESIGN TOKENS          ui/tokens.ts matches index.css
 *   9. HYGIENE SCAN           no frontend admin password, no simulated
 *                             payments, no authority in localStorage
 *
 * Run:  node scripts/test-saas.mjs
 * ═══════════════════════════════════════════════════════════════════
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();
const SRC_BUILD = join(ROOT, ".test-build", "src");
const FN_BUILD = join(ROOT, ".test-build", "functions");

/* ── tiny harness ───────────────────────────────────────────────── */

let passed = 0;
const failures = [];
const group = (name) => console.log(`\n── ${name} ${"─".repeat(Math.max(0, 58 - name.length))}`);

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  ✗ ${name}\n      ${error.message.split("\n")[0]}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  ✗ ${name}\n      ${error.message.split("\n")[0]}`);
  }
}

/* ── build the TypeScript under test ────────────────────────────── */

function compile(sources, outDir, rootDir, types) {
  rmSync(outDir, { recursive: true, force: true });
  execFileSync(
    "npx",
    [
      "tsc",
      ...sources,
      "--rootDir",
      rootDir,
      "--outDir",
      outDir,
      "--module",
      "esnext",
      "--target",
      "es2022",
      "--moduleResolution",
      "bundler",
      "--esModuleInterop",
      "--skipLibCheck",
      "--types",
      types,
    ],
    { stdio: "inherit", cwd: ROOT },
  );
  writeFileSync(join(outDir, "package.json"), JSON.stringify({ type: "module" }));
}

/**
 * tsc emits extensionless specifiers ("../domain/models") which Node's ESM
 * loader refuses. Rewrite them to the emitted `.js` files — deterministically,
 * so a missing module fails here rather than inside the app.
 */
function rewriteRelativeImports(dir) {
  if (!statIsDir(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteRelativeImports(path);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    const source = readFileSync(path, "utf8");
    const rewritten = source.replace(/(from\s+|import\()(["'])(\.[^"']+)\2/g, (whole, lead, quote, spec) => {
      const base = resolve(dir, spec);
      for (const candidate of [`${base}.js`, join(base, "index.js")]) {
        if (existsFile(candidate)) {
          const rel = relative(dir, candidate).split(sep).join("/");
          return `${lead}${quote}${rel.startsWith(".") ? rel : `./${rel}`}${quote}`;
        }
      }
      return whole;
    });
    if (rewritten !== source) writeFileSync(path, rewritten);
  }
}

function statIsDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function existsFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function walkFiles(dir, extensions, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".test")) continue;
      walkFiles(path, extensions, out);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(path);
    }
  }
  return out;
}

console.log("Compiling the modules under test…");
mkdirSync(join(ROOT, ".test-build"), { recursive: true });
compile(
  [
    "src/security/permissions.ts",
    "src/domain/models.ts",
    "src/domain/collections.ts",
    "src/domain/validation.ts",
    "src/data/datasource.ts",
    "src/data/repos.ts",
    "src/data/demoSeed.ts",
    "src/data/analytics.ts",
    "src/ui/tokens.ts",
    "src/firebaseConfig.ts",
  ],
  SRC_BUILD,
  "src",
  "vite/client,node",
);
rewriteRelativeImports(SRC_BUILD);

compile(["functions/src/verification.ts"], FN_BUILD, "functions/src", "node");
rewriteRelativeImports(FN_BUILD);

const P = await import(join(SRC_BUILD, "security/permissions.js"));
const V = await import(join(SRC_BUILD, "domain/validation.js"));
const C = await import(join(SRC_BUILD, "domain/collections.js"));
const D = await import(join(SRC_BUILD, "data/datasource.js"));
const R = await import(join(SRC_BUILD, "data/repos.js"));
const SEED = await import(join(SRC_BUILD, "data/demoSeed.js"));
const TOKENS = await import(join(SRC_BUILD, "ui/tokens.js"));
const FIREBASE = await import(join(SRC_BUILD, "firebaseConfig.js"));
const VERIFY = await import(join(FN_BUILD, "verification.js"));

const GYM = SEED.DEMO_GYM_ID;
const OTHER_GYM = "gym_rival_studio";
const TRAINER = "demo_trainer_a";
const OTHER_TRAINER = "demo_trainer_b";
const CLIENT = "demo_client_01";
const OTHER_CLIENT = "demo_client_02";

const actorOf = (uid, role, gymId = GYM) => ({ uid, role, gymId, gymIds: gymId ? [gymId] : [] });
const activeRel = (trainerId, clientId, gymId = GYM) => ({ trainerId, clientId, gymId, status: "active" });

/* ═══════════════════════════════════════════════════════════════════
   1. PERMISSION MATRIX
   ═══════════════════════════════════════════════════════════════════ */

group("1. Permission matrix");

const client = actorOf(CLIENT, "client");
const trainer = actorOf(TRAINER, "trainer");
const otherTrainer = actorOf(OTHER_TRAINER, "trainer");
const owner = actorOf("demo_owner", "gym_owner");
const admin = { uid: "demo_admin", role: "super_admin", gymId: null, gymIds: [] };

const assignedCtx = { gymId: GYM, ownerUserId: CLIENT, authorTrainerId: TRAINER, relationship: activeRel(TRAINER, CLIENT) };

test("a client cannot author or assign training prescriptions", () => {
  for (const capability of ["plan.write", "plan.assign", "note.write", "template.write", "nutritionPlan.write"]) {
    assert.equal(P.can(client, capability, assignedCtx), false, `${capability} must be denied to a client`);
    assert.equal(P.can(client, capability, { gymId: GYM, ownerUserId: CLIENT }), false, `${capability} must be denied even for their own row`);
  }
});

test("a client cannot touch tenancy, roles or other people", () => {
  for (const capability of ["gym.write", "gym.provision", "membership.manage", "role.assign", "trainerClient.manage", "user.delete"]) {
    assert.equal(P.can(client, capability, assignedCtx), false, `${capability} must be denied to a client`);
  }
});

test("a client reads only their own data — not another client's", () => {
  assert.equal(P.can(client, "session.read", { gymId: GYM, ownerUserId: CLIENT }), true);
  assert.equal(P.can(client, "session.read", { gymId: GYM, ownerUserId: OTHER_CLIENT }), false);
  assert.equal(P.can(client, "progress.read", { gymId: GYM, ownerUserId: OTHER_CLIENT }), false);
  assert.equal(P.can(client, "plan.read", { gymId: GYM, ownerUserId: OTHER_CLIENT }), false);
  assert.equal(P.can(client, "user.read", { gymId: GYM, ownerUserId: OTHER_CLIENT }), false);
});

test("a client may log their own activity but not a trainer's prescription", () => {
  assert.equal(P.can(client, "session.log", { gymId: GYM, ownerUserId: CLIENT }), true);
  assert.equal(P.can(client, "session.log", { gymId: GYM, ownerUserId: OTHER_CLIENT }), false);
  assert.equal(P.can(client, "nutritionLog.write", { gymId: GYM, ownerUserId: CLIENT }), true);
  assert.equal(P.can(client, "nutritionLog.write", { gymId: GYM, ownerUserId: OTHER_CLIENT }), false);
});

test("a trainer reaches only clients with an active relationship in their gym", () => {
  assert.equal(P.can(trainer, "plan.write", assignedCtx), true, "assigned + active must be allowed");
  assert.equal(
    P.can(trainer, "plan.write", { ...assignedCtx, relationship: { ...activeRel(TRAINER, CLIENT), status: "inactive" } }),
    false,
    "an inactive relationship must deny",
  );
  assert.equal(P.can(trainer, "plan.write", { ...assignedCtx, relationship: null }), false, "no relationship must deny");
  assert.equal(
    P.can(otherTrainer, "plan.write", assignedCtx),
    false,
    "another trainer's relationship must not grant access",
  );
  assert.equal(
    P.can(otherTrainer, "plan.write", { ...assignedCtx, relationship: activeRel(OTHER_TRAINER, CLIENT) }),
    true,
    "a trainer with their own active relationship does get access",
  );
  assert.equal(
    P.can(trainer, "plan.write", { ...assignedCtx, relationship: { ...activeRel(TRAINER, CLIENT), gymId: OTHER_GYM } }),
    false,
    "a relationship in another gym must deny",
  );
});

test("a trainer cannot administer the gym or reassign people", () => {
  for (const capability of ["membership.manage", "role.assign", "gym.write", "trainerClient.manage"]) {
    assert.equal(P.can(trainer, capability, assignedCtx), false, `${capability} must be denied to a trainer`);
  }
});

test("a gym owner is confined to their own gym", () => {
  assert.equal(P.can(owner, "membership.manage", { gymId: GYM }), true);
  assert.equal(P.can(owner, "analytics.gym", { gymId: GYM }), true);
  assert.equal(P.can(owner, "membership.manage", { gymId: OTHER_GYM }), false);
  assert.equal(P.can(owner, "analytics.gym", { gymId: OTHER_GYM }), false);
  assert.equal(P.can(owner, "gym.provision", {}), false, "provisioning is a platform capability");
});

test("a gym owner may add trainers and clients, never a platform admin", () => {
  assert.equal(P.can(owner, "role.assign", { gymId: GYM, targetRole: "trainer" }), true);
  assert.equal(P.can(owner, "role.assign", { gymId: GYM, targetRole: "client" }), true);
  assert.equal(P.can(owner, "role.assign", { gymId: GYM, targetRole: "gym_owner" }), false);
  assert.equal(P.can(owner, "role.assign", { gymId: GYM, targetRole: "super_admin" }), false);
});

test("platform admin can administer, but not fabricate money", () => {
  assert.equal(P.can(admin, "gym.provision", {}), true);
  assert.equal(P.can(admin, "role.assign", { targetRole: "super_admin" }), true);
  assert.equal(P.can(admin, "audit.read", {}), true, "admins read the audit log (the rules scope it)");
  for (const capability of P.BACKEND_ONLY_CAPABILITIES) {
    assert.equal(P.can(admin, capability, { ownerUserId: admin.uid, gymId: GYM }), false, `${capability} must be backend-only, even for super_admin`);
  }
  assert.deepEqual([...P.BACKEND_ONLY_CAPABILITIES].sort(), ["entitlement.write", "payment.write", "subscription.write"]);
});

test("every capability in the catalog has a decision for every role", () => {
  assert.ok(P.CAPABILITIES.length >= 30, "capability catalog should be broad");
  for (const capability of P.CAPABILITIES) {
    for (const who of [client, trainer, owner, admin]) {
      const decision = P.can(who, capability, assignedCtx);
      assert.equal(typeof decision, "boolean", `${capability}/${who.role} must decide`);
    }
  }
});

test("a missing gym claim denies every tenant-scoped write and every peer read", () => {
  const homeless = actorOf("demo_client_09", "client", null);
  for (const capability of ["plan.write", "session.log", "progress.write", "appointment.write", "note.write", "goal.write"]) {
    assert.equal(P.can(homeless, capability, { gymId: GYM, ownerUserId: "demo_client_09" }), false, `${capability} must deny without a claim`);
  }
  for (const capability of ["user.read", "session.read", "progress.read", "plan.read"]) {
    assert.equal(P.can(homeless, capability, { gymId: GYM, ownerUserId: OTHER_CLIENT }), false, `${capability} must not reach a peer without a claim`);
  }
  assert.equal(P.can(homeless, "session.log", { gymId: GYM, ownerUserId: "demo_client_09" }), false, "even self-writes need a tenant");
});

test("assertCan throws PermissionError with the capability named", () => {
  assert.throws(() => P.assertCan(client, "plan.write", assignedCtx), (error) => {
    assert.ok(error instanceof P.PermissionError);
    assert.match(error.message, /plan\.write|permission/i);
    return true;
  });
});

test("unknown or fabricated roles are treated as unprivileged", () => {
  const impostor = { uid: "attacker", role: "root", gymId: GYM, gymIds: [GYM] };
  for (const capability of ["gym.write", "role.assign", "audit.read", "membership.manage"]) {
    assert.equal(P.can(impostor, capability, { gymId: GYM }), false, `${capability} must deny an invented role`);
  }
});

/* ═══════════════════════════════════════════════════════════════════
   2. TENANT ISOLATION (through the real repository layer)
   ═══════════════════════════════════════════════════════════════════ */

group("2. Tenant isolation");

const claimsFor = (role, gymId = GYM) => ({ role, gymId, gymIds: gymId ? [gymId] : [], entitlements: [] });

function tenantFor(uid, role, gymId = GYM) {
  const source = new D.DemoSource(SEED.buildDemoSeed());
  return new R.TenantClient({ uid, role, gymId, gymIds: gymId ? [gymId] : [] }, source, claimsFor(role, gymId));
}

const sharedSource = new D.DemoSource(SEED.buildDemoSeed());
const trainerA = new R.TenantClient({ uid: TRAINER, role: "trainer", gymId: GYM, gymIds: [GYM] }, sharedSource, claimsFor("trainer"));
const clientA = new R.TenantClient({ uid: CLIENT, role: "client", gymId: GYM, gymIds: [GYM] }, sharedSource, claimsFor("client"));
const ownerA = new R.TenantClient({ uid: "demo_owner", role: "gym_owner", gymId: GYM, gymIds: [GYM] }, sharedSource, claimsFor("gym_owner"));

await testAsync("a trainer's roster contains only their own active relationships", async () => {
  const roster = await trainerA.listTrainerClients(TRAINER);
  assert.ok(roster.length > 0, "the demo tenant should give the trainer a roster");
  for (const row of roster) {
    assert.equal(row.trainerId, TRAINER, "roster row must belong to this trainer");
    assert.equal(row.gymId, GYM, "roster row must be in this gym");
    assert.equal(row.status, "active", "only active relationships form the roster");
  }
  const otherRoster = await trainerA.listTrainerClients(OTHER_TRAINER);
  for (const row of otherRoster) {
    assert.notEqual(row.trainerId, OTHER_TRAINER, "a trainer must not read another trainer's roster");
  }
});

await testAsync("writes are stamped with the caller's gym, not the caller's request", async () => {
  const plan = await trainerA.savePlan({
    plan: {
      clientId: CLIENT,
      name: "Isolation probe",
      goal: "general",
      status: "draft",
      startDate: new Date().toISOString().slice(0, 10),
      days: [{ dayIndex: 0, label: "Push", focus: "Chest", blocks: [{ exerciseId: "ex_1", name: "Bench", sets: 3, reps: "8", restSec: 90 }] }],
    },
  });
  assert.equal(plan.gymId, GYM);

  const hostile = new R.TenantClient(
    { uid: TRAINER, role: "trainer", gymId: OTHER_GYM, gymIds: [OTHER_GYM] },
    sharedSource,
    claimsFor("trainer", OTHER_GYM),
  );
  await assert.rejects(
    () => hostile.savePlan({
      plan: {
        clientId: CLIENT,
        name: "Cross-gym probe",
        goal: "general",
        status: "draft",
        startDate: new Date().toISOString().slice(0, 10),
        days: [{ dayIndex: 0, label: "Push", focus: "Chest", blocks: [{ exerciseId: "ex_1", name: "Bench", sets: 3, reps: "8", restSec: 90 }] }],
      },
    }),
    (error) => {
      assert.ok(error instanceof P.PermissionError || /permission|forbidden|relationship/i.test(error.message), `expected a permission failure, got ${error.message}`);
      return true;
    },
    "a trainer whose claim is another gym must not write into this gym",
  );
});

await testAsync("a client cannot author a plan or assign work", async () => {
  await assert.rejects(() =>
    clientA.savePlan({
      plan: {
        clientId: CLIENT,
        name: "Self-prescribed",
        goal: "general",
        status: "active",
        startDate: new Date().toISOString().slice(0, 10),
        days: [{ dayIndex: 0, label: "Push", focus: "Chest", blocks: [{ exerciseId: "ex_1", name: "Bench", sets: 3, reps: "8", restSec: 90 }] }],
      },
    }),
  );
});

await testAsync("a client logs a session for themselves and not for anyone else", async () => {
  const ok = await clientA.logSession({
    clientId: CLIENT,
    dayIndex: 0,
    dayLabel: "Push",
    sets: [{ exerciseId: "ex_1", name: "Bench", setIndex: 0, reps: 8, loadKg: 60, completed: true }],
  });
  assert.equal(ok.clientId, CLIENT);
  assert.ok(ok.volumeKg > 0, "volume is derived from the sets, not supplied by the caller");

  await assert.rejects(
    () => clientA.logSession({
      clientId: OTHER_CLIENT,
      dayIndex: 0,
      dayLabel: "Push",
      sets: [{ exerciseId: "ex_1", name: "Bench", setIndex: 0, reps: 8, loadKg: 60, completed: true }],
    }),
    "a client must not log performance for another client",
  );
});

await testAsync("roster queries never return another gym's members", async () => {
  const cards = await trainerA.loadClientCards([CLIENT, OTHER_CLIENT]);
  for (const card of cards) {
    assert.notEqual(card.profile?.gymId && card.profile.gymId !== GYM, true, "cards must belong to this gym");
  }
  const outsider = tenantFor("stranger", "trainer", OTHER_GYM);
  const foreign = await outsider.loadClientCards([CLIENT]);
  assert.equal(foreign.length, 0, "an outsider sees nothing, not an error page full of data");
});

/* ═══════════════════════════════════════════════════════════════════
   3. ENTITLEMENT IS A SERVER FACT
   ═══════════════════════════════════════════════════════════════════ */

group("3. Entitlement read-only");

test("profile writes strip every commercial field", () => {
  const patch = { name: "Asha", plan: "elite", role: "super_admin", gymId: OTHER_GYM, entitlement: { plan: "elite" }, subscription: "active" };
  const safe = C.stripProtectedUserFields(patch);
  assert.deepEqual(Object.keys(safe), ["name"], "only the display name survives");
  for (const field of C.PROTECTED_USER_FIELDS) {
    assert.ok(!(field in safe), `${field} must never leave the client`);
  }
});

test("the validator refuses authority fields even when the caller is honest", () => {
  for (const field of C.PROTECTED_USER_FIELDS) {
    const verdict = V.validateProfilePatch({ [field]: "anything" });
    assert.equal(verdict.ok, false, `${field} must be rejected`);
  }
  assert.equal(V.validateProfilePatch({ name: "Asha", weight: 68 }).ok, true);
  assert.equal(V.validateProfilePatch({ weight: 900 }).ok, false, "out-of-range weight is rejected");
});

test("the browser has no way to compose an entitlement", () => {
  const moduleSource = readFileSync(join(ROOT, "src/domain/validation.ts"), "utf8");
  assert.match(moduleSource, /export function parseEntitlement/, "the browser may parse an entitlement");
  assert.doesNotMatch(moduleSource, /export function (build|create)Entitlement/, "but must never be able to build one");
});

test("entitlement text is parsed defensively", () => {
  const forged = V.parseEntitlement({ id: CLIENT, subjectId: CLIENT, subjectType: "user", plan: "platinum", status: "active" });
  assert.equal(forged, null, "an unknown plan is not an entitlement");
  const real = V.parseEntitlement({
    id: CLIENT, subjectId: CLIENT, subjectType: "user", gymId: GYM, plan: "pro", status: "active",
    source: "razorpay", startedAt: new Date().toISOString(), expiresAt: null, updatedAt: new Date().toISOString(),
  });
  assert.ok(real, "a well-formed entitlement parses");
  assert.equal(V.entitlementIsLive(real), true);
  assert.equal(V.entitlementIsLive({ ...real, status: "revoked" }), false);
  assert.equal(V.entitlementIsLive({ ...real, expiresAt: new Date(Date.now() - 86_400_000).toISOString() }), false);
});

test("payments cannot be parsed into existence from a missing provider reference", () => {
  assert.equal(V.parsePayment({ provider: "razorpay", status: "captured", amountMinor: 19900 }), null);
  assert.equal(V.parsePayment({ provider: "razorpay", status: "captured", amountMinor: 19900, providerRef: "pay_1" })?.status, "captured");
});

/* ═══════════════════════════════════════════════════════════════════
   4. PAYMENT VERIFICATION (the trusted backend's pure core)
   ═══════════════════════════════════════════════════════════════════ */

group("4. Payment verification");

const SECRET = "whsec_test_only_not_a_real_secret";

function signed(body, secret = SECRET) {
  /* Same construction as the backend: HMAC-SHA256 over the raw body. */
  return execFileSync("node", ["-e", `const c=require("node:crypto");process.stdout.write(c.createHmac("sha256",${JSON.stringify(secret)}).update(${JSON.stringify(body)},"utf8").digest("hex"))`], { encoding: "utf8" });
}

function capturedEvent(plan, cycle, amount, extra = {}) {
  return {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: extra.paymentId ?? "pay_TEST123",
          order_id: "order_TEST123",
          amount,
          currency: "INR",
          status: "captured",
          notes: { plan, cycle, subjectId: extra.subjectId ?? CLIENT, subjectType: "user", gymId: GYM },
          ...extra,
        },
      },
    },
  };
}

test("a valid webhook signature is accepted", () => {
  const body = JSON.stringify(capturedEvent("pro", "monthly", 19900));
  assert.equal(VERIFY.verifyWebhookSignature(body, signed(body), SECRET).ok, true);
});

test("a tampered body is rejected", () => {
  const body = JSON.stringify(capturedEvent("pro", "monthly", 19900));
  const signature = signed(body);
  const tampered = JSON.stringify(capturedEvent("pro", "monthly", 100));
  const verdict = VERIFY.verifyWebhookSignature(tampered, signature, SECRET);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "invalid_signature");
});

test("a wrong secret is rejected", () => {
  const body = JSON.stringify(capturedEvent("pro", "monthly", 19900));
  assert.equal(VERIFY.verifyWebhookSignature(body, signed(body, "whsec_attacker"), SECRET).ok, false);
});

test("missing signature, missing secret and length mismatch are all rejected without throwing", () => {
  const body = "{}";
  assert.equal(VERIFY.verifyWebhookSignature(body, null, SECRET).reason, "missing_signature");
  assert.equal(VERIFY.verifyWebhookSignature(body, signed(body), null).reason, "missing_secret");
  assert.equal(VERIFY.verifyWebhookSignature(body, signed(body).slice(0, 20), SECRET).reason, "invalid_signature");
});

test("the signature comparison is constant-time", () => {
  const source = readFileSync(join(ROOT, "functions/src/verification.ts"), "utf8");
  assert.match(source, /timingSafeEqual/, "signatures must be compared with timingSafeEqual");
  assert.doesNotMatch(source, /signature\s*===\s*expected|expected\s*===\s*signature/, "never with ===");
});

test("a verified capture grants exactly the plan the catalog prices", () => {
  const grant = VERIFY.deriveGrant(capturedEvent("pro", "monthly", 19900));
  assert.equal(grant.ok, true);
  assert.equal(grant.plan, "pro");
  assert.equal(grant.cycle, "monthly");
  assert.equal(grant.subjectId, CLIENT);
  assert.equal(grant.gymId, GYM);
  assert.equal(grant.idempotencyKey, "pay_TEST123:pro:monthly");
  const entitlement = VERIFY.entitlementFromGrant(grant);
  assert.equal(entitlement.status, "active");
  assert.equal(entitlement.source, "razorpay");
  assert.equal(entitlement.subjectType, "user");
});

test("underpayment, overpayment, wrong currency and uncaptured states never grant", () => {
  assert.equal(VERIFY.deriveGrant(capturedEvent("pro", "monthly", 100)).reason, "amount_mismatch");
  assert.equal(VERIFY.deriveGrant(capturedEvent("pro", "monthly", 1_000_000)).reason, "amount_mismatch");
  assert.equal(VERIFY.deriveGrant(capturedEvent("elite", "monthly", 19900)).reason, "amount_mismatch", "paying Pro prices must not buy Elite");
  assert.equal(
    VERIFY.deriveGrant({ ...capturedEvent("pro", "monthly", 19900), payload: { payment: { entity: { ...capturedEvent("pro", "monthly", 19900).payload.payment.entity, currency: "USD" } } } }).reason,
    "currency_mismatch",
  );
  assert.equal(
    VERIFY.deriveGrant({ ...capturedEvent("pro", "monthly", 19900), payload: { payment: { entity: { ...capturedEvent("pro", "monthly", 19900).payload.payment.entity, status: "failed" } } } }).reason,
    "not_captured",
  );
});

test("notes are required — an order with no plan cannot grant anything", () => {
  const event = capturedEvent("pro", "monthly", 19900);
  delete event.payload.payment.entity.notes;
  assert.equal(VERIFY.deriveGrant(event).reason, "missing_notes");
  assert.equal(VERIFY.deriveGrant({ event: "payment.captured" }).reason, "missing_payment");
  assert.equal(VERIFY.deriveGrant({ event: "customer.created" }).reason, "unknown_event");
});

test("unknown plans and non-gym subjects are refused", () => {
  const event = capturedEvent("platinum", "monthly", 19900);
  assert.equal(VERIFY.deriveGrant(event).reason, "unknown_plan");
});

test("gym plans are priced at gym rates and attach to the gym, not the buyer", () => {
  const event = capturedEvent("gym_growth", "monthly", 499_900, { subjectId: GYM, subjectType: "gym" });
  const grant = VERIFY.deriveGrant(event);
  assert.equal(grant.ok, true);
  assert.equal(grant.subjectType, "gym");
  assert.equal(grant.subjectId, GYM);
  const entitlement = VERIFY.entitlementFromGrant(grant);
  assert.equal(entitlement.seats.trainers, 5);
  assert.equal(entitlement.seats.members, 150);
});

test("refunds, failures and disputes revoke rather than delete", () => {
  assert.equal(VERIFY.revocationFor({ event: "refund.processed", payload: { refund: { entity: { payment_id: "pay_1" } } } }).status, "refunded");
  assert.equal(VERIFY.revocationFor({ event: "payment.failed", payload: { payment: { entity: { id: "pay_2" } } } }).status, "failed");
  assert.equal(VERIFY.revocationFor({ event: "payment.disputed", payload: { payment: { entity: { id: "pay_3" } } } }).status, "disputed");
  assert.equal(VERIFY.revocationFor({ event: "payment.captured", payload: { payment: { entity: { id: "pay_4" } } } }), null);
});

test("orders are priced on the server from a plan id, and coupons are server-side too", () => {
  const draft = VERIFY.buildOrderDraft({ plan: "elite", cycle: "annual", subjectId: CLIENT });
  assert.equal(draft.amountMinor, VERIFY.PLAN_CATALOG.elite.amountMinor.annual);
  assert.equal(draft.currency, "INR");
  assert.equal(draft.notes.plan, "elite");
  assert.match(draft.receipt, /^tiger_elite_/);

  assert.equal(VERIFY.applyCoupon(19_900, "LAUNCH20"), 15_920);
  assert.equal(VERIFY.applyCoupon(19_900, "WELCOME50"), 9_950);
  assert.equal(VERIFY.applyCoupon(19_900, "NOT-A-COUPON"), 19_900, "unknown coupons must not change the price");
  assert.equal(VERIFY.applyCoupon(19_900, null), 19_900);
});

test("every catalog price is a positive integer in paise, and free is zero", () => {
  for (const [plan, definition] of Object.entries(VERIFY.PLAN_CATALOG)) {
    for (const cycle of ["monthly", "annual"]) {
      const amount = definition.amountMinor[cycle];
      assert.ok(Number.isInteger(amount) && amount >= 0, `${plan}/${cycle} must be integer paise`);
      if (plan !== "free") assert.ok(amount > 0, `${plan}/${cycle} must cost something`);
    }
  }
});

test("the service account key and provider secrets never appear in the client bundle", () => {
  const files = walkFiles(join(ROOT, "src"), [".ts", ".tsx"]);
  const forbidden = [
    /(RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|RAZORPAY_KEY_ID)\s*[:=]\s*["'][^"']{4,}["']/,
    /serviceAccountKey\s*[:=]\s*["']/,
    /-----BEGIN PRIVATE KEY-----/,
    /AIza[0-9A-Za-z_-]{30,}/,
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${relative(ROOT, file)} contains ${pattern}`);
    }
  }
});

/* ── Google Play billing ────────────────────────────────────────── */

test("an unknown Play product is refused, never defaulted to a plan", () => {
  assert.equal(VERIFY.playProductFor("not_a_product"), null);
  assert.equal(VERIFY.playProductFor(""), null);
  assert.equal(VERIFY.playProductFor(null), null);
  const result = VERIFY.entitlementFromPlay({
    uid: "user_1",
    productId: "free_elite_please",
    purchaseTokenHash: "a".repeat(64),
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unknown_product");
});

test("only Google's ACTIVE subscription state grants", () => {
  assert.equal(VERIFY.isActivePlayState("SUBSCRIPTION_STATE_ACTIVE"), true);
  /* Grace period and on-hold mean Google is still trying to charge the card. */
  assert.equal(VERIFY.isActivePlayState("SUBSCRIPTION_STATE_IN_GRACE_PERIOD"), false);
  assert.equal(VERIFY.isActivePlayState("SUBSCRIPTION_STATE_ON_HOLD"), false);
  assert.equal(VERIFY.isActivePlayState("SUBSCRIPTION_STATE_CANCELED"), false);
  assert.equal(VERIFY.isActivePlayState(null), false);
});

test("a Play subscription carries Google's expiry, and a past expiry is refused", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const ok = VERIFY.entitlementFromPlay(
    { uid: "user_1", productId: "pro_monthly", expiryTime: "2026-02-01T00:00:00.000Z", purchaseTokenHash: "b".repeat(64) },
    now,
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.entitlement.plan, "pro");
  assert.equal(ok.entitlement.source, "play");
  assert.equal(ok.entitlement.subjectType, "user");
  assert.equal(ok.entitlement.expiresAt, "2026-02-01T00:00:00.000Z");

  const stale = VERIFY.entitlementFromPlay(
    { uid: "user_1", productId: "pro_monthly", expiryTime: "2025-12-01T00:00:00.000Z", purchaseTokenHash: "b".repeat(64) },
    now,
  );
  assert.equal(stale.ok, false);
  assert.equal(stale.reason, "expired");
});

test("a missing Play expiry falls back to the catalog duration, not to perpetual", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const result = VERIFY.entitlementFromPlay(
    { uid: "user_1", productId: "elite_annual", expiryTime: null, purchaseTokenHash: "c".repeat(64) },
    now,
  );
  assert.equal(result.ok, true);
  assert.ok(result.entitlement.expiresAt, "a recurring plan must never be issued without an expiry");
  assert.ok(new Date(result.entitlement.expiresAt).getTime() > now.getTime());
});

test("the lifetime product is the only Play purchase that never expires", () => {
  const result = VERIFY.entitlementFromPlay({
    uid: "user_1",
    productId: "elite_lifetime",
    purchaseTokenHash: "d".repeat(64),
  });
  assert.equal(result.ok, true);
  assert.equal(result.entitlement.expiresAt, null);
  assert.equal(result.entitlement.plan, "elite");
});

test("a Play entitlement is keyed to the buyer and the token hash, never the raw token", () => {
  const hash = "e".repeat(64);
  const result = VERIFY.entitlementFromPlay({ uid: "user_9", productId: "pro_annual", purchaseTokenHash: hash });
  assert.equal(result.ok, true);
  assert.equal(result.entitlement.subjectId, "user_9");
  assert.equal(result.entitlement.providerRef, `play:${hash}`);

  assert.equal(VERIFY.entitlementFromPlay({ uid: "", productId: "pro_annual", purchaseTokenHash: hash }).reason, "missing_uid");
  assert.equal(VERIFY.entitlementFromPlay({ uid: "user_9", productId: "pro_annual", purchaseTokenHash: "" }).reason, "missing_token_hash");
});

test("every Play product in the catalog prices to a real, paid plan", () => {
  for (const [productId, definition] of Object.entries(VERIFY.PLAY_PRODUCT_CATALOG)) {
    assert.equal(definition.productId, productId, "catalog key and productId must agree");
    const plan = VERIFY.PLAN_CATALOG[definition.plan];
    assert.ok(plan, `${productId} maps to an unknown plan ${definition.plan}`);
    assert.ok(
      plan.amountMinor[definition.cycle] > 0,
      `${productId} maps to ${definition.plan}/${definition.cycle}, which has no price — that is a free grant`,
    );
  }
});

test("the Play verification callable cannot be reached without authentication", () => {
  const backend = readFileSync(join(ROOT, "functions/src/index.ts"), "utf8");
  const start = backend.indexOf("export const verifyPlayPurchase");
  assert.ok(start > 0, "verifyPlayPurchase must exist");
  const body = backend.slice(start, backend.indexOf("export const", start + 10));
  assert.match(body, /requireAuth\(request\)/, "verifyPlayPurchase must require a signed-in caller");
  assert.match(body, /createHash\("sha256"\)/, "the raw purchase token must never be stored");
  assert.match(body, /paymentVerifications/, "verification must be recorded for idempotency");
  assert.match(body, /permission-denied/, "a token replayed across accounts must be refused");
  /* The token may be passed to Google; it must never land in a written document. */
  for (const write of body.match(/batch\.set\([\s\S]*?\n  \);/g) ?? []) {
    assert.doesNotMatch(write, /\bpurchaseToken\b(?!Hash)/, "a Firestore write includes the raw purchase token");
  }
});

/* ═══════════════════════════════════════════════════════════════════
   5–6. RULES INVARIANTS & REGISTRY AGREEMENT
   ═══════════════════════════════════════════════════════════════════ */

group("5. Firestore rules invariants");

const firestoreRules = readFileSync(join(ROOT, "firestore.rules"), "utf8");
const storageRules = readFileSync(join(ROOT, "storage.rules"), "utf8");

/**
 * Split `match /path/{id} { … }` blocks by brace depth rather than by
 * indentation, so reformatting the rules cannot silently disable this test.
 */
function matchBlocks(source) {
  const blocks = new Map();
  let depth = 0;
  let current = null;
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    const start = /^match \/([A-Za-z0-9_]+)\//.exec(line);
    if (start) {
      current = { path: start[1], openDepth: depth + 1, lines: [] };
      if (!blocks.has(start[1])) blocks.set(start[1], current.lines);
      else blocks.set(start[1], blocks.get(start[1]));
    } else if (current) {
      if (line === "}" && depth === current.openDepth) current = null;
      else current.lines.push(raw);
    }
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    depth += opens - closes;
  }
  return blocks;
}

const firestoreBlocks = matchBlocks(firestoreRules);
const storageBlocks = matchBlocks(storageRules);

/** Marketing/legacy collections that legitimately sit outside the registry. */
const LEGACY_COLLECTIONS = new Set(["blogs", "subscribers"]);

test("no rule grants unconditional read or write", () => {
  for (const [path, lines] of firestoreBlocks) {
    const body = lines.join("\n");
    assert.doesNotMatch(body, /allow\s+[^:;]*write[^:;]*:\s*if\s+true/, `${path} must never allow an unconditional write`);
    assert.doesNotMatch(body, /allow\s+read\s*,\s*write\s*:\s*if\s+true/, `${path} must never allow unconditional read+write`);
  }
  assert.doesNotMatch(storageRules, /allow\s+write\s*:\s*if\s+true/, "storage rules must never allow an unconditional write");
});

test("every registered collection has a matching rule block", () => {
  for (const key of C.COLLECTION_KEYS) {
    assert.ok(firestoreBlocks.has(key), `firestore.rules is missing a match block for ${key}`);
  }
});

test("every rule block is either registered or explicitly legacy", () => {
  for (const path of firestoreBlocks.keys()) {
    if (path === "databases") continue;
    assert.ok(
      C.COLLECTION_KEYS.includes(path) || LEGACY_COLLECTIONS.has(path),
      `${path} is protected by rules but missing from the collection registry`,
    );
  }
});

test("commercial collections are write-denied for every browser session", () => {
  assert.ok(C.BACKEND_ONLY_COLLECTIONS.includes("entitlements"), "entitlements must be backend-only");
  assert.ok(C.BACKEND_ONLY_COLLECTIONS.includes("payments"), "payments must be backend-only");
  assert.ok(C.BACKEND_ONLY_COLLECTIONS.includes("auditLog"), "the audit log must be backend-only");
  for (const key of C.BACKEND_ONLY_COLLECTIONS) {
    const body = (firestoreBlocks.get(key) ?? []).join("\n");
    assert.match(body, /allow\s+write\s*:\s*if\s+false/, `${key} must be write-denied to browsers`);
    assert.doesNotMatch(body, /allow\s+(create|update|delete)\s*:/, `${key} must have no browser-writable rule`);
  }
});

test("platform collections are writable only by a claim-verified admin", () => {
  for (const key of C.PLATFORM_COLLECTIONS) {
    const body = (firestoreBlocks.get(key) ?? []).join("\n");
    assert.match(body, /isSuperAdmin\(\)/, `${key} must gate writes on the super_admin claim`);
    assert.doesNotMatch(body, /allow\s+write\s*:\s*if\s+true/, `${key} must never be openly writable`);
  }
});

test("every client-writable collection actually has a write rule", () => {
  for (const key of C.CLIENT_WRITABLE_COLLECTIONS) {
    const body = (firestoreBlocks.get(key) ?? []).join("\n");
    assert.match(body, /allow\s+(write|create|update)\b/, `${key} is registered as client-writable but grants no write`);
  }
});

test("relationship authority requires an ACTIVE row in the SAME gym", () => {
  const helper = firestoreRules.slice(firestoreRules.indexOf("function isTrainerOf"), firestoreRules.indexOf("function writesOwnGym"));
  assert.match(helper, /\.data\.status\s*==\s*'active'/, "inactive relationships must not authorise");
  assert.match(helper, /\.data\.gymId\s*==\s*gymId/, "the relationship must be in the same gym");
  assert.match(helper, /\.data\.trainerId\s*==\s*request\.auth\.uid/, "the relationship must name the caller as trainer");
  assert.match(helper, /\.data\.clientId\s*==\s*clientId/, "the relationship must name the subject client");
  assert.match(helper, /claimGym\(\)\s*==\s*gymId/, "the caller's claim must match the gym");
});

test("authorisation reads custom claims, never client-written fields", () => {
  assert.match(firestoreRules, /request\.auth\.token\.role/, "role must come from the token");
  assert.match(firestoreRules, /token\.get\('gymId'/, "gymId must come from the token");
  assert.doesNotMatch(firestoreRules, /(?<!request\.)resource\.data\.role\s*==/, "never trust the stored role field");

});

test("protected user fields cannot move from the browser", () => {
  const users = (firestoreBlocks.get("users") ?? []).join("\n");
  for (const field of C.PROTECTED_USER_FIELDS) {
    assert.ok(users.includes(field), `users rule must pin ${field}`);
  }
  assert.match(users, /noCommercialFields\(\)/);
});

test("notes of kind trainer_only are hidden by rule, not by the UI", () => {
  const notes = (firestoreBlocks.get("clientNotes") ?? []).join("\n");
  assert.match(notes, /visibility\s*==\s*'shared'/, "a client may only read shared notes");
});

test("tenant documents carry an immutable gym id", () => {
  const helper = firestoreRules.slice(firestoreRules.indexOf("function keepsOwnerIds"), firestoreRules.indexOf("function noCommercialFields"));
  assert.match(helper, /gymId/, "owner ids are pinned on update");
});

test("the default is deny — anything not matched above is unreachable", () => {
  assert.match(firestoreRules, /Any collection not named above is denied by omission|default deny/i);
  assert.doesNotMatch(firestoreRules, /match\s+\/\{[A-Za-z]+\}\/\{[A-Za-z]+\}\s*\{\s*allow/, "no catch-all allow block");
});

test("subscribers may only be created with a well-formed email payload", () => {
  const subscribers = (firestoreBlocks.get("subscribers") ?? []).join("\n");
  assert.match(subscribers, /hasOnly\(/, "the payload must be limited to known keys");
  assert.match(subscribers, /matches\(/, "the email must be shape-checked");
});

test("storage rules split private, health and avatar data with their own gates", () => {
  assert.ok(storageBlocks.has("private"), "private/ must have a rule block");
  assert.ok(storageBlocks.has("health"), "health/ must have a rule block");
  const privateBlock = (storageBlocks.get("private") ?? []).join("\n");
  assert.match(privateBlock, /(request\.auth\.uid\s*==\s*userId|isSelf\(userId\))/, "private files are owner-only");
  const healthBlock = (storageBlocks.get("health") ?? []).join("\n");
  assert.match(storageRules, /firestore\.(get|exists)/, "storage access must consult Firestore for the relationship");
  assert.match(healthBlock, /isActiveTrainerOf\(userId, gymOf\(userId\)\)/, "only an active trainer of THAT member may read health files");
  assert.doesNotMatch(healthBlock, /isGymOwnerOf\(claimGym\(\)\)/, "an owner's read must be anchored to the member's gym, not their own claim");
  assert.match(storageRules.slice(storageRules.indexOf("function isActiveTrainerOf"), storageRules.indexOf("function isImageWithin")), /status\s*==\s*'active'/, "an inactive relationship must not read health files");
  const avatars = (storageBlocks.get("avatars") ?? []).join("\n");
  assert.match(avatars, /isImageWithin\(/, "avatars must be validated as images");
  assert.match(storageRules.slice(storageRules.indexOf("function isImageWithin"), storageRules.indexOf("function isDocWithin")), /contentType\.matches\('image\/\.\*'\)/, "avatar content types must be images");
  assert.match(storageRules.slice(storageRules.indexOf("function isImageWithin"), storageRules.indexOf("function isDocWithin")), /request\.resource\.size\s*</, "avatar uploads must be size-limited");
});

/* ═══════════════════════════════════════════════════════════════════
   7. INDEXES
   ═══════════════════════════════════════════════════════════════════ */

group("7. Composite indexes");

test("firestore.indexes.json covers every query in the registry", () => {
  const declared = JSON.parse(readFileSync(join(ROOT, "firestore.indexes.json"), "utf8"));
  const actual = new Set(
    (declared.indexes ?? []).map(
      (index) => `${index.collectionGroup}|${index.fields.map((field) => field.fieldPath).join(",")}`,
    ),
  );
  const required = C.requiredIndexes();
  assert.ok(required.length >= 12, `expected a real index list, found ${required.length}`);
  for (const index of required) {
    const key = `${index.collectionGroup}|${index.fields.join(",")}`;
    assert.ok(actual.has(key), `firestore.indexes.json is missing ${key}`);
  }
  assert.match(JSON.stringify(declared), /FIELD_INDEX_MODE|Ascending|DESCENDING|ASCENDING/);
});

/* ═══════════════════════════════════════════════════════════════════
   8. DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════ */

group("8. Design tokens");

test("ui/tokens.ts mirrors the values declared in index.css", () => {
  const css = readFileSync(join(ROOT, "src/index.css"), "utf8");
  for (const { cssVar, value } of TOKENS.CSS_SYNCED_TOKENS) {
    const declaration = new RegExp(`${cssVar}\\s*:\\s*([^;]+);`).exec(css);
    assert.ok(declaration, `${cssVar} is not declared in index.css`);
    assert.equal(declaration[1].trim().toLowerCase(), value.toLowerCase(), `${cssVar} drifted from ui/tokens.ts`);
  }
});

test("semantic colours exist for every risk level and payment state", () => {
  for (const level of ["on_track", "watch", "at_risk", "dormant"]) {
    assert.ok(TOKENS.RISK_COLORS[level], `missing colour for risk level ${level}`);
  }
  for (const status of ["created", "pending", "captured", "failed", "refunded", "disputed", "revoked"]) {
    assert.ok(TOKENS.PAYMENT_STATUS_COLORS[status], `missing colour for payment status ${status}`);
  }
  for (const status of ["pending", "active", "cancelled", "expired", "refunded", "revoked"]) {
    assert.ok(TOKENS.ENTITLEMENT_STATUS_COLORS[status], `missing colour for entitlement status ${status}`);
  }
});

/* ═══════════════════════════════════════════════════════════════════
   9. VALIDATION, ANALYTICS AND HYGIENE
   ═══════════════════════════════════════════════════════════════════ */

group("9. Validation & hygiene");

test("a session may only be logged for its own subject in its own gym", () => {
  const sets = [{ exerciseId: "ex", name: "Squat", setIndex: 0, reps: 5, loadKg: 100, completed: true }];
  assert.equal(V.validateSessionLog({ gymId: GYM, clientId: CLIENT, sets }, { gymId: GYM, clientId: CLIENT }).ok, true);
  assert.equal(V.validateSessionLog({ gymId: OTHER_GYM, clientId: CLIENT, sets }, { gymId: GYM, clientId: CLIENT }).ok, false);
  assert.equal(V.validateSessionLog({ gymId: GYM, clientId: OTHER_CLIENT, sets }, { gymId: GYM, clientId: CLIENT }).ok, false);
  assert.equal(V.validateSessionLog({ gymId: GYM, clientId: CLIENT, sets: [] }, { gymId: GYM, clientId: CLIENT }).ok, false);
});

test("volume is computed, never taken from the client", () => {
  assert.equal(
    V.sessionVolumeKg([
      { exerciseId: "a", name: "Bench", setIndex: 0, reps: 10, loadKg: 50, completed: true },
      { exerciseId: "a", name: "Bench", setIndex: 1, reps: 8, loadKg: 60, completed: false },
    ]),
    500,
    "only completed sets count",
  );
});

test("tenant shape validation refuses a mismatched or missing gym", () => {
  assert.equal(V.validateTenantShape({ gymId: GYM }, GYM).ok, true);
  assert.equal(V.validateTenantShape({ gymId: OTHER_GYM }, GYM).ok, false);
  assert.equal(V.validateTenantShape({ gymId: GYM }, null).ok, false, "a caller without a gym claim cannot write tenant data");
  assert.ok(V.validateTenantShape({ gymId: "gym_x" }, null).issues.length >= 1, "a claim-less caller is refused");
});

test("a plan is refused when its dates or prescriptions are impossible", () => {
  const base = {
    gymId: GYM, trainerId: TRAINER, clientId: CLIENT, name: "Block", status: "active", startDate: "2026-09-01",
    days: [{ dayIndex: 0, label: "Push", focus: "Chest", blocks: [{ exerciseId: "ex", name: "Bench", sets: 4, reps: "8", restSec: 90 }] }],
  };
  assert.equal(V.validateWorkoutPlan(base, GYM).ok, true);
  assert.equal(V.validateWorkoutPlan({ ...base, endDate: "2026-08-01" }, GYM).ok, false, "end before start");
  assert.equal(V.validateWorkoutPlan({ ...base, days: [] }, GYM).ok, false, "an empty plan is not a plan");
  assert.equal(V.validateWorkoutPlan({ ...base, status: "published" }, GYM).ok, false, "unknown status");
  assert.equal(
    V.validateWorkoutPlan({ ...base, days: [{ dayIndex: 0, label: "Push", focus: "Chest", blocks: [{ exerciseId: "ex", name: "Bench", sets: 0, reps: "8", restSec: 90 }] }] }, GYM).ok,
    false,
    "zero sets is not a prescription",
  );
});

test("a client cannot mark an appointment complete, but may cancel or move it", () => {
  const appointment = { clientId: CLIENT, trainerId: TRAINER, gymId: GYM, status: "confirmed", startsAt: "2026-09-20T06:00:00.000Z" };
  const who = { uid: CLIENT, role: "client", gymId: GYM };
  assert.equal(V.validateAppointmentClientWrite(appointment, { status: "cancelled" }, who).ok, true);
  assert.equal(V.validateAppointmentClientWrite(appointment, { status: "rescheduled", startsAt: "2026-09-21T06:00:00.000Z" }, who).ok, true);
  assert.equal(V.validateAppointmentClientWrite(appointment, { status: "completed" }, who).ok, false, "attendance is the trainer's record");
  assert.equal(V.validateAppointmentClientWrite(appointment, { status: "no_show" }, who).ok, false);
  assert.equal(V.validateAppointmentClientWrite(appointment, { trainerId: OTHER_TRAINER }, who).ok, false, "no self-reassignment");
  assert.equal(
    V.validateAppointmentClientWrite(appointment, { status: "cancelled" }, { uid: OTHER_CLIENT, role: "client", gymId: GYM }).ok,
    false,
    "not your appointment",
  );
});

test("booking slots are derived from the trainer's real availability", () => {
  const availability = [
    { id: "a", gymId: GYM, trainerId: TRAINER, weekday: 1, startTime: "06:00", endTime: "08:00", slotMinutes: 60, active: true, createdAt: "", updatedAt: "" },
    { id: "b", gymId: GYM, trainerId: TRAINER, weekday: 1, startTime: "18:00", endTime: "19:00", slotMinutes: 30, active: false, createdAt: "", updatedAt: "" },
  ];
  const monday = "2026-09-21"; // a Monday
  assert.deepEqual(V.slotsForDay(availability, monday), ["06:00", "07:00"]);
  assert.deepEqual(V.slotsForDay(availability, "2026-09-22"), [], "no availability that day means no slots, not invented ones");
  assert.equal(V.validateAvailability({ gymId: GYM, trainerId: TRAINER, weekday: 1, startTime: "18:00", endTime: "17:00", slotMinutes: 60 }, GYM).ok, false);
  assert.equal(V.validateAvailability({ gymId: GYM, trainerId: TRAINER, weekday: 1, startTime: "06:00", endTime: "07:00", slotMinutes: 17 }, GYM).ok, false);
});

test("a trainer cannot be their own client", () => {
  assert.equal(V.validateTrainerClient({ gymId: GYM, trainerId: TRAINER, clientId: TRAINER, status: "active" }).ok, false);
  assert.equal(V.validateTrainerClient({ gymId: GYM, trainerId: TRAINER, clientId: CLIENT, status: "active" }).ok, true);
  assert.equal(
    V.validateTrainerClient({ id: "wrong_id", gymId: GYM, trainerId: TRAINER, clientId: CLIENT, status: "active" }).ok,
    false,
    "the document id encodes the relationship",
  );
});

test("a self-signup cannot claim a role, a gym or a plan", () => {
  assert.equal(V.validateProfilePatch({ role: "gym_owner" }).ok, false);
  assert.equal(V.validateProfilePatch({ gymId: GYM }).ok, false);
  assert.equal(V.validateProfilePatch({ subscription: "active" }).ok, false);
  assert.equal(V.validateMembership({ gymId: GYM, userId: CLIENT, role: "super_admin", status: "active" }).ok, false);
  assert.equal(V.validateMembership({ gymId: GYM, userId: CLIENT, role: "client", status: "active", id: `${GYM}_${CLIENT}` }).ok, true);
});

test("no frontend admin password, simulated payment or authority in localStorage", () => {
  const files = walkFiles(join(ROOT, "src"), [".ts", ".tsx"]);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const label = relative(ROOT, file);
    assert.doesNotMatch(source, /VITE_ADMIN_PASSWORD/, `${label} still references the bundled admin password`);
    assert.doesNotMatch(source, /simulatePayment|fakePayment|mockPayment/, `${label} simulates a payment`);
    assert.doesNotMatch(
      source,
      /localStorage\.(setItem|getItem)\(\s*["'`][^"'`]*(role|gymId|plan|entitle|subscription|payment|claim|admin|session)/i,
      `${label} stores authority in localStorage`,
    );
  }
  const envExample = readFileSync(join(ROOT, ".env.example"), "utf8");
  assert.doesNotMatch(envExample, /VITE_ADMIN_PASSWORD/, ".env.example still offers a frontend admin password");
});

test("no screen calls an unrouted /api/* path", () => {
  /* REGRESSION: five screens POSTed to `/api/billing/*` and
     `/api/admin/assign-role`. Neither firebase.json nor vercel.json routes
     `/api/**` — both rewrite `**` to `/index.html`, so those fetches got the
     SPA shell back with HTTP 200. Checkout treated `response.ok` as proof a
     Play purchase was verified, and AdminConsole reported "Role updated" for a
     role change that never happened. The trusted backend is reached through
     callables; a callable throws rather than silently succeeding. */
  const hosting = JSON.parse(readFileSync(join(ROOT, "firebase.json"), "utf8"));
  const rewrites = (hosting.hosting ?? []).flatMap((site) => site.rewrites ?? []);
  const routesApi = rewrites.some((rule) => String(rule.source ?? "").startsWith("/api"));

  for (const file of walkFiles(join(ROOT, "src"), [".ts", ".tsx"])) {
    /* Strip comments first: the files that carried this bug now *document*
       it, and a regex that cannot tell code from prose would flag the fix. */
    const code = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    const label = relative(ROOT, file);
    const calls = code.match(/fetch\(\s*["'`]\/api\//g) ?? [];
    if (calls.length && !routesApi) {
      assert.fail(`${label} fetches /api/* but no hosting rewrite routes it — it receives index.html with HTTP 200`);
    }
  }
});

test("the client can actually reach the trusted backend", () => {
  /* The callable backend existed but nothing imported firebase/functions, so
     every privileged operation was unreachable from the running app. */
  const firebaseModule = readFileSync(join(ROOT, "src/firebase.ts"), "utf8");
  assert.match(firebaseModule, /from "firebase\/functions"/, "src/firebase.ts must expose the callable client");
  assert.match(firebaseModule, /FUNCTIONS_REGION/, "the callable region must be explicit, not defaulted");

  const client = readFileSync(join(ROOT, "src/services/backend.ts"), "utf8");
  const backend = readFileSync(join(ROOT, "functions/src/index.ts"), "utf8");
  const named = [...client.matchAll(/call<[^>]*>\(\s*"([A-Za-z0-9_]+)"/g)].map((m) => m[1]);
  assert.ok(named.length >= 5, "expected the client to wrap at least five callables");
  for (const name of named) {
    assert.match(backend, new RegExp(`export const ${name}\\b`), `functions/src/index.ts does not export ${name}`);
  }
  for (const callable of ["createCheckout", "verifyPlayPurchase", "adminAssignRole"]) {
    assert.ok(named.includes(callable), `backend.ts must wrap the ${callable} callable`);
  }
});

test("every upgrade button goes through the one shared checkout path", () => {
  /* Four screens each had their own copy of "start a checkout", and each was
     wrong in the same way. One implementation is the fix. */
  const screens = [
    "src/app/Checkout.tsx",
    "src/saas/Pricing.tsx",
    "src/saas/ClientBilling.tsx",
    "src/saas/GymBilling.tsx",
  ];
  for (const screen of screens) {
    const source = readFileSync(join(ROOT, screen), "utf8");
    assert.match(source, /startProviderCheckout/, `${screen} must use the shared provider checkout`);
    assert.doesNotMatch(source, /checkoutUrl/, `${screen} still expects the removed checkoutUrl response`);
  }
  /* The shared path may *mention* entitlements in its rationale; what it must
     not do is write one. It has no database handle at all, which is the
     strongest form of that guarantee. */
  const shared = readFileSync(join(ROOT, "src/services/providerCheckout.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  assert.doesNotMatch(shared, /firebase\/firestore|setDoc|updateDoc|requireDb/, "the checkout path must not touch the database");
  assert.doesNotMatch(shared, /setPlan|grantEntitlement|\bplan\s*=/, "the checkout path must not assign a plan");
});

test("paid content is gated on the backend entitlement, not a browser ledger", () => {
  /* REGRESSION: PDFStore kept its own `localStorage` list of "purchased" guide
     ids that it both wrote and trusted, so editing one devtools key granted
     the whole catalog. It now reads the same entitlement as the rest of the
     app — a record only the payment webhook writes. */
  const store = readFileSync(join(ROOT, "src/app/PDFStore.tsx"), "utf8");
  const code = store.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  assert.doesNotMatch(code, /localStorage/, "PDFStore must not keep its own purchase ledger");
  assert.doesNotMatch(code, /markPurchased|loadPurchased/, "the self-written purchase ledger must be gone");
  assert.match(code, /useEntitlement/, "PDFStore must read the backend entitlement");
  assert.match(code, /entitlementIsLive/, "an expired entitlement must not unlock the library");

  /* Every download path must be behind the gate, not just the buttons. */
  const downloads = [...code.matchAll(/function downloadGuide\([\s\S]*?\n  \}/g)].map((m) => m[0]);
  assert.ok(downloads.length >= 2, "expected both store surfaces to define a download path");
  for (const body of downloads) {
    assert.match(body, /if \(!unlocked\)/, "a download path bypasses the entitlement gate");
  }

  /* And the plans it honours must be plans the catalog actually prices. */
  const plans = code.match(/const LIBRARY_PLANS = new Set\(\[([^\]]*)\]\)/);
  assert.ok(plans, "LIBRARY_PLANS must be declared");
  for (const quoted of plans[1].match(/"[a-z_]+"/g) ?? []) {
    const plan = quoted.slice(1, -1);
    assert.ok(VERIFY.PLAN_CATALOG[plan], `LIBRARY_PLANS names ${plan}, which is not in the plan catalog`);
    assert.notEqual(plan, "free", "the free plan must not unlock paid content");
  }
});

test("no screen advertises a price the backend cannot charge", () => {
  /* The guide cards showed "₹299 / Buy Now" for items with no SKU in
     PLAN_CATALOG, so `createCheckout` could never have priced one. */
  const store = readFileSync(join(ROOT, "src/app/PDFStore.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  assert.doesNotMatch(store, /₹\{guide\.price\}/, "a per-guide price is displayed but cannot be charged");
  assert.doesNotMatch(store, /₹\{bundle\.price\}/, "a bundle price is displayed but cannot be charged");
  assert.doesNotMatch(store, /Buy Now|Buy Bundle/, "a buy action is offered for something that is not sold");
});

test("every tool the hub routes exists, and every tool file is routed", () => {
  /* 22 components were salvaged from an abandoned branch. A component with no
     route is dead weight the build still pays for, so the index and the files
     must agree in both directions. */
  const hub = readFileSync(join(ROOT, "src/app/ToolsGrid.tsx"), "utf8");
  const routed = [...hub.matchAll(/import\("\.\/([A-Za-z0-9_]+)"\)/g)].map((m) => m[1]);
  assert.equal(routed.length, 22, `expected 22 routed tools, found ${routed.length}`);
  assert.equal(new Set(routed).size, routed.length, "a tool is routed twice");

  for (const name of routed) {
    const file = join(ROOT, "src/app", `${name}.tsx`);
    assert.ok(existsFile(file), `ToolsGrid routes ${name}, which does not exist`);
    assert.match(readFileSync(file, "utf8"), /export default/, `${name} has no default export to lazy-load`);
  }

  /* Every tool is lazy, so opening the hub does not pull 22 chunks. */
  assert.doesNotMatch(
    hub.replace(/import\("\.\/[A-Za-z0-9_]+"\)/g, ""),
    /^import .* from "\.\/(BodyFat|Rpe|Dots|Pace|Vo2|Glossary|Flashcards)/m,
    "a tool is statically imported, defeating the code-splitting",
  );

  /* And the hub is reachable: a route nobody can navigate to is the same bug
     one level up. */
  const workspace = readFileSync(join(ROOT, "src/saas/ClientWorkspace.tsx"), "utf8");
  assert.match(workspace, /import ToolsGrid from "\.\.\/app\/ToolsGrid"/, "the workspace must import the hub");
  assert.match(workspace, /case "tools":/, "the workspace must render the tools section");
  assert.match(workspace, /\{ id: "tools", label: "Tools" \}/, "the tools section must have a nav entry");
});

test("the demo source is labelled and refuses nothing it should allow", async () => {
  assert.equal(D.isLive(), false, "unit tests must never run against a live project");
  const source = new D.DemoSource(SEED.buildDemoSeed());
  assert.equal(source.kind, "demo", "in-memory data must announce itself as demo");
  const rows = await source.list("payments");
  assert.ok(Array.isArray(rows));
  source.reset?.();
});

/* ═══════════════════════════════════════════════════════════════════
   10. EVERY ROLE'S READ PATH IS WIRED (what the demo workspace renders)
   ═══════════════════════════════════════════════════════════════════ */

group("10. Workspace read paths");

await testAsync("the demo tenant populates every workspace with joined data", async () => {
  const source = new D.DemoSource(SEED.buildDemoSeed());
  const owner = new R.TenantClient({ uid: "demo_owner", role: "gym_owner", gymId: GYM, gymIds: [GYM] }, source, claimsFor("gym_owner"));
  const trainerSession = new R.TenantClient({ uid: TRAINER, role: "trainer", gymId: GYM, gymIds: [GYM] }, source, claimsFor("trainer"));
  const memberSession = new R.TenantClient({ uid: CLIENT, role: "client", gymId: GYM, gymIds: [GYM] }, source, claimsFor("client"));

  const overview = await owner.loadGymOverview();
  assert.ok(overview.activeMembers > 0, "an owner must see their member count");
  assert.ok(overview.activeTrainers > 0, "…and their trainer count");
  assert.ok(overview.seatLimit, "…and the seat limit the entitlement grants");
  assert.ok(typeof overview.averageAdherence === "number", "adherence is derived from logged sessions");

  const roster = await trainerSession.loadRoster();
  assert.ok(roster.length > 0, "a trainer must get a roster");
  assert.equal(roster[0].rank, 1, "the roster is ranked by who needs attention");
  assert.ok(roster[0].profile?.name, "…with the client's name joined in");

  const home = await memberSession.loadClientHome();
  assert.ok(home, "a member must get a home payload");
  assert.ok(home.plan || home.assignment, "…carrying their assigned programme");
  assert.ok(Array.isArray(home.sessions), "…and their session history");
  assert.ok(home.nextSessionDay, "…and the next day of the programme to train");

  const entitlements = await new R.TenantClient({ uid: "demo_admin", role: "super_admin", gymId: null, gymIds: [] }, source, claimsFor("super_admin", null)).listAllEntitlements();
  assert.ok(entitlements.length > 0, "a platform admin must see entitlements");
});

await testAsync("an empty tenant reports nulls, never invented metrics", async () => {
  const empty = new D.DemoSource({});
  const owner = new R.TenantClient({ uid: "fresh_owner", role: "gym_owner", gymId: "gym_empty", gymIds: ["gym_empty"] }, empty, claimsFor("gym_owner", "gym_empty"));
  const overview = await owner.loadGymOverview();
  for (const metric of ["activeMembers", "activeTrainers", "averageAdherence", "volumeLast7Kg", "revenueLast30Minor", "atRiskMembers"]) {
    assert.equal(overview[metric], null, `${metric} must be null — not 0 — when nothing has been recorded`);
  }
  const roster = await owner.loadRoster();
  assert.deepEqual(roster, [], "an empty gym has an empty roster, not a placeholder row");
  const plans = await owner.listPlans();
  assert.deepEqual(plans, []);
});

await testAsync("a member with no entitlement is not silently upgraded", async () => {
  const source = new D.DemoSource(SEED.buildDemoSeed());
  const member = new R.TenantClient({ uid: "demo_client_20", role: "client", gymId: GYM, gymIds: [GYM] }, source, claimsFor("client"));
  const entitlement = await member.getEntitlement("demo_client_20");
  assert.ok(entitlement === null || entitlement.plan === "free" || entitlement.status !== "active", "a free member must not read as paid");
});

/* ═══════════════════════════════════════════════════════════════════
   11. FIREBASE CONFIGURATION RESOLUTION
   ═══════════════════════════════════════════════════════════════════ */

group("11. Firebase configuration");

/* A key whose name a reader may recognise from the Firebase console is not a
   secret. The ONLY thing that makes this project safe is the rules; these
   tests exist to prove that a missing or malformed value fails loudly
   instead of silently degrading to the demo workspace. */

const COMPLETE_ENV = {
  VITE_FIREBASE_API_KEY: "AIzaSyDFtXvgaVv5vDKlrtEluuAopXjUtRgTuqE",
  VITE_FIREBASE_AUTH_DOMAIN: "tiger-fitness-pro-2f047.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "tiger-fitness-pro-2f047",
  VITE_FIREBASE_STORAGE_BUCKET: "tiger-fitness-pro-2f047.firebasestorage.app",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "1018363378380",
  VITE_FIREBASE_APP_ID: "1:1018363378380:web:0d25be6fb035948a9de069",
  VITE_FIREBASE_MEASUREMENT_ID: "G-N0ZPLT3JXY",
};

test("a complete environment resolves to a live configuration", () => {
  const resolved = FIREBASE.resolveFirebaseConfig(COMPLETE_ENV);
  assert.equal(resolved.configured, true);
  assert.deepEqual(resolved.missing, []);
  assert.equal(resolved.analytics, true);
  assert.equal(resolved.config.projectId, "tiger-fitness-pro-2f047");
  assert.equal(resolved.config.storageBucket, "tiger-fitness-pro-2f047.firebasestorage.app");
});

test("measurementId is optional — Firebase documents it as such for v7.20+", () => {
  const withoutAnalytics = { ...COMPLETE_ENV };
  delete withoutAnalytics.VITE_FIREBASE_MEASUREMENT_ID;
  const resolved = FIREBASE.resolveFirebaseConfig(withoutAnalytics);
  assert.equal(resolved.configured, true, "analytics must not be able to disable the whole app");
  assert.equal(resolved.analytics, false);
  assert.equal(resolved.config.measurementId, undefined, "analytics must be skipped, not stubbed");
});

test("every required field is required, and named when absent", () => {
  assert.deepEqual([...FIREBASE.REQUIRED_FIREBASE_FIELDS].sort(), [
    "apiKey", "appId", "authDomain", "messagingSenderId", "projectId", "storageBucket",
  ]);
  for (const field of FIREBASE.REQUIRED_FIREBASE_FIELDS) {
    const broken = { ...COMPLETE_ENV };
    delete broken[FIREBASE.ENV_KEYS[field]];
    const resolved = FIREBASE.resolveFirebaseConfig(broken);
    assert.equal(resolved.configured, false, `removing ${field} must stop live mode`);
    assert.deepEqual(resolved.missing, [field], `${field} must be named as the missing key`);
  }
  assert.equal(FIREBASE.resolveFirebaseConfig({}).configured, false, "an empty environment is not configured");
  assert.equal(FIREBASE.resolveFirebaseConfig({}).missing.length, 6);
});

test("a whitespace-only value counts as missing", () => {
  const resolved = FIREBASE.resolveFirebaseConfig({ ...COMPLETE_ENV, VITE_FIREBASE_API_KEY: "   " });
  assert.equal(resolved.configured, false);
  assert.deepEqual(resolved.missing, ["apiKey"]);
});

test("a missing storage bucket stops live mode instead of guessing one", () => {
  /* Two bucket names exist and only the console knows which is right, so a
     guess would fail later as an opaque storage error. Refuse instead. */
  const withoutBucket = { ...COMPLETE_ENV };
  delete withoutBucket.VITE_FIREBASE_STORAGE_BUCKET;
  const resolved = FIREBASE.resolveFirebaseConfig(withoutBucket);
  assert.equal(resolved.configured, false);
  assert.deepEqual(resolved.missing, ["storageBucket"]);
  assert.equal(resolved.config.storageBucket, "", "the resolver must not invent a bucket");

  assert.equal(FIREBASE.suggestStorageBucket("proj-1"), "proj-1.firebasestorage.app");
  assert.equal(FIREBASE.suggestStorageBucket("proj-1", "appspot"), "proj-1.appspot.com");
  assert.equal(FIREBASE.suggestStorageBucket(""), "", "no project, no suggestion");
});

test("cross-field mismatches are caught, not just missing values", () => {
  /* The resolver answers "is it complete?". `inspectFirebaseConfig` answers
     "does it make sense?" — the same function `npm run check:firebase` runs,
     so the doctor and this suite can never disagree. */
  const clean = FIREBASE.inspectFirebaseConfig(COMPLETE_ENV);
  assert.equal(clean.resolved.configured, true);
  assert.deepEqual(clean.issues, [], "the shipped configuration must be clean");

  const foreignBucket = FIREBASE.inspectFirebaseConfig({ ...COMPLETE_ENV, VITE_FIREBASE_STORAGE_BUCKET: "someone-elses.appspot.com" });
  assert.ok(
    foreignBucket.issues.some((issue) => issue.field === "storageBucket" && issue.level === "bad"),
    "a bucket belonging to another project is a hard error",
  );

  const swappedSender = FIREBASE.inspectFirebaseConfig({ ...COMPLETE_ENV, VITE_FIREBASE_MESSAGING_SENDER_ID: "999999999999" });
  assert.ok(
    swappedSender.issues.some((issue) => issue.field === "appId" && issue.level === "bad"),
    "an app id from a different project is a hard error",
  );

  const truncatedKey = FIREBASE.inspectFirebaseConfig({ ...COMPLETE_ENV, VITE_FIREBASE_API_KEY: "AIzaShort" });
  assert.ok(truncatedKey.issues.some((issue) => issue.field === "apiKey"), "a truncated key is flagged");

  const customDomain = FIREBASE.inspectFirebaseConfig({ ...COMPLETE_ENV, VITE_FIREBASE_AUTH_DOMAIN: "app.tigerfitpro.in" });
  assert.ok(
    customDomain.issues.some((issue) => issue.field === "authDomain" && issue.level === "warn"),
    "a custom auth domain warns rather than fails",
  );

  const badAnalytics = FIREBASE.inspectFirebaseConfig({ ...COMPLETE_ENV, VITE_FIREBASE_MEASUREMENT_ID: "not-a-stream" });
  assert.ok(badAnalytics.issues.some((issue) => issue.field === "measurementId"), "a malformed stream id is flagged");
});

test("the configuration check names the project when live, and the gaps when not", () => {
  assert.match(FIREBASE.describeFirebaseConfig(COMPLETE_ENV), /live project tiger-fitness-pro-2f047/);
  const demo = FIREBASE.describeFirebaseConfig({ VITE_FIREBASE_PROJECT_ID: "p" });
  assert.match(demo, /demo workspace/);
  assert.match(demo, /VITE_FIREBASE_API_KEY/, "the operator is told exactly which value to set");
});

test("the operator checklist on the sign-in screen names a real command per step", () => {
  assert.ok(FIREBASE.LIVE_SETUP_STEPS.length >= 3, "a live project needs at least three steps to become usable");
  for (const step of FIREBASE.LIVE_SETUP_STEPS) {
    assert.ok(step.title && step.body && step.command, `step "${step.title}" is incomplete`);
  }
  const commands = FIREBASE.LIVE_SETUP_STEPS.map((step) => step.command).join("\n");
  assert.match(commands, /deploy:rules/, "someone must be told to deploy the rules before trusting the database");
  assert.match(commands, /bootstrap-admin/, "someone must be told how the first admin is created");
});

test("the shipped .env.example documents every key the resolver reads", () => {
  const example = readFileSync(join(ROOT, ".env.example"), "utf8");
  const missing = FIREBASE.REQUIRED_FIREBASE_FIELDS.filter((field) => !example.includes(FIREBASE.ENV_KEYS[field]));
  assert.deepEqual(missing, [], `these keys are required but undocumented: ${missing.join(", ")}`);
});

/* ── report ─────────────────────────────────────────────────────── */

rmSync(join(ROOT, ".test-build"), { recursive: true, force: true });

console.log(`\n${"═".repeat(64)}`);
if (failures.length > 0) {
  console.error(`${failures.length} failing test(s), ${passed} passing:\n`);
  for (const failure of failures) console.error(`  ✗ ${failure.name}\n    ${failure.error.stack?.split("\n").slice(0, 4).join("\n    ")}\n`);
  process.exit(1);
}
console.log(`✓ ${passed} security assertions passed (SAAS PROOF SUITE)`);
console.log(`${"═".repeat(64)}\n`);
