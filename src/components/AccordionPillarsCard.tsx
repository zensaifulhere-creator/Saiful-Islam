import { RefObject, useEffect, useRef, useState } from 'react';
import { ChevronDown, Expand } from 'lucide-react';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumberLocale } from '../data/translations';
import { OccasionImage } from './OccasionImage';

export interface PillarMotionState {
  progress: number;
  velocity: number;
  isInCard3: boolean;
}

interface AccordionPillarsCardProps {
  onOpenPhoto: (photoId: string) => void;
  scrollPillarIndex: number;
  motionRef: RefObject<PillarMotionState>;
}

interface CardSpring {
  y: number;
  scale: number;
  rotateX: number;
}

export function AccordionPillarsCard({
  onOpenPhoto,
  scrollPillarIndex,
  motionRef,
}: AccordionPillarsCardProps) {
  const { localizedContent } = useCms();
  const { lang, isBn, ui } = useLanguage();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const overrideScrollBandRef = useRef<number | null>(null);
  const activeIdxRef = useRef<number>(0);
  const cardInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const springsRef = useRef<CardSpring[]>([]);

  activeIdxRef.current = activeIndex;

  // Sync scroll-driven active pillar while respecting manual click override until scroll moves to a new band
  useEffect(() => {
    const count = localizedContent.pillars.length;
    if (count === 0) return;
    const bounded = Math.max(0, Math.min(count - 1, scrollPillarIndex));

    if (overrideScrollBandRef.current !== null) {
      if (bounded === overrideScrollBandRef.current) {
        return;
      }
      overrideScrollBandRef.current = null;
    }

    setActiveIndex(bounded);
  }, [scrollPillarIndex, localizedContent.pillars.length]);

  const handleCardSelect = (idx: number) => {
    overrideScrollBandRef.current = scrollPillarIndex;
    setActiveIndex(idx);
  };

  // 60fps compositor-only 3D levitation + pop-up / minimize dynamics driven by scroll velocity
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let rafId = 0;

    const tick = (now: number) => {
      const motion = motionRef.current;
      const rawVel = motion?.isInCard3 ? motion.velocity : 0;
      const speed = Math.min(1, Math.abs(rawVel) / 26);
      const dir = rawVel === 0 ? 0 : Math.sign(rawVel);
      const activeIdx = activeIdxRef.current;

      localizedContent.pillars.forEach((_, idx) => {
        const el = cardInnerRefs.current[idx];
        if (!el) return;

        if (!springsRef.current[idx]) {
          springsRef.current[idx] = { y: 0, scale: 1, rotateX: 0 };
        }
        const spring = springsRef.current[idx];
        const isActive = idx === activeIdx;
        const relOffset = idx - activeIdx;

        // Subtle organic levitation wave amplified smoothly by scroll speed
        const wave = Math.sin(now * 0.002 + idx * 1.18) * (1.2 + speed * 3.2);

        let targetScale = 1;
        let targetY = 0;
        let targetRotateX = 0;

        if (motion?.isInCard3) {
          if (isActive) {
            targetScale = 1.018 + speed * 0.024;
            targetY = -4 - speed * 4.5 + dir * speed * 2.2 + wave * 0.55;
            targetRotateX = Math.max(-4.5, Math.min(4.5, -rawVel * 0.14));
          } else {
            targetScale = 0.966 - speed * 0.02;
            targetY =
              relOffset * (2.5 + speed * 6.5) +
              dir * speed * (3.5 + idx * 1.15) +
              wave;
            targetRotateX = Math.max(
              -5.5,
              Math.min(5.5, -rawVel * 0.18 + relOffset * 0.75)
            );
          }
        } else {
          targetScale = isActive ? 1.01 : 0.978;
          targetY = 0;
          targetRotateX = 0;
        }

        const ease = 0.13;
        spring.y += (targetY - spring.y) * ease;
        spring.scale += (targetScale - spring.scale) * ease;
        spring.rotateX += (targetRotateX - spring.rotateX) * ease;

        el.style.transform = `translate3d(0, ${spring.y.toFixed(2)}px, 0) scale(${spring.scale.toFixed(
          4
        )}) perspective(1100px) rotateX(${spring.rotateX.toFixed(2)}deg)`;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      cardInnerRefs.current.forEach((el) => {
        if (el) el.style.transform = '';
      });
    };
  }, [localizedContent.pillars, motionRef]);

  return (
    <section
      className="zcard flex flex-col justify-center bg-[#F7FBFD]"
      data-card="3"
      id="pillars"
      aria-label="Clinical Focus in Four Steps"
    >
      <div
        className="absolute inset-0 pearl-grid opacity-30 pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[1040px] mx-auto px-5 sm:px-8 py-12 md:pt-24 md:pb-8 md:max-h-full md:overflow-y-auto no-scrollbar float-stage">
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7">
          <p
            className={`text-xs font-semibold text-[#21475B] mb-1.5 ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            {localizedContent.pillarsSectionKicker}
          </p>
          <h2
            className={`mograph-display text-2xl sm:text-4xl font-bold text-[#13232D] mb-2 ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
            style={{ textWrap: 'balance' }}
          >
            {localizedContent.pillarsHeading}
          </h2>
          <p
            className={`text-sm sm:text-[15px] text-[#13232D]/95 ${
              isBn ? 'bengali-text !leading-relaxed' : ''
            }`}
          >
            {localizedContent.pillarsSubheading}
          </p>
        </div>

        {/* Velocity-Reactive Levitating Liquid Glass Cards */}
        <div className="space-y-2.5 float-stage">
          {localizedContent.pillars.map((pillar, idx) => {
            const photo =
              localizedContent.occasions.find((p) => p.id === pillar.photoId) ||
              localizedContent.occasions[0];
            const isActive = activeIndex === idx;
            const stepNum = formatNumberLocale(String(idx + 1).padStart(2, '0'), lang);

            return (
              <div key={pillar.id} className="float-card pillar-float-card">
                <div
                  ref={(el) => {
                    cardInnerRefs.current[idx] = el;
                  }}
                  className={`pillar-levitate-inner rounded-[26px] overflow-hidden transition-[box-shadow,border-color,opacity] duration-500 ${
                    isActive
                      ? 'liquid-glass nav-pill-scrolled border-[#2E586D]/45 opacity-100'
                      : 'liquid-glass border-white/90 opacity-95 hover:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isActive}
                    onClick={() => handleCardSelect(idx)}
                    className="group relative z-10 w-full px-5 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between gap-4 text-left focus-visible:outline-2 focus-visible:outline-[#2E586D]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={`num-display text-xl sm:text-2xl font-bold min-w-[2.1rem] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 ${
                          isActive ? 'text-[#21475B]' : 'text-[#13232D]/85'
                        }`}
                      >
                        {stepNum}
                      </span>
                      <span
                        className={`mograph-display text-base sm:text-lg font-bold text-[#13232D] truncate ${
                          isBn ? 'bengali-text !leading-snug' : ''
                        }`}
                      >
                        {pillar.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`hidden sm:inline text-xs font-semibold text-[#21475B] ${
                          isBn ? 'bengali-text !leading-none' : ''
                        }`}
                      >
                        {pillar.tag}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#21475B] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isActive ? 'rotate-180 text-[#13232D]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Smooth Accordion Expand / Minimize Container */}
                  <div
                    aria-hidden={!isActive}
                    className={`relative z-10 grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-7 pb-5 sm:pb-6 pt-3 border-t border-[#C4DBE8] grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {photo && (
                          <div className="md:col-span-5">
                            <div className="group relative z-10 h-44 sm:h-48 rounded-[16px] overflow-hidden border border-white/80 bg-[#F7FBFD] shadow-xs">
                              <OccasionImage
                                primarySrc={photo.primarySrc}
                                fallbackSrc={photo.fallbackSrc}
                                alt={photo.title}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                              />
                            </div>
                          </div>
                        )}

                        <div className="md:col-span-7 space-y-2.5">
                          <p
                            className={`text-xs font-semibold text-[#21475B] ${
                              isBn ? 'bengali-text !leading-snug' : ''
                            }`}
                          >
                            {pillar.code} · {pillar.tag}
                          </p>
                          <h3
                            className={`mograph-display text-xl sm:text-2xl font-bold text-[#13232D] ${
                              isBn ? 'bengali-text !leading-snug' : ''
                            }`}
                          >
                            {pillar.title}
                          </h3>
                          <p
                            className={`text-[15px] text-[#13232D] leading-relaxed ${
                              isBn ? 'bengali-text' : ''
                            }`}
                          >
                            {pillar.summary}
                          </p>

                          {photo && (
                            <button
                              type="button"
                              tabIndex={isActive ? 0 : -1}
                              onClick={() => onOpenPhoto(photo.id)}
                              className={`liquid-glass-dark tactile-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-white hover:bg-[#2E586D] text-xs font-semibold ${
                                isBn ? 'bengali-text !leading-none' : ''
                              }`}
                            >
                              <Expand className="w-3.5 h-3.5 text-[#D6E6EF]" />
                              <span>{ui.pillars.inspectMoment}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
