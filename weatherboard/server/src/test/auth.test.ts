import request from 'supertest';
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { resetTestDatabase, getTestClient } from './setup';
import app, { client as globalClient } from '../index'

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
}

let client: Client;

beforeAll(async () => {
  client = getTestClient();
  await client.connect();
  // Run migrations on test database
});

afterAll(async () => {
  await client.end();
  await globalClient.end();
});

beforeEach(async () => {
  // Reset database before each test
  await resetTestDatabase();
});

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with a valid username and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testuser');
    });

    it('should reject duplicate usernames', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      // Try to register same username again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'differentpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Password hashing', () => {
    it('should store password as bcrypt hash, not plaintext', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      // Query database directly to check password
      const result = await client.query(
        'SELECT password_hash FROM users WHERE username = $1',
        ['testuser']
      );

      const storedHash = result.rows[0].password_hash;

      // Hash should not be plaintext
      expect(storedHash).not.toBe('password123');

      // Hash should start with $2 (bcrypt prefix)
      expect(storedHash).toMatch(/^\$2[aby]\$/);
    });
  });
});