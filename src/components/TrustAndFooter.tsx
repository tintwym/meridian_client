import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Testimonial } from '../types';
import { BRAND } from '../brand';
import BrandMark from './BrandMark';
export default function TrustAndFooter() {
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const testimonials: Testimonial[] = [
    {
      id: 't1',
      name: 'Clara & David Vance',
      role: 'Private Client',
      event: 'Santorini Sunset Wedding',
      location: 'Santorini, Greece',
      rating: 5,
      text: "Meridian's gastronomy curator worked absolute wonders. Orchestrating a 6-course Michelin menu tailored for diverse vegan and halal restrictions, while hosting 180 guests on a remote caldera cliffside, was spectacularly seamless. Our guests are still raving about the wine pairings.",
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 't2',
      name: 'Sophia & Marcus Sterling',
      role: 'Private Client',
      event: 'Historic Garden Gala',
      location: 'Cotswolds, United Kingdom',
      rating: 5,
      text: "Having a customized event mobile app and automated SMS logistics made our local guest arrivals a complete breeze. When the weather took an unexpected turn, Meridian triggered our contingency plan instantly. Seamless transition, exquisite execution, and zero stress.",
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 't3',
      name: 'Victoria & Alejandro de Silva',
      role: 'Elite Gala Host',
      event: '10th Year Anniversary',
      location: 'Amalfi Coast, Italy',
      rating: 5,
      text: "Elite, precise, and breathtaking. Meridian managed complex flight block reservations, custom luggage tracking, and legal registrar registry paperwork in Italy with absolute professionalism. If you seek world-class, stress-free luxury planning, Meridian is the gold standard.",
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    }
  ];

  const handleNext = () => {
    setActiveTestimonialIdx((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveTestimonialIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setIsSubscribed(true);
  };

  return (
    <footer className="relative bg-navy text-slate-300 font-sans overflow-hidden" id="testimonials">
      {/* Dynamic background blurs */}
      <div className="ambient-blur absolute top-1/4 left-10 w-[30vw] h-[30vw] bg-sage/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="ambient-blur absolute bottom-1/4 right-10 w-[25vw] h-[25vw] bg-champagne/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Testimonials Carousel Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-b border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          
          <div className="flex flex-col items-center space-y-2">
            <span className="text-[10px] font-mono text-sage uppercase tracking-[0.3em] font-semibold">Voices of Flawless Forever</span>
            <div className="flex items-center space-x-1 pt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-sage fill-sage" />
              ))}
            </div>
          </div>

          {/* Carousel Body */}
          <div className="min-h-55 flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonialIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <p className="font-serif text-lg sm:text-2xl font-light italic text-white leading-relaxed max-w-3xl mx-auto">
                  &ldquo;{testimonials[activeTestimonialIdx].text}&rdquo;
                </p>
                
                <div className="flex items-center justify-center space-x-3.5 pt-4">
                  <img
                    src={testimonials[activeTestimonialIdx].image}
                    alt={testimonials[activeTestimonialIdx].name}
                    className="w-11 h-11 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">{testimonials[activeTestimonialIdx].name}</p>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-sage" /> {testimonials[activeTestimonialIdx].event} • {testimonials[activeTestimonialIdx].location}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center space-x-6">
            <button
              onClick={handlePrev}
              className="w-10 h-10 border border-white/10 text-slate-400 hover:text-white hover:border-sage/40 rounded-full flex items-center justify-center transition-all bg-white/5 backdrop-blur-md cursor-pointer focus:outline-none"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono text-xs text-slate-500">
              0{activeTestimonialIdx + 1} / 0{testimonials.length}
            </span>
            <button
              onClick={handleNext}
              className="w-10 h-10 border border-white/10 text-slate-400 hover:text-white hover:border-sage/40 rounded-full flex items-center justify-center transition-all bg-white/5 backdrop-blur-md cursor-pointer focus:outline-none"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Footer Sitemap & Newsletter */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 text-left relative z-10">
        
        {/* Left Column: Brand Statement (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <a
            href="#"
            className="flex items-center space-x-2"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="relative flex items-center justify-center w-8 h-8 overflow-hidden rounded-full">
              <BrandMark size={32} />
            </div>
            <span className="font-serif text-lg tracking-[0.15em] font-semibold text-white">
              {BRAND.wordmark}
            </span>
          </a>
          
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
            Orchestrating highly curated, bespoke celebrations for selective clients worldwide. From local heritage retreats to breathtaking Mediterranean cliffsides, we design experiences that echo forever.
          </p>

          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-sage" />
            <span>IATA Bonded & Fully Insured Registry Partner</span>
          </div>
        </div>

        {/* Center Columns: Navigation Sitemaps (col-span-4) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-widest text-white">
              Planning Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-sans">
              <li>
                <a href="#local-events" className="hover:text-sage transition-colors">Local Luxury Estates</a>
              </li>
              <li>
                <a href="#overseas-weddings" className="hover:text-sage transition-colors">Overseas Celebrations</a>
              </li>
              <li>
                <a href="#personalized" className="hover:text-sage transition-colors">Bespoke Gastronomy</a>
              </li>
              <li>
                <a href="#personalized" className="hover:text-sage transition-colors">RSVP Digital Suite</a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-widest text-white">
              Global Curations
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-sans">
              <li>Santorini, Greece</li>
              <li>Amalfi Coast, Italy</li>
              <li>Bali, Indonesia</li>
              <li>Kyoto, Japan</li>
              <li>Maui, Hawaii</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Newsletter Subscription (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-widest text-white">
              Get Seasonal Planning Guides
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Subscribe to receive our private lookbooks, seasonal weather analysis calendars, and curated culinary profiles.
            </p>
          </div>

          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="flex border-b border-white/10 pb-2.5 items-center">
              <Mail className="w-4 h-4 text-slate-500 mr-2.5 shrink-0" />
              <input
                type="email"
                required
                placeholder="Enter your private email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-none"
              />
              <button
                type="submit"
                className="text-[10px] font-mono uppercase tracking-widest text-sage hover:text-[#c4ccab] ml-2 font-bold focus:outline-none cursor-pointer"
              >
                Join
              </button>
            </form>
          ) : (
            <div className="glass-panel-dark border-sage/20 p-4 rounded-2xl flex items-start gap-2.5 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-sage shrink-0" />
              <div className="space-y-0.5 text-left">
                <p className="text-xs font-semibold text-white">Lookbooks Dispatched</p>
                <p className="text-[10px] text-slate-400">Check your inbox at {newsletterEmail} for your planning catalog.</p>
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-500 font-mono">
            {`Direct Line: ${BRAND.phone} · ${BRAND.email.concierge}`}
          </div>
        </div>

      </div>

      {/* Sub-footer Rights & Legalities */}
      <div className="bg-[#0B0F19] py-6 text-slate-500 text-[10px] font-mono uppercase tracking-widest px-6 md:px-12 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} {BRAND.legalName}. All Rights Reserved.</span>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-sage transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-sage transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-sage transition-colors">Consular Registry Fees</a>
          </div>
        </div>
      </div>

    </footer>
  );
}
