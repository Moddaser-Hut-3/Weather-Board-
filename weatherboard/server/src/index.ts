import express from 'express';
import { Client } from 'pg';

const app = express();

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

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});