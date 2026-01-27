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
