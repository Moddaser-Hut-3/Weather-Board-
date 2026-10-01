import React from 'react';
import './FavouritesList.css';
import { mockWeatherData } from '../mockData';

const FavouritesList = () => {

  return ( // 
    <div className="favourites-list">
      <h2>Favourite Cities</h2>

      <div className="favourites-container">
        {mockWeatherData.map((weather, index) => (
          // Each item needs a unique 'key' prop (using index here)
          // Displaying the properties of each weather object in the mockWeatherData array
          <div key={index} className="favourite-item">
            <p className="city-name">{weather.city}</p>
            <p className="temperature">{weather.temperature}°C</p>
            <p className="condition">{weather.condition}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavouritesList;