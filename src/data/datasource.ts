/* ═══════════════════════════════════════════════════════════════════
   DATA SOURCE — one interface, two honest implementations
   ───────────────────────────────────────────────────────────────────
   `FirestoreSource`  → the only production path. Authorisation is
                        enforced by firestore.rules, not by this file.
   `DemoSource`       → in-memory, deterministically seeded, explicitly
                        labelled in the UI, never persists, never
                        grants entitlements. It exists so the product
                        can be evaluated without a Firebase project.

   Both implement the same contract, so no screen needs to know which
   one it is talking to.
   ═══════════════════════════════════════════════════════════════════ */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy as fsOrderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, type CollectionKey } from "../domain/collections";

export type FilterOp = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains";

export type QueryFilter = { field: string; op: FilterOp; value: unknown };

export type QueryOptions = {
  filters?: QueryFilter[];
  orderBy?: { field: string; dir: "asc" | "desc" };
  limit?: number;
};

export type BaseDoc = { id: string; [key: string]: unknown };

export interface DataSource {
  readonly kind: "firestore" | "demo";
  list<T extends BaseDoc>(key: CollectionKey, opts?: QueryOptions): Promise<T[]>;
  get<T extends BaseDoc>(key: CollectionKey, id: string): Promise<T | null>;
  create<T extends BaseDoc>(key: CollectionKey, data: Omit<T, "id">, id?: string): Promise<T>;
  update(key: CollectionKey, id: string, patch: Record<string, unknown>): Promise<void>;
  remove(key: CollectionKey, id: string): Promise<void>;
  subscribe<T extends BaseDoc>(
    key: CollectionKey,
    opts: QueryOptions | undefined,
    next: (rows: T[]) => void,
    error?: (err: Error) => void,
  ): () => void;
  /** Test/diagnostics hook — number of documents visible to this source. */
  count(key: CollectionKey): Promise<number>;
}

/* ── Shared helpers ─────────────────────────────────────────────── */

export function nowIso(): string {
  return new Date().toISOString();
}

function matches(docRow: BaseDoc, filters: QueryFilter[]): boolean {
  return filters.every(({ field, op, value }) => {
    const actual = docRow[field];
    switch (op) {
      case "==":
        return actual === value;
      case "!=":
        return actual !== value;
      case "<":
        return typeof actual === "number" && typeof value === "number" && actual < value;
      case "<=":
        return typeof actual === "number" && typeof value === "number" && actual <= value;
      case ">":
        return typeof actual === "number" && typeof value === "number" && actual > value;
      case ">=":
        return typeof actual === "number" && typeof value === "number" && actual >= value;
      case "in":
        return Array.isArray(value) && value.includes(actual as never);
      case "array-contains":
        return Array.isArray(actual) && actual.includes(value as never);
      default:
        return false;
    }
  });
}

function sortRows<T extends BaseDoc>(rows: T[], order?: QueryOptions["orderBy"]): T[] {
  if (!order) return rows;
  const { field, dir } = order;
  return [...rows].sort((a, b) => {
    const av = a[field] as string | number;
    const bv = b[field] as string | number;
    if (av === bv) return 0;
    const cmp = av > bv ? 1 : -1;
    return dir === "asc" ? cmp : -cmp;
  });
}

function applyOptions<T extends BaseDoc>(rows: T[], opts?: QueryOptions): T[] {
  const filtered = opts?.filters ? rows.filter((row) => matches(row, opts.filters!)) : rows;
  const sorted = sortRows(filtered, opts?.orderBy);
  return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
}

/* ── Firestore ──────────────────────────────────────────────────── */

export class FirestoreSource implements DataSource {
  readonly kind = "firestore" as const;

  constructor(private readonly firestore: NonNullable<typeof db>) {}

  private ref(key: CollectionKey) {
    return collection(this.firestore, COLLECTIONS[key].path);
  }

  private constraints(opts?: QueryOptions): QueryConstraint[] {
    const out: QueryConstraint[] = [];
    for (const filter of opts?.filters ?? []) out.push(where(filter.field, filter.op, filter.value));
    if (opts?.orderBy) out.push(fsOrderBy(opts.orderBy.field, opts.orderBy.dir));
    if (opts?.limit) out.push(fsLimit(opts.limit));
    return out;
  }

  async list<T extends BaseDoc>(key: CollectionKey, opts?: QueryOptions): Promise<T[]> {
    const snap = await getDocs(query(this.ref(key), ...this.constraints(opts)));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
  }

  async get<T extends BaseDoc>(key: CollectionKey, id: string): Promise<T | null> {
    const snap = await getDoc(doc(this.firestore, COLLECTIONS[key].path, id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null;
  }

  async create<T extends BaseDoc>(key: CollectionKey, data: Omit<T, "id">, id?: string): Promise<T> {
    const payload = data as Record<string, unknown>;
    if (id) {
      await setDoc(doc(this.firestore, COLLECTIONS[key].path, id), payload);
      return { id, ...payload } as T;
    }
    const created = await addDoc(this.ref(key), payload);
    return { id: created.id, ...payload } as T;
  }

  async update(key: CollectionKey, id: string, patch: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(this.firestore, COLLECTIONS[key].path, id), patch);
  }

  async remove(key: CollectionKey, id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, COLLECTIONS[key].path, id));
  }

  subscribe<T extends BaseDoc>(
    key: CollectionKey,
    opts: QueryOptions | undefined,
    next: (rows: T[]) => void,
    error?: (err: Error) => void,
  ): () => void {
    return onSnapshot(
      query(this.ref(key), ...this.constraints(opts)),
      (snap) => next(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T)),
      (err) => error?.(err),
    );
  }

  async count(key: CollectionKey): Promise<number> {
    const snap = await getDocs(query(this.ref(key), fsLimit(500)));
    return snap.size;
  }
}

/* ── Demo (in-memory, labelled, non-authoritative) ──────────────── */

type Listener = () => void;

export class DemoSource implements DataSource {
  readonly kind = "demo" as const;

  private readonly tables = new Map<CollectionKey, Map<string, BaseDoc>>();
  private readonly listeners = new Set<Listener>();
  private seq = 0;

  constructor(seed: Partial<Record<CollectionKey, BaseDoc[]>> = {}) {
    for (const [key, rows] of Object.entries(seed) as Array<[CollectionKey, BaseDoc[]]>) {
      const table = new Map<string, BaseDoc>();
      for (const row of rows) table.set(row.id, { ...row });
      this.tables.set(key, table);
    }
  }

  private table(key: CollectionKey): Map<string, BaseDoc> {
    if (!this.tables.has(key)) this.tables.set(key, new Map());
    return this.tables.get(key)!;
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  async list<T extends BaseDoc>(key: CollectionKey, opts?: QueryOptions): Promise<T[]> {
    return applyOptions([...this.table(key).values()] as T[], opts);
  }

  async get<T extends BaseDoc>(key: CollectionKey, id: string): Promise<T | null> {
    return (this.table(key).get(id) as T | undefined) ?? null;
  }

  async create<T extends BaseDoc>(key: CollectionKey, data: Omit<T, "id">, id?: string): Promise<T> {
    const resolved = id ?? `demo-${++this.seq}-${Math.random().toString(36).slice(2, 8)}`;
    const row = { id: resolved, ...(data as Record<string, unknown>) } as T;
    this.table(key).set(resolved, row as BaseDoc);
    this.emit();
    return row;
  }

  async update(key: CollectionKey, id: string, patch: Record<string, unknown>): Promise<void> {
    const current = this.table(key).get(id);
    if (!current) throw new Error(`Demo record not found: ${key}/${id}`);
    this.table(key).set(id, { ...current, ...patch });
    this.emit();
  }

  async remove(key: CollectionKey, id: string): Promise<void> {
    this.table(key).delete(id);
    this.emit();
  }

  subscribe<T extends BaseDoc>(
    key: CollectionKey,
    opts: QueryOptions | undefined,
    next: (rows: T[]) => void,
    _error?: (err: Error) => void,
  ): () => void {
    let active = true;
    const push = () => {
      if (!active) return;
      void this.list<T>(key, opts).then((rows) => active && next(rows));
    };
    push();
    this.listeners.add(push);
    return () => {
      active = false;
      this.listeners.delete(push);
    };
  }

  async count(key: CollectionKey): Promise<number> {
    return this.table(key).size;
  }

  /** Test helper: drop every table. */
  reset(): void {
    this.tables.clear();
    this.emit();
  }
}

/* ── Selection ──────────────────────────────────────────────────── */

let active: DataSource | null = null;

export function setDataSource(source: DataSource): void {
  active = source;
}

export function getDataSource(): DataSource | null {
  return active;
}

export function requireDataSource(): DataSource {
  if (!active) {
    throw new Error(
      "No data source configured. Call setDataSource(new FirestoreSource(db)) once Firebase env vars are present.",
    );
  }
  return active;
}

export function isLive(): boolean {
  return active?.kind === "firestore";
}
