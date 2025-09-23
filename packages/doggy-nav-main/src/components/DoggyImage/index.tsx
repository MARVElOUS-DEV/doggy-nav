import { useState } from "react";
import Image from 'next/image';

export default ({logo="/default-web.png", name="logo", width=20, height=20}) => {
  const [logoSrc, setLogoSrc] = useState(logo);
  const handleLogoError = () => {
    setLogoSrc('/default-web.png');
  };
  return (
    <Image
      src={logoSrc}
      alt={name}
      width={width}
      height={height}
      className="rounded-full mr-2 flex-shrink-0"
      onError={handleLogoError}
    />
  )
}