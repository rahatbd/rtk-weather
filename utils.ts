import type {CityLocation, CityData, WeatherCity} from './store/weatherSlice';

export function formatCity(city: CityLocation) {
    return `${city.name}, ${city.admin1 ? `${city.admin1}, ` : ''}${city.country}`;
}

export function loadCities(): CityData[] {
    const savedCities = localStorage.getItem('savedCities');
    if (!savedCities) return [];
    return JSON.parse(savedCities) as CityData[];
}

export function saveCities(cities: WeatherCity[]) {
    const savedCities = cities.map(({name, admin1, country, latitude, longitude}) => ({name, admin1, country, latitude, longitude}));
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
}

export async function fetchData<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
}
