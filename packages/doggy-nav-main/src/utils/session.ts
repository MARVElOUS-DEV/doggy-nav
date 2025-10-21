let timer: any = null;
let nextExpMs: number | null = null;
let refreshing = false;
let started = false;
let failCount = 0;

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
  if (typeof navigator !== 'undefined' && (navigator as any).onLine === false) {
    window.addEventListener('online', onOnline, { once: true });
    return;
  }
  const delay = calcBackoffMs();
  if (timer) clearTimeout(timer);
  timer = window.setTimeout(refreshNow, delay);
}

export function setAccessExpEpochMs(expMs: number | null | undefined) {
  if (!expMs || typeof expMs !== 'number') return;
  nextExpMs = normalizeEpochMs(expMs);
  schedule();
}

async function refreshNow() {
  if (refreshing) return;
  refreshing = true;
  let ok = false;
  try {
    const resp = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    const json = await resp.json().catch(() => null);
    const isSuccess = resp && (resp as any).ok === true && json?.code === 1;
    ok = isSuccess;
    if (isSuccess) {
      const exp = json?.data?.accessExp;
      if (typeof exp === 'number') {
        nextExpMs = normalizeEpochMs(exp);
      }
    }
  } catch {
    // ignore, reactive 401 handler will manage logout
  } finally {
    refreshing = false;
    if (ok) failCount = 0;
    if (ok) {
      schedule();
    } else {
      scheduleBackoff();
    }
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

async function bootstrap() {
  if (typeof window === 'undefined') return;
  try {
    const resp = await fetch('/api/auth/me', { credentials: 'include' });
    const json = await resp.json().catch(() => null);
    const exp = json?.data?.accessExp;
    if (typeof exp === 'number') {
      nextExpMs = normalizeEpochMs(exp);
      schedule();
    }
  } catch {
    // ignore
  }
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
  if ((window as any).__proactiveRefreshStarted || started) return;
  (window as any).__proactiveRefreshStarted = true;
  started = true;
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
