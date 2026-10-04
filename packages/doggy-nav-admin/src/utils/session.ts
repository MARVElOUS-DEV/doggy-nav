let timer: any = null;
let nextExpMs: number | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;
let started = false;
let failCount = 0;

type RefreshResult = 'success' | 'invalid' | 'retryable';

const LEEWAY_MS = (process.env.NODE_ENV === 'development' ? 10 : 90) * 1000;
const MIN_DELAY_MS = 1000; // avoid tight loops when delta <= 0
const BASE_BACKOFF_MS = 10 * 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

function normalizeEpochMs(exp: number): number {
  // Treat seconds-based epochs as milliseconds
  return exp < 1e12 ? exp * 1000 : exp;
}

function calcBackoffMs() {
  const factor = Math.min(10, failCount);
  const ms = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, factor));
  failCount = Math.min(failCount + 1, 10);
  return ms;
}
function onOnline() {
  // If we had failures, try immediately; else just ensure schedule
  if (failCount > 0) {
    refreshNow();
  } else {
    schedule();
  }
}
function scheduleBackoff() {
  if (typeof window === 'undefined') return;
  if (timer) clearTimeout(timer);
  timer = null;
  const delay = calcBackoffMs();
  // If offline, wait for online event instead of tight retry
  if (typeof navigator !== 'undefined' && (navigator as any).onLine === false) {
    window.addEventListener('online', onOnline, { once: true });
    return;
  }
  timer = window.setTimeout(refreshNow, delay);
}

function stopRefreshRetries() {
  if (timer) clearTimeout(timer);
  timer = null;
  nextExpMs = null;
  failCount = 0;
  if (typeof window !== 'undefined')
    window.removeEventListener('online', onOnline);
}

// The winner may have committed rotation before its cookies reach the browser.
async function recoverConcurrentRefresh(
  previousExpMs: number | null,
): Promise<boolean> {
  for (const delay of [0, 150, 350, 750, 1500]) {
    if (delay)
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 'X-App-Source': 'admin' },
      });
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

async function performRefresh(): Promise<RefreshResult> {
  let result: RefreshResult = 'retryable';
  const previousExpMs = nextExpMs;
  try {
    const resp = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-App-Source': 'admin' },
    });
    const json = await resp.json().catch(() => null);
    if (resp.ok && json?.code === 1) {
      result = 'success';
      const exp = json?.data?.accessExp;
      if (typeof exp === 'number') nextExpMs = normalizeEpochMs(exp);
    } else if (resp.status === 401) {
      result = 'invalid';
    } else if (
      resp.status === 409 &&
      (await recoverConcurrentRefresh(previousExpMs))
    ) {
      result = 'success';
    }
  } catch {
    // Network and server failures retain the session for a later retry.
  } finally {
    if (result === 'success') failCount = 0;
    if (result === 'invalid') stopRefreshRetries();
    if (result === 'success') {
      schedule();
    } else if (result === 'retryable') {
      scheduleBackoff();
    }
  }
  return result;
}

function getRefreshPromise(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function refreshNow() {
  await getRefreshPromise();
}

export async function requestAdminRefresh() {
  const result = await getRefreshPromise();
  if (result !== 'success') {
    throw new Error(
      result === 'invalid' ? 'refresh_invalid' : 'refresh_failed',
    );
  }
}

function schedule() {
  if (typeof window === 'undefined') return;
  if (!nextExpMs) return;
  const now = Date.now();
  const delay = Math.max(MIN_DELAY_MS, nextExpMs - now - LEEWAY_MS);
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(refreshNow, delay);
}

export function setAccessExpEpochMs(expMs: number | null | undefined) {
  if (!expMs || typeof expMs !== 'number') return;
  nextExpMs = normalizeEpochMs(expMs);
  schedule();
}

function onVisibilityOrFocus() {
  if (document.visibilityState === 'visible') {
    if (nextExpMs && nextExpMs - Date.now() <= LEEWAY_MS) {
      refreshNow();
    } else {
      schedule();
    }
  }
}

export function startProactiveAuthRefresh(initialExp?: number | null) {
  if (typeof window === 'undefined') return;
  if ((window as any).__proactiveRefreshStarted || started) return;
  (window as any).__proactiveRefreshStarted = true;
  started = true;
  if (typeof initialExp === 'number') {
    nextExpMs = normalizeEpochMs(initialExp);
    schedule();
  }
  window.addEventListener('focus', onVisibilityOrFocus);
  document.addEventListener('visibilitychange', onVisibilityOrFocus);
  window.addEventListener('online', onOnline);
}
