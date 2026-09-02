import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'Investment' | 'Logistics' | 'Vendors' | 'General';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Investment',
    question: 'What is your typical investment minimum for full-service event planning?',
    answer:
      'Full-service design & planning starts at $8,500. We typically work with overall event budgets from $50,000 to $500,000+. Month-of coordination and smaller gatherings begin at $3,800.',
  },
  {
    id: 'faq-2',
    category: 'Logistics',
    question: 'How far in advance should we reserve our event date?',
    answer:
      'For destination weddings and multi-day events, lock in 9–14 months ahead. For local celebrations, 4–8 months is usually enough. We take a limited number of events per month.',
  },
  {
    id: 'faq-3',
    category: 'Logistics',
    question: 'Do you plan destination weddings as well as Singapore events?',
    answer:
      'Yes. We plan Singapore celebrations and destination weddings end to end — venues, guest logistics, stays, and day-of coordination.',
  },
  {
    id: 'faq-4',
    category: 'Vendors',
    question: 'How does vendor selection work? Do you take commissions?',
    answer:
      'We do not take vendor kickbacks. Recommendations are based on fit and reliability; negotiated savings pass through to you.',
  },
  {
    id: 'faq-5',
    category: 'Logistics',
    question: 'What if weather threatens an outdoor plan?',
    answer:
      'Every outdoor plan includes a weather backup from day one — tenting holds or interior alternatives so the day stays intact.',
  },
  {
    id: 'faq-6',
    category: 'Investment',
    question: 'What is the deposit to secure a date?',
    answer:
      'A 30% deposit on signing reserves your date. The balance is scheduled in installments, with final payment due 30 days before the event.',
  },
];

interface FaqSectionProps {
  onOpenBooking: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onOpenBooking }) => {
  const [openId, setOpenId] = useState<string>('faq-1');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Investment', 'Logistics', 'Vendors'];

  const filteredFaqs =
    activeCategory === 'All'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? '' : id);
  };

  return (
    <section id="faq" className="relative border-t border-ink/8 bg-paper py-20 text-ink md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <p className="font-app-sans text-[11px] font-semibold tracking-[0.22em] text-atlantic uppercase">
            FAQ
          </p>
          <h2 className="font-app-display text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
            Common questions
          </h2>
          <p className="font-app-sans text-base leading-relaxed text-ink/55">
            Investment, timeline, and how we work with venues and vendors.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer rounded-xl px-4 py-2 font-app-sans text-xs font-medium tracking-wide transition-colors duration-200 ${
                  activeCategory === cat
                    ? 'bg-ink text-paper'
                    : 'border border-ink/12 text-ink/60 hover:border-atlantic hover:text-atlantic'
                }`}
                id={`faq-cat-btn-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id}>
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left focus:outline-none"
                  aria-expanded={isOpen}
                  id={`faq-item-toggle-${faq.id}`}
                >
                  <span className="font-app-display text-lg leading-snug text-ink sm:text-xl">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-atlantic transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pb-5 font-app-sans text-sm leading-relaxed text-ink/60 sm:text-base">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink/8 pt-8 sm:flex-row sm:items-center">
          <div>
            <h4 className="font-app-display text-lg text-ink">Still deciding?</h4>
            <p className="mt-1 font-app-sans text-sm text-ink/55">
              Book a short call — we&apos;ll map next steps for your date and place.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenBooking}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-ink px-5 py-3 font-app-sans text-sm font-semibold text-paper transition-colors hover:bg-atlantic"
            id="faq-ask-question-btn"
          >
            Book a strategy call
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
