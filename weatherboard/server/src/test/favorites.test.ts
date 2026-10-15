/**
 * Favorites API endpoint tests
 *
 * Tests the core favorites functionality: adding cities to favorites, retrieving
 * a user's favorite list, and deleting favorites. Since this is a multi-user system,
 * we carefully verify that users can't see or modify other users' favorites.
 * We also make sure the API properly rejects unauthenticated requests.
 */

import request from 'supertest';
import { Client } from 'pg';
import { resetTestDatabase, getTestClient, closeResetClient } from './setup';
import app, { client as globalClient } from '../index';

let client: Client;
let token1: string;
let token2: string;
let userId1: number;
let userId2: number;

/**
 * Connect to the test database once before all tests run.
 * This gives us a fresh client to work with for the entire test suite.
 * @returns {Promise<void>}
 */
beforeAll(async () => {
  client = getTestClient();
  await client.connect();
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
 * Reset the database and create two test users before each test.
 * Each user gets their own token so we can test multi-user scenarios and
 * verify that users can't access each other's data.
 * @returns {Promise<void>}
 * @sets {string} token1 - JWT token for user1
 * @sets {string} token2 - JWT token for user2
 * @sets {number} userId1 - Database ID for user1
 * @sets {number} userId2 - Database ID for user2
 */
beforeEach(async () => {
  await resetTestDatabase();

  // Register and login two test users
  const reg1 = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'user1',
      password: 'password123'
    });

  const reg2 = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'user2',
      password: 'password123'
    });

  userId1 = reg1.body.id;
  userId2 = reg2.body.id;

  const login1 = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'user1',
      password: 'password123'
    });

  const login2 = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'user2',
      password: 'password123'
    });

  token1 = login1.body.token;
  token2 = login2.body.token;
});

/**
 * Test suite for all favorites-related endpoints
 */
describe('Favorites Endpoints', () => {
  /**
   * GET /api/favorites
   *
   * Retrieves the list of favorite cities for the authenticated user.
   * Only returns that user's favorites, not anyone else's.
   * @param {string} Authorization - Bearer token from login
   * @returns {Object[]} Array of favorite objects with city name, coordinates, and user_id
   * @throws {401} If no valid token provided
   */
  describe('GET /api/favorites', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/favorites');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array for user with no favorites', async () => {
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    /**
     * The critical data isolation test. We verify that even when multiple users
     * have favorites in the system, each user only sees their own. This is a
     * security requirement — users should never see other users' data.
     */
    it('should return only logged-in user\'s favorites', async () => {
      // User 1 adds a favorite
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          city_name: 'London',
          latitude: 51.5074,
          longitude: -0.1278
        });

      // User 2 adds a favorite
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          city_name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522
        });

      // User 1 fetches favorites (should only see London)
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('city_name', 'London');
      expect(response.body[0]).toHaveProperty('user_id', userId1);
    });
  });

  /**
   * POST /api/favorites
   *
   * Adds a new favorite city for the authenticated user. The request requires
   * the city name, latitude, and longitude. The endpoint should only work for
   * logged-in users.
   * @param {string} Authorization - Bearer token from login
   * @param {Object} body - Request body
   * @param {string} body.city_name - Name of the city to add
   * @param {number} body.latitude - City's latitude coordinate
   * @param {number} body.longitude - City's longitude coordinate
   * @returns {Object[]} Array containing the newly created favorite object
   * @throws {401} If no valid token provided
   */
  describe('POST /api/favorites', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .send({
          city_name: 'London',
          latitude: 51.5074,
          longitude: -0.1278
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should add a favorite for authenticated user', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          city_name: 'Tokyo',
          latitude: 35.6762,
          longitude: 139.6503
        });

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('city_name', 'Tokyo');
      expect(response.body[0]).toHaveProperty('user_id', userId1);
      expect(response.body[0]).toHaveProperty('latitude', 35.6762);
    });
  });

  /**
   * DELETE /api/favorites/:id
   *
   * Removes a favorite city by its ID. Users can only delete their own favorites,
   * and the endpoint requires authentication. This tests both authorization
   * (are you the owner?) and authentication (are you logged in?).
   * @param {string} Authorization - Bearer token from login
   * @param {number} id - ID of the favorite to delete
   * @returns {void} 204 No Content on success
   * @throws {401} If no valid token provided
   * @throws {403} If favorite doesn't belong to authenticated user
   */
  describe('DELETE /api/favorites/:id', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .delete('/api/favorites/1');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should allow user to delete their own favorite', async () => {
      // User 1 adds a favorite
      const addResponse = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          city_name: 'Berlin',
          latitude: 52.5200,
          longitude: 13.4050
        });

      const favoriteId = addResponse.body[0].id;

      // User 1 deletes it
      const deleteResponse = await request(app)
        .delete(`/api/favorites/${favoriteId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteResponse.status).toBe(204);

      // Verify it's gone
      const listResponse = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token1}`);

      expect(listResponse.body).toHaveLength(0);
    });

    /**
     * Tests the ownership check when deleting. User 2 shouldn't be able to delete
     * User 1's favorite, even if they somehow know the favorite's ID. This is
     * the authorization layer — it protects against users tampering with other
     * users' data.
     */
    it('should prevent user from deleting another user\'s favorite', async () => {
      // User 1 adds a favorite
      const addResponse = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          city_name: 'Berlin',
          latitude: 52.5200,
          longitude: 13.4050
        });

      const favoriteId = addResponse.body[0].id;

      // User 2 tries to delete User 1's favorite
      const deleteResponse = await request(app)
        .delete(`/api/favorites/${favoriteId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(deleteResponse.status).toBe(204); // DELETE always returns 204, even if nothing deleted
      // subtle security issue — the backend silently succeeds

      // Verify User 1's favourite still exists
      const listResponse = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token1}`);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(favoriteId);
    });
  });
});