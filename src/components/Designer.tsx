import { useState, useEffect, FormEvent } from 'react';
import {
  Compass,
  MapPin,
  Utensils,
  MessageSquare,
  Calendar,
  CloudSun,
  CheckSquare,
  Sparkles,
  Copy,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  Plane,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';
import {
  EventPlanResponse,
  EventType,
  LocalCategory,
  OverseasCategory,
  CateringStyle,
  MessageStyle,
  DesignerPrefill,
} from '../types';
import MeridianSelect from './MeridianSelect';
import PackageStudio from './PackageStudio';
import { evaluateOutdoorWeatherRisks } from '../lib/weatherRisk';
import { fetchWeather, generateMoodBoard, generatePlan } from '../api';
import type { PlannerInput } from '../types';
import NearbyVenueChips, { venueToLocalCategory } from './NearbyVenueChips';
import { useNearbyVenues } from '../hooks/useNearbyVenues';
import { useInViewOnce } from '../hooks/useInViewOnce';
import beachResortImg from '../assets/images/beach_resort_1784103426732.jpg';
import hotelBallroomImg from '../assets/images/hotel_ballroom_1784103443070.jpg';
import diningHallImg from '../assets/images/dining_hall_1784103456507.jpg';
import heroCoverImg from '../assets/images/hero_cover_1784103409273.jpg';
import { imageSrc } from '../lib/imageSrc';

const IMAGES = {
  beach: beachResortImg,
  resort: beachResortImg,
  hotel: hotelBallroomImg,
  restaurant: diningHallImg,
  hero: heroCoverImg,
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LOCAL_CATEGORIES: { key: LocalCategory; label: string }[] = [
  { key: 'beach', label: 'Pristine Beach' },
  { key: 'resort', label: 'Luxury Resort' },
  { key: 'hotel', label: 'Grand Hotel' },
  { key: 'restaurant', label: 'Fine Dining' },
];

const OVERSEAS_CATEGORIES: { key: OverseasCategory; label: string }[] = [
  { key: 'wedding_ceremony', label: 'Vow Ceremony' },
  { key: 'air_ticket', label: 'Air & VIP' },
  { key: 'hotel', label: 'Hotel Stays' },
  { key: 'concierge', label: 'Full Concierge' },
];

const CATERING_OPTIONS: { value: CateringStyle; label: string }[] = [
  { value: 'fine_dining', label: 'Bespoke Fine Dining Experience' },
  { value: 'buffet', label: 'Curated Gastronomic Buffet' },
  { value: 'cocktail_reception', label: 'High-End Cocktail and Canapes' },
  { value: 'themed_bbq', label: 'Beachside Artisanal Wood-Fired BBQ' },
  { value: 'traditional_banquet', label: 'Sovereign Traditional Banquet' },
];

const MESSAGE_STYLES: { key: MessageStyle; label: string }[] = [
  { key: 'romantic', label: 'Romantic and Poetic' },
  { key: 'formal', label: 'Formal and Grand' },
  { key: 'modern_minimalist', label: 'Minimalist' },
  { key: 'warm_festive', label: 'Warm and Festive' },
];

type BudgetTier = 'standard' | 'luxury' | 'ultra_luxury';

interface DesignerProps {
  prefill?: DesignerPrefill | null;
  prefillKey?: number;
  onPlanGenerated?: (plan: EventPlanResponse) => void;
  onRequestConsult?: (plan: EventPlanResponse | null) => void;
}

export default function Designer({
  prefill,
  prefillKey = 0,
  onPlanGenerated,
  onRequestConsult,
}: DesignerProps) {
  const [eventType, setEventType] = useState<EventType>('local');
  const [localCategory, setLocalCategory] = useState<LocalCategory>('beach');
  const [overseasCategory, setOverseasCategory] = useState<OverseasCategory>('wedding_ceremony');
  const [locationName, setLocationName] = useState('');
  const [guestCount, setGuestCount] = useState(100);
  const [cateringStyle, setCateringStyle] = useState<CateringStyle>('fine_dining');
  const [messageStyle, setMessageStyle] = useState<MessageStyle>('romantic');
  const [targetMonth, setTargetMonth] = useState('September');
  const [specialNotes, setSpecialNotes] = useState('');
  const [designerRef, designerInView] = useInViewOnce<HTMLElement>('120px 0px');
  // Only request location when the deck is on screen and Local is selected.
  const nearby = useNearbyVenues(designerInView && eventType === 'local');

  const [plan, setPlan] = useState<EventPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const [budgetTier, setBudgetTier] = useState<BudgetTier>('luxury');
  const [includeVenue, setIncludeVenue] = useState(true);
  const [includeCatering, setIncludeCatering] = useState(true);
  const [includeDecor, setIncludeDecor] = useState(true);
  const [includeEntertainment, setIncludeEntertainment] = useState(true);
  const [includeLogistics, setIncludeLogistics] = useState(true);
  const [includeCoordinator, setIncludeCoordinator] = useState(true);

  const [moodBoardUrl, setMoodBoardUrl] = useState<string | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);

  const [liveWeather, setLiveWeather] = useState<{
    currentTemp: number;
    condition: string;
    humidity: number;
    windSpeed: string;
    forecast: { day: string; temp: number; condition: string }[];
    note?: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.eventType !== undefined) setEventType(prefill.eventType);
    if (prefill.localCategory !== undefined) setLocalCategory(prefill.localCategory);
    if (prefill.overseasCategory !== undefined) setOverseasCategory(prefill.overseasCategory);
    if (prefill.guestCount !== undefined) setGuestCount(prefill.guestCount);
    if (prefill.locationName !== undefined) setLocationName(prefill.locationName);
    if (prefill.cateringStyle !== undefined) setCateringStyle(prefill.cateringStyle);
    if (prefill.messageStyle !== undefined) setMessageStyle(prefill.messageStyle);
    if (prefill.targetMonth !== undefined) setTargetMonth(prefill.targetMonth);
    if (prefill.specialNotes !== undefined) setSpecialNotes(prefill.specialNotes);
  }, [prefillKey, prefill]);

  const getBudgetBreakdown = () => {
    let venueBase = 5000;
    if (eventType === 'local') {
      if (localCategory === 'beach') venueBase = 3500;
      else if (localCategory === 'hotel') venueBase = 7500;
      else if (localCategory === 'restaurant') venueBase = 4000;
      else if (localCategory === 'resort') venueBase = 5500;
    } else {
      if (overseasCategory === 'air_ticket') venueBase = 2000;
      else if (overseasCategory === 'hotel') venueBase = 8500;
      else if (overseasCategory === 'wedding_ceremony') venueBase = 10000;
      else if (overseasCategory === 'concierge') venueBase = 12000;
    }

    let cateringPerHead = 80;
    if (cateringStyle === 'fine_dining') cateringPerHead = 150;
    else if (cateringStyle === 'themed_bbq') cateringPerHead = 80;
    else if (cateringStyle === 'buffet') cateringPerHead = 60;
    else if (cateringStyle === 'traditional_banquet') cateringPerHead = 100;

    const logisticsPerHead = eventType === 'local' ? 40 : 300;
    const decorBase = eventType === 'local' ? 3000 : 6500;
    const entertainmentBase = eventType === 'local' ? 2000 : 4500;
    const coordinatorBase = eventType === 'local' ? 1500 : 3500;

    let multiplier = 1.0;
    if (budgetTier === 'luxury') multiplier = 1.5;
    else if (budgetTier === 'ultra_luxury') multiplier = 2.3;

    const rawVenue = includeVenue ? venueBase * multiplier : 0;
    const rawCatering = includeCatering ? cateringPerHead * guestCount * multiplier : 0;
    const rawLogistics = includeLogistics ? logisticsPerHead * guestCount * multiplier : 0;
    const rawDecor = includeDecor ? decorBase * multiplier : 0;
    const rawEntertainment = includeEntertainment ? entertainmentBase * multiplier : 0;
    const rawCoordinator = includeCoordinator ? coordinatorBase * multiplier : 0;

    const subtotal =
      rawVenue + rawCatering + rawLogistics + rawDecor + rawEntertainment + rawCoordinator;
    const contingency = Math.round(subtotal * 0.1);
    const grandTotal = subtotal + contingency;

    return {
      venue: Math.round(rawVenue),
      catering: Math.round(rawCatering),
      logistics: Math.round(rawLogistics),
      decor: Math.round(rawDecor),
      entertainment: Math.round(rawEntertainment),
      coordinator: Math.round(rawCoordinator),
      contingency,
      subtotal: Math.round(subtotal),
      grandTotal: Math.round(grandTotal),
    };
  };

  const budgetBreakdown = getBudgetBreakdown();

  const getCategoryImage = () => {
    if (eventType === 'local') {
      if (localCategory === 'beach' || localCategory === 'resort') return IMAGES.beach;
      if (localCategory === 'hotel') return IMAGES.hotel;
      if (localCategory === 'restaurant') return IMAGES.restaurant;
      return IMAGES.beach;
    }
    if (overseasCategory === 'hotel') return IMAGES.hotel;
    if (overseasCategory === 'wedding_ceremony') return IMAGES.hero;
    return IMAGES.hero;
  };

  const handleGenerate = async () => {
    setLoading(true);
    const bodyPayload: PlannerInput = {
      eventType,
      localCategory: eventType === 'local' ? localCategory : undefined,
      overseasCategory: eventType === 'overseas' ? overseasCategory : undefined,
      locationName:
        locationName ||
        (eventType === 'local' ? 'Local Premium Venue' : 'Overseas Resort Sanctuary'),
      guestCount,
      cateringStyle,
      messageStyle,
      targetMonth,
      specialNotes,
    };

    try {
      const { plan: data } = await generatePlan(bodyPayload);
      setPlan(data);
      setChecklist(data.eventChecklist || []);
      setCheckedItems({});
      onPlanGenerated?.(data);

      const proposalSection = document.getElementById('proposal-result-section');
      if (proposalSection) {
        // nearest avoids yanking the Configuration Deck out of view
        proposalSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (error) {
      console.error('Plan Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setCopyFeedback(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedText(null);
      setCopyFeedback(null);
    }, 2500);
  };

  const fetchLiveWeather = async (loc: string) => {
    setWeatherLoading(true);
    try {
      const result = await fetchWeather(loc);
      setLiveWeather({
        currentTemp: result.data.currentTemp,
        condition: result.data.condition,
        humidity: result.data.humidity,
        windSpeed: result.data.windSpeed,
        forecast: result.data.forecast || [],
        note: result.note,
      });
    } catch (err) {
      console.error('Weather fetch failed', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const generateMoodBoardImage = async () => {
    if (!plan) return;
    setMoodLoading(true);
    setMoodError(null);
    try {
      const prompt = `${plan.title}. ${plan.tagline}. Location: ${plan.location}. ${targetMonth} luxury event mood board.`;
      const result = await generateMoodBoard(prompt);
      if (result.imageUrl) {
        setMoodBoardUrl(result.imageUrl);
      } else {
        setMoodError(result.error || 'Could not generate mood board.');
      }
    } catch (err) {
      setMoodError('Mood board request failed.');
      console.error(err);
    } finally {
      setMoodLoading(false);
    }
  };

  useEffect(() => {
    if (!plan) return;
    setMoodBoardUrl(null);
    setMoodError(null);
    void fetchLiveWeather(plan.location || locationName || 'Santorini');
  }, [plan?.title, plan?.location]);

  const toggleChecklistItem = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const addCustomChecklistItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    setChecklist((prev) => [...prev, newChecklistItem.trim()]);
    setNewChecklistItem('');
  };

  return (
    <section
      ref={designerRef}
      id="designer-section"
      className="px-3 sm:px-4 md:px-8 lg:px-16 py-10 sm:py-12 md:py-20 max-w-7xl mx-auto space-y-8 sm:space-y-12"
    >
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-champagne px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs uppercase tracking-widest font-bold border border-navy/20">
          <Check className="w-4 h-4 text-sage" />
          <span>{copyFeedback}</span>
        </div>
      )}

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] uppercase tracking-[0.3em] text-sage font-mono font-bold block">
          Interactive Planning Suite
        </span>
        <h2 className="text-3xl md:text-5xl font-serif text-navy font-light">
          Bespoke <span className="italic text-sage">Proposal Generator</span>
        </h2>
        <p className="text-sm text-slate leading-relaxed">
          Toggle settings, refine logistics, and instantly draft high-fidelity proposal timelines,
          weather models, curated catering cards, and beautifully crafted message invites.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration Deck — min-w-0 keeps Local chips from widening this column */}
        <div className="lg:col-span-5 min-w-0 w-full glass-panel rounded-2xl border border-navy/10 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-navy/10 pb-4">
            <Compass className="w-5 h-5 text-sage" />
            <h3 className="text-sm uppercase tracking-wider font-bold text-navy">
              Configuration Deck
            </h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate block">
                Event Location Model
              </label>
              <div className="grid grid-cols-2 gap-2 bg-champagne p-1 border border-navy/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEventType('local')}
                  aria-pressed={eventType === 'local'}
                  className={`py-2.5 text-xs uppercase tracking-widest font-bold rounded-lg transition-colors ${
                    eventType === 'local'
                      ? 'bg-navy text-white'
                      : 'text-slate hover:bg-white/60'
                  }`}
                >
                  Local Venues
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('overseas')}
                  aria-pressed={eventType === 'overseas'}
                  className={`py-2.5 text-xs uppercase tracking-widest font-bold rounded-lg transition-colors ${
                    eventType === 'overseas'
                      ? 'bg-navy text-white'
                      : 'text-slate hover:bg-white/60'
                  }`}
                >
                  Overseas Event
                </button>
              </div>
            </div>

            {/* Fixed category shell — Local & Overseas overlaid so the deck never reflows */}
            <div className="space-y-2">
              <div className="relative h-4">
                <span
                  className={`absolute inset-x-0 text-[10px] uppercase tracking-wider font-bold text-slate leading-none ${
                    eventType === 'local' ? 'visible' : 'invisible'
                  }`}
                >
                  Local Venue Category
                </span>
                <span
                  className={`absolute inset-x-0 text-[10px] uppercase tracking-wider font-bold text-slate leading-none ${
                    eventType === 'overseas' ? 'visible' : 'invisible'
                  }`}
                >
                  Overseas Logistics Category
                </span>
              </div>
              <div className="relative h-28">
                <div
                  className={`absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 ${
                    eventType === 'local' ? 'visible' : 'invisible pointer-events-none'
                  }`}
                  aria-hidden={eventType !== 'local'}
                >
                  {LOCAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      tabIndex={eventType === 'local' ? 0 : -1}
                      onClick={() => setLocalCategory(cat.key)}
                      className={`flex h-full w-full items-center justify-center px-3 text-center text-xs font-semibold border border-navy/15 rounded-xl transition-colors ${
                        localCategory === cat.key
                          ? 'bg-champagne text-navy'
                          : 'bg-transparent text-slate hover:bg-champagne/70'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div
                  className={`absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 ${
                    eventType === 'overseas' ? 'visible' : 'invisible pointer-events-none'
                  }`}
                  aria-hidden={eventType !== 'overseas'}
                >
                  {OVERSEAS_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      tabIndex={eventType === 'overseas' ? 0 : -1}
                      onClick={() => setOverseasCategory(cat.key)}
                      className={`flex h-full w-full items-center justify-center px-3 text-center text-xs font-semibold border border-navy/15 rounded-xl transition-colors ${
                        overseasCategory === cat.key
                          ? 'bg-champagne text-navy'
                          : 'bg-transparent text-slate hover:bg-champagne/70'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex h-4 justify-between items-center gap-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate block shrink-0 leading-none">
                  Destination Name
                </label>
                <span className="text-[9px] text-sage italic font-mono truncate leading-none">
                  City, Country or Specific Resort
                </span>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage pointer-events-none" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={
                    eventType === 'local'
                      ? 'e.g. Miramar Beachfront Cove'
                      : 'e.g. Amalfi Cliffs, Italy'
                  }
                  className="h-11 w-full pl-10 pr-4 bg-champagne border border-navy/10 rounded-xl text-xs focus:outline-none focus:border-sage transition-colors text-navy"
                />
              </div>
              {/* Fixed chip shell — nearby vs popular destinations overlaid */}
              <div className="relative h-20 overflow-hidden pt-1">
                <div
                  className={`absolute inset-x-0 top-1 ${
                    eventType === 'local' ? 'visible' : 'invisible pointer-events-none'
                  }`}
                  aria-hidden={eventType !== 'local'}
                >
                  <NearbyVenueChips
                    countryName={nearby.countryName}
                    venues={nearby.venues}
                    selectedName={locationName}
                    filterCategory={localCategory}
                    loading={nearby.loading}
                    onSelect={(v) => {
                      setLocationName(v.name);
                      setLocalCategory(venueToLocalCategory(v.localCategory));
                    }}
                  />
                </div>
                <div
                  className={`absolute inset-x-0 top-1 space-y-1.5 min-w-0 ${
                    eventType === 'overseas' ? 'visible' : 'invisible pointer-events-none'
                  }`}
                  aria-hidden={eventType !== 'overseas'}
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate leading-none">
                    Popular destinations
                  </p>
                  <p className="truncate text-[11px] leading-none text-slate/80">
                    Tap to fill Destination Name
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Santorini, Greece', short: 'Santorini' },
                      { name: 'Amalfi Coast, Italy', short: 'Amalfi' },
                    ].map((dest) => {
                      const active = locationName === dest.name;
                      return (
                        <button
                          key={dest.name}
                          type="button"
                          tabIndex={eventType === 'overseas' ? 0 : -1}
                          onClick={() => setLocationName(dest.name)}
                          className={`flex h-9 w-full min-w-0 items-center justify-center rounded-full border px-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            active
                              ? 'border-navy bg-navy text-white'
                              : 'border-navy/10 bg-white/50 text-navy hover:border-sage/40 hover:bg-white'
                          }`}
                        >
                          <span className="truncate">{dest.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 items-start gap-4">
              <div className="space-y-2">
                <div className="flex h-5 items-center">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate leading-none">
                    Target Month
                  </label>
                </div>
                <MeridianSelect
                  label="Target Month"
                  value={targetMonth}
                  options={MONTHS.map((m) => ({ value: m, label: m }))}
                  onChange={setTargetMonth}
                  rounded="xl"
                  tone="champagne"
                />
              </div>

              <div className="space-y-2">
                <div className="flex h-5 items-center justify-between gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate leading-none">
                    Guests
                  </label>
                  <span className="min-w-8 text-right text-xs font-bold font-serif text-navy tabular-nums leading-none">
                    {guestCount}
                  </span>
                </div>
                <div className="flex h-11 items-center rounded-xl border border-transparent px-0.5">
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full accent-navy h-1.5 bg-sage/20 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate block">
                Culinary Presentation Style
              </label>
              <MeridianSelect
                label="Culinary Presentation Style"
                value={cateringStyle}
                options={CATERING_OPTIONS}
                onChange={setCateringStyle}
                rounded="xl"
                tone="champagne"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate block">
                Invitation Writing Mood
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MESSAGE_STYLES.map((style) => (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => setMessageStyle(style.key)}
                    className={`min-h-11 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs leading-snug text-center border border-navy/15 rounded-xl transition-colors flex items-center justify-center font-semibold ${
                      messageStyle === style.key
                        ? 'bg-sage/10 text-navy'
                        : 'bg-transparent text-slate hover:bg-champagne'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate block">
                Bespoke Requests and Notes
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Sunset view timing, allergy parameters, or live acoustic musicians during arrival..."
                className="w-full p-3 bg-champagne border border-navy/10 rounded-xl text-xs focus:outline-none focus:border-sage h-22.5 resize-none text-navy"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full min-h-14 py-4 bg-navy text-white text-xs uppercase tracking-widest font-bold hover:bg-sage transition-colors flex items-center justify-center gap-2 rounded-full shadow-lg disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-sage" />
                  <span>Curating Luxury Proposal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0 text-sage" />
                  <span>Orchestrate Custom Event</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Proposal */}
        <div id="proposal-result-section" className="lg:col-span-7 min-w-0 w-full space-y-8">
          {loading ? (
            <div className="glass-panel rounded-2xl border border-navy/10 p-16 flex flex-col items-center justify-center text-center space-y-6 shadow-sm min-h-150">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-sage/30 border-t-navy rounded-full animate-spin" />
                <Compass className="w-6 h-6 text-sage absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h4 className="font-serif text-lg text-navy">Designing the Meridian Experience</h4>
                <p className="text-xs text-slate leading-relaxed">
                  Our AI-driven event model is building specialized itinerary maps, coordinating
                  menu pairings, forecasting local weather scenarios, and drafting tailored
                  correspondence.
                </p>
              </div>
            </div>
          ) : plan ? (
            <div className="space-y-8">
              {plan.generationSource === 'fallback' && (
                <div className="glass-panel rounded-2xl border border-navy/10 border-l-4 border-l-sage p-4 text-xs text-slate flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-navy block mb-0.5">
                      High-Fidelity Event Blueprint Loaded
                    </span>
                    The live AI model is currently experiencing high demand. Our premium destination
                    template engine has rendered a high-fidelity blueprint matching your
                    specifications.
                  </div>
                </div>
              )}

              {/* Cover header */}
              <div className="glass-panel rounded-2xl border border-navy/10 overflow-hidden shadow-sm">
                <div className="h-60 relative">
                  <img
                    src={imageSrc(getCategoryImage())}
                    alt="Venue layout"
                    className="w-full h-full object-cover brightness-[0.7] contrast-[1.05]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/30 to-transparent" />
                  <div className="absolute top-4 right-4 bg-champagne/90 backdrop-blur-sm px-3.5 py-1.5 border border-navy/10 rounded-full text-[9px] uppercase tracking-widest font-bold text-navy">
                    {eventType === 'local'
                      ? `Local - ${localCategory.replace('_', ' ').toUpperCase()}`
                      : `Overseas - ${overseasCategory.replace('_', ' ').toUpperCase()}`}
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-sage font-mono font-bold">
                      Event Blueprint Proposal
                    </span>
                    <h2 className="text-xl md:text-3xl font-serif text-white">{plan.title}</h2>
                    <p className="text-xs text-white/70 italic font-light">{plan.tagline}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-navy/10 text-center border-t border-navy/10 bg-champagne/50">
                  <div className="p-4 space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-sage block font-mono font-bold">
                      Estimated Venue
                    </span>
                    <span
                      className="text-xs font-serif text-navy truncate block px-2"
                      title={plan.location}
                    >
                      {plan.location}
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-sage block font-mono font-bold">
                      Total Budget Scale
                    </span>
                    <span className="text-xs font-serif text-navy font-bold block">
                      {plan.estimatedBudgetRange}
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-sage block font-mono font-bold">
                      Guest Intimacy
                    </span>
                    <span className="text-xs font-serif text-navy block">{guestCount} Attendees</span>
                  </div>
                </div>
              </div>

              {/* Budget calculator */}
              <div className="glass-panel rounded-2xl border border-navy/10 p-6 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-navy/10 pb-4 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-sage font-bold block">
                      Interactive Cost Modeling
                    </span>
                    <h4 className="font-serif text-lg text-navy font-semibold">
                      Dynamic Budget Optimizer and Calculator
                    </h4>
                  </div>
                  <div className="flex bg-champagne p-0.5 border border-navy/10 rounded-full text-[10px] uppercase font-bold">
                    {(['standard', 'luxury', 'ultra_luxury'] as BudgetTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setBudgetTier(tier)}
                        className={`px-3 py-1.5 rounded-full transition-all ${
                          budgetTier === tier
                            ? 'bg-navy text-white shadow-sm'
                            : 'text-slate hover:text-navy'
                        }`}
                      >
                        {tier === 'ultra_luxury' ? 'Ultra-Luxe' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="uppercase font-bold tracking-wider text-sage text-[9px] font-mono">
                          Guest Intimacy Scale
                        </span>
                        <span className="font-serif font-bold text-navy">{guestCount} Guests</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full accent-navy h-1.5 bg-sage/20 rounded-full cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] font-mono text-sage">
                        <span>10 guests</span>
                        <span>500 guests</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="uppercase font-bold tracking-wider text-sage text-[9px] font-mono block mb-2">
                        Configure Cost Inclusions
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                        {[
                          { label: 'Venue Rental Fee', checked: includeVenue, set: setIncludeVenue },
                          { label: 'Bespoke Catering and Menu', checked: includeCatering, set: setIncludeCatering },
                          { label: 'VIP Travel and Logistics', checked: includeLogistics, set: setIncludeLogistics },
                          { label: 'Custom Florals and Decor', checked: includeDecor, set: setIncludeDecor },
                          { label: 'Acoustic Sound and Production', checked: includeEntertainment, set: setIncludeEntertainment },
                          { label: 'On-Site Coordination', checked: includeCoordinator, set: setIncludeCoordinator },
                        ].map(({ label, checked, set }) => (
                          <label
                            key={label}
                            className="flex items-center gap-2.5 text-xs text-slate cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => set(e.target.checked)}
                              className="accent-navy rounded"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-champagne/80 border border-navy/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase tracking-widest text-sage font-mono font-bold block border-b border-navy/10 pb-1.5">
                        Estimated Itemized Allocations
                      </span>
                      <div className="space-y-2">
                        {includeVenue && (
                          <BudgetBar
                            label="Venue Hire and Preparation"
                            amount={budgetBreakdown.venue}
                            total={budgetBreakdown.grandTotal}
                            barClass="bg-navy"
                          />
                        )}
                        {includeCatering && (
                          <BudgetBar
                            label="Premium Food and Catering"
                            amount={budgetBreakdown.catering}
                            total={budgetBreakdown.grandTotal}
                            barClass="bg-sage"
                          />
                        )}
                        {includeLogistics && (
                          <BudgetBar
                            label="VIP Travel and Global Logistics"
                            amount={budgetBreakdown.logistics}
                            total={budgetBreakdown.grandTotal}
                            barClass="bg-slate"
                          />
                        )}
                        {includeDecor && (
                          <BudgetBar
                            label="Custom Florals and Aesthetic Decor"
                            amount={budgetBreakdown.decor}
                            total={budgetBreakdown.grandTotal}
                            barClass="bg-sage/60"
                          />
                        )}
                        {(includeEntertainment || includeCoordinator || budgetBreakdown.contingency > 0) && (
                          <BudgetBar
                            label="Add-Ons and Contingency Reserve (10%)"
                            amount={
                              budgetBreakdown.entertainment +
                              budgetBreakdown.coordinator +
                              budgetBreakdown.contingency
                            }
                            total={budgetBreakdown.grandTotal}
                            barClass="bg-sage/40"
                          />
                        )}
                      </div>
                    </div>

                    <div className="border-t border-navy/10 pt-3 flex justify-between items-center bg-white/60 rounded-xl px-3.5 py-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-sage font-mono font-bold block">
                          Dynamic Grand Total
                        </span>
                        <span className="text-slate text-[10px]">Taxes and service fees included</span>
                      </div>
                      <span className="text-lg md:text-xl font-serif font-bold text-navy tracking-tight">
                        ${budgetBreakdown.grandTotal.toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary and menu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl border border-navy/10 p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-navy/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sage" />
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-navy">
                        Chronological Itinerary
                      </h4>
                    </div>
                    <span className="text-[9px] text-sage uppercase font-mono font-bold">
                      {targetMonth}
                    </span>
                  </div>
                  <div className="relative border-l border-sage/30 pl-4 ml-2 space-y-6">
                    {plan.itinerary.map((item, index) => (
                      <div key={index} className="relative group">
                        <div className="absolute -left-5.25 top-1.5 w-2.5 h-2.5 rounded-full bg-navy border-2 border-white group-hover:scale-125 transition-transform" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono tracking-tighter text-sage font-bold block">
                            {item.time}
                          </span>
                          <h5 className="text-xs uppercase font-bold text-navy tracking-wide">
                            {item.activity}
                          </h5>
                          <p className="text-[11px] text-slate leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-2xl border border-navy/10 p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center border-b border-navy/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-sage" />
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-navy">
                        Culinary Menu Design
                      </h4>
                    </div>
                    <span className="text-[9px] text-sage bg-sage/10 px-2 py-0.5 rounded-full uppercase font-mono font-bold">
                      {cateringStyle.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {plan.cateringMenu.map((menu, index) => (
                      <div
                        key={index}
                        className="border-b border-navy/5 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[8px] uppercase tracking-widest font-mono text-sage font-bold shrink-0">
                            [{menu.category}]
                          </span>
                          <span className="text-xs font-serif font-semibold text-navy tracking-wide text-right">
                            {menu.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate leading-relaxed mt-1 italic text-right">
                          {menu.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-sage/10 p-3 text-[10px] text-slate leading-relaxed italic border-l-2 border-sage rounded-r-xl mt-2">
                    Each course represents meticulously sourced local organic items designed
                    specifically for the palette of {guestCount} distinguished invitees.
                  </div>
                </div>
              </div>

              {/* Weather */}
              <div className="glass-panel rounded-2xl border border-navy/10 p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-sage" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-navy">
                      {eventType === 'local'
                        ? 'Local Weather Forecast Model'
                        : 'Overseas Weather Forecast Model'}
                    </h4>
                  </div>
                  <span className="text-[9px] text-slate bg-champagne px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-full border border-navy/10">
                    {targetMonth} Projection
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4 bg-champagne border border-navy/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-2">
                    <span className="text-3xl font-serif text-navy tracking-tight">
                      {plan.weatherForecast.temperatureAvg}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-sage font-mono font-bold">
                      {plan.weatherForecast.conditions}
                    </span>
                    <p className="text-[10px] text-slate leading-tight mt-1">
                      {plan.weatherForecast.advice}
                    </p>
                  </div>
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 bg-amber-50/70 p-2.5 border border-amber-200/50 rounded-xl text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold uppercase tracking-wider">Contingency Status:</span>{' '}
                        {plan.weatherForecast.indoorContingencyNeeded
                          ? 'Immediate indoor layout reserved.'
                          : 'Standard outdoor open-air structure is secure.'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-sage font-mono font-bold block">
                        Exclusive Contingency Plan
                      </span>
                      <p className="text-xs text-slate leading-relaxed italic">
                        &ldquo;{plan.weatherForecast.contingencyPlan}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
                {eventType === 'overseas' && (
                  <div className="mt-4 pt-4 border-t border-navy/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-champagne border border-navy/10 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-navy font-bold uppercase text-[9px] tracking-wider">
                        <Plane className="w-3.5 h-3.5 text-sage" />
                        <span>Destination Airport and Transit Forecast</span>
                      </div>
                      <p className="text-[11px] text-slate leading-relaxed">
                        Airline groups report high stability during{' '}
                        <strong>{targetMonth}</strong>. Safe weather routing minimizes delay
                        probabilities to under 4%.
                      </p>
                    </div>
                    <div className="bg-champagne border border-navy/10 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-navy font-bold uppercase text-[9px] tracking-wider">
                        <Compass className="w-3.5 h-3.5 text-sage" />
                        <span>Global Entry and Currency Outlook</span>
                      </div>
                      <p className="text-[11px] text-slate leading-relaxed">
                        Visas or travel authorization forms should be filled out 30 days prior.
                        Weather fluctuations are rare for {targetMonth}.
                      </p>
                    </div>
                  </div>
                )}
                {liveWeather && (
                  <div className="mt-4 pt-4 border-t border-navy/5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-widest text-sage font-mono font-bold">
                        Live planning estimate
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          fetchLiveWeather(plan.location || locationName || 'Santorini')
                        }
                        disabled={weatherLoading}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-navy hover:text-sage"
                      >
                        <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate">
                      <span className="bg-champagne border border-navy/10 rounded-full px-2.5 py-1">
                        {liveWeather.currentTemp}°C · {liveWeather.condition}
                      </span>
                      <span className="bg-champagne border border-navy/10 rounded-full px-2.5 py-1">
                        Humidity {liveWeather.humidity}%
                      </span>
                      <span className="bg-champagne border border-navy/10 rounded-full px-2.5 py-1">
                        Wind {liveWeather.windSpeed}
                      </span>
                      {evaluateOutdoorWeatherRisks(
                        liveWeather.humidity,
                        liveWeather.windSpeed,
                      ).map((pill) => (
                        <span
                          key={pill.id}
                          title={pill.detail}
                          className={`rounded-full px-2.5 py-1 font-semibold ${
                            pill.level === 'high'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {pill.chip}
                        </span>
                      ))}
                    </div>
                    {liveWeather.forecast.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {liveWeather.forecast.map((f) => (
                          <div
                            key={f.day}
                            className="rounded-xl border border-navy/10 bg-white p-2 text-center"
                          >
                            <p className="text-[9px] uppercase font-mono text-slate">{f.day}</p>
                            <p className="text-sm font-serif text-navy">{f.temp}°</p>
                            <p className="text-[10px] text-slate">{f.condition}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {liveWeather.note && (
                      <p className="text-[10px] text-slate italic">{liveWeather.note}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mood board */}
              <div className="glass-panel rounded-2xl border border-navy/10 p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sage" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-navy">
                      Mood Board
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={generateMoodBoardImage}
                    disabled={moodLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-navy text-white text-[10px] uppercase tracking-wider font-bold hover:bg-sage disabled:opacity-50"
                  >
                    {moodLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {moodBoardUrl ? 'Regenerate' : 'Generate Visual'}
                  </button>
                </div>
                {moodError && (
                  <p className="text-xs text-rose-600">{moodError}</p>
                )}
                {moodBoardUrl ? (
                  <img
                    src={moodBoardUrl}
                    alt="Generated mood board"
                    className="w-full rounded-xl border border-navy/10 object-cover max-h-80"
                  />
                ) : (
                  <p className="text-xs text-slate italic">
                    Generate a photorealistic luxury mood board from your proposal. Requires
                    `GEMINI_API_KEY` in the server `.env` and `npm run dev` restarted so the API is
                    live.
                  </p>
                )}
              </div>

              {/* Invitation */}
              <div className="bg-navy text-champagne rounded-2xl p-6 md:p-8 space-y-6 shadow-md border border-navy/20">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sage" />
                    <h4 className="text-[11px] uppercase tracking-widest font-bold">
                      Invitation and RSVP Copywriter
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(plan.message.invitationBody, 'Invitation Text')}
                    className="px-3 py-1.5 bg-white/10 text-champagne hover:text-white hover:bg-white/20 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all rounded-full"
                  >
                    {copiedText === 'Invitation Text' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-sage" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-sage/70" />
                        <span>Copy Invitation</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-4 font-serif">
                  <div className="space-y-1 border-b border-white/10 pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-sage font-mono font-bold block">
                      Subject Draft
                    </span>
                    <p className="text-xs md:text-sm text-champagne/90 font-sans font-medium">
                      {plan.message.invitationSubject}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-sage font-mono font-bold block mb-1">
                      Body Text
                    </span>
                    <p className="text-xs md:text-sm leading-relaxed text-champagne/80 whitespace-pre-line italic">
                      {plan.message.invitationBody}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-1 text-champagne/60 font-sans text-[11px]">
                    <span className="text-[9px] uppercase tracking-widest text-sage block font-bold">
                      RSVP Constraint
                    </span>
                    <p className="italic">{plan.message.rsvpDeadlineNote}</p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="glass-panel rounded-2xl border border-navy/10 p-6 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-navy/10 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-sage" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-navy">
                      Event Execution Checklist
                    </h4>
                  </div>
                  <span className="text-[9px] text-sage uppercase font-mono font-bold">
                    {checklist.length} Interactive Steps
                  </span>
                </div>
                <form onSubmit={addCustomChecklistItem} className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add custom planner milestone step..."
                    className="flex-1 px-3 py-2 bg-champagne border border-navy/10 rounded-xl text-xs focus:outline-none focus:border-sage transition-colors text-navy"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy text-white text-[10px] uppercase tracking-widest font-bold hover:bg-sage transition-colors flex items-center gap-1 shrink-0 rounded-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
                <div className="space-y-2">
                  {checklist.map((item, index) => (
                    <div
                      key={index}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleChecklistItem(item)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleChecklistItem(item)}
                      className={`p-3 border rounded-xl text-xs flex items-start gap-3 cursor-pointer transition-all ${
                        checkedItems[item]
                          ? 'border-navy/10 bg-sage/5 opacity-60 line-through text-slate'
                          : 'border-navy/10 bg-white hover:bg-champagne'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border mt-0.5 flex items-center justify-center shrink-0 rounded ${
                          checkedItems[item]
                            ? 'border-navy bg-navy text-white'
                            : 'border-sage bg-white'
                        }`}
                      >
                        {checkedItems[item] && <Check className="w-3 h-3" />}
                      </div>
                      <span className="leading-tight select-none">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <PackageStudio
                plan={plan}
                eventType={eventType}
                guestCount={guestCount}
                targetMonth={targetMonth}
                locationName={locationName || plan.location}
                onRequestConsult={onRequestConsult}
              />

              <button
                type="button"
                onClick={() => onRequestConsult?.(plan)}
                className="w-full py-4 bg-navy hover:bg-sage text-white text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 rounded-full shadow-lg"
              >
                Talk to a Planner
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-navy/10 p-12 text-center text-slate shadow-sm min-h-100 flex items-center justify-center">
              <p className="text-sm font-serif italic">
                Use the Configuration Deck to curate a customized event planning model.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BudgetBar({
  label,
  amount,
  total,
  barClass,
}: {
  label: string;
  amount: number;
  total: number;
  barClass: string;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-navy">
        <span>{label}</span>
        <span className="font-mono font-bold">${amount.toLocaleString()}</span>
      </div>
      <div className="w-full h-1.5 bg-sage/20 rounded-full overflow-hidden">
        <div className={`${barClass} h-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
