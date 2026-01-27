# CarnaMapa Frontend Implementation Plan

## Overview

Step-by-step implementation guide for building the CarnaMapa frontend using Vite + React + TypeScript + Tailwind CSS + MapTiler.

## Prerequisites

- Node.js 18+
- pnpm installed (`npm install -g pnpm`)
- MapTiler API key (free at https://cloud.maptiler.com/)
- GeoJSON data files from scraper (in `scraper/output/`)

---

## Phase 1: Project Setup

### 1.1 Initialize Vite Project

```bash
cd carnamapa
pnpm create vite frontend --template react-ts
cd frontend
pnpm install
```

### 1.2 Install Dependencies

```bash
# MapTiler SDK
pnpm add @maptiler/sdk

# Tailwind CSS
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Utility libraries
pnpm add clsx date-fns
```

### 1.3 Configure Tailwind

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carnival: {
          yellow: '#FFD700',
          green: '#00A86B',
          blue: '#1E90FF',
          purple: '#8A2BE2',
          pink: '#FF69B4',
        }
      }
    },
  },
  plugins: [],
}
```

**src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

### 1.4 Environment Variables

**frontend/.env.local**
```bash
VITE_MAPTILER_API_KEY=your_api_key_here
```

**frontend/.env.example**
```bash
VITE_MAPTILER_API_KEY=
```

### 1.5 Copy Data Files

```bash
mkdir -p frontend/public/data
cp scraper/output/*.json frontend/public/data/
```

### 1.6 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # MapTiler map component (no controls)
│   │   ├── FilterBar.tsx        # Bottom filter bar (date + time + free)
│   │   ├── DateSelector.tsx     # Date with arrows, opens calendar
│   │   ├── CalendarPopup.tsx    # Calendar popup for date selection
│   │   ├── TimePeriodSelector.tsx # Manhã|Tarde|Noite multi-select
│   │   ├── BlockDetailModal.tsx # Block info popup
│   │   ├── CitySelector.tsx     # City dropdown
│   │   ├── LandingScreen.tsx    # Initial "find my city" screen
│   │   └── LoadingSpinner.tsx   # Loading indicator
│   ├── hooks/
│   │   ├── useGeolocation.ts    # Browser geolocation hook
│   │   ├── useCityData.ts       # Load city GeoJSON
│   │   └── useUrlParams.ts      # URL query param sync
│   ├── lib/
│   │   ├── cities.ts            # City config (centers, slugs)
│   │   ├── cityDetection.ts     # Determine city from coords
│   │   └── types.ts             # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── data/
│       ├── sao-paulo.json
│       ├── rio-de-janeiro.json
│       └── ...
├── .env.local
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Phase 2: Core Types & Configuration

### 2.1 TypeScript Types

**src/lib/types.ts**
```typescript
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
```

### 2.2 City Configuration

**src/lib/cities.ts**
```typescript
import { CityConfig } from './types';

export const CITIES: CityConfig[] = [
  { name: 'São Paulo', slug: 'sao-paulo', center: [-46.6333, -23.5505] },
  { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', center: [-43.1729, -22.9068] },
  { name: 'Belo Horizonte', slug: 'belo-horizonte', center: [-43.9378, -19.9167] },
  { name: 'Salvador', slug: 'salvador', center: [-38.5108, -12.9714] },
  { name: 'Florianópolis', slug: 'florianopolis', center: [-48.5482, -27.5969] },
  { name: 'Recife/Olinda', slug: 'recife-olinda', center: [-34.8811, -8.0476] },
  { name: 'Brasília', slug: 'brasilia', center: [-47.8825, -15.7942] },
  { name: 'Porto Alegre', slug: 'porto-alegre', center: [-51.2177, -30.0346] },
  { name: 'Fortaleza', slug: 'fortaleza', center: [-38.5434, -3.7172] },
];

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find(city => city.slug === slug);
}

export function getCityByName(name: string): CityConfig | undefined {
  return CITIES.find(city => city.name === name);
}
```

### 2.3 City Detection from Coordinates

**src/lib/cityDetection.ts**
```typescript
import { CITIES, CityConfig } from './cities';

// Haversine distance in km
function haversineDistance(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest city within threshold (default 100km)
export function detectCityFromCoords(
  coords: [number, number],
  maxDistance = 100
): CityConfig | null {
  let nearest: CityConfig | null = null;
  let minDistance = Infinity;

  for (const city of CITIES) {
    const distance = haversineDistance(coords, city.center);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}
```

---

## Phase 3: Custom Hooks

### 3.1 Geolocation Hook

**src/hooks/useGeolocation.ts**
```typescript
import { useState, useCallback } from 'react';

interface GeolocationState {
  coords: [number, number] | null; // [lng, lat]
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: [position.coords.longitude, position.coords.latitude],
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          coords: null,
          error: error.message,
          loading: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { ...state, requestLocation };
}
```

### 3.2 City Data Hook

**src/hooks/useCityData.ts**
```typescript
import { useState, useEffect } from 'react';
import { CityData } from '../lib/types';

interface UseCityDataResult {
  data: CityData | null;
  loading: boolean;
  error: string | null;
}

export function useCityData(citySlug: string | null): UseCityDataResult {
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!citySlug) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/data/${citySlug}.json`)
      .then(res => {
        if (!res.ok) throw new Error('City data not found');
        return res.json();
      })
      .then((json: CityData) => {
        // Filter out blocks without coordinates
        const validFeatures = json.features.filter(
          f => f.geometry.coordinates !== null
        );
        setData({ ...json, features: validFeatures });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [citySlug]);

  return { data, loading, error };
}
```

### 3.3 URL Params Hook

**src/hooks/useUrlParams.ts**
```typescript
import { useCallback } from 'react';

interface UrlParams {
  city?: string;
  date?: string;
  free?: string;  // "1" for free only
  block?: string;
}

export function useUrlParams() {
  const getParams = useCallback((): UrlParams => {
    const params = new URLSearchParams(window.location.search);
    return {
      city: params.get('city') || undefined,
      date: params.get('date') || undefined,
      free: params.get('free') || undefined,
      block: params.get('block') || undefined,
    };
  }, []);

  const setParams = useCallback((newParams: Partial<UrlParams>) => {
    const params = new URLSearchParams(window.location.search);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, []);

  return { getParams, setParams };
}
```

---

## Phase 4: Components

### 4.1 Loading Spinner

**src/components/LoadingSpinner.tsx**
```typescript
export function LoadingSpinner({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-carnival-yellow border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
```

### 4.2 Landing Screen

**src/components/LandingScreen.tsx**
```typescript
import { LoadingSpinner } from './LoadingSpinner';

interface LandingScreenProps {
  onRequestLocation: () => void;
  onSelectCity: (slug: string) => void;
  loading: boolean;
  error: string | null;
  cities: Array<{ name: string; slug: string }>;
}

export function LandingScreen({
  onRequestLocation,
  onSelectCity,
  loading,
  error,
  cities,
}: LandingScreenProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-carnival-yellow to-carnival-green">
        <LoadingSpinner message="Detectando sua localização..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-6 bg-gradient-to-b from-carnival-yellow to-carnival-green">
      <h1 className="text-4xl font-bold text-white text-center drop-shadow-lg">
        CarnaMapa
      </h1>

      <button
        onClick={onRequestLocation}
        className="px-8 py-4 bg-white text-carnival-purple font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        Clique aqui para ir para sua cidade
      </button>

      {error && (
        <div className="w-full max-w-sm">
          <p className="text-white text-center mb-4">
            Não conseguimos detectar sua cidade. Selecione abaixo:
          </p>
          <select
            onChange={(e) => onSelectCity(e.target.value)}
            className="w-full p-3 rounded-lg text-gray-800"
            defaultValue=""
          >
            <option value="" disabled>Escolha sua cidade</option>
            {cities.map(city => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

### 4.3 City Selector (Header)

**src/components/CitySelector.tsx**
```typescript
interface CitySelectorProps {
  currentCity: string;
  cities: Array<{ name: string; slug: string }>;
  onChange: (slug: string) => void;
}

export function CitySelector({ currentCity, cities, onChange }: CitySelectorProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <select
        value={currentCity}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 bg-white rounded-lg shadow-md text-gray-800 font-medium"
      >
        {cities.map(city => (
          <option key={city.slug} value={city.slug}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 4.4 Date Selector

**src/components/DateSelector.tsx**
```typescript
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSelectorProps {
  selectedDate: string | null;  // YYYY-MM-DD or null
  availableDates: string[];     // Sorted array of available dates
  onDateChange: (date: string | null) => void;
  onOpenCalendar: () => void;
}

export function DateSelector({
  selectedDate,
  availableDates,
  onDateChange,
  onOpenCalendar,
}: DateSelectorProps) {
  // Get current index in available dates
  const currentIndex = selectedDate
    ? availableDates.indexOf(selectedDate)
    : -1;

  // Navigate to previous date
  const handlePrev = () => {
    if (currentIndex > 0) {
      onDateChange(availableDates[currentIndex - 1]);
    } else if (currentIndex === -1 && availableDates.length > 0) {
      // If "all dates", go to last date
      onDateChange(availableDates[availableDates.length - 1]);
    }
  };

  // Navigate to next date
  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
      onDateChange(availableDates[currentIndex + 1]);
    } else if (currentIndex === availableDates.length - 1) {
      // If at last date, go back to "all dates"
      onDateChange(null);
    } else if (currentIndex === -1 && availableDates.length > 0) {
      // If "all dates", go to first date
      onDateChange(availableDates[0]);
    }
  };

  // Format display text
  const displayText = selectedDate
    ? format(parseISO(selectedDate), "d 'de' MMMM", { locale: ptBR })
    : 'Todos os dias';

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handlePrev}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition-colors"
      >
        &lt;
      </button>

      <button
        onClick={onOpenCalendar}
        className="px-6 py-2 bg-white rounded-full text-gray-800 font-medium min-w-[180px] hover:bg-gray-100 transition-colors"
      >
        {displayText}
      </button>

      <button
        onClick={handleNext}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition-colors"
      >
        &gt;
      </button>
    </div>
  );
}
```

### 4.5 Calendar Popup

**src/components/CalendarPopup.tsx**
```typescript
import { useMemo } from 'react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

interface CalendarPopupProps {
  selectedDate: string | null;
  availableDates: string[];
  onSelectDate: (date: string | null) => void;
  onClose: () => void;
}

export function CalendarPopup({
  selectedDate,
  availableDates,
  onSelectDate,
  onClose,
}: CalendarPopupProps) {
  // Determine which month to show (first available date or selected date)
  const displayMonth = useMemo(() => {
    if (selectedDate) return parseISO(selectedDate);
    if (availableDates.length > 0) return parseISO(availableDates[0]);
    return new Date();
  }, [selectedDate, availableDates]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let current = calStart;
    while (current <= calEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [displayMonth]);

  // Check if date has events
  const hasEvents = (date: Date) => {
    return availableDates.some(d => isSameDay(parseISO(d), date));
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === displayMonth.getMonth();
  };

  const handleSelect = (date: Date) => {
    onSelectDate(format(date, 'yyyy-MM-dd'));
    onClose();
  };

  const handleClear = () => {
    onSelectDate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Calendar */}
      <div className="relative bg-white rounded-xl p-4 shadow-xl w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {format(displayMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {calendarDays.map((date, i) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;
            const isAvailable = hasEvents(date);
            const inMonth = isCurrentMonth(date);

            return (
              <button
                key={i}
                onClick={() => isAvailable && handleSelect(date)}
                disabled={!isAvailable}
                className={clsx(
                  'py-2 rounded-lg transition-colors',
                  !inMonth && 'opacity-30',
                  isSelected && 'bg-carnival-purple text-white',
                  !isSelected && isAvailable && 'bg-carnival-yellow/20 text-gray-900 hover:bg-carnival-yellow/40',
                  !isAvailable && 'text-gray-300 cursor-not-allowed'
                )}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>

        {/* Clear button */}
        <button
          onClick={handleClear}
          className="w-full mt-4 py-2 text-carnival-purple font-medium hover:bg-gray-50 rounded-lg transition-colors"
        >
          Todos os dias
        </button>
      </div>
    </div>
  );
}
```

### 4.6 Time Period Selector

**src/components/TimePeriodSelector.tsx**
```typescript
import clsx from 'clsx';
import { TimePeriod, TIME_PERIODS } from '../lib/types';

interface TimePeriodSelectorProps {
  selected: TimePeriod[];
  onChange: (periods: TimePeriod[]) => void;
}

export function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  const handleToggle = (period: TimePeriod) => {
    const newSelected = selected.includes(period)
      ? selected.filter(p => p !== period)
      : [...selected, period];
    onChange(newSelected);
  };

  return (
    <div className="flex bg-white/20 rounded-full p-1">
      {(Object.keys(TIME_PERIODS) as TimePeriod[]).map((period, index) => {
        const isSelected = selected.includes(period);
        return (
          <button
            key={period}
            onClick={() => handleToggle(period)}
            className={clsx(
              'px-4 py-1.5 text-sm font-medium transition-colors',
              index === 0 && 'rounded-l-full',
              index === 2 && 'rounded-r-full',
              isSelected
                ? 'bg-white text-carnival-purple'
                : 'text-white hover:bg-white/10'
            )}
          >
            {TIME_PERIODS[period].label}
          </button>
        );
      })}
    </div>
  );
}
```

### 4.7 Filter Bar (Bottom Container)

**src/components/FilterBar.tsx**
```typescript
import { useState } from 'react';
import { DateSelector } from './DateSelector';
import { CalendarPopup } from './CalendarPopup';
import { TimePeriodSelector } from './TimePeriodSelector';
import { FilterState } from '../lib/types';

interface FilterBarProps {
  availableDates: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterBar({ availableDates, filters, onFiltersChange }: FilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sort dates
  const sortedDates = [...availableDates].sort();

  const handleDateChange = (date: string | null) => {
    onFiltersChange({ ...filters, selectedDate: date });
  };

  const handleTimePeriodsChange = (periods: typeof filters.timePeriods) => {
    onFiltersChange({ ...filters, timePeriods: periods });
  };

  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, freeOnly: checked });
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-carnival-purple">
        {/* Layer 1: Date Selector */}
        <div className="px-4 py-3 border-b border-white/10">
          <DateSelector
            selectedDate={filters.selectedDate}
            availableDates={sortedDates}
            onDateChange={handleDateChange}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
        </div>

        {/* Layer 2: Time Period + Free Only */}
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <TimePeriodSelector
            selected={filters.timePeriods}
            onChange={handleTimePeriodsChange}
          />

          <label className="flex items-center gap-2 cursor-pointer text-white">
            <input
              type="checkbox"
              checked={filters.freeOnly}
              onChange={(e) => handleFreeOnlyChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/30 bg-white/10 text-carnival-yellow focus:ring-carnival-yellow"
            />
            <span className="text-sm font-medium whitespace-nowrap">Só gratuitos</span>
          </label>
        </div>
      </div>

      {/* Calendar Popup */}
      {calendarOpen && (
        <CalendarPopup
          selectedDate={filters.selectedDate}
          availableDates={sortedDates}
          onSelectDate={handleDateChange}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
```

### 4.5 Block Detail Modal

**src/components/BlockDetailModal.tsx**
```typescript
import { BlockFeature } from '../lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockDetailModalProps {
  block: BlockFeature;
  onClose: () => void;
}

export function BlockDetailModal({ block, onClose }: BlockDetailModalProps) {
  const { properties: p, geometry } = block;
  const dateFormatted = format(parseISO(p.date), "EEEE, d 'de' MMMM", { locale: ptBR });

  const handleGetDirections = () => {
    if (geometry.coordinates) {
      const [lng, lat] = geometry.coordinates;
      // Opens in Google Maps on mobile, or web
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:w-96 sm:rounded-xl rounded-t-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-900 pr-8">{p.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-lg">📅</span>
            <span className="capitalize">{dateFormatted}</span>
            <span className="text-carnival-purple font-semibold">{p.time}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-gray-700">
            <span className="text-lg">📍</span>
            <div>
              <p className="font-medium">{p.neighborhood}</p>
              {p.address && <p className="text-sm text-gray-500">{p.address}</p>}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🎟️</span>
            {p.is_free ? (
              <span className="text-green-600 font-medium">Gratuito</span>
            ) : (
              <span className="text-gray-700">{p.price_formatted || `R$ ${p.price}`}</span>
            )}
          </div>

          {/* Description */}
          {p.description && (
            <p className="text-gray-600 text-sm">{p.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={handleGetDirections}
              className="w-full py-3 bg-carnival-blue text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Obter direções
            </button>

            <a
              href={p.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg text-center hover:bg-gray-200 transition-colors"
            >
              Ver no blocosderua.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.6 Map Component (Clean UI - No Controls)

**src/components/Map.tsx**
```typescript
import { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { CityData, BlockFeature } from '../lib/types';

interface MapProps {
  cityCenter: [number, number];
  data: CityData;
  filteredFeatures: BlockFeature[];
  onSelectBlock: (block: BlockFeature) => void;
}

export function Map({ cityCenter, data, filteredFeatures, onSelectBlock }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  // Initialize map with NO CONTROLS for clean UI
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: cityCenter,
      zoom: 12,
      // Disable all navigation controls for clean UI
      navigationControl: false,
      geolocateControl: false,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when city changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({ center: cityCenter, zoom: 12 });
    }
  }, [cityCenter]);

  // Update markers when filtered data changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredFeatures.forEach(feature => {
      if (!feature.geometry.coordinates) return;

      const marker = new maptilersdk.Marker({ color: '#8A2BE2' })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onSelectBlock(feature);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if there are any
    if (filteredFeatures.length > 0) {
      const bounds = new maptilersdk.LngLatBounds();
      filteredFeatures.forEach(f => {
        if (f.geometry.coordinates) {
          bounds.extend(f.geometry.coordinates);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [filteredFeatures, onSelectBlock]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
```

---

## Phase 5: Main App Component

**src/App.tsx**
```typescript
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Map } from './components/Map';
import { FilterBar } from './components/FilterBar';
import { BlockDetailModal } from './components/BlockDetailModal';
import { CitySelector } from './components/CitySelector';
import { LandingScreen } from './components/LandingScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useGeolocation } from './hooks/useGeolocation';
import { useCityData } from './hooks/useCityData';
import { useUrlParams } from './hooks/useUrlParams';
import { CITIES, getCityBySlug } from './lib/cities';
import { detectCityFromCoords } from './lib/cityDetection';
import { BlockFeature, AppView, FilterState, TimePeriod, TIME_PERIODS } from './lib/types';

// Helper to check if a time falls within a period
function isTimeInPeriod(time: string, period: TimePeriod): boolean {
  const [hours] = time.split(':').map(Number);
  const { start, end } = TIME_PERIODS[period];

  if (period === 'noite') {
    // Noite wraps around midnight (18:00 - 05:59)
    return hours >= start || hours < end;
  }
  return hours >= start && hours < end;
}

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    selectedDate: null,
    freeOnly: false,
    timePeriods: [],
  });
  const [selectedBlock, setSelectedBlock] = useState<BlockFeature | null>(null);

  const { coords, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const { data: cityData, loading: dataLoading, error: dataError } = useCityData(citySlug);
  const { getParams, setParams } = useUrlParams();

  // Check URL params on mount
  useEffect(() => {
    const params = getParams();
    if (params.city && getCityBySlug(params.city)) {
      setCitySlug(params.city);
      setView('map');

      // Restore filters from URL
      setFilters(prev => ({
        ...prev,
        selectedDate: params.date || null,
        freeOnly: params.free === '1',
      }));
    }
  }, []);

  // Handle geolocation result
  useEffect(() => {
    if (coords) {
      const detectedCity = detectCityFromCoords(coords);
      if (detectedCity) {
        setCitySlug(detectedCity.slug);
        setParams({ city: detectedCity.slug });
        setView('map');
      }
    }
  }, [coords, setParams]);

  // Handle city change
  const handleCityChange = useCallback((slug: string) => {
    setCitySlug(slug);
    setParams({ city: slug, date: undefined, free: undefined });
    setFilters({ selectedDate: null, freeOnly: false, timePeriods: [] });
    setSelectedBlock(null);
    setView('map');
  }, [setParams]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setParams({
      date: newFilters.selectedDate || undefined,
      free: newFilters.freeOnly ? '1' : undefined,
    });
  }, [setParams]);

  // Get unique dates from data
  const availableDates = useMemo(() => {
    if (!cityData) return [];
    const dates = new Set(cityData.features.map(f => f.properties.date));
    return Array.from(dates);
  }, [cityData]);

  // Filter features by all active filters
  const filteredFeatures = useMemo(() => {
    if (!cityData) return [];

    return cityData.features.filter(feature => {
      const { properties } = feature;

      // Date filter
      if (filters.selectedDate && properties.date !== filters.selectedDate) {
        return false;
      }

      // Free only filter
      if (filters.freeOnly && !properties.is_free) {
        return false;
      }

      // Time period filter (if any selected)
      if (filters.timePeriods.length > 0) {
        const matchesPeriod = filters.timePeriods.some(period =>
          isTimeInPeriod(properties.time, period)
        );
        if (!matchesPeriod) return false;
      }

      return true;
    });
  }, [cityData, filters]);

  // Get current city config
  const currentCity = citySlug ? getCityBySlug(citySlug) : null;

  // Landing screen
  if (view === 'landing') {
    return (
      <LandingScreen
        onRequestLocation={requestLocation}
        onSelectCity={handleCityChange}
        loading={geoLoading}
        error={geoError}
        cities={CITIES}
      />
    );
  }

  // Loading city data
  if (dataLoading || !cityData || !currentCity) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner message="Carregando blocos..." />
      </div>
    );
  }

  // Error loading data
  if (dataError) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-500">Erro ao carregar dados: {dataError}</p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* City selector */}
      <CitySelector
        currentCity={citySlug!}
        cities={CITIES}
        onChange={handleCityChange}
      />

      {/* Map (clean UI - no controls) */}
      <Map
        cityCenter={currentCity.center}
        data={cityData}
        filteredFeatures={filteredFeatures}
        onSelectBlock={setSelectedBlock}
      />

      {/* Filter bar (bottom of screen) */}
      <FilterBar
        availableDates={availableDates}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Block detail modal */}
      {selectedBlock && (
        <BlockDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}
```

---

## Phase 6: Entry Point

**src/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**index.html**
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Mapa interativo dos blocos de carnaval do Brasil" />
    <title>CarnaMapa - Blocos de Carnaval</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Phase 7: Build & Deploy

### 7.1 Build for Production

```bash
cd frontend
pnpm build
```

This generates a `dist/` folder with static files.

### 7.2 Deploy to Railway

1. Connect GitHub repo to Railway
2. Set root directory to `frontend`
3. Add environment variable: `VITE_MAPTILER_API_KEY`
4. Railway auto-detects Vite and builds

**Or use Railway CLI:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Implementation Checklist

### Phase 1: Setup
- [x] Initialize Vite project
- [x] Install dependencies (MapTiler, Tailwind, date-fns, clsx)
- [x] Configure Tailwind with carnival colors
- [x] Set up environment variables
- [x] Copy GeoJSON data files to public/data/

### Phase 2: Core
- [x] Create TypeScript types (types.ts)
- [x] Create city configuration (cities.ts)
- [x] Create city detection logic (cityDetection.ts)

### Phase 3: Hooks
- [x] Implement useGeolocation hook
- [x] Implement useCityData hook
- [x] Implement useUrlParams hook

### Phase 4: Components
- [x] Build LoadingSpinner component
- [x] Build LandingScreen component
- [x] Build CitySelector component
- [x] Build DateSelector component (arrows + date display, opens calendar popup)
- [x] Build CalendarPopup component (date picker popup)
- [x] Build TimePeriodSelector component (manhã|tarde|noite multi-select)
- [x] Build FilterBar component (bottom bar with two layers: date selector + time periods/free-only)
- [x] Build BlockDetailModal component
- [x] Update Map component (disable navigation controls for clean UI)

### Phase 5: Integration & Testing
- [x] Wire up App.tsx with all components
- [x] Unit tests for lib modules (types, cities, cityDetection)
- [x] Unit tests for hooks (useGeolocation, useCityData, useUrlParams)
- [ ] E2E test geolocation flow
- [ ] E2E test city switching
- [ ] E2E test date filtering
- [ ] E2E test block detail modal
- [ ] E2E test URL parameters

### Phase 6: Polish
- [ ] Mobile responsive testing
- [x] Loading states
- [x] Error handling
- [ ] Performance optimization

### Phase 7: Deploy
- [x] Build production bundle
- [ ] Deploy to Railway
- [ ] Configure custom domain
- [ ] Test production deployment

---

## Notes

- All components use functional React with hooks
- State is managed locally (no Redux/Zustand needed for this scope)
- URL params enable deep linking and sharing (city, date, free filters)
- MapTiler SDK handles map rendering and markers (controls disabled for clean UI)
- date-fns provides locale-aware date formatting
- Tailwind handles all styling with custom carnival colors

## UI Changes Summary

### Map (Clean UI)
- All navigation controls disabled (no +/-, no compass, no geolocate button)
- Users interact via pinch-to-zoom and drag/scroll only
- Cleaner, more immersive mobile experience
- **No automatic zoom**: Map stays at user's zoom level when filters change

### Filter Bar (Bottom of Screen)
Two-layer bar fixed at bottom with **transparent background**:

**Layer 1 - Date Selector (left-aligned):**
- Rounded pill showing current date or "Todos os dias"
- Left/right arrows to navigate between dates (Feb 1 - Mar 1 only)
- Tap center to open calendar popup
- White/translucent buttons with shadows for visibility

**Layer 2 - Time & Price Filters:**
- Time period multi-select: Manhã | Tarde | Noite (segmented control style)
- "Só gratuitos" **toggle button** (purple when active, white when inactive)

**Calendar Popup:**
- Opens when date text is tapped
- **Fixed range**: Feb 1 to Mar 1, 2026 (Carnaval period)
- Header shows "Carnaval 2026"
- Available dates highlighted in yellow, unavailable dates grayed out
- "Todos os dias" button to clear selection
