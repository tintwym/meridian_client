export type WeatherEstimatePayload = {
  locationName: string;
  stationName: string;
  stationLat: number;
  stationLng: number;
  currentTemp: number;
  condition: string;
  humidity: number;
  windSpeed: string;
  forecast: { day: string; temp: number; condition: string }[];
};

type StationFallback = {
  match: string;
  stationName: string;
  stationLat: number;
  stationLng: number;
  humidity: number;
  windSpeed: string;
  temp: number;
  condition: string;
};

const STATION_FALLBACKS: StationFallback[] = [
  {
    match: 'santorini',
    stationName: 'Thira coastal AWS',
    stationLat: 36.3932,
    stationLng: 25.4615,
    humidity: 58,
    windSpeed: '24 km/h',
    temp: 26,
    condition: 'Clear',
  },
  {
    match: 'amalfi',
    stationName: 'Amalfi harbour AWS',
    stationLat: 40.634,
    stationLng: 14.6027,
    humidity: 70,
    windSpeed: '16 km/h',
    temp: 24,
    condition: 'Partly Cloudy',
  },
  {
    match: 'bali',
    stationName: 'Ubud garden station',
    stationLat: -8.5069,
    stationLng: 115.2625,
    humidity: 78,
    windSpeed: '12 km/h',
    temp: 29,
    condition: 'Humid',
  },
  {
    match: 'kyoto',
    stationName: 'Kyoto basin AWS',
    stationLat: 35.0116,
    stationLng: 135.7681,
    humidity: 62,
    windSpeed: '10 km/h',
    temp: 22,
    condition: 'Mild',
  },
  {
    match: 'hawaii',
    stationName: 'Maui coastal AWS',
    stationLat: 20.7984,
    stationLng: -156.3319,
    humidity: 72,
    windSpeed: '20 km/h',
    temp: 28,
    condition: 'Trade Winds',
  },
];

function nextWeekdayLabels(count = 3): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
  }
  return labels;
}

function matchStation(location: string): StationFallback | undefined {
  const key = location.trim().toLowerCase();
  return STATION_FALLBACKS.find((s) => key.includes(s.match));
}

export function buildWeatherEstimate(location: string): WeatherEstimatePayload {
  const station = matchStation(location);
  const days = nextWeekdayLabels(3);
  const baseTemp = station?.temp ?? 24;
  const condition = station?.condition ?? 'Partly Cloudy';

  return {
    locationName: location.trim() || 'Event Destination',
    stationName: station?.stationName ?? 'Regional planning estimate',
    stationLat: station?.stationLat ?? 0,
    stationLng: station?.stationLng ?? 0,
    currentTemp: baseTemp,
    condition,
    humidity: station?.humidity ?? 65,
    windSpeed: station?.windSpeed ?? '14 km/h',
    forecast: days.map((day, i) => ({
      day,
      temp: baseTemp + (i % 2 === 0 ? 1 : -1),
      condition: i === 2 ? 'Cloudier' : condition,
    })),
  };
}

export function mergeWeatherPayload(
  base: WeatherEstimatePayload,
  partial: Partial<WeatherEstimatePayload>,
): WeatherEstimatePayload {
  return {
    ...base,
    ...partial,
    forecast:
      Array.isArray(partial.forecast) && partial.forecast.length > 0
        ? partial.forecast
        : base.forecast,
  };
}
