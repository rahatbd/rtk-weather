'use client';

import {useState, useRef, type ChangeEvent, type SubmitEvent} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Field, Label, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption} from '@headlessui/react';
import {Sparkline} from '@microcharts/react/sparkline/interactive';
import {fetchData} from '../api';
import {fetchWeather} from '../store/weatherSlice';
import {type AppDispatch, type RootState} from '../store/store';
import '@microcharts/react/motion';

type Location = {
    name: string;
    admin1?: string;
    country: string;
};

type CitySuggestion = Location & {
    latitude: number;
    longitude: number;
};

type GeocodingResponse = {
    results?: CitySuggestion[];
};

const sparklineProps = {
    width: 300,
    height: 150,
    label: 'minmax' as const,
    dots: 'none' as const,
    animate: true,
    fill: true,
};

export default function Home() {
    const [query, setQuery] = useState('');
    const [searchError, setSearchError] = useState(false);
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);
    const {isLoading, cities, error} = useSelector((state: RootState) => state.weather);
    const dispatch = useDispatch<AppDispatch>();
    const inputRef = useRef<HTMLInputElement>(null);

    function formatCity(city: Location) {
        return `${city.name}, ${city.admin1 ? `${city.admin1}, ` : ''}${city.country}`;
    }

    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const {value} = event.target;
        setQuery(value);
        setSearchError(false);
        setSelectedCity(null);
        if (value.trim().length < 2) return setSuggestions([]);
        // AbortController
        try {
            const cityData = await fetchData<GeocodingResponse>(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value.trim())}`,
            );
            const filteredSuggestions = (cityData.results ?? [])
                .filter(suggestion => !cities.some(city => city.latitude === suggestion.latitude && city.longitude === suggestion.longitude))
                .slice(0, 5);
            setSuggestions(filteredSuggestions);
        } catch (error) {
            console.error(error);
            setSearchError(true);
            setSuggestions([]);
        }
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedCity) return;
        try {
            await dispatch(fetchWeather(selectedCity)).unwrap();
            setQuery('');
            setSelectedCity(null);
            setSuggestions([]);
            // clear the ComboboxInput's DOM value
            if (inputRef.current) inputRef.current.value = '';
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <main>
            <h1>Weather</h1>
            <search>
                <form
                    onSubmit={handleSubmit}
                    autoComplete="off"
                >
                    <Field>
                        <Label>Search City</Label>
                        <Combobox
                            value={selectedCity}
                            onChange={city => setSelectedCity(city)}
                            // onClose={() => setQuery('')}
                        >
                            <ComboboxInput
                                type="search"
                                placeholder="Toronto, Ontario, Canada"
                                aria-describedby="search-help"
                                ref={inputRef}
                                onChange={handleChange}
                                displayValue={(city: CitySuggestion | null) => (city ? formatCity(city) : query)}
                                onKeyDown={event => {
                                    if (event.key === 'Escape') setQuery('');
                                }}
                            />
                            <ComboboxOptions
                                anchor="bottom"
                                // static
                            >
                                {suggestions.map(suggestion => (
                                    <ComboboxOption
                                        key={`${suggestion.latitude}-${suggestion.longitude}`}
                                        value={suggestion}
                                    >
                                        {formatCity(suggestion)}
                                    </ComboboxOption>
                                ))}
                            </ComboboxOptions>
                        </Combobox>
                    </Field>
                    <button disabled={isLoading || !selectedCity}>{isLoading ? 'Searching...' : 'Search'}</button>
                </form>
                <p id="search-help">Select a city from the suggestions to search.</p>
            </search>
            {searchError && <p role="alert">Unable to search for cities. Please try again.</p>}
            {error && <p role="alert">{error}</p>}
            <section aria-label="weather forecasts">
                {cities.map(city => (
                    <div key={`${city.latitude}-${city.longitude}`}>
                        <h2>{formatCity(city)}</h2>
                        <Sparkline
                            {...sparklineProps}
                            data={city.temperature}
                            format={value => `${value}°C`}
                        />
                        <p>Temperature</p>
                        <Sparkline
                            {...sparklineProps}
                            data={city.humidity}
                            format={value => `${value}%`}
                        />
                        <p>Humidity</p>
                        <Sparkline
                            {...sparklineProps}
                            data={city.precipitation}
                            format={value => `${value}mm`}
                        />
                        <p>Precipitation</p>
                    </div>
                ))}
            </section>
        </main>
    );
}
