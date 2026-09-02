export type RiskLevel = 'ok' | 'caution' | 'high';

export interface WeatherRiskPill {
  id: 'humidity' | 'wind';
  label: string;
  level: RiskLevel;
  chip: string;
  detail: string;
}

export function parseWindKmh(windSpeed: unknown): number | null {
  if (typeof windSpeed === 'number' && Number.isFinite(windSpeed)) return windSpeed;
  if (typeof windSpeed !== 'string') return null;
  const match = windSpeed.trim().match(/([\d.]+)\s*(km\/h|kph|mph|m\/s)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = (match[2] || 'km/h').toLowerCase();
  if (unit === 'mph') return value * 1.60934;
  if (unit === 'm/s') return value * 3.6;
  return value;
}

export function evaluateOutdoorWeatherRisks(
  humidity: unknown,
  windSpeed: unknown,
): WeatherRiskPill[] {
  const pills: WeatherRiskPill[] = [];
  const hum = typeof humidity === 'number' ? humidity : Number(humidity);
  const wind = parseWindKmh(windSpeed);

  if (Number.isFinite(hum)) {
    if (hum >= 75) {
      pills.push({
        id: 'humidity',
        label: 'Humidity',
        level: 'high',
        chip: 'High humidity',
        detail: `Humidity is ${Math.round(hum)}% (≥75%). Prefer shaded or indoor backup for outdoor ceremonies.`,
      });
    } else if (hum >= 60) {
      pills.push({
        id: 'humidity',
        label: 'Humidity',
        level: 'caution',
        chip: 'Elevated humidity',
        detail: `Humidity is ${Math.round(hum)}% (60–74%). Keep cooling, shade, and a covered contingency ready.`,
      });
    }
  }

  if (wind !== null) {
    const rounded = Math.round(wind);
    if (wind >= 40) {
      pills.push({
        id: 'wind',
        label: 'Wind',
        level: 'high',
        chip: 'Strong wind',
        detail: `Wind ~${rounded} km/h (≥40). High risk for arches, canopies, and AV outdoors.`,
      });
    } else if (wind >= 20) {
      pills.push({
        id: 'wind',
        label: 'Wind',
        level: 'caution',
        chip: 'Breezy',
        detail: `Wind ~${rounded} km/h (20–39). Weight floral bases and secure lightweight décor.`,
      });
    }
  }

  return pills;
}
