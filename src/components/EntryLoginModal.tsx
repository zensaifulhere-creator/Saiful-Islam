import { useEffect } from 'react';
import { ShieldCheck, Sparkles, UserCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';

export function EntryLoginModal() {
  const {
    showEntryModal,
    dismissLoginModal,
    signInWithGoogle,
    signingIn,
    authError,
  } = useAuth();
  const { localizedContent } = useCms();
  const { isBn, ui } = useLanguage();

  useEffect(() => {
    if (!showEntryModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissLoginModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showEntryModal, dismissLoginModal]);

  if (!showEntryModal) return null;

  return (
    <div
      data-lenis-prevent
      className="no-print fixed inset-0 z-[10030] bg-[#2A3E4B]/55 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to Patient Portal"
      onClick={dismissLoginModal}
    >
      <div
        className="liquid-glass nav-pill-scrolled relative w-full max-w-md rounded-[32px] overflow-hidden p-7 sm:p-9 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismissLoginModal}
          aria-label={ui.login.closeAria}
          className="liquid-glass liquid-glass-interactive tactile-pill absolute top-5 right-5 w-9 h-9 rounded-full text-[#1A2B36] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6 pr-8">
          <p
            className={`text-xs font-semibold text-[#2E586D] mb-2 ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            {localizedContent.doctorName} · {ui.login.portalAccessSuffix}
          </p>
          <h2
            className={`mograph-display text-2xl sm:text-3xl font-bold text-[#1A2B36] mb-2.5 ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
            style={{ textWrap: 'balance' }}
          >
            {ui.login.title}
          </h2>
          <p
            className={`text-sm text-[#1A2B36]/90 leading-relaxed ${
              isBn ? 'bengali-text' : ''
            }`}
          >
            {ui.login.body}
          </p>
        </div>

        {/* Concise Feature Highlights */}
        <div className="space-y-2.5 mb-7 bg-white/85 border border-[#C4DBE8] rounded-[20px] p-4 shadow-xs">
          <div
            className={`flex items-start gap-3 text-xs text-[#1A2B36]/90 font-medium ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#2E586D] shrink-0 mt-0.5" />
            <span>{ui.login.feature1}</span>
          </div>
          <div
            className={`flex items-start gap-3 text-xs text-[#1A2B36]/90 font-medium ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#2E586D] shrink-0 mt-0.5" />
            <span>{ui.login.feature2}</span>
          </div>
          <div
            className={`flex items-start gap-3 text-xs text-[#1A2B36]/90 font-medium ${
              isBn ? 'bengali-text !leading-snug' : ''
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#2E586D] shrink-0 mt-0.5" />
            <span>{ui.login.feature3}</span>
          </div>
        </div>

        {authError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[#1A2B36]/30 bg-[#D6E6EF]/65 px-4 py-3 text-xs text-[#1A2B36]"
          >
            {authError}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={signingIn}
            onClick={() => void signInWithGoogle()}
            className={`liquid-glass-dark tactile-pill w-full py-3.5 px-5 rounded-full hover:bg-[#2E586D] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-3 ${
              isBn ? 'bengali-text !leading-none' : ''
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>
              {signingIn ? ui.login.connectingGoogle : ui.login.continueGoogle}
            </span>
          </button>

          <button
            type="button"
            onClick={dismissLoginModal}
            className={`liquid-glass liquid-glass-interactive w-full py-3 px-5 rounded-full text-[#1A2B36] text-sm font-semibold ${
              isBn ? 'bengali-text !leading-none' : ''
            }`}
          >
            {ui.login.continueGuest}
          </button>
        </div>
      </div>
    </div>
  );
}
