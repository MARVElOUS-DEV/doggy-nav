export const chromeMicroToISO = (chromeTime?: number | string) => {
  if (chromeTime === undefined || chromeTime === null) return undefined;
  const n = typeof chromeTime === 'string' ? Number(chromeTime) : chromeTime;
  if (!Number.isFinite(n)) return undefined;
  const unixMs = ((n / 1_000_000) - 11644473600) * 1000;
  const date = new Date(unixMs);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
};
