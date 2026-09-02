import { ServicePackage, Testimonial } from '../landingTypes';

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'full-service',
    name: 'Full-Service Design & Planning',
    tagline: 'Comprehensive end-to-end luxury event creation from concept to execution.',
    startingPrice: 8500,
    recommendedFor: 'Couples and hosts seeking a completely bespoke, stress-free luxury experience.',
    popular: true,
    features: [
      'Bespoke Event Concept & Spatial Design',
      'Comprehensive Budget & Timeline Management',
      'Vendor Scouting, Negotiation & Management',
      'Custom Floor Plans, 3D Renderings & Moodboards',
      'On-site Lead Planner + 3 Senior Assistants on Event Day',
      'Guest Logistics, Hotel Blocks & RSVP Portal',
      'Rehearsal & Welcome Event Coordination'
    ]
  },
  {
    id: 'partial-design',
    name: 'Event Design & Styling',
    tagline: 'Aesthetically driven spatial design, decor curation, and atmosphere styling.',
    startingPrice: 5200,
    recommendedFor: 'Hosts with venue booked who need creative vision, floral curation & styling.',
    features: [
      'Visual Aesthetic & Color Palette Curation',
      'Tablescape, Lighting & Floral Design Curation',
      'Vendor Curation for Decor, Linen, Furniture & AV',
      'Custom Stationery & Monogram Design Direction',
      'Design Setup & Breakdown Supervision',
      'On-site Design Stylist on Event Day'
    ]
  },
  {
    id: 'month-of',
    name: 'Month-Of Coordination',
    tagline: 'Flawless execution & logistical management for your final stretch.',
    startingPrice: 3800,
    recommendedFor: 'Clients who planned their event but want a master production team to run the day.',
    features: [
      'Master Day-Of Production Schedule & Timeline',
      'Vendor Contract Review & Handover at 6 Weeks',
      'Final Walkthrough at Event Venue',
      'Ceremony & Reception Logistics Direction',
      'Lead Planner + Assistant for up to 12 Hours on Event Day',
      'Personal Guest & Bridal Party Concierge'
    ]
  },
  {
    id: 'destination',
    name: 'Destination & Multi-Day',
    tagline: 'Global event management for multi-day international luxury celebrations.',
    startingPrice: 14000,
    recommendedFor: 'Multi-day celebrations across Europe, Caribbean, or private estates.',
    features: [
      'Multi-Day Itinerary Planning (Welcome Dinner, Main Event, Farewell Brunch)',
      'International Travel, Shuttle & Villa Accommodation Logistics',
      'Bilingual On-Site Production Crew',
      'Local Cultural Curation & Regional Catering Partnerships',
      'Guest Experience Concierge App & Direct Communication'
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    clientName: 'Eleanor Vance',
    eventType: 'Napa Valley Vineyard Wedding',
    location: 'Saint Helena, CA',
    date: 'June 2025',
    quote: 'Meridian Atelier transformed our Napa Valley estate into an enchanted sanctuary. Their attention to lighting, table styling, and guest flow was absolutely unmatched. We felt like guests at our own wedding!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    eventPhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    rating: 5
  },
  {
    id: 'test-2',
    clientName: 'Marcus Chen',
    eventType: 'Synthex Global Tech Gala',
    location: 'Metropolitan Pavilion, NYC',
    date: 'October 2025',
    quote: 'The team at Meridian Atelier executed a 450-person corporate summit with military precision and editorial flair. From custom spatial mapping to mixology, every detail reinforced our luxury brand identity.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    eventPhoto: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    rating: 5
  },
  {
    id: 'test-3',
    clientName: 'Isabella Rossi',
    eventType: 'Amalfi Coast Villa Celebration',
    location: 'Ravello, Italy',
    date: 'September 2024',
    quote: 'Planning an Italian seaside celebration from New York was completely effortless thanks to Meridian Atelier. They bridged language, distance, and vendor networks flawlessly.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    eventPhoto: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
    rating: 5
  }
];
