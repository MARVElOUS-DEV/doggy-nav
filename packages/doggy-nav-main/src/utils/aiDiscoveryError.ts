export type AiDiscoveryFailure =
  | 'auth'
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'unavailable'
  | 'invalid'
  | 'empty'
  | 'unknown';

export function getAiDiscoveryFailure(error: unknown): AiDiscoveryFailure {
  const code = Number((error as { code?: unknown })?.code);
  if (code === 401 || code === 403) return 'auth';
  if (code === 408 || code === 504) return 'timeout';
  if (code === 429) return 'rate_limit';
  if (code === 502) return 'invalid';
  if (code === 503) return 'unavailable';
  if (code === 0) return 'network';
  return 'unknown';
}
