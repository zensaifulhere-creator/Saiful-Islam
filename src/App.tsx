import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { AccordionPillarsCard, PillarMotionState } from './components/AccordionPillarsCard';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AppointmentDrawer } from './components/AppointmentDrawer';
import { BookingPreset, ContactFooterCard } from './components/ContactFooterCard';
import { EntryLoginModal } from './components/EntryLoginModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeroCard } from './components/HeroCard';
import { GalleryFilter, HorizontalGalleryCard } from './components/HorizontalGalleryCard';
import { LightboxModal } from './components/LightboxModal';
import { LiquidGlassFilter } from './components/LiquidGlassFilter';
import { MatrixCredentialsCard } from './components/MatrixCredentialsCard';
import { PatientDashboardModal } from './components/PatientDashboardModal';
import { PrintableCvModal } from './components/PrintableCvModal';
import { SpotlightBioCard } from './components/SpotlightBioCard';
import { TopNav } from './components/TopNav';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CmsProvider, useCms } from './contexts/CmsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SECTION_META } from './data/portfolioData';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_SECTION_PROGRESS = [0, 1 / 11.6, 2.05 / 11.6, 5.6 / 11.6, 10.6 / 11.6, 1];

const PILLAR_FLOAT_ORIGINS = [
  { x: -38, y: -44, z: 100, rotateX: 11, rotateY: -9, rotateZ: -3.2, scale: 0.91, opacity: 0.2 },
  { x: 44, y: 36, z: 60, rotateX: -9, rotateY: 10, rotateZ: 2.6, scale: 0.9, opacity: 0.2 },
  { x: -32, y: 74, z: 120, rotateX: 13, rotateY: -7, rotateZ: -2.2, scale: 0.88, opacity: 0.16 },
  { x: 38, y: 110, z: 75, rotateX: -11, rotateY: 8, rotateZ: 3.0, scale: 0.86, opacity: 0.16 },
];

const STEP_FLOAT_ORIGINS = [
  { x: -24, y: 72, z: 90, rotateX: 14, rotateY: -10, rotateZ: -4, scale: 0.88, opacity: 0.18 },
  { x: -10, y: 94, z: 50, rotateX: 10, rotateY: 6, rotateZ: 2.5, scale: 0.9, opacity: 0.18 },
  { x: 10, y: 114, z: 80, rotateX: -10, rotateY: -6, rotateZ: -2.5, scale: 0.9, opacity: 0.18 },
  { x: 24, y: 132, z: 65, rotateX: -14, rotateY: 10, rotateZ: 4, scale: 0.88, opacity: 0.18 },
];

function PortfolioExperience() {
  const { showEntryModal } = useAuth();
  const { localizedContent } = useCms();

  const [activeSection, setActiveSection] = useState(0);
  const [scrollPillarIndex, setScrollPillarIndex] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all');
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPreset, setBookingPreset] = useState<BookingPreset | undefined>(undefined);
  const [isCvOpen, setIsCvOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);
  const lastSectionRef = useRef<number>(0);
  const lastPillarIndexRef = useRef<number>(0);
  const pillarCountRef = useRef<number>(localizedContent.pillars.length);
  const pillarMotionRef = useRef<PillarMotionState>({
    progress: 0,
    velocity: 0,
    isInCard3: false,
  });

  pillarCountRef.current = Math.max(1, localizedContent.pillars.length);

  const openBookingDrawer = useCallback((preset?: BookingPreset) => {
    setBookingPreset(preset);
    setIsBookingOpen(true);
  }, []);

  const hasOpenOverlay =
    showEntryModal ||
    lightboxPhotoId !== null ||
    isBookingOpen ||
    isCvOpen ||
    isPortalOpen ||
    isAdminOpen;

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (hasOpenOverlay) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [hasOpenOverlay]);

  useEffect(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, [localizedContent.occasions.length]);

  // Modern Web Guidance: rAF-throttled passive pointer sheen (zero React re-renders, zero layout reads)
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let vw = window.innerWidth || 1440;
    let vh = window.innerHeight || 900;
    let pending = false;
    let px = 50;
    let py = 25;

    const onResize = () => {
      vw = window.innerWidth || 1440;
      vh = window.innerHeight || 900;
    };

    const flush = () => {
      pending = false;
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--lg-x', `${px.toFixed(1)}%`);
      rootStyle.setProperty('--lg-y', `${py.toFixed(1)}%`);
    };

    const onPointerMove = (e: PointerEvent) => {
      px = Math.max(0, Math.min(100, (e.clientX / vw) * 100));
      py = Math.max(0, Math.min(100, (e.clientY / vh) * 100));
      if (!pending) {
        pending = true;
        requestAnimationFrame(flush);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  // Compositor-Only Lenis + GSAP Z-Depth & Floating-Card-to-Ordered Choreography
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      const handleStaticScroll = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.max(0, Math.min(1, window.scrollY / max));
        const idx = Math.min(SECTION_META.length - 1, Math.floor(p * SECTION_META.length));
        if (idx !== lastSectionRef.current) {
          lastSectionRef.current = idx;
          setActiveSection(idx);
        }
      };
      window.addEventListener('scroll', handleStaticScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleStaticScroll);
    }

    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;

    let smoothedVel = 0;
    let lastScrollY = window.scrollY;
    let fallbackVel = 0;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
      const currentY = window.scrollY;
      const deltaY = currentY - lastScrollY;
      lastScrollY = currentY;
      fallbackVel = fallbackVel * 0.8 + deltaY * 0.2;

      const rawVel = Math.abs(lenis.velocity) > 0.05 ? lenis.velocity : fallbackVel;
      smoothedVel += (rawVel - smoothedVel) * 0.14;
      if (Math.abs(smoothedVel) < 0.01) smoothedVel = 0;
      pillarMotionRef.current.velocity = smoothedVel;
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      const choreographFloatingAssembly = (
        tl: gsap.core.Timeline,
        bioOffset: number,
        pillarOffset: number,
        galleryOffset: number,
        credOffset: number,
        footerOffset: number
      ) => {
        // Card 2: Portrait + Mission Panel float in from opposing 3D vectors and lock cleanly
        const bioCards = gsap.utils.toArray<HTMLElement>('.bio-float-card');
        if (bioCards[0]) {
          tl.fromTo(
            bioCards[0],
            { x: -36, y: 60, z: 90, rotateY: 12, rotateZ: -3, scale: 0.92, opacity: 0.2 },
            { x: 0, y: 0, z: 0, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' },
            bioOffset + 0.1
          );
        }
        if (bioCards[1]) {
          tl.fromTo(
            bioCards[1],
            { x: 36, y: 80, z: 60, rotateX: 8, rotateY: -8, scale: 0.94, opacity: 0.2 },
            { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' },
            bioOffset + 0.18
          );
        }

        // Card 3: 4 Clinical Focus Cards float suspended in 3D space then arrange sequentially (01 -> 04)
        const pillarCards = gsap.utils.toArray<HTMLElement>('.pillar-float-card');
        pillarCards.forEach((card, idx) => {
          const origin = PILLAR_FLOAT_ORIGINS[idx % PILLAR_FLOAT_ORIGINS.length];
          tl.fromTo(
            card,
            origin,
            {
              x: 0,
              y: 0,
              z: 0,
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.85,
              ease: 'power3.out',
            },
            pillarOffset + 0.12 + idx * 0.08
          );
        });

        // Card 4: Gallery lead & cards glide out of 3D tilt into ordered carousel
        const galleryLead = document.querySelector<HTMLElement>('.gallery-lead-float');
        const galleryCards = gsap.utils.toArray<HTMLElement>('.gallery-item');
        if (galleryLead) {
          tl.fromTo(
            galleryLead,
            { x: -32, y: 40, rotateY: 10, opacity: 0.25 },
            { x: 0, y: 0, rotateY: 0, opacity: 1, duration: 0.85, ease: 'power3.out' },
            galleryOffset + 0.1
          );
        }
        if (galleryCards.length > 0) {
          tl.fromTo(
            galleryCards.slice(0, 4),
            { y: 65, z: 80, rotateY: 12, rotateZ: 2.5, scale: 0.92, opacity: 0.25 },
            {
              y: 0,
              z: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.85,
              stagger: 0.07,
              ease: 'power3.out',
            },
            galleryOffset + 0.14
          );
        }

        // Card 5: Spotlight + Credentials panels arrange cleanly from suspended 3D elevation
        const credCards = gsap.utils.toArray<HTMLElement>('.cred-float-card');
        if (credCards[0]) {
          tl.fromTo(
            credCards[0],
            { x: -34, y: 70, z: 90, rotateY: 10, rotateZ: -2.5, scale: 0.92, opacity: 0.2 },
            { x: 0, y: 0, z: 0, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1, duration: 0.88, ease: 'power3.out' },
            credOffset + 0.12
          );
        }
        if (credCards[1]) {
          tl.fromTo(
            credCards[1],
            { x: 34, y: 85, z: 60, rotateX: 9, rotateY: -9, scale: 0.93, opacity: 0.2 },
            { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1, duration: 0.88, ease: 'power3.out' },
            credOffset + 0.18
          );
        }

        // Card 6: 4 Booking Steps & Scheduler Card float down into crisp grid alignment
        const stepCards = gsap.utils.toArray<HTMLElement>('.step-float-card');
        stepCards.forEach((card, idx) => {
          const origin = STEP_FLOAT_ORIGINS[idx % STEP_FLOAT_ORIGINS.length];
          tl.fromTo(
            card,
            origin,
            {
              x: 0,
              y: 0,
              z: 0,
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              opacity: 1,
              duration: 0.82,
              ease: 'power3.out',
            },
            footerOffset + 0.1 + idx * 0.06
          );
        });
        const schedulerCard = document.querySelector<HTMLElement>('.scheduler-float-card');
        if (schedulerCard) {
          tl.fromTo(
            schedulerCard,
            { y: 72, z: 70, rotateX: 10, scale: 0.94, opacity: 0.2 },
            { y: 0, z: 0, rotateX: 0, scale: 1, opacity: 1, duration: 0.85, ease: 'power3.out' },
            footerOffset + 0.22
          );
        }
      };

      mm.add('(min-width: 768px)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.zcard');
        const galleryWrapper = document.querySelector<HTMLElement>('.gallery-wrapper');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.scroll-spacer',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5,
            invalidateOnRefresh: true,
          },
        });

        // 0 -> 1: Hero -> Mission
        tl.to(
          cards[0],
          { scale: 0.94, yPercent: -4, opacity: 0, duration: 1, ease: 'power3.inOut' },
          0
        ).to(cards[1], { y: '0%', duration: 1, ease: 'power3.inOut' }, 0);

        // 1 -> 2: Mission -> Everyday Practice (dwells 2 -> 4.6)
        tl.to(
          cards[1],
          { scale: 0.94, yPercent: -4, opacity: 0, duration: 1, ease: 'power3.inOut' },
          1
        ).to(cards[2], { y: '0%', duration: 1, ease: 'power3.inOut' }, 1);

        // 4.6 -> 5.6: Everyday Practice -> Gallery
        tl.to(
          cards[2],
          { scale: 0.94, yPercent: -4, opacity: 0, duration: 1, ease: 'power3.inOut' },
          4.6
        ).to(cards[3], { y: '0%', duration: 1, ease: 'power3.inOut' }, 4.6);

        // 5.6 -> 9.6: Gallery Horizontal Scrub
        if (galleryWrapper) {
          tl.to(
            galleryWrapper,
            {
              x: () => -Math.max(0, galleryWrapper.scrollWidth - window.innerWidth),
              ease: 'none',
              duration: 4,
            },
            5.6
          );
        }

        // 9.6 -> 10.6: Gallery -> Credentials
        tl.to(
          cards[3],
          { scale: 0.94, yPercent: -4, opacity: 0, duration: 1, ease: 'power3.inOut' },
          9.6
        ).to(cards[4], { y: '0%', duration: 1, ease: 'power3.inOut' }, 9.6);

        // 10.6 -> 11.6: Credentials -> Connect Footer
        tl.to(
          cards[4],
          { scale: 0.94, yPercent: -4, opacity: 0, duration: 1, ease: 'power3.inOut' },
          10.6
        ).to(cards[5], { y: '0%', duration: 1, ease: 'power3.inOut' }, 10.6);

        choreographFloatingAssembly(tl, 0, 1, 4.6, 9.6, 10.6);
      });
    });

    const handleScroll = () => {
      const isDesktop = window.innerWidth >= 768;

      let nextSection = 0;
      let pillarProgress = 0;
      let isInCard3 = false;

      if (isDesktop) {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.max(0, Math.min(1, window.scrollY / max));

        if (p < 0.7 / 11.6) nextSection = 0;
        else if (p < 1.7 / 11.6) nextSection = 1;
        else if (p < 5.0 / 11.6) nextSection = 2;
        else if (p < 10.0 / 11.6) nextSection = 3;
        else if (p < 11.0 / 11.6) nextSection = 4;
        else nextSection = 5;

        pillarProgress = Math.max(0, Math.min(1, (p - 2 / 11.6) / (2.6 / 11.6)));
        isInCard3 = p >= 1.25 / 11.6 && p <= 5.3 / 11.6;
      } else {
        const vh = window.innerHeight || 800;
        const cards = document.querySelectorAll<HTMLElement>('.zcard');
        cards.forEach((card, idx) => {
          const rect = card.getBoundingClientRect();
          if (rect.top <= vh * 0.42) {
            nextSection = idx;
          }
        });

        const pillarsEl = document.getElementById('pillars');
        if (pillarsEl) {
          const rect = pillarsEl.getBoundingClientRect();
          const travel = Math.max(160, rect.height - vh * 0.25);
          pillarProgress = Math.max(0, Math.min(1, (vh * 0.55 - rect.top) / travel));
          isInCard3 = rect.top < vh * 0.9 && rect.bottom > vh * 0.1;
        }
      }

      pillarMotionRef.current.progress = pillarProgress;
      pillarMotionRef.current.isInCard3 = isInCard3;

      const count = pillarCountRef.current;
      const nextPillarIdx = Math.min(
        count - 1,
        Math.max(0, Math.floor(pillarProgress * count * 0.9999))
      );

      if (nextPillarIdx !== lastPillarIndexRef.current) {
        lastPillarIndexRef.current = nextPillarIdx;
        setScrollPillarIndex(nextPillarIdx);
      }

      if (nextSection !== lastSectionRef.current) {
        lastSectionRef.current = nextSection;
        setActiveSection(nextSection);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ctx.revert();
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const handleFilterChange = useCallback((nextFilter: GalleryFilter) => {
    setGalleryFilter(nextFilter);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (window.innerWidth >= 768) {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const startOfGalleryY = Math.round(DESKTOP_SECTION_PROGRESS[3] * max);
        if (lenisRef.current) {
          lenisRef.current.scrollTo(startOfGalleryY, { duration: 0.8 });
        }
      }
    });
  }, []);

  const navigateToSection = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SECTION_META.length - 1, index));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 768;

    if (reduceMotion || !isDesktop) {
      const el = document.getElementById(SECTION_META[clamped].id);
      if (el) {
        if (!reduceMotion && lenisRef.current) {
          lenisRef.current.scrollTo(el, { duration: 1.0, offset: 0 });
        } else {
          el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
      return;
    }

    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.round(DESKTOP_SECTION_PROGRESS[clamped] * max);

    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }, []);

  const lightboxPhotos =
    galleryFilter === 'all'
      ? localizedContent.occasions
      : localizedContent.occasions.filter((p) => p.category === galleryFilter);

  const activeLightboxList =
    lightboxPhotoId && lightboxPhotos.some((p) => p.id === lightboxPhotoId)
      ? lightboxPhotos
      : localizedContent.occasions;

  return (
    <div className="min-h-screen bg-[#F7FBFD] text-[#1A2B36] selection:bg-[#7FA6B8]/25">
      <LiquidGlassFilter />

      <TopNav
        activeSection={activeSection}
        onNavigateSection={navigateToSection}
        onOpenBooking={() => openBookingDrawer()}
        onOpenPortal={() => setIsPortalOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <div className="no-print hidden md:block scroll-spacer md:h-[1180vh]" aria-hidden="true" />

      <main className="no-print flex flex-col md:block">
        <HeroCard
          onExplore={() => navigateToSection(1)}
          onOpenBooking={() => openBookingDrawer()}
          onOpenCv={() => setIsCvOpen(true)}
          isHeroActive={activeSection === 0}
        />
        <SpotlightBioCard onOpenPhoto={(id) => setLightboxPhotoId(id)} />
        <AccordionPillarsCard
          onOpenPhoto={(id) => setLightboxPhotoId(id)}
          scrollPillarIndex={scrollPillarIndex}
          motionRef={pillarMotionRef}
        />
        <HorizontalGalleryCard
          filter={galleryFilter}
          onFilterChange={handleFilterChange}
          onOpenPhoto={(id) => setLightboxPhotoId(id)}
        />
        <MatrixCredentialsCard
          onOpenPhoto={(id) => setLightboxPhotoId(id)}
          onOpenBookingWithMode={(mode) => openBookingDrawer({ mode })}
        />
        <ContactFooterCard
          onOpenBooking={(preset) => openBookingDrawer(preset)}
          onOpenCv={() => setIsCvOpen(true)}
          onOpenPortal={() => setIsPortalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onNavigateSection={navigateToSection}
        />
      </main>

      <EntryLoginModal />

      <LightboxModal
        photos={activeLightboxList}
        activePhotoId={lightboxPhotoId}
        onSelectPhoto={(id) => setLightboxPhotoId(id)}
        onClose={() => setLightboxPhotoId(null)}
      />

      <AppointmentDrawer
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onOpenPortal={() => setIsPortalOpen(true)}
        initialPreset={bookingPreset}
      />

      <PrintableCvModal isOpen={isCvOpen} onClose={() => setIsCvOpen(false)} />

      <PatientDashboardModal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
        onOpenBooking={() => openBookingDrawer()}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onOpenPatientView={() => setIsPortalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <CmsProvider>
            <PortfolioExperience />
          </CmsProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
