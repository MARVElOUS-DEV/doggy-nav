const FALLBACK_REDIRECT = '/';
const UNSAFE_PATH_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

export function getSafeAuthRedirect(
  redirect: string | string[] | undefined,
  fallback = FALLBACK_REDIRECT
): string {
  const candidate = Array.isArray(redirect) ? redirect[0] : redirect;

  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    UNSAFE_PATH_CHARACTERS.test(candidate)
  ) {
    return fallback;
  }

  const queryIndex = candidate.indexOf('?');
  const hashIndex = candidate.indexOf('#');
  const pathnameEnd = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .reduce((earliest, index) => Math.min(earliest, index), candidate.length);

  try {
    const pathname = decodeURIComponent(candidate.slice(0, pathnameEnd));

    if (
      pathname.startsWith('//') ||
      UNSAFE_PATH_CHARACTERS.test(pathname) ||
      pathname === '/login' ||
      pathname.startsWith('/login/')
    ) {
      return fallback;
    }

    return candidate;
  } catch {
    return fallback;
  }
}
