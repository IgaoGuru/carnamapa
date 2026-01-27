import { useState, useEffect } from 'react';
import type { CityData } from '../lib/types';

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
        if (!res.ok) throw new Error('Dados da cidade não encontrados');
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
