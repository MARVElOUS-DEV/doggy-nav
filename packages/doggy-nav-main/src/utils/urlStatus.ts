import { useState, useEffect } from 'react';

export type UrlStatus = 'checking' | 'accessible' | 'inaccessible' | 'unknown';

export interface UrlStatusInfo {
  status: UrlStatus;
  responseTime?: number;
  checked: boolean;
}

// Cache to store URL status results
const statusCache = new Map<string, UrlStatusInfo>();

export const checkUrlAccessibility = async (url: string): Promise<UrlStatusInfo> => {
  // Check cache first
  if (statusCache.has(url)) {
    const cached = statusCache.get(url);
    // Return cached result if checked within last 5 minutes
    if (cached && Date.now() - (cached.responseTime || 0) < 5 * 60 * 1000) {
      return cached;
    }
  }

  const startTime = Date.now();

  try {
    // Use a lightweight HEAD request to check accessibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    const result: UrlStatusInfo = {
      status: response.ok ? 'accessible' : 'inaccessible',
      responseTime,
      checked: true,
    };

    statusCache.set(url, result);
    return result;
  } catch (error) {
    const result: UrlStatusInfo = {
      status: 'inaccessible',
      responseTime: Date.now() - startTime,
      checked: true,
    };

    statusCache.set(url, result);
    return result;
  }
};

export const useUrlStatus = (url: string) => {
  const [statusInfo, setStatusInfo] = useState<UrlStatusInfo>({
    status: 'unknown',
    checked: false,
  });

  useEffect(() => {
    if (!url) return;

    setStatusInfo(prev => ({ ...prev, status: 'checking' }));

    checkUrlAccessibility(url).then(setStatusInfo);
  }, [url]);

  return statusInfo;
};