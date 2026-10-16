/**
 * Register Component
 *
 * Provides a registration form for new users to create an account with a username
 * and password. On successful registration, the user is directed to the login form
 * to authenticate. After login, the JWT token will be stored in localStorage for
 * accessing protected features like favorites.
 *
 * A user cannot access the app unless they first register and then login.
 * Registering with a duplicate username is not permitted for security reasons.
 */

import React, { useState } from 'react';
import './Register.css';

/**
 * @component
 * @param {Object} props
 * @param {Function} props.setShowLogin - Callback function to switch to login form after successful registration
 * @returns {JSX.Element} Register form UI
 */
const Register = ({ setShowLogin }) => {
    /**
     * Username input value
     * Controlled component - the input value is always in sync with this state.
     * @type {[string, Function]}
     */
    const [username, setUsername] = useState('');

    /**
     * Password input value
     * Controlled component - the input field value is always in sync with this state.
     * @type {[string, Function]}
     */
    const [password, setPassword] = useState('');

    /**
     * Handle form submission and register the user.
     *
     * Flow:
     * 1. Prevent default form submission behavior
     * 2. Send username and password to backend register endpoint
     * 3. On success: display Login screen and update parent component state
     * 4. On failure: show error message to user
     * 5. On network error: alert user about connection issue
     *
     * After successful registration, the form inputs are cleared and the parent component
     * re-renders to show the login form.
     *
     * @async
     * @param {Event} e - Form submit event
     * @returns {Promise<void>} Redirects to login form on success
     */

    const handleSubmit = async (e) => {
        /**
         * Stop form from doing a full page reload on submit.
         */
    e.preventDefault();

    try {
        /**
         * Send credentials to the backend register endpoint.
         * The backend will create a new user account and store the hashed password.
         * Registration doesn't return a token — the user must login separately to get one.
         */
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            /**
             * Registration succeeded. Account is now created in the database.
             * Switch the view back to the login form so the user can authenticate.
             */
            alert('Registration successful! Please log in.');
            setShowLogin(true);

            /**
             * Clear the form fields for good UX.
             * Since we're switching views, this isn't strictly necessary, but it's
             * a good practice in case the user navigates back to register.
             */
            setUsername('');
            setPassword('');
        } else {
            /**
             * Registration failed - username must be unique. 
             * Sends generic message for security purposes.
             */
            alert('Registration failed. Username might already exist.');
        }
    } catch (error) {
        /**
         * Network error - backend is unreachable.
         */
        alert('Error connecting to server');
    }
};

    return (
        <div className="register-container">
            {/* Register form */}
            <form onSubmit={handleSubmit} className="h3-fr-card h3-fr-border h3-fr-flex-column">
                <h2 className="h3-fr-type-heading-4">Register</h2>

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
                <button type="submit" className="h3-fr-button h3-fr-primary">Register</button>
            </form>
        </div>
    );
};

export default Register;
