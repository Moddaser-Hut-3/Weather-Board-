import React, { useState, useEffect } from 'react';
import './FavouritesList.css';

const FavouritesList = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/api/favorites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchFavorites(); // Refetch after deletion
      } else {
        alert('Failed to delete favorite');
      }
    } catch (error) {
      alert('Error deleting favorite');
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/favorites', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        setError(''); // Clear error on success
      } else {
        setError('Failed to load favourites');
      }
    } catch (error) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="favourites-list">
      <h2>Favourite Cities</h2>

      {loading ? (
        <p>Loading favorites...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="favourites-container">
          {favorites.length === 0 ? (
            <p>No favourite cities yet. Search and click the heart!</p>
          ) : (
            <ul>
              {favorites.map(fav => (
                <li key={fav.id}>
                  {fav.city_name}
                  <button onClick={() => handleDelete(fav.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default FavouritesList;