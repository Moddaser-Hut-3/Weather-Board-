import React, { useState } from 'react';
import './Register.css';

const Register = ({ setShowLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Registration successful! Please log in.');
            setShowLogin(true);
            setUsername('');
            setPassword('');
        } else {
            alert('Registration failed. Username might already exist.');
        }
    } catch (error) {
        alert('Error connecting to server');
    }
};

    return (
        <div className="register-container">
            <form onSubmit={handleSubmit}>
                <h2>Register</h2>
                
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;
