/**
 * Login Component
 *
 * Provides a form for users to authenticate with their username and password.
 * On successful login, stores the JWT token in localStorage and updates the parent
 * component's logged-in state. This component is shown when the user is not yet
 * authenticated (before they log in or register).
 *
 * The token is the key to accessing protected features like managing favorites.
 * If the token is deleted or tampered with from localStorage, the user will need
 * to log in again.
 */

import React, { useState } from 'react';
import './Login.css';

/**
 * @component
 * @param {Object} props
 * @param {Function} props.setIsLoggedIn - Callback function to update parent component's login state
 * @returns {JSX.Element} Login form UI
 */
const Login = ({ setIsLoggedIn }) => {
    /**
     * Username input value.
     * Controlled component — the input field value is always in sync with this state.
     * @type {[string, Function]}
     */
    const [username, setUsername] = useState('');

    /**
     * Password input value.
     * Controlled component — the input field value is always in sync with this state.
     * @type {[string, Function]}
     */
    const [password, setPassword] = useState('');

    /**
     * Handle form submission and authenticate the user.
     *
     * Flow:
     * 1. Prevent default form submission behavior
     * 2. Send username and password to backend login endpoint
     * 3. On success: store JWT token and update parent component state
     * 4. On failure: show error message to user
     * 5. On network error: alert user about connection issue
     *
     * After successful login, the form inputs are cleared and the parent component
     * re-renders to show the weather/favorites view instead of the login form.
     *
     * @async
     * @param {Event} e - Form submit event
     * @returns {Promise<void>} Updates app state and localStorage on success
     */
    const handleSubmit = async (e) => {
        /**
         * Stop form from doing a full page reload on submit.
         */
        e.preventDefault();

        try {
            /**
             * Send credentials to the backend login endpoint.
             * The backend will verify the credentials and return a JWT token if valid.
             */
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                /**
                 * Login succeeded. Extract the token from the response.
                 */
                const data = await response.json();

                /**
                 * Store the token in localStorage.
                 * This token will be sent in the Authorization header for protected endpoints.
                 * It persists across browser sessions (even after closing the browser).
                 */
                localStorage.setItem('token', data.token);

                /**
                 * Tell the parent App component that the user is now logged in.
                 * This triggers a re-render that switches from login/register forms to the weather view.
                 */
                setIsLoggedIn(true);

                /**
                 * Clear the form fields after successful login.
                 * Good UX practice — user can see the form reset.
                 */
                setUsername('');
                setPassword('');
            } else {
                /**
                 * Login failed — invalid credentials.
                 * Send a generic error message (don't reveal if username or password is wrong).
                 */
                alert('Login failed. Check your credentials.');
            }
        } catch (error) {
            /**
             * Network error — backend is unreachable.
             */
            alert('Error connecting to server');
        }
    };

    return (
        <div className="login-container">
            {/* Login form */}
            <form onSubmit={handleSubmit} className="h3-fr-card h3-fr-border h3-fr-flex-column">
                <h2 className="h3-fr-type-heading-4">Login</h2>

                {/* Username input — controlled component */}
                {/* Value comes from state, so React always knows what's typed */}
                {/* onChange updates state every keystroke */}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {/* Password input — controlled component */}
                {/* type="password" hides the characters as user types */}
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Submit button — triggers handleSubmit via form onSubmit */}
                <button type="submit" className="h3-fr-button h3-fr-primary">Login</button>
            </form>
        </div>
    );
};

export default Login;