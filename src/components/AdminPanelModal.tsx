import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  Database,
  FileText,
  Film,
  FolderHeart,
  ImagePlus,
  Layers,
  Link2,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  buildCanonicalContentFingerprint,
  CMS_MAX_SAFE_BYTES,
  estimateCmsPayloadBytes,
  LiveSyncReport,
  useCms,
} from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  AccordionPillar,
  BookingStepItem,
  ClinicalFaq,
  ConsultationModeOption,
  CredentialTab,
  DEFAULT_BN_SITE_CONTENT,
  DEFAULT_SITE_CONTENT,
  OccasionCategory,
  OccasionPhoto,
  SiteContentBnOverrides,
  SiteContentData,
  SiteContentEditableData,
} from '../data/portfolioData';
import {
  db,
  extractReadableError,
  handleFirestoreError,
  isSuperAdminEmail,
  OperationType,
  PRIMARY_ADMIN_EMAIL,
} from '../lib/firebase';
import {
  clearUploadedHeroMedia,
  HERO_MEDIA_MAX_MB_LABEL,
  HeroMediaKind,
  HeroMediaSource,
  inferHeroMediaKindFromUrl,
  isFirestoreMediaRef,
  isValidHttpMediaUrl,
  uploadGalleryImageMedia,
  uploadHeroMediaFile,
} from '../lib/heroMedia';
import { compressImageToDataUrl } from '../lib/imageCompression';
import { HeroMotionMedia } from './HeroMotionMedia';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
import { OccasionImage } from './OccasionImage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPatientView: () => void;
}

interface VisitorRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  visitCount: number;
}

interface AdminGrantRecord {
  uid: string;
  email: string;
  displayName: string;
}

interface AppointmentRecord {
  id: string;
  patientUid: string;
  patientName: string;
  email: string;
  phone: string;
  mode: string;
  date: string;
  slot: string;
  reason?: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  adminNotes?: string;
}

interface MedicalRecordItem {
  id: string;
  patientUid: string;
  patientName?: string;
  visitDate: string;
  diagnosis: string;
  clinicalNotes?: string;
  prescription: string;
  followUpDate?: string;
  doctorName: string;
}

interface PatientDocAdminItem {
  id: string;
  patientUid: string;
  title: string;
  category: string;
  docSourceType: 'link' | 'image';
  urlOrData: string;
  uploadedByRole: 'patient' | 'admin';
}

type AdminTab = 'copy' | 'media' | 'credentials' | 'visitors' | 'clinical';

interface StatusBanner {
  type: 'success' | 'error' | 'info';
  message: string;
}

export function AdminPanelModal({
  isOpen,
  onClose,
  onOpenPatientView,
}: AdminPanelModalProps) {
  const { user, isAdmin, signOutUser } = useAuth();
  const {
    content,
    cmsError,
    lastSyncedAt,
    livePayloadBytes,
    saveSiteContent,
    resetSiteContent,
    verifyLiveSync,
  } = useCms();
  const { lang: publicLang, setLang: setPublicLang } = useLanguage();

  const [activeTab, setActiveTab] = useState<AdminTab>('copy');
  const [editingLang, setEditingLang] = useState<'en' | 'bn'>('en');
  const [draft, setDraft] = useState<SiteContentData>(content);
  const [competencyInput, setCompetencyInput] = useState('');
  const [savingCms, setSavingCms] = useState(false);
  const [statusBanner, setStatusBanner] = useState<StatusBanner | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadProgress, setHeroUploadProgress] = useState(0);
  const [heroMediaFeedback, setHeroMediaFeedback] = useState<StatusBanner | null>(null);
  const [heroPreviewReplay, setHeroPreviewReplay] = useState(0);
  const [heroPreviewState, setHeroPreviewState] = useState<
    'idle' | 'loading' | 'playing' | 'ended' | 'error'
  >('idle');
  const [uploadingOccasionIdx, setUploadingOccasionIdx] = useState<number | null>(null);

  // Live Database Sync Verification state
  const [verifyingSync, setVerifyingSync] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [syncReport, setSyncReport] = useState<LiveSyncReport | null>(null);

  // Unsaved-changes exit confirmation
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);

  // Live Firestore collections for Admin management
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [adminGrants, setAdminGrants] = useState<Record<string, AdminGrantRecord>>({});
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordItem[]>([]);
  const [patientDocs, setPatientDocs] = useState<PatientDocAdminItem[]>([]);

  // Visitors search
  const [visitorSearch, setVisitorSearch] = useState('');

  // Selected patient for Issuing Records / Docs
  const [selectedPatientUid, setSelectedPatientUid] = useState<string>('');
  const [rxVisitDate, setRxVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxPrescription, setRxPrescription] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxFollowUp, setRxFollowUp] = useState('');
  const [savingRx, setSavingRx] = useState(false);
  const [rxStatus, setRxStatus] = useState<StatusBanner | null>(null);

  // Admin attach document to patient
  const [adminDocTitle, setAdminDocTitle] = useState('');
  const [adminDocCategory, setAdminDocCategory] = useState<
    'Lab Report' | 'Prescription' | 'Imaging' | 'Discharge Summary' | 'Other'
  >('Prescription');
  const [adminDocUrl, setAdminDocUrl] = useState('');
  const [savingAdminDoc, setSavingAdminDoc] = useState(false);
  const [adminDocStatus, setAdminDocStatus] = useState<StatusBanner | null>(null);

  const wasOpenRef = useRef(false);

  const hasUnsavedChanges = useMemo(
    () => buildCanonicalContentFingerprint(draft) !== buildCanonicalContentFingerprint(content),
    [draft, content]
  );

  const draftBytes = useMemo(() => estimateCmsPayloadBytes(draft), [draft]);

  // Sync draft when modal opens or when live content refreshes while there are no local edits
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    if (!wasOpenRef.current) {
      setDraft(content);
      setStatusBanner(null);
      setHeroMediaFeedback(null);
      setPendingExitAction(null);
      wasOpenRef.current = true;
      return;
    }

    if (!hasUnsavedChanges) {
      setDraft(content);
    }
  }, [isOpen, content, hasUnsavedChanges]);

  // Attach Admin Firestore listeners when open & authorized (keep subscription stable across patient switches)
  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    const reportListenerError = (err: unknown, path: string, label: string) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        setStatusBanner({
          type: 'error',
          message: `Live ${label} sync error: ${extractReadableError(wrapped, 'Permission or connection issue.')}`,
        });
      }
    };

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as VisitorRecord);
        setVisitors(list);
        setSelectedPatientUid((prev) =>
          prev && list.some((v) => v.uid === prev) ? prev : list[0]?.uid || ''
        );
      },
      (error) => reportListenerError(error, 'users', 'visitors')
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        const map: Record<string, AdminGrantRecord> = {};
        snap.docs.forEach((d) => {
          map[d.id] = d.data() as AdminGrantRecord;
        });
        setAdminGrants(map);
      },
      (error) => reportListenerError(error, 'admins', 'admin roles')
    );

    const unsubAppts = onSnapshot(
      collection(db, 'appointments'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppointmentRecord, 'id'>),
        }));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setAppointments(list);
      },
      (error) => reportListenerError(error, 'appointments', 'appointments')
    );

    const unsubRecords = onSnapshot(
      collection(db, 'medicalRecords'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MedicalRecordItem, 'id'>),
        }));
        list.sort((a, b) => b.visitDate.localeCompare(a.visitDate));
        setMedicalRecords(list);
      },
      (error) => reportListenerError(error, 'medicalRecords', 'medical records')
    );

    const unsubDocs = onSnapshot(
      collection(db, 'patientDocuments'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PatientDocAdminItem, 'id'>),
        }));
        setPatientDocs(list);
      },
      (error) => reportListenerError(error, 'patientDocuments', 'patient documents')
    );

    return () => {
      unsubUsers();
      unsubAdmins();
      unsubAppts();
      unsubRecords();
      unsubDocs();
    };
  }, [isOpen, isAdmin]);

  const requestExit = useCallback(
    (action: () => void) => {
      if (hasUnsavedChanges) {
        setPendingExitAction(() => action);
        return;
      }
      action();
    },
    [hasUnsavedChanges]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingExitAction) {
          setPendingExitAction(null);
        } else {
          requestExit(onClose);
        }
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose, pendingExitAction, requestExit]);

  const filteredVisitors = useMemo(() => {
    const q = visitorSearch.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter(
      (v) =>
        v.displayName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
    );
  }, [visitors, visitorSearch]);

  // Resolved view of copy for currently selected CMS language ('en' or 'bn')
  const activeCopy = useMemo<SiteContentEditableData>(() => {
    if (editingLang === 'en') {
      return draft;
    }

    const bn = draft.bnOverrides || {};
    const pickStr = <K extends keyof SiteContentEditableData>(key: K): string => {
      const custom = bn[key];
      if (typeof custom === 'string' && custom.length > 0) return custom;
      const fallback = DEFAULT_BN_SITE_CONTENT[key];
      return typeof fallback === 'string' ? fallback : String(draft[key] ?? '');
    };

    const occasions: OccasionPhoto[] = draft.occasions.map((enPhoto) => {
      const customBn = bn.occasions?.find((o) => o.id === enPhoto.id);
      const defBn = DEFAULT_BN_SITE_CONTENT.occasions.find((o) => o.id === enPhoto.id);
      const src = customBn || defBn;
      return {
        ...enPhoto,
        figure: src?.figure ?? enPhoto.figure,
        title: src?.title ?? enPhoto.title,
        occasionLabel: src?.occasionLabel ?? enPhoto.occasionLabel,
        categoryLabel: src?.categoryLabel ?? enPhoto.categoryLabel,
        description: src?.description ?? enPhoto.description,
        institution: src?.institution ?? enPhoto.institution,
      };
    });

    const pillars: AccordionPillar[] = draft.pillars.map((enPillar) => {
      const src =
        bn.pillars?.find((p) => p.id === enPillar.id) ||
        DEFAULT_BN_SITE_CONTENT.pillars.find((p) => p.id === enPillar.id);
      return {
        ...enPillar,
        code: src?.code ?? enPillar.code,
        tag: src?.tag ?? enPillar.tag,
        title: src?.title ?? enPillar.title,
        summary: src?.summary ?? enPillar.summary,
      };
    });

    const credentials: CredentialTab[] = draft.credentials.map((enTab) => {
      const src =
        bn.credentials?.find((t) => t.id === enTab.id) ||
        DEFAULT_BN_SITE_CONTENT.credentials.find((t) => t.id === enTab.id);
      if (!src) return enTab;
      return {
        ...enTab,
        index: src.index ?? enTab.index,
        label: src.label ?? enTab.label,
        headline: src.headline ?? enTab.headline,
        summary: src.summary ?? enTab.summary,
        figureCaption: src.figureCaption ?? enTab.figureCaption,
        items: enTab.items.map((it, idx) => src.items[idx] ?? it),
      };
    });

    const faqs: ClinicalFaq[] = draft.faqs.map((enFaq, idx) => {
      const src = bn.faqs?.find((f) => f.id === enFaq.id) || DEFAULT_BN_SITE_CONTENT.faqs[idx];
      return src ? { ...enFaq, question: src.question, answer: src.answer } : enFaq;
    });

    const consultationModes: ConsultationModeOption[] = draft.consultationModes.map((enMode) => {
      const src =
        bn.consultationModes?.find((m) => m.id === enMode.id) ||
        DEFAULT_BN_SITE_CONTENT.consultationModes.find((m) => m.id === enMode.id);
      return src
        ? { ...enMode, title: src.title, summary: src.summary, ctaLabel: src.ctaLabel }
        : enMode;
    });

    const bookingSteps: BookingStepItem[] = draft.bookingSteps.map((enStep, idx) => {
      const src = bn.bookingSteps?.[idx] || DEFAULT_BN_SITE_CONTENT.bookingSteps[idx];
      return src
        ? { ...enStep, index: src.index || enStep.index, title: src.title, detail: src.detail }
        : enStep;
    });

    return {
      heroEyebrow: pickStr('heroEyebrow'),
      heroTitle: pickStr('heroTitle'),
      heroAccentName: pickStr('heroAccentName'),
      heroSubtitle: pickStr('heroSubtitle'),
      heroPrimaryCta: pickStr('heroPrimaryCta'),
      heroSecondaryCta: pickStr('heroSecondaryCta'),
      heroTrustMarker: pickStr('heroTrustMarker'),
      heroMediaSource: draft.heroMediaSource,
      heroMediaKind: draft.heroMediaKind,
      heroMediaUrl: draft.heroMediaUrl,
      heroMediaUploadId: draft.heroMediaUploadId,
      bioSectionKicker: pickStr('bioSectionKicker'),
      bioHeading: pickStr('bioHeading'),
      bioMissionBn: pickStr('bioMissionBn'),
      bioMissionEn: pickStr('bioMissionEn'),
      bioParagraph1: pickStr('bioParagraph1'),
      bioParagraph2: pickStr('bioParagraph2'),
      portraitCaptionTitle: pickStr('portraitCaptionTitle'),
      portraitCaptionSub: pickStr('portraitCaptionSub'),
      competencies:
        bn.competencies && bn.competencies.length > 0
          ? bn.competencies
          : DEFAULT_BN_SITE_CONTENT.competencies,
      pillarsSectionKicker: pickStr('pillarsSectionKicker'),
      pillarsHeading: pickStr('pillarsHeading'),
      pillarsSubheading: pickStr('pillarsSubheading'),
      pillars,
      gallerySectionKicker: pickStr('gallerySectionKicker'),
      galleryHeading: pickStr('galleryHeading'),
      galleryLeadTitle: pickStr('galleryLeadTitle'),
      galleryLeadCopy: pickStr('galleryLeadCopy'),
      occasions,
      credentialsSectionKicker: pickStr('credentialsSectionKicker'),
      credentialsHeading: pickStr('credentialsHeading'),
      credentials,
      highlightKicker: pickStr('highlightKicker'),
      highlightTitle: pickStr('highlightTitle'),
      highlightSummary: pickStr('highlightSummary'),
      highlightCtaLabel: pickStr('highlightCtaLabel'),
      highlightPhotoId: draft.highlightPhotoId,
      faqs,
      consultationModes,
      bookingSteps,
      connectSectionKicker: pickStr('connectSectionKicker'),
      connectHeading: pickStr('connectHeading'),
      connectSubheading: pickStr('connectSubheading'),
      doctorName: pickStr('doctorName'),
      doctorShortName: pickStr('doctorShortName'),
      doctorTitle: pickStr('doctorTitle'),
      bmdcNumber: pickStr('bmdcNumber'),
      institution: pickStr('institution'),
      phoneDisplay: draft.phoneDisplay,
      email: draft.email,
      cvObjective: pickStr('cvObjective'),
      hudBrandLabel: pickStr('hudBrandLabel'),
    };
  }, [draft, editingLang]);

  if (!isOpen || !user || !isAdmin) return null;

  const handleSaveCms = async (): Promise<boolean> => {
    setSavingCms(true);
    setStatusBanner(null);
    try {
      await saveSiteContent(draft);
      setStatusBanner({
        type: 'success',
        message: 'Published live across both English and বাংলা. Visitors see changes immediately.',
      });
      return true;
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Publish failed. Please verify Admin permissions.'),
      });
      return false;
    } finally {
      setSavingCms(false);
    }
  };

  const handleResetCms = async () => {
    setSavingCms(true);
    setStatusBanner(null);
    try {
      await resetSiteContent();
      setDraft({
        ...DEFAULT_SITE_CONTENT,
        bnOverrides: DEFAULT_BN_SITE_CONTENT,
      });
      setStatusBanner({
        type: 'success',
        message: 'Restored default English & বাংলা portfolio content and published live.',
      });
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Reset failed. Please verify Admin permissions.'),
      });
    } finally {
      setSavingCms(false);
    }
  };

  const handleVerifySync = async () => {
    setVerifyingSync(true);
    setShowSyncPanel(true);
    try {
      const report = await verifyLiveSync();
      setSyncReport(report);
      if (report.errorMessage) {
        setStatusBanner({
          type: 'error',
          message: `Sync verification failed: ${report.errorMessage}`,
        });
      } else if (hasUnsavedChanges) {
        setStatusBanner({
          type: 'info',
          message:
            'Database connected. You have unpublished local edits — click "Publish Live Changes" to push them live.',
        });
      } else {
        setStatusBanner({
          type: 'success',
          message: report.inSyncWithFrontend
            ? 'Verified live database connection: frontend is in sync with Firestore.'
            : 'Synced local state with authoritative Firestore server snapshot.',
        });
      }
    } finally {
      setVerifyingSync(false);
    }
  };

  const updateSharedField = <K extends keyof SiteContentEditableData>(
    key: K,
    value: SiteContentEditableData[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateLocalizedField = <K extends keyof SiteContentEditableData>(
    key: K,
    value: SiteContentEditableData[K]
  ) => {
    if (editingLang === 'en') {
      setDraft((prev) => ({ ...prev, [key]: value }));
      return;
    }

    setDraft((prev) => {
      const baseBn: SiteContentBnOverrides = {
        ...DEFAULT_BN_SITE_CONTENT,
        ...(prev.bnOverrides || {}),
      };
      return {
        ...prev,
        bnOverrides: {
          ...baseBn,
          [key]: value,
        },
      };
    });
  };

  // --- Occasion CRUD Helpers ---
  const addOccasion = () => {
    const nextNum = String(draft.occasions.length + 1).padStart(2, '0');
    const nextPhoto: OccasionPhoto = {
      id: `occasion-${Date.now()}`,
      figure: nextNum,
      title: 'New Clinical Moment',
      occasionLabel: 'Clinical Milestone',
      category: 'clinical',
      categoryLabel: 'Surgical & Clinical',
      description: 'Documented clinical or academic milestone.',
      institution: draft.institution,
      primarySrc: draft.occasions[0]?.primarySrc || '/images/hero-portrait.jpeg',
      fallbackSrc: draft.occasions[0]?.fallbackSrc || '/src/assets/images/hero_portrait_1794903188719.jpg',
    };
    setDraft((prev) => ({ ...prev, occasions: [...prev.occasions, nextPhoto] }));
  };

  const updateOccasionShared = (idx: number, patch: Partial<OccasionPhoto>) => {
    setDraft((prev) => {
      const copy = [...prev.occasions];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, occasions: copy };
    });
  };

  const updateOccasionLocalized = (idx: number, patch: Partial<OccasionPhoto>) => {
    if (editingLang === 'en') {
      updateOccasionShared(idx, patch);
      return;
    }
    const targetId = draft.occasions[idx]?.id;
    if (!targetId) return;
    setDraft((prev) => {
      const currentBnOccasions = activeCopy.occasions.map((item) =>
        item.id === targetId ? { ...item, ...patch } : item
      );
      return {
        ...prev,
        bnOverrides: {
          ...DEFAULT_BN_SITE_CONTENT,
          ...(prev.bnOverrides || {}),
          occasions: currentBnOccasions,
        },
      };
    });
  };

  const moveOccasion = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.occasions.length) return prev;
      const copy = [...prev.occasions];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return { ...prev, occasions: copy };
    });
  };

  const deleteOccasion = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      occasions: prev.occasions.filter((_, i) => i !== idx),
    }));
  };

  const handleOccasionImageUpload = async (idx: number, file: File | null) => {
    if (!file) return;
    setUploadingOccasionIdx(idx);
    setStatusBanner(null);
    try {
      const compressed = await compressImageToDataUrl(file, 1000, 0.74);
      const photoId = draft.occasions[idx]?.id || `occasion-${idx + 1}`;
      const mediaRef = await uploadGalleryImageMedia(photoId, compressed);
      updateOccasionShared(idx, { primarySrc: mediaRef });
      setStatusBanner({
        type: 'info',
        message:
          'Replacement photo uploaded to cloud storage. Click "Publish Live Changes" to make it live on the website.',
      });
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Gallery photo upload failed.'),
      });
    } finally {
      setUploadingOccasionIdx(null);
    }
  };

  // --- Hero Video / GIF Handlers ---
  const handleHeroMediaUpload = async (file: File | null) => {
    if (!file) return;
    setHeroUploading(true);
    setHeroUploadProgress(0);
    setHeroMediaFeedback(null);
    setStatusBanner(null);
    try {
      const manifest = await uploadHeroMediaFile(file, (pct) => {
        setHeroUploadProgress(pct);
      });
      const nextDraft: SiteContentData = {
        ...draft,
        heroMediaSource: 'upload',
        heroMediaKind: manifest.mediaKind,
        heroMediaUploadId: manifest.uploadId,
      };
      setDraft(nextDraft);
      await saveSiteContent(nextDraft);
      setHeroPreviewReplay((n) => n + 1);
      const successMsg = `${manifest.mediaKind.toUpperCase()} uploaded & published to the Hero section!`;
      setHeroMediaFeedback({ type: 'success', message: successMsg });
      setStatusBanner({ type: 'success', message: successMsg });
    } catch (error) {
      const errMsg = extractReadableError(error, 'Hero video/GIF upload failed.');
      setHeroMediaFeedback({ type: 'error', message: errMsg });
      setStatusBanner({ type: 'error', message: errMsg });
    } finally {
      setHeroUploading(false);
    }
  };

  const handleClearUploadedHeroMedia = async () => {
    setHeroUploading(true);
    setHeroMediaFeedback(null);
    setStatusBanner(null);
    try {
      await clearUploadedHeroMedia();
      const nextDraft: SiteContentData = {
        ...draft,
        heroMediaSource: 'none',
        heroMediaUploadId: '',
      };
      setDraft(nextDraft);
      await saveSiteContent(nextDraft);
      const msg = 'Removed uploaded clip. Hero now shows portrait photo.';
      setHeroMediaFeedback({ type: 'success', message: msg });
      setStatusBanner({ type: 'success', message: msg });
    } catch (error) {
      const errMsg = extractReadableError(error, 'Could not remove uploaded clip.');
      setHeroMediaFeedback({ type: 'error', message: errMsg });
      setStatusBanner({ type: 'error', message: errMsg });
    } finally {
      setHeroUploading(false);
    }
  };

  // --- Pillar CRUD Helpers ---
  const updatePillarShared = (idx: number, patch: Partial<AccordionPillar>) => {
    setDraft((prev) => {
      const copy = [...prev.pillars];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, pillars: copy };
    });
  };

  const updatePillarLocalized = (idx: number, patch: Partial<AccordionPillar>) => {
    if (editingLang === 'en') {
      updatePillarShared(idx, patch);
      return;
    }
    const targetId = draft.pillars[idx]?.id;
    if (!targetId) return;
    setDraft((prev) => {
      const nextBnPillars = activeCopy.pillars.map((item) =>
        item.id === targetId ? { ...item, ...patch } : item
      );
      return {
        ...prev,
        bnOverrides: {
          ...DEFAULT_BN_SITE_CONTENT,
          ...(prev.bnOverrides || {}),
          pillars: nextBnPillars,
        },
      };
    });
  };

  const addPillar = () => {
    const nextPillar: AccordionPillar = {
      id: `pillar-${Date.now()}`,
      code: String(draft.pillars.length + 1),
      tag: 'Clinical Practice',
      title: 'New Focus Area',
      summary: 'Description of clinical focus area.',
      photoId: draft.occasions[0]?.id || 'hero-portrait',
    };
    setDraft((prev) => ({ ...prev, pillars: [...prev.pillars, nextPillar] }));
  };

  const deletePillar = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      pillars: prev.pillars.filter((_, i) => i !== idx),
    }));
  };

  // --- Credential Matrix CRUD Helpers ---
  const addCredentialTab = () => {
    const nextTab: CredentialTab = {
      id: `cred-${Date.now()}`,
      index: String(draft.credentials.length + 1).padStart(2, '0'),
      label: 'New Credential Group',
      headline: 'Clinical Training',
      summary: 'Summary of achievements or rotations.',
      items: [{ title: 'New Entry', detail: 'Details and institution' }],
      photoId: draft.occasions[0]?.id || 'hospital-building',
      figureCaption: 'Clinical Documentation',
    };
    setDraft((prev) => ({ ...prev, credentials: [...prev.credentials, nextTab] }));
  };

  const updateCredentialTabShared = (idx: number, patch: Partial<CredentialTab>) => {
    setDraft((prev) => {
      const copy = [...prev.credentials];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, credentials: copy };
    });
  };

  const updateCredentialTabLocalized = (idx: number, patch: Partial<CredentialTab>) => {
    if (editingLang === 'en') {
      updateCredentialTabShared(idx, patch);
      return;
    }
    const targetId = draft.credentials[idx]?.id;
    if (!targetId) return;
    setDraft((prev) => {
      const nextBnCreds = activeCopy.credentials.map((item) =>
        item.id === targetId ? { ...item, ...patch } : item
      );
      return {
        ...prev,
        bnOverrides: {
          ...DEFAULT_BN_SITE_CONTENT,
          ...(prev.bnOverrides || {}),
          credentials: nextBnCreds,
        },
      };
    });
  };

  const deleteCredentialTab = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== idx),
    }));
  };

  // --- Admin Promotion Toggle ---
  const toggleAdminRole = async (visitor: VisitorRecord) => {
    if (isSuperAdminEmail(visitor.email)) return;
    const grantRef = doc(db, 'admins', visitor.uid);
    const alreadyAdmin = Boolean(adminGrants[visitor.uid]);
    setStatusBanner(null);

    try {
      try {
        if (alreadyAdmin) {
          await deleteDoc(grantRef);
        } else {
          await setDoc(grantRef, {
            uid: visitor.uid,
            email: visitor.email,
            displayName: visitor.displayName,
            grantedByEmail: user.email || PRIMARY_ADMIN_EMAIL,
            grantedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `admins/${visitor.uid}`);
      }
      setStatusBanner({
        type: 'success',
        message: alreadyAdmin
          ? `Revoked Admin access for ${visitor.displayName}.`
          : `Granted Admin access to ${visitor.displayName}.`,
      });
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Could not update Admin role.'),
      });
    }
  };

  // --- Issue Medical Record / Rx ---
  const handleIssueRecord = async (e: FormEvent) => {
    e.preventDefault();
    const targetPatient = visitors.find((v) => v.uid === selectedPatientUid);
    if (!targetPatient) return;

    const cleanDiagnosis = rxDiagnosis.trim().slice(0, 200);
    const cleanPrescription = rxPrescription.trim().slice(0, 2000);
    const cleanDoctorName = draft.doctorName.trim().slice(0, 120);

    if (!cleanDiagnosis || !cleanPrescription) {
      setRxStatus({
        type: 'error',
        message: 'Please enter both a clinical diagnosis and prescription instructions.',
      });
      return;
    }

    setSavingRx(true);
    setRxStatus(null);
    setStatusBanner(null);
    try {
      try {
        await addDoc(collection(db, 'medicalRecords'), {
          patientUid: targetPatient.uid,
          patientName: targetPatient.displayName.slice(0, 120),
          patientEmail: targetPatient.email.slice(0, 160),
          visitDate: rxVisitDate,
          diagnosis: cleanDiagnosis,
          clinicalNotes: rxNotes.trim().slice(0, 2000),
          prescription: cleanPrescription,
          followUpDate: rxFollowUp.trim().slice(0, 20),
          doctorName: cleanDoctorName || 'Dr. Fariha Ferdousy',
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'medicalRecords');
      }
      setRxDiagnosis('');
      setRxPrescription('');
      setRxNotes('');
      setRxFollowUp('');
      const msg = `Published prescription to ${targetPatient.displayName}'s dashboard.`;
      setRxStatus({ type: 'success', message: msg });
      setStatusBanner({ type: 'success', message: msg });
    } catch (error) {
      const errMsg = extractReadableError(error, 'Failed to publish medical record.');
      setRxStatus({ type: 'error', message: errMsg });
      setStatusBanner({ type: 'error', message: errMsg });
    } finally {
      setSavingRx(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setStatusBanner(null);
    try {
      try {
        await deleteDoc(doc(db, 'medicalRecords', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `medicalRecords/${id}`);
      }
      setStatusBanner({ type: 'success', message: 'Medical record removed.' });
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Could not delete medical record.'),
      });
    }
  };

  const handleDeletePatientDoc = async (id: string) => {
    setStatusBanner(null);
    try {
      try {
        await deleteDoc(doc(db, 'patientDocuments', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `patientDocuments/${id}`);
      }
      setStatusBanner({ type: 'success', message: 'Patient document removed.' });
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Could not remove patient document.'),
      });
    }
  };

  const handleAttachAdminDoc = async (e: FormEvent) => {
    e.preventDefault();
    const targetPatient = visitors.find((v) => v.uid === selectedPatientUid);
    const cleanTitle = adminDocTitle.trim().slice(0, 140);
    const cleanUrl = adminDocUrl.trim();
    if (!targetPatient) return;

    if (cleanTitle.length < 1 || cleanUrl.length < 4) {
      setAdminDocStatus({
        type: 'error',
        message: 'Please provide a document title and valid link or uploaded image.',
      });
      return;
    }
    if (cleanUrl.length > 640_000) {
      setAdminDocStatus({
        type: 'error',
        message: 'Document payload exceeds 640 KB limit. Please compress or share a link.',
      });
      return;
    }

    setSavingAdminDoc(true);
    setAdminDocStatus(null);
    setStatusBanner(null);
    try {
      try {
        await addDoc(collection(db, 'patientDocuments'), {
          patientUid: targetPatient.uid,
          title: cleanTitle,
          category: adminDocCategory,
          docSourceType: cleanUrl.startsWith('data:image/') ? 'image' : 'link',
          urlOrData: cleanUrl,
          notes: `Issued by ${draft.doctorName}`.slice(0, 500),
          uploadedByUid: user.uid,
          uploadedByRole: 'admin',
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'patientDocuments');
      }
      setAdminDocTitle('');
      setAdminDocUrl('');
      const msg = `Sent "${cleanTitle}" to ${targetPatient.displayName}'s dashboard.`;
      setAdminDocStatus({ type: 'success', message: msg });
      setStatusBanner({ type: 'success', message: msg });
    } catch (error) {
      const errMsg = extractReadableError(error, 'Failed to send document to patient.');
      setAdminDocStatus({ type: 'error', message: errMsg });
      setStatusBanner({ type: 'error', message: errMsg });
    } finally {
      setSavingAdminDoc(false);
    }
  };

  const handleAttachAdminDocImage = async (file: File | null) => {
    if (!file) return;
    const targetPatient = visitors.find((v) => v.uid === selectedPatientUid);
    if (!targetPatient) return;

    setSavingAdminDoc(true);
    setAdminDocStatus(null);
    setStatusBanner(null);
    try {
      const compressed = await compressImageToDataUrl(file, 1000, 0.74);
      const cleanTitle = (adminDocTitle.trim() || file.name.replace(/\.[^.]+$/, '')).slice(0, 140);
      try {
        await addDoc(collection(db, 'patientDocuments'), {
          patientUid: targetPatient.uid,
          title: cleanTitle,
          category: adminDocCategory,
          docSourceType: 'image',
          urlOrData: compressed,
          notes: `Issued by ${draft.doctorName}`.slice(0, 500),
          uploadedByUid: user.uid,
          uploadedByRole: 'admin',
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'patientDocuments');
      }
      setAdminDocTitle('');
      setAdminDocUrl('');
      const msg = `Uploaded "${cleanTitle}" directly to ${targetPatient.displayName}'s dashboard.`;
      setAdminDocStatus({ type: 'success', message: msg });
      setStatusBanner({ type: 'success', message: msg });
    } catch (error) {
      const errMsg = extractReadableError(error, 'Failed to upload image document.');
      setAdminDocStatus({ type: 'error', message: errMsg });
      setStatusBanner({ type: 'error', message: errMsg });
    } finally {
      setSavingAdminDoc(false);
    }
  };

  const handleUpdateAppointment = async (
    id: string,
    status: AppointmentRecord['status'],
    adminNotes: string
  ): Promise<boolean> => {
    setStatusBanner(null);
    try {
      try {
        await updateDoc(doc(db, 'appointments', id), {
          status,
          adminNotes: adminNotes.slice(0, 600),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
      }
      setStatusBanner({
        type: 'success',
        message: `Appointment updated to "${status}". Patient dashboard updated live.`,
      });
      return true;
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Could not update appointment.'),
      });
      return false;
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    setStatusBanner(null);
    try {
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
      }
      setStatusBanner({ type: 'success', message: 'Appointment record deleted.' });
    } catch (error) {
      setStatusBanner({
        type: 'error',
        message: extractReadableError(error, 'Could not delete appointment.'),
      });
    }
  };

  const selectedPatient = visitors.find((v) => v.uid === selectedPatientUid);
  const selectedPatientRecords = medicalRecords.filter(
    (r) => r.patientUid === selectedPatientUid
  );
  const selectedPatientDocs = patientDocs.filter(
    (d) => d.patientUid === selectedPatientUid
  );

  const navItems: { id: AdminTab; label: string; icon: typeof FileText }[] = [
    { id: 'copy', label: 'All Site Text & Copy', icon: FileText },
    { id: 'media', label: '10+ Gallery & Pillars', icon: ImagePlus },
    { id: 'credentials', label: 'Credentials Matrix', icon: Layers },
    { id: 'visitors', label: `Visitors & Admins (${visitors.length})`, icon: Users },
    { id: 'clinical', label: `Patients & Appts (${appointments.length})`, icon: FolderHeart },
  ];

  const isEditingCmsTab = activeTab === 'copy' || activeTab === 'media' || activeTab === 'credentials';
  const draftKb = Math.round(draftBytes / 1024);
  const maxSafeKb = Math.round(CMS_MAX_SAFE_BYTES / 1024);
  const liveKb = Math.round(livePayloadBytes / 1024);

  return (
    <div
      data-lenis-prevent
      className="no-print fixed inset-0 z-[10025] bg-[#2A3E4B]/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Super Admin CMS and Clinical Studio"
      onClick={() => requestExit(onClose)}
    >
      <div
        data-lenis-prevent
        className="w-full max-w-7xl h-[93vh] bg-[#F7FBFD] border border-[#D6E6EF] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Admin Header */}
        <div className="bg-white border-b border-[#D6E6EF] px-5 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#2A3E4B] text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="serif-font text-base sm:text-lg font-bold text-[#2A3E4B] truncate">
                  Super Admin Studio
                </h2>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-[11px] font-semibold text-amber-900">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Unsaved Changes</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#21475B] truncate">
                Signed in as {user.email} · {user.emailVerified ? 'Verified' : 'Unverified'} ·{' '}
                <span className="tabular-nums">
                  {lastSyncedAt ? `Live sync: ${lastSyncedAt}` : 'Default bundle'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditingCmsTab && (
              <LiquidSegmentedControl
                size="sm"
                ariaLabel="Select CMS editing language"
                value={editingLang}
                onChange={setEditingLang}
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'bn', label: 'বাংলা' },
                ]}
              />
            )}

            <button
              type="button"
              disabled={verifyingSync}
              onClick={() => void handleVerifySync()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#2A3E4B]"
              title="Verify live Firestore connection & sync status"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#21475B] ${verifyingSync ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{verifyingSync ? 'Checking...' : 'Verify Sync'}</span>
            </button>

            {isEditingCmsTab && (
              <button
                type="button"
                disabled={savingCms}
                onClick={() => void handleResetCms()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#2A3E4B]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#7FA6B8]" />
                <span className="hidden md:inline">Reset Defaults</span>
              </button>
            )}

            {(isEditingCmsTab || hasUnsavedChanges) && (
              <button
                type="button"
                disabled={savingCms}
                onClick={() => void handleSaveCms()}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${
                  hasUnsavedChanges
                    ? 'bg-[#21475B] hover:bg-[#13232D] ring-2 ring-[#7FA6B8]/40'
                    : 'bg-[#2A3E4B] hover:bg-[#7FA6B8]'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingCms ? 'Publishing...' : 'Publish Live Changes'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                requestExit(() => {
                  onClose();
                  onOpenPatientView();
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#2A3E4B]"
            >
              <FolderHeart className="w-3.5 h-3.5 text-[#7FA6B8]" />
              <span className="hidden sm:inline">My Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() =>
                requestExit(() => {
                  void signOutUser();
                  onClose();
                })
              }
              className="p-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-[#2A3E4B]"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => requestExit(onClose)}
              aria-label="Close Admin Studio"
              className="p-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-[#2A3E4B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unsaved Exit Guard Banner */}
        {pendingExitAction && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-amber-950 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                You have unpublished edits in your draft. Publishing saves them live across English &amp; বাংলা.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingExitAction(null)}
                className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-amber-950 hover:bg-amber-100"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = pendingExitAction;
                  setDraft(content);
                  setPendingExitAction(null);
                  next();
                }}
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Discard Changes
              </button>
              <button
                type="button"
                disabled={savingCms}
                onClick={() => {
                  void (async () => {
                    const next = pendingExitAction;
                    const ok = await handleSaveCms();
                    setPendingExitAction(null);
                    if (ok && next) {
                      next();
                    }
                  })();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#21475B] hover:bg-[#13232D] text-white text-xs font-semibold"
              >
                {savingCms ? 'Publishing...' : 'Publish & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Full Non-Truncated Status / Error Banner */}
        {(statusBanner || cmsError) && (
          <div
            role="status"
            className={`px-5 sm:px-7 py-3 border-b flex items-start justify-between gap-3 shrink-0 text-xs font-medium ${
              statusBanner?.type === 'error' || (!statusBanner && cmsError)
                ? 'bg-red-50 border-red-200 text-red-900'
                : statusBanner?.type === 'info'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {statusBanner?.type === 'error' || (!statusBanner && cmsError) ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : statusBanner?.type === 'info' ? (
                <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">
                {statusBanner ? statusBanner.message : cmsError}
              </span>
            </div>
            {statusBanner && (
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md hover:bg-black/5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Live Database Sync Verification Panel */}
        {showSyncPanel && (
          <div className="bg-[#F0F7FB] border-b border-[#C4DBE8] px-5 sm:px-7 py-3.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#13232D]">
                <Database className="w-4 h-4 text-[#21475B]" />
                <span>Live Database Sync Verification</span>
                {syncReport && (
                  <span className="font-normal text-[#21475B] tabular-nums">
                    · Checked {syncReport.checkedAt}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#21475B]">
                  Public Site Preview:{' '}
                  <strong className="text-[#13232D]">
                    {publicLang === 'bn' ? 'বাংলা (BN)' : 'English (EN)'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setPublicLang(publicLang === 'en' ? 'bn' : 'en')}
                  className="px-2.5 py-1 rounded-lg border border-[#C4DBE8] bg-white hover:border-[#21475B] text-[11px] font-semibold text-[#13232D]"
                >
                  Switch Site to {publicLang === 'en' ? 'বাংলা' : 'EN'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSyncPanel(false)}
                  className="p-1 rounded-lg hover:bg-white/70 text-[#21475B]"
                  aria-label="Hide sync diagnostics"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {syncReport ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                <div className="rounded-xl bg-white border border-[#D6E6EF] px-3 py-2">
                  <p className="text-[#5A6F7D] font-semibold">Firestore Connection</p>
                  <p className={`font-bold mt-0.5 ${syncReport.connected ? 'text-emerald-700' : 'text-red-700'}`}>
                    {syncReport.connected ? 'Connected (Server Read OK)' : 'Offline / Disconnected'}
                  </p>
                  <p className="text-[#21475B] mt-0.5 truncate tabular-nums">
                    {syncReport.serverUpdatedAt
                      ? `Published: ${syncReport.serverUpdatedAt}`
                      : 'No published doc yet'}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-[#D6E6EF] px-3 py-2">
                  <p className="text-[#5A6F7D] font-semibold">Frontend ↔ Backend</p>
                  <p
                    className={`font-bold mt-0.5 ${
                      hasUnsavedChanges
                        ? 'text-amber-700'
                        : syncReport.inSyncWithFrontend
                          ? 'text-emerald-700'
                          : 'text-[#21475B]'
                    }`}
                  >
                    {hasUnsavedChanges
                      ? 'Draft Modified (Unpublished)'
                      : syncReport.inSyncWithFrontend
                        ? 'In Sync with Server'
                        : 'Refreshed from Server'}
                  </p>
                  <p className="text-[#21475B] mt-0.5 tabular-nums">
                    Draft: {draftKb} KB · Live: {liveKb} KB / {maxSafeKb} KB
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-[#D6E6EF] px-3 py-2">
                  <p className="text-[#5A6F7D] font-semibold">Admin Auth &amp; Role</p>
                  <p
                    className={`font-bold mt-0.5 ${
                      syncReport.roleStatus === 'unverified-or-standard'
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {syncReport.roleStatus === 'super-admin'
                      ? 'Super Admin (Verified)'
                      : syncReport.roleStatus === 'promoted-admin'
                        ? 'Promoted Admin (Verified)'
                        : 'Unverified / No Write Role'}
                  </p>
                  <p className="text-[#21475B] mt-0.5 truncate">
                    {syncReport.authEmail || 'No email'}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-[#D6E6EF] px-3 py-2">
                  <p className="text-[#5A6F7D] font-semibold">Hero Media Storage</p>
                  <p className="font-bold mt-0.5 text-[#13232D] truncate">
                    {syncReport.heroMediaStatus}
                  </p>
                  <p className="text-[#21475B] mt-0.5 truncate">
                    Editing: {editingLang === 'en' ? 'English' : 'বাংলা'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#21475B]">Verifying authoritative Firestore state...</p>
            )}
          </div>
        )}

        {/* Workspace Body: Sidebar + Main Viewport */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-[#D6E6EF] bg-white p-3 lg:p-4 flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 text-left ${
                    selected
                      ? 'bg-[#2A3E4B] text-white'
                      : 'text-[#2A3E4B]/75 hover:bg-[#F7FBFD] hover:text-[#2A3E4B]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${selected ? 'text-[#D6E6EF]' : 'text-[#7FA6B8]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Tab Content */}
          <div
            data-lenis-prevent
            className="flex-1 h-full min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-6"
          >
            {isEditingCmsTab && (
              <div className="max-w-5xl rounded-2xl border border-[#D6E6EF] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#2A3E4B]/80">
                  {editingLang === 'en' ? (
                    <>
                      Currently editing <strong className="text-[#2A3E4B]">English</strong> live site copy. Switch to <strong className="text-[#2A3E4B]">বাংলা</strong> anytime before clicking <strong className="text-[#2A3E4B]">Publish Live Changes</strong>.
                    </>
                  ) : (
                    <span className="bengali-text">
                      বর্তমানে <strong className="text-[#2A3E4B]">বাংলা সংস্করণের</strong> লেখা সম্পাদনা করছেন — <strong className="text-[#2A3E4B]">Publish Live Changes</strong> ক্লিক করলে উভয় ভাষাই লাইভ আপডেট হবে।
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`mono-font text-[11px] font-semibold px-2.5 py-1 rounded-lg border tabular-nums ${
                      draftBytes > CMS_MAX_SAFE_BYTES
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-[#F7FBFD] border-[#D6E6EF] text-[#21475B]'
                    }`}
                  >
                    SIZE: {draftKb} / {maxSafeKb} KB
                  </span>
                  <span className="mono-font text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F7FBFD] border border-[#D6E6EF] text-[#7FA6B8]">
                    MODE: {editingLang === 'en' ? 'ENGLISH' : 'বাংলা'}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 1: ALL SITE TEXT & COPY */}
            {activeTab === 'copy' && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-4">
                  <h3 className="serif-font text-lg font-bold text-[#2A3E4B]">
                    Doctor Identity, Header &amp; Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Doctor Name" value={activeCopy.doctorName} onChange={(v) => updateLocalizedField('doctorName', v)} />
                    <Field label="Top Bar Wordmark" value={activeCopy.doctorShortName} onChange={(v) => updateLocalizedField('doctorShortName', v)} />
                    <Field label="Professional Title" value={activeCopy.doctorTitle} onChange={(v) => updateLocalizedField('doctorTitle', v)} />
                    <Field label="BMDC Registration" value={activeCopy.bmdcNumber} onChange={(v) => updateLocalizedField('bmdcNumber', v)} />
                    <Field label="Institution" value={activeCopy.institution} onChange={(v) => updateLocalizedField('institution', v)} />
                    <Field label="Phone Number (Shared)" value={draft.phoneDisplay} onChange={(v) => updateSharedField('phoneDisplay', v)} />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-[11px] font-semibold text-[#13232D]">
                          Official Email (Optional · CV Only)
                        </label>
                        {draft.email.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => updateSharedField('email', '')}
                            className="text-[11px] font-semibold text-[#21475B] hover:text-[#13232D] underline"
                          >
                            Clear email
                          </button>
                        )}
                      </div>
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(e) => updateSharedField('email', e.target.value)}
                        placeholder="Add later to include on Printable CV (hidden on site)"
                        className="w-full rounded-xl border border-[#C4DBE8] bg-[#F7FBFD] px-3 py-2 text-xs sm:text-sm text-[#13232D] focus:outline-none focus:border-[#21475B]"
                      />
                      <p className="text-[11px] text-[#21475B] mt-1">
                        Never displayed on the public website. Appears only inside Printable CV &amp; PDF exports when entered.
                      </p>
                    </div>
                    <Field label="Brand Label" value={activeCopy.hudBrandLabel} onChange={(v) => updateLocalizedField('hudBrandLabel', v)} />
                  </div>
                  <TextAreaField label="CV Objective Statement" value={activeCopy.cvObjective} onChange={(v) => updateLocalizedField('cvObjective', v)} rows={2} />
                </div>

                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-4">
                  <h3 className="serif-font text-lg font-bold text-[#2A3E4B]">
                    Scene 1 · Hero Section Text
                  </h3>
                  <Field label="Hero Top Eyebrow" value={activeCopy.heroEyebrow} onChange={(v) => updateLocalizedField('heroEyebrow', v)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Hero Headline (Primary)" value={activeCopy.heroTitle} onChange={(v) => updateLocalizedField('heroTitle', v)} />
                    <Field label="Hero Accent Surname" value={activeCopy.heroAccentName} onChange={(v) => updateLocalizedField('heroAccentName', v)} />
                    <Field label="Primary CTA Label" value={activeCopy.heroPrimaryCta} onChange={(v) => updateLocalizedField('heroPrimaryCta', v)} />
                    <Field label="Secondary CTA Label" value={activeCopy.heroSecondaryCta} onChange={(v) => updateLocalizedField('heroSecondaryCta', v)} />
                  </div>
                  <Field label="Hero Bottom Verification Line" value={activeCopy.heroTrustMarker} onChange={(v) => updateLocalizedField('heroTrustMarker', v)} />
                  <TextAreaField label="Hero Lead Subtitle" value={activeCopy.heroSubtitle} onChange={(v) => updateLocalizedField('heroSubtitle', v)} rows={2} />
                </div>

                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-4">
                  <h3 className="serif-font text-lg font-bold text-[#2A3E4B]">
                    Scene 2 · Biography &amp; Mission
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Section Kicker" value={activeCopy.bioSectionKicker} onChange={(v) => updateLocalizedField('bioSectionKicker', v)} />
                    <Field label="Section Heading" value={activeCopy.bioHeading} onChange={(v) => updateLocalizedField('bioHeading', v)} />
                    <Field label="Portrait Card Title" value={activeCopy.portraitCaptionTitle} onChange={(v) => updateLocalizedField('portraitCaptionTitle', v)} />
                    <Field label="Portrait Card Subtitle" value={activeCopy.portraitCaptionSub} onChange={(v) => updateLocalizedField('portraitCaptionSub', v)} />
                  </div>
                  <TextAreaField label="Mission Quote (Bengali)" value={activeCopy.bioMissionBn} onChange={(v) => updateLocalizedField('bioMissionBn', v)} rows={2} />
                  <TextAreaField label="Mission Quote (Localized / English)" value={activeCopy.bioMissionEn} onChange={(v) => updateLocalizedField('bioMissionEn', v)} rows={2} />
                  <TextAreaField label="Biography Paragraph 1" value={activeCopy.bioParagraph1} onChange={(v) => updateLocalizedField('bioParagraph1', v)} rows={3} />
                  <TextAreaField label="Biography Paragraph 2" value={activeCopy.bioParagraph2} onChange={(v) => updateLocalizedField('bioParagraph2', v)} rows={3} />

                  {/* Competencies List */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-[#2A3E4B] mb-2">
                      Core Clinical Focus Items ({activeCopy.competencies.length}/12)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {activeCopy.competencies.map((comp, idx) => (
                        <span
                          key={`${comp}-${idx}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7FBFD] border border-[#D6E6EF] text-xs font-medium text-[#2A3E4B]"
                        >
                          <span>{comp}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateLocalizedField(
                                'competencies',
                                activeCopy.competencies.filter((_, i) => i !== idx)
                              )
                            }
                            aria-label={`Remove ${comp}`}
                            className="text-[#7FA6B8] hover:text-[#2A3E4B]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={competencyInput}
                        onChange={(e) => setCompetencyInput(e.target.value)}
                        placeholder={editingLang === 'bn' ? 'নতুন ফোকাস যোগ করুন...' : 'Add competency...'}
                        className="flex-1 rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3.5 py-2 text-xs text-[#2A3E4B]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!competencyInput.trim() || activeCopy.competencies.length >= 12) return;
                          updateLocalizedField('competencies', [
                            ...activeCopy.competencies,
                            competencyInput.trim(),
                          ]);
                          setCompetencyInput('');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#2A3E4B] text-white text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-4">
                  <h3 className="serif-font text-lg font-bold text-[#2A3E4B]">
                    Scenes 3–6 · Section Headings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Focus Section Kicker" value={activeCopy.pillarsSectionKicker} onChange={(v) => updateLocalizedField('pillarsSectionKicker', v)} />
                    <Field label="Focus Section Heading" value={activeCopy.pillarsHeading} onChange={(v) => updateLocalizedField('pillarsHeading', v)} />
                    <Field label="Focus Section Subheading" value={activeCopy.pillarsSubheading} onChange={(v) => updateLocalizedField('pillarsSubheading', v)} />
                    <Field label="Gallery Section Kicker" value={activeCopy.gallerySectionKicker} onChange={(v) => updateLocalizedField('gallerySectionKicker', v)} />
                    <Field label="Gallery Section Heading" value={activeCopy.galleryHeading} onChange={(v) => updateLocalizedField('galleryHeading', v)} />
                    <Field label="Gallery Lead Title" value={activeCopy.galleryLeadTitle} onChange={(v) => updateLocalizedField('galleryLeadTitle', v)} />
                    <Field label="Credentials Kicker" value={activeCopy.credentialsSectionKicker} onChange={(v) => updateLocalizedField('credentialsSectionKicker', v)} />
                    <Field label="Credentials Heading" value={activeCopy.credentialsHeading} onChange={(v) => updateLocalizedField('credentialsHeading', v)} />
                    <Field label="Connect Section Kicker" value={activeCopy.connectSectionKicker} onChange={(v) => updateLocalizedField('connectSectionKicker', v)} />
                    <Field label="Connect Section Heading" value={activeCopy.connectHeading} onChange={(v) => updateLocalizedField('connectHeading', v)} />
                  </div>
                  <TextAreaField label="Gallery Lead Copy" value={activeCopy.galleryLeadCopy} onChange={(v) => updateLocalizedField('galleryLeadCopy', v)} rows={2} />
                  <TextAreaField label="Connect Subheading" value={activeCopy.connectSubheading} onChange={(v) => updateLocalizedField('connectSubheading', v)} rows={2} />
                </div>

                {/* Clinical Highlight Card & Patient FAQs Editor */}
                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-5">
                  <h3 className="serif-font text-lg font-bold text-[#2A3E4B]">
                    Scene 5 · Spotlight Highlight Card &amp; Patient FAQs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Highlight Kicker" value={activeCopy.highlightKicker} onChange={(v) => updateLocalizedField('highlightKicker', v)} />
                    <Field label="Highlight Heading" value={activeCopy.highlightTitle} onChange={(v) => updateLocalizedField('highlightTitle', v)} />
                    <Field label="Highlight Button Label" value={activeCopy.highlightCtaLabel} onChange={(v) => updateLocalizedField('highlightCtaLabel', v)} />
                    <div>
                      <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
                        Spotlight Photo (Shared)
                      </label>
                      <select
                        value={draft.highlightPhotoId}
                        onChange={(e) => updateSharedField('highlightPhotoId', e.target.value)}
                        className="w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs text-[#2A3E4B]"
                      >
                        {draft.occasions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.figure} · {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <TextAreaField label="Highlight Summary" value={activeCopy.highlightSummary} onChange={(v) => updateLocalizedField('highlightSummary', v)} rows={2} />

                  <div className="pt-3 border-t border-[#D6E6EF] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#2A3E4B]">
                        Patient FAQs ({activeCopy.faqs.length}/12)
                      </span>
                      {editingLang === 'en' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (draft.faqs.length >= 12) return;
                            updateSharedField('faqs', [
                              ...draft.faqs,
                              {
                                id: `faq-${Date.now()}`,
                                question: 'New patient question?',
                                answer: 'Provide a clear clinical explanation here.',
                              },
                            ]);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D6E6EF] bg-[#F7FBFD] hover:border-[#7FA6B8] text-[11px] font-semibold text-[#2A3E4B]"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add FAQ</span>
                        </button>
                      )}
                    </div>

                    {activeCopy.faqs.map((faq, idx) => (
                      <div key={faq.id} className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="mono-font text-[11px] text-[#7FA6B8]">FAQ #{idx + 1}</span>
                          {editingLang === 'en' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSharedField(
                                  'faqs',
                                  draft.faqs.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-[#2A3E4B]/60 hover:text-[#2A3E4B]"
                              aria-label="Delete FAQ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <Field
                          label="Question"
                          value={faq.question}
                          onChange={(v) => {
                            const next = [...activeCopy.faqs];
                            next[idx] = { ...next[idx], question: v };
                            updateLocalizedField('faqs', next);
                          }}
                        />
                        <TextAreaField
                          label="Answer"
                          value={faq.answer}
                          onChange={(v) => {
                            const next = [...activeCopy.faqs];
                            next[idx] = { ...next[idx], answer: v };
                            updateLocalizedField('faqs', next);
                          }}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consultation Modes & 4-Step Booking Preview Editor */}
                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-4">
                  <h3 className="serif-font text-lg font-bold text-[#2A3E4B]">
                    Scenes 5 &amp; 6 · Consultation Modes &amp; Care Steps
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeCopy.consultationModes.map((modeItem, idx) => (
                      <div key={modeItem.id} className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] p-3.5 space-y-2.5">
                        <Field
                          label={`Mode #${idx + 1} Title`}
                          value={modeItem.title}
                          onChange={(v) => {
                            const next = [...activeCopy.consultationModes];
                            next[idx] = { ...next[idx], title: v };
                            updateLocalizedField('consultationModes', next);
                          }}
                        />
                        <Field
                          label="Button Label"
                          value={modeItem.ctaLabel}
                          onChange={(v) => {
                            const next = [...activeCopy.consultationModes];
                            next[idx] = { ...next[idx], ctaLabel: v };
                            updateLocalizedField('consultationModes', next);
                          }}
                        />
                        <TextAreaField
                          label="Summary"
                          value={modeItem.summary}
                          onChange={(v) => {
                            const next = [...activeCopy.consultationModes];
                            next[idx] = { ...next[idx], summary: v };
                            updateLocalizedField('consultationModes', next);
                          }}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D6E6EF]">
                    {activeCopy.bookingSteps.map((step, idx) => (
                      <div key={`${step.index}-${idx}`} className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] p-3 space-y-2">
                        <Field
                          label={`Step ${step.index} Title`}
                          value={step.title}
                          onChange={(v) => {
                            const next = [...activeCopy.bookingSteps];
                            next[idx] = { ...next[idx], title: v };
                            updateLocalizedField('bookingSteps', next);
                          }}
                        />
                        <Field
                          label={`Step ${step.index} Detail`}
                          value={step.detail}
                          onChange={(v) => {
                            const next = [...activeCopy.bookingSteps];
                            next[idx] = { ...next[idx], detail: v };
                            updateLocalizedField('bookingSteps', next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HERO VIDEO/GIF & GALLERY OCCASIONS CRUD */}
            {activeTab === 'media' && (
              <div className="space-y-6 max-w-5xl">
                {/* Hero Doctor Video / GIF Studio Panel */}
                {(() => {
                  const portraitFallbackPhoto =
                    draft.occasions.find((p) => p.id === 'hero-portrait') ||
                    draft.occasions[1] ||
                    draft.occasions[0];

                  const setSourceMode = (mode: HeroMediaSource) => {
                    updateSharedField('heroMediaSource', mode);
                    setHeroMediaFeedback(null);
                    setHeroPreviewReplay((n) => n + 1);
                  };

                  return (
                    <div className="bg-white border border-[#C4DBE8] rounded-2xl p-5 sm:p-6 space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#21475B] mb-1">
                            <Film className="w-4 h-4" />
                            <span>Hero Spotlight Motion · Play Once &amp; Freeze on Final Frame</span>
                          </div>
                          <h3 className="serif-font text-xl font-bold text-[#13232D]">
                            Hero Doctor Video or GIF
                          </h3>
                          <p className="text-xs text-[#21475B] mt-0.5">
                            Replaces the Hero portrait card with a silent MP4 or GIF that plays once, stops on the closing frame, and replays whenever visitors scroll back to the homepage.
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F7FBFD] border border-[#D6E6EF] text-[#21475B]">
                          Shared EN &amp; বাংলা
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        <div className="lg:col-span-7 space-y-4">
                          {/* Mode Selector */}
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                { id: 'none', label: 'Portrait Photo Only' },
                                { id: 'upload', label: 'Upload MP4 / GIF' },
                                { id: 'url', label: 'External Video / GIF Link' },
                              ] as { id: HeroMediaSource; label: string }[]
                            ).map((opt) => {
                              const active = draft.heroMediaSource === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setSourceMode(opt.id)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                    active
                                      ? 'bg-[#21475B] text-white border-[#21475B]'
                                      : 'bg-[#F7FBFD] text-[#13232D] border-[#D6E6EF] hover:border-[#7FA6B8]'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>

                          {draft.heroMediaSource === 'none' && (
                            <div className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] p-4 text-xs text-[#21475B] leading-relaxed">
                              Showing the static Hero portrait photograph (<strong className="text-[#13232D]">{portraitFallbackPhoto?.title || 'Morning Rounds Courtyard'}</strong>). Choose <strong className="text-[#13232D]">Upload MP4 / GIF</strong> or <strong className="text-[#13232D]">External Video / GIF Link</strong> above to feature a motion clip instead.
                            </div>
                          )}

                          {draft.heroMediaSource === 'upload' && (
                            <div className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] p-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#13232D]">
                                  Upload Short MP4, WebM, MOV, or GIF (max {HERO_MEDIA_MAX_MB_LABEL})
                                </span>
                                {draft.heroMediaUploadId && (
                                  <span className="mono-font text-[11px] font-semibold text-[#21475B]">
                                    Active: {draft.heroMediaKind.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5">
                                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#21475B] hover:bg-[#13232D] text-white text-xs font-semibold cursor-pointer transition-colors">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>
                                    {heroUploading
                                      ? `Uploading ${heroUploadProgress}%...`
                                      : draft.heroMediaUploadId
                                        ? 'Replace Uploaded Video / GIF'
                                        : 'Choose MP4 or GIF File'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,image/gif,.mp4,.gif,.webm,.mov"
                                    disabled={heroUploading}
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0] || null;
                                      e.target.value = '';
                                      void handleHeroMediaUpload(f);
                                    }}
                                  />
                                </label>

                                {draft.heroMediaUploadId && (
                                  <button
                                    type="button"
                                    disabled={heroUploading}
                                    onClick={() => void handleClearUploadedHeroMedia()}
                                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#13232D]"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove Clip</span>
                                  </button>
                                )}
                              </div>

                              {heroUploading && (
                                <div className="w-full h-2 rounded-full bg-[#D6E6EF] overflow-hidden">
                                  <div
                                    className="h-full bg-[#21475B] transition-all duration-200"
                                    style={{ width: `${heroUploadProgress}%` }}
                                  />
                                </div>
                              )}

                              <p className="text-[11px] text-[#21475B]">
                                Uploaded clips are stored safely in chunked cloud storage and published to the Hero section immediately when upload finishes.
                              </p>
                            </div>
                          )}

                          {draft.heroMediaSource === 'url' && (
                            <div className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] p-4 space-y-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-[#13232D] mb-1">
                                  Direct MP4 or GIF URL
                                </label>
                                <div className="flex items-center gap-2">
                                  <Link2 className="w-4 h-4 text-[#21475B] shrink-0" />
                                  <input
                                    type="url"
                                    value={draft.heroMediaUrl}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const detected = inferHeroMediaKindFromUrl(val);
                                      setDraft((prev) => ({
                                        ...prev,
                                        heroMediaUrl: val,
                                        heroMediaKind: detected,
                                      }));
                                    }}
                                    placeholder="https://example.com/dr-fariha-intro.mp4"
                                    className="flex-1 rounded-xl border border-[#C4DBE8] bg-white px-3 py-2 text-xs text-[#13232D] focus:outline-none focus:border-[#21475B]"
                                  />
                                </div>
                                {draft.heroMediaUrl.trim().length > 0 &&
                                  !isValidHttpMediaUrl(draft.heroMediaUrl) && (
                                    <p className="text-[11px] text-[#9A3412] mt-1 font-medium">
                                      Please enter a valid https:// direct link to an MP4 or GIF file.
                                    </p>
                                  )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-[#13232D]">
                                  Media Format
                                </span>
                                <div className="flex gap-1.5">
                                  {(['mp4', 'gif'] as HeroMediaKind[]).map((fmt) => (
                                    <button
                                      key={fmt}
                                      type="button"
                                      onClick={() => {
                                        updateSharedField('heroMediaKind', fmt);
                                        setHeroPreviewReplay((n) => n + 1);
                                      }}
                                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                        draft.heroMediaKind === fmt
                                          ? 'bg-[#21475B] text-white border-[#21475B]'
                                          : 'bg-white text-[#13232D] border-[#D6E6EF]'
                                      }`}
                                    >
                                      {fmt === 'mp4' ? 'MP4 / Video' : 'Animated GIF'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <p className="text-[11px] text-[#21475B]">
                                  Click <strong className="text-[#13232D]">Publish Live Changes</strong> in the header or publish directly below.
                                </p>
                                <button
                                  type="button"
                                  disabled={savingCms || !isValidHttpMediaUrl(draft.heroMediaUrl)}
                                  onClick={() => void handleSaveCms()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21475B] hover:bg-[#13232D] disabled:opacity-50 text-white text-[11px] font-semibold"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{savingCms ? 'Publishing...' : 'Publish Link Now'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {heroMediaFeedback && (
                            <p
                              className={`text-xs font-semibold rounded-xl px-3.5 py-2 border flex items-start gap-2 ${
                                heroMediaFeedback.type === 'error'
                                  ? 'bg-red-50 border-red-200 text-red-900'
                                  : 'bg-[#F7FBFD] border-[#C4DBE8] text-[#21475B]'
                              }`}
                            >
                              {heroMediaFeedback.type === 'error' ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              ) : (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                              <span>{heroMediaFeedback.message}</span>
                            </p>
                          )}
                        </div>

                        {/* Live Admin Preview Box */}
                        <div className="lg:col-span-5 space-y-2.5">
                          <div className="relative h-64 rounded-2xl border border-[#D6E6EF] bg-[#D6E6EF]/35 overflow-hidden">
                            {draft.heroMediaSource !== 'none' ? (
                              <HeroMotionMedia
                                source={draft.heroMediaSource}
                                kind={draft.heroMediaKind}
                                mediaUrl={draft.heroMediaUrl}
                                uploadId={draft.heroMediaUploadId}
                                isActive={isOpen && activeTab === 'media'}
                                replayNonce={heroPreviewReplay}
                                alt="Hero doctor clip preview"
                                onPlaybackState={setHeroPreviewState}
                                posterFallback={
                                  portraitFallbackPhoto ? (
                                    <OccasionImage
                                      primarySrc={portraitFallbackPhoto.primarySrc}
                                      fallbackSrc={portraitFallbackPhoto.fallbackSrc}
                                      alt={portraitFallbackPhoto.title}
                                      className="w-full h-full object-cover object-top"
                                    />
                                  ) : null
                                }
                              />
                            ) : portraitFallbackPhoto ? (
                              <OccasionImage
                                primarySrc={portraitFallbackPhoto.primarySrc}
                                fallbackSrc={portraitFallbackPhoto.fallbackSrc}
                                alt={portraitFallbackPhoto.title}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : null}

                            <div className="absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-[#1A2B36]/80 to-transparent pointer-events-none" />
                            <div className="absolute left-3 right-3 bottom-2.5 z-20 flex items-center justify-between gap-2 text-white">
                              <span className="text-[11px] font-semibold truncate">
                                {draft.portraitCaptionTitle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-[#21475B] font-medium">
                              {draft.heroMediaSource === 'none'
                                ? 'Showing portrait photo'
                                : heroPreviewState === 'playing'
                                  ? 'Playing single cycle...'
                                  : heroPreviewState === 'ended'
                                    ? 'Stopped on final frame'
                                    : heroPreviewState === 'error'
                                      ? 'Clip unavailable — using photo fallback'
                                      : heroPreviewState === 'loading'
                                        ? 'Loading clip...'
                                        : 'Ready'}
                            </span>
                            {draft.heroMediaSource !== 'none' && (
                              <button
                                type="button"
                                onClick={() => setHeroPreviewReplay((n) => n + 1)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D6E6EF] bg-[#F7FBFD] hover:border-[#7FA6B8] text-[#13232D] font-semibold"
                              >
                                <Play className="w-3 h-3" />
                                <span>Replay Preview</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="serif-font text-xl font-bold text-[#2A3E4B]">
                      Occasion Photographs ({activeCopy.occasions.length})
                    </h3>
                    <p className="text-xs text-[#2A3E4B]/70">
                      {editingLang === 'en'
                        ? 'Add, edit, reorder, upload images, or remove any occasion from the portfolio gallery. Replacement uploads store cleanly in cloud media.'
                        : 'Translate each gallery photo title, occasion subtitle, institution, and story into বাংলা.'}
                    </p>
                  </div>
                  {editingLang === 'en' && (
                    <button
                      type="button"
                      onClick={addOccasion}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A3E4B] hover:bg-[#7FA6B8] text-white text-xs font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Occasion Photo</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {activeCopy.occasions.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="bg-white border border-[#D6E6EF] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start"
                    >
                      <div className="md:col-span-3 space-y-2">
                        <OccasionImage
                          primarySrc={photo.primarySrc}
                          fallbackSrc={photo.fallbackSrc}
                          alt={photo.title}
                          className="w-full h-36 object-cover rounded-xl border border-[#D6E6EF] bg-[#F7FBFD]"
                        />
                        <label
                          className={`block text-center py-1.5 px-2 rounded-lg border border-[#D6E6EF] bg-[#F7FBFD] hover:border-[#7FA6B8] text-[11px] font-semibold text-[#2A3E4B] ${
                            uploadingOccasionIdx === idx ? 'opacity-60 pointer-events-none' : 'cursor-pointer'
                          }`}
                        >
                          {uploadingOccasionIdx === idx
                            ? 'Uploading Photo...'
                            : 'Upload Replacement Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingOccasionIdx === idx}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              e.target.value = '';
                              void handleOccasionImageUpload(idx, file);
                            }}
                          />
                        </label>
                        {isFirestoreMediaRef(photo.primarySrc) && (
                          <p className="text-[10px] text-center font-medium text-[#21475B]">
                            Cloud media linked
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-9 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="mono-font text-xs font-semibold text-[#7FA6B8]">
                            #{idx + 1} · ID: {photo.id}
                          </span>
                          {editingLang === 'en' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => moveOccasion(idx, -1)}
                                className="p-1.5 rounded-lg border border-[#D6E6EF] text-[#2A3E4B] hover:border-[#7FA6B8]"
                                aria-label="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOccasion(idx, 1)}
                                className="p-1.5 rounded-lg border border-[#D6E6EF] text-[#2A3E4B] hover:border-[#7FA6B8]"
                                aria-label="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteOccasion(idx)}
                                className="p-1.5 rounded-lg border border-[#D6E6EF] text-[#2A3E4B]/70 hover:text-[#2A3E4B]"
                                aria-label={`Delete ${photo.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field
                            label="Figure Number"
                            value={photo.figure}
                            onChange={(v) => updateOccasionLocalized(idx, { figure: v })}
                          />
                          <Field
                            label="Title"
                            value={photo.title}
                            onChange={(v) => updateOccasionLocalized(idx, { title: v })}
                          />
                          <Field
                            label="Occasion Subtitle"
                            value={photo.occasionLabel}
                            onChange={(v) => updateOccasionLocalized(idx, { occasionLabel: v })}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
                              Category (Shared)
                            </label>
                            <select
                              value={draft.occasions[idx]?.category || photo.category}
                              onChange={(e) => {
                                const cat = e.target.value as OccasionCategory;
                                const catLabel =
                                  cat === 'clinical'
                                    ? 'Surgical & Clinical'
                                    : cat === 'honors'
                                      ? 'Academic & Honors'
                                      : 'Campus & Milestones';
                                updateOccasionShared(idx, { category: cat, categoryLabel: catLabel });
                              }}
                              className="w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs text-[#2A3E4B]"
                            >
                              <option value="clinical">Surgical &amp; Clinical</option>
                              <option value="honors">Academic &amp; Honors</option>
                              <option value="milestones">Campus &amp; Milestones</option>
                            </select>
                          </div>
                          <Field
                            label="Institution"
                            value={photo.institution}
                            onChange={(v) => updateOccasionLocalized(idx, { institution: v })}
                          />
                          <Field
                            label="Image Path / URL (Shared)"
                            value={draft.occasions[idx]?.primarySrc || photo.primarySrc}
                            onChange={(v) => updateOccasionShared(idx, { primarySrc: v })}
                          />
                        </div>

                        <TextAreaField
                          label="Description"
                          value={photo.description}
                          onChange={(v) => updateOccasionLocalized(idx, { description: v })}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clinical Panorama Pillars CRUD */}
                <div className="pt-6 border-t border-[#D6E6EF] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="serif-font text-xl font-bold text-[#2A3E4B]">
                      Clinical Panorama Chapters ({activeCopy.pillars.length})
                    </h3>
                    {editingLang === 'en' && (
                      <button
                        type="button"
                        onClick={addPillar}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#2A3E4B]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chapter</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCopy.pillars.map((pillar, idx) => (
                      <div
                        key={pillar.id}
                        className="bg-white border border-[#D6E6EF] rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="mono-font text-xs font-semibold text-[#7FA6B8]">
                            Chapter {pillar.code}
                          </span>
                          {editingLang === 'en' && (
                            <button
                              type="button"
                              onClick={() => deletePillar(idx)}
                              className="text-[#2A3E4B]/60 hover:text-[#2A3E4B]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field label="Numeral" value={pillar.code} onChange={(v) => updatePillarLocalized(idx, { code: v })} />
                          <Field label="Tag" value={pillar.tag} onChange={(v) => updatePillarLocalized(idx, { tag: v })} />
                          <Field label="Title" value={pillar.title} onChange={(v) => updatePillarLocalized(idx, { title: v })} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
                            Paired Occasion Photo (Shared)
                          </label>
                          <select
                            value={draft.pillars[idx]?.photoId || pillar.photoId}
                            onChange={(e) => updatePillarShared(idx, { photoId: e.target.value })}
                            className="w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs text-[#2A3E4B]"
                          >
                            {draft.occasions.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.figure} · {o.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <TextAreaField label="Summary" value={pillar.summary} onChange={(v) => updatePillarLocalized(idx, { summary: v })} rows={2} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CREDENTIALS MATRIX CRUD */}
            {activeTab === 'credentials' && (
              <div className="space-y-5 max-w-4xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="serif-font text-xl font-bold text-[#2A3E4B]">
                      Credentials &amp; Training Tabs ({activeCopy.credentials.length})
                    </h3>
                    <p className="text-xs text-[#2A3E4B]/70">
                      Edit every credential category and nested line item—reflected automatically in both Scene 5 and the Printable CV.
                    </p>
                  </div>
                  {editingLang === 'en' && (
                    <button
                      type="button"
                      onClick={addCredentialTab}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2A3E4B] hover:bg-[#7FA6B8] text-white text-xs font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Credential Group</span>
                    </button>
                  )}
                </div>

                {activeCopy.credentials.map((tab, tIdx) => (
                  <div
                    key={tab.id}
                    className="bg-white border border-[#D6E6EF] rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#D6E6EF] pb-3">
                      <span className="serif-font text-base font-bold text-[#2A3E4B]">
                        {tab.index}. {tab.label}
                      </span>
                      {editingLang === 'en' && (
                        <button
                          type="button"
                          onClick={() => deleteCredentialTab(tIdx)}
                          className="text-xs font-semibold text-[#2A3E4B]/60 hover:text-[#2A3E4B] inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Group</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Index" value={tab.index} onChange={(v) => updateCredentialTabLocalized(tIdx, { index: v })} />
                      <Field label="Tab Label" value={tab.label} onChange={(v) => updateCredentialTabLocalized(tIdx, { label: v })} />
                      <Field label="Headline" value={tab.headline} onChange={(v) => updateCredentialTabLocalized(tIdx, { headline: v })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
                          Paired Photo (Shared)
                        </label>
                        <select
                          value={draft.credentials[tIdx]?.photoId || tab.photoId}
                          onChange={(e) => updateCredentialTabShared(tIdx, { photoId: e.target.value })}
                          className="w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs text-[#2A3E4B]"
                        >
                          {draft.occasions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.figure} · {o.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Field label="Photo Caption" value={tab.figureCaption} onChange={(v) => updateCredentialTabLocalized(tIdx, { figureCaption: v })} />
                    </div>

                    <TextAreaField label="Summary" value={tab.summary} onChange={(v) => updateCredentialTabLocalized(tIdx, { summary: v })} rows={2} />

                    {/* Nested Items */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#7FA6B8]">
                          Items ({tab.items.length})
                        </span>
                        {editingLang === 'en' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateCredentialTabShared(tIdx, {
                                items: [...draft.credentials[tIdx].items, { title: 'New Item', detail: 'Details' }],
                              })
                            }
                            className="text-xs font-semibold text-[#2A3E4B] hover:text-[#7FA6B8] inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Item</span>
                          </button>
                        )}
                      </div>

                      {tab.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const nextItems = [...tab.items];
                              nextItems[iIdx] = { ...nextItems[iIdx], title: e.target.value };
                              updateCredentialTabLocalized(tIdx, { items: nextItems });
                            }}
                            placeholder="Title"
                            className="flex-1 w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs text-[#2A3E4B]"
                          />
                          <input
                            type="text"
                            value={item.detail}
                            onChange={(e) => {
                              const nextItems = [...tab.items];
                              nextItems[iIdx] = { ...nextItems[iIdx], detail: e.target.value };
                              updateCredentialTabLocalized(tIdx, { items: nextItems });
                            }}
                            placeholder="Detail"
                            className="flex-1 w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs text-[#2A3E4B]"
                          />
                          {editingLang === 'en' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateCredentialTabShared(tIdx, {
                                  items: draft.credentials[tIdx].items.filter((_, idx) => idx !== iIdx),
                                })
                              }
                              className="p-2 text-[#2A3E4B]/55 hover:text-[#2A3E4B]"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: VISITORS & ADMIN ROLE PROMOTION */}
            {activeTab === 'visitors' && (
              <div className="space-y-5 max-w-5xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="serif-font text-xl font-bold text-[#2A3E4B]">
                      Registered Visitors &amp; Role Management
                    </h3>
                    <p className="text-xs text-[#2A3E4B]/70">
                      Inspect every visitor who signed in with Google and grant or revoke Admin access.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-[#7FA6B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={visitorSearch}
                      onChange={(e) => setVisitorSearch(e.target.value)}
                      placeholder="Filter by name or email..."
                      className="w-full rounded-xl border border-[#D6E6EF] bg-white pl-9 pr-3.5 py-2 text-xs text-[#2A3E4B] focus:outline-none focus:border-[#7FA6B8]"
                    />
                  </div>
                </div>

                {filteredVisitors.length === 0 ? (
                  <div className="bg-white border border-[#D6E6EF] rounded-2xl p-8 text-center text-sm text-[#2A3E4B]/70">
                    No matching signed-in visitors found yet.
                  </div>
                ) : (
                  <div className="bg-white border border-[#D6E6EF] rounded-2xl overflow-hidden divide-y divide-[#D6E6EF]">
                    {filteredVisitors.map((visitor) => {
                      const superFlag = isSuperAdminEmail(visitor.email);
                      const promotedFlag = Boolean(adminGrants[visitor.uid]);
                      return (
                        <div
                          key={visitor.uid}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7FBFD]/60 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {visitor.photoURL ? (
                              <img
                                src={visitor.photoURL}
                                alt={visitor.displayName}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full border border-[#D6E6EF] object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#D6E6EF] text-[#2A3E4B] flex items-center justify-center font-bold text-xs shrink-0">
                                {visitor.displayName[0]?.toUpperCase() || 'V'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#2A3E4B] truncate">
                                {visitor.displayName}
                              </p>
                              <p className="text-xs text-[#7FA6B8] truncate">
                                {visitor.email} ·{' '}
                                <span className="mono-font">{visitor.visitCount} visits</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold text-[#2A3E4B]/75">
                              {superFlag
                                ? 'Super Admin'
                                : promotedFlag
                                  ? 'Promoted Admin'
                                  : 'Visitor / Patient'}
                            </span>

                            {!superFlag ? (
                              <button
                                type="button"
                                onClick={() => void toggleAdminRole(visitor)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                  promotedFlag
                                    ? 'border border-[#D6E6EF] bg-white hover:border-[#2A3E4B] text-[#2A3E4B]'
                                    : 'bg-[#2A3E4B] hover:bg-[#7FA6B8] text-white'
                                }`}
                              >
                                {promotedFlag ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-[#7FA6B8]" />
                                    <span>Revoke Admin</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Make Admin</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="mono-font text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#D6E6EF]/60 text-[#2A3E4B]">
                                Protected
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientUid(visitor.uid);
                                setActiveTab('clinical');
                              }}
                              className="px-3 py-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#2A3E4B]"
                            >
                              Patient File
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PATIENT RECORDS, PRESCRIPTIONS & APPOINTMENTS */}
            {activeTab === 'clinical' && (
              <div className="space-y-8 max-w-5xl">
                {/* Patient Selector & Issue Rx / Documents */}
                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D6E6EF] pb-4">
                    <div>
                      <h3 className="serif-font text-xl font-bold text-[#2A3E4B]">
                        Patient Medical Records &amp; Prescriptions
                      </h3>
                      <p className="text-xs text-[#2A3E4B]/70">
                        Select a patient to issue prescriptions, clinical visit notes, or official documents directly to their dashboard.
                      </p>
                    </div>

                    <select
                      value={selectedPatientUid}
                      onChange={(e) => setSelectedPatientUid(e.target.value)}
                      aria-label="Select patient"
                      className="rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3.5 py-2 text-xs font-semibold text-[#2A3E4B] min-w-[240px]"
                    >
                      {visitors.length === 0 && <option value="">No registered visitors yet</option>}
                      {visitors.map((v) => (
                        <option key={v.uid} value={v.uid}>
                          {v.displayName} ({v.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPatient && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Form: Issue Prescription & Visit Note */}
                      <form onSubmit={handleIssueRecord} className="space-y-3.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#7FA6B8]">
                          Issue Prescription to {selectedPatient.displayName}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Visit Date" value={rxVisitDate} onChange={setRxVisitDate} type="date" />
                          <Field label="Follow-Up Date (Opt)" value={rxFollowUp} onChange={setRxFollowUp} type="date" />
                        </div>

                        <Field
                          label="Clinical Diagnosis / Assessment"
                          value={rxDiagnosis}
                          onChange={setRxDiagnosis}
                          placeholder="e.g., Post-operative suture review"
                          required
                        />

                        <TextAreaField
                          label="Prescription (Rx)"
                          value={rxPrescription}
                          onChange={setRxPrescription}
                          placeholder="Medications, dosage, and instructions..."
                          rows={3}
                          required
                        />

                        <TextAreaField
                          label="Clinical Visit Notes"
                          value={rxNotes}
                          onChange={setRxNotes}
                          placeholder="Observations, dressing guidance, warning signs..."
                          rows={2}
                        />

                        {rxStatus && (
                          <p
                            className={`text-xs font-semibold ${
                              rxStatus.type === 'error' ? 'text-red-700' : 'text-emerald-700'
                            }`}
                          >
                            {rxStatus.message}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={savingRx}
                          className="px-5 py-2.5 rounded-xl bg-[#2A3E4B] hover:bg-[#7FA6B8] text-white text-xs font-semibold transition-colors"
                        >
                          {savingRx ? 'Publishing...' : 'Publish to Patient Dashboard'}
                        </button>
                      </form>

                      {/* Form: Attach Clinic Document + Existing Patient File */}
                      <div className="space-y-5">
                        <form
                          onSubmit={handleAttachAdminDoc}
                          className="bg-[#F7FBFD] border border-[#D6E6EF] rounded-2xl p-4 space-y-3"
                        >
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#7FA6B8]">
                            Attach Official Document / Report
                          </h4>
                          <div className="grid grid-cols-2 gap-2.5">
                            <Field
                              label="Document Title"
                              value={adminDocTitle}
                              onChange={setAdminDocTitle}
                              placeholder="Discharge Summary"
                              required
                            />
                            <div>
                              <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
                                Category
                              </label>
                              <select
                                value={adminDocCategory}
                                onChange={(e) =>
                                  setAdminDocCategory(
                                    e.target.value as typeof adminDocCategory
                                  )
                                }
                                className="w-full rounded-xl border border-[#D6E6EF] bg-white px-3 py-2 text-xs text-[#2A3E4B]"
                              >
                                <option value="Prescription">Prescription</option>
                                <option value="Lab Report">Lab Report</option>
                                <option value="Imaging">Imaging</option>
                                <option value="Discharge Summary">Discharge Summary</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                          <Field
                            label="Document URL (or paste image link)"
                            value={adminDocUrl}
                            onChange={setAdminDocUrl}
                            placeholder="https://..."
                            required
                          />
                          {adminDocStatus && (
                            <p
                              className={`text-xs font-semibold ${
                                adminDocStatus.type === 'error' ? 'text-red-700' : 'text-emerald-700'
                              }`}
                            >
                              {adminDocStatus.message}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="submit"
                              disabled={savingAdminDoc}
                              className="px-4 py-2 rounded-xl bg-[#21475B] hover:bg-[#13232D] text-white text-xs font-semibold transition-colors"
                            >
                              {savingAdminDoc ? 'Attaching...' : 'Send Link to Patient'}
                            </button>
                            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D6E6EF] bg-white hover:border-[#7FA6B8] text-xs font-semibold text-[#2A3E4B] cursor-pointer">
                              <Upload className="w-3.5 h-3.5 text-[#21475B]" />
                              <span>Upload Image Report</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={savingAdminDoc}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  e.target.value = '';
                                  void handleAttachAdminDocImage(f);
                                }}
                              />
                            </label>
                          </div>
                        </form>

                        {/* Summary of this patient's records & docs */}
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold text-[#2A3E4B]">
                            Existing Records ({selectedPatientRecords.length}) &amp; Documents (
                            {selectedPatientDocs.length})
                          </p>
                          <div
                            data-lenis-prevent
                            className="max-h-52 overflow-y-auto overscroll-contain space-y-2 pr-1"
                          >
                            {selectedPatientRecords.map((rec) => (
                              <div
                                key={rec.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F7FBFD] border border-[#D6E6EF] text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#2A3E4B] truncate">
                                    {rec.diagnosis}
                                  </p>
                                  <p className="mono-font text-[11px] text-[#7FA6B8]">
                                    {rec.visitDate}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteRecord(rec.id)}
                                  className="text-[#2A3E4B]/55 hover:text-[#2A3E4B]"
                                  aria-label="Delete medical record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {selectedPatientDocs.map((d) => (
                              <div
                                key={d.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#D6E6EF] text-xs"
                              >
                                <span className="truncate font-medium text-[#2A3E4B]">
                                  {d.title} ({d.category})
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] text-[#7FA6B8]">
                                    {d.uploadedByRole}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeletePatientDoc(d.id)}
                                    className="text-[#2A3E4B]/55 hover:text-[#2A3E4B]"
                                    aria-label={`Remove ${d.title}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consultation Appointments Queue */}
                <div className="bg-white border border-[#D6E6EF] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#7FA6B8]" />
                    <h3 className="serif-font text-xl font-bold text-[#2A3E4B]">
                      Consultation Appointments ({appointments.length})
                    </h3>
                  </div>

                  {appointments.length === 0 ? (
                    <p className="text-sm text-[#2A3E4B]/70">
                      No patient appointment requests submitted yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((appt) => (
                        <AppointmentAdminRow
                          key={appt.id}
                          appt={appt}
                          onSave={(status, notes) =>
                            handleUpdateAppointment(appt.id, status, notes)
                          }
                          onDelete={() => void handleDeleteAppointment(appt.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs sm:text-sm text-[#2A3E4B] focus:outline-none focus:border-[#7FA6B8]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#2A3E4B] mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#D6E6EF] bg-[#F7FBFD] px-3 py-2 text-xs sm:text-sm text-[#2A3E4B] focus:outline-none focus:border-[#7FA6B8]"
      />
    </div>
  );
}

function AppointmentAdminRow({
  appt,
  onSave,
  onDelete,
}: {
  appt: AppointmentRecord;
  onSave: (status: AppointmentRecord['status'], notes: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [status, setStatus] = useState<AppointmentRecord['status']>(appt.status);
  const [notes, setNotes] = useState(appt.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setStatus(appt.status);
    setNotes(appt.adminNotes || '');
  }, [appt.status, appt.adminNotes]);

  const handleSaveClick = async () => {
    setSaving(true);
    setSavedFlag(false);
    const ok = await onSave(status, notes);
    setSaving(false);
    if (ok) {
      setSavedFlag(true);
      window.setTimeout(() => setSavedFlag(false), 2500);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#F7FBFD] border border-[#D6E6EF] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="mono-font text-xs font-semibold text-[#7FA6B8]">
          {appt.date} · {appt.slot} · {appt.mode}
        </p>
        <p className="text-sm font-bold text-[#2A3E4B]">
          {appt.patientName} <span className="font-normal text-[#2A3E4B]/70">({appt.phone})</span>
        </p>
        {appt.reason && <p className="text-xs text-[#2A3E4B]/75">{appt.reason}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentRecord['status'])}
          className="rounded-xl border border-[#D6E6EF] bg-white px-3 py-2 text-xs font-semibold text-[#2A3E4B]"
        >
          <option value="requested">Requested</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Clinic note..."
          className="rounded-xl border border-[#D6E6EF] bg-white px-3 py-2 text-xs text-[#2A3E4B] w-44"
        />

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveClick()}
          className="px-3.5 py-2 rounded-xl bg-[#2A3E4B] hover:bg-[#7FA6B8] disabled:opacity-60 text-white text-xs font-semibold"
        >
          {saving ? 'Saving...' : savedFlag ? 'Saved' : 'Update'}
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete appointment"
          className="p-2 text-[#2A3E4B]/60 hover:text-[#2A3E4B]"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
