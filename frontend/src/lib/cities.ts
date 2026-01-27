import type { CityConfig } from './types';

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
