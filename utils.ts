export type CityLocation = {
    name: string;
    admin1?: string;
    country: string;
};

export function formatCity(city: CityLocation) {
    return `${city.name}, ${city.admin1 ? `${city.admin1}, ` : ''}${city.country}`;
}

export async function fetchData<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
}
