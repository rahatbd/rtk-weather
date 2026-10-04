'use client';

import {useState, type ChangeEvent, type SubmitEvent} from 'react';
import {Sparkline} from '@microcharts/react/sparkline/interactive';
import {useSelector, useDispatch} from 'react-redux';
import {addCity} from '../store/weatherSlice';
import {type RootState} from '../store/store';
import '@microcharts/react/motion';

type CitySuggestion = {
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country: string;
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [city, setCity] = useState('');
    const cities = useSelector((state: RootState) => state.weather.cities);
    const dispatch = useDispatch();

    async function fetchData(url: string) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
    }

    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const {value} = event.target;
        setCity(value);
        if (value.trim().length < 2) return setSuggestions([]);
        try {
            const cityData = await fetchData(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value.trim())}&count=5`);
            setSuggestions(cityData.results ?? []);
        } catch (error) {
            console.error(error);
            setSuggestions([]);
        }
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const cityData = await fetchData(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=5`);
            if (!cityData.results) return setError('City not found.');
            const {name, latitude, longitude} = cityData.results[0];
            const isDuplicate = cities.some(city => city.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) return setError('City already added.');
            const weatherData = await fetchData(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,pressure_msl,relative_humidity_2m&forecast_hours=168&timezone=auto`,
            );
            const {temperature_2m: temperature, relative_humidity_2m: humidity, pressure_msl: pressure} = weatherData.hourly;
            dispatch(addCity({name, latitude, longitude, temperature, humidity, pressure}));
            setCity('');
            // console.log(cityData);
        } catch (error) {
            console.error(error);
            setError('Something went wrong. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main>
            <search>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="city">Search City</label>
                    <input
                        id="city"
                        type="search"
                        value={city}
                        onChange={handleChange}
                        placeholder="Toronto"
                        autoComplete="off"
                        list="suggestions"
                        required
                    />
                    <datalist id="suggestions">
                        {suggestions.map(suggestion => (
                            <option
                                key={`${suggestion.latitude}-${suggestion.longitude}`}
                                value={`${suggestion.name}, ${suggestion.admin1 ? `${suggestion.admin1}, ` : ''}${suggestion.country}`}
                            />
                        ))}
                    </datalist>
                    <button disabled={isLoading || !city.trim()}>{isLoading ? 'Searching...' : 'Search'}</button>
                </form>
            </search>
            {error && <p role="alert">{error}</p>}
            <section aria-label="weather forecast charts">
                {cities.map(city => (
                    <div key={city.name}>
                        <h2>{city.name}</h2>
                        <Sparkline
                            {...sparklineProps}
                            data={city.temperature}
                            format={value => `${value}°C`}
                        />
                        <Sparkline
                            {...sparklineProps}
                            data={city.humidity}
                            format={value => `${value}%`}
                        />
                        <Sparkline
                            {...sparklineProps}
                            data={city.pressure}
                            format={value => `${value} hPa`}
                        />
                    </div>
                ))}
            </section>
        </main>
    );
}
