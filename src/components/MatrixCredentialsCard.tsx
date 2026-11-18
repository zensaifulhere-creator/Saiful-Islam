import { useEffect, useState } from 'react';
import { Building2, Calendar, ChevronDown, Expand, Video } from 'lucide-react';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
import { OccasionImage } from './OccasionImage';

interface MatrixCredentialsCardProps {
  onOpenPhoto: (photoId: string) => void;
  onOpenBookingWithMode: (mode: 'in-person' | 'tele') => void;
}

type PanelMode = 'credentials' | 'faqs' | 'visits';

export function MatrixCredentialsCard({
  onOpenPhoto,
  onOpenBookingWithMode,
}: MatrixCredentialsCardProps) {
  const { localizedContent } = useCms();
  const { isBn, ui } = useLanguage();
  const [panelMode, setPanelMode] = useState<PanelMode>('credentials');
  const [activeTabId, setActiveTabId] = useState<string>(
    localizedContent.credentials[0]?.id || 'education'
  );
  const [openFaqId, setOpenFaqId] = useState<string>(
    localizedContent.faqs[0]?.id || 'faq-1'
  );

  useEffect(() => {
    if (
      !localizedContent.credentials.some((t) => t.id === activeTabId) &&
      localizedContent.credentials[0]
    ) {
      setActiveTabId(localizedContent.credentials[0].id);
    }
  }, [localizedContent.credentials, activeTabId]);

  const activeTab =
    localizedContent.credentials.find((t) => t.id === activeTabId) ||
    localizedContent.credentials[0];

  const highlightPhoto =
    localizedContent.occasions.find((p) => p.id === localizedContent.highlightPhotoId) ||
    localizedContent.occasions.find((p) => p.id === 'surgery-action') ||
    localizedContent.occasions[0];

  return (
    <section
      className="zcard flex items-center bg-[#F7FBFD]"
      data-card="5"
      id="credentials"
      aria-label="Clinical Highlight, Credentials, and Frequently Asked Questions"
    >
      <div
        className="absolute inset-0 pearl-grid opacity-25 pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-12 py-12 md:pt-24 md:pb-8 lg:py-0 md:max-h-full md:overflow-y-auto no-scrollbar float-stage">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-9 items-stretch">
          {/* Left Column: Dark Arctic Slate Liquid Glass Clinical Spotlight */}
          <div className="lg:col-span-5 flex flex-col float-card cred-float-card">
            <div className="flex-1 rounded-[28px] liquid-glass-dark nav-capsule-scrolled text-[#F7FBFD] p-5 sm:p-7 flex flex-col justify-between">
              <div>
                {highlightPhoto && (
                  <div className="group relative z-10 h-44 sm:h-52 rounded-[18px] overflow-hidden mb-5 border border-[#7FA6B8]/35 bg-[#1A2B36]">
                    <OccasionImage
                      primarySrc={highlightPhoto.primarySrc}
                      fallbackSrc={highlightPhoto.fallbackSrc}
                      alt={highlightPhoto.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#1A2B36]/76 via-transparent to-transparent pointer-events-none"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenPhoto(highlightPhoto.id)}
                      aria-label={ui.credentials.inspectSpotlightAria}
                      className="liquid-glass tactile-pill z-20 absolute bottom-3 right-3 w-8 h-8 rounded-full text-[#1A2B36] flex items-center justify-center"
                    >
                      <Expand className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p
                  className={`text-xs font-semibold text-[#E4EFF5] mb-1.5 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {localizedContent.highlightKicker}
                </p>
                <h2
                  className={`mograph-display text-2xl sm:text-3xl font-bold text-white leading-snug mb-3 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                  style={{ textWrap: 'balance' }}
                >
                  {localizedContent.highlightTitle}
                </h2>
                <p
                  className={`text-sm sm:text-[15px] text-[#E4EFF5] leading-relaxed mb-6 ${
                    isBn ? 'bengali-text' : ''
                  }`}
                >
                  {localizedContent.highlightSummary}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => onOpenBookingWithMode('in-person')}
                  className={`liquid-glass liquid-glass-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[#1A2B36] text-xs sm:text-sm font-semibold ${
                    isBn ? 'bengali-text !leading-none' : ''
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[#2E586D]" />
                  <span>{localizedContent.highlightCtaLabel}</span>
                </button>

                <div className="pt-4 border-t border-[#7FA6B8]/35 text-xs sm:text-[13px] font-semibold text-white flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span>SMCH</span>
                  <span aria-hidden="true">·</span>
                  <span className="mono-font font-bold">
                    {ui.hero.bmdcPrefix} {localizedContent.bmdcNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>BMA</span>
                  <span aria-hidden="true">·</span>
                  <span>SSB</span>
                  <span aria-hidden="true">·</span>
                  <span>AHA BLS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Liquid Glass Credentials / FAQs / Visit Modes */}
          <div className="lg:col-span-7 flex flex-col justify-center float-card cred-float-card">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
              <div>
                <p
                  className={`text-xs font-semibold text-[#21475B] mb-1 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {localizedContent.credentialsSectionKicker}
                </p>
                <h2
                  className={`mograph-display text-2xl sm:text-3xl font-bold text-[#13232D] ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                  style={{ textWrap: 'balance' }}
                >
                  {localizedContent.credentialsHeading}
                </h2>
              </div>

              <LiquidSegmentedControl
                roleType="tablist"
                ariaLabel="Credentials and patient information switcher"
                value={panelMode}
                onChange={setPanelMode}
                options={[
                  { value: 'credentials', label: ui.credentials.tabCredentials },
                  { value: 'faqs', label: ui.credentials.tabFaqs },
                  { value: 'visits', label: ui.credentials.tabVisits },
                ]}
              />
            </div>

            {panelMode === 'credentials' && (
              <div className="space-y-2.5">
                {localizedContent.credentials.map((tab) => {
                  const isSelected = tab.id === activeTab?.id;
                  return (
                    <div
                      key={tab.id}
                      className={`rounded-[22px] overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? 'liquid-glass nav-pill-scrolled border-[#2E586D]/45'
                          : 'liquid-glass liquid-glass-interactive opacity-95'
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isSelected}
                        onClick={() => setActiveTabId(tab.id)}
                        className="w-full px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-baseline gap-3.5 min-w-0">
                          <span
                            className={`num-display text-lg sm:text-xl font-bold min-w-[1.9rem] shrink-0 ${
                              isSelected ? 'text-[#21475B]' : 'text-[#13232D]/85'
                            }`}
                          >
                            {tab.index}
                          </span>
                          <span
                            className={`mograph-display text-sm sm:text-base font-bold text-[#13232D] truncate ${
                              isBn ? 'bengali-text !leading-snug' : ''
                            }`}
                          >
                            {tab.label}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#21475B] shrink-0 transition-transform duration-200 ${
                            isSelected ? 'rotate-180 text-[#13232D]' : ''
                          }`}
                        />
                      </button>

                      {isSelected && (
                        <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-[#BBD4E2] space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p
                              className={`text-xs sm:text-[13px] text-[#13232D] font-medium ${
                                isBn ? 'bengali-text !leading-snug' : ''
                              }`}
                            >
                              {tab.summary}
                            </p>
                            <button
                              type="button"
                              onClick={() => onOpenPhoto(tab.photoId)}
                              className={`inline-flex items-center gap-1 text-xs font-semibold text-[#21475B] hover:text-[#13232D] shrink-0 ${
                                isBn ? 'bengali-text !leading-none' : ''
                              }`}
                            >
                              <Expand className="w-3.5 h-3.5" />
                              <span>{ui.credentials.photoEvidence}</span>
                            </button>
                          </div>
                          <ul className="space-y-1.5 pt-1">
                            {tab.items.map((item, itemIdx) => (
                              <li
                                key={`${item.title}-${itemIdx}`}
                                className={`text-[13px] sm:text-sm leading-relaxed ${
                                  isBn ? 'bengali-text' : ''
                                }`}
                              >
                                <span className="font-semibold text-[#13232D]">
                                  {item.title}
                                </span>
                                <span className="text-[#13232D]/90">
                                  {' '}
                                  — {item.detail}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {panelMode === 'faqs' && (
              <div className="space-y-2.5">
                {localizedContent.faqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`rounded-[22px] overflow-hidden transition-all duration-200 ${
                        isOpen
                          ? 'liquid-glass nav-pill-scrolled border-[#2E586D]/45'
                          : 'liquid-glass liquid-glass-interactive opacity-95'
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                        className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left"
                      >
                        <span
                          className={`text-sm font-semibold text-[#13232D] ${
                            isBn ? 'bengali-text !leading-snug' : ''
                          }`}
                        >
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#21475B] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#13232D]' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div
                          className={`px-5 pb-4 pt-2 border-t border-[#BBD4E2] text-sm sm:text-[15px] text-[#13232D] leading-relaxed ${
                            isBn ? 'bengali-text' : ''
                          }`}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {panelMode === 'visits' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localizedContent.consultationModes.map((option) => {
                  const photo =
                    localizedContent.occasions.find((p) => p.id === option.photoId) ||
                    localizedContent.occasions[0];
                  const Icon = option.mode === 'in-person' ? Building2 : Video;
                  return (
                    <div
                      key={option.id}
                      className="liquid-glass liquid-glass-no-glare liquid-glass-interactive group rounded-[26px] overflow-hidden flex flex-col justify-between"
                    >
                      {photo && (
                        <div className="relative z-10 h-36 overflow-hidden border-b border-[#D6E6EF]/60 bg-[#F7FBFD]">
                          <OccasionImage
                            primarySrc={photo.primarySrc}
                            fallbackSrc={photo.fallbackSrc}
                            alt={option.title}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-[#2E586D] mb-1.5">
                            <Icon className="w-4 h-4" />
                            <span
                              className={`text-[11px] font-semibold ${
                                isBn ? 'bengali-text !leading-none' : ''
                              }`}
                            >
                              {option.mode === 'in-person'
                                ? ui.credentials.hospitalOpd
                                : ui.credentials.remoteReview}
                            </span>
                          </div>
                          <h3
                            className={`mograph-display text-lg font-bold text-[#1A2B36] mb-1.5 ${
                              isBn ? 'bengali-text !leading-snug' : ''
                            }`}
                          >
                            {option.title}
                          </h3>
                          <p
                            className={`text-xs text-[#1A2B36]/85 leading-relaxed ${
                              isBn ? 'bengali-text' : ''
                            }`}
                          >
                            {option.summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenBookingWithMode(option.mode)}
                          className={`liquid-glass-dark tactile-pill w-full py-2.5 px-4 rounded-full text-white hover:bg-[#2E586D] text-xs font-semibold ${
                            isBn ? 'bengali-text !leading-none' : ''
                          }`}
                        >
                          {option.ctaLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
