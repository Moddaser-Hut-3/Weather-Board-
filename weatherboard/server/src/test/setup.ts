import dotenv from 'dotenv';
import { Client } from 'pg';

// Load .env.test if NODE_ENV is 'test'
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
}

export const getTestClient = () => {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres_test',
    password: process.env.DATABASE_PASSWORD || 'devpassword',
    port: 5432,
  });
  return client;
};

export const resetTestDatabase = async () => {
  const client = getTestClient();
  await client.connect();
  
  try {
    // Delete all data from tables (order matters because of foreign keys)
    await client.query('DELETE FROM favourite_cities;');
    await client.query('DELETE FROM users;');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.end();
  }
};