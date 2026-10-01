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

    const handleSearch = () => {
        if (!search.trim()) { // trim removes whitespacing from both sides.
            alert('Please enter a City name.');
            setResult(null); // clear searchbar if the result is empty.
            return; 
        }
    
    const foundWeather = mockWeatherData.find(
        weather => weather.city.toLowerCase() === search.trim().toLowerCase());
        setResult(foundWeather || null); // if not found result set to null.
    }; // loops thru Weather data to find city that matches condition. 
    
    useEffect(() => {
        inputRef.current.focus();
    }, []);
    return ( 

        <div className="weather">
            <div className="search-bar">
                <input 
                    ref={inputRef} 
                    type="text" 
                    placeholder="Search for any City"
                    value={search}  // showing what user typed
                    onChange={(e) => setSearch(e.target.value)} // updates state as they type.
                />

                <img 
                    src={search_icon} 
                    alt="" 
                    onClick={handleSearch}
                />
            </div>
            
            {showFavourites ? (
                <FavouritesList />
            ) : (
                <div className="weather-info">
                    {result ? (
                        <>
                            <img src={cloudy_icon} alt={result.condition} className="weather-icon" />
                            <p className="temperature">{result.temperature}°C</p>
                            <p className="location">{result.city}</p>
                        </>
                    ) : (
                        <p> Search for a city to see its weather</p>
                    )}
                </div>
            )}

        <button onClick={() => setShowFavourites(!showFavourites)}>
            {showFavourites ? 'Show Weather' : 'Show Favourites'}
        </button>
            
        </div>
    )
}

export default Weather