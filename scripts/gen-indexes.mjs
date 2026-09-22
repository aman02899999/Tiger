#!/usr/bin/env node
/**
 * Regenerate `firestore.indexes.json` from the collection registry.
 *
 * The registry (`src/domain/collections.ts`) is the single source of truth
 * for which composite indexes the query layer needs. Hand-editing the JSON
 * is how production ends up with a missing index and a query that silently
 * fails at scale, so this script exists and `scripts/test-saas.mjs` fails
 * the build whenever the committed file drifts from the registry.
 *
 *   node scripts/gen-indexes.mjs           # write the file
 *   node scripts/gen-indexes.mjs --check   # exit 1 if it is out of date
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUILD = join(ROOT, ".indexes-build");
const TARGET = join(ROOT, "firestore.indexes.json");
const check = process.argv.includes("--check");

mkdirSync(BUILD, { recursive: true });
execFileSync(
  "npx",
  [
    "tsc",
    "src/domain/collections.ts",
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
  { stdio: "inherit", cwd: ROOT },
);
writeFileSync(join(BUILD, "package.json"), JSON.stringify({ type: "module" }));

const { requiredIndexes } = await import(join(BUILD, "domain/collections.js"));

/** Mirror of `query` semantics: == / < / <= / > / >= are ASCENDING,
 *  anything ordered descending is expressed in the query layer, not here. */
const indexes = requiredIndexes().map((index) => ({
  collectionGroup: index.collectionGroup,
  queryScope: "COLLECTION",
  fields: index.fields.map((fieldPath, position) => ({
    fieldPath,
    order: position === index.fields.length - 1 && /At$|Date$/.test(fieldPath) ? "DESCENDING" : "ASCENDING",
  })),
}));

const document = { indexes, fieldOverrides: [] };
const rendered = `${JSON.stringify(document, null, 2)}\n`;

rmSync(BUILD, { recursive: true, force: true });

if (check) {
  const current = (() => {
    try {
      return readFileSync(TARGET, "utf8");
    } catch {
      return "";
    }
  })();
  if (current !== rendered) {
    console.error("firestore.indexes.json is out of date — run `node scripts/gen-indexes.mjs`.");
    process.exit(1);
  }
  console.log(`✓ firestore.indexes.json matches the registry (${indexes.length} composite indexes)`);
} else {
  writeFileSync(TARGET, rendered);
  console.log(`✓ wrote ${indexes.length} composite indexes to firestore.indexes.json`);
}
