import { useMemo, useState } from 'react';
import {
  Calendar,
  FileText,
  FolderHeart,
  Phone,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { APPOINTMENT_SLOTS } from '../data/portfolioData';
import { formatSlotLabel, SiteLanguage } from '../data/translations';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
import { OccasionImage } from './OccasionImage';

export interface BookingPreset {
  mode?: 'in-person' | 'tele';
  date?: string;
  slot?: string;
}

interface ContactFooterCardProps {
  onOpenBooking: (preset?: BookingPreset) => void;
  onOpenCv: () => void;
  onOpenPortal: () => void;
  onOpenAdmin: () => void;
  onNavigateSection: (index: number) => void;
}

function getUpcomingDays(lang: SiteLanguage): { iso: string; dayLabel: string; numLabel: string }[] {
  const days: { iso: string; dayLabel: string; numLabel: string }[] = [];
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  for (let i = 1; i <= 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      iso: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString(locale, { weekday: 'short' }),
      numLabel: d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    });
  }
  return days;
}

export function ContactFooterCard({
  onOpenBooking,
  onOpenCv,
  onOpenPortal,
  onOpenAdmin,
  onNavigateSection,
}: ContactFooterCardProps) {
  const { localizedContent } = useCms();
  const { user, isAdmin, openLoginModal } = useAuth();
  const { lang, isBn, ui } = useLanguage();

  const upcomingDays = useMemo(() => getUpcomingDays(lang), [lang]);
  const [quickDate, setQuickDate] = useState(upcomingDays[0]?.iso || '');
  const [quickSlot, setQuickSlot] = useState(APPOINTMENT_SLOTS[0]);
  const [quickMode, setQuickMode] = useState<'in-person' | 'tele'>('in-person');

  const doctorAvatar =
    localizedContent.occasions.find((p) => p.id === 'hero-portrait') ||
    localizedContent.occasions[0];

  const phoneHref = `tel:${localizedContent.phoneDisplay.replace(/[^0-9+]/g, '')}`;

  return (
    <section
      className="zcard flex flex-col justify-between bg-[#F7FBFD]"
      data-card="6"
      id="connect"
      aria-label="Consultation Scheduling and Footer"
    >
      <div
        className="absolute inset-0 pearl-grid opacity-25 pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 flex-1 md:min-h-0 md:overflow-y-auto no-scrollbar pt-12 md:pt-24 flex flex-col justify-between float-stage">
        {/* Upper Light Consultation Journey & Liquid Glass Quick-Picker */}
        <div className="w-full max-w-[1160px] mx-auto px-5 sm:px-8 lg:px-12 pb-8">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <p
              className={`text-xs font-semibold text-[#21475B] mb-1 ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              {localizedContent.connectSectionKicker}
            </p>
            <h2
              className={`mograph-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#13232D] mb-2 ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
              style={{ textWrap: 'balance' }}
            >
              {localizedContent.connectHeading}
            </h2>
            <p
              className={`text-sm sm:text-[15px] text-[#13232D] ${
                isBn ? 'bengali-text !leading-relaxed' : ''
              }`}
            >
              {localizedContent.connectSubheading}
            </p>
          </div>

          {/* 4-Step Floating Care Journey Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 float-stage">
            {localizedContent.bookingSteps.map((step) => (
              <div
                key={step.index}
                className="float-card step-float-card liquid-glass liquid-glass-interactive rounded-[22px] p-4 sm:p-5 text-left"
              >
                <span className="num-display text-xl sm:text-2xl font-bold text-[#21475B] block mb-1.5">
                  {step.index}
                </span>
                <p
                  className={`mograph-display text-sm sm:text-[15px] font-bold text-[#13232D] mb-1 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-xs sm:text-[13px] text-[#13232D]/95 leading-snug ${
                    isBn ? 'bengali-text' : ''
                  }`}
                >
                  {step.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Compact Inline Scheduling Liquid Glass Card */}
          <div className="float-card scheduler-float-card liquid-glass nav-pill-scrolled rounded-[28px] p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center mb-4">
            <div className="lg:col-span-4 flex items-center gap-3.5">
              {doctorAvatar && (
                <div className="relative z-10 w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-[#F7FBFD]">
                  <OccasionImage
                    primarySrc={doctorAvatar.primarySrc}
                    fallbackSrc={doctorAvatar.fallbackSrc}
                    alt={localizedContent.doctorName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p
                  className={`mograph-display text-base font-bold text-[#1A2B36] truncate ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {localizedContent.doctorName}
                </p>
                <p
                  className={`text-xs sm:text-[13px] text-[#21475B] font-semibold truncate mb-2 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {localizedContent.doctorTitle} · {ui.footer.durationTag}
                </p>
                <LiquidSegmentedControl
                  size="sm"
                  ariaLabel="Quick booking visit mode"
                  value={quickMode}
                  onChange={setQuickMode}
                  options={[
                    { value: 'in-person', label: ui.footer.inPersonShort },
                    { value: 'tele', label: ui.footer.teleCareShort },
                  ]}
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {upcomingDays.map((d) => {
                  const active = quickDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setQuickDate(d.iso)}
                      className={`tactile-pill py-2.5 px-1.5 rounded-xl border text-center ${
                        active
                          ? 'bg-[#1A2B36] border-[#1A2B36] text-white shadow-sm'
                          : 'bg-white/95 border-[#BBD4E2] text-[#13232D] hover:border-[#21475B]'
                      }`}
                    >
                      <span
                        className={`block text-[11px] font-semibold ${
                          active ? 'text-[#E4EFF5]' : 'text-[#21475B]'
                        } ${isBn ? 'bengali-text !leading-none' : ''}`}
                      >
                        {d.dayLabel}
                      </span>
                      <span
                        className={`mono-font block text-xs sm:text-sm font-bold mt-0.5 ${
                          isBn ? 'bengali-text !leading-snug' : ''
                        }`}
                      >
                        {d.numLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {APPOINTMENT_SLOTS.map((slot) => {
                  const active = quickSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setQuickSlot(slot)}
                      className={`tactile-pill mono-font px-3 py-1.5 rounded-full border text-xs sm:text-[13px] font-semibold ${
                        active
                          ? 'bg-[#21475B] border-[#21475B] text-white shadow-xs'
                          : 'bg-white/95 border-[#BBD4E2] text-[#13232D] hover:border-[#21475B]'
                      } ${isBn ? 'bengali-text !leading-none' : ''}`}
                    >
                      {formatSlotLabel(slot, lang)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenBooking({
                    mode: quickMode,
                    date: quickDate,
                    slot: quickSlot,
                  })
                }
                className={`liquid-glass-dark tactile-pill w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-white hover:bg-[#2E586D] text-xs sm:text-sm font-semibold ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                <Calendar className="w-4 h-4 text-[#D6E6EF]" />
                <span>{ui.footer.confirmSelectedSlot}</span>
              </button>
              <button
                type="button"
                onClick={user ? onOpenPortal : openLoginModal}
                className={`liquid-glass liquid-glass-interactive w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-semibold text-[#1A2B36] ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5 text-[#2E586D]" />
                <span>
                  {user ? ui.footer.openMedicalRecords : ui.footer.signInForRecords}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Grounded Arctic Slate Liquid Glass Footer Band */}
        <div className="w-full liquid-glass-dark text-[#F7FBFD] px-5 sm:px-8 lg:px-12 py-6">
          <div className="max-w-[1160px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1.5">
              <p
                className={`mograph-display text-base sm:text-lg font-bold text-white ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {localizedContent.doctorName}
              </p>
              <p
                className={`text-xs sm:text-sm text-[#E4EFF5] font-medium ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {localizedContent.doctorTitle} ·{' '}
                <span className="mono-font font-bold text-white">
                  {ui.hero.bmdcPrefix} {localizedContent.bmdcNumber}
                </span>
              </p>
              <p
                className={`text-xs sm:text-[13px] text-[#D6E6EF] ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {localizedContent.institution}
              </p>
            </div>

            <div
              className={`md:col-span-4 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-[13px] text-[#E4EFF5] ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onNavigateSection(1)}
                className="hover:text-white transition-colors"
              >
                {ui.footer.navMission}
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection(2)}
                className="hover:text-white transition-colors"
              >
                {ui.footer.navClinicalCare}
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection(3)}
                className="hover:text-white transition-colors"
              >
                {ui.footer.navTenOccasions}
              </button>
              <button
                type="button"
                onClick={onOpenCv}
                className="inline-flex items-center gap-1 hover:text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#D6E6EF]" />
                <span>{ui.footer.navPrintableCv}</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1 text-[#F7FBFD] hover:text-[#D6E6EF] font-semibold"
                >
                  <Shield className="w-3.5 h-3.5 text-[#D6E6EF]" />
                  <span>{ui.footer.navAdminStudio}</span>
                </button>
              )}
            </div>

            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col lg:flex-row md:items-end justify-end gap-2">
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 text-white hover:text-[#D6E6EF] font-semibold"
              >
                <Phone className="w-4 h-4 text-[#D6E6EF]" />
                <span className="mono-font text-sm sm:text-base font-bold tracking-wide">
                  {localizedContent.phoneDisplay}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
