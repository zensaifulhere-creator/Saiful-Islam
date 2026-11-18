import { FormEvent, useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Calendar, CheckCircle2, Clock, LogIn, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { APPOINTMENT_SLOTS } from '../data/portfolioData';
import { formatSlotLabel } from '../data/translations';
import { db, extractReadableError, handleFirestoreError, OperationType } from '../lib/firebase';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

interface AppointmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPortal: () => void;
  initialPreset?: {
    mode?: 'in-person' | 'tele';
    date?: string;
    slot?: string;
  };
}

interface BookingReceipt {
  referenceId: string;
  patientName: string;
  mode: string;
  date: string;
  slot: string;
  phone: string;
}

function getDefaultDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function AppointmentDrawer({
  isOpen,
  onClose,
  onOpenPortal,
  initialPreset,
}: AppointmentDrawerProps) {
  const { user, signInWithGoogle, signingIn } = useAuth();
  const { localizedContent } = useCms();
  const { lang, isBn, ui } = useLanguage();

  const [mode, setMode] = useState<'in-person' | 'tele'>('in-person');
  const [selectedSlot, setSelectedSlot] = useState<string>(APPOINTMENT_SLOTS[0]);
  const [patientName, setPatientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(getDefaultDateString);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  useEffect(() => {
    if (isOpen && initialPreset) {
      if (initialPreset.mode) setMode(initialPreset.mode);
      if (initialPreset.date) setDate(initialPreset.date);
      if (initialPreset.slot) setSelectedSlot(initialPreset.slot);
    }
  }, [isOpen, initialPreset]);

  useEffect(() => {
    if (user) {
      setPatientName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanName = patientName.trim().slice(0, 120);
    const cleanEmail = email.trim().slice(0, 160);
    const cleanPhone = phone.trim().slice(0, 40);

    if (!cleanName) {
      setSubmitError('Please enter the patient full name.');
      return;
    }
    if (cleanPhone.length < 4) {
      setSubmitError('Please enter a valid contact phone number (at least 4 digits).');
      return;
    }
    if (cleanEmail.length < 3) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        patientUid: user.uid,
        patientName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        mode,
        date,
        slot: selectedSlot,
        reason: reason.trim().slice(0, 600),
        status: 'requested',
        adminNotes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setReceipt({
        referenceId: docRef.id.slice(0, 8).toUpperCase(),
        patientName: cleanName,
        mode:
          mode === 'in-person'
            ? ui.drawer.modeDisplayInPerson
            : ui.drawer.modeDisplayTele,
        date,
        slot: formatSlotLabel(selectedSlot, lang),
        phone: cleanPhone,
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'appointments');
      } catch (wrapped) {
        setSubmitError(extractReadableError(wrapped, ui.drawer.submitError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setReceipt(null);
    setReason('');
    onClose();
  };

  return (
    <div
      data-lenis-prevent
      className="no-print fixed inset-0 z-[10010] bg-[#2A3E4B]/45 backdrop-blur-sm flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={ui.drawer.title}
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        className="w-full max-w-lg h-full min-h-0 bg-[#F7FBFD] border-l border-[#D6E6EF] shadow-[-18px_0_48px_-14px_rgba(42,62,75,0.28)] flex flex-col justify-between overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#C4DBE8]">
            <div>
              <p
                className={`text-xs font-semibold text-[#2E586D] mb-1 ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {ui.drawer.kickerPrefix} · {localizedContent.doctorShortName}
              </p>
              <h2
                className={`mograph-display text-2xl sm:text-3xl font-bold text-[#1A2B36] ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {ui.drawer.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={ui.drawer.closeAria}
              className="liquid-glass tactile-pill w-10 h-10 rounded-full text-[#1A2B36] flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!user ? (
            <div className="py-10 space-y-5">
              <div className="bg-white border border-[#C4DBE8] rounded-2xl p-6 space-y-3 shadow-xs">
                <h3
                  className={`mograph-display text-xl font-bold text-[#1A2B36] ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {ui.drawer.signInTitle}
                </h3>
                <p
                  className={`text-sm text-[#1A2B36]/90 leading-relaxed ${
                    isBn ? 'bengali-text' : ''
                  }`}
                >
                  {ui.drawer.signInBody}
                </p>
                <button
                  type="button"
                  disabled={signingIn}
                  onClick={() => void signInWithGoogle()}
                  className={`liquid-glass-dark tactile-pill inline-flex items-center gap-2.5 px-5 py-3 rounded-full hover:bg-[#2E586D] text-white text-sm font-semibold ${
                    isBn ? 'bengali-text !leading-none' : ''
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{signingIn ? ui.drawer.connectingBtn : ui.drawer.signInBtn}</span>
                </button>
              </div>
            </div>
          ) : receipt ? (
            <div className="py-8 space-y-6">
              <div className="bg-white border border-[#C4DBE8] rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-3 text-[#1A2B36]">
                  <CheckCircle2 className="w-6 h-6 text-[#2E586D] shrink-0" />
                  <div>
                    <p
                      className={`text-xs font-semibold text-[#2E586D] ${
                        isBn ? 'bengali-text !leading-snug' : ''
                      }`}
                    >
                      {ui.drawer.savedLabel}
                    </p>
                    <h3
                      className={`mograph-display text-xl font-bold ${
                        isBn ? 'bengali-text !leading-snug' : ''
                      }`}
                    >
                      {ui.drawer.requestedTitle}
                    </h3>
                  </div>
                </div>

                <div className="border-t border-[#C4DBE8] pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#1A2B36]/80 font-medium">{ui.drawer.referenceLabel}</span>
                    <span className="mono-font font-semibold text-[#1A2B36]">
                      {receipt.referenceId}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#1A2B36]/80 font-medium">{ui.drawer.patientLabel}</span>
                    <span className="font-semibold text-[#1A2B36]">{receipt.patientName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#1A2B36]/80 font-medium">{ui.drawer.modeLabel}</span>
                    <span className="font-medium text-[#1A2B36]">{receipt.mode}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#1A2B36]/80 font-medium">{ui.drawer.dateSlotLabel}</span>
                    <span className="mono-font font-semibold text-[#1A2B36]">
                      {receipt.date} · {receipt.slot}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#1A2B36]/80 font-medium">{ui.drawer.phoneLabel}</span>
                    <span className="mono-font text-[#1A2B36]">{receipt.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetAndClose();
                    onOpenPortal();
                  }}
                  className={`liquid-glass-dark tactile-pill px-5 py-2.5 rounded-full hover:bg-[#2E586D] text-white text-xs font-semibold ${
                    isBn ? 'bengali-text !leading-none' : ''
                  }`}
                >
                  {ui.drawer.viewDashboardBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className={`liquid-glass tactile-pill px-4 py-2.5 rounded-full text-xs font-semibold text-[#1A2B36] ${
                    isBn ? 'bengali-text !leading-none' : ''
                  }`}
                >
                  {ui.drawer.bookAnotherBtn}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  className={`block text-xs font-semibold text-[#1A2B36] mb-2 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {ui.drawer.consultTypeLabel}
                </label>
                <LiquidSegmentedControl
                  ariaLabel="Appointment consultation type"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'in-person', label: ui.drawer.inPersonOption },
                    { value: 'tele', label: ui.drawer.teleOption },
                  ]}
                />
              </div>

              <div>
                <label
                  htmlFor="appt-date"
                  className={`flex items-center gap-1.5 text-xs font-semibold text-[#1A2B36] mb-2 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#2E586D]" />
                  <span>{ui.drawer.preferredDateLabel}</span>
                </label>
                <input
                  id="appt-date"
                  type="date"
                  value={date}
                  min={getDefaultDateString()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="mono-font w-full rounded-xl border border-[#BBD4E2] bg-white px-3.5 py-2.5 text-[15px] font-semibold text-[#13232D] focus:outline-none focus:border-[#21475B]"
                />
              </div>

              <div>
                <label
                  className={`flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#13232D] mb-2 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#21475B]" />
                  <span>{ui.drawer.selectSlotLabel}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {APPOINTMENT_SLOTS.map((slot) => {
                    const active = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`tactile-pill mono-font py-2.5 px-2.5 rounded-full border text-xs sm:text-[13px] font-semibold whitespace-nowrap ${
                          active
                            ? 'bg-[#21475B] border-[#21475B] text-white shadow-xs'
                            : 'bg-white border-[#BBD4E2] text-[#13232D] hover:border-[#21475B]'
                        } ${isBn ? 'bengali-text !leading-none' : ''}`}
                      >
                        {formatSlotLabel(slot, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="appt-name"
                  className={`block text-xs font-semibold text-[#1A2B36] mb-1.5 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {ui.drawer.fullNameLabel}
                </label>
                <input
                  id="appt-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={ui.drawer.fullNamePlaceholder}
                  required
                  className="w-full rounded-xl border border-[#BBD4E2] bg-white px-3.5 py-2.5 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="appt-phone"
                    className={`block text-xs font-semibold text-[#1A2B36] mb-1.5 ${
                      isBn ? 'bengali-text !leading-snug' : ''
                    }`}
                  >
                    {ui.drawer.phoneInputLabel}
                  </label>
                  <input
                    id="appt-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    required
                    className="mono-font w-full rounded-xl border border-[#BBD4E2] bg-white px-3.5 py-2.5 text-[15px] font-semibold text-[#13232D] focus:outline-none focus:border-[#21475B]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="appt-email"
                    className={`block text-xs font-semibold text-[#1A2B36] mb-1.5 ${
                      isBn ? 'bengali-text !leading-snug' : ''
                    }`}
                  >
                    {ui.drawer.emailInputLabel}
                  </label>
                  <input
                    id="appt-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full rounded-xl border border-[#BBD4E2] bg-white px-3.5 py-2.5 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="appt-reason"
                  className={`block text-xs font-semibold text-[#1A2B36] mb-1.5 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {ui.drawer.reasonLabel}
                </label>
                <textarea
                  id="appt-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={ui.drawer.reasonPlaceholder}
                  className="w-full rounded-xl border border-[#BBD4E2] bg-white px-3.5 py-2.5 text-sm text-[#1A2B36] focus:outline-none focus:border-[#2E586D]"
                />
              </div>

              {submitError && (
                <p className="text-xs font-medium text-[#1A2B36] bg-[#D6E6EF]/75 px-3 py-2 rounded-lg">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl bg-[#1A2B36] hover:bg-[#2E586D] disabled:opacity-60 text-white text-sm font-semibold transition-colors duration-200 ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                {submitting ? ui.drawer.submittingBtn : ui.drawer.confirmRequestBtn}
              </button>
            </form>
          )}
        </div>

        <div
          className={`px-6 sm:px-8 py-4 border-t border-[#C4DBE8] bg-white text-xs sm:text-[13px] font-semibold text-[#13232D] shrink-0 ${
            isBn ? 'bengali-text !leading-snug' : ''
          }`}
        >
          {localizedContent.institution} ·{' '}
          <span className="mono-font font-bold">
            {ui.drawer.bmdcShort} {localizedContent.bmdcNumber}
          </span>
        </div>
      </div>
    </div>
  );
}
