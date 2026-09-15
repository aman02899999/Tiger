#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION DOCTOR
 * ───────────────────────────────────────────────────────────────────
 * Checks the Firebase wiring before you spend an hour debugging a
 * symptom that started here. Three passes:
 *
 *   1. STRUCTURE  every required VITE_FIREBASE_* is present and
 *                 self-consistent — the rules live in
 *                 `src/firebaseConfig.ts`, the same module the app and
 *                 the test suite use, so they cannot drift.
 *   2. PROJECT    .firebaserc and firebase.json agree with the env file,
 *                 the security files are present, public hostnames resolve.
 *   3. LIVE       when the network allows it: is the API key accepted,
 *                 which sign-in providers are enabled, does the Firestore
 *                 database exist, and is it actually protected.
 *
 * Pass 3 needs outbound HTTPS to Google. Sandboxes and CI usually block
 * it; the script then says "unverified" rather than "broken", so a
 * firewall can never masquerade as a configuration error.
 *
 *   npm run check:firebase
 *   node scripts/check-firebase.mjs --offline     (passes 1–2 only)
 * ═══════════════════════════════════════════════════════════════════
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { lookup } from "node:dns/promises";
import { request } from "node:https";

const ROOT = process.cwd();
const OFFLINE = process.argv.includes("--offline");
const BUILD = resolve(ROOT, ".firebase-check-build");

const results = [];
const add = (level, title, detail) => {
  results.push({ level, title, detail });
  const icon = { ok: "✓", warn: "!", bad: "✗", info: "·", skip: "–" }[level];
  console.log(`  ${icon} ${title}${detail ? `\n      ${detail}` : ""}`);
};
const section = (name) => console.log(`\n── ${name} ${"─".repeat(Math.max(0, 58 - name.length))}`);

/* ── load env (no dotenv dependency) ────────────────────────────── */

function readEnvFile(path) {
  try {
    const out = {};
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match) continue;
      const value = match[2].replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "").trim();
      if (value) out[match[1]] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
  } catch {
    return null;
  }
}

const fileEnv = { ...readEnvFile(resolve(ROOT, ".env")), ...readEnvFile(resolve(ROOT, ".env.local")) };
const env = { ...fileEnv };
for (const key of Object.keys(process.env)) {
  if (key.startsWith("VITE_FIREBASE_")) env[key] = process.env[key];
}

/* ── compile the shared config module so we run the app's own rules ─ */

function loadSharedModule() {
  mkdirSync(BUILD, { recursive: true });
  execFileSync(
    "npx",
    [
      "tsc",
      "src/firebaseConfig.ts",
      "--rootDir",
      "src",
      "--outDir",
      BUILD,
      "--module",
      "esnext",
      "--target",
      "es2022",
      "--moduleResolution",
      "bundler",
      "--skipLibCheck",
      "--types",
      "vite/client",
    ],
    { stdio: ["ignore", "ignore", "inherit"], cwd: ROOT },
  );
  writeFileSync(resolve(BUILD, "package.json"), JSON.stringify({ type: "module" }));
  return import(resolve(BUILD, "firebaseConfig.js"));
}

console.log("Tiger — Firebase configuration check");
console.log(`source: ${Object.keys(fileEnv).length > 0 ? ".env / .env.local (+ process env)" : "process env only"}`);

const shared = await loadSharedModule();
const { resolved, issues } = shared.inspectFirebaseConfig(env);
const { config, configured, missing } = resolved;

/* ═══════════════════════════════════════════════════════════════════
   1. STRUCTURE
   ═══════════════════════════════════════════════════════════════════ */

section("1. Structure");

if (configured) {
  add("ok", `all ${shared.REQUIRED_FIREBASE_FIELDS.length} required values present — project "${config.projectId}"`);
} else {
  add("bad", `${missing.length} required value(s) missing`, missing.map((field) => shared.ENV_KEYS[field]).join(", "));
  add("info", "copy .env.example to .env.local and fill it in from Firebase Console → Project settings → Your apps");
}

for (const issue of issues) add(issue.level, `${issue.field} ${issue.message}`);

if (!config.storageBucket && config.projectId) {
  add(
    "info",
    "storageBucket is not set — copy the exact value from Firebase Console → Project settings → Your apps",
    `the two possible names are ${shared.suggestStorageBucket(config.projectId, "appspot")} (projects created before late 2024) or ${shared.suggestStorageBucket(config.projectId, "firebasestorage")} (after)`,
  );
}

if (configured && issues.length === 0) add("ok", "the values are mutually consistent");

if (config.measurementId) {
  add("ok", "analytics will start (measurement id present)");
} else {
  add("info", "no measurement id — analytics is skipped; auth, data and storage are unaffected");
}

/* ═══════════════════════════════════════════════════════════════════
   2. PROJECT FILES
   ═══════════════════════════════════════════════════════════════════ */

section("2. Project files");

const rc = readJson(".firebaserc");
const rcProject = rc?.projects?.default ?? null;
if (rcProject && config.projectId) {
  rcProject === config.projectId
    ? add("ok", `.firebaserc default project matches (${rcProject})`)
    : add("bad", `.firebaserc points at ${rcProject} but the app uses ${config.projectId}`, "rules and the app would target different projects");
} else {
  add("warn", ".firebaserc has no default project", "run `firebase use --add`, or set it in this file");
}

const hosting = readJson("firebase.json")?.hosting;
const mainSite = hosting?.find?.((entry) => entry.target === "main")?.site ?? null;
add(
  hosting ? "ok" : "bad",
  hosting ? `firebase.json declares ${hosting.length} hosting target(s)` : "firebase.json has no hosting block",
  mainSite ? `target "main" → site ${mainSite}` : undefined,
);

let securityFilesPresent = true;
for (const file of ["firestore.rules", "storage.rules", "firestore.indexes.json"]) {
  try {
    readFileSync(resolve(ROOT, file), "utf8");
  } catch {
    securityFilesPresent = false;
    add("bad", `${file} is missing from this checkout`);
  }
}
if (securityFilesPresent) add("ok", "firestore.rules, storage.rules and firestore.indexes.json are all present");

try {
  const indexes = JSON.parse(readFileSync(resolve(ROOT, "firestore.indexes.json"), "utf8")).indexes ?? [];
  add("ok", `firestore.indexes.json declares ${indexes.length} composite indexes`, "verify with `npm run check:indexes`");
} catch {
  add("bad", "firestore.indexes.json could not be parsed");
}

/* ═══════════════════════════════════════════════════════════════════
   3. LIVE PROJECT (network permitting)
   ═══════════════════════════════════════════════════════════════════ */

section("3. Live project");

function dnsCheck(host) {
  return lookup(host)
    .then(({ address }) => ({ ok: true, address }))
    .catch((error) => ({ ok: false, code: error.code }));
}

function httpsJson(url, body) {
  return new Promise((resolvePromise) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = request(
      url,
      {
        method: body ? "POST" : "GET",
        headers: payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {},
        timeout: 9000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolvePromise({ status: res.statusCode, body: data }));
      },
    );
    req.on("error", (error) => resolvePromise({ status: 0, error: error.code ?? error.message }));
    req.on("timeout", () => {
      req.destroy();
      resolvePromise({ status: 0, error: "ETIMEDOUT" });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function explain(body) {
  try {
    return JSON.parse(body)?.error?.message ?? String(body).slice(0, 200);
  } catch {
    return String(body).slice(0, 200);
  }
}

if (config.projectId) {
  for (const host of [`${config.projectId}.firebaseapp.com`, `${config.projectId}.web.app`]) {
    const result = await dnsCheck(host);
    if (result.ok) add("ok", `DNS resolves: ${host}`, result.address);
    else add("warn", `DNS did not resolve: ${host}`, `${result.code} — DNS may be blocked here, but confirm the project id`);
  }
}

if (OFFLINE) {
  add("skip", "live probes skipped (--offline)");
} else if (!config.apiKey || !config.projectId) {
  add("skip", "live probes need an API key and a project id");
} else {
  const authProbe = await httpsJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(config.apiKey)}`,
    { identifier: "config-check-does-not-exist@example.invalid", continueUri: "http://localhost:5173" },
  );

  if (authProbe.status === 0) {
    add(
      "skip",
      `could not reach identitytoolkit.googleapis.com (${authProbe.error})`,
      "expected inside a sandbox or CI — run `npm run check:firebase` on your own machine to finish pass 3",
    );
  } else if (authProbe.status === 200) {
    let parsed = {};
    try {
      parsed = JSON.parse(authProbe.body || "{}");
    } catch {
      parsed = {};
    }
    add("ok", "the API key is accepted by Firebase Auth");
    const providers = parsed.allProviders ?? parsed.signinMethods ?? [];
    add(
      providers.includes("password") ? "ok" : "warn",
      providers.includes("password") ? "Email/Password sign-in is enabled" : "Email/Password sign-in is NOT enabled",
      providers.length > 0
        ? `enabled providers: ${providers.join(", ")}`
        : "Firebase Console → Authentication → Sign-in method → Email/Password",
    );
  } else {
    add("bad", `Firebase Auth rejected the API key (HTTP ${authProbe.status})`, explain(authProbe.body));
  }

  const firestoreProbe = await httpsJson(
    `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/users`,
  );
  if (firestoreProbe.status === 0) {
    add("skip", `could not reach firestore.googleapis.com (${firestoreProbe.error})`);
  } else if (firestoreProbe.status === 403) {
    add("ok", "the Firestore database exists and refused an unauthenticated read", "403 is the correct answer — rules are in force");
  } else if (firestoreProbe.status === 404) {
    add("bad", `no Firestore database at projects/${config.projectId}`, "create it in Firebase Console → Firestore Database, then deploy the rules");
  } else if (firestoreProbe.status === 200) {
    add(
      "bad",
      "Firestore answered an UNAUTHENTICATED read with 200",
      "the database is in test mode, or firestore.rules was never deployed. Deploy it before storing anything real: `firebase deploy --only firestore:rules`",
    );
  } else {
    add("warn", `unexpected Firestore probe response: HTTP ${firestoreProbe.status}`, explain(firestoreProbe.body));
  }
}

rmSync(BUILD, { recursive: true, force: true });

/* ── next steps ─────────────────────────────────────────────────── */

const bad = results.filter((entry) => entry.level === "bad");
const warns = results.filter((entry) => entry.level === "warn");

console.log(`\n${"═".repeat(64)}`);
console.log(`${results.filter((r) => r.level === "ok").length} ok · ${warns.length} warning(s) · ${bad.length} problem(s)`);
console.log(`${"═".repeat(64)}`);

const project = config.projectId || "<project-id>";
console.log(`
Deployment steps this repository cannot perform for you:

  1. firebase login
  2. firebase use ${project}
  3. firebase deploy --only firestore:rules,storage:rules,firestore:indexes
  4. Firebase Console → Authentication
       • Sign-in method → enable Email/Password (and Google if you want it)
       • Settings → Authorized domains → add localhost, your hosting domain,
         and any preview/staging host the app is served from
  5. Sign up once through the app (that account is you), then promote it locally:
       export GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json
       node functions/scripts/bootstrap-admin.mjs you@example.com
  6. Provision the first gym in the platform console, invite the owner,
     then add trainers and members.
  7. Payments, when you are ready to charge:
       firebase functions:secrets:set RAZORPAY_KEY_ID
       firebase functions:secrets:set RAZORPAY_KEY_SECRET
       firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
       firebase deploy --only functions
     then register the printed URL as a webhook for payment.captured,
     payment.failed and refund.processed.

Full detail: docs/PRODUCTION_READINESS.md §4.
`);

process.exit(bad.length > 0 ? 1 : 0);
