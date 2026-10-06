import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Client } from 'pg';
import bcrypt from 'bcrypt';

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

    const user = result.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }
    
    res.status(200).json({ message: 'Login successful', userID: user.id });

  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});


app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});