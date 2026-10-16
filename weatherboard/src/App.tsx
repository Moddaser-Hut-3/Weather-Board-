/**
 * Weather Board App - Main Application Component
 *
 * The root component that handles authentication flow and routing between different views.
 * Manages two main states: whether the user is logged in, and whether they're viewing
 * the login or register form. Based on these states, displays either the auth forms
 * (Login/Register) or the main app (Weather view).
 *
 * Authentication Flow:
 * - Unauthenticated: Show login/register forms (based on showLogin state)
 * - Authenticated: Show weather board with favorites feature and logout button
 *
 * The logout button only appears when logged in and clears the stored JWT token.
 */

import { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Weather from './components/Weather';
import './App.css';

/**
 * @component
 * @returns {JSX.Element} The complete app with authentication and weather features
 */
const App = () => {
  /**
   * Whether the user is currently authenticated.
   * Determined by whether a valid JWT token is stored in localStorage.
   * When true, shows the weather/favorites view. When false, shows login/register forms.
   * @type {[boolean, Function]}
   */
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /**
   * Whether the light theme is shown. The framework's default is dark;
   * the h3-fr-dark class switches to light.
   * @type {[boolean, Function]}
   */
  const [isLight, setIsLight] = useState(false);

  /**
   * Whether to show the login form or register form.
   * Only relevant when isLoggedIn is false (user not authenticated).
   * When true, shows Login component. When false, shows Register component.
   * @type {[boolean, Function]}
   */
  const [showLogin, setShowLogin] = useState(true);

  /**
   * Handle user logout.
   *
   * Notifies the backend that the user is logging out (for consistency),
   * clears the JWT token from localStorage, and updates the app state
   * to show the login form again.
   *
   * In JWT-based authentication, the logout is primarily a client-side operation
   * (deleting the token). The backend endpoint call is for logging and future
   * features like token blacklisting.
   *
   * @async
   * @returns {Promise<void>} Clears token and resets authentication state
   */
  const handleLogout = async () => {
    /**
     * Get the JWT token from localStorage to authenticate the logout request.
     */
    const token = localStorage.getItem('token');

    /**
     * Notify the backend that the user is logging out.
     * This endpoint is protected by authMiddleware, so it verifies the token.
     * If the token is invalid or expired, the backend still responds with 401,
     * but we proceed with the client-side logout anyway.
     */
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    /**
     * Delete the token from localStorage.
     * Without this token, the user can't make requests to protected endpoints.
     * This is the critical step that logs the user out client-side.
     */
    localStorage.removeItem('token');

    /**
     * Update app state to show login form.
     * This triggers a re-render that switches from Weather view back to auth forms.
     */
    setIsLoggedIn(false);
  };

  return (
    <div className={`App h3-fr-app${isLight ? ' h3-fr-dark' : ''}`}>
      {/* App header with title, theme toggle and logout button */}
      <div className="app-header">
        <button
          onClick={() => setIsLight(!isLight)}
          className="theme-toggle h3-fr-button-icon"
          aria-label="Toggle light and dark theme"
          title="Toggle light and dark theme"
        >
          <div className={isLight ? 'h3-fr-icon-moon' : 'h3-fr-icon-sun'}></div>
        </button>
        <h1 className="h3-fr-type-heading-3">Weather Board</h1>
        {/**
         * Logout button only shows when user is logged in.
         * Clicking it calls handleLogout to clear the token and reset state.
         */}
        {isLoggedIn && (
          <button onClick={handleLogout} className="logout-btn h3-fr-button h3-fr-destructive">Logout</button>
        )}
      </div>

      {/**
       * Main routing logic based on authentication state.
       * Two main branches: authenticated users see the weather app,
       * unauthenticated users see login/register forms.
       */}
      {isLoggedIn ? (
        /**
         * User is authenticated. Show the main app: weather search and favorites.
         */
        <Weather />
      ) : (
        /**
         * User is not authenticated. Show either login or register form
         * based on showLogin state.
         */
        <>
          {showLogin ? (
            /**
             * Show login form with a toggle button to switch to register.
             * When user successfully logs in, Login component calls setIsLoggedIn(true).
             */
            <>
              <Login setIsLoggedIn={setIsLoggedIn} />
              <p className="auth-toggle">
                Don't have an account?
                <button onClick={() => setShowLogin(false)} className="h3-fr-button-frameless">Register</button>
              </p>
            </>
          ) : (
            /**
             * Show register form with a toggle button to switch to login.
             * When user successfully registers, Register component calls setShowLogin(true).
             */
            <>
              <Register setShowLogin={setShowLogin} />
              <p className="auth-toggle">
                Already have an account?
                <button onClick={() => setShowLogin(true)} className="h3-fr-button-frameless">Login</button>
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;