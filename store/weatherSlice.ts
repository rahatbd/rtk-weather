import {createSlice, current, type PayloadAction} from '@reduxjs/toolkit';

type WeatherCity = {
    name: string;
    latitude: number;
    longitude: number;
    temperature: number[];
    humidity: number[];
    pressure: number[];
};

type WeatherState = {
    cities: WeatherCity[];
};

const initialState: WeatherState = {
    cities: [],
};

const WeatherSlice = createSlice({
    name: 'weather',
    initialState,
    reducers: {
        addCity(state, action: PayloadAction<WeatherCity>) {
            // console.log('action:', action);
            state.cities.unshift(action.payload);
            console.log(current(state));
        },
    },
});

export const {addCity} = WeatherSlice.actions;
export default WeatherSlice.reducer;
