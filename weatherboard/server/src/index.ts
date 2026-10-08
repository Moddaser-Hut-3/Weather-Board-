import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express(); // handles all HTTP requests
app.use(express.json()); // Middleware to parse JSON request bodies and put in req.body
  
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true  // allows cookies and authentication headers to be sent with requests
})); // Allows requests from react frontend

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

client.connect();

if (client) {
  console.log('Connected to PostgreSQL database');
}

const authMiddleware = (req: any, res: any, next: any) => { // extracting tokens from header:
  const token = req.headers.authorization?.split(' ')[1]; // splits string by space and creates an array with two elements

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try { // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any; // stores decoded payload
    req.userId = decoded.userId;
    next(); // token valid - decode it and return the payload
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => { // register endpoint
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    const newUser = result.rows[0];
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Username already exists or invalid' });
  }
  
});


app.post('/api/auth/login', async (req, res) => {
  try {

    const { username, password } = req.body;

    const result = await client.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Database integrity error' });
    }

    const user = result.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({ message: 'Login successful', token });

  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/favorites', authMiddleware, async (req: any, res: any) => {
  try {

    const result = await client.query(
      'SELECT id, user_id, city_name, latitude, longitude, created_at FROM favourite_cities WHERE user_id = $1',
      [req.userId]
    );

    res.status(200).json(result.rows)
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

app.post('/api/favorites', authMiddleware, async (req: any, res: any) => {
  try {
    const { city_name, latitude, longitude } = req.body;

    const result = await client.query(
      'INSERT INTO favourite_cities (user_id, city_name, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, city_name, latitude, longitude]
    );

    res.status(201).json(result.rows);

  } catch (error) {
    res.status(400).json({ error: 'Failed to add favourite' });
  }
});

app.delete('/api/favorites/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const id = req.params.id; // extracts ID from the URL path: /api/favorites/1 where id=1 for example.
    
    const result = await client.query(
      'DELETE FROM favourite_cities WHERE id = $1 AND user_id = $2',
      [id, req.userId] // req.userID comes from authMiddleware, not from params.
    ); 

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete favourite'})
  }
});

/* 
  - All 3 favorite endoints (GET, POST, DELETE) are protected by authMiddleware
  - So only authenticated users can access them
  - Without it, anyone can use these endpoints without logging in. 
  - With Middleware, server checks token first before route handler runs.
*/

app.post('/api/auth/logout', authMiddleware, (_req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});