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
import { useState } from 'react';
import { useEffect } from 'react';
import FavouritesList from './FavouritesList';


const Weather = () => {
    const [showFavourites, setShowFavourites] = useState(false); // for tracking weather or favourites toggle.
    return ( 

        <div className="weather">
            <div className="search-bar">
                <input type="text" placeholder="Search for any City" />
                <img src={search_icon} alt="" />
            </div>
            
            {showFavourites ? (
                <FavouritesList />
            ) : (
                <div className="weather-info">
                    <img src={cloudy_icon} alt="Cloudy" className="weather-icon" />
                    <p className="temperature">20°C</p>
                    <p className="location">Paris</p>
                </div>
            )}

        <button onClick={() => setShowFavourites(!showFavourites)}>
            {showFavourites ? 'Show Weather' : 'Show Favourites'}
        </button>
            
        </div>
    )
}

export default Weather