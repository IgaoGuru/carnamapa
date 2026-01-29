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
      <div className="h-full flex items-center justify-center bg-white">
        <LoadingSpinner message="Detectando sua localização..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-6 bg-white">
      <img
        src="/carnamapa-logo.webp"
        alt="CarnaMapa"
        className="w-64 max-w-[80vw] h-auto"
      />

      <button
        onClick={onRequestLocation}
        className="text-2xl text-red-500/90 font-semibold underline underline-offset-4 hover:text-red-600 transition-colors"
      >
        Clique aqui para ir para sua cidade
      </button>

      {error && (
        <div className="w-full max-w-sm">
          <p className="text-gray-600 text-center mb-4">
            {error}. Selecione sua cidade abaixo:
          </p>
          <select
            onChange={(e) => onSelectCity(e.target.value)}
            className="w-full p-3 rounded-lg text-gray-800 border border-gray-200"
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
