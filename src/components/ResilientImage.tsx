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
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EFE9] via-[#EAE3DA] to-[#E2D6D1] text-[#6E6560] p-6 text-center"
      >
        <Gift className="w-7 h-7 text-[#7A2E4D] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide text-[#3D3531]">
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
