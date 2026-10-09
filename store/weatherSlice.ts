import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {fetchData} from '../api';

type FetchWeatherArgs = {
    name: string;
    admin1?: string;
    country: string;
    latitude: number;
    longitude: number;
};

type WeatherCity = FetchWeatherArgs & {
    temperature: number[];
    humidity: number[];
    precipitation: number[];
};

type WeatherState = {
    isLoading: boolean;
    cities: WeatherCity[];
    error: string | null;
};

type WeatherResponse = {
    hourly: {
        temperature_2m: number[];
        relative_humidity_2m: number[];
        precipitation: number[];
    };
};

const initialState: WeatherState = {
    isLoading: false,
    cities: [],
    error: null,
};

export const fetchWeather = createAsyncThunk('weather/fetchWeather', async (city: FetchWeatherArgs) => {
    const weatherData = await fetchData<WeatherResponse>(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation&forecast_hours=168&timezone=auto`,
    );
    const {temperature_2m: temperature, relative_humidity_2m: humidity, precipitation} = weatherData.hourly;
    return {...city, temperature, humidity, precipitation};
});

const weatherSlice = createSlice({
    name: 'weather',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(fetchWeather.pending, state => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchWeather.fulfilled, (state, action) => {
            state.isLoading = false;
            state.cities.unshift(action.payload);
        });
        builder.addCase(fetchWeather.rejected, state => {
            state.isLoading = false;
            state.error = 'Unable to load weather data. Please try again.';
        });
    },
});

export default weatherSlice.reducer;
