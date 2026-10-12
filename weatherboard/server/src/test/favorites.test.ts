import request from 'supertest';
import { Client } from 'pg';
import { resetTestDatabase, getTestClient, closeResetClient } from './setup';
import app, { client as globalClient } from '../index';

let client: Client;
let token1: string;
let token2: string;
let userId1: number;
let userId2: number;

beforeAll(async () => {
  client = getTestClient();
  await client.connect();
});

afterAll(async () => {
  await client.end();
  await closeResetClient();
});

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

describe('Favorites Endpoints', () => {
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