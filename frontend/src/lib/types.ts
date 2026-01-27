// GeoJSON Feature for a carnival block
export interface BlockFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number] | null; // [lng, lat]
  };
  properties: {
    name: string;
    date: string;           // YYYY-MM-DD
    time: string;           // HH:MM
    datetime: string;       // ISO 8601
    city: string;
    neighborhood: string;
    address: string | null;
    price: number | null;
    price_formatted: string | null;
    is_free: boolean;
    description: string | null;
    source_url: string;
    needs_geocoding?: boolean;
    geocoding_query?: string | null;
  };
}

// GeoJSON FeatureCollection for a city
export interface CityData {
  type: 'FeatureCollection';
  metadata: {
    city: string;
    city_slug: string;
    generated_at: string;
    total_blocks: number;
    source: string;
  };
  features: BlockFeature[];
}

// City configuration
export interface CityConfig {
  name: string;
  slug: string;
  center: [number, number]; // [lng, lat]
}

// App state
export type AppView = 'landing' | 'map';

// Filter state
export interface FilterState {
  selectedDate: string | null;  // YYYY-MM-DD or null for all dates
  freeOnly: boolean;            // Show only free events
  timePeriods: TimePeriod[];    // Selected time periods (multi-select)
}

// Time period options
export type TimePeriod = 'manha' | 'tarde' | 'noite';

// Time period definitions (24h format)
export const TIME_PERIODS: Record<TimePeriod, { label: string; start: number; end: number }> = {
  manha: { label: 'Manhã', start: 6, end: 12 },   // 06:00 - 11:59
  tarde: { label: 'Tarde', start: 12, end: 18 },  // 12:00 - 17:59
  noite: { label: 'Noite', start: 18, end: 6 },   // 18:00 - 05:59 (wraps midnight)
};

// Helper to check if a time falls within a period
export function isTimeInPeriod(time: string, period: TimePeriod): boolean {
  const [hours] = time.split(':').map(Number);
  const { start, end } = TIME_PERIODS[period];

  if (period === 'noite') {
    // Noite wraps around midnight (18:00 - 05:59)
    return hours >= start || hours < end;
  }
  return hours >= start && hours < end;
}
