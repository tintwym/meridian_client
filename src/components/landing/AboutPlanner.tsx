import React from 'react';
import { ArrowRight } from 'lucide-react';
import diningImg from '../../assets/images/dining_hall_1784103456507.jpg';
import { imageSrc } from '../../lib/imageSrc';

interface AboutPlannerProps {
  onOpenBooking: () => void;
  onOpenLeadMagnet: () => void;
}

export const AboutPlanner: React.FC<AboutPlannerProps> = ({ onOpenBooking, onOpenLeadMagnet }) => {
  return (
    <section
      id="about-planner"
      className="relative border-t border-ink/8 bg-paper py-20 text-ink md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="relative aspect-3/4 overflow-hidden bg-ink/5">
              <img
                src={imageSrc(diningImg)}
                alt="Meridian Atelier celebration setting"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <p className="font-app-sans text-[11px] font-semibold tracking-[0.22em] text-atlantic uppercase">
              The atelier
            </p>
            <h2 className="font-app-display text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
              Planned with care — near or far
            </h2>
            <p className="max-w-xl font-app-sans text-base leading-relaxed text-ink/60">
              Meridian Atelier plans Singapore celebrations and destination weddings end to end:
              venue shortlists, guest invites and RSVPs, stays, and day-of logistics — so hosts stay
              present for the moment that matters.
            </p>
            <ul className="space-y-2 font-app-sans text-sm text-ink/70">
              <li>Local venues and destination sites, curated for your guest count</li>
              <li>Invite links, RSVP tracking, and guest messaging in Club</li>
              <li>One strategy call to map timeline, budget, and next steps</li>
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenBooking}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-ink px-5 py-3 font-app-sans text-sm font-semibold text-paper transition-colors hover:bg-atlantic"
                id="about-planner-book-btn"
              >
                Book a strategy call
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onOpenLeadMagnet}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink/15 px-5 py-3 font-app-sans text-sm font-medium text-ink transition-colors hover:border-atlantic hover:text-atlantic"
                id="about-planner-guide-btn"
              >
                Get the planning guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
