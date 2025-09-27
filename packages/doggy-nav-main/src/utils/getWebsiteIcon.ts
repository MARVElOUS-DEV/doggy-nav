import React from "react";
/**
 * Utility function to get a website's favicon/icon
 * @param url - The website URL
 * @returns The favicon URL or a fallback icon URL
 */
export function getWebsiteIcon(url: string): string {
  try {
    // Handle cases where url might be null, undefined or empty
    if (!url) {
      return '/favicon.ico'; // fallback to default favicon
    }

    // Create URL object to properly parse the URL
    const urlObj = new URL(url);

    // Try multiple common favicon locations
    // Return favicon URL using the website's domain
    return `${urlObj.origin}/favicon.ico`;
  } catch (error) {
    // If URL parsing fails, return fallback icon
    console.warn('Failed to parse URL for favicon:', url, error);
    return '/favicon.ico';
  }
}

/**
 * Alternative method that constructs favicon URL using a third-party service
 * @param url - The website URL
 * @param size - The preferred size of the favicon (default: 16)
 * @returns The favicon URL from a third-party service
 */
export function getWebsiteIconFromService(url: string, size = 16): string {
  try {
    // Handle cases where url might be null, undefined or empty
    if (!url) {
      return '/favicon.ico';
    }

    // Validate URL format
    new URL(url);

    // Using a favicon service (Google's favicon service as an example)
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=${size}`;
  } catch (error) {
    console.warn('Failed to construct favicon service URL:', url, error);
    return '/favicon.ico';
  }
}

export const getIconComponent = (iconName: string, fontSize = 14): React.ReactNode | string | null => {
  try {
    if (!iconName) return null;
    if (iconName.startsWith('type:emoji_')) {
      const emoji = iconName.replace('type:emoji_', '');
      return React.createElement('span', { style: { fontSize: `${fontSize}px` } }, emoji);
    }
    if (iconName.startsWith('type:arco_')) {
      const arcoIconName = iconName.replace('type:arco_', '');
      const IconComponent = React.lazy(() => import('@arco-design/web-react/icon').then((module: any) => {
          if (module[arcoIconName]) {
            return { default: module[arcoIconName] };
          }
          throw new Error(`Icon ${arcoIconName} not found`);
        })
      );
      return React.createElement(
        React.Suspense,
        { fallback: React.createElement('span', { style: { fontSize: `${fontSize}px` } }, '...') },
        React.createElement(
          IconComponent,
          { style: { fontSize: fontSize, marginRight: '4px' } } as React.ComponentProps<any>
        )
      );
    }
    return React.createElement('span', { style: { fontSize: `${fontSize}px` } }, iconName);
  } catch (error) {
    return null;
  }
};

export default getWebsiteIcon;