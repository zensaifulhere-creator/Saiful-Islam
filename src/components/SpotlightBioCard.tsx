import { Check, Expand } from 'lucide-react';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { OccasionImage } from './OccasionImage';

interface SpotlightBioCardProps {
  onOpenPhoto: (photoId: string) => void;
}

export function SpotlightBioCard({ onOpenPhoto }: SpotlightBioCardProps) {
  const { localizedContent } = useCms();
  const { isBn, ui } = useLanguage();

  const portrait =
    localizedContent.occasions.find((p) => p.id === 'white-coat') ||
    localizedContent.occasions.find((p) => p.id === 'clinic-desk') ||
    localizedContent.occasions[0];

  const activeMissionQuote = isBn
    ? localizedContent.bioMissionBn
    : localizedContent.bioMissionEn;

  return (
    <section
      className="zcard flex items-center bg-[#F7FBFD]"
      data-card="2"
      id="mission"
      aria-label="Biography and Clinical Mission"
    >
      <div
        className="absolute inset-0 pearl-grid opacity-25 pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1180px] mx-auto px-5 sm:px-8 lg:px-12 py-12 md:pt-24 md:pb-8 lg:py-0 md:max-h-full md:overflow-y-auto no-scrollbar float-stage">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Floating Liquid Glass Circular Portrait */}
          {portrait && (
            <div className="lg:col-span-5 flex flex-col items-center text-center float-card bio-float-card">
              <div className="relative p-2.5 rounded-full liquid-glass liquid-glass-no-glare liquid-glass-interactive">
                <div className="relative z-10 w-52 h-52 sm:w-72 sm:h-72 lg:w-[340px] lg:h-[340px] rounded-full overflow-hidden group bg-[#D6E6EF]/30">
                  <OccasionImage
                    primarySrc={portrait.primarySrc}
                    fallbackSrc={portrait.fallbackSrc}
                    alt={portrait.title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPhoto(portrait.id)}
                  aria-label={ui.bio.inspectPortraitAria}
                  className="liquid-glass liquid-glass-interactive tactile-pill z-20 absolute bottom-4 right-4 w-10 h-10 rounded-full text-[#1A2B36] hover:text-[#2E586D] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#2E586D]"
                >
                  <Expand className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <p
                  className={`mograph-display text-base font-bold text-[#1A2B36] ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {localizedContent.portraitCaptionTitle}
                </p>
                <p
                  className={`text-xs text-[#2E586D] font-semibold mt-0.5 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {localizedContent.portraitCaptionSub}
                </p>
              </div>
            </div>
          )}

          {/* Right Column: Floating Liquid Glass Mission Card & Checklist (synced to global language switcher) */}
          <div className="lg:col-span-7 flex flex-col justify-center float-card bio-float-card">
            <div className="mb-4">
              <p
                className={`text-xs font-semibold text-[#21475B] mb-1 ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {localizedContent.bioSectionKicker}
              </p>
              <h2
                className={`mograph-display text-2xl sm:text-3xl font-bold text-[#13232D] ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
                style={{ textWrap: 'balance' }}
              >
                {localizedContent.bioHeading}
              </h2>
            </div>

            <div className="liquid-glass liquid-glass-interactive rounded-[26px] p-5 sm:p-6 mb-5">
              <p
                className={`text-[11px] font-semibold text-[#21475B] mb-1.5 ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {ui.bio.missionLabel}
              </p>
              <blockquote
                className={`text-lg sm:text-xl md:text-2xl font-semibold text-[#13232D] leading-snug ${
                  isBn ? 'bengali-text' : 'mograph-display'
                }`}
                style={{ textWrap: 'balance' }}
              >
                {activeMissionQuote}
              </blockquote>
            </div>

            <div
              className={`space-y-3.5 text-[15px] sm:text-[16.5px] text-[#13232D] leading-[1.7] mb-5 ${
                isBn ? 'bengali-text' : ''
              }`}
            >
              <p>{localizedContent.bioParagraph1}</p>
              <p>{localizedContent.bioParagraph2}</p>
            </div>

            <div className="pt-4 border-t border-[#BBD4E2]">
              <p
                className={`text-xs sm:text-[13px] font-bold text-[#13232D] mb-2.5 ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {ui.bio.coreFocusHeading}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {localizedContent.competencies.map((item, idx) => (
                  <li
                    key={`${item}-${idx}`}
                    className={`flex items-center gap-2.5 text-sm sm:text-[15px] text-[#13232D] font-medium transition-transform duration-200 hover:translate-x-0.5 ${
                      isBn ? 'bengali-text !leading-snug' : ''
                    }`}
                  >
                    <Check className="w-4 h-4 text-[#21475B] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
