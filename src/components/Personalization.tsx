import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Smartphone, Wine } from 'lucide-react';
import { Dish } from '../types';

export default function Personalization() {
  const [dietaryProfile, setDietaryProfile] = useState<'Standard' | 'Vegan' | 'Halal' | 'Gluten-Free'>('Standard');
  const [courseFilter, setCourseFilter] = useState<'Appetizer' | 'Entree' | 'Dessert'>('Appetizer');

  const chefDishes: Record<'Standard' | 'Vegan' | 'Halal' | 'Gluten-Free', Dish[]> = {
    Standard: [
      {
        category: 'Appetizer',
        name: 'Crispy Seared Hokkaido Scallops',
        pairing: 'Perrier-Jouët Grand Brut Champagne',
        description:
          'Placed over a smooth parsnip velvet cream, dusted with house-dehydrated Iberico pancetta crumbs, and finished with a micro-herb citrus infusion.',
      },
      {
        category: 'Entree',
        name: 'Slow-Braised Prime Wagyu Ribeye',
        pairing: 'Château Margaux Cabernet Sauvignon 2018',
        description:
          '24-hour slow braised wagyu steak finished with a dark Périgord truffle bordelaise glaze, organic fire-roasted root vegetables, and creamed potato souffle.',
      },
      {
        category: 'Dessert',
        name: 'Salted Caramel Sugar Dome Valrhona',
        pairing: 'Sauternes Chateau d’Yquem Golden Muscat',
        description:
          'A delicate hand-blown sugar glass globe covering premium dark Valrhona chocolate mousse, salted sea salt honeycomb, and edible gold flakes.',
      },
    ],
    Vegan: [
      {
        category: 'Appetizer',
        name: 'Glazed Heirloom Beetroot Carpaccio',
        pairing: 'Laurent-Perrier Brut Nature Champagne (Vegan)',
        description:
          'Razor-thin slices of golden and ruby beetroots, citrus hazelnut vinaigrette, vegan cashew cream cheese, and a garnish of mustard micro-greens.',
      },
      {
        category: 'Entree',
        name: 'Seared King Oyster Mushroom Scallops',
        pairing: 'Pouilly-Fuissé Chardonnay (Biodynamic Vegan)',
        description:
          'Pan-caramelized oyster mushroom rounds positioned on a rich white asparagus pureé, surrounded by shaved black truffles and organic wild ramps.',
      },
      {
        category: 'Dessert',
        name: 'Meyer Lemon & Madagascar Vanilla Tart',
        pairing: 'Late Harvest Riesling (Organic Vegan)',
        description:
          'Silky pressed macadamia nut crust topped with an airy cold-whipped lemon curd, garnished with frozen raspberry caviar and wild garden pansies.',
      },
    ],
    Halal: [
      {
        category: 'Appetizer',
        name: 'Smoked Oakwood King Salmon Tartare',
        pairing: 'Wild Cranberry & Ginger Infused Non-Alcoholic Cuvée',
        description:
          'Sashimi-grade ocean-caught salmon tossed gently in fresh lemon zest, organic cold-pressed olive oil, and topped with Persian black seaweed pearls.',
      },
      {
        category: 'Entree',
        name: 'Charcoal-Grilled Premium New Zealand Lamb Loin',
        pairing: 'Aged Black Currant & Oak Bark Non-Alcoholic Extract',
        description:
          'Succulent Halal-certified lamb loin encrusted in premium Mediterranean herbs, served with smoked saffron risotto and sweet mint honey emulsion.',
      },
      {
        category: 'Dessert',
        name: 'Rosewater Panna Cotta with Saffron Sugar Floss',
        pairing: 'Non-Alcoholic Sparkling Muscat',
        description:
          'Silken rosewater cream set over pistachio crumb, crowned with spun saffron sugar and candied rose petals.',
      },
    ],
    'Gluten-Free': [
      {
        category: 'Appetizer',
        name: 'Hickory Duck & Blackberry Salad',
        pairing: 'Pinot Noir Rosé (Gluten-Free)',
        description:
          'Thin hickory-smoked tender duck breast strips, wild organic blackberries, toasted walnuts, and a certified gluten-free aged balsamic reduction.',
      },
      {
        category: 'Entree',
        name: 'Oven-Roasted Atlantic Seabass',
        pairing: 'Chablis Grand Cru Chardonnay (Gluten-Free)',
        description:
          'Line-caught seabass fillet over a rich saffron and lobster cream reduction, paired with steamed baby leeks and lemon-herb braised marble potatoes.',
      },
      {
        category: 'Dessert',
        name: 'Flourless Dark Chocolate Lava Gateau',
        pairing: 'Sandeman 20-Year-Old Tawny Port',
        description:
          'An exquisitely decadent hot-centered dark chocolate cake made purely from almond flour, served with organic vanilla bean gelato and dark cherries.',
      },
    ],
  };

  const activeDish =
    chefDishes[dietaryProfile].find((d) => d.category === courseFilter) ||
    chefDishes[dietaryProfile][0];

  return (
    <section
      className="relative bg-champagne py-24 px-6 md:px-12 border-b border-navy/5 text-left overflow-hidden"
      id="personalized"
    >
      <div className="ambient-blur absolute top-1/4 left-1/3 w-[25vw] h-[25vw] bg-sage/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="ambient-blur absolute bottom-1/4 right-1/3 w-[30vw] h-[30vw] bg-[#EADCC9]/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center space-x-2">
          <ChefHat className="w-5 h-5 text-sage" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate">
            Gastronomy Design
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl font-medium text-navy tracking-tight">
          Curated Gastronomy
        </h2>
        <p className="text-slate text-sm leading-relaxed max-w-lg">
          Toggle dietary profiles to preview how we match preferences with elite wine and beverage
          pairings.
        </p>

        <div className="flex items-start gap-2 rounded-2xl border border-navy/10 bg-white/50 px-4 py-3 text-slate">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
          <p className="text-xs leading-relaxed">
            <span className="font-medium text-navy">Guest messaging</span> (invites, RSVP, SMS,
            push) lives in the Meridian iOS &amp; Android app — Club → Guests, after Deposit.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-slate mb-2">
              Dietary Protocol
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['Standard', 'Vegan', 'Halal', 'Gluten-Free'] as const).map((profile) => (
                <button
                  key={profile}
                  type="button"
                  onClick={() => setDietaryProfile(profile)}
                  className={`px-3 py-2 text-[10px] font-mono uppercase border rounded-full transition-all duration-300 cursor-pointer ${
                    dietaryProfile === profile
                      ? 'bg-navy border-navy text-white shadow-sm'
                      : 'bg-white/40 border-navy/10 text-slate hover:bg-white/70'
                  }`}
                >
                  {profile === 'Standard' ? 'Signature Menu' : profile}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider text-slate mb-2">
              Selected Course
            </p>
            <div className="flex gap-1.5">
              {(['Appetizer', 'Entree', 'Dessert'] as const).map((course) => (
                <button
                  key={course}
                  type="button"
                  onClick={() => setCourseFilter(course)}
                  className={`flex-1 px-2.5 py-2 text-[10px] font-mono uppercase border rounded-full transition-all duration-300 cursor-pointer ${
                    courseFilter === course
                      ? 'bg-navy border-navy text-white font-semibold shadow-sm'
                      : 'bg-white/40 border-navy/10 text-slate hover:bg-white/70'
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative glass-panel border-white/50 p-5 sm:p-8 md:p-10 shadow-[0_12px_40px_rgba(143,151,121,0.12)] rounded-3xl mt-6">
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-sage/40" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-sage/40" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-sage/40" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-sage/40" />

          <div className="text-center space-y-6">
            <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-sage block">
              Meridian Grand Dining Suite
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${dietaryProfile}-${courseFilter}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-navy tracking-tight leading-tight">
                  {activeDish.name}
                </h3>

                <p className="text-slate text-xs md:text-sm font-sans italic max-w-md mx-auto leading-relaxed">
                  &ldquo;{activeDish.description}&rdquo;
                </p>

                <div className="pt-4 border-t border-navy/5 max-w-xs mx-auto flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center space-x-1 text-[9px] font-mono uppercase tracking-[0.2em] text-sage">
                    <Wine className="w-3.5 h-3.5" />
                    <span>Curated Beverage Sommelier Pairing</span>
                  </div>
                  <p className="text-navy text-xs font-semibold tracking-wide">{activeDish.pairing}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <span className="text-[9px] font-mono uppercase tracking-widest text-slate/50 block border-t border-dashed border-navy/5 pt-4">
              Full Allergy, Vegan &amp; Halal Trackers Included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
