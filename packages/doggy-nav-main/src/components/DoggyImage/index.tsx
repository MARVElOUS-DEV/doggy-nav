import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import React from 'react';
import { getRandomFallbackIcon } from '@/utils/fallbackIcons';

interface DoggyImageProps {
  logo?: string;
  name?: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  [key: string]: any;
}

export default function DoggyImage({
  logo = getRandomFallbackIcon(),
  name = 'logo',
  width = 20,
  height = 20,
  className,
  fallbackSrc,
  ...rest
}: DoggyImageProps) {
  const [logoSrc, setLogoSrc] = useState(logo);

  const handleLogoError = () => {
    setLogoSrc(fallbackSrc ?? getRandomFallbackIcon());
  };
  return (
    <Image
      src={logoSrc}
      alt={name}
      width={width}
      height={height}
      className={className ?? `rounded-full mr-2 flex-shrink-0 object-cover`}
      style={{ width: `${width}px`, height: `${height}px` }}
      onError={handleLogoError}
      {...rest}
    />
  );
}

interface DynamicIconProps {
  iconName?: string;
  fontSize?: number;
}

export const DynamicIcon = ({ iconName, fontSize = 14 }: DynamicIconProps): JSX.Element | null => {
  if (!iconName) return null;
  if (iconName.startsWith('type:emoji_')) {
    const emoji = iconName.replace('type:emoji_', '');
    return <span style={{ fontSize: `${fontSize}px` }}>{emoji}</span>;
  }
  if (iconName.startsWith('type:arco_')) {
    const arcoIconName = iconName.replace('type:arco_', '');
    const IconComponent = dynamic(
      () =>
        import(`@arco-design/web-react/icon`).then((module: any) => {
          if (module[arcoIconName]) {
            return { default: module[arcoIconName] };
          }
          throw new Error(`Icon ${arcoIconName} not found`);
        }),
      { ssr: false }
    ) as unknown as React.JSX.ElementType;
    return (
      <React.Suspense fallback="...">
        <IconComponent style={{ fontSize, height: 40 }} />
      </React.Suspense>
    );
  }
  return (
    <Image
      style={{ fontSize: `${fontSize}px` }}
      height={fontSize}
      width={fontSize}
      src={iconName}
      alt=""
    />
  );
};
