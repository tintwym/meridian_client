import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MapPin, ExternalLink, Plane, CheckSquare, CloudSun, Calendar, Info, Compass, HelpCircle, X } from 'lucide-react';
import { Venue, SeasonalForecast, DesignerPrefill, LocalCategory } from '../types';
import type { NearbyVenue } from '../api/types';
import { useNearbyVenues } from '../hooks/useNearbyVenues';
import { useInViewOnce } from '../hooks/useInViewOnce';
import { venueToLocalCategory } from './NearbyVenueChips';
import {
  assignUniqueVenueImages,
  blurbForVenue,
  capacityForVenue,
} from '../data/venueImages';

interface CoreOfferingsProps {
  onUseInDesigner?: (prefill: DesignerPrefill) => void;
}

const CATEGORY_TYPE: Record<LocalCategory, string> = {
  hotel: 'Luxury Hotel',
  beach: 'Scenic Beach',
  resort: 'Hidden Resort',
  restaurant: 'Premium Restaurant',
};

const SHOWCASE_ORDER: LocalCategory[] = ['hotel', 'beach', 'resort', 'restaurant'];

/** Prefer one of each category so the Local row reads like a real catalog. */
function pickShowcaseVenues(venues: NearbyVenue[], limit = 4): NearbyVenue[] {
  const picks: NearbyVenue[] = [];
  const taken = new Set<string>();

  for (const cat of SHOWCASE_ORDER) {
    if (picks.length >= limit) break;
    const match = venues.find((v) => v.localCategory === cat && !taken.has(v.id));
    if (match) {
      picks.push(match);
      taken.add(match.id);
    }
  }

  for (const v of venues) {
    if (picks.length >= limit) break;
    if (!taken.has(v.id)) {
      picks.push(v);
      taken.add(v.id);
    }
  }

  return picks;
}

export default function CoreOfferings({ onUseInDesigner }: CoreOfferingsProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'overseas'>('local');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [sectionRef, sectionInView] = useInViewOnce<HTMLElement>('160px 0px');
  // Defer GPS until the section is near the viewport (iOS Safari stalls on early geolocation).
  const nearby = useNearbyVenues(sectionInView && activeTab === 'local');

  // TAB B Sub-state
  const [selectedDestination, setSelectedDestination] = useState<'Santorini' | 'Amalfi' | 'Bali' | 'Kyoto' | 'Hawaii'>('Santorini');
  const [forecastMonth, setForecastMonth] = useState<string>('September');

  // Checklist states for Ceremony Coordination
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Bilingual legal wedding translation & certification', completed: true },
    { id: 2, label: 'Apostille certification stamps (local department of state)', completed: true },
    { id: 3, label: 'Municipal registrar licensing fees & slot reservation', completed: false },
    { id: 4, label: 'Overseas local witness coordination', completed: true },
    { id: 5, label: 'Official consular notification for marriage registry', completed: false },
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const showcaseSource: NearbyVenue[] = nearby.venues.length
    ? nearby.venues
    : [
        {
          id: 'fallback-hotel',
          name: 'Local Premium Hotel',
          localCategory: 'hotel',
          city: 'Local',
          countryCode: 'XX',
          mapQuery: 'luxury hotel',
          tag: 'Hotel',
        },
        {
          id: 'fallback-beach',
          name: 'Coastal Beach Pavilion',
          localCategory: 'beach',
          city: 'Local',
          countryCode: 'XX',
          mapQuery: 'beach venue',
          tag: 'Beach',
        },
        {
          id: 'fallback-resort',
          name: 'Heritage Resort Estate',
          localCategory: 'resort',
          city: 'Local',
          countryCode: 'XX',
          mapQuery: 'luxury resort',
          tag: 'Resort',
        },
        {
          id: 'fallback-restaurant',
          name: 'Private Dining Salon',
          localCategory: 'restaurant',
          city: 'Local',
          countryCode: 'XX',
          mapQuery: 'fine dining restaurant',
          tag: 'Restaurant',
        },
      ];

  const showcaseVenues = pickShowcaseVenues(showcaseSource, 4);
  const showcaseImages = assignUniqueVenueImages(
    showcaseVenues.map((v) => ({
      id: v.id,
      localCategory: venueToLocalCategory(v.localCategory),
    })),
  );

  const localVenues: Venue[] = showcaseVenues.map((v) => {
    const cat = venueToLocalCategory(v.localCategory);
    return {
      id: v.id,
      name: v.name,
      type: CATEGORY_TYPE[cat],
      capacity: capacityForVenue(v.id, cat),
      description: blurbForVenue(v.id, cat, v.city, nearby.countryName),
      image: showcaseImages[v.id],
      tag: v.tag || v.city,
      highlights: [
        `${v.city} setting`,
        'Planner-vetted for Meridian Club',
        'Weather-aware contingency available',
      ],
      localCategory: cat,
    };
  });

  // Weather Destinations (Tab B, Pillar 3)
  const weatherDatabase: Record<'Santorini' | 'Amalfi' | 'Bali' | 'Kyoto' | 'Hawaii', SeasonalForecast[]> = {
    Santorini: [
      { month: 'May', suitability: 'Ideal', tempCelsius: 22, rainProbability: 8, crowdLevel: 'Moderate', note: 'Spectacular sunset clarity. Perfect lighting for photography with lower tourist crowds.' },
      { month: 'July', suitability: 'Peak', tempCelsius: 29, rainProbability: 2, crowdLevel: 'High', note: 'Ultimate island warmth. Clear ocean winds but high public foot traffic near Oia cliffs.' },
      { month: 'September', suitability: 'Peak', tempCelsius: 26, rainProbability: 4, crowdLevel: 'Moderate', note: 'Perfect golden balance. Warm ocean waters, gentle breeze, sunset ceremonies are exquisite.' },
      { month: 'November', suitability: 'Fair', tempCelsius: 18, rainProbability: 28, crowdLevel: 'Low', note: 'Chilly sea winds. Great for indoor events; cliffside outdoor ceremonies need wind guards.' }
    ],
    Amalfi: [
      { month: 'May', suitability: 'Ideal', tempCelsius: 21, rainProbability: 12, crowdLevel: 'Moderate', note: 'Lemon groves are in full fragrant bloom. Moderate breeze, spectacular coastal vistas.' },
      { month: 'July', suitability: 'Peak', tempCelsius: 30, rainProbability: 3, crowdLevel: 'High', note: 'Gorgeous sailing weather. Yacht transfers are perfect; coastal traffic is busy.' },
      { month: 'September', suitability: 'Peak', tempCelsius: 25, rainProbability: 10, crowdLevel: 'Moderate', note: 'Incredible harvest month. Vineyards are vibrant. Rich coastal sunsets.' },
      { month: 'November', suitability: 'Not Recommended', tempCelsius: 16, rainProbability: 45, crowdLevel: 'Low', note: 'High storm frequency. Many cliffside venues and private boats hibernate for winter.' }
    ],
    Bali: [
      { month: 'May', suitability: 'Peak', tempCelsius: 28, rainProbability: 5, crowdLevel: 'Moderate', note: 'Dry season begins. Crystal clear skies over temple cliffs and warm tropical breezes.' },
      { month: 'July', suitability: 'Peak', tempCelsius: 27, rainProbability: 2, crowdLevel: 'High', note: 'Optimal weather. Cool dry winds, minimal humidity, beautiful beach ceremonies.' },
      { month: 'September', suitability: 'Ideal', tempCelsius: 29, rainProbability: 10, crowdLevel: 'Moderate', note: 'Calm waters. Great for clifftop resort receptions and private villa gatherings.' },
      { month: 'November', suitability: 'Fair', tempCelsius: 31, rainProbability: 40, crowdLevel: 'Low', note: 'Wet season monsoon clouds. High humidity; weddings require full rain cover pavilions.' }
    ],
    Kyoto: [
      { month: 'May', suitability: 'Ideal', tempCelsius: 20, rainProbability: 15, crowdLevel: 'Moderate', note: 'Fresh lush green maples. Extremely comfortable weather for elegant traditional gardens.' },
      { month: 'July', suitability: 'Fair', tempCelsius: 29, rainProbability: 25, crowdLevel: 'High', note: 'Vibrant summer festivals. Can be highly humid; evening indoor tatami banquets recommended.' },
      { month: 'September', suitability: 'Ideal', tempCelsius: 24, rainProbability: 18, crowdLevel: 'Moderate', note: 'Late summer transition. Warm, clear afternoons with cool autumn forest winds starting.' },
      { month: 'November', suitability: 'Peak', tempCelsius: 14, rainProbability: 10, crowdLevel: 'High', note: 'Breathtaking red maple leaves. Crisp air, flawless historical photography backdrop.' }
    ],
    Hawaii: [
      { month: 'May', suitability: 'Peak', tempCelsius: 26, rainProbability: 10, crowdLevel: 'Moderate', note: 'Beautiful tradewinds. Low rain risk across western volcanic coastlines.' },
      { month: 'July', suitability: 'Peak', tempCelsius: 28, rainProbability: 8, crowdLevel: 'High', note: 'Warm waters, high tropical sun. Outstanding sunset beach setups across Maui and Kauai.' },
      { month: 'September', suitability: 'Peak', tempCelsius: 29, rainProbability: 12, crowdLevel: 'Moderate', note: 'Spectacular clear tides. Warm ocean, calm waves, ideal for beachside dinner canopies.' },
      { month: 'November', suitability: 'Ideal', tempCelsius: 25, rainProbability: 20, crowdLevel: 'Moderate', note: 'Slightly higher surf. Gorgeous trade clouds with quick, refreshing afternoon micro-showers.' }
    ]
  };

  const activeForecast = weatherDatabase[selectedDestination].find(f => f.month === forecastMonth) || weatherDatabase[selectedDestination][0];

  return (
    <section
      ref={sectionRef}
      className="relative bg-champagne py-16 sm:py-24 px-4 sm:px-6 md:px-12 overflow-hidden"
      id="offerings-container"
    >
      {/* Soft Ambient Blurs */}
      <div className="ambient-blur absolute top-1/3 right-10 w-[30vw] h-[30vw] bg-sage/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="ambient-blur absolute bottom-1/3 left-10 w-[30vw] h-[30vw] bg-[#EADCC9]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-sage">Curated Architecture</p>
          <h2 className="font-serif text-4xl sm:text-5xl font-medium text-navy tracking-tight">
            Our Core Planning Offerings
          </h2>
          <p className="text-slate text-sm leading-relaxed">
            Whether staying in your home city or embarking across the seas, we manage every layer with meticulous focus. Click below to explore our distinct approaches.
          </p>

          {/* Toggle Tabs — full-width on phone so labels don’t overflow */}
          <div className="mt-6 flex w-full max-w-md mx-auto glass-panel p-1 rounded-full border border-navy/5 shadow-md">
            <button
              id="tab-btn-local"
              onClick={() => setActiveTab('local')}
              className={`flex-1 px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === 'local'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-slate hover:text-navy'
              }`}
            >
              Local
              <span className="hidden sm:inline"> Celebrations</span>
            </button>
            <button
              id="tab-btn-overseas"
              onClick={() => setActiveTab('overseas')}
              className={`flex-1 px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === 'overseas'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-slate hover:text-navy'
              }`}
            >
              Overseas
              <span className="hidden sm:inline"> Destinations</span>
            </button>
          </div>
        </div>

        {/* Tab A Content: Local Grid */}
        <AnimatePresence mode="wait">
          {activeTab === 'local' && (
            <motion.div
              key="local-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              id="local-events"
            >
              {(nearby.countryName || nearby.loading) && (
                <p className="md:col-span-2 lg:col-span-4 text-[11px] font-mono uppercase tracking-[0.16em] text-slate -mt-2 mb-2">
                  {nearby.loading
                    ? 'Finding venues near you…'
                    : `Near ${nearby.countryName} — hotels, beaches & resorts`}
                </p>
              )}
              {localVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="glass-panel border-white/40 rounded-3xl overflow-hidden group transition-all duration-500 flex flex-col justify-between shadow-[0_8px_30px_rgba(143,151,121,0.06)] hover:shadow-[0_20px_50px_rgba(143,151,121,0.18)] hover:border-white/65 hover:scale-[1.01]"
                >
                  <div>
                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden bg-white/20">
                      <img
                        src={venue.image}
                        alt={venue.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 glass-panel border border-white/40 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-navy rounded-full">
                        {venue.type}
                      </span>
                    </div>

                    {/* Card Copy */}
                    <div className="p-5 text-left space-y-2">
                      <div className="flex items-center space-x-1 text-[9px] font-mono uppercase tracking-widest text-sage">
                        <Users className="w-3 h-3" />
                        <span>Capacity: {venue.capacity}</span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-navy tracking-tight group-hover:text-sage transition-colors duration-300">
                        {venue.name}
                      </h3>
                      <p className="text-slate text-xs line-clamp-3 leading-relaxed">
                        {venue.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-5 pt-0 text-left border-t border-navy/5 mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-sans text-slate/60 italic">
                      {venue.tag}
                    </span>
                    <button
                      id={`view-venue-${venue.id}`}
                      onClick={() => setSelectedVenue(venue)}
                      className="text-[10px] font-mono uppercase tracking-widest text-navy hover:text-sage flex items-center gap-1 group-hover:underline font-semibold cursor-pointer"
                    >
                      <span>Explore</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab B Content: Overseas Pillars */}
          {activeTab === 'overseas' && (
            <motion.div
              key="overseas-pillars"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
              id="overseas-weddings"
            >
              
              {/* Left col: Procedural Steps tracking (col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Pillar 1: Flights & Logistics */}
                <div className="glass-panel border-white/50 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-sage/10 p-4 rounded-2xl text-sage shrink-0 border border-sage/15">
                    <Plane className="w-6 h-6 text-sage animate-pulse" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate uppercase tracking-widest">Pillar 01 / Logistics</span>
                      <span className="bg-sage/10 text-sage border border-sage/15 text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full">Integrated Tracking</span>
                    </div>
                    <h4 className="font-serif text-lg font-semibold text-navy tracking-tight">
                      Flight & Accommodation Logistics
                    </h4>
                    <p className="text-slate text-xs leading-relaxed">
                      We secure block flight bookings, organize bespoke VIP airport shuttle relays, coordinate guest resort suite layouts, and provide an active digital manifest to ensure absolute arrival sync.
                    </p>

                    {/* Interactive Guest-Manifest Sim Card */}
                    <div className="bg-white/30 border border-white/40 p-4 rounded-2xl backdrop-blur-md">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-slate mb-2">Live Group Arrival Dashboard (Simulated)</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono border-b border-navy/5 pb-1">
                          <span className="text-navy/80">Flight BA-264 (London ➔ Athens)</span>
                          <span className="bg-sage/15 text-sage px-2 py-0.5 rounded-full text-[9px] font-semibold border border-sage/10">42 Guests Landed</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-navy/80">Resort Villa Check-in (Santorini Suites)</span>
                          <span className="text-sage font-semibold">88% Rooms Allocated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pillar 2: The Ceremony Coordination */}
                <div className="glass-panel border-white/50 p-6 rounded-3xl shadow-lg flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-sage/10 p-4 rounded-2xl text-sage shrink-0 border border-sage/15">
                    <CheckSquare className="w-6 h-6 text-sage" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate uppercase tracking-widest">Pillar 02 / Registry</span>
                      <span className="bg-sage/10 text-sage border border-sage/15 text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full">Legalities & Consular</span>
                    </div>
                    <h4 className="font-serif text-lg font-semibold text-navy tracking-tight">
                      The Ceremony & Legal Coordination
                    </h4>
                    <p className="text-slate text-xs leading-relaxed">
                      Overseas legalities can be daunting. We curate, translate, and notarize municipal paperwork, coordinate consular signatures, and guarantee that your certificate is globally recognized.
                    </p>

                    {/* Interactive Checkbox Tracker */}
                    <div className="bg-white/30 border border-white/40 p-4 rounded-2xl backdrop-blur-md space-y-2.5">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-slate border-b border-navy/5 pb-1.5 flex justify-between items-center">
                        <span>Legal Progress Checklist</span>
                        <span className="text-sage font-semibold">Toggles Active</span>
                      </p>
                      <div className="space-y-2">
                        {checklist.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start space-x-2.5 cursor-pointer text-xs font-sans text-navy/80 hover:text-navy transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleChecklist(item.id)}
                              className="mt-0.5 accent-sage"
                            />
                            <span className={item.completed ? 'line-through text-slate/50' : ''}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right col: Weather & Seasonal Optimization (col-span-5) */}
              <div className="lg:col-span-5">
                <div className="glass-panel border-white/50 p-6 rounded-3xl shadow-lg h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-navy/5 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate uppercase tracking-widest">Pillar 03 / Weather</span>
                        <h4 className="font-serif text-xl font-semibold text-navy tracking-tight mt-1">
                          Seasonal Climate Forecaster
                        </h4>
                      </div>
                      <CloudSun className="w-8 h-8 text-sage animate-spin-slow" />
                    </div>

                    <p className="text-slate text-xs leading-relaxed">
                      Select your dream global destination and seasonal month to view historical climate tracking, precipitation forecasts, and curated planner recommendations.
                    </p>

                    {/* Interactive Destination Selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate">Select Overseas Venue</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Santorini', 'Amalfi', 'Bali', 'Kyoto', 'Hawaii'] as const).map((dest) => (
                          <button
                            key={dest}
                            onClick={() => setSelectedDestination(dest)}
                            className={`px-2 py-1.5 text-[10px] font-mono uppercase border rounded-lg transition-colors cursor-pointer ${
                              selectedDestination === dest
                                ? 'bg-navy text-white border-navy'
                                : 'bg-white/30 text-slate border-navy/10 hover:bg-white/60'
                            }`}
                          >
                            {dest}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Month Selector */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate">Planning Month</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['May', 'July', 'September', 'November'].map((m) => (
                          <button
                            key={m}
                            onClick={() => setForecastMonth(m)}
                            className={`px-1 py-1.5 text-[10px] font-mono uppercase border rounded-lg transition-colors cursor-pointer ${
                              forecastMonth === m
                                ? 'bg-sage text-white border-sage'
                                : 'bg-white/30 text-slate border-navy/10 hover:bg-white/60'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Weather Results Display Panel */}
                  <div className="mt-6 bg-white/30 border border-white/40 p-4 rounded-2xl backdrop-blur-md space-y-4">
                    <div className="flex justify-between items-center border-b border-navy/5 pb-2">
                      <span className="text-xs font-semibold text-navy flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sage" />
                        {selectedDestination} ({forecastMonth})
                      </span>
                      <span className={`px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-semibold rounded-full ${
                        activeForecast.suitability === 'Peak' ? 'bg-sage/10 text-sage border border-sage/15' :
                        activeForecast.suitability === 'Ideal' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        activeForecast.suitability === 'Fair' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {activeForecast.suitability} Window
                      </span>
                    </div>

                    {/* Core Numbers */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/50 backdrop-blur-xs p-2 border border-white/40 rounded-xl">
                        <span className="text-[8px] font-mono text-slate uppercase tracking-widest block">Avg Temp</span>
                        <span className="text-sm font-bold text-navy font-mono">{activeForecast.tempCelsius}°C</span>
                      </div>
                      <div className="bg-white/50 backdrop-blur-xs p-2 border border-white/40 rounded-xl">
                        <span className="text-[8px] font-mono text-slate uppercase tracking-widest block">Rain Risk</span>
                        <span className="text-sm font-bold text-navy font-mono">{activeForecast.rainProbability}%</span>
                      </div>
                      <div className="bg-white/50 backdrop-blur-xs p-2 border border-white/40 rounded-xl">
                        <span className="text-[8px] font-mono text-slate uppercase tracking-widest block">Crowd Level</span>
                        <span className="text-[10px] font-bold text-navy uppercase font-mono tracking-tight">{activeForecast.crowdLevel}</span>
                      </div>
                    </div>

                    {/* Expert Note */}
                    <div className="bg-champagne border-l-2 border-sage p-3 text-[11px] text-slate leading-relaxed flex items-start gap-2 rounded-r-xl">
                      <Info className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                      <span>{activeForecast.note}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUseInDesigner?.({
                          eventType: 'overseas',
                          overseasCategory: 'wedding_ceremony',
                          locationName: `${selectedDestination}`,
                          guestCount: 80,
                          cateringStyle: 'fine_dining',
                          messageStyle: 'romantic',
                          targetMonth: forecastMonth,
                          specialNotes: `Destination focus: ${selectedDestination}. Weather note: ${activeForecast.note}`,
                        })
                      }
                      className="w-full bg-navy text-white font-mono text-[10px] uppercase tracking-widest py-3 rounded-full hover:bg-sage transition-colors cursor-pointer"
                    >
                      Use {selectedDestination} in Designer
                    </button>
                  </div>

                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal for Local Venue Detail (if selected) */}
        <AnimatePresence>
          {selectedVenue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-navy/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="glass-panel max-w-2xl w-full border border-white/45 overflow-y-auto relative rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[min(92dvh,40rem)]"
              >
                {/* Header Close button */}
                <button
                  type="button"
                  onClick={() => setSelectedVenue(null)}
                  aria-label="Close"
                  className="absolute top-4 right-4 z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-all hover:bg-sage hover:text-white cursor-pointer"
                >
                  <X className="size-4" strokeWidth={2.25} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="h-64 md:h-auto overflow-hidden bg-white/10">
                    <img
                      src={selectedVenue.image}
                      alt={selectedVenue.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 text-left space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase bg-sage/10 text-sage px-2.5 py-0.5 rounded-full border border-sage/15">
                        {selectedVenue.type}
                      </span>
                      <h3 className="font-serif text-2xl font-semibold text-navy tracking-tight leading-tight">
                        {selectedVenue.name}
                      </h3>
                      <p className="text-slate text-xs leading-relaxed">
                        {selectedVenue.description}
                      </p>
                      <p className="text-[10px] font-mono text-slate uppercase tracking-widest flex items-center gap-1 border-t border-navy/5 pt-3">
                        <Users className="w-3.5 h-3.5 text-sage" /> Max Capacity: {selectedVenue.capacity}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-slate">Premium Inclusions</p>
                      <ul className="text-[11px] text-slate space-y-1">
                        {selectedVenue.highlights.map((h, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-sage"></span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        onUseInDesigner?.({
                          eventType: 'local',
                          localCategory: selectedVenue.localCategory ?? 'hotel',
                          locationName: selectedVenue.name,
                          guestCount: 120,
                          cateringStyle: 'fine_dining',
                          messageStyle: 'romantic',
                          targetMonth: 'September',
                          specialNotes: `Inspired by ${selectedVenue.name}: ${selectedVenue.tag}`,
                        });
                        setSelectedVenue(null);
                      }}
                      className="w-full bg-navy text-white font-mono text-[10px] uppercase tracking-widest py-3 mt-4 rounded-full hover:bg-sage transition-colors cursor-pointer"
                    >
                      Use in Designer
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
