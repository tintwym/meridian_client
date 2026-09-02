import type { NearbyVenue } from '../api/types';
import type { LocalCategory } from '../types';

type Props = {
  countryName?: string | null;
  venues: NearbyVenue[];
  selectedName?: string;
  /** When set, only chips matching this local category are shown. */
  filterCategory?: LocalCategory | null;
  loading?: boolean;
  onSelect: (venue: NearbyVenue) => void;
  className?: string;
};

function categoryLabel(cat: NearbyVenue['localCategory']): string {
  switch (cat) {
    case 'hotel':
      return 'Hotel';
    case 'beach':
      return 'Beach';
    case 'resort':
      return 'Resort';
    case 'restaurant':
      return 'Dining';
    default:
      return cat;
  }
}

/** Avoid “Hotel hotel” when the venue name already includes the type. */
function shouldShowCategoryBadge(name: string, cat: NearbyVenue['localCategory']): boolean {
  const n = name.toLowerCase();
  const tokens: Record<NearbyVenue['localCategory'], string[]> = {
    hotel: ['hotel', 'inn', 'suites'],
    beach: ['beach', 'shore', 'coast'],
    resort: ['resort'],
    restaurant: ['dining', 'restaurant', 'salon', 'kitchen'],
  };
  return !(tokens[cat] ?? [cat]).some((t) => n.includes(t));
}

/**
 * Stable nearby picker for Configuration Deck:
 * always the same block height — title, one-line hint, two side-by-side chips.
 */
export default function NearbyVenueChips({
  countryName,
  venues,
  selectedName,
  filterCategory,
  loading,
  onSelect,
  className = '',
}: Props) {
  const filtered = filterCategory
    ? venues.filter((v) => v.localCategory === filterCategory)
    : venues;
  const visible = filtered.slice(0, 2);

  let hint: string;
  if (loading && !venues.length) {
    hint = 'Finding venues near you…';
  } else if (!filtered.length) {
    hint =
      filterCategory && venues.length
        ? `No ${categoryLabel(filterCategory).toLowerCase()} nearby — try another category.`
        : 'No nearby matches — type a destination above.';
  } else {
    hint = filterCategory
      ? `Tap to fill · ${categoryLabel(filterCategory).toLowerCase()}`
      : 'Tap a venue to fill Destination Name';
  }

  return (
    <div className={`space-y-1.5 min-w-0 max-w-full ${className}`}>
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate leading-none">
        {countryName ? `Near ${countryName}` : 'Local suggestions'}
      </p>
      <p className="truncate text-[11px] leading-none text-slate/80">{hint}</p>
      <div className="grid grid-cols-2 gap-2 min-w-0">
        {Array.from({ length: 2 }, (_, i) => {
          const v = visible[i];
          if (!v) {
            return (
              <div
                key={`slot-${i}`}
                className="h-9 rounded-full border border-navy/8 bg-champagne/50"
                aria-hidden
              />
            );
          }
          const active = selectedName === v.name;
          const showBadge = shouldShowCategoryBadge(v.name, v.localCategory);
          return (
            <button
              key={v.id}
              type="button"
              title={v.name}
              onClick={() => onSelect(v)}
              className={`flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
                active
                  ? 'border-navy bg-navy text-white'
                  : 'border-navy/10 bg-white/50 text-navy hover:border-sage/40 hover:bg-white'
              }`}
            >
              <span className="min-w-0 truncate">{v.name}</span>
              {showBadge && (
                <span className="shrink-0 text-[9px] font-mono uppercase tracking-wide opacity-55">
                  {categoryLabel(v.localCategory)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function venueToLocalCategory(cat: NearbyVenue['localCategory']): LocalCategory {
  return cat;
}
