/**
 * Weather Component
 *
 * The main weather display interface. Users search for cities by name, see current
 * weather conditions and temperature, and manage a personal list of favorite cities.
 * The component handles two views: weather search results and the favorites list.
 *
 * Features:
 * - Search cities by name (uses Open-Meteo geocoding API)
 * - Display current weather with temperature and condition icon
 * - Add/remove cities from favorites (requires authentication)
 * - Toggle between weather search and favorites view
 * - Persistent favorites fetched from backend on load
 */

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
    /**
     * Reference to the search input field.
     * Automatically focused when the component mounts for better UX.
     * @type {React.RefObject<HTMLInputElement>}
     */
    const inputRef = useRef(null);

    /**
     * Toggle between weather view and favorites list view.
     * @type {[boolean, Function]}
     */
    const [showFavourites, setShowFavourites] = useState(false);

    /**
     * Current search input value.
     * Controlled component — input value is always in sync with this state.
     * @type {[string, Function]}
     */
    const [search, setSearch] = useState('');

    /**
     * The most recent weather search result.
     * Contains city name, coordinates, temperature, and condition.
     * Null when no search has been made or search failed.
     * @type {[Object|null, Function]}
     */
    const [result, setResult] = useState(null);

    /**
     * User-facing messages: errors, "not found", or search hints.
     * Cleared when a new search is made or succeeds.
     * @type {[string, Function]}
     */
    const [message, setMessage] = useState('');

    /**
     * List of the logged-in user's favorite cities.
     * Fetched from backend on component mount and after adding a favorite.
     * @type {[Array, Function]}
     */
    const [favourites, setFavourites] = useState([]);

    /**
     * Loading state while API requests are in flight.
     * Shows a loading message to the user while waiting for responses.
     * @type {[boolean, Function]}
     */
    const [loading, setLoading] = useState(false);

    /**
     * Fetch coordinates from a city name using Open-Meteo geocoding API.
     * Converts user-friendly city name to latitude/longitude so we can fetch weather.
     *
     * @param {string} city - City name to search for (e.g., "London")
     * @returns {Promise<Object|null>} Geocoding result with name, latitude, longitude, or null if not found
     */
    const fetchGeocode = async (city) => {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const data = await response.json();
        return data?.results?.[0] || null;
    };

    /**
     * Fetch current weather data for given coordinates using Open-Meteo forecast API.
     * Returns temperature, weather code, wind speed, and other meteorological data.
     *
     * @param {number} latitude - Location latitude
     * @param {number} longitude - Location longitude
     * @returns {Promise<Object>} Weather data including temperature and weather code
     */
    const fetchWeather = async (latitude, longitude) => {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`);
        const data = await response.json();
        return data.current_weather;
    };

    /**
     * Fetch the logged-in user's favorite cities from the backend.
     * Uses the JWT token stored in localStorage for authentication.
     * Silently handles errors without interrupting the user experience.
     *
     * @async
     * @returns {Promise<void>} Updates the favourites state
     */
    const fetchFavourites = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3001/api/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setFavourites(data);
            }
        } catch (error) {
            console.error('Error fetching favourites:', error);
        }
    };

    /**
     * Convert Open-Meteo weather codes (numeric) to human-readable conditions.
     * The API returns codes like 0, 1, 51, 95 but the UI shows "Sunny", "Rainy", etc.
     * This mapping ensures consistent display across the app.
     *
     * @param {number} code - Weather code from Open-Meteo API
     * @returns {string} Readable condition (e.g., "Sunny", "Rainy", "Snowy")
     */
    const getConditionFromCode = (code) => {
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

    /**
     * Search for a city and fetch its current weather.
     * Handles the complete flow: geocoding, weather fetching, and error handling.
     * Uses dependent API calls — the second call (weather) needs output from the first (geocoding).
     *
     * Flow:
     * 1. Validate input isn't empty
     * 2. Fetch city coordinates via geocoding API
     * 3. If not found, show error and return
     * 4. Fetch weather data for those coordinates
     * 5. Transform data into display format (round temperature, convert weather codes)
     * 6. Handle network errors gracefully
     * 7. Always clear loading state when done
     *
     * @async
     * @returns {Promise<void>} Updates result, message, and loading states
     */
    const handleSearch = async () => {
        /**
         * Don't make API calls for empty searches.
         * Trim whitespace to catch "   " edge case.
         */
        if (!search.trim()) {
            setResult(null);
            setMessage('');
            return;
        }

        setLoading(true);
        setMessage('');
        setSearch('');
        setResult(null);

        try {
            /**
             * Step 1: Convert city name to coordinates.
             * If the city name doesn't exist or is misspelled, geocoding will return null.
             */
            const geoData = await fetchGeocode(search);

            if (!geoData) {
                setMessage(`"${search}" not found. Check the spelling and try again.`);
                setLoading(false);
                return;
            }

            /**
             * Step 2: Fetch weather for those coordinates.
             * This is a dependent call — we must have coordinates before calling this.
             */
            const weatherData = await fetchWeather(geoData.latitude, geoData.longitude);

            /**
             * Step 3: Transform API data into display format.
             * Round temperature for cleaner UI, convert numeric codes to readable conditions.
             */
            setResult({
                city: geoData.name,
                latitude: geoData.latitude,
                longitude: geoData.longitude,
                temperature: Math.round(weatherData.temperature),
                condition: getConditionFromCode(weatherData.weathercode)
            });

            setMessage('');
        } catch (error) {
            /**
             * Network error — API is unreachable or connection failed.
             * Show user-friendly error message.
             */
            setMessage('Network error. Please check your connection and try again.');
            setResult(null);
        } finally {
            /**
             * Always clear loading state, whether search succeeded or failed.
             * Without this, loading indicator could get stuck.
             */
            setLoading(false);
        }
    };

    /**
     * Map weather condition to its icon image.
     * Each condition has a corresponding visual asset for intuitive display.
     * Falls back to cloudy icon if condition isn't recognized.
     *
     * @param {string} condition - Readable weather condition (e.g., "Sunny", "Rainy")
     * @returns {string} Path to the weather icon asset
     */
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

    /**
     * Add the current search result to the user's favorites.
     * Sends the city name and coordinates to the backend, which stores them
     * in the user's account. Shows success/error feedback via alerts.
     *
     * Automatically refetches the favorites list after successful addition
     * so the UI stays in sync with the backend.
     *
     * @async
     * @returns {Promise<void>} Updates favourites list on success
     */
    const toggleFavourite = async () => {
        /**
         * Can't add a favorite without a search result.
         */
        if (!result) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:3001/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    city_name: result.city,
                    latitude: result.latitude,
                    longitude: result.longitude
                })
            });

            if (response.ok) {
                alert('Favourite added!');
                /**
                 * Refetch the favorites list so the heart icon updates immediately.
                 */
                fetchFavourites();
            } else if (response.status === 400) {
                /**
                 * 400 means this city is already in favorites (unique constraint).
                 */
                alert('Already favourited');
            }
        } catch (error) {
            alert('Error adding favourite');
        }
    };
    
    /**
     * Component initialization: focus input and load favorites.
     * Runs once on component mount (empty dependency array).
     *
     * This prepares the UI for user interaction:
     * - Input field is ready to receive text immediately
     * - Favorites are pre-loaded from the backend so heart icons display correctly
     */
    useEffect(() => {
        inputRef.current.focus();
        fetchFavourites();
    }, []);

    return (
        <div className="weather">
            {/* Search input section */}
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

            {/* Main content: either favorites list or weather results */}
            {showFavourites ? (
                /**
                 * Show the list of user's favorite cities.
                 * User can manage favorites from this view.
                 */
                <FavouritesList />
            ) : (
                /**
                 * Show weather search results.
                 * Has three states: loading, success (show weather), or empty/error (show message).
                 */
                <div className="weather-info">
                    {loading ? (
                        /**
                         * While API requests are in flight, show loading indicator.
                         */
                        <p>Loading...</p>
                    ) : result ? (
                        /**
                         * Search succeeded: display weather data with icon, temperature, location.
                         * Heart icon shows if this city is already in favorites.
                         */
                        <>
                            <button onClick={toggleFavourite} className="favourite-button">
                                {favourites.some(fav => fav.city === result.city) ? '❤️' : '🤍'} Favourite
                            </button>
                            <img src={getWeatherIcon(result.condition)} alt={result.condition} className="weather-icon" />
                            <p className="temperature">{result.temperature}°C</p>
                            <p className="location">{result.city}</p>
                        </>
                    ) : (
                        /**
                         * No search yet, or search failed.
                         * Show either the error message or a default prompt.
                         */
                        <p> {message || 'Search for a city to see its weather'}</p>
                    )}
                </div>
            )}

            {/* Toggle between weather and favorites view */}
            <button onClick={() => setShowFavourites(!showFavourites)}>
                {showFavourites ? 'Show Weather' : 'Show Favourites'}
            </button>
        </div>
    )
}

export default Weather;