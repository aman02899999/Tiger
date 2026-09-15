/* ═══════════════════════════════════════════════════════════════════
   FIREBASE CONFIGURATION — pure, shared, testable
   ───────────────────────────────────────────────────────────────────
   One description of what a valid Firebase configuration is, used by
   three consumers that must never disagree:

     • `src/firebase.ts`          — initialises the SDK
     • `scripts/check-firebase.mjs` — the `npm run check:firebase` doctor
     • `scripts/test-saas.mjs`    — asserts the behaviour below

   No SDK import, no `import.meta`, no I/O: this module is safe to run in
   Node, in the browser and in tests.

   Facts this encodes, each of which has bitten this project:
     • the web config is public by design — it ships to every browser.
       It is NEVER a credential; the rules are the security boundary.
     • `measurementId` is optional (Firebase SDK v7.20+). Treating it as
       required silently disabled the entire app.
     • two storage-bucket names exist: `<id>.appspot.com` for older
       projects and `<id>.firebasestorage.app` for newer ones. Only ever
       derive the fallback when the value is absent.
   ═══════════════════════════════════════════════════════════════════ */

export const ENV_KEYS = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
  measurementId: "VITE_FIREBASE_MEASUREMENT_ID",
} as const;

export type FirebaseField = keyof typeof ENV_KEYS;

/** Without these six there is no usable project. `measurementId` is not one of them. */
export const REQUIRED_FIREBASE_FIELDS: readonly FirebaseField[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type ResolvedFirebaseConfig = {
  config: FirebaseWebConfig;
  /** True when every required field is present and non-blank. */
  configured: boolean;
  /** Required fields that are absent, in reading order. */
  missing: FirebaseField[];
  /** True when Analytics can be started (measurement id present). */
  analytics: boolean;
};

export type ConfigIssue = {
  field: string;
  level: "bad" | "warn";
  message: string;
};

/**
 * The bucket name has two valid forms and only the Firebase console knows
 * which one a given project uses: `<project>.appspot.com` for projects
 * created before the 2024 rename, `<project>.firebasestorage.app` after it.
 *
 * This function therefore *suggests* a value for an operator who has not
 * set one; it is never used to silently substitute a bucket at runtime.
 * A wrong guess fails at the first upload with an opaque provider error,
 * and "uploads mysteriously fail" is a far worse bug than "the sign-in
 * screen told me which key was missing".
 */
export function suggestStorageBucket(projectId: string, form: "appspot" | "firebasestorage" = "firebasestorage"): string {
  if (!projectId) return "";
  return form === "appspot" ? `${projectId}.appspot.com` : `${projectId}.firebasestorage.app`;
}

export function resolveFirebaseConfig(source: Record<string, string | undefined>): ResolvedFirebaseConfig {
  const read = (field: FirebaseField): string => (source[ENV_KEYS[field]] ?? "").trim();

  const projectId = read("projectId");
  const measurementId = read("measurementId");

  const config: FirebaseWebConfig = {
    apiKey: read("apiKey"),
    authDomain: read("authDomain"),
    projectId,
    /* Taken verbatim: no fallback, because a silently wrong bucket is worse
       than a loud refusal to start. */
    storageBucket: read("storageBucket"),
    messagingSenderId: read("messagingSenderId"),
    appId: read("appId"),
    ...(measurementId ? { measurementId } : {}),
  };

  const missing = REQUIRED_FIREBASE_FIELDS.filter((field) => !config[field]);

  return { config, configured: missing.length === 0, missing, analytics: Boolean(measurementId) };
}

/**
 * Cross-field checks a completeness test cannot catch: a project id that
 * does not match its auth domain, an app id from a different project than
 * the sender id, a bucket belonging to somebody else's project. These are
 * the mistakes that produce "it logs in but nothing loads".
 */
export function inspectFirebaseConfig(source: Record<string, string | undefined>): {
  resolved: ResolvedFirebaseConfig;
  issues: ConfigIssue[];
} {
  const resolved = resolveFirebaseConfig(source);
  const { config } = resolved;
  const issues: ConfigIssue[] = [];

  if (config.apiKey && !/^AIza[0-9A-Za-z_-]{35}$/.test(config.apiKey)) {
    issues.push({ field: "apiKey", level: "warn", message: "does not match the usual `AIza…` 39-character shape — is the value complete?" });
  }

  if (config.projectId && config.authDomain && config.authDomain !== `${config.projectId}.firebaseapp.com`) {
    issues.push({
      field: "authDomain",
      level: "warn",
      message: `is "${config.authDomain}" rather than "${config.projectId}.firebaseapp.com" — correct for a custom domain, a mistake otherwise`,
    });
  }

  if (config.storageBucket && config.projectId && !config.storageBucket.startsWith(`${config.projectId}.`)) {
    issues.push({
      field: "storageBucket",
      level: "bad",
      message: `"${config.storageBucket}" does not belong to project "${config.projectId}"`,
    });
  }

  if (config.appId) {
    const parsed = /^1:(\d+):web:([0-9a-zA-Z]+)$/.exec(config.appId);
    if (!parsed) {
      issues.push({ field: "appId", level: "bad", message: "is not a web app id — expected 1:<sender-id>:web:<hash>" });
    } else if (config.messagingSenderId && parsed[1] !== config.messagingSenderId) {
      issues.push({
        field: "appId",
        level: "bad",
        message: `sender id ${parsed[1]} does not match messagingSenderId ${config.messagingSenderId} — these came from different apps`,
      });
    }
  }

  if (config.measurementId && !/^G-[A-Z0-9]{6,}$/.test(config.measurementId)) {
    issues.push({ field: "measurementId", level: "warn", message: "is not a GA4 stream id (G-XXXXXXX) — analytics will be skipped" });
  }

  return { resolved, issues };
}

/** Field names that block live mode, for an operator-facing status line. */
export function missingFirebaseFieldsOf(resolved: ResolvedFirebaseConfig): string[] {
  return resolved.missing.map((field) => ENV_KEYS[field]);
}

/**
 * The three steps that stand between "connected" and "usable", shown on the
 * sign-in screen once a real project is wired. Kept here rather than in the
 * component so the wording is reviewable next to the rules it describes.
 */
export const LIVE_SETUP_STEPS: Array<{ title: string; body: string; command: string }> = [
  {
    title: "1 · Deploy the rules",
    body: "Until they are live, Firestore and Storage answer with the default deny. That is the safe failure — not a bug.",
    command: "firebase deploy --only firestore:rules,storage:rules,firestore:indexes",
  },
  {
    title: "2 · Make yourself the admin",
    body: "Sign up in the form beside this panel, then promote that one account locally. There is no endpoint that can do it.",
    command: "node functions/scripts/bootstrap-admin.mjs you@example.com",
  },
  {
    title: "3 · Provision a gym",
    body: "Create the tenant in the platform console, then invite its owner. Trainers and members follow from there.",
    command: "# Platform console → Tenants → Provision gym",
  },
];

/**
 * One-line status for a UI surface. Deliberately boring: an operator
 * reading a log should not have to guess whether the app is live.
 */
export function describeFirebaseConfig(source: Record<string, string | undefined>): string {
  const { configured, missing, config } = resolveFirebaseConfig(source);
  if (!configured) {
    return `demo workspace — missing ${missing.map((field) => ENV_KEYS[field]).join(", ")}`;
  }
  return `live project ${config.projectId}`;
}
