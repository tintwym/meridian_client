import type { EventActivity } from '../types';

export const EXPERIENCES: EventActivity[] = [
  {
    id: 'x1',
    title: 'Private Chef Tasting Dinner',
    description:
      'A Michelin-trained chef designs a multi-course tasting menu with regional wine pairings.',
    location: 'Both',
    category: 'Dinners',
    basePrice: 1800,
    pricePerGuest: 145,
    maxGuests: 40,
    durationMinutes: 180,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=600',
    features: [
      'Bespoke tasting menu',
      'Sommelier wine pairing',
      'Dedicated service team',
      'Allergy customization',
    ],
  },
  {
    id: 'x2',
    title: 'Floral & Décor Atelier',
    description:
      'Seasonal floral architecture, tablescapes, and ambient lighting designed for your venue.',
    location: 'Both',
    category: 'Activities',
    basePrice: 3200,
    pricePerGuest: 25,
    maxGuests: 300,
    durationMinutes: 360,
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600',
    features: [
      'Ceremony & reception florals',
      'Tablescape design',
      'Ambient lighting plan',
      'On-site install crew',
    ],
  },
  {
    id: 'x3',
    title: 'Live Ensemble Evening',
    description:
      'Curated jazz trio or string quartet with sound engineering for cocktail and dinner hours.',
    location: 'Both',
    category: 'Activities',
    basePrice: 1400,
    pricePerGuest: 0,
    maxGuests: 300,
    durationMinutes: 180,
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600',
    features: [
      'Professional musicians',
      'Sound engineering',
      'Repertoire consultation',
      '3-hour performance block',
    ],
  },
  {
    id: 'x4',
    title: 'Guest Welcome Concierge',
    description:
      'Airport greeting, gift amenities, and day-of guest liaison for VIP arrivals.',
    location: 'Overseas',
    category: 'Activities',
    basePrice: 900,
    pricePerGuest: 35,
    maxGuests: 80,
    durationMinutes: 240,
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cab0?auto=format&fit=crop&q=80&w=600',
    features: [
      'Airport meet & greet',
      'Welcome amenity kits',
      'Day-of guest liaison',
      'Transfer coordination notes',
    ],
  },
];
