/**
 * Chrome time conversion utilities
 * Chrome uses FILETIME format: 64-bit value representing the number of 100-nanosecond intervals since January 1, 1601 UTC
 * Unix time: seconds since January 1, 1970 UTC
 * Difference: 11644473600 seconds (from 1601 to 1970)
 */

export const chromeTimeToDate = (chromeTime: number): Date | null => {
  if (!chromeTime || typeof chromeTime !== 'number') {
    return null;
  }
  const chromeEpochStart = 11644473600; // 秒
  const unixTimestamp = (chromeTime / 1000000) - chromeEpochStart;

  return new Date(unixTimestamp * 1000);
};

export const dateToChromeTime = (date: Date): number => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date parameter');
  }

  const chromeEpochStart = 11644473600; // 秒
  const unixTimestamp = Math.floor(date.getTime() / 1000);
  return (unixTimestamp + chromeEpochStart) * 1000000;
};

export const isValidChromeTime = (chromeTime: any): boolean => {
  return typeof chromeTime === 'number' && chromeTime > 0;
};

export const nowToChromeTime = (): number => {
  return dateToChromeTime(new Date());
};
