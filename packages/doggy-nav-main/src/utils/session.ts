import { publishAuthSessionRefresh } from './authSessionRefresh';

let timer: any = null;
let nextExpMs: number | null = null;
let refreshing = false; // per-tab flag
let failCount = 0;

type RefreshResult = 'success' | 'invalid' | 'retryable';

// Cross-tab coordination
const BC_NAME = 'auth:refresh';
const LOCK_NAME = 'auth-refresh-lock';
const LS_INFLIGHT_KEY = 'auth_refresh_inflight';
const LS_RESULT_KEY = 'auth_refresh_result';
const INFLIGHT_TTL_MS = 30_000;
const INSTANCE_ID = Math.random().toString(36).slice(2);
let bc: BroadcastChannel | null = null;

const LEEWAY_MS = (process.env.NODE_ENV === 'development' ? 10 : 90) * 1000;
const MIN_DELAY_MS = 1000; // avoid tight loops
const BASE_BACKOFF_MS = 10 * 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

function normalizeEpochMs(exp: number): number {
  return exp < 1e12 ? exp * 1000 : exp;
}

function calcBackoffMs() {
  const factor = Math.min(10, failCount);
  const ms = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, factor));
  failCount = Math.min(failCount + 1, 10);
  return ms;
}

function scheduleBackoff() {
  if (typeof window === 'undefined') return;
  if (timer) clearTimeout(timer);
  timer = null;
  const delay = calcBackoffMs();
  if (typeof navigator !== 'undefined' && (navigator as any).onLine === false) {
    window.addEventListener('online', onOnline, { once: true });
    return;
  }
  timer = window.setTimeout(refreshNow, delay);
}

export function setAccessExpEpochMs(expMs: number | null | undefined) {
  if (!expMs || typeof expMs !== 'number') return;
  nextExpMs = normalizeEpochMs(expMs);
  // inform other tabs of new access token expiry (e.g., after login/me)
  try {
    const payload = { type: 'exp-update', exp: nextExpMs } as const;
    if (!bc && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new (window as any).BroadcastChannel(BC_NAME);
      attachBroadcastHandlers();
    }
    bc?.postMessage(payload);
    // storage fallback
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        LS_RESULT_KEY,
        JSON.stringify({
          t: Date.now(),
          ok: true,
          exp: nextExpMs,
          kind: 'exp-update',
        })
      );
    }
  } catch {}
  schedule();
}

function stopRefreshRetries() {
  if (timer) clearTimeout(timer);
  timer = null;
  nextExpMs = null;
  failCount = 0;
  if (typeof window !== 'undefined') window.removeEventListener('online', onOnline);
}

// The winner may have committed rotation before its cookies reach the browser.
async function recoverConcurrentRefresh(previousExpMs: number | null): Promise<boolean> {
  for (const delay of [0, 150, 350, 750, 1500]) {
    if (delay)
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const json = await response.json().catch(() => null);
      const exp = json?.data?.accessExp;
      if (
        response.ok &&
        json?.code === 1 &&
        json?.data?.authenticated === true &&
        typeof exp === 'number' &&
        (!previousExpMs || normalizeEpochMs(exp) > previousExpMs)
      ) {
        nextExpMs = normalizeEpochMs(exp);
        return true;
      }
    } catch {
      // Keep waiting within the bounded recovery window.
    }
  }
  return false;
}

async function doRefresh(): Promise<RefreshResult> {
  if (refreshing) return 'retryable';
  refreshing = true;
  let result: RefreshResult = 'retryable';
  const previousExpMs = nextExpMs;
  try {
    const resp = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    const json = await resp.json().catch(() => null);
    if (resp.ok && json?.code === 1) {
      result = 'success';
      const exp = json?.data?.accessExp;
      if (typeof exp === 'number') nextExpMs = normalizeEpochMs(exp);
    } else if (resp.status === 401) {
      result = 'invalid';
    } else if (resp.status === 409 && (await recoverConcurrentRefresh(previousExpMs))) {
      result = 'success';
    }
  } catch {
    // Network and server failures retain the session for a later retry.
  } finally {
    refreshing = false;
    if (result === 'success') failCount = 0;
    if (result === 'invalid') stopRefreshRetries();
    try {
      const msg =
        result === 'success'
          ? { type: 'refresh-success', exp: nextExpMs }
          : { type: 'refresh-fail', invalid: result === 'invalid' };
      bc?.postMessage(msg);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          LS_RESULT_KEY,
          JSON.stringify({
            t: Date.now(),
            ok: result === 'success',
            invalid: result === 'invalid',
            exp: nextExpMs,
            kind: 'refresh',
          })
        );
      }
    } catch {}
    if (result === 'success') {
      publishAuthSessionRefresh();
      schedule();
    } else if (result === 'retryable') {
      scheduleBackoff();
    }
  }
  return result;
}

// Exclusive execution wrapper using Web Locks (if available) or localStorage fallback (best-effort)
async function runExclusiveRefresh(wait: boolean): Promise<RefreshResult | void> {
  if (typeof window === 'undefined') return;
  const locks = (navigator as any)?.locks;
  if (locks && typeof locks.request === 'function') {
    if (wait) return await locks.request(LOCK_NAME, doRefresh);
    return await locks.request(LOCK_NAME, { ifAvailable: true }, async (lock: any) => {
      if (lock) return await doRefresh();
    });
  }

  // Fallback: localStorage-based best-effort inflight lock
  const owner = tryAcquireInflight();
  if (owner) {
    try {
      return await doRefresh();
    } finally {
      releaseInflight(owner);
    }
  }
  if (wait) {
    // Wait for another tab to finish
    return await waitForRefreshResult();
  }
}

// Try to acquire an inflight record in localStorage (best-effort CAS)
function tryAcquireInflight(): string | null {
  try {
    const now = Date.now();
    const current = window.localStorage.getItem(LS_INFLIGHT_KEY);
    const parsed = current ? JSON.parse(current) : null;
    if (!parsed || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= now) {
      const owner = `${INSTANCE_ID}-${now}`;
      const rec = { owner, expiresAt: now + INFLIGHT_TTL_MS };
      window.localStorage.setItem(LS_INFLIGHT_KEY, JSON.stringify(rec));
      const verifyRaw = window.localStorage.getItem(LS_INFLIGHT_KEY);
      const verify = verifyRaw ? JSON.parse(verifyRaw) : null;
      if (verify?.owner === owner) return owner;
    }
  } catch {}
  return null;
}

function releaseInflight(owner: string) {
  try {
    const raw = window.localStorage.getItem(LS_INFLIGHT_KEY);
    const rec = raw ? JSON.parse(raw) : null;
    if (!rec || rec.owner === owner) {
      window.localStorage.removeItem(LS_INFLIGHT_KEY);
    }
  } catch {}
}

function waitForRefreshResult(timeoutMs = 20000): Promise<RefreshResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const onDone = (result: RefreshResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (result === 'invalid') stopRefreshRetries();
      result === 'retryable' ? reject(new Error('refresh_failed')) : resolve(result);
    };

    const onMessage = (ev: any) => {
      const data = ev?.data || ev;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'refresh-success') onDone('success');
      if (data.type === 'refresh-fail') onDone(data.invalid ? 'invalid' : 'retryable');
      if (data.type === 'exp-update') onDone('success');
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_RESULT_KEY || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        if (data?.kind === 'refresh' || data?.kind === 'exp-update') {
          onDone(data.ok ? 'success' : data.invalid ? 'invalid' : 'retryable');
        }
      } catch {}
    };

    const cleanup = () => {
      if (bc) bc.removeEventListener('message', onMessage as any);
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      window.clearTimeout(timeoutId);
    };

    try {
      if (!bc && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new (window as any).BroadcastChannel(BC_NAME);
        attachBroadcastHandlers();
      }
      bc?.addEventListener('message', onMessage as any);
    } catch {}

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }

    const timeoutId = window.setTimeout(() => onDone('retryable'), timeoutMs);
  });
}

function attachBroadcastHandlers() {
  if (!bc) return;
  bc.onmessage = (ev: MessageEvent) => {
    const data: any = ev?.data;
    if (!data || typeof data !== 'object') return;
    if (
      typeof data.exp === 'number' &&
      (data.type === 'refresh-success' || data.type === 'exp-update')
    ) {
      nextExpMs = normalizeEpochMs(data.exp);
      schedule();
      failCount = 0;
    }
    if (data.type === 'refresh-fail' && data.invalid) stopRefreshRetries();
    if (data.type === 'refresh-success') {
      publishAuthSessionRefresh();
    }
  };
}

// Public: proactive refresh trigger that attempts exclusive cross-tab refresh without waiting
async function refreshNow() {
  await runExclusiveRefresh(false);
}

function schedule() {
  if (typeof window === 'undefined') return;
  if (!nextExpMs) return;
  const now = Date.now();
  const delay = Math.max(MIN_DELAY_MS, nextExpMs - now - LEEWAY_MS);
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(refreshNow, delay);
}

async function bootstrap() {
  if (typeof window === 'undefined') return;
  schedule();
}

function onVisibilityOrFocus() {
  if (document.visibilityState === 'visible') {
    // if within leeway, refresh immediately; else ensure scheduled
    if (nextExpMs && nextExpMs - Date.now() <= LEEWAY_MS) {
      refreshNow();
    } else {
      schedule();
    }
  }
}

export function startProactiveAuthRefresh() {
  if (typeof window === 'undefined') return;
  if ((window as any).__proactiveRefreshStarted) return;
  (window as any).__proactiveRefreshStarted = true;
  try {
    if ('BroadcastChannel' in window) {
      bc = new (window as any).BroadcastChannel(BC_NAME);
      attachBroadcastHandlers();
    }
  } catch {}
  bootstrap();
  window.addEventListener('focus', onVisibilityOrFocus);
  document.addEventListener('visibilitychange', onVisibilityOrFocus);
  window.addEventListener('online', onOnline);
}

function onOnline() {
  if (failCount > 0) {
    refreshNow();
  } else {
    schedule();
  }
}

// Public: reactive, cross-tab coordinated refresh; waits for completion
export async function requestCrossTabRefresh(): Promise<void> {
  const result = await runExclusiveRefresh(true);
  if (result === 'invalid' || result === 'retryable') {
    throw new Error(result === 'invalid' ? 'refresh_invalid' : 'refresh_failed');
  }
}
