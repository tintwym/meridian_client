import { motion } from 'motion/react';
import { ArrowRight, Compass, MapPin, MapPinOff } from 'lucide-react';
import { BRAND } from '../../brand';
import type { DesignerPrefill, EventPlanResponse, LocalCategory } from '../../types';
import { useNearbyVenues } from '../../hooks/useNearbyVenues';
import { useTrendingDestinations } from '../../hooks/useTrendingDestinations';
import type { DestinationImageKey } from '../../data/exploreDestinations';
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
      ? 'Location off — showing curated picks.'
      : 'Location is blocked. Enable it in browser settings, or browse destinations above.';
  }
  if (opts.locationState === 'unavailable' || opts.locationState === 'timeout') {
    return opts.hasVenues
      ? 'Couldn’t read location — curated picks below.'
      : 'Location unavailable. Try again, or pick a destination.';
  }
  if (opts.usingFallback && opts.countryName) {
    return `Curated picks in ${opts.countryName}.`;
  }
  return 'Allow location for nearby hotels, beaches, and resorts.';
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
    <div className="flex min-h-full flex-col bg-paper text-ink">
      {/* Compact editorial header — not a second full landing hero */}
      <header
        className="relative overflow-hidden bg-ink text-paper"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <div className="absolute inset-0 opacity-40">
          <img
            src={imageSrc(coverImg)}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-ink/70 via-ink/85 to-ink" />
        </div>
        <div className="relative z-10 flex flex-col gap-3 px-6 pb-8 pt-4">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-app-display text-[2rem] leading-none tracking-tight text-paper sm:text-[2.25rem]"
          >
            {BRAND.name}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-sm font-app-sans text-sm leading-relaxed text-paper/75"
          >
            Destinations and venues — tap one to start a plan.
          </motion.p>
          {savedPlan && onContinuePlan ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              onClick={onContinuePlan}
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-paper/95 px-4 py-2.5 font-app-sans text-sm font-semibold text-ink"
            >
              Resume plan
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          ) : null}
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-12 pb-4"
      >
        <p className="font-app-sans text-[11px] font-semibold tracking-[0.2em] text-atlantic uppercase">
          {trending.label}
        </p>
        <h2 className="mt-2 font-app-display text-3xl tracking-tight text-ink">Destinations</h2>
        <p className="mt-2 max-w-sm font-app-sans text-sm leading-relaxed text-ink/50">
          Refreshes daily · opens Plan with that place.
        </p>

        <div className="-mx-6 mt-7 flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-none">
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
              className="group relative w-52 shrink-0 overflow-hidden text-left transition-transform active:scale-[0.98]"
            >
              <div className="relative h-60 overflow-hidden bg-ink">
                <img
                  src={IMAGE_BY_KEY[dest.imageKey]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pt-12">
                  <span className="font-app-sans text-[10px] font-medium tracking-[0.16em] text-paper/55 uppercase">
                    {dest.region}
                  </span>
                  <span className="mt-0.5 block font-app-display text-[1.4rem] text-paper">{dest.name}</span>
                  <span className="mt-1 block font-app-sans text-xs leading-snug text-paper/70">{dest.blurb}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-10 pb-8"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-app-display text-2xl tracking-tight text-ink">Near you</h2>
          {nearby.loading ? (
            <Compass className="h-4 w-4 animate-spin text-ink/30" aria-hidden />
          ) : locationBlocked ? (
            <MapPinOff className="h-3.5 w-3.5 text-ink/30" aria-hidden />
          ) : nearby.locationState === 'granted' ? (
            <MapPin className="h-3.5 w-3.5 text-atlantic" aria-hidden />
          ) : null}
        </div>
        <p className="mt-1.5 max-w-sm font-app-sans text-sm leading-relaxed text-ink/45">
          {nearbySubtitle({
            loading: nearby.loading,
            locationState: nearby.locationState,
            countryName: nearby.countryName,
            usingFallback: nearby.usingFallback,
            hasVenues,
          })}
        </p>

        {nearby.loading && !hasVenues ? (
          <ul className="mt-5 flex flex-col gap-0 divide-y divide-ink/8 border-y border-ink/8" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex animate-pulse items-center gap-3 py-3.5">
                <span className="h-14 w-14 shrink-0 rounded-lg bg-ink/6" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-3 w-2/3 rounded bg-ink/6" />
                  <span className="h-2.5 w-1/2 rounded bg-ink/4" />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {!nearby.loading && !hasVenues ? (
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void nearby.refresh()}
              className="font-app-sans text-sm font-semibold text-atlantic underline-offset-4 hover:underline"
            >
              {locationBlocked ? 'Try location again' : 'Find venues near me'}
            </button>
          </div>
        ) : null}

        {hasVenues ? (
          <>
            {locationBlocked ? (
              <button
                type="button"
                onClick={() => void nearby.refresh()}
                className="mt-3 font-app-sans text-xs font-semibold tracking-wide text-atlantic underline-offset-2 hover:underline"
              >
                Retry location
              </button>
            ) : null}
            <ul className="mt-4 flex flex-col divide-y divide-ink/8 border-y border-ink/8">
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
                    className="flex w-full items-center gap-3 py-3.5 text-left transition-opacity active:opacity-70"
                  >
                    {venue.imageUrl ? (
                      <img
                        src={venue.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="h-14 w-14 shrink-0 rounded-lg bg-ink/6" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-app-display text-[1.05rem] text-ink">{venue.name}</span>
                      <span className="mt-0.5 block font-app-sans text-xs text-ink/45">
                        {venue.city} · {categoryLabel(venue.localCategory)}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink/30" />
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
