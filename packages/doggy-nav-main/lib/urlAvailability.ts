export interface UrlAvailabilityResult {
  accessible: boolean;
  status: number;
  responseTime: number;
  checkedVia: 'HEAD' | 'GET';
}

interface ProbeOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  init?: Omit<RequestInit, 'method' | 'signal'>;
}

const AUTH_PROTECTED_STATUSES = new Set([401, 403]);
const GET_FALLBACK_STATUSES = new Set([404, 405, 501]);

const isAccessibleStatus = (status: number) =>
  (status >= 200 && status < 400) || AUTH_PROTECTED_STATUSES.has(status);

const shouldRetryWithGet = (status: number) => GET_FALLBACK_STATUSES.has(status);

const probeOnce = async (
  url: string,
  method: 'HEAD' | 'GET',
  fetchImpl: typeof fetch,
  timeoutMs: number,
  init?: Omit<RequestInit, 'method' | 'signal'>,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      ...init,
      method,
      signal: controller.signal,
      redirect: init?.redirect ?? 'follow',
      cache: init?.cache ?? 'no-store',
    });

    if (method === 'GET') {
      void response.body?.cancel()?.catch(() => undefined);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const probeUrlAvailability = async (
  url: string,
  options: ProbeOptions = {},
): Promise<UrlAvailabilityResult> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;
  const startTime = Date.now();

  const headResponse = await probeOnce(url, 'HEAD', fetchImpl, timeoutMs, options.init);
  if (!shouldRetryWithGet(headResponse.status)) {
    return {
      accessible: isAccessibleStatus(headResponse.status),
      status: headResponse.status,
      responseTime: Date.now() - startTime,
      checkedVia: 'HEAD',
    };
  }

  const getResponse = await probeOnce(url, 'GET', fetchImpl, timeoutMs, options.init);
  return {
    accessible: isAccessibleStatus(getResponse.status),
    status: getResponse.status,
    responseTime: Date.now() - startTime,
    checkedVia: 'GET',
  };
};
