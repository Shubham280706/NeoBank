// Minimal fake for the subset of the supabase-js query builder used across
// controllers/services. Every chain method (from/select/eq/order/insert/...)
// returns the same thenable proxy, and awaiting it (or calling `.single()`)
// resolves to the canned `{ data, error }` result. This lets tests stub
// `requireSupabase()` without spinning up a real Postgres/Supabase instance.

export interface FakeResult<T = any> {
  data: T;
  error: { message: string } | null;
}

export function makeChain(result: FakeResult): any {
  const target: any = {};
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: FakeResult) => void) => resolve(result);
      }
      if (prop === "catch" || prop === "finally") {
        return () => proxy;
      }
      if (prop === "single" || prop === "maybeSingle") {
        return () => Promise.resolve(result);
      }
      // any other chained call (from/select/eq/order/insert/update/delete/limit...)
      return (..._args: any[]) => proxy;
    },
  };
  const proxy = new Proxy(target, handler);
  return proxy;
}

// Builds a fake supabase client where `.from(table)` returns a canned chain
// based on a table -> result map, and `.rpc(fnName)` is a jest.fn you control.
export function makeFakeSupabase(opts: {
  fromResults?: Record<string, FakeResult>;
  rpc?: (...args: any[]) => Promise<FakeResult> | FakeResult;
}) {
  const rpcImpl = opts.rpc ?? (() => Promise.resolve({ data: null, error: null }));
  return {
    from: (table: string) => {
      const result = opts.fromResults?.[table] ?? { data: null, error: null };
      return makeChain(result);
    },
    rpc: (...args: any[]) => Promise.resolve(rpcImpl(...args)),
  };
}
