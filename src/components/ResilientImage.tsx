import { useState } from 'react';
import { Gift } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF5F9] via-[#FCE4EE] to-[#FADAE7] text-[#5E3E4B] p-6 text-center"
      >
        <Gift className="w-7 h-7 text-[#C2255C] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide text-[#2B121D]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
