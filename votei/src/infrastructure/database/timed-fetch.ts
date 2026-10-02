/**
 * Supabase talks to PostgREST and GoTrue over HTTPS. Node's `fetch` has no
 * default timeout, so a response that never arrives holds the serverless
 * invocation open until the platform kills it: no error, no log, just a
 * request that never closes. Every server-side Supabase client goes through
 * here so that cannot happen.
 *
 * The caller's own signal is composed, never replaced. Next aborts it when the
 * client gives up, and a fetch that discards it keeps burning a connection for
 * a response nobody is waiting for any more.
 *
 * The browser client is deliberately left without a deadline: a hung fetch
 * there holds no function open.
 */
export const SUPABASE_FETCH_TIMEOUT_MS = 10_000;

export function timedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const deadline = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS);

  return fetch(input, {
    ...init,
    signal: init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline,
  });
}
