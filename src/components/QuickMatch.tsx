import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Check, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import {
  LandingEventType,
  LocationType,
  GuestCountRange,
  DesignerPrefill,
  MessageStyle,
} from '../types';
import MeridianSelect from './MeridianSelect';
import { checkAvailability, reserveHold } from '../api';
import type { AvailabilityResult } from '../api';
import NearbyVenueChips, { venueToLocalCategory } from './NearbyVenueChips';
import { useNearbyVenues } from '../hooks/useNearbyVenues';

interface QuickMatchProps {
  onContinueToDesigner?: (prefill: DesignerPrefill) => void;
}

const EVENT_OPTIONS = [
  { value: 'Wedding' as const, label: 'Luxury Wedding' },
  { value: 'Corporate' as const, label: 'Bespoke Corporate' },
  { value: 'Gala' as const, label: 'High-End Gala' },
  { value: 'Anniversary' as const, label: 'Private Soiree' },
];

const LOCATION_OPTIONS = [
  { value: 'Local' as const, label: 'Local (Resort & Cities)' },
  { value: 'Destination' as const, label: 'Overseas (Islands & Coast)' },
];

const GUEST_OPTIONS = [
  { value: 'under-50' as const, label: 'Intimate (Under 50 guests)' },
  { value: '50-150' as const, label: 'Bespoke Boutique (50 - 150 guests)' },
  { value: '150-300' as const, label: 'Grand Gala (150 - 300 guests)' },
  { value: '300-plus' as const, label: 'Elite Assembly (300+ guests)' },
];

function mapToPrefill(
  eventType: LandingEventType,
  locationType: LocationType,
  guestCount: GuestCountRange,
  locationName?: string,
  localCategory?: 'hotel' | 'beach' | 'resort' | 'restaurant',
): DesignerPrefill {
  const guests =
    guestCount === 'under-50' ? 40 :
    guestCount === '50-150' ? 100 :
    guestCount === '150-300' ? 200 : 320;

  const messageStyle: MessageStyle =
    eventType === 'Wedding' || eventType === 'Anniversary' ? 'romantic' :
    eventType === 'Corporate' ? 'formal' : 'warm_festive';

  if (locationType === 'Local') {
    return {
      eventType: 'local',
      localCategory: localCategory ?? (eventType === 'Wedding' ? 'resort' : 'hotel'),
      guestCount: guests,
      locationName: locationName || 'Local Luxury Venue',
      messageStyle,
      cateringStyle: 'fine_dining',
      targetMonth: 'September',
      specialNotes: `${eventType} — Quick Match prefill`,
    };
  }

  return {
    eventType: 'overseas',
    overseasCategory: 'wedding_ceremony',
    guestCount: guests,
    locationName: 'Santorini, Greece',
    messageStyle,
    cateringStyle: 'fine_dining',
    targetMonth: 'September',
    specialNotes: `${eventType} overseas — Quick Match prefill`,
  };
}

export default function QuickMatch({ onContinueToDesigner }: QuickMatchProps) {
  const [eventType, setEventType] = useState<LandingEventType>('Wedding');
  const [locationType, setLocationType] = useState<LocationType>('Local');
  const [guestCount, setGuestCount] = useState<GuestCountRange>('50-150');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<boolean>(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [reservationEmail, setReservationEmail] = useState('');
  const [isReserved, setIsReserved] = useState(false);
  const [reserveNote, setReserveNote] = useState<string | null>(null);
  const [selectedVenueName, setSelectedVenueName] = useState<string | undefined>();
  // Don't GPS on first paint — iOS Safari stalls the main thread on permission + geocode.
  const [nearbyArmed, setNearbyArmed] = useState(false);
  const nearby = useNearbyVenues(locationType === 'Local' && nearbyArmed);

  useEffect(() => {
    if (locationType !== 'Local' || !nearbyArmed) return;
    if (!selectedVenueName && nearby.venues[0]) {
      setSelectedVenueName(nearby.venues[0].name);
    }
  }, [locationType, nearbyArmed, nearby.venues, selectedVenueName]);

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchResult(false);
    setIsReserved(false);
    setReserveNote(null);
    try {
      const result = await checkAvailability({
        eventType,
        locationType,
        guestCount,
      });
      setAvailability(result);
      setSearchResult(result.available);
    } catch (err) {
      console.error(err);
      setSearchResult(false);
    } finally {
      setIsSearching(false);
    }
  };

  const continueToDesigner = () => {
    const pick = nearby.venues.find((v) => v.name === selectedVenueName) ?? nearby.venues[0];
    onContinueToDesigner?.(
      mapToPrefill(
        eventType,
        locationType,
        guestCount,
        locationType === 'Local' ? pick?.name : undefined,
        locationType === 'Local' && pick ? venueToLocalCategory(pick.localCategory) : undefined,
      ),
    );
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationEmail || !availability) return;
    try {
      const result = await reserveHold({ email: reservationEmail, availability });
      setIsReserved(result.ok);
      setReserveNote(result.message);
    } catch (err) {
      console.error(err);
    }
  };

  // Curated matching texts depending on selections
  const getRecommendation = () => {
    const loc = locationType === 'Local' ? 'luxury estate or hidden coastal resort' : 'cliffside cathedral or private Mediterranean villa';
    const guestLimit = guestCount === 'under-50' ? 'highly intimate micro-catering' : 'grand ballroom configurations';
    const eventName = eventType === 'Wedding' ? 'The Forever Collection' : 'Elite Gala Experience';

    return {
      packageName: `${locationType === 'Local' ? 'Heritage' : 'Horizon'} Elite ${eventType}`,
      curatedFocus: `Our ${eventName} perfectly aligns with ${guestLimit}. We recommend a ${loc} featuring signature menus, multi-day guest flight management, and fully redundant severe-weather backups.`,
      consultant: locationType === 'Local' ? 'Helena Vance, Lead Local Curator' : 'Matteo Rossi, Global Destination Director',
      timeline: locationType === 'Local' ? '4 to 6 Months planning track' : '8 to 12 Months standard timeline',
      slots: locationType === 'Local' ? 'Only 3 dates left for Autumn 2026' : 'Booking window open for Spring/Summer 2027',
      quoteEstimate: guestCount === 'under-50' ? 'Bespoke design starting at $15,000' : 'Bespoke design starting at $45,000'
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-6 sm:-mt-8 relative z-30">
      <div className="glass-panel shadow-[0_24px_64px_-16px_rgba(15,23,42,0.15)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate">Interactive Venue Finder</p>
        </div>

        {/* Form Horizontal Bar */}
        <form onSubmit={handleCheckAvailability} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
          {/* Select Event Type */}
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate">Event Experience</label>
            <MeridianSelect
              label="Event Experience"
              value={eventType}
              options={EVENT_OPTIONS}
              onChange={setEventType}
            />
          </div>

          {/* Select Location */}
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate">Destination Scale</label>
            <MeridianSelect
              label="Destination Scale"
              value={locationType}
              options={LOCATION_OPTIONS}
              onChange={(v) => {
                setLocationType(v);
                if (v === 'Local') setNearbyArmed(true);
              }}
            />
          </div>

          {/* Select Guest Count */}
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate">Estimated Guest Count</label>
            <MeridianSelect
              label="Estimated Guest Count"
              value={guestCount}
              options={GUEST_OPTIONS}
              onChange={setGuestCount}
            />
          </div>

          {/* CTA Check Availability */}
          <div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-navy hover:bg-sage text-white font-mono text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-full transition-all duration-300 flex items-center justify-center space-x-2 disabled:bg-slate/30 cursor-pointer shadow-[0_4px_20px_rgba(15,23,42,0.1)] hover:shadow-lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check Availability</span>
                </>
              )}
            </button>
          </div>
        </form>

        {locationType === 'Local' && (
          <div className="mt-5 pt-4 border-t border-navy/5">
            {nearbyArmed ? (
              <NearbyVenueChips
                countryName={nearby.countryName}
                venues={nearby.venues}
                selectedName={selectedVenueName}
                loading={nearby.loading}
                onSelect={(v) => setSelectedVenueName(v.name)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setNearbyArmed(true)}
                className="text-xs tracking-[0.14em] uppercase text-navy/55 hover:text-navy transition-colors"
              >
                Suggest venues near me
              </button>
            )}
          </div>
        )}

        {/* Search Results Drawer */}
        <AnimatePresence>
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="overflow-hidden mt-6 border-t border-navy/5 pt-6 text-left"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/94 md:bg-white/35 md:backdrop-blur-md p-6 rounded-2xl border border-white/40">
                
                {/* Visual Matching Details */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-sage/10 text-sage border border-sage/20 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
                      Matched Package: {recommendation.packageName}
                    </span>
                    <span className="text-navy/20 hidden sm:inline">|</span>
                    <span className="text-sage text-xs font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> High Compatibility
                    </span>
                  </div>

                  <p className="font-serif text-xl md:text-2xl text-navy leading-snug">
                    We found <span className="font-semibold">4 luxury locations</span> matching your criteria.
                  </p>

                  <p className="text-slate text-xs md:text-sm leading-relaxed max-w-2xl">
                    {recommendation.curatedFocus}
                  </p>

                  {/* Curated Grid Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white/40 border border-white/35 backdrop-blur-sm p-4 rounded-xl shadow-sm">
                      <p className="text-[9px] font-mono text-slate uppercase tracking-wider">Planning Track</p>
                      <p className="text-xs font-semibold text-navy mt-1">{recommendation.timeline}</p>
                    </div>
                    <div className="bg-white/40 border border-white/35 backdrop-blur-sm p-4 rounded-xl shadow-sm">
                      <p className="text-[9px] font-mono text-slate uppercase tracking-wider">Availability Status</p>
                      <p className="text-xs font-semibold text-sage mt-1">
                        {availability?.slotsNote || recommendation.slots}
                      </p>
                    </div>
                    <div className="bg-white/40 border border-white/35 backdrop-blur-sm p-4 rounded-xl shadow-sm">
                      <p className="text-[9px] font-mono text-slate uppercase tracking-wider">Budget Estimate</p>
                      <p className="text-xs font-semibold text-navy mt-1">{recommendation.quoteEstimate}</p>
                    </div>
                  </div>
                </div>

                {/* Reservation Call To Action form (col-span-4) */}
                <div className="lg:col-span-4 glass-panel border border-white/50 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-navy uppercase tracking-wide border-b border-navy/5 pb-2">
                      Planner Allocation
                    </h4>
                    <div className="flex items-center space-x-3 mt-4">
                      {/* Placeholder premium avatar */}
                      <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center font-serif text-sage font-semibold border border-sage/20">
                        {recommendation.consultant.split(' ')[0][0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-navy">{recommendation.consultant}</p>
                        <p className="text-[10px] text-slate">Assigned Lead Architect</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="text-[10px] text-slate leading-tight">
                      Continue into the Meridian designer with your Quick Match answers prefilled.
                    </p>
                    <button
                      type="button"
                      onClick={continueToDesigner}
                      className="w-full bg-navy hover:bg-sage text-white font-mono text-[10px] uppercase tracking-widest py-3 rounded-full transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Open Designer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {!isReserved ? (
                      <form onSubmit={handleReserve} className="space-y-2 pt-2 border-t border-navy/5">
                        <input
                          type="email"
                          required
                          placeholder="Or leave email for consult"
                          value={reservationEmail}
                          onChange={(e) => setReservationEmail(e.target.value)}
                          className="w-full bg-white/50 border border-navy/10 rounded-full px-4 py-2 text-xs text-navy focus:outline-none focus:ring-1 focus:ring-sage"
                        />
                        <button
                          type="submit"
                          className="w-full border border-navy/15 text-navy font-mono text-[10px] uppercase tracking-widest py-2.5 rounded-full hover:bg-white/60 transition-colors"
                        >
                          Claim Free Consult
                        </button>
                      </form>
                    ) : (
                      <div className="bg-sage/10 border border-sage/20 p-3 rounded-xl flex flex-col items-center text-center space-y-1">
                        <CheckCircle2 className="w-6 h-6 text-sage" />
                        <p className="text-[10px] font-semibold text-navy">
                          Consultation noted for {reservationEmail}
                        </p>
                        {reserveNote && (
                          <p className="text-[9px] text-slate font-mono">{reserveNote}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
