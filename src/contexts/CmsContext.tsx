import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  doc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  AccordionPillar,
  BookingStepItem,
  ClinicalFaq,
  ConsultationModeOption,
  CredentialTab,
  DEFAULT_BN_SITE_CONTENT,
  DEFAULT_SITE_CONTENT,
  OccasionPhoto,
  SiteContentBnOverrides,
  SiteContentData,
  SiteContentEditableData,
} from '../data/portfolioData';
import {
  auth,
  db,
  extractReadableError,
  handleFirestoreError,
  isSuperAdminEmail,
  OperationType,
} from '../lib/firebase';
import { useLanguage } from './LanguageContext';

export const CMS_MAX_SAFE_BYTES = 920_000;

export interface LiveSyncReport {
  checkedAt: string;
  connected: boolean;
  serverDocExists: boolean;
  inSyncWithFrontend: boolean;
  serverUpdatedAt: string | null;
  serverPayloadBytes: number;
  authEmail: string | null;
  emailVerified: boolean;
  roleStatus: 'super-admin' | 'promoted-admin' | 'unverified-or-standard';
  heroMediaStatus: string;
  errorMessage: string | null;
}

interface CmsContextValue {
  content: SiteContentData;
  localizedContent: SiteContentData;
  cmsLoaded: boolean;
  cmsError: string | null;
  lastSyncedAt: string | null;
  livePayloadBytes: number;
  saveSiteContent: (next: SiteContentData) => Promise<void>;
  resetSiteContent: () => Promise<void>;
  verifyLiveSync: () => Promise<LiveSyncReport>;
}

const CmsContext = createContext<CmsContextValue | null>(null);

function clampStr(value: unknown, fallback: string, maxLen: number, required = false): string {
  const raw = typeof value === 'string' ? value : fallback;
  const trimmed = raw.slice(0, maxLen);
  if (required && trimmed.trim().length === 0) {
    return fallback.slice(0, maxLen);
  }
  return trimmed;
}

function sanitizeEditableFields(
  src: Partial<SiteContentEditableData>,
  fallback: SiteContentEditableData
): SiteContentEditableData {
  const sanitizedOccasions: OccasionPhoto[] =
    Array.isArray(src.occasions) && src.occasions.length > 0
      ? src.occasions.slice(0, 40).map((o) => {
          const cleanPrimary = typeof o.primarySrc === 'string' ? o.primarySrc : '';
          const cleanFallback =
            typeof o.fallbackSrc === 'string' &&
            !(o.fallbackSrc.startsWith('data:') && o.fallbackSrc === cleanPrimary)
              ? o.fallbackSrc
              : '';
          return {
            ...o,
            primarySrc: cleanPrimary,
            fallbackSrc: cleanFallback,
          };
        })
      : fallback.occasions;

  return {
    heroEyebrow: clampStr(src.heroEyebrow, fallback.heroEyebrow, 200),
    heroTitle: clampStr(src.heroTitle, fallback.heroTitle, 140, true),
    heroAccentName: clampStr(src.heroAccentName, fallback.heroAccentName, 80),
    heroSubtitle: clampStr(src.heroSubtitle, fallback.heroSubtitle, 600, true),
    heroPrimaryCta: clampStr(src.heroPrimaryCta, fallback.heroPrimaryCta, 80),
    heroSecondaryCta: clampStr(src.heroSecondaryCta, fallback.heroSecondaryCta, 80),
    heroTrustMarker: clampStr(src.heroTrustMarker, fallback.heroTrustMarker, 220),
    heroMediaSource:
      src.heroMediaSource === 'upload' || src.heroMediaSource === 'url' || src.heroMediaSource === 'none'
        ? src.heroMediaSource
        : fallback.heroMediaSource,
    heroMediaKind:
      src.heroMediaKind === 'gif' || src.heroMediaKind === 'mp4'
        ? src.heroMediaKind
        : fallback.heroMediaKind,
    heroMediaUrl: clampStr(src.heroMediaUrl, fallback.heroMediaUrl, 1000).trim(),
    heroMediaUploadId: clampStr(src.heroMediaUploadId, fallback.heroMediaUploadId, 120).trim(),
    bioSectionKicker: clampStr(src.bioSectionKicker, fallback.bioSectionKicker, 140),
    bioHeading: clampStr(src.bioHeading, fallback.bioHeading, 180),
    bioMissionBn: clampStr(src.bioMissionBn, fallback.bioMissionBn, 700, true),
    bioMissionEn: clampStr(src.bioMissionEn, fallback.bioMissionEn, 700, true),
    bioParagraph1: clampStr(src.bioParagraph1, fallback.bioParagraph1, 2000),
    bioParagraph2: clampStr(src.bioParagraph2, fallback.bioParagraph2, 2000),
    portraitCaptionTitle: clampStr(src.portraitCaptionTitle, fallback.portraitCaptionTitle, 140),
    portraitCaptionSub: clampStr(src.portraitCaptionSub, fallback.portraitCaptionSub, 160),
    competencies:
      Array.isArray(src.competencies) && src.competencies.length > 0
        ? src.competencies.slice(0, 12).map((c) => String(c))
        : fallback.competencies,
    pillarsSectionKicker: clampStr(src.pillarsSectionKicker, fallback.pillarsSectionKicker, 140),
    pillarsHeading: clampStr(src.pillarsHeading, fallback.pillarsHeading, 180),
    pillarsSubheading: clampStr(src.pillarsSubheading, fallback.pillarsSubheading, 300),
    pillars:
      Array.isArray(src.pillars) && src.pillars.length > 0
        ? src.pillars.slice(0, 12)
        : fallback.pillars,
    gallerySectionKicker: clampStr(src.gallerySectionKicker, fallback.gallerySectionKicker, 140),
    galleryHeading: clampStr(src.galleryHeading, fallback.galleryHeading, 180),
    galleryLeadTitle: clampStr(src.galleryLeadTitle, fallback.galleryLeadTitle, 140),
    galleryLeadCopy: clampStr(src.galleryLeadCopy, fallback.galleryLeadCopy, 420),
    occasions: sanitizedOccasions,
    credentialsSectionKicker: clampStr(
      src.credentialsSectionKicker,
      fallback.credentialsSectionKicker,
      140
    ),
    credentialsHeading: clampStr(src.credentialsHeading, fallback.credentialsHeading, 180),
    credentials:
      Array.isArray(src.credentials) && src.credentials.length > 0
        ? src.credentials.slice(0, 16)
        : fallback.credentials,
    highlightKicker: clampStr(src.highlightKicker, fallback.highlightKicker, 140),
    highlightTitle: clampStr(src.highlightTitle, fallback.highlightTitle, 180),
    highlightSummary: clampStr(src.highlightSummary, fallback.highlightSummary, 500),
    highlightCtaLabel: clampStr(src.highlightCtaLabel, fallback.highlightCtaLabel, 80),
    highlightPhotoId: clampStr(src.highlightPhotoId, fallback.highlightPhotoId, 80),
    faqs:
      Array.isArray(src.faqs) && src.faqs.length > 0
        ? src.faqs.slice(0, 12)
        : fallback.faqs,
    consultationModes:
      Array.isArray(src.consultationModes) && src.consultationModes.length > 0
        ? src.consultationModes.slice(0, 6)
        : fallback.consultationModes,
    bookingSteps:
      Array.isArray(src.bookingSteps) && src.bookingSteps.length > 0
        ? src.bookingSteps.slice(0, 8)
        : fallback.bookingSteps,
    connectSectionKicker: clampStr(src.connectSectionKicker, fallback.connectSectionKicker, 140),
    connectHeading: clampStr(src.connectHeading, fallback.connectHeading, 180),
    connectSubheading: clampStr(src.connectSubheading, fallback.connectSubheading, 450),
    doctorName: clampStr(src.doctorName, fallback.doctorName, 140, true),
    doctorShortName: clampStr(src.doctorShortName, fallback.doctorShortName, 100),
    doctorTitle: clampStr(src.doctorTitle, fallback.doctorTitle, 140),
    bmdcNumber: clampStr(src.bmdcNumber, fallback.bmdcNumber, 60, true),
    institution: clampStr(src.institution, fallback.institution, 180, true),
    phoneDisplay: clampStr(src.phoneDisplay, fallback.phoneDisplay, 40),
    email: (() => {
      const val = clampStr(src.email, fallback.email, 140).trim();
      return val.toLowerCase() === 'zen.saifulhere@gmail.com' ? '' : val;
    })(),
    cvObjective: clampStr(src.cvObjective, fallback.cvObjective, 1200),
    hudBrandLabel: clampStr(src.hudBrandLabel, fallback.hudBrandLabel, 100),
  };
}

function normalizeBnOverrides(bnRaw?: SiteContentBnOverrides): SiteContentBnOverrides | undefined {
  if (!bnRaw || typeof bnRaw !== 'object') return undefined;
  const sanitizedBn = sanitizeEditableFields(bnRaw, DEFAULT_BN_SITE_CONTENT);
  // Keep lightweight references only (images/media are shared from EN occasions)
  sanitizedBn.occasions = sanitizedBn.occasions.map((o) => ({
    ...o,
    primarySrc: o.primarySrc.startsWith('data:') ? '' : o.primarySrc,
    fallbackSrc: o.fallbackSrc.startsWith('data:') ? '' : o.fallbackSrc,
  }));
  return sanitizedBn;
}

export function buildCanonicalContentFingerprint(data: SiteContentData): string {
  const base = sanitizeEditableFields(data, DEFAULT_SITE_CONTENT);
  const bn = normalizeBnOverrides(data.bnOverrides);
  return JSON.stringify({ ...base, ...(bn ? { bnOverrides: bn } : {}) });
}

export function estimateCmsPayloadBytes(next: SiteContentData): number {
  const json = buildCanonicalContentFingerprint(next);
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(json).length;
  }
  return json.length;
}

function buildSanitizedWritePayload(next: SiteContentData, uid: string) {
  const base = sanitizeEditableFields(next, DEFAULT_SITE_CONTENT);
  const cleanBnOverrides = normalizeBnOverrides(next.bnOverrides);

  return {
    ...base,
    ...(cleanBnOverrides ? { bnOverrides: cleanBnOverrides } : {}),
    updatedAt: serverTimestamp(),
    updatedByUid: uid,
  };
}

function formatFirestoreTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const fn = (value as { toDate?: () => Date }).toDate;
    if (typeof fn === 'function') {
      return fn.call(value).toLocaleString();
    }
  }
  return null;
}

function mergeLocalizedContent(content: SiteContentData, isBn: boolean): SiteContentData {
  if (!isBn) return content;

  const bnCustom = content.bnOverrides;
  const pickScalar = <K extends keyof SiteContentEditableData>(key: K): string => {
    const customVal = bnCustom?.[key];
    if (typeof customVal === 'string' && customVal.trim().length > 0) {
      return customVal;
    }
    const defaultBn = DEFAULT_BN_SITE_CONTENT[key];
    return typeof defaultBn === 'string' ? defaultBn : String(content[key]);
  };

  // Merge occasions preserving live primarySrc / fallbackSrc / category / figure
  const occasions: OccasionPhoto[] = content.occasions.map((enPhoto) => {
    const customBn = bnCustom?.occasions?.find((o) => o.id === enPhoto.id);
    const defaultBn = DEFAULT_BN_SITE_CONTENT.occasions.find((o) => o.id === enPhoto.id);
    const bnMeta = customBn || defaultBn;
    return {
      ...enPhoto,
      figure: bnMeta?.figure || enPhoto.figure,
      title: bnMeta?.title || enPhoto.title,
      occasionLabel: bnMeta?.occasionLabel || enPhoto.occasionLabel,
      categoryLabel: bnMeta?.categoryLabel || enPhoto.categoryLabel,
      description: bnMeta?.description || enPhoto.description,
      institution: bnMeta?.institution || enPhoto.institution,
    };
  });

  // Merge pillars preserving photoId
  const pillars: AccordionPillar[] = content.pillars.map((enPillar) => {
    const bnPillar =
      bnCustom?.pillars?.find((p) => p.id === enPillar.id) ||
      DEFAULT_BN_SITE_CONTENT.pillars.find((p) => p.id === enPillar.id);
    return {
      ...enPillar,
      code: bnPillar?.code || enPillar.code,
      tag: bnPillar?.tag || enPillar.tag,
      title: bnPillar?.title || enPillar.title,
      summary: bnPillar?.summary || enPillar.summary,
    };
  });

  // Merge credentials preserving photoId & structure
  const credentials: CredentialTab[] = content.credentials.map((enTab) => {
    const bnTab =
      bnCustom?.credentials?.find((t) => t.id === enTab.id) ||
      DEFAULT_BN_SITE_CONTENT.credentials.find((t) => t.id === enTab.id);
    if (!bnTab) return enTab;
    return {
      ...enTab,
      index: bnTab.index || enTab.index,
      label: bnTab.label || enTab.label,
      headline: bnTab.headline || enTab.headline,
      summary: bnTab.summary || enTab.summary,
      figureCaption: bnTab.figureCaption || enTab.figureCaption,
      items:
        enTab.items.length === bnTab.items.length
          ? bnTab.items
          : enTab.items.map((it, idx) => bnTab.items[idx] || it),
    };
  });

  const faqs: ClinicalFaq[] = content.faqs.map((enFaq, idx) => {
    const bnFaq =
      bnCustom?.faqs?.find((f) => f.id === enFaq.id) ||
      DEFAULT_BN_SITE_CONTENT.faqs[idx];
    return bnFaq ? { ...enFaq, question: bnFaq.question, answer: bnFaq.answer } : enFaq;
  });

  const consultationModes: ConsultationModeOption[] = content.consultationModes.map((enMode) => {
    const bnMode =
      bnCustom?.consultationModes?.find((m) => m.id === enMode.id) ||
      DEFAULT_BN_SITE_CONTENT.consultationModes.find((m) => m.id === enMode.id);
    return bnMode
      ? {
          ...enMode,
          title: bnMode.title,
          summary: bnMode.summary,
          ctaLabel: bnMode.ctaLabel,
        }
      : enMode;
  });

  const bookingSteps: BookingStepItem[] = content.bookingSteps.map((enStep, idx) => {
    const bnStep =
      bnCustom?.bookingSteps?.[idx] || DEFAULT_BN_SITE_CONTENT.bookingSteps[idx];
    return bnStep
      ? {
          ...enStep,
          index: bnStep.index || enStep.index,
          title: bnStep.title,
          detail: bnStep.detail,
        }
      : enStep;
  });

  const competencies =
    bnCustom?.competencies && bnCustom.competencies.length > 0
      ? bnCustom.competencies
      : DEFAULT_BN_SITE_CONTENT.competencies;

  return {
    ...content,
    heroEyebrow: pickScalar('heroEyebrow'),
    heroTitle: pickScalar('heroTitle'),
    heroAccentName: pickScalar('heroAccentName'),
    heroSubtitle: pickScalar('heroSubtitle'),
    heroPrimaryCta: pickScalar('heroPrimaryCta'),
    heroSecondaryCta: pickScalar('heroSecondaryCta'),
    heroTrustMarker: pickScalar('heroTrustMarker'),
    bioSectionKicker: pickScalar('bioSectionKicker'),
    bioHeading: pickScalar('bioHeading'),
    bioMissionBn: pickScalar('bioMissionBn'),
    bioMissionEn: pickScalar('bioMissionEn'),
    bioParagraph1: pickScalar('bioParagraph1'),
    bioParagraph2: pickScalar('bioParagraph2'),
    portraitCaptionTitle: pickScalar('portraitCaptionTitle'),
    portraitCaptionSub: pickScalar('portraitCaptionSub'),
    competencies,
    pillarsSectionKicker: pickScalar('pillarsSectionKicker'),
    pillarsHeading: pickScalar('pillarsHeading'),
    pillarsSubheading: pickScalar('pillarsSubheading'),
    pillars,
    gallerySectionKicker: pickScalar('gallerySectionKicker'),
    galleryHeading: pickScalar('galleryHeading'),
    galleryLeadTitle: pickScalar('galleryLeadTitle'),
    galleryLeadCopy: pickScalar('galleryLeadCopy'),
    occasions,
    credentialsSectionKicker: pickScalar('credentialsSectionKicker'),
    credentialsHeading: pickScalar('credentialsHeading'),
    credentials,
    highlightKicker: pickScalar('highlightKicker'),
    highlightTitle: pickScalar('highlightTitle'),
    highlightSummary: pickScalar('highlightSummary'),
    highlightCtaLabel: pickScalar('highlightCtaLabel'),
    faqs,
    consultationModes,
    bookingSteps,
    connectSectionKicker: pickScalar('connectSectionKicker'),
    connectHeading: pickScalar('connectHeading'),
    connectSubheading: pickScalar('connectSubheading'),
    doctorName: pickScalar('doctorName'),
    doctorShortName: pickScalar('doctorShortName'),
    doctorTitle: pickScalar('doctorTitle'),
    bmdcNumber: pickScalar('bmdcNumber'),
    institution: pickScalar('institution'),
    cvObjective: pickScalar('cvObjective'),
    hudBrandLabel: pickScalar('hudBrandLabel'),
  };
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const { isBn } = useLanguage();
  const [content, setContent] = useState<SiteContentData>(DEFAULT_SITE_CONTENT);
  const [cmsLoaded, setCmsLoaded] = useState(false);
  const [cmsError, setCmsError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const contentRef = doc(db, 'siteContent', 'main');
    const unsub = onSnapshot(
      contentRef,
      (snap) => {
        if (snap.exists()) {
          const remote = snap.data() as Partial<SiteContentData> & { updatedAt?: unknown };
          const clean = sanitizeEditableFields(remote, DEFAULT_SITE_CONTENT);
          setContent({
            ...clean,
            ...(remote.bnOverrides ? { bnOverrides: remote.bnOverrides } : {}),
          });
          setLastSyncedAt(formatFirestoreTimestamp(remote.updatedAt) || new Date().toLocaleTimeString());
        } else {
          setContent(DEFAULT_SITE_CONTENT);
          setLastSyncedAt(null);
        }
        setCmsError(null);
        setCmsLoaded(true);
      },
      (error) => {
        console.warn('CMS live listener fallback to defaults:', error);
        setCmsError(extractReadableError(error, 'Unable to read live CMS content from Firestore.'));
        setContent(DEFAULT_SITE_CONTENT);
        setCmsLoaded(true);
      }
    );

    return () => unsub();
  }, []);

  const saveSiteContent = useCallback(async (next: SiteContentData) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      throw new Error('Please sign in with an authorized Admin account to save changes.');
    }

    // Refresh ID token claims before administrative write so verified email claims stay fresh
    await currentUser.getIdToken(true).catch(() => undefined);

    const payload = buildSanitizedWritePayload(next, currentUser.uid);
    const estimatedBytes = estimateCmsPayloadBytes(next);
    if (estimatedBytes > CMS_MAX_SAFE_BYTES) {
      throw new Error(
        `Combined site content is ${(estimatedBytes / 1024).toFixed(0)} KB, which nears Firestore's 1,000 KB document ceiling. Re-upload older gallery photos using the Upload Replacement Photo button so they store cleanly in media storage.`
      );
    }

    try {
      await setDoc(doc(db, 'siteContent', 'main'), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siteContent/main');
    }
  }, []);

  const resetSiteContent = useCallback(async () => {
    await saveSiteContent({
      ...DEFAULT_SITE_CONTENT,
      bnOverrides: DEFAULT_BN_SITE_CONTENT,
    });
  }, [saveSiteContent]);

  const verifyLiveSync = useCallback(async (): Promise<LiveSyncReport> => {
    const checkedAt = new Date().toLocaleTimeString();
    const currentUser = auth.currentUser;
    const authEmail = currentUser?.email || null;
    const emailVerified = Boolean(currentUser?.emailVerified);

    let roleStatus: LiveSyncReport['roleStatus'] = 'unverified-or-standard';
    if (currentUser?.uid && emailVerified) {
      if (isSuperAdminEmail(authEmail)) {
        roleStatus = 'super-admin';
      } else {
        try {
          const adminSnap = await getDocFromServer(doc(db, 'admins', currentUser.uid));
          if (adminSnap.exists()) {
            roleStatus = 'promoted-admin';
          }
        } catch {
          // Leave unverified-or-standard if read denied
        }
      }
    }

    try {
      const serverSnap = await getDocFromServer(doc(db, 'siteContent', 'main'));
      if (!serverSnap.exists()) {
        return {
          checkedAt,
          connected: true,
          serverDocExists: false,
          inSyncWithFrontend:
            buildCanonicalContentFingerprint(content) ===
            buildCanonicalContentFingerprint(DEFAULT_SITE_CONTENT),
          serverUpdatedAt: null,
          serverPayloadBytes: estimateCmsPayloadBytes(DEFAULT_SITE_CONTENT),
          authEmail,
          emailVerified,
          roleStatus,
          heroMediaStatus: 'Using default portrait photo (no published override yet)',
          errorMessage: null,
        };
      }

      const remote = serverSnap.data() as Partial<SiteContentData> & { updatedAt?: unknown };
      const cleanRemote: SiteContentData = {
        ...sanitizeEditableFields(remote, DEFAULT_SITE_CONTENT),
        ...(remote.bnOverrides ? { bnOverrides: remote.bnOverrides } : {}),
      };

      const serverPayloadBytes = estimateCmsPayloadBytes(cleanRemote);
      const inSyncWithFrontend =
        buildCanonicalContentFingerprint(cleanRemote) ===
        buildCanonicalContentFingerprint(content);

      // Refresh local content immediately from authoritative server read if needed
      if (!inSyncWithFrontend) {
        setContent(cleanRemote);
      }

      let heroMediaStatus = 'Static Hero Portrait Photo';
      if (cleanRemote.heroMediaSource === 'url') {
        heroMediaStatus = cleanRemote.heroMediaUrl
          ? `External ${cleanRemote.heroMediaKind.toUpperCase()} link configured`
          : 'External link mode selected (missing URL)';
      } else if (cleanRemote.heroMediaSource === 'upload') {
        try {
          const manifestSnap = await getDocFromServer(doc(db, 'siteMedia', 'hero-manifest'));
          if (manifestSnap.exists()) {
            const m = manifestSnap.data() as { mediaKind?: string; chunkCount?: number; byteSize?: number };
            const mb = typeof m.byteSize === 'number' ? `${(m.byteSize / (1024 * 1024)).toFixed(2)} MB` : '';
            heroMediaStatus = `Verified ${(m.mediaKind || 'MP4').toUpperCase()} upload (${m.chunkCount || 1} chunks${mb ? `, ${mb}` : ''})`;
          } else {
            heroMediaStatus = 'Hero upload ID set, but manifest missing on server (re-upload clip)';
          }
        } catch (err) {
          heroMediaStatus = `Could not verify Hero media manifest: ${extractReadableError(err, 'Read error')}`;
        }
      }

      return {
        checkedAt,
        connected: true,
        serverDocExists: true,
        inSyncWithFrontend,
        serverUpdatedAt: formatFirestoreTimestamp(remote.updatedAt),
        serverPayloadBytes,
        authEmail,
        emailVerified,
        roleStatus,
        heroMediaStatus,
        errorMessage: null,
      };
    } catch (error) {
      return {
        checkedAt,
        connected: false,
        serverDocExists: false,
        inSyncWithFrontend: false,
        serverUpdatedAt: null,
        serverPayloadBytes: 0,
        authEmail,
        emailVerified,
        roleStatus,
        heroMediaStatus: 'Unavailable while offline/disconnected',
        errorMessage: extractReadableError(error, 'Unable to reach Firestore server.'),
      };
    }
  }, [content]);

  const livePayloadBytes = useMemo(() => estimateCmsPayloadBytes(content), [content]);

  const localizedContent = useMemo(
    () => mergeLocalizedContent(content, isBn),
    [content, isBn]
  );

  return (
    <CmsContext.Provider
      value={{
        content,
        localizedContent,
        cmsLoaded,
        cmsError,
        lastSyncedAt,
        livePayloadBytes,
        saveSiteContent,
        resetSiteContent,
        verifyLiveSync,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used inside CmsProvider');
  return ctx;
}
