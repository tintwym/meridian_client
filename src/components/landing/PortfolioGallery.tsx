import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PORTFOLIO_ITEMS } from '../../data/portfolioData';
import { PortfolioItem, EventCategory } from '../../landingTypes';
import { MapPin, Users, Calendar, X, ChevronRight, ChevronLeft, ArrowRight, Quote, Heart } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

export const PortfolioGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const categories: EventCategory[] = ['All', 'Weddings', 'Corporate', 'Private Soirées', 'Destination'];

  const filteredItems = selectedCategory === 'All'
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter(item => item.category === selectedCategory);

  const openLightbox = (item: PortfolioItem) => {
    setActiveItem(item);
    setActiveImageIndex(0);
  };

  const closeLightbox = () => {
    setActiveItem(null);
  };

  const nextImage = () => {
    if (!activeItem) return;
    setActiveImageIndex((prev) => (prev + 1) % activeItem.galleryImages.length);
  };

  const prevImage = () => {
    if (!activeItem) return;
    setActiveImageIndex((prev) => (prev - 1 + activeItem.galleryImages.length) % activeItem.galleryImages.length);
  };

  return (
    <section id="portfolio" className="border-b border-ink/8 bg-paper py-20 text-ink md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <p className="font-app-sans text-[11px] font-semibold tracking-[0.22em] text-atlantic uppercase">
            Portfolio
          </p>
          <h2 className="font-app-display text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
            Recent celebrations
          </h2>
          <p className="font-app-sans text-base leading-relaxed text-ink/55">
            Weddings and private gatherings across Singapore and destination venues.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`cursor-pointer rounded-xl px-4 py-2 font-app-sans text-xs font-medium tracking-wide transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  selectedCategory === cat
                    ? 'bg-ink text-paper'
                    : 'border border-ink/12 text-ink/60 hover:border-atlantic hover:text-atlantic'
                }`}
                id={`portfolio-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.04, ease }}
              onClick={() => openLightbox(item)}
              className="group bg-champagne rounded-tl-[48px] rounded-br-[20px] rounded-tr-xl rounded-bl-xl border border-navy/10 hover:border-sage overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between"
              id={`portfolio-card-${item.id}`}
            >
              <div>
                {/* Image Frame */}
                <div className="relative aspect-4/3 overflow-hidden bg-navy/5">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-navy/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Category Pill */}
                  <span className="absolute top-4 right-4 bg-navy/85 md:backdrop-blur-md text-champagne text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                    {item.category}
                  </span>

                  {/* Location Tag */}
                  <div className="absolute bottom-3 left-4 text-champagne flex items-center gap-1.5 text-xs font-light">
                    <MapPin className="w-3.5 h-3.5 text-sage" />
                    <span>{item.location}</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-serif font-medium text-navy group-hover:text-sage transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate font-light leading-relaxed line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="px-6 pb-6 pt-2 border-t border-navy/10 flex items-center justify-between text-xs text-slate/70 font-mono">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sage" />
                  <span>{item.guestCount} Guests</span>
                </div>
                <div className="flex items-center gap-1 text-sage font-semibold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                  <span>View Event</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </motion.div>
          ))}
          </AnimatePresence>
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy/80 md:backdrop-blur-md overflow-y-auto animate-fade-in">
          
          <div className="bg-champagne border border-navy/10 rounded-4xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8">
            
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-navy text-champagne hover:bg-sage transition-colors cursor-pointer"
              aria-label="Close modal"
              id="portfolio-lightbox-close-btn"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Slideshow Image Area */}
            <div className="relative aspect-video bg-navy overflow-hidden">
              <img
                src={activeItem.galleryImages[activeImageIndex]}
                alt={activeItem.title}
                className="w-full h-full object-cover transition-all duration-500"
              />

              {/* Prev / Next Controls */}
              {activeItem.galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-navy/70 text-champagne hover:bg-navy transition-colors cursor-pointer"
                    id="lightbox-prev-btn"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-navy/70 text-champagne hover:bg-navy transition-colors cursor-pointer"
                    id="lightbox-next-btn"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-navy/80 px-3 py-1 rounded-full text-[11px] text-champagne font-mono">
                    {activeImageIndex + 1} / {activeItem.galleryImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Lightbox Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full bg-champagne border border-navy/10 text-[10px] font-mono uppercase tracking-widest text-sage">
                      {activeItem.category}
                    </span>
                    <span className="text-xs text-slate/70 font-mono">{activeItem.year}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif text-navy font-medium">
                    {activeItem.title}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate font-mono shrink-0">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-sage" />
                    <span>{activeItem.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-sage" />
                    <span>{activeItem.guestCount} Guests</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate leading-relaxed font-light text-sm sm:text-base">
                {activeItem.description}
              </p>

              {/* Theme Swatches */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate/70">Curated Color Palette:</h4>
                <div className="flex items-center gap-3">
                  {activeItem.themePalette.map((hex, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full border border-navy/10 shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-[10px] font-mono text-slate/70 hidden sm:inline">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-champagne p-5 rounded-2xl border border-navy/10 space-y-2">
                  <h4 className="font-serif font-semibold text-sm text-navy">Production Highlights</h4>
                  <ul className="space-y-1.5 text-xs text-slate font-light">
                    {activeItem.keyHighlights.map((hl, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-champagne p-5 rounded-2xl border border-navy/10 space-y-2">
                  <h4 className="font-serif font-semibold text-sm text-navy">Vendor Partners</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeItem.vendorPartners.map((v, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-champagne text-[11px] text-navy border border-navy/10">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Testimonial Quote */}
              {activeItem.testimonial && (
                <div className="p-5 rounded-2xl bg-navy text-champagne border border-white/10 space-y-2">
                  <Quote className="w-5 h-5 text-sage" />
                  <p className="font-serif italic text-sm text-champagne/70">
                    "{activeItem.testimonial.quote}"
                  </p>
                  <div className="text-xs text-sage font-mono pt-1">
                    — {activeItem.testimonial.author}, {activeItem.testimonial.role}
                  </div>
                </div>
              )}

              {/* Lightbox Direct CTA */}
              <div className="pt-4 flex items-center justify-between border-t border-navy/10">
                <span className="text-xs text-slate/70 font-light">Inspired by this celebration concept?</span>
                <a
                  href="#booking"
                  onClick={() => {
                    closeLightbox();
                    const el = document.getElementById('booking');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-full bg-navy text-champagne hover:bg-sage text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  id="lightbox-book-similar-btn"
                >
                  <span>Book Similar Concept</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>

          </div>

        </div>
      )}

    </section>
  );
};
