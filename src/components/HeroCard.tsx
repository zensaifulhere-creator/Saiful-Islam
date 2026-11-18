import { ArrowDownRight, Calendar, FileText, ShieldCheck } from 'lucide-react';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HeroMotionMedia } from './HeroMotionMedia';
import { OccasionImage } from './OccasionImage';

interface HeroCardProps {
  onExplore: () => void;
  onOpenBooking: () => void;
  onOpenCv: () => void;
  isHeroActive?: boolean;
}

export function HeroCard({
  onExplore,
  onOpenBooking,
  onOpenCv,
  isHeroActive = true,
}: HeroCardProps) {
  const { localizedContent } = useCms();
  const { isBn, ui } = useLanguage();

  const portraitPhoto =
    localizedContent.occasions.find((p) => p.id === 'hero-portrait') ||
    localizedContent.occasions[1] ||
    localizedContent.occasions[0];

  return (
    <section
      className="zcard flex flex-col justify-center bg-[#F7FBFD]"
      data-card="1"
      id="hero"
      aria-label="Introduction"
    >
      {/* Subtle Architectural Backdrop */}
      <div
        className="absolute inset-0 pearl-grid opacity-35 pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1220px] mx-auto px-5 sm:px-8 lg:px-12 pt-24 pb-12 md:pt-24 md:pb-8 lg:py-0 md:max-h-full md:overflow-y-auto no-scrollbar float-stage">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-12 items-stretch">
          {/* Left Column: Mograph Hierarchy & Liquid Glass Actions */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            <p
              className={`text-xs sm:text-sm font-semibold text-[#21475B] mb-2.5 ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              {localizedContent.heroEyebrow}
            </p>

            <h1
              className={`mograph-display text-[clamp(2.1rem,4.5vw,3.95rem)] font-bold leading-[1.06] text-[#13232D] mb-4 ${
                isBn ? 'bengali-text !leading-[1.18]' : ''
              }`}
              style={{ textWrap: 'balance' }}
            >
              {localizedContent.heroTitle}{' '}
              <span className="text-[#21475B]">{localizedContent.heroAccentName}</span>
            </h1>

            {/* Refractive Dark Arctic Slate Credential Capsule */}
            <div className="inline-flex flex-wrap items-center gap-2.5 self-start liquid-glass-dark text-[#F7FBFD] px-4 py-2 rounded-full text-sm sm:text-[15px] font-medium mb-5">
              <span className={`font-semibold ${isBn ? 'bengali-text !leading-none' : ''}`}>
                {localizedContent.doctorTitle}
              </span>
              <span className="text-[#9AC0D1]" aria-hidden="true">
                ·
              </span>
              <span className="mono-font font-bold text-white tracking-wide">
                {ui.hero.bmdcPrefix} {localizedContent.bmdcNumber}
              </span>
            </div>

            <p
              className={`text-[15px] sm:text-base md:text-[1.08rem] text-[#13232D] max-w-xl leading-relaxed mb-6 ${
                isBn ? 'bengali-text' : ''
              }`}
            >
              {localizedContent.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                type="button"
                onClick={onOpenBooking}
                className={`liquid-glass-dark tactile-pill inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white hover:bg-[#2E586D] text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E586D] focus-visible:outline-offset-2 ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                <Calendar className="w-4 h-4 text-[#D6E6EF]" />
                <span>{localizedContent.heroPrimaryCta}</span>
              </button>

              <button
                type="button"
                onClick={onOpenCv}
                className={`liquid-glass liquid-glass-interactive inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#1A2B36] text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E586D] focus-visible:outline-offset-2 ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                <FileText className="w-4 h-4 text-[#2E586D]" />
                <span>{localizedContent.heroSecondaryCta}</span>
              </button>

              <button
                type="button"
                onClick={onExplore}
                className={`tactile-pill inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-[#13232D] hover:text-[#21475B] whitespace-nowrap shrink-0 ${
                  isBn ? 'bengali-text !leading-none' : ''
                }`}
              >
                <span>{ui.hero.explorePortfolio}</span>
                <ArrowDownRight className="w-4 h-4 text-[#21475B]" />
              </button>
            </div>

            {/* Clean Unboxed Verification Strip */}
            <div
              className={`pt-4 border-t border-[#BBD4E2] flex items-center gap-2.5 text-xs font-medium text-[#13232D] ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#21475B] shrink-0" />
              <span>{localizedContent.heroTrustMarker}</span>
            </div>
          </div>

          {/* Right Column: Liquid Glass Framed Vertical Portrait Card */}
          {portraitPhoto && (
            <div className="lg:col-span-6 flex items-stretch justify-center">
              <div className="w-full liquid-glass liquid-glass-no-glare liquid-glass-interactive group rounded-[28px] p-2.5 flex flex-col">
                <div className="relative z-10 w-full h-[300px] sm:h-[380px] lg:h-[520px] rounded-[18px] overflow-hidden bg-[#D6E6EF]/35">
                  {localizedContent.heroMediaSource !== 'none' ? (
                    <HeroMotionMedia
                      source={localizedContent.heroMediaSource}
                      kind={localizedContent.heroMediaKind}
                      mediaUrl={localizedContent.heroMediaUrl}
                      uploadId={localizedContent.heroMediaUploadId}
                      isActive={isHeroActive}
                      alt={localizedContent.portraitCaptionTitle || portraitPhoto.title}
                      posterFallback={
                        <OccasionImage
                          primarySrc={portraitPhoto.primarySrc}
                          fallbackSrc={portraitPhoto.fallbackSrc}
                          alt={portraitPhoto.title}
                          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                        />
                      }
                    />
                  ) : (
                    <OccasionImage
                      primarySrc={portraitPhoto.primarySrc}
                      fallbackSrc={portraitPhoto.fallbackSrc}
                      alt={portraitPhoto.title}
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    />
                  )}
                  <div
                    className="absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-[#1A2B36]/84 via-[#1A2B36]/26 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="absolute left-5 right-5 bottom-4 z-20 flex items-end justify-between gap-4 text-white">
                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-medium text-[#E4EFF5] truncate ${
                          isBn ? 'bengali-text !leading-snug' : ''
                        }`}
                      >
                        {portraitPhoto.institution}
                      </p>
                      <p
                        className={`mograph-display text-sm sm:text-base font-bold truncate ${
                          isBn ? 'bengali-text !leading-snug' : ''
                        }`}
                      >
                        {localizedContent.portraitCaptionTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Serene Scroll Cue */}
      <div
        className="hidden md:flex flex-col items-center gap-1.5 absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        aria-hidden="true"
      >
        <span
          className={`text-[10px] font-semibold tracking-[0.2em] text-[#2E586D] ${
            isBn ? 'bengali-text tracking-normal !leading-none' : ''
          }`}
        >
          {ui.hero.scrollCue}
        </span>
        <span className="w-px h-5 bg-gradient-to-b from-[#2E586D] to-transparent animate-scroll-cue" />
      </div>
    </section>
  );
}
