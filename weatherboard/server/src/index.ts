import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Client } from 'pg';

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies and put in req.body
  
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'devpassword',
  port: 5432,
});

client.connect();

if (client) {
  console.log('Connected to PostgreSQL database');
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await client.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, password]
    );

    const newUser = result.rows[0];
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Username already exists or invalid' });
  }
  
});

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});