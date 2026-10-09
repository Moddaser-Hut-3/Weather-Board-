import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Weather from './components/Weather';
import FavouritesList from './components/FavouritesList';
import './App.css';

// researched this to find it displaying errors because of jsx not being recognized in tsx files.

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
  <div className="App">
    <div className="app-header">
      <h1>Weather Board</h1>
      {isLoggedIn && (
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      )}
    </div>

    {isLoggedIn ? (
      <Weather />
    ) : (
      <>
        {showLogin ? (
          <>
            <Login setIsLoggedIn={setIsLoggedIn} />
            <p className="auth-toggle">Don't have an account? 
              <button onClick={() => setShowLogin(false)}>Register</button>
            </p>
          </>
        ) : (
          <>
            <Register setShowLogin={setShowLogin} />
            <p className="auth-toggle">Already have an account? 
              <button onClick={() => setShowLogin(true)}>Login</button>
            </p>
          </>
        )}
      </>
    )}
  </div>
  );
};

export default App;