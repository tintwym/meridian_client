import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  DollarSign,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Header from './components/Header';
import QuickMatch from './components/QuickMatch';
import CoreOfferings from './components/CoreOfferings';
import Personalization from './components/Personalization';
import Designer from './components/Designer';
import { HeroSection } from './components/landing/HeroSection';
import { PortfolioGallery } from './components/landing/PortfolioGallery';
import { ServicesCalculator } from './components/landing/ServicesCalculator';
import { BookingCalendar } from './components/landing/BookingCalendar';
import { AboutPlanner } from './components/landing/AboutPlanner';
import { TestimonialsSection } from './components/landing/TestimonialsSection';
import { FaqSection } from './components/landing/FaqSection';
import { Footer } from './components/landing/Footer';
import { LeadMagnetModal } from './components/landing/LeadMagnetModal';
import type { DesignerPrefill, EventPlanResponse } from './types';
import { submitLead } from './api';
import { savePlanBundle } from './lib/planStorage';

/** Marketing landing + product funnel for browsers. Native / ?app=1 use MobileApp. */
export default function MarketingApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFormSubmitted, setModalFormSubmitted] = useState(false);
  const [activePlan, setActivePlan] = useState<EventPlanResponse | null>(null);
  const [prefill, setPrefill] = useState<DesignerPrefill | null>(null);
  const [prefillKey, setPrefillKey] = useState(0);
  const [leadMagnetOpen, setLeadMagnetOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState('2026 High-Society Destination Guide');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: 'Santorini',
    date: '',
    budget: 'Heritage Premium ($30k - $75k)',
    vision: '',
  });

  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToSection = (sectionId: string) => {
    scrollTo(`#${sectionId}`);
  };

  const openDesigner = (next?: DesignerPrefill) => {
    if (next) {
      setPrefill(next);
      setPrefillKey((k) => k + 1);
    }
    scrollTo('#designer-section');
  };

  const openBooking = () => scrollToSection('booking');

  const openLeadMagnet = (resourceName?: string) => {
    if (resourceName) setSelectedResource(resourceName);
    setLeadMagnetOpen(true);
  };

  const openLeadModal = (plan?: EventPlanResponse | null) => {
    if (plan) {
      setActivePlan(plan);
      setFormData((prev) => ({
        ...prev,
        location: plan.location || prev.location,
        vision: prev.vision || `${plan.title} — ${plan.tagline}`,
        budget: plan.estimatedBudgetRange || prev.budget,
      }));
    }
    setIsModalOpen(true);
    setModalFormSubmitted(false);
  };

  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadMessage(null);
    try {
      const result = await submitLead({
        name: formData.name,
        email: formData.email,
        location: formData.location,
        date: formData.date,
        budget: formData.budget,
        vision: formData.vision,
        planTitle: activePlan?.title,
        planTagline: activePlan?.tagline,
      });
      setLeadMessage(result.message);
      setModalFormSubmitted(result.ok);
    } catch (err) {
      console.error(err);
      setLeadMessage('Could not submit — please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-paper text-ink antialiased selection:bg-atlantic/20 selection:text-ink">
      <Header
        onPlanClick={() => openDesigner({ eventType: 'local' })}
        onBookClick={openBooking}
      />

      <main>
        {/* Convert path first: hero → proof → book → about */}
        <HeroSection
          onOpenBooking={openBooking}
          onExplorePortfolio={() => scrollToSection('portfolio')}
        />

        <PortfolioGallery />

        <BookingCalendar />

        <AboutPlanner
          onOpenBooking={openBooking}
          onOpenLeadMagnet={() => openLeadMagnet('2026 Destination Planning Guide')}
        />

        <TestimonialsSection />

        {/* Tools after the convert path */}
        <QuickMatch onContinueToDesigner={(data) => openDesigner(data)} />

        <CoreOfferings onUseInDesigner={(data) => openDesigner(data)} />

        <Personalization />

        <Designer
          prefill={prefill}
          prefillKey={prefillKey}
          onPlanGenerated={(plan) => {
            setActivePlan(plan);
            savePlanBundle(plan, {
              eventType: 'overseas',
              guestCount: 100,
              locationName: plan.location,
              cateringStyle: 'fine_dining',
              messageStyle: 'romantic',
              targetMonth: 'September',
            });
          }}
          onRequestConsult={(plan) => openLeadModal(plan)}
        />

        <ServicesCalculator
          onSelectPackage={() => {
            openBooking();
          }}
        />

        <FaqSection onOpenBooking={openBooking} />
      </main>

      <Footer
        onOpenBooking={openBooking}
        onOpenLeadMagnet={() => openLeadMagnet('2026 High-Society Destination Guide')}
        onNavigate={scrollToSection}
      />

      <LeadMagnetModal
        isOpen={leadMagnetOpen}
        onClose={() => setLeadMagnetOpen(false)}
        defaultResource={selectedResource}
      />

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-navy/70 md:backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white max-w-lg w-full border border-navy/10 shadow-2xl relative text-left rounded-t-2xl sm:rounded-2xl max-h-[min(92dvh,40rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-linear-to-r from-sage via-sage/80 to-navy h-1.5 w-full sticky top-0 z-10" />

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-champagne text-navy transition-colors hover:bg-navy hover:text-white"
                aria-label="Close"
              >
                ×
              </button>

              <div className="p-6 sm:p-8 md:p-10">
                {!modalFormSubmitted ? (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-sage flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Curate Your Blueprint
                      </span>
                      <h3 className="font-serif text-2xl md:text-3xl font-semibold text-navy tracking-tight leading-none">
                        Plan Your Event
                      </h3>
                      <p className="text-slate text-xs leading-relaxed pt-1">
                        Share your vision. If you generated a proposal, we attach a short summary for your planner.
                      </p>
                    </div>

                    {activePlan && (
                      <div className="bg-champagne border border-navy/10 rounded-xl p-3 text-xs space-y-1">
                        <p className="font-mono text-[9px] uppercase tracking-wider text-sage">Attached proposal</p>
                        <p className="font-serif text-navy font-semibold">{activePlan.title}</p>
                        <p className="text-slate">{activePlan.estimatedBudgetRange}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full bg-champagne border border-navy/10 px-3 py-2.5 text-xs text-navy rounded-full focus:outline-none focus:ring-1 focus:ring-sage"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate">Private Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@email.com"
                          className="w-full bg-champagne border border-navy/10 px-3 py-2.5 text-xs text-navy rounded-full focus:outline-none focus:ring-1 focus:ring-sage"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Intended Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full bg-champagne border border-navy/10 px-3 py-2.5 text-xs text-navy rounded-full focus:outline-none focus:ring-1 focus:ring-sage"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-slate flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Target Month / Season
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Sept 2026"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full bg-champagne border border-navy/10 px-3 py-2.5 text-xs text-navy rounded-full focus:outline-none focus:ring-1 focus:ring-sage"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Target Budget
                      </label>
                      <input
                        type="text"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full bg-champagne border border-navy/10 px-3 py-2.5 text-xs text-navy rounded-full focus:outline-none focus:ring-1 focus:ring-sage"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate">Your Celebration Vision</label>
                      <textarea
                        rows={3}
                        value={formData.vision}
                        onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                        placeholder="Aesthetic, culinary direction, travel needs..."
                        className="w-full bg-champagne border border-navy/10 px-3 py-2 text-xs text-navy rounded-xl focus:outline-none focus:ring-1 focus:ring-sage resize-none"
                      />
                    </div>

                    {leadMessage && !modalFormSubmitted && (
                      <p className="text-xs text-rose-600 text-center">{leadMessage}</p>
                    )}

                    <button
                      type="submit"
                      disabled={leadSubmitting}
                      className="w-full bg-navy hover:bg-sage text-white font-mono text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-60"
                    >
                      <span>{leadSubmitting ? 'Submitting…' : 'Submit Intention Form'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center justify-center space-x-4 pt-3 border-t border-navy/5 text-[10px] text-slate font-mono uppercase">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-sage" /> Fully Bonded
                      </span>
                      <span>·</span>
                      <span>100% Confidential</span>
                    </div>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-6"
                  >
                    <div className="flex justify-center">
                      <CheckCircle2 className="w-16 h-16 text-sage" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-sage block">
                        Intention Logged Successfully
                      </span>
                      <h4 className="font-serif text-2xl font-bold text-navy">Thank You, {formData.name}</h4>
                      <p className="text-slate text-xs leading-relaxed max-w-sm mx-auto">
                        Your celebration blueprint at{' '}
                        <span className="font-semibold text-navy">{formData.location}</span> has been compiled. A lead
                        planner will follow up at{' '}
                        <span className="font-semibold text-navy">{formData.email}</span>.
                      </p>
                      {leadMessage && (
                        <p className="text-[10px] font-mono text-sage pt-2">{leadMessage}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="bg-navy text-white font-mono text-[10px] uppercase tracking-widest px-8 py-3 rounded-full hover:bg-sage transition-colors"
                    >
                      Return to Meridian
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
