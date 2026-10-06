import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import  Weather from './components/Weather';
import FavouritesList from './components/FavouritesList';

// researched this to find it displaying errors because of jsx not being recognized in tsx files.

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  
  return (
  <div className="App">
    <h1>Weather Board</h1>
    
    {isLoggedIn ? (
      <Weather />
    ) : (
      <>
        {showLogin ? (
          <>
            <Login setIsLoggedIn={setIsLoggedIn} />
            <p>Don't have an account? <button onClick={() => setShowLogin(false)}>Register</button></p>
          </>
        ) : (
          <>
            <Register setShowLogin={setShowLogin} />
            <p>Already have an account? <button onClick={() => setShowLogin(true)}>Login</button></p>
          </>
        )}
      </>
    )}
  </div>
);
};

export default App;