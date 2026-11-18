import { Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SiteLanguage } from '../data/translations';
import { useMagneticPull } from '../hooks/useSpringPhysics';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

interface TopNavProps {
  activeSection: number;
  onNavigateSection: (index: number) => void;
  onOpenBooking: () => void;
  onOpenPortal: () => void;
  onOpenAdmin: () => void;
}

export function TopNav({
  activeSection,
  onNavigateSection,
  onOpenBooking,
  onOpenPortal,
  onOpenAdmin,
}: TopNavProps) {
  const { localizedContent } = useCms();
  const { user, isAdmin, openLoginModal } = useAuth();
  const { lang, setLang, isBn, ui } = useLanguage();

  const isScrolled = activeSection > 0;

  const brandMagnet = useMagneticPull<HTMLButtonElement>(0.22, 1.03);
  const bookMagnet = useMagneticPull<HTMLButtonElement>(0.2, 1.03);
  const ctaMagnet = useMagneticPull<HTMLButtonElement>(0.22, 1.03);

  const handlePrimaryAction = () => {
    if (!user) {
      openLoginModal();
    } else if (isAdmin) {
      onOpenAdmin();
    } else {
      onOpenPortal();
    }
  };

  const primaryLabel = !user
    ? ui.nav.signIn
    : isAdmin
      ? ui.nav.adminStudio
      : ui.nav.myDashboard;

  return (
    <header className="no-print fixed top-0 left-0 right-0 z-[9990] h-14 md:h-[76px] px-2.5 sm:px-6 md:px-8 flex items-center justify-between gap-2 sm:gap-4 pointer-events-none">
      {/* Zone 1: Magnetic Pearl Liquid Glass Wordmark */}
      <button
        ref={brandMagnet.ref}
        {...brandMagnet.magneticProps}
        type="button"
        onClick={() => onNavigateSection(0)}
        className={`pointer-events-auto liquid-glass px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full mograph-display text-[11px] sm:text-sm md:text-[15px] font-bold tracking-tight text-[#1A2B36] hover:text-[#2E586D] whitespace-nowrap shrink-0 will-change-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-[#2E586D] focus-visible:outline-offset-4 ${
          isScrolled ? 'nav-pill-scrolled' : ''
        } ${isBn ? 'bengali-text !leading-none' : ''}`}
        aria-label={localizedContent.doctorShortName}
      >
        <span className="sm:hidden">{ui.nav.brandShortMobile}</span>
        <span className="hidden sm:inline">{localizedContent.doctorShortName}</span>
      </button>

      {/* Zone 2 (Top-Right): Global Language Switcher + Book Appointment + Sign In / Dashboard */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <LiquidSegmentedControl<SiteLanguage>
          size="sm"
          ariaLabel={ui.nav.languageSwitcherAria}
          value={lang}
          onChange={setLang}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'bn', label: 'বাংলা' },
          ]}
        />

        <button
          ref={bookMagnet.ref}
          {...bookMagnet.magneticProps}
          type="button"
          onClick={onOpenBooking}
          className={`liquid-glass liquid-glass-interactive tactile-pill inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 md:py-2 rounded-full text-[#1A2B36] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap shrink-0 will-change-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-[#2E586D] focus-visible:outline-offset-2 ${
            isScrolled ? 'nav-pill-scrolled' : ''
          } ${isBn ? 'bengali-text !leading-none' : ''}`}
          aria-label={ui.nav.bookAppointment}
        >
          <Calendar className="w-3.5 h-3.5 text-[#2E586D] shrink-0" />
          <span className="md:hidden">{ui.nav.bookShort}</span>
          <span className="hidden md:inline">{ui.nav.bookAppointment}</span>
        </button>

        <button
          ref={ctaMagnet.ref}
          {...ctaMagnet.magneticProps}
          type="button"
          onClick={handlePrimaryAction}
          className={`liquid-glass-dark px-2.5 sm:px-4 py-1.5 md:px-5 md:py-2 text-white hover:bg-[#2E586D] text-[11px] sm:text-xs md:text-sm font-semibold rounded-full will-change-transform active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2E586D] focus-visible:outline-offset-2 ${
            isScrolled ? 'nav-capsule-scrolled' : ''
          } ${isBn ? 'bengali-text !leading-none' : ''}`}
        >
          {primaryLabel}
        </button>
      </div>
    </header>
  );
}
