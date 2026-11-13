export type EventCategory = 'All' | 'Weddings' | 'Corporate' | 'Private Soirées' | 'Destination';

export interface PortfolioItem {
  id: string;
  title: string;
  category: EventCategory;
  subtitle: string;
  location: string;
  guestCount: number;
  year: string;
  coverImage: string;
  galleryImages: string[];
  description: string;
  themePalette: string[];
  keyHighlights: string[];
  vendorPartners: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

export interface TimeSlot {
  id: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
}

export interface Testimonial {
  id: string;
  clientName: string;
  eventType: string;
  location: string;
  date: string;
  quote: string;
  avatar: string;
  eventPhoto: string;
  rating: number;
}
