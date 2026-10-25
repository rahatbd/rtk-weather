import {createSlice, createAsyncThunk, type PayloadAction} from '@reduxjs/toolkit';
import {formatCity, fetchData} from '../utils';

type CityLocation = {
    name: string;
    admin1?: string;
    country: string;
};

type CityCoordinates = {
    latitude: number;
    longitude: number;
};

type CityData = CityLocation & CityCoordinates;

type FetchWeatherRequest = CityData & {
    source: 'storage' | 'search';
};

type WeatherCity = CityData & {
    temperature: number[];
    windSpeed: number[];
    precipitation: number[];
};

type WeatherState = {
    isLoading: boolean;
    isInitialized: boolean;
    cities: WeatherCity[];
    error: string | null;
};

type WeatherResponse = {
    hourly: {
        temperature_2m: number[];
        wind_speed_10m: number[];
        precipitation: number[];
    };
};

const initialState: WeatherState = {
    isLoading: false,
    isInitialized: false,
    cities: [],
    error: null,
};

export const fetchWeather = createAsyncThunk('weather/fetchWeather', async (city: FetchWeatherRequest) => {
    const {name, admin1, country, latitude, longitude} = city;
    const signal = AbortSignal.timeout(5_000);
    const weatherData = await fetchData<WeatherResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,wind_speed_10m,precipitation&forecast_hours=168&timezone=auto`,
        signal,
    );
    const {temperature_2m: temperature, wind_speed_10m: windSpeed, precipitation} = weatherData.hourly;
    return {name, admin1, country, latitude, longitude, temperature, windSpeed, precipitation};
});

const weatherSlice = createSlice({
    name: 'weather',
    initialState,
    reducers: {
        setInitialized: state => {
            state.isInitialized = true;
        },
        removeCity: (state, action: PayloadAction<CityCoordinates>) => {
            state.cities = state.cities.filter(city => city.latitude !== action.payload.latitude || city.longitude !== action.payload.longitude);
        },
    },
    extraReducers: builder => {
        builder.addCase(fetchWeather.pending, (state, action) => {
            if (action.meta.arg.source === 'search') {
                state.isLoading = true;
                state.error = null;
            }
        });
        builder.addCase(fetchWeather.fulfilled, (state, action) => {
            if (action.meta.arg.source === 'search') {
                state.isLoading = false;
            }
            const isDuplicate = state.cities.some(city => city.latitude === action.payload.latitude && city.longitude === action.payload.longitude);
            if (isDuplicate) {
                if (action.meta.arg.source === 'search') state.error = `${formatCity(action.payload)} is already in your forecasts.`;
                return;
            }
            state.cities.unshift(action.payload);
        });
        builder.addCase(fetchWeather.rejected, (state, action) => {
            if (action.meta.arg.source === 'search') {
                state.isLoading = false;
                state.error = 'Unable to load weather data. Please try again.';
            }
        });
    },
});

export type {CityLocation, CityData, WeatherCity};
export const {setInitialized, removeCity} = weatherSlice.actions;
export default weatherSlice.reducer;
