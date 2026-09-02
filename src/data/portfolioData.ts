import { PortfolioItem } from '../landingTypes';

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'portfolio-1',
    title: 'Celestial Garden Gala',
    category: 'Weddings',
    subtitle: 'An ethereal romantic outdoor celebration amidst centuries-old cypress trees.',
    location: 'Napa Valley, California',
    guestCount: 220,
    year: '2025',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A 3-day luxury wedding experience transforming a private vineyard estate into a fairy-tale garden with custom crystal chandeliers, hanging white orchids, bespoke velvet table linens, and a multi-course Michelin-inspired wine pairing menu.',
    themePalette: ['#1C2D27', '#E5D3B3', '#D4AF37', '#FAF7F2'],
    keyHighlights: [
      'Custom 80ft glass-canopy pavilion over main lawn',
      'Hand-crafted calligraphed seating installation with live fountain background',
      'Midnight espresso martini lounge and live 12-piece swing big band'
    ],
    vendorPartners: ['Bloom & Blossom Florals', 'Napa Culinary Group', 'Lumière Lighting Design', 'Acoustic Soul Orchestra'],
    testimonial: {
      quote: "Meridian Atelier turned our vision into something far beyond our wildest dreams. Every single guest was mesmerized from arrival to the midnight fireworks.",
      author: "Eleanor & Sterling Vance",
      role: "Bride & Groom"
    }
  },
  {
    id: 'portfolio-2',
    title: 'Metropolis Midnight Gala',
    category: 'Corporate',
    subtitle: 'Annual Tech Innovation Summit & Executive Black-Tie Dinner.',
    location: 'Metropolitan Pavilion, New York City',
    guestCount: 450,
    year: '2025',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An immersive black-tie corporate award gala blending high-tech projection mapping, kinetic ceiling lights, bespoke marble bar stations, and an intimate keynote presentation arena.',
    themePalette: ['#0F172A', '#38BDF8', '#C084FC', '#0284C7'],
    keyHighlights: [
      '360-degree interactive spatial video wall showcasing brand milestones',
      'Custom mixology bars featuring smoke-infused signature cocktails',
      'Private VIP lounge setup with soundproof acoustical paneling'
    ],
    vendorPartners: ['AV Apex NYC', 'Bar Chemistry', 'Gotham Caterers', 'Modus Visuals'],
    testimonial: {
      quote: "Flawless execution under tight time constraints. Meridian Atelier handled 450 VIP guests seamlessly and created our company's most talked-about event in a decade.",
      author: "Marcus Chen",
      role: "VP of Global Events, Synthex Corp"
    }
  },
  {
    id: 'portfolio-3',
    title: 'The Riviera Sunlit Soirée',
    category: 'Destination',
    subtitle: 'A Mediterranean cliffside milestone birthday weekend.',
    location: 'Amalfi Coast, Italy',
    guestCount: 85,
    year: '2024',
    coverImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A 50th birthday celebration perched atop Amalfi cliffs overlooking the Tyrrhenian Sea. Featuring cascading lemon garland tablescapes, traditional Italian musicians, sunset yacht welcome parties, and open-air candlelit dining.',
    themePalette: ['#0369A1', '#F59E0B', '#FFFBEB', '#78350F'],
    keyHighlights: [
      'Private villa rental management and guest luxury transfer logistics',
      'Custom lemon grove long table arrangement with hand-painted Amalfi tiles',
      'Live tenor performance during candlelit dessert service'
    ],
    vendorPartners: ['Amalfi Eventi', 'Positano Strings', 'Ristorante Belvedere', 'Solaro Yacht Transfers'],
    testimonial: {
      quote: "Planning a destination event across oceans felt daunting until Meridian Atelier stepped in. Every single detail was pure perfection.",
      author: "Isabella Rossi",
      role: "Host"
    }
  },
  {
    id: 'portfolio-4',
    title: 'Velvet Nocturne Masquerade',
    category: 'Private Soirées',
    subtitle: 'Intimate winter solstice dinner and costume ball.',
    location: 'Private Historic Mansion, Boston',
    guestCount: 60,
    year: '2024',
    coverImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An moody, decadent winter solstice ball in a restored 19th-century mahogany mansion. Dark burgundy floral walls, golden candelabras, opera vocalists, and a bespoke champagne tower setup.',
    themePalette: ['#450A0A', '#1C1917', '#B45309', '#F5F5F4'],
    keyHighlights: [
      'Custom Venetian mask styling station for guests upon entrance',
      'Five-tier vintage champagne tower with vintage Dom Pérignon',
      'Surprise acoustic harpist performance in the conservatory'
    ],
    vendorPartners: ['Beacon Hill Floral', 'Boston Opera Quartet', 'Couture Catering'],
    testimonial: {
      quote: "The atmosphere was dark, mysterious, and effortlessly glamorous. Meridian Atelier created an unforgettable night of romance and mystery.",
      author: "Dr. Arthur Pendelton",
      role: "Host"
    }
  },
  {
    id: 'portfolio-5',
    title: 'Meridian Atelier Avant-Garde Fashion Launch',
    category: 'Corporate',
    subtitle: 'Spring Haute Couture runway show and private launch dinner.',
    location: 'SoHo Gallery Space, New York',
    guestCount: 180,
    year: '2025',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'High-contrast minimalist runway installation with matte black reflective floors, architectural floral monoliths, and a sleek modern lounge for post-show press interviews.',
    themePalette: ['#09090B', '#E2E8F0', '#94A3B8', '#000000'],
    keyHighlights: [
      '60ft mirrored runway with embedded under-floor LED striping',
      'Custom fragrance diffusion throughout the venue space',
      'Monochromatic caviar & champagne tasting bar'
    ],
    vendorPartners: ['Metropolitan Runway Productions', 'Scent & Vision Lab', 'Noir Catering'],
    testimonial: {
      quote: "Pure chic elegance. Meridian Atelier understood our brand DNA instantly and elevated our runway into an editorial piece of art.",
      author: "Camille Laurent",
      role: "Creative Director"
    }
  },
  {
    id: 'portfolio-6',
    title: 'Serenata Estate Wedding',
    category: 'Weddings',
    subtitle: 'Classic timeless romance with white peony arches and golden hour dining.',
    location: 'Charlottesville, Virginia',
    guestCount: 150,
    year: '2025',
    coverImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A classic Southern estate wedding featuring lush white garden roses, personalized monogrammed linens, gold chargers, and a transparent tent structure surrounded by glowing oak trees.',
    themePalette: ['#334155', '#CBD5E1', '#E2E8F0', '#FFFFFF'],
    keyHighlights: [
      'Monogrammed linen napkins hand-stitched for every guest',
      'Transparent sailcloth tent with hanging greenery chandeliers',
      'Custom gelato cart and bourbon tasting station'
    ],
    vendorPartners: ['Virginia Greenery', 'Southern Charm Catering', 'Old Dominion Strings'],
    testimonial: {
      quote: "Working with Meridian Atelier was the best decision of our wedding planning journey. Stress-free and breathtakingly gorgeous!",
      author: "Claire & Harrison Brooks",
      role: "Bride & Groom"
    }
  }
];
