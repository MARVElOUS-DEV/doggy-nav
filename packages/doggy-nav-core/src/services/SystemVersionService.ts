import type { SystemVersionConfig, SystemVersionInfo } from '../types/systemVersion';

export async function resolveSystemVersionInfo(
  config: SystemVersionConfig
): Promise<SystemVersionInfo> {
  const {
    enabled = true,
    repoSlug,
    githubToken,
    currentCommitId = null,
    currentCommitTime: providedCurrentCommitTime = null,
    timeoutMs = 5000,
    fetchImpl,
  } = config;

  const base: SystemVersionInfo = {
    currentCommitId,
    currentCommitTime: providedCurrentCommitTime,
    latestCommitId: null,
    latestCommitTime: null,
    hasNewVersion: false,
    checkedAt: new Date().toISOString(),
  };

  if (!enabled) {
    return base;
  }

  if (!repoSlug) {
    return { ...base, error: 'REPO_NOT_CONFIGURED' };
  }

  const fn =
    fetchImpl ||
    (typeof (globalThis as any).fetch === 'function'
      ? (globalThis as any).fetch.bind(globalThis)
      : undefined);

  if (!fn) {
    return { ...base, error: 'FETCH_NOT_AVAILABLE' };
  }

  let latestCommitId: string | null = null;
  let latestCommitTime: string | null = null;
  let currentCommitTime: string | null = providedCurrentCommitTime;
  let error: string | undefined;

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'doggy-nav',
      Accept: 'application/vnd.github+json',
    };
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

    const ControllerCtor = (globalThis as any).AbortController as
      | (new () => AbortController)
      | undefined;
    const controller = ControllerCtor ? new ControllerCtor() : undefined;
    const signal = controller?.signal;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

    try {
      const latestResp = await fn(`https://api.github.com/repos/${repoSlug}/commits?per_page=1`, {
        method: 'GET',
        headers,
        signal,
      });
      const latestJson = await latestResp.json();
      const latest = Array.isArray(latestJson) ? latestJson[0] : null;
      if (latest) {
        latestCommitId = typeof latest.sha === 'string' ? latest.sha : null;
        latestCommitTime =
          latest?.commit?.committer?.date && typeof latest.commit.committer.date === 'string'
            ? latest.commit.committer.date
            : null;
      }

      if (currentCommitId && !currentCommitTime) {
        if (currentCommitId === latestCommitId && latestCommitTime) {
          currentCommitTime = latestCommitTime;
        } else {
          const currentResp = await fn(
            `https://api.github.com/repos/${repoSlug}/commits/${currentCommitId}`,
            { method: 'GET', headers, signal } as any
          );
          const currentJson = await currentResp.json();
          currentCommitTime =
            currentJson?.commit?.committer?.date &&
            typeof currentJson.commit.committer.date === 'string'
              ? currentJson.commit.committer.date
              : null;
        }
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch {
    error = 'FETCH_FAILED';
  }

  let hasNewVersion = false;

  if (currentCommitId && latestCommitId && currentCommitId !== latestCommitId) {
    if (currentCommitTime && latestCommitTime) {
      const currentTs = Date.parse(currentCommitTime);
      const latestTs = Date.parse(latestCommitTime);
      if (!Number.isNaN(currentTs) && !Number.isNaN(latestTs)) {
        hasNewVersion = latestTs > currentTs;
      } else {
        hasNewVersion = true;
      }
    } else {
      hasNewVersion = true;
    }
  }

  return {
    currentCommitId,
    currentCommitTime,
    latestCommitId,
    latestCommitTime,
    hasNewVersion,
    checkedAt: base.checkedAt,
    ...(error ? { error } : {}),
  };
}
