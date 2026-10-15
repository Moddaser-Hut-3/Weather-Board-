/**
 * Authentication system tests
 *
 * Tests the core auth flow: user registration with unique usernames, login with valid credentials,
 * and password security. We verify that passwords are never stored in plaintext — they're hashed
 * with bcrypt before hitting the database. We also validate that JWT tokens are generated correctly
 * on successful login.
 */

import request from 'supertest';
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { resetTestDatabase, getTestClient, closeResetClient } from './setup';
import app, { client as globalClient } from '../index'

let client: Client;

/**
 * Connect to the test database once before all tests run.
 * This gives us a fresh client to work with for the entire test suite.
 * @returns {Promise<void>}
 */
beforeAll(async () => {
  client = getTestClient();
  await client.connect();
  // Run migrations on test database
});

/**
 * Clean up the database connection after all tests finish.
 * This prevents the test runner from hanging and frees up resources.
 * @returns {Promise<void>}
 */
afterAll(async () => {
  await client.end();
  await closeResetClient();
});

/**
 * Reset the database before each test to ensure a clean slate.
 * This prevents test data from one test leaking into the next.
 * @returns {Promise<void>}
 */
beforeEach(async () => {
  // Reset database before each test
  await resetTestDatabase();
});

/**
 * Test suite for all authentication-related endpoints
 */
describe('Auth Endpoints', () => {
  /**
   * POST /api/auth/register
   *
   * Creates a new user account. The username must be unique, and the password
   * is hashed with bcrypt before storage. The endpoint returns the new user object
   * with their database ID.
   * @param {Object} body - Request body
   * @param {string} body.username - Must be unique in the database
   * @param {string} body.password - Will be hashed with bcrypt before storage
   * @returns {Object} New user object with id, username, and timestamp
   * @throws {400} If username already exists or input is invalid
   */
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

  /**
   * POST /api/auth/login
   *
   * Authenticates a user with username and password. The password is compared
   * against the stored bcrypt hash. On success, returns a JWT token valid for
   * 24 hours that can be used to access protected endpoints.
   * @param {Object} body - Request body
   * @param {string} body.username - The username to authenticate
   * @param {string} body.password - The plaintext password (will be hashed and compared)
   * @returns {Object} Contains JWT token for subsequent requests
   * @throws {401} If username doesn't exist or password is wrong
   */
  describe('POST /api/auth/login', () => {
    /**
     * Set up a known user before each login test so we have consistent data.
     * @returns {Promise<void>}
     */
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

  /**
   * Password security validation
   *
   * Ensures that passwords are never stored in plaintext. This is a critical
   * security requirement — even if the database is compromised, passwords must
   * remain inaccessible. We verify that stored passwords are bcrypt hashes.
   */
  describe('Password hashing', () => {
    /**
     * Critical security test: verify passwords are hashed, not stored as plaintext.
     * This protects user accounts if the database is ever breached.
     */
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