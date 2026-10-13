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
            {searchError && <p role="alert">Unable to search for cities. Please try again.</p>}
        </search>
    );
}
