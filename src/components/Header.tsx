import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { BRAND } from '../brand';
import BrandMark from './BrandMark';

interface HeaderProps {
  onPlanClick: () => void;
  onBookClick: () => void;
  /** True while marketing hero (dark full-bleed) is under the nav. */
  overHero?: boolean;
}

export default function Header({ onPlanClick, onBookClick, overHero = true }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  const onDark = overHero && !isScrolled;
  const navLinks = [
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Plan', href: '#designer-section' },
    { name: 'Booking', href: '#booking' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <header
        id="nav-header"
        className={`fixed top-0 right-0 left-0 z-50 transition-[background-color,box-shadow,border-color,padding] duration-300 ${
          isScrolled
            ? 'border-b border-ink/8 bg-paper/95 py-3 shadow-[0_8px_24px_-12px_rgba(18,21,26,0.12)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent py-5'
        }`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:px-12">
          <a
            href="#"
            className="group flex items-center space-x-2"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-opacity duration-300 group-hover:opacity-90">
              <BrandMark size={36} />
            </div>
            <span
              className={`font-app-display text-lg font-semibold tracking-[0.14em] transition-colors duration-300 sm:text-xl sm:tracking-[0.18em] ${
                onDark ? 'text-paper' : 'text-ink'
              }`}
            >
              {BRAND.wordmark}
            </span>
          </a>

          <nav className="hidden items-center space-x-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`relative py-1 font-app-sans text-xs font-medium tracking-widest uppercase transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:content-[''] hover:after:w-full ${
                  onDark
                    ? 'text-paper/70 after:bg-paper hover:text-paper'
                    : 'text-ink/60 after:bg-ink hover:text-ink'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              id="cta-plan-event"
              onClick={onPlanClick}
              className={`cursor-pointer rounded-xl px-5 py-2.5 font-app-sans text-xs font-semibold tracking-wide transition-colors duration-300 active:scale-[0.98] ${
                onDark
                  ? 'text-paper/80 hover:text-paper'
                  : 'text-ink/70 hover:text-ink'
              }`}
            >
              Start a plan
            </button>
            <button
              type="button"
              id="cta-book-call"
              onClick={onBookClick}
              className={`cursor-pointer rounded-xl px-5 py-2.5 font-app-sans text-xs font-semibold tracking-wide transition-colors duration-300 active:scale-[0.98] ${
                onDark
                  ? 'bg-paper text-ink hover:bg-atlantic hover:text-paper'
                  : 'bg-ink text-paper hover:bg-atlantic'
              }`}
            >
              Book a call
            </button>
          </div>

          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 transition-colors md:hidden ${
              onDark ? 'text-paper hover:text-paper/80' : 'text-ink hover:text-atlantic'
            }`}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink/50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 z-40 flex max-h-[min(70dvh,28rem)] flex-col overflow-y-auto rounded-2xl border border-ink/10 bg-paper p-5 shadow-2xl sm:inset-x-4 sm:p-6 md:hidden"
              style={{ top: 'max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))' }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="border-b border-ink/8 pb-3 font-app-display text-xl text-ink hover:text-atlantic"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  id="mobile-cta-book"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onBookClick();
                  }}
                  className="w-full rounded-xl bg-ink py-3.5 text-center font-app-sans text-sm font-semibold text-paper transition-colors hover:bg-atlantic"
                >
                  Book a strategy call
                </button>
                <button
                  type="button"
                  id="mobile-cta-plan"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onPlanClick();
                  }}
                  className="w-full rounded-xl border border-ink/15 py-3.5 text-center font-app-sans text-sm font-medium text-ink transition-colors hover:border-atlantic hover:text-atlantic"
                >
                  Start a plan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
