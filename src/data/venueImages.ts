/**
 * Unique covers for Local venue cards — stable per venue id.
 * Served from `/venues/*.jpg` (bundled under client/public/venues).
 */

import type { LocalCategory } from '../types';

const HOTEL = [
  '/venues/venue_vn_hanoi.jpg',
  '/venues/venue_th_bkk.jpg',
  '/venues/venue_vn_hcmc.jpg',
  '/venues/venue_id_jkt.jpg',
  '/venues/venue_my_kl.jpg',
  '/venues/venue_sg_orchard.jpg',
];

const BEACH = [
  '/venues/venue_sg_east_coast.jpg',
  '/venues/venue_vn_danang.jpg',
  '/venues/venue_vn_nhatrang.jpg',
  '/venues/venue_my_langkawi.jpg',
  '/venues/venue_th_phuket.jpg',
  '/venues/venue_id_bali.jpg',
];

const RESORT = [
  '/venues/venue_vn_phuquoc.jpg',
  '/venues/venue_sg_sentosa_resort.jpg',
  '/venues/venue_vn_halong.jpg',
  '/venues/venue_my_penang.jpg',
  '/venues/venue_th_chiangmai.jpg',
  '/venues/venue_id_ubud.jpg',
];

const RESTAURANT = [
  '/venues/venue_vn_hanoi_dine.jpg',
  '/venues/venue_sg_robertson.jpg',
  '/venues/venue_sg_chinatown.jpg',
  '/venues/venue_vn_saigon_dine.jpg',
  '/venues/venue_my_kl_dine.jpg',
  '/venues/venue_th_bkk_dine.jpg',
];

const POOLS: Record<LocalCategory, string[]> = {
  hotel: HOTEL,
  beach: BEACH,
  resort: RESORT,
  restaurant: RESTAURANT,
};

const ALL_IMAGES = [...HOTEL, ...BEACH, ...RESORT, ...RESTAURANT];

/** Stable, place-specific covers — unique within each country catalog. */
export const VENUE_IMAGE_BY_ID: Record<string, string> = {
  'sg-marina-bay-hotel': '/venues/venue_sg_marina.jpg',
  'sg-orchard-hotel': '/venues/venue_sg_orchard.jpg',
  'sg-sentosa-beach': '/venues/venue_sg_sentosa_beach.jpg',
  'sg-east-coast-beach': '/venues/venue_sg_east_coast.jpg',
  'sg-sentosa-resort': '/venues/venue_sg_sentosa_resort.jpg',
  'sg-botanic-resort': '/venues/venue_sg_botanic.jpg',
  'sg-robertson-dining': '/venues/venue_sg_robertson.jpg',
  'sg-chinatown-salon': '/venues/venue_sg_chinatown.jpg',

  'vn-hcmc-hotel': '/venues/venue_vn_hcmc.jpg',
  'vn-hanoi-hotel': '/venues/venue_vn_hanoi.jpg',
  'vn-danang-beach': '/venues/venue_vn_danang.jpg',
  'vn-nhatrang-beach': '/venues/venue_vn_nhatrang.jpg',
  'vn-phuquoc-resort': '/venues/venue_vn_phuquoc.jpg',
  'vn-halong-resort': '/venues/venue_vn_halong.jpg',
  'vn-hanoi-dining': '/venues/venue_vn_hanoi_dine.jpg',
  'vn-saigon-dining': '/venues/venue_vn_saigon_dine.jpg',

  'my-kl-hotel': '/venues/venue_my_kl.jpg',
  'my-langkawi-beach': '/venues/venue_my_langkawi.jpg',
  'my-penang-resort': '/venues/venue_my_penang.jpg',
  'my-kl-dining': '/venues/venue_my_kl_dine.jpg',

  'th-bkk-hotel': '/venues/venue_th_bkk.jpg',
  'th-phuket-beach': '/venues/venue_th_phuket.jpg',
  'th-chiangmai-resort': '/venues/venue_th_chiangmai.jpg',
  'th-bkk-dining': '/venues/venue_th_bkk_dine.jpg',

  'id-jkt-hotel': '/venues/venue_id_jkt.jpg',
  'id-bali-beach': '/venues/venue_id_bali.jpg',
  'id-ubud-resort': '/venues/venue_id_ubud.jpg',
  'id-bali-dining': '/venues/venue_id_bali_dine.jpg',

  'default-hotel': HOTEL[0],
  'default-beach': BEACH[0],
  'default-resort': RESORT[0],
  'default-restaurant': RESTAURANT[0],
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function imageForVenue(id: string, category: LocalCategory): string {
  const pinned = VENUE_IMAGE_BY_ID[id];
  if (pinned) return pinned;
  const pool = POOLS[category];
  return pool[hashId(id) % pool.length];
}

/** Assign covers for a visible row — never repeat an image in the same set. */
export function assignUniqueVenueImages(
  venues: { id: string; localCategory: LocalCategory }[],
): Record<string, string> {
  const used = new Set<string>();
  const out: Record<string, string> = {};

  for (const v of venues) {
    let img = imageForVenue(v.id, v.localCategory);
    if (used.has(img)) {
      const pool = POOLS[v.localCategory];
      img =
        pool.find((c) => !used.has(c)) ??
        ALL_IMAGES.find((c) => !used.has(c)) ??
        img;
    }
    used.add(img);
    out[v.id] = img;
  }

  return out;
}

const CAPACITY_BY_CATEGORY: Record<LocalCategory, string[]> = {
  hotel: ['80 – 400 guests', '120 – 500 guests', '60 – 280 guests', '100 – 450 guests'],
  beach: ['40 – 180 guests', '30 – 150 guests', '50 – 220 guests', '25 – 120 guests'],
  resort: ['50 – 250 guests', '70 – 320 guests', '40 – 200 guests', '90 – 350 guests'],
  restaurant: ['20 – 80 guests', '30 – 100 guests', '16 – 60 guests', '40 – 120 guests'],
};

export function capacityForVenue(id: string, category: LocalCategory): string {
  const options = CAPACITY_BY_CATEGORY[category];
  return options[hashId(id) % options.length];
}

const BLURBS: Record<LocalCategory, string[]> = {
  hotel: [
    'Ballroom and skyline suites ready for polished receptions.',
    'Grand lobby arrival with planner-vetted banquet floors.',
    'City landmark stay with private event floors.',
  ],
  beach: [
    'Shoreline ceremony light with tide-aware contingency plans.',
    'Open-air pavilion by the water — ideal for sunset vows.',
    'Coastal club setting with soft sand and evening breeze.',
  ],
  resort: [
    'Estate grounds and pool terraces for multi-day gatherings.',
    'Secluded resort campus with on-site lodging for guests.',
    'Garden and villa spaces designed for weekend celebrations.',
  ],
  restaurant: [
    'Private dining rooms with chef-led tasting menus.',
    'Intimate salon seating for seated dinners and toasts.',
    'Curated culinary rooms with wine-pairing service.',
  ],
};

export function blurbForVenue(
  id: string,
  category: LocalCategory,
  city: string,
  countryName?: string | null,
): string {
  const line = BLURBS[category][hashId(id) % BLURBS[category].length];
  const place = countryName ? `${city}, ${countryName}` : city;
  return `${line} Located in ${place}.`;
}
