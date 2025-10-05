import { useState } from "react";
import Image from 'next/image';
import dynamic from "next/dynamic";
import React from "react";

interface DoggyImageProps {
  logo?: string;
  name?: string;
  width?: number;
  height?: number;
  className?: string
  fallbackSrc?: string
}

export default function DoggyImage({logo="/default-web.png", name="logo", width=20, height=20 ,className, fallbackSrc}: DoggyImageProps) {
  const [logoSrc, setLogoSrc] = useState(logo);
  const handleLogoError = () => {
    setLogoSrc(fallbackSrc??'/default-web.png');
  };
  return (
    <Image
      src={logoSrc}
      alt={name}
      width={width}
      height={height}
      className={className??`rounded-full mr-2 flex-shrink-0 w-[${width}px] h-[${height}px] object-cover`}
      onError={handleLogoError}
    />
  )
}

interface DynamicIconProps {
  iconName?: string;
  fontSize?: number;
}

export const DynamicIcon = ({iconName, fontSize=14}: DynamicIconProps): JSX.Element | null => {
    if (!iconName) return null;
    if (iconName.startsWith('type:emoji_')) {
      const emoji = iconName.replace('type:emoji_', '');
      return <span style= {{ fontSize: `${fontSize}px` }}>{emoji}</span>;
    }
    if (iconName.startsWith('type:arco_')) {
      const IconComponent = dynamic(() => import(`@arco-design/web-react/icon`).then((module: any) => {
          if (module[iconName]) {
            return { default: module[iconName] };
          }
          throw new Error(`Icon ${iconName} not found`);
        }), { ssr: false }) as unknown as React.JSX.ElementType
      return (
        <React.Suspense fallback ='...'>
          <IconComponent style={{fontSize}}/>
        </React.Suspense>
      )
    }
    return <Image style={{ fontSize: `${fontSize}px` }} height={fontSize} width={fontSize} src={iconName} alt="" />;
}