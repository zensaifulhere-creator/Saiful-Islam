import { FormEvent, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Calendar,
  ExternalLink,
  FileImage,
  FileText,
  Link2,
  LogOut,
  Plus,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumberLocale, formatSlotLabel } from '../data/translations';
import { db, extractReadableError, handleFirestoreError, OperationType } from '../lib/firebase';
import { compressImageToDataUrl } from '../lib/imageCompression';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

interface PatientDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
  onOpenAdmin: () => void;
}

interface PatientAppointment {
  id: string;
  patientName: string;
  mode: string;
  date: string;
  slot: string;
  reason?: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  adminNotes?: string;
}

interface PatientMedicalRecord {
  id: string;
  visitDate: string;
  diagnosis: string;
  clinicalNotes?: string;
  prescription: string;
  followUpDate?: string;
  doctorName: string;
}

interface PatientDocumentItem {
  id: string;
  title: string;
  category: 'Lab Report' | 'Prescription' | 'Imaging' | 'Discharge Summary' | 'Other';
  docSourceType: 'link' | 'image';
  urlOrData: string;
  notes?: string;
  uploadedByRole: 'patient' | 'admin';
}

type DashboardTab = 'records' | 'documents' | 'appointments';

export function PatientDashboardModal({
  isOpen,
  onClose,
  onOpenBooking,
  onOpenAdmin,
}: PatientDashboardModalProps) {
  const { user, isAdmin, signOutUser } = useAuth();
  const { localizedContent } = useCms();
  const { lang, isBn, ui } = useLanguage();

  const [activeTab, setActiveTab] = useState<DashboardTab>('records');
  const [records, setRecords] = useState<PatientMedicalRecord[]>([]);
  const [documents, setDocuments] = useState<PatientDocumentItem[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Document Form State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<PatientDocumentItem['category']>('Lab Report');
  const [docSourceType, setDocSourceType] = useState<'link' | 'image'>('image');
  const [docUrlOrData, setDocUrlOrData] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docError, setDocError] = useState<string | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Document Image Preview Modal
  const [previewDoc, setPreviewDoc] = useState<PatientDocumentItem | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setDashboardError(null);

    const recQuery = query(
      collection(db, 'medicalRecords'),
      where('patientUid', '==', user.uid)
    );
    const docQuery = query(
      collection(db, 'patientDocuments'),
      where('patientUid', '==', user.uid)
    );
    const apptQuery = query(
      collection(db, 'appointments'),
      where('patientUid', '==', user.uid)
    );

    const unsubRecords = onSnapshot(
      recQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PatientMedicalRecord, 'id'>),
        }));
        list.sort((a, b) => b.visitDate.localeCompare(a.visitDate));
        setRecords(list);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'medicalRecords');
        } catch (wrapped) {
          setDashboardError(extractReadableError(wrapped, 'Unable to load medical records.'));
        }
      }
    );

    const unsubDocs = onSnapshot(
      docQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PatientDocumentItem, 'id'>),
        }));
        setDocuments(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'patientDocuments');
        } catch (wrapped) {
          setDashboardError(extractReadableError(wrapped, 'Unable to load documents.'));
        }
      }
    );

    const unsubAppts = onSnapshot(
      apptQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PatientAppointment, 'id'>),
        }));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setAppointments(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'appointments');
        } catch (wrapped) {
          setDashboardError(extractReadableError(wrapped, 'Unable to load appointments.'));
        }
      }
    );

    return () => {
      unsubRecords();
      unsubDocs();
      unsubAppts();
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewDoc) setPreviewDoc(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, previewDoc, onClose]);

  if (!isOpen || !user) return null;

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setDocError(null);
    try {
      const compressed = await compressImageToDataUrl(file, 1100, 0.76);
      setDocUrlOrData(compressed);
    } catch (error) {
      setDocError(error instanceof Error ? error.message : 'Unable to process image.');
    }
  };

  const handleAddDocument = async (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = docTitle.trim().slice(0, 140);
    const cleanUrlOrData = docUrlOrData.trim();
    if (!cleanTitle) {
      setDocError('Please enter a document title.');
      return;
    }
    if (cleanUrlOrData.length < 4) {
      setDocError(
        docSourceType === 'image'
          ? 'Please select an image file to upload.'
          : 'Please enter a valid report URL.'
      );
      return;
    }

    setSavingDoc(true);
    setDocError(null);
    try {
      await addDoc(collection(db, 'patientDocuments'), {
        patientUid: user.uid,
        title: cleanTitle,
        category: docCategory,
        docSourceType,
        urlOrData: cleanUrlOrData,
        notes: docNotes.trim().slice(0, 500),
        uploadedByUid: user.uid,
        uploadedByRole: 'patient',
        createdAt: serverTimestamp(),
      });
      setDocTitle('');
      setDocUrlOrData('');
      setDocNotes('');
      setShowAddDoc(false);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'patientDocuments');
      } catch (wrapped) {
        setDocError(extractReadableError(wrapped, 'Unable to save document.'));
      }
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setDashboardError(null);
    try {
      await deleteDoc(doc(db, 'patientDocuments', id));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `patientDocuments/${id}`);
      } catch (wrapped) {
        setDashboardError(extractReadableError(wrapped, 'Unable to delete document.'));
      }
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    setDashboardError(null);
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `appointments/${apptId}`);
      } catch (wrapped) {
        setDashboardError(extractReadableError(wrapped, 'Unable to cancel appointment.'));
      }
    }
  };

  return (
    <div
      data-lenis-prevent
      className="no-print fixed inset-0 z-[10018] bg-[#2A3E4B]/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Personal Patient Medical Dashboard"
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        className="w-full max-w-5xl h-[90vh] bg-[#F7FBFD] border border-white/80 rounded-[30px] shadow-[0_28px_70px_-14px_rgba(42,62,75,0.34)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-white border-b border-[#D6E6EF] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Patient'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-[#D6E6EF] object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#D6E6EF] text-[#1A2B36] flex items-center justify-center font-bold text-sm shrink-0">
                {(user.displayName || user.email || 'P')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="serif-font text-lg sm:text-xl font-bold text-[#1A2B36] truncate">
                {user.displayName || ui.dashboard.portalFallback}
              </h2>
              <p className="text-xs font-medium text-[#2E586D] truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E586D]/12 hover:bg-[#2E586D] text-[#1A2B36] hover:text-white text-xs font-semibold transition-colors ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{ui.dashboard.adminStudio}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A2B36] hover:bg-[#2E586D] text-white text-xs font-semibold transition-colors ${
                isBn ? 'bengali-text !leading-none' : ''
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{ui.dashboard.bookVisit}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void signOutUser();
                onClose();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#BBD4E2] bg-white hover:border-[#2E586D] text-xs font-semibold text-[#1A2B36] transition-colors ${
                isBn ? 'bengali-text !leading-none' : ''
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-[#2E586D]" />
              <span className="hidden sm:inline">{ui.dashboard.signOut}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={ui.dashboard.closeAria}
              className="liquid-glass tactile-pill w-9 h-9 rounded-full text-[#1A2B36] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Metrics & Velocity-Squish Tab Switcher */}
        <div className="px-6 py-3.5 bg-[#F7FBFD] border-b border-[#C4DBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <LiquidSegmentedControl
            roleType="tablist"
            ariaLabel="Patient dashboard sections"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              {
                value: 'records',
                label: `${ui.dashboard.tabRecords} (${formatNumberLocale(records.length, lang)})`,
              },
              {
                value: 'documents',
                label: `${ui.dashboard.tabDocuments} (${formatNumberLocale(documents.length, lang)})`,
              },
              {
                value: 'appointments',
                label: `${ui.dashboard.tabAppointments} (${formatNumberLocale(appointments.length, lang)})`,
              },
            ]}
          />

          <p
            className={`text-xs text-[#2E586D] font-semibold ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            {localizedContent.institution} · {ui.dashboard.privateFolder}
          </p>
        </div>

        {/* Main Content Viewport */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5"
        >
          {dashboardError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-900">
              <span>{dashboardError}</span>
              <button
                type="button"
                onClick={() => setDashboardError(null)}
                className="font-semibold underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-white border border-[#C4DBE8] animate-pulse"
                />
              ))}
            </div>
          ) : activeTab === 'records' ? (
            records.length === 0 ? (
              <div className="bg-white border border-[#C4DBE8] rounded-2xl p-10 text-center space-y-3">
                <FileText className="w-8 h-8 text-[#2E586D] mx-auto" />
                <h3
                  className={`serif-font text-xl font-bold text-[#1A2B36] ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {ui.dashboard.noRecordsTitle}
                </h3>
                <p
                  className={`text-sm text-[#1A2B36]/85 max-w-md mx-auto ${
                    isBn ? 'bengali-text' : ''
                  }`}
                >
                  {ui.dashboard.noRecordsBodyPrefix} {localizedContent.doctorShortName}{' '}
                  {ui.dashboard.noRecordsBodySuffix}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBooking();
                  }}
                  className={`px-5 py-2.5 rounded-xl bg-[#1A2B36] hover:bg-[#2E586D] text-white text-xs font-semibold transition-colors ${
                    isBn ? 'bengali-text !leading-none' : ''
                  }`}
                >
                  {ui.dashboard.scheduleFirst}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((rec) => (
                  <article
                    key={rec.id}
                    className="bg-white border border-[#C4DBE8] rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C4DBE8] pb-3.5">
                      <div>
                        <p className="mono-font text-xs font-semibold text-[#2E586D]">
                          {ui.dashboard.visitDatePrefix} {rec.visitDate}
                        </p>
                        <h3 className="serif-font text-xl font-bold text-[#1A2B36] mt-0.5">
                          {rec.diagnosis}
                        </h3>
                      </div>
                      <div className="text-right text-xs text-[#1A2B36]/85">
                        <p className="font-semibold text-[#1A2B36]">{rec.doctorName}</p>
                        {rec.followUpDate && (
                          <p className="mono-font font-semibold text-[#2E586D]">
                            {ui.dashboard.followUpPrefix} {rec.followUpDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-[#F7FBFD] border border-[#C4DBE8] rounded-xl p-4">
                        <p
                          className={`text-xs font-bold text-[#2E586D] mb-1.5 ${
                            isBn ? 'bengali-text !leading-snug' : ''
                          }`}
                        >
                          {ui.dashboard.rxHeading}
                        </p>
                        <p className="text-[#1A2B36] whitespace-pre-line leading-relaxed">
                          {rec.prescription}
                        </p>
                      </div>

                      <div className="bg-[#F7FBFD] border border-[#C4DBE8] rounded-xl p-4">
                        <p
                          className={`text-xs font-bold text-[#2E586D] mb-1.5 ${
                            isBn ? 'bengali-text !leading-snug' : ''
                          }`}
                        >
                          {ui.dashboard.clinicalNotesHeading}
                        </p>
                        <p className="text-[#1A2B36]/90 whitespace-pre-line leading-relaxed">
                          {rec.clinicalNotes || ui.dashboard.standardCareFallback}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : activeTab === 'documents' ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className={`text-sm text-[#1A2B36]/85 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {ui.dashboard.attachPrompt}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddDoc((v) => !v)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A2B36] hover:bg-[#2E586D] text-white text-xs font-semibold transition-colors ${
                    isBn ? 'bengali-text !leading-none' : ''
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddDoc ? ui.dashboard.cancel : ui.dashboard.attachDocBtn}</span>
                </button>
              </div>

              {showAddDoc && (
                <form
                  onSubmit={handleAddDocument}
                  className="bg-white border border-[#2E586D] rounded-2xl p-6 space-y-4"
                >
                  <h3
                    className={`serif-font text-lg font-bold text-[#1A2B36] ${
                      isBn ? 'bengali-text !leading-snug' : ''
                    }`}
                  >
                    {ui.dashboard.addDocTitle}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A2B36] mb-1.5">
                        {ui.dashboard.docTitleLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder={ui.dashboard.docTitlePlaceholder}
                        className="w-full rounded-xl border border-[#BBD4E2] bg-[#F7FBFD] px-3.5 py-2 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A2B36] mb-1.5">
                        {ui.dashboard.categoryLabel}
                      </label>
                      <select
                        value={docCategory}
                        onChange={(e) =>
                          setDocCategory(e.target.value as PatientDocumentItem['category'])
                        }
                        className="w-full rounded-xl border border-[#BBD4E2] bg-[#F7FBFD] px-3.5 py-2 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                      >
                        <option value="Lab Report">{ui.dashboard.categories['Lab Report']}</option>
                        <option value="Prescription">{ui.dashboard.categories.Prescription}</option>
                        <option value="Imaging">{ui.dashboard.categories.Imaging}</option>
                        <option value="Discharge Summary">
                          {ui.dashboard.categories['Discharge Summary']}
                        </option>
                        <option value="Other">{ui.dashboard.categories.Other}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A2B36] mb-2">
                      {ui.dashboard.sourceFormatLabel}
                    </label>
                    <div className="inline-flex gap-2 p-1 rounded-xl bg-[#F7FBFD] border border-[#C4DBE8]">
                      <button
                        type="button"
                        onClick={() => {
                          setDocSourceType('image');
                          setDocUrlOrData('');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          docSourceType === 'image'
                            ? 'bg-[#1A2B36] text-white'
                            : 'text-[#1A2B36]/80'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{ui.dashboard.uploadImgBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDocSourceType('link');
                          setDocUrlOrData('');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          docSourceType === 'link'
                            ? 'bg-[#1A2B36] text-white'
                            : 'text-[#1A2B36]/80'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{ui.dashboard.externalLinkBtn}</span>
                      </button>
                    </div>
                  </div>

                  {docSourceType === 'image' ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#1A2B36] mb-1.5">
                        {ui.dashboard.selectPhotoLabel}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleFileChange(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-[#1A2B36] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#BBD4E2] file:text-xs file:font-semibold file:bg-[#F7FBFD] file:text-[#1A2B36] hover:file:bg-[#D6E6EF]"
                      />
                      {docUrlOrData && (
                        <img
                          src={docUrlOrData}
                          alt="Report preview"
                          className="mt-3 max-h-40 rounded-xl border border-[#C4DBE8] object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-[#1A2B36] mb-1.5">
                        {ui.dashboard.docUrlLabel}
                      </label>
                      <input
                        type="url"
                        value={docUrlOrData}
                        onChange={(e) => setDocUrlOrData(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-[#BBD4E2] bg-[#F7FBFD] px-3.5 py-2 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#1A2B36] mb-1.5">
                      {ui.dashboard.notesOptLabel}
                    </label>
                    <input
                      type="text"
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder={ui.dashboard.notesPlaceholder}
                      className="w-full rounded-xl border border-[#BBD4E2] bg-[#F7FBFD] px-3.5 py-2 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                    />
                  </div>

                  {docError && (
                    <p className="text-xs text-[#1A2B36] bg-[#D6E6EF]/75 px-3 py-2 rounded-lg">
                      {docError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={savingDoc}
                    className="px-5 py-2.5 rounded-xl bg-[#1A2B36] hover:bg-[#2E586D] text-white text-xs font-semibold transition-colors"
                  >
                    {savingDoc ? ui.dashboard.savingDocBtn : ui.dashboard.saveFolderBtn}
                  </button>
                </form>
              )}

              {documents.length === 0 ? (
                <div className="bg-white border border-[#C4DBE8] rounded-2xl p-10 text-center space-y-2">
                  <FileImage className="w-8 h-8 text-[#2E586D] mx-auto" />
                  <h3
                    className={`serif-font text-xl font-bold text-[#1A2B36] ${
                      isBn ? 'bengali-text !leading-snug' : ''
                    }`}
                  >
                    {ui.dashboard.noDocsTitle}
                  </h3>
                  <p
                    className={`text-sm text-[#1A2B36]/85 ${
                      isBn ? 'bengali-text' : ''
                    }`}
                  >
                    {ui.dashboard.noDocsBody}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#C4DBE8] rounded-2xl p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#2E586D]">
                            {ui.dashboard.categories[item.category]} ·{' '}
                            {item.uploadedByRole === 'admin'
                              ? ui.dashboard.issuedByClinic
                              : ui.dashboard.patientUpload}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDocument(item.id)}
                            aria-label={`Delete ${item.title}`}
                            className="text-[#1A2B36]/65 hover:text-[#1A2B36] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h4 className="serif-font text-lg font-bold text-[#1A2B36]">
                          {item.title}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-[#1A2B36]/85">{item.notes}</p>
                        )}
                      </div>

                      {item.docSourceType === 'image' ? (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(item)}
                          className="w-full py-2 px-3 rounded-xl bg-[#F7FBFD] border border-[#BBD4E2] hover:border-[#2E586D] text-xs font-semibold text-[#1A2B36] transition-colors"
                        >
                          {ui.dashboard.previewImgBtn}
                        </button>
                      ) : (
                        <a
                          href={item.urlOrData}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#F7FBFD] border border-[#BBD4E2] hover:border-[#2E586D] text-xs font-semibold text-[#1A2B36] transition-colors"
                        >
                          <span>{ui.dashboard.openLinkBtn}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#2E586D]" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white border border-[#C4DBE8] rounded-2xl p-10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-[#2E586D] mx-auto" />
              <h3
                className={`serif-font text-xl font-bold text-[#1A2B36] ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {ui.dashboard.noApptsTitle}
              </h3>
              <p className={`text-sm text-[#1A2B36]/85 ${isBn ? 'bengali-text' : ''}`}>
                {ui.dashboard.noApptsBody}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className={`px-5 py-2.5 rounded-xl bg-[#1A2B36] hover:bg-[#2E586D] text-white text-xs font-semibold transition-colors ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                {ui.dashboard.requestApptBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white border border-[#C4DBE8] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="mono-font text-xs font-semibold text-[#2E586D]">
                      {appt.date} · {formatSlotLabel(appt.slot, lang)} ·{' '}
                      {appt.mode === 'in-person'
                        ? ui.dashboard.inPersonSmch
                        : ui.dashboard.teleConsult}
                    </p>
                    <h4 className="serif-font text-lg font-bold text-[#1A2B36]">
                      {appt.patientName}
                    </h4>
                    {appt.reason && (
                      <p className="text-xs text-[#1A2B36]/85">{appt.reason}</p>
                    )}
                    {appt.adminNotes && (
                      <p className="text-xs font-semibold text-[#2E586D] pt-1">
                        {ui.dashboard.clinicNotePrefix} {appt.adminNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#F7FBFD] border border-[#BBD4E2] text-[#1A2B36]">
                      {ui.dashboard.statusLabels[appt.status] || appt.status}
                    </span>
                    {appt.status === 'requested' && (
                      <button
                        type="button"
                        onClick={() => void handleCancelAppointment(appt.id)}
                        className="text-xs font-semibold text-[#1A2B36]/80 hover:text-[#1A2B36] underline underline-offset-2"
                      >
                        {ui.dashboard.cancelAppt}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline Document Image Lightbox */}
      {previewDoc && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[10040] bg-[#2A3E4B]/85 backdrop-blur-md flex flex-col items-center justify-center p-6"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded-3xl overflow-hidden border border-[#D6E6EF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D6E6EF]">
              <h4 className="serif-font text-base font-bold text-[#2A3E4B]">
                {previewDoc.title}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-lg border border-[#D6E6EF] flex items-center justify-center text-[#2A3E4B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-[#F7FBFD] flex justify-center">
              <img
                src={previewDoc.urlOrData}
                alt={previewDoc.title}
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
