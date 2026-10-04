type AuthSessionRefreshListener = () => void;

const listeners = new Set<AuthSessionRefreshListener>();
let revision = 0;

export function getAuthSessionRevision() {
  return revision;
}

export function subscribeToAuthSessionRefresh(listener: AuthSessionRefreshListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishAuthSessionRefresh() {
  revision += 1;
  for (const listener of [...listeners]) {
    listener();
  }
}
