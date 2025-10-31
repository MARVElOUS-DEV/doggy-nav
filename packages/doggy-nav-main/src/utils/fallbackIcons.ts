/**
 * Utility function to get a random fallback icon from the available fallback icons
 * @returns A random fallback icon path
 */
export function getRandomFallbackIcon(): string {
  const fallbackCount = 14;
  const randomIndex = Math.floor(Math.random() * fallbackCount) + 1;
  return `/fallback-web/icons8-web-100-${randomIndex}.png`;
}