import { useState, useEffect, useLayoutEffect } from 'react';

export type UrlStatus = 'checking' | 'accessible' | 'inaccessible' | 'unknown';

export interface UrlStatusInfo {
  status: UrlStatus;
  responseTime?: number;
  timestamp?: number;
  checked: boolean;
}

// Cache to store URL status results
const statusCache = new Map<string, UrlStatusInfo>();

// Cache expiration time (5 minutes in milliseconds)
const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;

// Load cache from localStorage on initialization
const loadCacheFromStorage = () => {
  try {
    const cachedData = localStorage.getItem('urlStatusCache');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const now = Date.now();

      // Only load non-expired entries
      for (const [url, cached] of Object.entries(parsedData)) {
        const cachedItem = cached as UrlStatusInfo;
        if (cachedItem.timestamp && now - cachedItem.timestamp < CACHE_EXPIRATION_TIME) {
          statusCache.set(url, cachedItem);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load URL status cache from localStorage:', error);
  }
};

// Save cache to localStorage
const saveCacheToStorage = () => {
  try {
    const cacheObject: Record<string, UrlStatusInfo> = {};
    for (const [url, cached] of statusCache.entries()) {
      cacheObject[url] = cached;
    }
    localStorage.setItem('urlStatusCache', JSON.stringify(cacheObject));
  } catch (error) {
    console.warn('Failed to save URL status cache to localStorage:', error);
  }
};

// Clean up expired cache entries
const cleanupExpiredCache = () => {
  const now = Date.now();
  let hasExpiredEntries = false;

  for (const [url, cached] of statusCache.entries()) {
    if (cached.timestamp && now - cached.timestamp >= CACHE_EXPIRATION_TIME) {
      statusCache.delete(url);
      hasExpiredEntries = true;
    }
  }

  // Save to localStorage if there were expired entries
  if (hasExpiredEntries) {
    saveCacheToStorage();
  }
};

// Save cache to localStorage whenever it changes
const saveCacheWithDebounce = (() => {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveCacheToStorage();
      timeoutId = null;
    }, 1000); // Debounce for 1 second
  };
})();

// Periodically clean up expired cache entries (every 5 minutes)
setInterval(cleanupExpiredCache, CACHE_EXPIRATION_TIME);

// Export cache for debugging
export const getUrlStatusCache = () => {
  return statusCache;
};

export const checkUrlAccessibility = async (url: string): Promise<UrlStatusInfo> => {
  // Check cache first
  if (statusCache.has(url)) {
    const cached = statusCache.get(url);
    // Return cached result if not expired
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_EXPIRATION_TIME) {
      return cached;
    }
    // Remove expired cache entry
    statusCache.delete(url);
  }

  const startTime = Date.now();

  // Try direct client-side HEAD request
  try {
    // Use a lightweight HEAD request to check accessibility directly from the browser
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'DoggyNav-StatusChecker/1.0',
      },
    });

    clearTimeout(timeoutId);

    const result: UrlStatusInfo = {
      status: response.ok ? 'accessible' : 'inaccessible',
      responseTime: Date.now() - startTime,
      timestamp: Date.now(),
      checked: true,
    };

    statusCache.set(url, result);
    saveCacheWithDebounce();
    return result;
  } catch (error) {
    // If it's a CORS or network error, try the backend proxy as fallback
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('CORS') || error.message.includes('Network'))) {
      console.warn(`Direct fetch failed for ${url}, trying backend proxy fallback`, error);

      try {
        // Fallback to backend proxy for CORS-restricted URLs (e.g., intranet URLs)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const backendResult = await response.json();

        const result: UrlStatusInfo = {
          status: backendResult.accessible ? 'accessible' : 'inaccessible',
          responseTime: backendResult.responseTime,
          timestamp: Date.now(),
          checked: true,
        };

        statusCache.set(url, result);
        saveCacheWithDebounce();
        return result;
      } catch (backendError) {
        console.warn(`Backend proxy also failed for ${url}`, backendError);
      }
    }

    // If both direct and fallback fail, mark as inaccessible
    const result: UrlStatusInfo = {
      status: 'inaccessible',
      responseTime: Date.now() - startTime,
      timestamp: Date.now(),
      checked: true,
    };

    statusCache.set(url, result);
    saveCacheWithDebounce();
    return result;
  }
};

export const useUrlStatus = (url: string, enabled = true) => {
  const [statusInfo, setStatusInfo] = useState<UrlStatusInfo>({
    status: 'unknown',
    checked: false,
  });
  useLayoutEffect(() => {
    // Load cache from localStorage on module initialization
    loadCacheFromStorage();
  }, [])

  useEffect(() => {
    if (!url || !enabled) return;

    setStatusInfo(prev => ({ ...prev, status: 'checking' }));

    checkUrlAccessibility(url).then(setStatusInfo);
  }, [url, enabled]);

  return statusInfo;
};