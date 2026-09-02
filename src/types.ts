/**
 * Meridian shared types — Hub planner engine + landing helpers
 */

export type EventType = 'local' | 'overseas';
export type LocalCategory = 'hotel' | 'beach' | 'resort' | 'restaurant';
export type OverseasCategory = 'air_ticket' | 'hotel' | 'wedding_ceremony' | 'concierge';
export type CateringStyle = 'fine_dining' | 'buffet' | 'cocktail_reception' | 'themed_bbq' | 'traditional_banquet';
export type MessageStyle = 'formal' | 'romantic' | 'modern_minimalist' | 'warm_festive';

export interface PlannerInput {
  eventType: EventType;
  localCategory?: LocalCategory;
  overseasCategory?: OverseasCategory;
  guestCount: number;
  locationName: string;
  cateringStyle: CateringStyle;
  messageStyle: MessageStyle;
  targetMonth: string;
  specialNotes?: string;
}

export interface DesignerPrefill {
  eventType?: EventType;
  localCategory?: LocalCategory;
  overseasCategory?: OverseasCategory;
  guestCount?: number;
  locationName?: string;
  cateringStyle?: CateringStyle;
  messageStyle?: MessageStyle;
  targetMonth?: string;
  specialNotes?: string;
}

export interface ItineraryItem {
  time: string;
  activity: string;
  description: string;
}

export interface MenuItem {
  category: 'Appetizers' | 'Mains' | 'Desserts' | 'Beverages' | string;
  name: string;
  description: string;
}

export interface EventPlanResponse {
  title: string;
  tagline: string;
  location: string;
  estimatedBudgetRange: string;
  itinerary: ItineraryItem[];
  cateringMenu: MenuItem[];
  message: {
    invitationSubject: string;
    invitationBody: string;
    rsvpDeadlineNote: string;
  };
  weatherForecast: {
    conditions: string;
    temperatureAvg: string;
    advice: string;
    indoorContingencyNeeded: boolean;
    contingencyPlan: string;
  };
  eventChecklist: string[];
  generationSource?: 'ai' | 'fallback';
}

/** Landing Quick Match */
export type LandingEventType = 'Wedding' | 'Corporate' | 'Gala' | 'Anniversary';
export type LocationType = 'Local' | 'Destination';
export type GuestCountRange = 'under-50' | '50-150' | '150-300' | '300-plus';

export interface Venue {
  id: string;
  name: string;
  type: string;
  capacity: string;
  description: string;
  image: string;
  tag: string;
  highlights: string[];
  localCategory?: LocalCategory;
}

export interface SeasonalForecast {
  month: string;
  suitability: 'Peak' | 'Ideal' | 'Fair' | 'Not Recommended';
  tempCelsius: number;
  rainProbability: number;
  crowdLevel: 'Low' | 'Moderate' | 'High';
  note: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  event: string;
  location: string;
  rating: number;
  text: string;
  image: string;
}

export interface Dish {
  name: string;
  category: 'Appetizer' | 'Entree' | 'Dessert';
  pairing: string;
  description: string;
}

/** Package Studio (from Villa & Vale, Meridian-adapted) */
export type PackageCategory =
  | 'Weddings'
  | 'Dinners'
  | 'Activities'
  | 'Corporate'
  | 'Stays'
  | 'Transfers';
export type PackageLocation = 'Local' | 'Overseas' | 'Both';
export type LineKind = 'event' | 'experience' | 'stay' | 'transfer';

export interface EventActivity {
  id: string;
  title: string;
  description: string;
  location: PackageLocation;
  category: PackageCategory;
  basePrice: number;
  pricePerGuest: number;
  maxGuests: number;
  durationMinutes: number;
  image: string;
  features: string[];
}

/** Hotel / villa nights for Package Studio */
export interface StayOption {
  id: string;
  name: string;
  description: string;
  location: PackageLocation;
  neighborhood: string;
  nightsDefault: number;
  pricePerNight: number;
  pricePerGuestPerNight: number;
  maxGuests: number;
  image: string;
  amenities: string[];
  mapQuery: string;
}

/** Airport / venue / hotel logistics legs */
export interface TransferOption {
  id: string;
  title: string;
  description: string;
  location: PackageLocation;
  fromLabel: string;
  toLabel: string;
  basePrice: number;
  pricePerGuest: number;
  maxGuests: number;
  durationMinutes: number;
  vehicle: string;
}

/** Editable package line (distinct from narrative EventPlanResponse.itinerary) */
export interface PackageLineItem {
  id: string;
  activityId?: string;
  title: string;
  location: PackageLocation;
  category: PackageCategory;
  date: string;
  time: string;
  guests: number;
  notes: string;
  calculatedPrice: number;
  basePrice?: number;
  pricePerGuest?: number;
  venueKey?: string;
  durationMinutes?: number;
  kind?: LineKind;
  /** Stay: number of nights (price uses nights × rates). */
  nights?: number;
  /** Transfer / stay free-text endpoints. */
  fromLabel?: string;
  toLabel?: string;
  mapQuery?: string;
}
