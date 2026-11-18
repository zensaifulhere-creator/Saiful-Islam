import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { isFirestoreMediaRef, loadGalleryImageMedia } from '../lib/heroMedia';

interface OccasionImageProps {
  primarySrc: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function OccasionImage({
  primarySrc,
  fallbackSrc,
  alt,
  className = '',
  loading = 'eager',
}: OccasionImageProps) {
  const [resolvedPrimary, setResolvedPrimary] = useState<string>(() =>
    isFirestoreMediaRef(primarySrc) ? '' : primarySrc
  );
  const [resolvedFallback, setResolvedFallback] = useState<string>(() =>
    isFirestoreMediaRef(fallbackSrc) ? '' : fallbackSrc
  );
  const [stage, setStage] = useState<'loading' | 'primary' | 'fallback' | 'empty'>(() =>
    isFirestoreMediaRef(primarySrc) ? 'loading' : 'primary'
  );

  useEffect(() => {
    let cancelled = false;

    const resolveSources = async () => {
      const nextFallback = isFirestoreMediaRef(fallbackSrc)
        ? (await loadGalleryImageMedia(fallbackSrc)) || ''
        : fallbackSrc;

      if (cancelled) return;
      setResolvedFallback(nextFallback);

      if (isFirestoreMediaRef(primarySrc)) {
        setStage('loading');
        const imgUrl = await loadGalleryImageMedia(primarySrc);
        if (cancelled) return;
        if (imgUrl) {
          setResolvedPrimary(imgUrl);
          setStage('primary');
        } else if (nextFallback) {
          setResolvedPrimary('');
          setStage('fallback');
        } else {
          setStage('empty');
        }
      } else {
        setResolvedPrimary(primarySrc);
        setStage(primarySrc ? 'primary' : nextFallback ? 'fallback' : 'empty');
      }
    };

    void resolveSources();
    return () => {
      cancelled = true;
    };
  }, [primarySrc, fallbackSrc]);

  const handleError = () => {
    if (stage === 'primary' && resolvedFallback && resolvedFallback !== resolvedPrimary) {
      setStage('fallback');
    } else {
      setStage('empty');
    }
  };

  if (stage === 'loading') {
    return (
      <div
        className={`bg-gradient-to-br from-[#F7FBFD] via-[#E9F2F7] to-[#D6E6EF] animate-pulse ${className}`}
        role="img"
        aria-label={alt}
      />
    );
  }

  if (stage === 'empty') {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F7FBFD] via-[#E9F2F7] to-[#D6E6EF] text-[#5A6F7D] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Camera className="w-7 h-7 text-[#7FA6B8] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#2A3E4B] max-w-[200px] leading-snug">{alt}</span>
      </div>
    );
  }

  const activeSrc = stage === 'fallback' ? resolvedFallback : resolvedPrimary;

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}
