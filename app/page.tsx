'use client';

import {useSelector} from 'react-redux';
import Search from '../components/Search';
import Forecast from '../components/Forecast';
import {type RootState} from '../store/store';

export default function Home() {
    const {cities, error} = useSelector((state: RootState) => state.weather);

    return (
        <main className="max-w-7xl selection:bg-blue-200 selection:text-gray-700 dark:selection:bg-gray-700 dark:selection:text-amber-50 p-8 mx-auto">
            <h1 className="sr-only">Weather</h1>
            <Search cities={cities} />
            {error && (
                <p
                    role="alert"
                    className="text-lg font-medium text-center text-red-500 mbe-2"
                >
                    {error}
                </p>
            )}
            <section
                aria-label="weather forecasts"
                className="pbs-6"
            >
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
