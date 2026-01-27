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
      <p className="text-white text-center text-lg max-w-md drop-shadow">
        Encontre os blocos de carnaval na sua cidade
      </p>

      <button
        onClick={onRequestLocation}
        className="px-8 py-4 bg-white text-carnival-purple font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        Clique aqui para ir para sua cidade
      </button>

      {error && (
        <div className="w-full max-w-sm">
          <p className="text-white text-center mb-4">
            {error}. Selecione sua cidade abaixo:
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
