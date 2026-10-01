import React from 'react';
import './FavouritesList.css';

const FavouritesList = ({ favourites = [] }) => { // empty array if no favourites

  return (
    <div className="favourites-list">
      <h2>Favourite Cities</h2>

      <div className="favourites-container">
        {favourites.length === 0 ? ( // if length is 0, show message, else map through favourites and display them.
          <p>No favourite cities yet. Search and click the heart!</p>
        ) : (
        favourites.map((weather, index) => (
          <div key={index} className="favourite-item">
            <p className="city-name">{weather.city}</p>
            <p className="temperature">{weather.temperature}°C</p>
            <p className="condition">{weather.condition}</p>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default FavouritesList;