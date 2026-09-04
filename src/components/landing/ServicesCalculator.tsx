import React, { useState } from 'react';
import { SERVICE_PACKAGES } from '../../data/servicesData';
import { Check, Sparkles, ArrowRight, Calculator } from 'lucide-react';

interface ServicesCalculatorProps {
  onSelectPackage: (packageName: string) => void;
}

export const ServicesCalculator: React.FC<ServicesCalculatorProps> = ({ onSelectPackage }) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('full-service');
  const [guestCount, setGuestCount] = useState<number>(180);
  const [addOns, setAddOns] = useState<{ [key: string]: boolean }>({
    welcomeSoiree: true,
    floralMonoliths: true,
    cad3dBlueprint: false,
    vipConcierge: true
  });

  const toggleAddOn = (key: string) => {
    setAddOns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamic Investment Calculation
  const pkg = SERVICE_PACKAGES.find(p => p.id === selectedPackage) || SERVICE_PACKAGES[0];
  const basePrice = pkg.startingPrice;
  const guestMultiplier = Math.max(0, (guestCount - 100) * 22);
  
  let addOnsTotal = 0;
  if (addOns.welcomeSoiree) addOnsTotal += 3200;
  if (addOns.floralMonoliths) addOnsTotal += 2800;
  if (addOns.cad3dBlueprint) addOnsTotal += 1500;
  if (addOns.vipConcierge) addOnsTotal += 2200;

  const estimatedTotal = basePrice + guestMultiplier + addOnsTotal;

  const handleBookSelected = () => {
    onSelectPackage(pkg.name);
    const bookingElem = document.getElementById('booking');
    if (bookingElem) {
      bookingElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-24 bg-paper text-ink border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-white border border-ink/10 text-xs font-app-sans uppercase tracking-[0.25em] text-atlantic">
            <Sparkles className="w-3.5 h-3.5 text-atlantic" />
            <span>Service Packages & Investment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-app-display font-light text-ink tracking-tight">
            Transparent Bespoke Offerings
          </h2>
          <p className="text-ink/55 text-base font-light">
            Every celebration is individually tailored. Select a core package and customize scope parameters below to estimate your investment.
          </p>
        </div>

        {/* Service Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {SERVICE_PACKAGES.map((p) => {
            const isSelected = selectedPackage === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPackage(p.id)}
                className={`rounded-[28px] p-6 border transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-ink text-paper border-atlantic shadow-xl scale-[1.02]'
                    : 'bg-white text-ink border-ink/10 hover:border-atlantic/50 hover:bg-ink/5'
                }`}
                id={`service-pkg-card-${p.id}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 min-h-[22px]">
                    {p.popular ? (
                      <span className="inline-block text-[9px] font-app-sans uppercase tracking-widest px-2.5 py-1 rounded-full bg-atlantic text-paper whitespace-nowrap shadow-sm">
                        Most Popular
                      </span>
                    ) : (
                      <div className="h-[22px]" />
                    )}
                  </div>

                  <h3 className={`font-app-display text-xl font-medium mb-2 ${isSelected ? 'text-paper' : 'text-ink'}`}>
                    {p.name}
                  </h3>
                  <p className={`text-xs font-light mb-4 line-clamp-2 ${isSelected ? 'text-paper/70' : 'text-ink/55'}`}>
                    {p.tagline}
                  </p>

                  <div className="mb-6 pt-3 border-t border-current/10">
                    <span className="text-2xl font-app-display font-semibold">
                      ${p.startingPrice.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-app-sans uppercase tracking-wider block ${isSelected ? 'text-atlantic' : 'text-atlantic'}`}>
                      Starting Planning Fee
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6 text-xs font-light">
                    {p.features.slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-atlantic' : 'text-atlantic'}`} />
                        <span className={isSelected ? 'text-paper/70' : 'text-ink/55'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-xs uppercase tracking-widest font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-atlantic text-paper hover:bg-paper hover:text-ink'
                      : 'bg-paper text-ink border border-ink/10 hover:border-atlantic'
                  }`}
                  id={`select-service-btn-${p.id}`}
                >
                  {isSelected ? 'Active Selection' : 'Select Scope'}
                </button>

              </div>
            );
          })}
        </div>

        {/* Interactive Scope & Investment Calculator Panel */}
        <div className="bg-white rounded-[36px] border border-ink/10 p-8 sm:p-12 shadow-lg">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-ink/10 pb-8 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atlantic font-app-sans mb-1">
                <Calculator className="w-4 h-4" />
                <span>Interactive Investment Estimator</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-app-display font-light text-ink">
                Customize Event Parameters
              </h3>
            </div>

            <div className="bg-paper px-6 py-4 rounded-2xl border border-ink/10 flex items-center gap-4">
              <div>
                <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase block">
                  Estimated Planning Investment Range:
                </span>
                <span className="text-2xl sm:text-3xl font-app-display font-semibold text-ink">
                  ${estimatedTotal.toLocaleString()} - ${(estimatedTotal * 1.25).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Guest Count Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-app-sans">
                  <span className="uppercase text-ink/50 tracking-[0.16em]">Estimated Guest Count:</span>
                  <span className="font-semibold text-sm text-ink px-3 py-1 bg-paper rounded-xl border border-ink/10">
                    {guestCount} Guests
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[var(--color-atlantic)]"
                  id="calculator-guest-slider"
                />
                <div className="flex justify-between text-[10px] text-ink/45 font-app-sans">
                  <span>30 Intimate</span>
                  <span>200 Gala</span>
                  <span>500+ Grand Event</span>
                </div>
              </div>

              {/* Add-Ons Checklist */}
              <div className="space-y-3">
                <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase block">
                  Additional Curation & Logistics Add-Ons:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'welcomeSoiree', label: 'Welcome Cocktail & Rehearsal Dinner', price: '+$3,200' },
                    { key: 'floralMonoliths', label: 'Bespoke Floral Monoliths & Spatial Styling', price: '+$2,800' },
                    { key: 'cad3dBlueprint', label: 'Interactive 3D CAD Venue Blueprints', price: '+$1,500' },
                    { key: 'vipConcierge', label: 'VIP Guest Travel & Accommodation Concierge', price: '+$2,200' }
                  ].map((item) => {
                    const isChecked = addOns[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleAddOn(item.key)}
                        className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-white text-ink border-ink/10 hover:border-atlantic'
                        }`}
                        id={`calculator-addon-${item.key}`}
                      >
                        <span className="font-medium pr-2">{item.label}</span>
                        <span className={`font-app-sans shrink-0 ${isChecked ? 'text-atlantic' : 'text-atlantic'}`}>
                          {item.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Summary Card & Direct CTA */}
            <div className="lg:col-span-5 bg-paper p-8 rounded-[28px] border border-ink/10 space-y-6 shadow-sm">
              <h4 className="font-app-display font-semibold text-xl text-ink">
                Scope Estimate Summary
              </h4>

              <div className="space-y-2 text-xs text-ink/55 font-light border-b border-ink/10 pb-4">
                <div className="flex justify-between">
                  <span>Selected Package:</span>
                  <span className="font-medium text-ink">{pkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest Scale:</span>
                  <span className="font-medium text-ink">{guestCount} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span>Add-Ons Total:</span>
                  <span className="font-medium text-ink">${addOnsTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase block">
                  Estimated Total Fee:
                </span>
                <span className="text-3xl font-app-display font-semibold text-ink">
                  ${estimatedTotal.toLocaleString()}
                </span>
                <p className="text-[11px] text-ink/45 font-light">
                  *Excludes third-party vendor hard costs (catering, floral materials, venue rentals).
                </p>
              </div>

              <button
                onClick={handleBookSelected}
                className="w-full py-4 rounded-xl bg-ink text-paper text-xs uppercase tracking-widest font-semibold hover:bg-atlantic transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                id="calculator-reserve-date-btn"
              >
                <span>Reserve Date with Selected Scope</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
