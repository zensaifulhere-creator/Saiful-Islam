import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export type HeroMediaKind = 'mp4' | 'gif';
export type HeroMediaSource = 'none' | 'upload' | 'url';

export const HERO_MEDIA_MAX_CHUNKS = 12;
export const HERO_CHUNK_RAW_BYTES = 450_000; // ~600k base64 chars (< 700k Firestore rule limit)
export const HERO_MEDIA_MAX_BYTES = HERO_MEDIA_MAX_CHUNKS * HERO_CHUNK_RAW_BYTES; // 5.4 MB binary
export const HERO_MEDIA_MAX_MB_LABEL = '5.1 MB';

export interface HeroMediaManifest {
  uploadId: string;
  mimeType: string;
  mediaKind: HeroMediaKind;
  chunkCount: number;
  byteSize: number;
  posterDataUrl?: string;
}

export interface LoadedHeroMedia {
  uploadId: string;
  objectUrl: string;
  blob: Blob;
  mimeType: string;
  mediaKind: HeroMediaKind;
  posterDataUrl: string;
}

export function detectHeroMediaFileInfo(file: File): { kind: HeroMediaKind; mimeType: string } {
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (type === 'image/gif' || name.endsWith('.gif')) {
    return { kind: 'gif', mimeType: 'image/gif' };
  }
  if (type === 'video/mp4' || name.endsWith('.mp4')) {
    return { kind: 'mp4', mimeType: 'video/mp4' };
  }
  if (type === 'video/webm' || name.endsWith('.webm')) {
    return { kind: 'mp4', mimeType: 'video/webm' };
  }
  if (type === 'video/quicktime' || name.endsWith('.mov')) {
    return { kind: 'mp4', mimeType: 'video/mp4' };
  }

  throw new Error('Please choose an MP4, WebM, MOV, or animated GIF file.');
}

export function inferHeroMediaKindFromUrl(rawUrl: string): HeroMediaKind {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.pathname.toLowerCase().endsWith('.gif')) return 'gif';
    return 'mp4';
  } catch {
    return rawUrl.toLowerCase().includes('.gif') ? 'gif' : 'mp4';
  }
}

export function isValidHttpMediaUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  const sliceLen = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += sliceLen) {
    const sub = bytes.subarray(i, Math.min(i + sliceLen, bytes.length));
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function drawCanvasPoster(
  source: HTMLVideoElement | HTMLImageElement,
  srcW: number,
  srcH: number
): string {
  if (!srcW || !srcH) return '';
  const maxDim = 680;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const targetW = Math.max(1, Math.round(srcW * scale));
  const targetH = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, targetW, targetH);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
  return dataUrl.length <= 240_000 ? dataUrl : '';
}

export async function extractFirstFramePoster(
  file: File,
  kind: HeroMediaKind
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    if (kind === 'gif') {
      return await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve(drawCanvasPoster(img, img.naturalWidth, img.naturalHeight));
        };
        img.onerror = () => resolve('');
        img.src = url;
      });
    }

    return await new Promise<string>((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      let settled = false;
      const finish = (poster: string) => {
        if (settled) return;
        settled = true;
        resolve(poster);
      };

      const timeout = window.setTimeout(() => finish(''), 4000);

      video.onloadeddata = () => {
        try {
          if (video.duration > 0.1) {
            video.currentTime = 0.05;
          } else {
            window.clearTimeout(timeout);
            finish(drawCanvasPoster(video, video.videoWidth, video.videoHeight));
          }
        } catch {
          window.clearTimeout(timeout);
          finish(drawCanvasPoster(video, video.videoWidth, video.videoHeight));
        }
      };

      video.onseeked = () => {
        window.clearTimeout(timeout);
        finish(drawCanvasPoster(video, video.videoWidth, video.videoHeight));
      };

      video.onerror = () => {
        window.clearTimeout(timeout);
        finish('');
      };

      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadHeroMediaFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<HeroMediaManifest> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error('Please sign in with an authorized Admin account before uploading.');
  }

  const { kind, mimeType } = detectHeroMediaFileInfo(file);

  if (file.size === 0) {
    throw new Error('The selected file is empty.');
  }
  if (file.size > HERO_MEDIA_MAX_BYTES) {
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `This file is ${fileMb} MB. Direct uploads support up to ${HERO_MEDIA_MAX_MB_LABEL} — please trim/compress it or paste an external video/GIF link.`
    );
  }

  await currentUser.getIdToken(true).catch(() => undefined);

  onProgress?.(6);
  const [buffer, posterDataUrl] = await Promise.all([
    file.arrayBuffer(),
    extractFirstFramePoster(file, kind).catch(() => ''),
  ]);
  onProgress?.(16);

  const bytes = new Uint8Array(buffer);
  const chunkCount = Math.max(1, Math.ceil(bytes.length / HERO_CHUNK_RAW_BYTES));
  if (chunkCount > HERO_MEDIA_MAX_CHUNKS) {
    throw new Error(
      `Direct uploads support up to ${HERO_MEDIA_MAX_MB_LABEL}. Please use a shorter clip or external URL.`
    );
  }

  const uploadId = `hero_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const prevManifestSnap = await getDoc(doc(db, 'siteMedia', 'hero-manifest')).catch(() => null);
  const prevChunkCount =
    prevManifestSnap?.exists() && typeof prevManifestSnap.data()?.chunkCount === 'number'
      ? Number(prevManifestSnap.data()?.chunkCount)
      : 0;

  for (let i = 0; i < chunkCount; i += 1) {
    const start = i * HERO_CHUNK_RAW_BYTES;
    const end = Math.min(start + HERO_CHUNK_RAW_BYTES, bytes.length);
    const chunkBase64 = uint8ToBase64(bytes.subarray(start, end));

    try {
      await setDoc(doc(db, 'siteMediaChunks', `hero-chunk-${i}`), {
        uploadId,
        chunkIndex: i,
        data: chunkBase64,
        updatedAt: serverTimestamp(),
        updatedByUid: currentUser.uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `siteMediaChunks/hero-chunk-${i}`);
    }

    const pct = 16 + Math.round(((i + 1) / chunkCount) * 72);
    onProgress?.(pct);
  }

  // Clean up any leftover chunks only when a previous upload had more chunks
  if (prevChunkCount > chunkCount) {
    await Promise.all(
      Array.from({ length: prevChunkCount - chunkCount }, (_, offset) => {
        const idx = chunkCount + offset;
        return deleteDoc(doc(db, 'siteMediaChunks', `hero-chunk-${idx}`)).catch(() => undefined);
      })
    );
  }

  try {
    await setDoc(doc(db, 'siteMedia', 'hero-manifest'), {
      uploadId,
      mimeType,
      mediaKind: kind,
      chunkCount,
      byteSize: bytes.length,
      ...(posterDataUrl ? { posterDataUrl } : {}),
      updatedAt: serverTimestamp(),
      updatedByUid: currentUser.uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteMedia/hero-manifest');
  }

  onProgress?.(100);

  return {
    uploadId,
    mimeType,
    mediaKind: kind,
    chunkCount,
    byteSize: bytes.length,
    posterDataUrl,
  };
}

export async function clearUploadedHeroMedia(): Promise<void> {
  if (!auth.currentUser?.uid) return;
  await deleteDoc(doc(db, 'siteMedia', 'hero-manifest')).catch(() => undefined);
  await Promise.all(
    Array.from({ length: HERO_MEDIA_MAX_CHUNKS }, (_, idx) =>
      deleteDoc(doc(db, 'siteMediaChunks', `hero-chunk-${idx}`)).catch(() => undefined)
    )
  );
}

export async function loadUploadedHeroMedia(
  expectedUploadId?: string
): Promise<LoadedHeroMedia | null> {
  const manifestSnap = await getDoc(doc(db, 'siteMedia', 'hero-manifest'));
  if (!manifestSnap.exists()) return null;

  const manifest = manifestSnap.data() as HeroMediaManifest;
  if (
    !manifest.uploadId ||
    !manifest.chunkCount ||
    manifest.chunkCount < 1 ||
    manifest.chunkCount > HERO_MEDIA_MAX_CHUNKS
  ) {
    return null;
  }

  if (expectedUploadId && manifest.uploadId !== expectedUploadId) {
    // Allow newer manifest if CMS updated slightly behind or vice versa, still load manifest.uploadId
  }

  const chunkSnaps = await Promise.all(
    Array.from({ length: manifest.chunkCount }, (_, idx) =>
      getDoc(doc(db, 'siteMediaChunks', `hero-chunk-${idx}`))
    )
  );

  const byteParts: BlobPart[] = [];
  for (let i = 0; i < chunkSnaps.length; i += 1) {
    const snap = chunkSnaps[i];
    if (!snap.exists()) return null;
    const chunkData = snap.data() as { uploadId?: string; data?: string };
    if (chunkData.uploadId !== manifest.uploadId || typeof chunkData.data !== 'string') {
      return null;
    }
    byteParts.push(new Uint8Array(base64ToUint8(chunkData.data)));
  }

  const blob = new Blob(byteParts, { type: manifest.mimeType || 'video/mp4' });
  const objectUrl = URL.createObjectURL(blob);

  return {
    uploadId: manifest.uploadId,
    objectUrl,
    blob,
    mimeType: manifest.mimeType || 'video/mp4',
    mediaKind: manifest.mediaKind === 'gif' ? 'gif' : 'mp4',
    posterDataUrl: manifest.posterDataUrl || '',
  };
}

/**
 * Computes the total duration (in ms) of one full cycle of an animated GIF87a/89a buffer.
 * Used as a fallback timing guard for browsers without native ImageDecoder API.
 */
export function getGifLoopDurationMs(buffer: ArrayBuffer): number {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 14) return 3000;

  let pos = 6; // Skip GIF87a / GIF89a header
  const packed = bytes[pos + 4];
  pos += 7; // Skip Logical Screen Descriptor

  if (packed & 0x80) {
    const gctSize = 3 * (1 << ((packed & 0x07) + 1));
    pos += gctSize;
  }

  let totalMs = 0;
  let pendingDelayMs = 100;

  const skipSubBlocks = () => {
    while (pos < bytes.length) {
      const len = bytes[pos++];
      if (len === 0) break;
      pos += len;
    }
  };

  while (pos < bytes.length) {
    const blockId = bytes[pos++];
    if (blockId === 0x3b) break; // GIF Trailer

    if (blockId === 0x21) {
      // Extension block
      const label = bytes[pos++];
      if (label === 0xf9 && pos + 5 < bytes.length) {
        const subLen = bytes[pos++];
        if (subLen === 4) {
          const delayTicks = bytes[pos + 1] | (bytes[pos + 2] << 8);
          // Browsers clamp GIF frame delays <= 1 tick (10ms) up to 100ms
          pendingDelayMs = delayTicks <= 1 ? 100 : delayTicks * 10;
          pos += 4;
          if (bytes[pos] === 0) pos += 1;
        } else {
          pos += subLen;
          skipSubBlocks();
        }
      } else {
        skipSubBlocks();
      }
    } else if (blockId === 0x2c) {
      // Image Descriptor (9 bytes + local color table + LZW blocks)
      if (pos + 9 > bytes.length) break;
      const imgPacked = bytes[pos + 8];
      pos += 9;
      if (imgPacked & 0x80) {
        const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1));
        pos += lctSize;
      }
      pos += 1; // LZW minimum code size
      skipSubBlocks();
      totalMs += pendingDelayMs;
      pendingDelayMs = 100;
    } else {
      break;
    }
  }

  return totalMs > 0 ? totalMs : 3000;
}

export const FIRESTORE_MEDIA_PREFIX = 'firestore-media://';
const galleryImageCache = new Map<string, Promise<string | null>>();

export function isFirestoreMediaRef(src?: string | null): boolean {
  return typeof src === 'string' && src.startsWith(FIRESTORE_MEDIA_PREFIX);
}

export function getMediaIdFromRef(src: string): string {
  return src.slice(FIRESTORE_MEDIA_PREFIX.length).trim();
}

export async function uploadGalleryImageMedia(
  photoId: string,
  compressedDataUrl: string
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error('Please sign in with an authorized Admin account before uploading photos.');
  }
  if (!compressedDataUrl.startsWith('data:image/') || compressedDataUrl.length > 640_000) {
    throw new Error('Compressed image is too large. Please choose a smaller photo.');
  }

  await currentUser.getIdToken(true).catch(() => undefined);

  const safeSlug = photoId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || 'photo';
  const mediaId = `occ_${safeSlug}_${Date.now().toString(36)}`;

  try {
    await setDoc(doc(db, 'siteMedia', mediaId), {
      uploadId: mediaId,
      mimeType: 'image/jpeg',
      mediaKind: 'image',
      chunkCount: 0,
      byteSize: compressedDataUrl.length,
      imageDataUrl: compressedDataUrl,
      updatedAt: serverTimestamp(),
      updatedByUid: currentUser.uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `siteMedia/${mediaId}`);
  }

  const ref = `${FIRESTORE_MEDIA_PREFIX}${mediaId}`;
  galleryImageCache.set(mediaId, Promise.resolve(compressedDataUrl));
  return ref;
}

export function loadGalleryImageMedia(refOrId: string): Promise<string | null> {
  const mediaId = isFirestoreMediaRef(refOrId) ? getMediaIdFromRef(refOrId) : refOrId;
  if (!mediaId || !/^[a-zA-Z0-9_-]+$/.test(mediaId)) {
    return Promise.resolve(null);
  }

  const existing = galleryImageCache.get(mediaId);
  if (existing) return existing;

  const task = getDoc(doc(db, 'siteMedia', mediaId))
    .then((snap) => {
      if (!snap.exists()) return null;
      const data = snap.data() as { imageDataUrl?: string; posterDataUrl?: string };
      return data.imageDataUrl || data.posterDataUrl || null;
    })
    .catch(() => {
      galleryImageCache.delete(mediaId);
      return null;
    });

  galleryImageCache.set(mediaId, task);
  return task;
}

