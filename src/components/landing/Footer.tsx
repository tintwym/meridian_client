import React, { useState } from 'react';
import { Phone, Mail, MapPin, ArrowRight, Check } from 'lucide-react';
import { BRAND } from '../../brand';
import { submitLead } from '../../api';
import BrandMark from '../BrandMark';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenLeadMagnet: () => void;
  onNavigate: (sectionId: string) => void;
}

export function Footer({ onOpenBooking, onOpenLeadMagnet, onNavigate }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribing(true);
    try {
      await submitLead({
        name: 'Newsletter',
        email: newsletterEmail,
        vision: 'Footer newsletter — Meridian Atelier Compendium',
      });
      setSubscribed(true);
    } catch {
      setSubscribed(true);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer id="footer" className="border-t border-paper/10 bg-ink pt-16 pb-10 text-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 border-b border-paper/10 pb-12 md:grid-cols-12">
          <div className="space-y-4 md:col-span-5">
            <div className="flex items-center gap-2">
              <BrandMark size={32} />
              <span className="font-app-display text-lg font-semibold tracking-[0.14em] text-paper">
                {BRAND.wordmark}
              </span>
            </div>

            <p className="max-w-sm font-app-sans text-sm leading-relaxed text-paper/60">
              {BRAND.tagline} Singapore and destination weddings, planned end to end.
            </p>

            <div className="space-y-2 pt-1 font-app-sans text-xs text-paper/55">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-atlantic" />
                <span>{BRAND.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-atlantic" />
                <span>{BRAND.email.concierge}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-atlantic" />
                <span>Singapore · Destination</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenLeadMagnet}
              className="cursor-pointer font-app-sans text-xs text-paper/50 transition-colors hover:text-paper"
            >
              Download planning guide
            </button>
          </div>

          <div className="space-y-3 md:col-span-3">
            <h4 className="font-app-sans text-[11px] font-semibold tracking-[0.2em] text-paper/40 uppercase">
              Navigate
            </h4>
            <ul className="space-y-2 font-app-sans text-sm text-paper/65">
              {[
                ['portfolio', 'Portfolio'],
                ['booking', 'Book a call'],
                ['about-planner', 'The atelier'],
                ['designer-section', 'Event designer'],
                ['faq', 'FAQ'],
              ].map(([id, label]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(id)}
                    className="cursor-pointer transition-colors hover:text-paper"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 md:col-span-4">
            <h4 className="font-app-sans text-[11px] font-semibold tracking-[0.2em] text-paper/40 uppercase">
              Notes
            </h4>
            <p className="font-app-sans text-sm leading-relaxed text-paper/55">
              Venue shortlists and planning notes, occasionally.
            </p>

            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex items-center rounded-xl border border-paper/15 bg-paper/5 p-1.5 focus-within:border-atlantic">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-transparent px-3 font-app-sans text-sm text-paper placeholder:text-paper/35 focus:outline-none"
                    id="footer-newsletter-email"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="cursor-pointer rounded-lg bg-paper p-2 text-ink transition-colors hover:bg-atlantic hover:text-paper disabled:opacity-50"
                    id="footer-newsletter-btn"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2 font-app-sans text-sm text-atlantic">
                <Check className="h-4 w-4" />
                <span>You&apos;re on the list.</span>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenBooking}
              className="cursor-pointer font-app-sans text-sm font-semibold text-paper underline-offset-4 hover:underline"
            >
              Book a strategy call
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 font-app-sans text-[11px] text-paper/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
