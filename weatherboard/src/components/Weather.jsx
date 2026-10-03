import React from 'react';
import './Weather.css';
import search_icon from '../assets/search.png';
import cloudy_icon from '../assets/cloudy.png';
import rainy_icon from '../assets/rainy.png';
import sunny_icon from '../assets/sunny.png';
import windy_icon from '../assets/windy.png';
import snowy_icon from '../assets/snowy.png';
import stormy_icon from '../assets/stormy.png';
import { mockWeatherData } from '../mockData';
import FavouritesList from './FavouritesList';
import { useState, useRef, useEffect } from 'react';


const Weather = () => {
    const inputRef = useRef(null); // for focusing the input field on component mount
    const [showFavourites, setShowFavourites] = useState(false); // for tracking weather or favourites toggle.
    const [search, setSearch] = useState(''); // for tracking the search input value.
    const [result, setResult] = useState(null); // tracking searched city weather. 
    const [message, setMessage] = useState('');
    const [favourites, setFavourites] = useState([]); // for tracking favourite cities.

    const handleSearch = () => {
        if (!search.trim()) {
            setResult(null);
            setMessage('');
            return;
        }

        const found = mockWeatherData.find(
            (weather) => weather.city.toLowerCase() === search.toLowerCase()
        );

        if (found) {
            setResult(found);
            setMessage('');
        } else {
            setResult(null);
            setMessage(`"${search}" not found. Try: Please check the spelling or try another city.`);
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
                    {result ? (
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