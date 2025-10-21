let timer: any = null;
let nextExpMs: number | null = null;
let refreshing = false;

const LEEWAY_MS = 90 * 1000; // 90s

export function setAccessExpEpochMs(expMs: number | null | undefined) {
  if (!expMs || typeof expMs !== 'number') return;
  nextExpMs = expMs;
  schedule();
}

async function refreshNow() {
  if (refreshing) return;
  refreshing = true;
  try {
    const resp = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    const json = await resp.json().catch(() => null);
    const exp = json?.data?.accessExp;
    if (typeof exp === 'number') {
      nextExpMs = exp;
    }
  } catch {
    // ignore, reactive 401 handler will manage logout
  } finally {
    refreshing = false;
    schedule();
  }
}

function schedule() {
  if (typeof window === 'undefined') return;
  if (!nextExpMs) return;
  const now = Date.now();
  const delay = Math.max(0, nextExpMs - now - LEEWAY_MS);
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
      nextExpMs = exp;
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
  bootstrap();
  window.addEventListener('focus', onVisibilityOrFocus);
  document.addEventListener('visibilitychange', onVisibilityOrFocus);
}
