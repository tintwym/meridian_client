/**
 * Curated local venues by ISO country code.
 * GPS scopes Local suggestions; overseas destinations stay separate.
 */

import { assignUniqueVenueImages } from './venueImages';

export type LocalVenueCategory = 'hotel' | 'beach' | 'resort' | 'restaurant';

export type CuratedVenue = {
  id: string;
  name: string;
  localCategory: LocalVenueCategory;
  city: string;
  countryCode: string;
  mapQuery: string;
  tag?: string;
  /** Stable Unsplash cover — unique within a nearby list. */
  imageUrl?: string;
};

function withVenueImages(venues: CuratedVenue[]): CuratedVenue[] {
  const images = assignUniqueVenueImages(venues);
  const base = (process.env.APP_URL || '').replace(/\/$/, '');
  return venues.map((v) => {
    const path = images[v.id];
    const imageUrl =
      !path ? undefined : path.startsWith('http') ? path : base ? `${base}${path}` : path;
    return { ...v, imageUrl };
  });
}

export type CountryVenueBucket = {
  name: string;
  venues: CuratedVenue[];
};

export const DEFAULT_VENUES: CuratedVenue[] = [
  {
    id: 'default-hotel',
    name: 'Local Premium Hotel',
    localCategory: 'hotel',
    city: 'Local',
    countryCode: 'XX',
    mapQuery: 'luxury hotel',
    tag: 'Hotel',
  },
  {
    id: 'default-beach',
    name: 'Coastal Beach Pavilion',
    localCategory: 'beach',
    city: 'Local',
    countryCode: 'XX',
    mapQuery: 'beach venue',
    tag: 'Beach',
  },
  {
    id: 'default-resort',
    name: 'Heritage Resort Estate',
    localCategory: 'resort',
    city: 'Local',
    countryCode: 'XX',
    mapQuery: 'luxury resort',
    tag: 'Resort',
  },
  {
    id: 'default-restaurant',
    name: 'Private Dining Salon',
    localCategory: 'restaurant',
    city: 'Local',
    countryCode: 'XX',
    mapQuery: 'fine dining restaurant',
    tag: 'Restaurant',
  },
];

export const VENUES_BY_COUNTRY: Record<string, CountryVenueBucket> = {
  SG: {
    name: 'Singapore',
    venues: [
      {
        id: 'sg-marina-bay-hotel',
        name: 'Marina Bay Grand Hotel',
        localCategory: 'hotel',
        city: 'Marina Bay',
        countryCode: 'SG',
        mapQuery: 'Marina Bay Sands Singapore',
        tag: 'Skyline Hotel',
      },
      {
        id: 'sg-orchard-hotel',
        name: 'Orchard Heritage Hotel',
        localCategory: 'hotel',
        city: 'Orchard',
        countryCode: 'SG',
        mapQuery: 'Orchard Road Singapore hotel',
        tag: 'City Hotel',
      },
      {
        id: 'sg-sentosa-beach',
        name: 'Sentosa Beach Pavilion',
        localCategory: 'beach',
        city: 'Sentosa',
        countryCode: 'SG',
        mapQuery: 'Sentosa Beach Singapore',
        tag: 'Island Beach',
      },
      {
        id: 'sg-east-coast-beach',
        name: 'East Coast Shore Club',
        localCategory: 'beach',
        city: 'East Coast',
        countryCode: 'SG',
        mapQuery: 'East Coast Park Singapore',
        tag: 'Coastal',
      },
      {
        id: 'sg-sentosa-resort',
        name: 'Sentosa Cove Resort',
        localCategory: 'resort',
        city: 'Sentosa',
        countryCode: 'SG',
        mapQuery: 'Sentosa Cove Singapore',
        tag: 'Island Resort',
      },
      {
        id: 'sg-botanic-resort',
        name: 'Botanic Garden Estate',
        localCategory: 'resort',
        city: 'Tanglin',
        countryCode: 'SG',
        mapQuery: 'Singapore Botanic Gardens',
        tag: 'Garden Estate',
      },
      {
        id: 'sg-robertson-dining',
        name: 'Robertson Quay Private Dining',
        localCategory: 'restaurant',
        city: 'Robertson Quay',
        countryCode: 'SG',
        mapQuery: 'Robertson Quay Singapore restaurant',
        tag: 'Waterfront Dining',
      },
      {
        id: 'sg-chinatown-salon',
        name: 'Chinatown Heritage Salon',
        localCategory: 'restaurant',
        city: 'Chinatown',
        countryCode: 'SG',
        mapQuery: 'Chinatown Singapore fine dining',
        tag: 'Heritage Dining',
      },
    ],
  },
  VN: {
    name: 'Vietnam',
    venues: [
      {
        id: 'vn-hcmc-hotel',
        name: 'Saigon Riverside Hotel',
        localCategory: 'hotel',
        city: 'Ho Chi Minh City',
        countryCode: 'VN',
        mapQuery: 'Park Hyatt Saigon',
        tag: 'City Hotel',
      },
      {
        id: 'vn-hanoi-hotel',
        name: 'Hanoi Metropole Hotel',
        localCategory: 'hotel',
        city: 'Hanoi',
        countryCode: 'VN',
        mapQuery: 'Sofitel Legend Metropole Hanoi',
        tag: 'Heritage Hotel',
      },
      {
        id: 'vn-danang-beach',
        name: 'Da Nang Beach Gallery',
        localCategory: 'beach',
        city: 'Da Nang',
        countryCode: 'VN',
        mapQuery: 'My Khe Beach Da Nang',
        tag: 'Beach',
      },
      {
        id: 'vn-nhatrang-beach',
        name: 'Nha Trang Shore Terrace',
        localCategory: 'beach',
        city: 'Nha Trang',
        countryCode: 'VN',
        mapQuery: 'Nha Trang Beach',
        tag: 'Coastal',
      },
      {
        id: 'vn-phuquoc-resort',
        name: 'Phu Quoc Island Resort',
        localCategory: 'resort',
        city: 'Phu Quoc',
        countryCode: 'VN',
        mapQuery: 'Phu Quoc resort Vietnam',
        tag: 'Island Resort',
      },
      {
        id: 'vn-halong-resort',
        name: 'Ha Long Bay Resort',
        localCategory: 'resort',
        city: 'Ha Long',
        countryCode: 'VN',
        mapQuery: 'Ha Long Bay resort',
        tag: 'Bay Resort',
      },
      {
        id: 'vn-hanoi-dining',
        name: 'Old Quarter Private Dining',
        localCategory: 'restaurant',
        city: 'Hanoi',
        countryCode: 'VN',
        mapQuery: 'Hanoi Old Quarter restaurant',
        tag: 'Heritage Dining',
      },
      {
        id: 'vn-saigon-dining',
        name: 'District 1 Culinary Salon',
        localCategory: 'restaurant',
        city: 'Ho Chi Minh City',
        countryCode: 'VN',
        mapQuery: 'District 1 Ho Chi Minh City restaurant',
        tag: 'City Dining',
      },
    ],
  },
  MY: {
    name: 'Malaysia',
    venues: [
      {
        id: 'my-kl-hotel',
        name: 'Kuala Lumpur Tower Hotel',
        localCategory: 'hotel',
        city: 'Kuala Lumpur',
        countryCode: 'MY',
        mapQuery: 'Kuala Lumpur luxury hotel',
        tag: 'City Hotel',
      },
      {
        id: 'my-langkawi-beach',
        name: 'Langkawi Beach Club',
        localCategory: 'beach',
        city: 'Langkawi',
        countryCode: 'MY',
        mapQuery: 'Langkawi Beach',
        tag: 'Island Beach',
      },
      {
        id: 'my-penang-resort',
        name: 'Penang Hillside Resort',
        localCategory: 'resort',
        city: 'Penang',
        countryCode: 'MY',
        mapQuery: 'Penang resort Malaysia',
        tag: 'Resort',
      },
      {
        id: 'my-kl-dining',
        name: 'Bukit Bintang Dining Room',
        localCategory: 'restaurant',
        city: 'Kuala Lumpur',
        countryCode: 'MY',
        mapQuery: 'Bukit Bintang restaurant',
        tag: 'Dining',
      },
    ],
  },
  TH: {
    name: 'Thailand',
    venues: [
      {
        id: 'th-bkk-hotel',
        name: 'Bangkok Riverside Hotel',
        localCategory: 'hotel',
        city: 'Bangkok',
        countryCode: 'TH',
        mapQuery: 'Bangkok riverside luxury hotel',
        tag: 'City Hotel',
      },
      {
        id: 'th-phuket-beach',
        name: 'Phuket Beach Pavilion',
        localCategory: 'beach',
        city: 'Phuket',
        countryCode: 'TH',
        mapQuery: 'Phuket Beach',
        tag: 'Beach',
      },
      {
        id: 'th-chiangmai-resort',
        name: 'Chiang Mai Valley Resort',
        localCategory: 'resort',
        city: 'Chiang Mai',
        countryCode: 'TH',
        mapQuery: 'Chiang Mai resort',
        tag: 'Resort',
      },
      {
        id: 'th-bkk-dining',
        name: 'Sukhumvit Private Dining',
        localCategory: 'restaurant',
        city: 'Bangkok',
        countryCode: 'TH',
        mapQuery: 'Sukhumvit fine dining Bangkok',
        tag: 'Dining',
      },
    ],
  },
  ID: {
    name: 'Indonesia',
    venues: [
      {
        id: 'id-jkt-hotel',
        name: 'Jakarta Grand Hotel',
        localCategory: 'hotel',
        city: 'Jakarta',
        countryCode: 'ID',
        mapQuery: 'Jakarta luxury hotel',
        tag: 'City Hotel',
      },
      {
        id: 'id-bali-beach',
        name: 'Seminyak Beach Club',
        localCategory: 'beach',
        city: 'Bali',
        countryCode: 'ID',
        mapQuery: 'Seminyak Beach Bali',
        tag: 'Beach',
      },
      {
        id: 'id-ubud-resort',
        name: 'Ubud Jungle Resort',
        localCategory: 'resort',
        city: 'Ubud',
        countryCode: 'ID',
        mapQuery: 'Ubud resort Bali',
        tag: 'Resort',
      },
      {
        id: 'id-bali-dining',
        name: 'Canggu Culinary Terrace',
        localCategory: 'restaurant',
        city: 'Canggu',
        countryCode: 'ID',
        mapQuery: 'Canggu restaurant Bali',
        tag: 'Dining',
      },
    ],
  },
};

/** Prefer Singapore-weighted SEA defaults when country unknown / GPS denied. */
export const SEA_FALLBACK_COUNTRY = 'SG';

export function normalizeCountryCode(code?: string | null): string | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  if (c.length === 2) return c;
  const names: Record<string, string> = {
    SINGAPORE: 'SG',
    VIETNAM: 'VN',
    'VIET NAM': 'VN',
    MALAYSIA: 'MY',
    THAILAND: 'TH',
    INDONESIA: 'ID',
  };
  return names[c] ?? null;
}

export function resolveNearbyVenues(opts: {
  country?: string | null;
  city?: string | null;
}): {
  countryCode: string;
  countryName: string;
  venues: CuratedVenue[];
  source: 'country' | 'fallback';
} {
  const code = normalizeCountryCode(opts.country);
  const bucket = code ? VENUES_BY_COUNTRY[code] : undefined;

  if (bucket) {
    const city = opts.city?.trim().toLowerCase();
    let venues = bucket.venues;
    if (city) {
      const boosted = [
        ...venues.filter((v) => v.city.toLowerCase().includes(city) || city.includes(v.city.toLowerCase())),
        ...venues.filter((v) => !v.city.toLowerCase().includes(city) && !city.includes(v.city.toLowerCase())),
      ];
      venues = boosted;
    }
    return {
      countryCode: code!,
      countryName: bucket.name,
      venues: withVenueImages(venues),
      source: 'country',
    };
  }

  const fallback = VENUES_BY_COUNTRY[SEA_FALLBACK_COUNTRY];
  const fallbackVenues = fallback.venues.length ? fallback.venues : DEFAULT_VENUES;
  return {
    countryCode: SEA_FALLBACK_COUNTRY,
    countryName: fallback.name,
    venues: withVenueImages(fallbackVenues),
    source: 'fallback',
  };
}
