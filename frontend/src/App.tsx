import { useState, useEffect, useMemo, useCallback } from 'react';
import { Map } from './components/Map';
import { DateSelector } from './components/DateSelector';
import { BlockDetailModal } from './components/BlockDetailModal';
import { CitySelector } from './components/CitySelector';
import { LandingScreen } from './components/LandingScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useGeolocation } from './hooks/useGeolocation';
import { useCityData } from './hooks/useCityData';
import { useUrlParams } from './hooks/useUrlParams';
import { CITIES, getCityBySlug } from './lib/cities';
import { detectCityFromCoords } from './lib/cityDetection';
import type { BlockFeature, AppView } from './lib/types';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
      if (params.date) {
        setSelectedDate(params.date);
      }
    }
  }, [getParams]);

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
    setParams({ city: slug });
    setSelectedDate(null);
    setSelectedBlock(null);
    setView('map');
  }, [setParams]);

  // Handle date change
  const handleDateChange = useCallback((date: string | null) => {
    setSelectedDate(date);
    setParams({ date: date || undefined });
  }, [setParams]);

  // Get unique dates from data
  const availableDates = useMemo(() => {
    if (!cityData) return [];
    const dates = new Set(cityData.features.map(f => f.properties.date));
    return Array.from(dates);
  }, [cityData]);

  // Filter features by selected date
  const filteredFeatures = useMemo(() => {
    if (!cityData) return [];
    if (!selectedDate) return cityData.features;
    return cityData.features.filter(f => f.properties.date === selectedDate);
  }, [cityData, selectedDate]);

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

      {/* Map */}
      <Map
        cityCenter={currentCity.center}
        filteredFeatures={filteredFeatures}
        onSelectBlock={setSelectedBlock}
      />

      {/* Date selector */}
      <DateSelector
        dates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
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
