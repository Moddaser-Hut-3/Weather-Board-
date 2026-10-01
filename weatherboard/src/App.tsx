import React from 'react';
import  Weather from './components/Weather';
import FavouritesList from './components/FavouritesList';

const App = () => {
  return (
    <div className="App">
      <h1>Weather Board</h1>
      <Weather />
    </div>
  );
};

export default App;