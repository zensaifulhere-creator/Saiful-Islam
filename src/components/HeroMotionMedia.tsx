import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  getGifLoopDurationMs,
  HeroMediaKind,
  HeroMediaSource,
  isValidHttpMediaUrl,
  loadUploadedHeroMedia,
} from '../lib/heroMedia';

interface BrowserImageDecoderFrame {
  image: CanvasImageSource & {
    displayWidth?: number;
    displayHeight?: number;
    codedWidth?: number;
    codedHeight?: number;
    duration?: number | null;
    close?: () => void;
  };
  complete: boolean;
}

interface BrowserImageDecoder {
  tracks: {
    ready: Promise<void>;
    selectedTrack: { frameCount: number } | null;
  };
  decode: (opts: { frameIndex: number }) => Promise<BrowserImageDecoderFrame>;
  close?: () => void;
}

type ImageDecoderCtor = new (init: {
  data: BufferSource;
  type: string;
}) => BrowserImageDecoder;

function getImageDecoderCtor(): ImageDecoderCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { ImageDecoder?: ImageDecoderCtor };
  return typeof w.ImageDecoder === 'function' ? w.ImageDecoder : null;
}

function drawCoverTop(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number
) {
  if (!srcW || !srcH || !targetW || !targetH) return;
  const scale = Math.max(targetW / srcW, targetH / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const offsetX = (targetW - drawW) / 2;
  const offsetY = 0; // Matches CSS object-cover object-top framing
  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(source, offsetX, offsetY, drawW, drawH);
}

interface HeroMotionMediaProps {
  source: HeroMediaSource;
  kind: HeroMediaKind;
  mediaUrl: string;
  uploadId: string;
  isActive: boolean;
  replayNonce?: number;
  alt: string;
  posterFallback: ReactNode;
  onPlaybackState?: (state: 'idle' | 'loading' | 'playing' | 'ended' | 'error') => void;
}

export function HeroMotionMedia({
  source,
  kind,
  mediaUrl,
  uploadId,
  isActive,
  replayNonce = 0,
  alt,
  posterFallback,
  onPlaybackState,
}: HeroMotionMediaProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [resolvedKind, setResolvedKind] = useState<HeroMediaKind>(kind);
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [gifBuffer, setGifBuffer] = useState<ArrayBuffer | null>(null);
  const [gifFallbackSrc, setGifFallbackSrc] = useState<string>('');
  const [gifCanvasFrozen, setGifCanvasFrozen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFallbackRef = useRef<HTMLImageElement | null>(null);

  const wasAwayRef = useRef(false);
  const hasPlayedInitialRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const lastMediaSigRef = useRef('');
  const onPlaybackStateRef = useRef(onPlaybackState);
  onPlaybackStateRef.current = onPlaybackState;

  const mediaSignature = `${source}|${kind}|${mediaUrl}|${uploadId}`;

  // 1. Resolve uploaded chunks or external link into playable local state
  useEffect(() => {
    let cancelled = false;
    let ownedObjectUrl = '';

    setIsReady(false);
    setHasError(false);
    setGifBuffer(null);
    setGifCanvasFrozen(false);
    setGifFallbackSrc('');

    if (source === 'none') {
      setResolvedUrl('');
      setPosterUrl('');
      onPlaybackStateRef.current?.('idle');
      return;
    }

    if (source === 'url') {
      const cleanUrl = mediaUrl.trim();
      if (!isValidHttpMediaUrl(cleanUrl)) {
        setResolvedUrl('');
        setHasError(true);
        onPlaybackStateRef.current?.('error');
        return;
      }

      setResolvedKind(kind);
      setResolvedUrl(cleanUrl);
      setPosterUrl('');

      if (kind === 'gif') {
        onPlaybackStateRef.current?.('loading');
        fetch(cleanUrl, { mode: 'cors' })
          .then((res) => {
            if (!res.ok) throw new Error('GIF fetch failed');
            return res.arrayBuffer();
          })
          .then((buf) => {
            if (cancelled) return;
            setGifBuffer(buf);
          })
          .catch(() => {
            // Remote host may block CORS bytes; fallback cleanly to <img> GIF mode
            if (cancelled) return;
            setGifBuffer(null);
            setGifFallbackSrc(cleanUrl);
          });
      } else {
        onPlaybackStateRef.current?.('loading');
      }

      return () => {
        cancelled = true;
      };
    }

    // source === 'upload'
    if (!uploadId) {
      setResolvedUrl('');
      onPlaybackStateRef.current?.('idle');
      return;
    }

    onPlaybackStateRef.current?.('loading');
    loadUploadedHeroMedia(uploadId)
      .then(async (loaded) => {
        if (cancelled) {
          if (loaded?.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
          return;
        }
        if (!loaded) {
          setHasError(true);
          onPlaybackStateRef.current?.('error');
          return;
        }
        ownedObjectUrl = loaded.objectUrl;
        setResolvedKind(loaded.mediaKind);
        setPosterUrl(loaded.posterDataUrl);
        setResolvedUrl(loaded.objectUrl);

        if (loaded.mediaKind === 'gif') {
          const buf = await loaded.blob.arrayBuffer();
          if (cancelled) return;
          setGifBuffer(buf);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setHasError(true);
        onPlaybackStateRef.current?.('error');
      });

    return () => {
      cancelled = true;
      if (ownedObjectUrl) {
        URL.revokeObjectURL(ownedObjectUrl);
      }
    };
  }, [source, kind, mediaUrl, uploadId]);

  // 2. Track Hero enter / exit / scroll-back / manual replay triggers
  useEffect(() => {
    if (lastMediaSigRef.current !== mediaSignature) {
      lastMediaSigRef.current = mediaSignature;
      hasPlayedInitialRef.current = false;
      wasAwayRef.current = false;
    }

    if (!isActive) {
      wasAwayRef.current = true;
      const vid = videoRef.current;
      if (vid && !vid.paused) {
        vid.pause();
      }
      return;
    }

    if (!hasPlayedInitialRef.current || wasAwayRef.current) {
      hasPlayedInitialRef.current = true;
      wasAwayRef.current = false;
      setPlayTrigger((n) => n + 1);
    }
  }, [isActive, mediaSignature]);

  useEffect(() => {
    if (replayNonce > 0 && isActive) {
      setPlayTrigger((n) => n + 1);
    }
  }, [replayNonce, isActive]);

  // Helper: Start MP4 playback cleanly from frame 0
  const startVideoOnce = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !resolvedUrl || resolvedKind !== 'mp4') return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      vid.pause();
      setIsReady(true);
      onPlaybackStateRef.current?.('ended');
      return;
    }

    try {
      if (vid.readyState >= 1) {
        vid.currentTime = 0;
      }
      const p = vid.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          onPlaybackStateRef.current?.('playing');
        }).catch(() => {
          // Fallback silently if browser blocks autoplay
          setIsReady(true);
        });
      } else {
        onPlaybackStateRef.current?.('playing');
      }
    } catch {
      setIsReady(true);
    }
  }, [resolvedUrl, resolvedKind]);

  // 3. MP4 play-once trigger
  useEffect(() => {
    if (resolvedKind !== 'mp4' || !resolvedUrl || !isActive || playTrigger === 0) return;

    const vid = videoRef.current;
    if (!vid) return;

    if (vid.readyState >= 2) {
      pendingPlayRef.current = false;
      startVideoOnce();
    } else {
      pendingPlayRef.current = true;
    }
  }, [resolvedKind, resolvedUrl, isActive, playTrigger, startVideoOnce]);

  // 4. GIF play-once + freeze-final-frame engine
  useEffect(() => {
    if (resolvedKind !== 'gif' || !resolvedUrl || !isActive || playTrigger === 0) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    let timerId: number | null = null;
    let decoder: BrowserImageDecoder | null = null;
    let tempBlobUrl = '';

    const paintCanvasSource = (
      src: CanvasImageSource,
      srcW: number,
      srcH: number
    ) => {
      const canvas = canvasRef.current;
      const box = containerRef.current;
      if (!canvas || !box) return;
      const rect = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawCoverTop(ctx, src, srcW, srcH, targetW, targetH);
    };

    const run = async () => {
      const ImageDecoderApi = getImageDecoderCtor();

      // Path A: Exact frame-by-frame canvas playback with ImageDecoder
      if (gifBuffer && ImageDecoderApi) {
        try {
          decoder = new ImageDecoderApi({
            data: gifBuffer.slice(0),
            type: 'image/gif',
          });
          await decoder.tracks.ready;
          if (cancelled) return;

          const frameCount = Math.max(1, decoder.tracks.selectedTrack?.frameCount ?? 1);
          setGifCanvasFrozen(true);

          if (reduceMotion) {
            const first = await decoder.decode({ frameIndex: 0 });
            if (cancelled) {
              first.image.close?.();
              return;
            }
            const w = first.image.displayWidth || first.image.codedWidth || 1;
            const h = first.image.displayHeight || first.image.codedHeight || 1;
            paintCanvasSource(first.image, w, h);
            first.image.close?.();
            setIsReady(true);
            onPlaybackStateRef.current?.('ended');
            return;
          }

          onPlaybackStateRef.current?.('playing');

          const step = async (idx: number) => {
            if (cancelled || !decoder) return;
            try {
              const res = await decoder.decode({ frameIndex: idx });
              if (cancelled) {
                res.image.close?.();
                return;
              }
              const w = res.image.displayWidth || res.image.codedWidth || 1;
              const h = res.image.displayHeight || res.image.codedHeight || 1;
              paintCanvasSource(res.image, w, h);
              const durationUs = res.image.duration ?? 100_000;
              res.image.close?.();
              setIsReady(true);

              if (idx + 1 >= frameCount) {
                // Reached final frame: stop cleanly & remain frozen on final frame
                onPlaybackStateRef.current?.('ended');
                return;
              }

              const delayMs = Math.max(20, Math.round(durationUs / 1000));
              timerId = window.setTimeout(() => {
                void step(idx + 1);
              }, delayMs);
            } catch {
              if (!cancelled) {
                onPlaybackStateRef.current?.('ended');
              }
            }
          };

          void step(0);
          return;
        } catch {
          decoder?.close?.();
          decoder = null;
        }
      }

      // Path B: Buffer available without ImageDecoder (Safari/Firefox upload or CORS GIF)
      if (gifBuffer) {
        const totalMs = getGifLoopDurationMs(gifBuffer);
        tempBlobUrl = URL.createObjectURL(
          new Blob([gifBuffer], { type: 'image/gif' })
        );
        setGifCanvasFrozen(false);
        setGifFallbackSrc(tempBlobUrl);
        setIsReady(true);

        if (reduceMotion) {
          onPlaybackStateRef.current?.('ended');
          return;
        }

        onPlaybackStateRef.current?.('playing');
        timerId = window.setTimeout(() => {
          if (cancelled) return;
          const img = imgFallbackRef.current;
          if (img && img.naturalWidth > 0) {
            paintCanvasSource(img, img.naturalWidth, img.naturalHeight);
            setGifCanvasFrozen(true);
          }
          onPlaybackStateRef.current?.('ended');
        }, Math.max(200, totalMs - 25));
        return;
      }

      // Path C: Cross-origin remote GIF where host disallows reading bytes
      if (resolvedUrl) {
        setGifCanvasFrozen(false);
        const sep = resolvedUrl.includes('?') ? '&' : '?';
        setGifFallbackSrc(`${resolvedUrl}${sep}_heroPlay=${playTrigger}`);
        onPlaybackStateRef.current?.('playing');
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      decoder?.close?.();
      if (tempBlobUrl) URL.revokeObjectURL(tempBlobUrl);
    };
  }, [resolvedKind, resolvedUrl, gifBuffer, isActive, playTrigger]);

  if (source === 'none' || !resolvedUrl || hasError) {
    return <>{posterFallback}</>;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Base fallback/poster portrait layer so there is never an empty flash */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={alt}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          posterFallback
        )}
      </div>

      {resolvedKind === 'mp4' ? (
        <video
          ref={videoRef}
          src={resolvedUrl}
          poster={posterUrl || undefined}
          muted
          playsInline
          preload="auto"
          aria-label={alt}
          onLoadedData={() => {
            setIsReady(true);
            if (pendingPlayRef.current && isActive) {
              pendingPlayRef.current = false;
              startVideoOnce();
            }
          }}
          onCanPlay={() => {
            setIsReady(true);
            if (pendingPlayRef.current && isActive) {
              pendingPlayRef.current = false;
              startVideoOnce();
            }
          }}
          onEnded={() => {
            onPlaybackState?.('ended');
          }}
          onError={() => {
            setHasError(true);
            onPlaybackState?.('error');
          }}
          className={`relative z-10 w-full h-full object-cover object-top transition-opacity duration-300 ${
            isReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            aria-label={alt}
            className={`relative z-10 w-full h-full block transition-opacity duration-200 ${
              gifCanvasFrozen && isReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
          {!gifCanvasFrozen && gifFallbackSrc && (
            <img
              ref={imgFallbackRef}
              src={gifFallbackSrc}
              alt={alt}
              referrerPolicy="no-referrer"
              onLoad={() => setIsReady(true)}
              onError={() => {
                setHasError(true);
                onPlaybackState?.('error');
              }}
              className={`absolute inset-0 z-10 w-full h-full object-cover object-top transition-opacity duration-200 ${
                isReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </>
      )}
    </div>
  );
}
