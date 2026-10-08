import React from 'react';
import './Weather.css';
import search_icon from '../assets/search.png';
import cloudy_icon from '../assets/cloudy.png';
import rainy_icon from '../assets/rainy.png';
import sunny_icon from '../assets/sunny.png';
import windy_icon from '../assets/windy.png';
import snowy_icon from '../assets/snowy.png';
import stormy_icon from '../assets/stormy.png';
import FavouritesList from './FavouritesList';
import { useState, useRef, useEffect } from 'react';


const Weather = () => {
    const inputRef = useRef(null); // for focusing the input field on component mount
    const [showFavourites, setShowFavourites] = useState(false); // for tracking weather or favourites toggle.
    const [search, setSearch] = useState(''); // for tracking the search input value.
    const [result, setResult] = useState(null); // tracking searched city weather.
    const [message, setMessage] = useState('');
    const [favourites, setFavourites] = useState([]); // for tracking favourite cities.
    const [loading, setLoading] = useState(false); // for tracking API request status

    const fetchGeocode = async (city) => { // converts city namen to coordinates so we can fetch weather.
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const data = await response.json();
        return data?.results?.[0] || null;
    };

    const fetchWeather = async (latitude, longitude) => { // Gets actual weather data for those coordinates.
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`);
        const data = await response.json();
        return data.current_weather;
    };

    const getConditionFromCode = (code) => { // API returns numeric codes, but we need readable conditions for the UI.
        const conditions = {
            0: 'Sunny',
            1: 'Cloudy',
            2: 'Cloudy',
            3: 'Cloudy',
            45: 'Cloudy',
            48: 'Cloudy',
            51: 'Rainy',
            53: 'Rainy',
            55: 'Rainy',
            61: 'Rainy',
            63: 'Rainy',
            65: 'Rainy',
            80: 'Rainy',
            81: 'Rainy',
            82: 'Rainy',
            85: 'Snowy',
            86: 'Snowy',
            71: 'Snowy',
            73: 'Snowy',
            75: 'Snowy',
            77: 'Snowy',
            80: 'Windy',
            95: 'Stormy',
            96: 'Stormy',
            99: 'Stormy'
        };
        return conditions[code] || 'Cloudy';
    };

    const handleSearch = async () => {
        if (!search.trim()) {
            setResult(null);
            setMessage('');
            return;
        } // empty search bar wont trigger API calls. return. 

        setLoading(true);
        setMessage('');
        setSearch(''); 
        setResult(null); // clear old data before making new requests.

        try {
            const geoData = await fetchGeocode(search);

            if (!geoData) {
                setMessage(`"${search}" not found. Check the spelling and try again.`);
                setLoading(false);
                return;
            } // if city not found, stop here. no point fetching weather with bad coordinates.

            const weatherData = await fetchWeather(geoData.latitude, geoData.longitude);
            // fetch both pieces of data in sequence - second call needs output from first call. 

            setResult({
                city: geoData.name,
                temperature: Math.round(weatherData.temperature),
                condition: getConditionFromCode(weatherData.weathercode)
            });

            setMessage(''); // clears prev message on successful search
        } catch (error) {
            setMessage('Network error. Please check your connection and try again.');
            setResult(null);
        } finally {
            setLoading(false); // always stop loading regardless of success or failure to avoid infinite loading state.
        }
    };

    const getWeatherIcon = (condition) => {
        const iconMap = {
            "Rainy": rainy_icon,
            "Sunny": sunny_icon,
            "Cloudy": cloudy_icon,
            "Windy": windy_icon,
            "Snowy": snowy_icon,
            "Stormy": stormy_icon
        };
        return iconMap[condition] || cloudy_icon;
    };

    const toggleFavourite = () => {
        if (!result) return;

        const isFavourited = favourites.some(fav => fav.city === result.city); // .some method verifies the city is in fav.

        if (isFavourited) {
            setFavourites(favourites.filter(fav => fav.city !== result.city)); // removes the city from favourites if it already exists
        } else {
            setFavourites([...favourites, result]); // adds the city to favourites if it doesn't exist
        }
    };


    
    useEffect(() => {
        inputRef.current.focus(); // for focusing the input field on component mount
    }, []);
    return ( 

        <div className="weather">
            <div className="search-bar">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for any City"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                />

                <img 
                    src={search_icon} 
                    alt="" 
                    onClick={handleSearch}
                />
            </div>
            
            {showFavourites ? (
                <FavouritesList favourites={favourites} />
            ) : (
                <div className="weather-info">
                    {loading ? (
                        <p>Loading...</p>
                    ) : result ? (
                        <>
                            <button onClick={toggleFavourite} className="favourite-button">
                                {favourites.some(fav => fav.city === result.city) ? '❤️' : '🤍'} Favourite
                            </button>
                            <img src={getWeatherIcon(result.condition)} alt={result.condition} className="weather-icon" />
                            <p className="temperature">{result.temperature}°C</p>
                            <p className="location">{result.city}</p>
                        </>
                    ) : (
                        <p> {message || 'Search for a city to see its weather'}</p>
                    )}
                </div>
            )}

        <button onClick={() => setShowFavourites(!showFavourites)}> 
            {showFavourites ? 'Show Weather' : 'Show Favourites'}
        </button>
            
        </div>
    )
}

export default Weather;