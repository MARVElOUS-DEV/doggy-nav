import React from "react";

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
        React.createElement(IconComponent, { style: { fontSize: `${fontSize}px`,width: `${fontSize}px`, marginRight: '4px' } })
      );
    }
    return React.createElement('span', { style: { fontSize: `${fontSize}px` } }, iconName);
  } catch (error) {
    return null;
  }
};