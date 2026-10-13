'use client';

import {useSelector} from 'react-redux';
import Search from '../components/Search';
import Forecast from '../components/Forecast';
import {type RootState} from '../store/store';

export default function Home() {
    const {cities, error} = useSelector((state: RootState) => state.weather);

    return (
        <main>
            <h1>Weather</h1>
            <Search cities={cities} />
            {error && <p role="alert">{error}</p>}
            <section aria-label="weather forecasts">
                {cities.map(city => (
                    <Forecast
                        key={`${city.latitude}-${city.longitude}`}
                        city={city}
                    />
                ))}
            </section>
        </main>
    );
}
