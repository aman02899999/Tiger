/* ═══════════════════════════════════════════════════════════════════
   DATA PROVIDER
   ───────────────────────────────────────────────────────────────────
   Chooses the data source once, at the top of the SaaS shell:

     • Firebase configured  → FirestoreSource (authorised by rules)
     • otherwise            → DemoSource (in-memory, labelled, no
                              entitlements, no persistence)

   Nothing below this provider branches on which one is active; they
   all talk to the same `DataSource` contract.
   ═══════════════════════════════════════════════════════════════════ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthSystem";
import { buildDemoSeed } from "./demoSeed";
import { DemoSource, FirestoreSource, setDataSource, type DataSource } from "./datasource";
import { TenantClient } from "./repos";
import type { Capability, AccessContext } from "../security/permissions";
import { can } from "../security/permissions";

type DataContextValue = {
  client: TenantClient | null;
  source: DataSource | null;
  ready: boolean;
};

const DataContext = createContext<DataContextValue>({ client: null, source: null, ready: false });

let singletonSource: DataSource | null = null;

/** One process-wide source so demo writes are visible everywhere. */
export function sharedDataSource(): DataSource {
  if (!singletonSource) {
    singletonSource = db ? new FirestoreSource(db) : new DemoSource(buildDemoSeed());
    setDataSource(singletonSource);
  }
  return singletonSource;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const source = useMemo(() => sharedDataSource(), []);

  const client = useMemo(() => {
    if (!session) return null;
    return new TenantClient(
      { uid: session.uid, role: session.claims.role, gymId: session.claims.gymId, gymIds: session.claims.gymIds },
      source,
      session.claims,
    );
  }, [session, source]);

  const value = useMemo<DataContextValue>(() => ({ client, source, ready: Boolean(client) }), [client, source]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext(): DataContextValue {
  return useContext(DataContext);
}

/** Throws when used outside an authenticated workspace — a programming error, not a user error. */
export function useTenant(): TenantClient {
  const { client } = useContext(DataContext);
  if (!client) throw new Error("useTenant() requires an authenticated session inside <DataProvider>.");
  return client;
}

export function useOptionalTenant(): TenantClient | null {
  return useContext(DataContext).client;
}

export function useCan(capability: Capability, ctx: AccessContext = {}): boolean {
  const { actor } = useAuth();
  return useMemo(() => (actor ? can(actor, capability, ctx) : false), [actor, capability, JSON.stringify(ctx)]);
}

/* ── Async loading helper ───────────────────────────────────────── */

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

/**
 * Minimal, dependency-honest async loader. `enabled: false` keeps the
 * query idle (used while a session is still resolving) instead of
 * firing a request that the rules would reject.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const key = JSON.stringify(deps);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload };
}

/* ── Live subscription helper (Firestore realtime in live mode) ─── */

export function useLiveRows<T>(
  subscribe: (source: DataSource, emit: (rows: T[]) => void, fail: (err: Error) => void) => () => void,
  deps: unknown[],
  enabled = true,
): T[] {
  const { source } = useContext(DataContext);
  const [rows, setRows] = useState<T[]>([]);
  const key = JSON.stringify(deps);
  const subRef = useRef(subscribe);
  subRef.current = subscribe;

  useEffect(() => {
    if (!enabled || !source) return undefined;
    const unsubscribe = subRef.current(source, setRows, () => setRows([]));
    return unsubscribe;
  }, [source, key, enabled]);

  return rows;
}
