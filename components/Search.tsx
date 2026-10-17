import {useState, useEffect, useRef, type ChangeEvent, type SubmitEvent} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {Field, Label, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption} from '@headlessui/react';
import {fetchData, formatCity, type CityLocation} from '../utils';
import {fetchWeather, type WeatherCity} from '../store/weatherSlice';
import {type AppDispatch, type RootState} from '../store/store';

type CitySuggestion = CityLocation & {
    latitude: number;
    longitude: number;
};

type GeocodingResponse = {
    results?: CitySuggestion[];
};

type SearchProps = {
    cities: WeatherCity[];
};

export default function Search({cities}: SearchProps) {
    const [query, setQuery] = useState('');
    const [searchError, setSearchError] = useState(false);
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);
    const {isLoading} = useSelector((state: RootState) => state.weather);
    const dispatch = useDispatch<AppDispatch>();
    const abortControllerRef = useRef<AbortController>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function fetchCitySuggestions(value: string) {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5_000)]);
        try {
            const cityData = await fetchData<GeocodingResponse>(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value.trim())}`,
                signal,
            );
            const filteredSuggestions = (cityData.results ?? [])
                .filter(suggestion => !cities.some(city => city.latitude === suggestion.latitude && city.longitude === suggestion.longitude))
                .slice(0, 5);
            setSuggestions(filteredSuggestions);
        } catch (error) {
            if (controller.signal.aborted) return;
            console.error(error);
            setSearchError(true);
            setSuggestions([]);
        }
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const {value} = event.target;
        setQuery(value);
        setSearchError(false);
        setSelectedCity(null);
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        if (value.trim().length < 2) return setSuggestions([]);
        debounceRef.current = setTimeout(() => fetchCitySuggestions(value), 300);
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

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <search className="max-w-xl mx-auto mbe-2">
            <form
                onSubmit={handleSubmit}
                autoComplete="off"
            >
                <Field>
                    <Label className="block font-medium text-gray-500 dark:text-gray-400">Search City</Label>
                    <Combobox
                        value={selectedCity}
                        onChange={city => setSelectedCity(city)}
                    >
                        <ComboboxInput
                            type="search"
                            placeholder="Toronto, Ontario, Canada"
                            aria-describedby="search-help"
                            maxLength={100}
                            ref={inputRef}
                            onChange={handleChange}
                            displayValue={(city: CitySuggestion | null) => (city ? formatCity(city) : query)}
                            onKeyDown={event => {
                                if (event.key === 'Escape') setQuery('');
                            }}
                            className="w-full rounded-md shadow-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 py-2 mbs-1 mbe-2.5"
                        />
                        <ComboboxOptions
                            anchor="bottom"
                            className="w-(--input-width) [--anchor-gap:8px] rounded-md border border-gray-300 dark:border-gray-700 bg-[Canvas] dark:bg-gray-800 shadow-lg empty:invisible px-2 py-1"
                        >
                            {suggestions.map(suggestion => (
                                <ComboboxOption
                                    key={`${suggestion.latitude}-${suggestion.longitude}`}
                                    value={suggestion}
                                    className="text-sm rounded-md data-focus:bg-blue-50 dark:data-focus:bg-gray-700 data-focus:text-blue-700 dark:data-focus:text-blue-300 data-selected:text-gray-500 dark:data-selected:text-gray-400 cursor-pointer px-2 py-2"
                                >
                                    {formatCity(suggestion)}
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    </Combobox>
                </Field>
                <button
                    disabled={isLoading || !selectedCity}
                    className="w-full font-medium rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-amber-50 disabled:text-gray-500 dark:disabled:text-gray-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[Canvas] focus-visible:ring-blue-500 cursor-pointer disabled:cursor-not-allowed transition-colors duration-300 px-4 py-2"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>
            <p
                id="search-help"
                className="font-medium text-sm text-center text-gray-500 mbs-2"
            >
                Select a city from the suggestions to search.
            </p>
            {searchError && (
                <p
                    role="alert"
                    className="text-lg font-medium text-center text-red-500 mbs-2"
                >
                    Unable to search for cities. Please try again.
                </p>
            )}
        </search>
    );
}
