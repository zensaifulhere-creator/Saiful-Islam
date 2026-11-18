import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { OccasionPhoto } from '../data/portfolioData';
import { OccasionImage } from './OccasionImage';

interface LightboxModalProps {
  photos: OccasionPhoto[];
  activePhotoId: string | null;
  onSelectPhoto: (id: string) => void;
  onClose: () => void;
}

export function LightboxModal({
  photos,
  activePhotoId,
  onSelectPhoto,
  onClose,
}: LightboxModalProps) {
  const { isBn, ui } = useLanguage();

  const currentIndex = activePhotoId
    ? photos.findIndex((p) => p.id === activePhotoId)
    : -1;

  const activePhoto = currentIndex >= 0 ? photos[currentIndex] : null;

  useEffect(() => {
    if (!activePhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        const nextIdx = (currentIndex + 1) % photos.length;
        onSelectPhoto(photos[nextIdx].id);
      } else if (e.key === 'ArrowLeft') {
        const prevIdx = (currentIndex - 1 + photos.length) % photos.length;
        onSelectPhoto(photos[prevIdx].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, currentIndex, photos, onClose, onSelectPhoto]);

  if (!activePhoto) return null;

  const goPrev = () => {
    const prevIdx = (currentIndex - 1 + photos.length) % photos.length;
    onSelectPhoto(photos[prevIdx].id);
  };

  const goNext = () => {
    const nextIdx = (currentIndex + 1) % photos.length;
    onSelectPhoto(photos[nextIdx].id);
  };

  return (
    <div
      data-lenis-prevent
      className="no-print fixed inset-0 z-[10020] bg-[#2A3E4B]/88 backdrop-blur-md flex flex-col justify-between p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${activePhoto.title}`}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-4 text-white max-w-6xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-xs md:text-sm font-medium text-[#D6E6EF] truncate ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            {activePhoto.categoryLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={ui.lightbox.closeAria}
          className="liquid-glass-dark tactile-pill w-10 h-10 rounded-full text-white hover:bg-[#7FA6B8] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 max-w-6xl w-full mx-auto my-4 flex items-center justify-center gap-3 md:gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={goPrev}
          aria-label={ui.lightbox.prevAria}
          className="liquid-glass-dark tactile-pill w-11 h-11 rounded-full hover:bg-white text-white hover:text-[#2A3E4B] flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative h-full max-h-[68vh] w-full flex flex-col md:flex-row bg-[#F7FBFD] rounded-[28px] overflow-hidden border border-white/80 shadow-[0_28px_70px_-14px_rgba(15,28,36,0.55)]">
          <div className="relative flex-1 bg-[#2A3E4B] min-h-[240px] flex items-center justify-center overflow-hidden">
            <OccasionImage
              primarySrc={activePhoto.primarySrc}
              fallbackSrc={activePhoto.fallbackSrc}
              alt={activePhoto.title}
              className="w-full h-full object-contain max-h-[68vh]"
            />
          </div>

          <div
            data-lenis-prevent
            className="md:w-80 lg:w-96 p-6 md:p-7 flex flex-col justify-between bg-[#F7FBFD] border-t md:border-t-0 md:border-l border-[#C4DBE8] overflow-y-auto overscroll-contain"
          >
            <div>
              <p
                className={`text-xs font-semibold text-[#2E586D] mb-2 ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {activePhoto.occasionLabel}
              </p>
              <h3
                className={`mograph-display text-xl md:text-2xl font-bold text-[#1A2B36] mb-3 leading-snug ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {activePhoto.title}
              </h3>
              <p
                className={`text-sm text-[#1A2B36]/90 leading-relaxed ${
                  isBn ? 'bengali-text' : ''
                }`}
              >
                {activePhoto.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#C4DBE8]">
              <p
                className={`text-[11px] font-semibold text-[#2E586D] ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {ui.lightbox.institutionContext}
              </p>
              <p
                className={`text-xs font-bold text-[#1A2B36] mt-0.5 ${
                  isBn ? 'bengali-text !leading-snug' : ''
                }`}
              >
                {activePhoto.institution}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label={ui.lightbox.nextAria}
          className="liquid-glass-dark tactile-pill w-11 h-11 rounded-full hover:bg-white text-white hover:text-[#2A3E4B] flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div
        className="max-w-6xl w-full mx-auto flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.map((photo) => {
          const isCurrent = photo.id === activePhoto.id;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onSelectPhoto(photo.id)}
              aria-label={`Select ${photo.title}`}
              className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                isCurrent
                  ? 'border-[#7FA6B8] scale-105 opacity-100'
                  : 'border-transparent opacity-55 hover:opacity-90'
              }`}
            >
              <OccasionImage
                primarySrc={photo.primarySrc}
                fallbackSrc={photo.fallbackSrc}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
