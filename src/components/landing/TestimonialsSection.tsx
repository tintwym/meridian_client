import React from 'react';
import { TESTIMONIALS } from '../../data/servicesData';
import { MapPin } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="relative border-b border-ink/8 bg-paper py-20 text-ink md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <p className="font-app-sans text-[11px] font-semibold tracking-[0.22em] text-atlantic uppercase">
            Hosts
          </p>
          <h2 className="font-app-display text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
            What hosts say
          </h2>
          <p className="font-app-sans text-base leading-relaxed text-ink/55">
            Notes from couples and private hosts we planned with.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.id}
              className="flex flex-col justify-between border-t border-ink/12 pt-6"
              id={`testimonial-card-${t.id}`}
            >
              <p className="font-app-display text-lg leading-relaxed text-ink italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <footer className="mt-6 flex items-center gap-3 pt-4">
                <img
                  src={t.avatar}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div>
                  <cite className="not-italic font-app-sans text-sm font-semibold text-ink">
                    {t.clientName}
                  </cite>
                  <p className="font-app-sans text-xs text-ink/50">{t.eventType}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-app-sans text-[11px] text-ink/40">
                    <MapPin className="h-3 w-3 text-atlantic" />
                    <span>{t.location}</span>
                  </p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};
