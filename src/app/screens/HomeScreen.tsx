import { motion } from 'motion/react';
import { ArrowRight, Compass, MapPin, MapPinOff } from 'lucide-react';
import { BRAND } from '../../brand';
import type { DesignerPrefill, EventPlanResponse, LocalCategory } from '../../types';
import { useNearbyVenues } from '../../hooks/useNearbyVenues';
import { useTrendingDestinations } from '../../hooks/useTrendingDestinations';
import type { DestinationImageKey } from '../../data/exploreDestinations';
import heroImg from '../../assets/images/overseas_cliffside_wedding_1784113736506.jpg';
import cliffImg from '../../assets/images/overseas_cliffside_wedding_1784113736506.jpg';
import beachImg from '../../assets/images/beach_resort_1784103426732.jpg';
import resortImg from '../../assets/images/local_resort_luxury_1784113723300.jpg';
import coverImg from '../../assets/images/hero_cover_1784103409273.jpg';
import diningImg from '../../assets/images/dining_hall_1784103456507.jpg';
import salonImg from '../../assets/images/hotel_ballroom_1784103443070.jpg';
import { imageSrc } from '../../lib/imageSrc';

const IMAGE_BY_KEY: Record<DestinationImageKey, string> = {
  cliff: imageSrc(cliffImg),
  cover: imageSrc(coverImg),
  beach: imageSrc(beachImg),
  dining: imageSrc(diningImg),
  resort: imageSrc(resortImg),
  salon: imageSrc(salonImg),
};

function categoryLabel(cat: LocalCategory): string {
  switch (cat) {
    case 'hotel':
      return 'Hotel';
    case 'beach':
      return 'Beach';
    case 'resort':
      return 'Resort';
    case 'restaurant':
      return 'Restaurant';
    default:
      return cat;
  }
}

function nearbySubtitle(opts: {
  loading: boolean;
  locationState: ReturnType<typeof useNearbyVenues>['locationState'];
  countryName: string | null;
  usingFallback: boolean;
  hasVenues: boolean;
}): string {
  if (opts.loading) return 'Finding hotels, beaches, and resorts near you…';
  if (opts.locationState === 'granted' && opts.countryName) {
    return `Curated venues in ${opts.countryName}.`;
  }
  if (opts.locationState === 'denied') {
    return opts.hasVenues
      ? 'Location off — showing curated picks you can browse anyway.'
      : 'Location is blocked. Enable it in browser settings, or browse curated picks.';
  }
  if (opts.locationState === 'unavailable' || opts.locationState === 'timeout') {
    return opts.hasVenues
      ? 'Couldn’t read your location — showing curated venue picks.'
      : 'Location unavailable. Try again, or browse destinations above.';
  }
  if (opts.usingFallback && opts.countryName) {
    return `Curated picks in ${opts.countryName}.`;
  }
  return 'Allow location to suggest hotels, beaches, and resorts.';
}

interface HomeScreenProps {
  savedPlan?: EventPlanResponse | null;
  onOpenPlan: (prefill: DesignerPrefill) => void;
  onContinuePlan?: () => void;
}

export default function HomeScreen({
  savedPlan,
  onOpenPlan,
  onContinuePlan,
}: HomeScreenProps) {
  const nearby = useNearbyVenues(true);
  const trending = useTrendingDestinations();
  const hasVenues = nearby.venues.length > 0;
  const locationBlocked =
    nearby.locationState === 'denied' ||
    nearby.locationState === 'unavailable' ||
    nearby.locationState === 'timeout' ||
    nearby.locationState === 'error';

  return (
    <div className="flex min-h-full flex-col bg-ink text-paper">
      <section className="relative flex min-h-104 flex-col justify-end overflow-hidden sm:min-h-112">
        <img
          src={imageSrc(heroImg)}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-1400 ease-out motion-safe:scale-100"
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/55 to-ink/25" />

        <div
          className="relative z-10 flex flex-col gap-4 px-6 pb-10 pt-16"
          style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="font-app-sans text-[11px] font-semibold tracking-[0.28em] text-paper/55 uppercase"
          >
            Explore
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-app-display text-[2.75rem] leading-[0.95] tracking-tight text-paper sm:text-5xl"
          >
            {BRAND.name}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xs font-app-sans text-[15px] leading-relaxed text-paper/80"
          >
            Browse destinations and venues — then build your plan.
          </motion.p>

          {savedPlan && onContinuePlan ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              onClick={onContinuePlan}
              className="app-btn app-btn-paper"
            >
              Continue “{savedPlan.title.slice(0, 24)}
              {savedPlan.title.length > 24 ? '…' : ''}”
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          ) : null}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-paper px-6 pt-8 pb-6 text-ink"
      >
        <p className="font-app-sans text-[11px] font-semibold tracking-[0.2em] text-atlantic uppercase">
          {trending.label}
        </p>
        <h2 className="mt-1 font-app-display text-3xl tracking-tight text-ink">Destinations</h2>
        <p className="mt-2 max-w-sm font-app-sans text-sm leading-relaxed text-ink/50">
          Refreshes daily · tap a place to start an overseas plan.
        </p>

        <div className="-mx-6 mt-5 flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-none">
          {trending.destinations.map((dest) => (
            <button
              key={dest.id}
              type="button"
              onClick={() =>
                onOpenPlan({
                  eventType: 'overseas',
                  locationName: dest.locationName,
                  overseasCategory: 'wedding_ceremony',
                })
              }
              className="group relative w-47 shrink-0 overflow-hidden text-left transition-transform active:scale-[0.98]"
            >
              <div className="relative h-52 overflow-hidden bg-ink">
                <img
                  src={IMAGE_BY_KEY[dest.imageKey]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/45 to-ink/10" />
                <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pt-10">
                  <span className="font-app-sans text-[10px] font-medium tracking-[0.16em] text-paper/55 uppercase">
                    {dest.region}
                  </span>
                  <span className="mt-0.5 block font-app-display text-[1.35rem] text-paper">{dest.name}</span>
                  <span className="mt-1 block font-app-sans text-xs leading-snug text-paper/70">{dest.blurb}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-paper px-6 pt-2 pb-12 text-ink"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-app-display text-3xl tracking-tight text-ink">Near you</h2>
          {nearby.loading ? (
            <Compass className="h-4 w-4 animate-spin text-ink/35" aria-hidden />
          ) : locationBlocked ? (
            <MapPinOff className="h-4 w-4 text-ink/35" aria-hidden />
          ) : nearby.locationState === 'granted' ? (
            <MapPin className="h-4 w-4 text-atlantic" aria-hidden />
          ) : null}
        </div>
        <p className="mt-2 max-w-sm font-app-sans text-sm leading-relaxed text-ink/50">
          {nearbySubtitle({
            loading: nearby.loading,
            locationState: nearby.locationState,
            countryName: nearby.countryName,
            usingFallback: nearby.usingFallback,
            hasVenues,
          })}
        </p>

        {nearby.loading && !hasVenues ? (
          <ul className="mt-5 flex flex-col gap-2.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-ink/8 px-3 py-2.5"
              >
                <span className="h-[72px] w-[72px] shrink-0 rounded-lg bg-ink/8" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-3 w-2/3 rounded bg-ink/8" />
                  <span className="h-2.5 w-1/2 rounded bg-ink/5" />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {!nearby.loading && !hasVenues ? (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void nearby.refresh()}
              className="app-btn app-btn-ink w-full px-5 py-3.5 font-app-sans text-sm font-semibold"
            >
              {locationBlocked ? 'Try location again' : 'Find venues near me'}
            </button>
            <p className="font-app-sans text-xs leading-relaxed text-ink/40">
              Or pick a destination above to start planning without GPS.
            </p>
          </div>
        ) : null}

        {hasVenues ? (
          <>
            {locationBlocked ? (
              <button
                type="button"
                onClick={() => void nearby.refresh()}
                className="mt-4 font-app-sans text-xs font-semibold tracking-wide text-atlantic underline-offset-2 hover:underline"
              >
                Retry location
              </button>
            ) : null}
            <ul className="mt-5 flex flex-col gap-2.5">
              {nearby.venues.slice(0, 6).map((venue) => (
                <li key={venue.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenPlan({
                        eventType: 'local',
                        locationName: venue.name,
                        localCategory: venue.localCategory,
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-xl border border-ink/10 px-3 py-2.5 text-left transition-colors hover:bg-ink/3 active:scale-[0.99]"
                  >
                    {venue.imageUrl ? (
                      <img
                        src={venue.imageUrl}
                        alt=""
                        className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block font-app-display text-base text-ink">{venue.name}</span>
                      <span className="mt-0.5 block font-app-sans text-xs text-ink/45">
                        {venue.city} · {categoryLabel(venue.localCategory)}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink/35" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </motion.section>
    </div>
  );
}
