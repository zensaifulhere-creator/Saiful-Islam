import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { OccasionCategory } from '../data/portfolioData';
import { formatNumberLocale } from '../data/translations';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
import { OccasionImage } from './OccasionImage';

export type GalleryFilter = 'all' | OccasionCategory;

interface HorizontalGalleryCardProps {
  filter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
  onOpenPhoto: (photoId: string) => void;
}

export function HorizontalGalleryCard({
  filter,
  onFilterChange,
  onOpenPhoto,
}: HorizontalGalleryCardProps) {
  const { localizedContent } = useCms();
  const { lang, isBn, ui } = useLanguage();
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);

  const visiblePhotos =
    filter === 'all'
      ? localizedContent.occasions
      : localizedContent.occasions.filter((photo) => photo.category === filter);

  const totalCountFormatted = formatNumberLocale(localizedContent.occasions.length, lang);

  const filterOptions: { value: GalleryFilter; label: string }[] = [
    { value: 'all', label: `${ui.gallery.allPrefix} (${totalCountFormatted})` },
    { value: 'clinical', label: ui.gallery.clinicalFilter },
    { value: 'honors', label: ui.gallery.honorsFilter },
    { value: 'milestones', label: ui.gallery.milestonesFilter },
  ];

  const scrollMobileBy = (dir: -1 | 1) => {
    const el = mobileTrackRef.current;
    if (!el) return;
    const step = Math.max(260, el.clientWidth * 0.82);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section
      className="zcard flex flex-col bg-[#F7FBFD]"
      data-card="4"
      id="gallery"
      aria-label="Ten Occasions Visual Chronicle"
    >
      <div
        className="absolute inset-0 pearl-grid opacity-25 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Top Header + Velocity-Squish Liquid Glass Filter Capsule */}
      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-5 sm:px-8 md:px-12 pt-12 md:pt-24 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-3 shrink-0">
        <div>
          <p
            className={`text-xs font-semibold text-[#21475B] mb-1 ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            {localizedContent.gallerySectionKicker}
          </p>
          <h2
            className={`mograph-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#13232D] ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            {localizedContent.galleryHeading}
          </h2>
        </div>

        <LiquidSegmentedControl
          ariaLabel="Filter occasion photographs"
          value={filter}
          onChange={(val) => {
            if (mobileTrackRef.current) mobileTrackRef.current.scrollLeft = 0;
            onFilterChange(val);
          }}
          options={filterOptions}
          className="self-start md:self-auto"
        />
      </div>

      {/* Mobile Touch-Swipeable Horizontal Carousel (< 768px) */}
      <div className="relative z-10 md:hidden flex flex-col justify-center pb-12 pt-2">
        <div className="px-5 mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-sm font-bold mograph-display text-[#1A2B36] truncate ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              {localizedContent.galleryLeadTitle}
            </p>
            <p
              className={`text-xs font-semibold text-[#2E586D] ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              {ui.gallery.swipeToExplore}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => scrollMobileBy(-1)}
              aria-label={ui.gallery.prevAria}
              className="liquid-glass tactile-pill w-9 h-9 rounded-full text-[#1A2B36] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollMobileBy(1)}
              aria-label={ui.gallery.nextAria}
              className="liquid-glass tactile-pill w-9 h-9 rounded-full text-[#1A2B36] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={mobileTrackRef}
          className="flex flex-row overflow-x-auto snap-x snap-mandatory no-scrollbar px-5 gap-4 py-2"
        >
          {visiblePhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpenPhoto(photo.id)}
              className="liquid-glass liquid-glass-no-glare liquid-glass-interactive snap-center group relative w-[82vw] max-w-[330px] h-[390px] rounded-3xl overflow-hidden text-left shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E586D]"
            >
              <div className="relative z-10 w-full h-full">
                <OccasionImage
                  primarySrc={photo.primarySrc}
                  fallbackSrc={photo.fallbackSrc}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div
                className="absolute inset-0 z-10 bg-gradient-to-t from-[#1A2B36]/95 via-[#1A2B36]/38 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              <span className="liquid-glass z-20 absolute top-3.5 right-3.5 w-8 h-8 rounded-full text-[#1A2B36] flex items-center justify-center">
                <Expand className="w-3.5 h-3.5" />
              </span>

              <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-white">
                <p
                  className={`text-[11px] font-medium text-[#E4EFF5] mb-1 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {photo.occasionLabel}
                </p>
                <h3
                  className={`mograph-display text-lg font-bold text-white leading-snug mb-1 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {photo.title}
                </h3>
                <p
                  className={`text-xs text-[#F7FBFD]/90 line-clamp-2 ${
                    isBn ? 'bengali-text !leading-relaxed' : ''
                  }`}
                >
                  {photo.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop GSAP Horizontal Scrub Track (>= 768px) */}
      <div className="relative z-10 hidden md:block flex-1 min-h-0 overflow-hidden pb-6 float-stage">
        <div className="gallery-wrapper flex flex-row h-full items-center px-12 pr-[14vw] gap-7 w-max py-4">
          <div className="min-w-[300px] lg:min-w-[360px] pr-6 shrink-0 float-card gallery-lead-float">
            <p
              className={`text-xs font-semibold text-[#21475B] mb-2 ${
                isBn ? 'bengali-text !leading-snug' : ''
              }`}
            >
              {ui.gallery.curatedCountSuffix}
            </p>
            <h3
              className={`mograph-display text-3xl lg:text-5xl font-bold text-[#13232D] leading-[1.06] mb-3 ${
                isBn ? 'bengali-text !leading-[1.22]' : ''
              }`}
              style={{ textWrap: 'balance' }}
            >
              {localizedContent.galleryLeadTitle}
            </h3>
            <p
              className={`text-[15px] text-[#13232D] max-w-xs leading-relaxed ${
                isBn ? 'bengali-text' : ''
              }`}
            >
              {localizedContent.galleryLeadCopy}
            </p>
          </div>

          {visiblePhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpenPhoto(photo.id)}
              className="gallery-item float-card liquid-glass liquid-glass-no-glare liquid-glass-interactive group relative w-[360px] lg:w-[410px] h-[56vh] lg:h-[60vh] rounded-[28px] overflow-hidden text-left shrink-0 focus-visible:outline-2 focus-visible:outline-[#21475B]"
            >
              <div className="relative z-10 w-full h-full">
                <OccasionImage
                  primarySrc={photo.primarySrc}
                  fallbackSrc={photo.fallbackSrc}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>

              <div
                className="absolute inset-0 z-10 bg-gradient-to-t from-[#13232D]/95 via-[#13232D]/42 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              <span className="liquid-glass z-20 absolute top-4 right-4 w-9 h-9 rounded-full text-[#13232D] flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
                <Expand className="w-4 h-4" />
              </span>

              <div className="absolute inset-x-0 bottom-0 z-20 p-6 text-white">
                <p
                  className={`text-[11px] font-medium text-[#E4EFF5] mb-1 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {photo.occasionLabel}
                </p>
                <h4
                  className={`mograph-display text-xl font-bold text-white leading-snug mb-1.5 ${
                    isBn ? 'bengali-text !leading-snug' : ''
                  }`}
                >
                  {photo.title}
                </h4>
                <p
                  className={`text-xs text-[#F7FBFD]/95 line-clamp-2 leading-relaxed ${
                    isBn ? 'bengali-text' : ''
                  }`}
                >
                  {photo.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
