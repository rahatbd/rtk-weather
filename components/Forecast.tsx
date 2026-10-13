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
        <article>
            <h2>{formatCity(city)}</h2>
            <button onClick={() => dispatch(removeCity({latitude: city.latitude, longitude: city.longitude}))}>❌ Remove</button>
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
        </article>
    );
}
