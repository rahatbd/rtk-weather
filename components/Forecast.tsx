import {useDispatch} from 'react-redux';
import {Sparkline} from '@microcharts/react/sparkline/interactive';
import {formatCity} from '../utils';
import {removeCity, type WeatherCity} from '../store/weatherSlice';
import {type AppDispatch} from '../store/store';
import '@microcharts/react/motion';

type ForecastProps = {
    city: WeatherCity;
};

const sparklineProps = {
    width: 300,
    height: 150,
    label: 'minmax' as const,
    dots: 'none' as const,
    animate: true,
    fill: true,
};

export default function Forecast({city}: ForecastProps) {
    const dispatch = useDispatch<AppDispatch>();

    return (
        <article className="text-center rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 p-8 mbe-4">
            <div className="flex flex-wrap justify-center md:justify-between items-center gap-3 mbe-8">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{formatCity(city)}</h2>
                <button
                    aria-label={`Remove ${formatCity(city)} forecast`}
                    onClick={() => dispatch(removeCity({latitude: city.latitude, longitude: city.longitude}))}
                    className="rounded-md font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[Canvas] transition-colors duration-300 cursor-pointer px-3 py-2"
                >
                    <span aria-hidden="true">&#x2716;&nbsp;</span>Remove
                </button>
            </div>
            <div className="flex flex-wrap justify-center md:justify-between gap-4 mbs-4">
                <div>
                    <Sparkline
                        {...sparklineProps}
                        data={city.temperature}
                        format={value => `${value}°C`}
                    />
                    <p className="font-medium text-gray-700 dark:text-gray-300">Temperature</p>
                </div>
                <div>
                    <Sparkline
                        {...sparklineProps}
                        data={city.humidity}
                        format={value => `${value}%`}
                    />
                    <p className="font-medium text-gray-700 dark:text-gray-300">Humidity</p>
                </div>
                <div>
                    <Sparkline
                        {...sparklineProps}
                        data={city.precipitation}
                        format={value => `${value}mm`}
                    />
                    <p className="font-medium text-gray-700 dark:text-gray-300">Precipitation</p>
                </div>
            </div>
        </article>
    );
}
