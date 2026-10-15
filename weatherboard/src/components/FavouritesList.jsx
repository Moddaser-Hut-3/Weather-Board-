/**
 * FavouritesList Component
 *
 * Displays the authenticated user's list of favorite cities with options to delete them.
 * The list is loaded from the backend on component mount and refreshes after any deletion.
 * Handles three states: loading (initial fetch), error (API failure), and success (display list).
 *
 * Users can view all their saved favorites and remove cities they no longer want to track.
 */

import React, { useState, useEffect } from 'react';
import './FavouritesList.css';

/**
 * @component
 * @returns {JSX.Element} List of favorite cities with delete functionality
 */
const FavouritesList = () => {
  /**
   * List of user's favorite city objects.
   * Each object contains: id, user_id, city_name, latitude, longitude, created_at.
   * Fetched from backend and updated when favorites are added or deleted.
   * @type {[Array, Function]}
   */
  const [favorites, setFavorites] = useState([]);

  /**
   * Loading state while fetching favorites from backend.
   * Shows a loading message during initial fetch and after deletions.
   * @type {[boolean, Function]}
   */
  const [loading, setLoading] = useState(true);

  /**
   * Error message if the API call fails.
   * Could be network error or server error. Displayed to user instead of the list.
   * Cleared on successful fetch.
   * @type {[string, Function]}
   */
  const [error, setError] = useState('');

  /**
   * Delete a favorite city from the user's list.
   * Sends a DELETE request to the backend with the favorite's ID.
   * After successful deletion, refetches the entire list to stay in sync.
   * Shows user-friendly alerts for errors.
   *
   * @async
   * @param {number} id - The database ID of the favorite to delete
   * @returns {Promise<void>} Refetches favorites on success, alerts on failure
   */
  const handleDelete = async (id) => {
    /**
     * Get the JWT token from localStorage to authenticate the request.
     */
    const token = localStorage.getItem('token');
    try {
      /**
       * Send DELETE request to remove the favorite.
       * The backend checks ownership (user can only delete their own favorites).
       */
      const response = await fetch(`http://localhost:3001/api/favorites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        /**
         * Deletion succeeded. Refetch the entire list to reflect the change.
         * This ensures the UI stays in sync with the backend.
         */
        fetchFavorites();
      } else {
        alert('Failed to delete favorite');
      }
    } catch (error) {
      /**
       * Network error — backend is unreachable.
       */
      alert('Error deleting favorite');
    }
  };

  /**
   * Fetch all favorite cities for the authenticated user from the backend.
   * This runs on component mount and after any deletions.
   * Handles three states: loading, error, and success.
   * Always clears loading state in finally block, whether request succeeds or fails.
   *
   * @async
   * @returns {Promise<void>} Updates favorites, error, and loading states
   */
  const fetchFavorites = async () => {
    try {
      /**
       * Get the JWT token from localStorage for authentication.
       */
      const token = localStorage.getItem('token');

      /**
       * Request all favorites belonging to this user.
       * The backend filters by user_id (from the JWT token).
       */
      const response = await fetch('http://localhost:3001/api/favorites', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        /**
         * Successfully fetched favorites. Update state and clear any previous errors.
         */
        const data = await response.json();
        setFavorites(data);
        setError('');
      } else {
        /**
         * Server returned an error status (4xx, 5xx).
         * Set error message so UI displays it to the user.
         */
        setError('Failed to load favourites');
      }
    } catch (error) {
      /**
       * Network error — couldn't connect to backend.
       * Display error message to user.
       */
      setError('Error connecting to the server');
    } finally {
      /**
       * Always clear loading state when done.
       * This happens whether fetch succeeded, failed, or threw an error.
       * Prevents infinite loading spinner.
       */
      setLoading(false);
    }
  };

  /**
   * Load favorites when component mounts.
   * Runs once on initial render (empty dependency array).
   * Fetches the user's favorite cities from the backend.
   */
  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="favourites-list">
      <h2>Favourite Cities</h2>

      {/* Three conditional render states: loading, error, or success */}
      {loading ? (
        /**
         * Fetch is in progress. Show loading indicator.
         */
        <p>Loading favorites...</p>
      ) : error ? (
        /**
         * Fetch failed. Display the error message to the user.
         * Error message explains what went wrong (network, server, etc).
         */
        <p>{error}</p>
      ) : (
        /**
         * Fetch succeeded. Show the list of favorites or empty state.
         */
        <div className="favourites-container">
          {favorites.length === 0 ? (
            /**
             * User has no favorites yet. Show helpful message encouraging them to add some.
             */
            <p>No favourite cities yet. Search and click the heart!</p>
          ) : (
            /**
             * User has favorites. Display them in a list with delete buttons.
             */
            <ul>
              {/**
               * Loop through each favorite and render a list item.
               * key={fav.id} helps React identify which items have changed/been added/removed.
               * Each item shows the city name and a delete button.
               */}
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