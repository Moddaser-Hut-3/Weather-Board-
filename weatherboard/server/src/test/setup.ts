import { Client } from 'pg';

let resetClient: Client | null = null;

export const getTestClient = () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  return client;
};

export const initResetClient = async () => {
  if (!resetClient) {
    resetClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await resetClient.connect();
  }
};

export const resetTestDatabase = async () => {
  if (!resetClient) {
    await initResetClient();
  }

  try {
    // Truncate tables (faster than DELETE, resets sequences)
    await resetClient!.query('TRUNCATE favourite_cities CASCADE;');
    await resetClient!.query('TRUNCATE users CASCADE;');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

export const closeResetClient = async () => {
  if (resetClient) {
    try {
      await resetClient.end();
    } catch (error) {
      console.error('Error closing reset client:', error);
    }
    resetClient = null;
  }
};