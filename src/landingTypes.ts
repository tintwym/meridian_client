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

export interface BookingFormData {
  eventType: string;
  guestCount: number;
  budgetRange: string;
  selectedDate: string;
  selectedTimeSlot: string;
  consultationType: 'Virtual Zoom' | 'In-Person Studio' | 'On-Site Venue';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventLocation: string;
  specialRequests: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  tagline: string;
  startingPrice: number;
  recommendedFor: string;
  features: string[];
  popular?: boolean;
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
