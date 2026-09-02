import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BRAND } from '../../brand';
import heroImg from '../../assets/images/overseas_cliffside_wedding_1784113736506.jpg';
import { imageSrc } from '../../lib/imageSrc';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onExplorePortfolio: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Marketing first viewport — mirrors App Home: full-bleed photo,
 * brand as hero type, one line, one CTA group. No badges/stats/press.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onExplorePortfolio,
}) => {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink text-paper"
    >
      <img
        src={imageSrc(heroImg)}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center motion-safe:transition-transform motion-safe:duration-[1.4s] motion-safe:ease-out motion-safe:scale-100"
        width={1600}
        height={1000}
        decoding="async"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/55 to-ink/20" />
      <div className="absolute inset-0 bg-linear-to-r from-ink/40 via-transparent to-transparent" />

      <div
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-16 sm:px-6 sm:pb-20 md:px-12 lg:px-8"
        style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom))' }}
      >
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="font-app-sans text-[11px] font-semibold tracking-[0.28em] text-paper/55 uppercase"
        >
          Event planning
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease }}
          className="font-app-display text-[3.25rem] leading-[0.95] tracking-tight text-paper sm:text-6xl md:text-7xl"
        >
          {BRAND.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease }}
          className="max-w-md font-app-sans text-base leading-relaxed text-paper/80 sm:text-[17px]"
        >
          Singapore and destination weddings, planned end to end — venues, guests, and day-of
          logistics in one atelier.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease }}
          className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <button
            type="button"
            id="hero-primary-book-btn"
            onClick={onOpenBooking}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-paper px-6 font-app-sans text-sm font-semibold text-ink transition-colors duration-300 hover:bg-atlantic hover:text-paper sm:w-auto"
          >
            Book a strategy call
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="hero-view-gallery-btn"
            onClick={onExplorePortfolio}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-paper/25 bg-transparent px-6 font-app-sans text-sm font-medium text-paper/90 transition-colors duration-300 hover:border-paper/50 hover:bg-paper/10 sm:w-auto"
          >
            View past work
          </button>
        </motion.div>
      </div>
    </section>
  );
};
