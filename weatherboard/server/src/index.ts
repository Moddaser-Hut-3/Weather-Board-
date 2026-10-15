/**
 * Weather Board Backend API
 *
 * Express server that handles user authentication (register/login/logout) and
 * a favorites management system. Users can add cities to their favorites, view
 * their list, and delete entries. All endpoints except registration and login
 * require a valid JWT token for access.
 *
 * Routes:
 * - POST /api/auth/register — Create a new user account
 * - POST /api/auth/login — Authenticate and receive a JWT token
 * - POST /api/auth/logout — Logout (token-protected)
 * - GET /api/favorites — List user's favorite cities (token-protected)
 * - POST /api/favorites — Add a favorite city (token-protected)
 * - DELETE /api/favorites/:id — Remove a favorite (token-protected)
 * - GET / — Health check endpoint
 */

import dotenv from 'dotenv';

/**
 * Load environment variables from .env files.
 * Tests use .env.test to avoid polluting the development database.
 * Development and production use the default .env file.
 */
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

import express from 'express';
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

/**
 * Initialize Express application.
 * This is the core server object that all routes and middleware attach to.
 */
const app = express();

/**
 * Parse incoming JSON request bodies.
 * Without this, req.body would be undefined. This middleware automatically
 * converts raw JSON from the client into JavaScript objects.
 */
app.use(express.json());

/**
 * Configure Cross-Origin Resource Sharing (CORS).
 * The React frontend runs on a different port (5173) than the backend (3001),
 * so we need CORS to allow the browser to make cross-origin requests.
 * We only allow our specific frontend origin for security.
 */
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true  // Allow Authorization headers and cookies with requests
}));

/**
 * PostgreSQL database connection.
 * Connection details come from DATABASE_URL environment variable.
 * This client handles all database queries throughout the application.
 */
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

/**
 * Establish connection to the database.
 * If the database is unavailable, this will throw an error.
 */
client.connect();

/**
 * Log successful database connection.
 * This helps verify the backend is fully initialized during startup.
 */
if (client) {
  console.log('Connected to PostgreSQL database');
}

/**
 * Authentication middleware — validates JWT tokens on protected routes.
 *
 * This middleware runs before any protected endpoint handler. It extracts the
 * JWT token from the Authorization header, verifies it's valid and not expired,
 * and attaches the user ID to the request object. If the token is missing,
 * invalid, or expired, the request is rejected with a 401 error and the route
 * handler never runs.
 *
 * Usage: app.post('/protected-route', authMiddleware, (req, res) => { ... })
 *
 * @param {Object} req - Express request object
 * @param {Object} req.headers - HTTP headers from the client
 * @param {string} req.headers.authorization - Should be "Bearer <token>"
 * @param {Object} res - Express response object
 * @param {Function} next - Callback to proceed to the next middleware/route handler
 * @returns {void} Calls next() if token is valid, or sends 401 error response
 */
const authMiddleware = (req: any, res: any, next: any) => {
  /**
   * Extract token from Authorization header.
   * Expected format: "Bearer eyJhbGc..."
   * The split creates ["Bearer", "eyJhbGc..."] and [1] gets the token part.
   * Optional chaining (?.) prevents crashes if the header doesn't exist.
   */
  const token = req.headers.authorization?.split(' ')[1];

  /**
   * Reject requests with no token.
   * A missing token means the user isn't logged in.
   */
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  /**
   * Verify the token's signature and expiration.
   * jwt.verify() will throw if the token is invalid, expired, or tampered with.
   * The decoded object contains the payload we encoded during login (userId).
   */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.userId = decoded.userId;
    /**
     * Token is valid. Attach the user ID to the request so the route handler
     * knows who this request is from. Then proceed to the next handler.
     */
    next();
  } catch (error) {
    /**
     * Token is invalid, expired, or the signature doesn't match.
     * Reject the request — the user is not authenticated.
     */
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * POST /api/auth/register
 *
 * Creates a new user account. The username must be unique, and the password
 * is immediately hashed with bcrypt before being stored. The plaintext password
 * is never persisted to the database.
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - User's unique identifier (must not already exist)
 * @param {string} req.body.password - Plaintext password (will be hashed before storage)
 * @returns {Object} 201 Created — The new user object with id, username, and created_at timestamp
 * @throws {400} Bad Request — If username is already taken or input is invalid
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    /**
     * Hash the password with bcrypt.
     * Salt rounds = 10 provides a good balance between security and performance.
     * Each hash is unique due to random salt, so same password produces different hash each time.
     */
    const hashedPassword = await bcrypt.hash(password, 10);

    /**
     * Insert the new user into the database.
     * RETURNING * sends back the full user row so we can return it to the client.
     * The username UNIQUE constraint prevents duplicate registrations.
     */
    const result = await client.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );

    const newUser = result.rows[0];
    res.status(201).json(newUser);
  } catch (error) {
    /**
     * Catch duplicate username or other database errors.
     * We send a generic 400 without revealing the specific error for security.
     */
    res.status(400).json({ error: 'Username already exists or invalid' });
  }
});


/**
 * POST /api/auth/login
 *
 * Authenticates a user with their username and password. On successful authentication,
 * returns a JWT token valid for 24 hours. The password is compared against the stored
 * bcrypt hash using bcrypt.compare(), which safely handles the one-way hash.
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - The username to authenticate
 * @param {string} req.body.password - The plaintext password to verify
 * @returns {Object} 200 OK — Contains JWT token for use in future requests
 * @throws {401} Unauthorized — If username doesn't exist or password is wrong
 * @throws {500} Internal Server Error — If database integrity check fails
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    /**
     * Look up the user by username.
     * We only select the fields needed: id (for the token) and password_hash (for comparison).
     */
    const result = await client.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    /**
     * User doesn't exist.
     * We send a generic 401 instead of saying "user not found" to prevent username enumeration attacks.
     */
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    /**
     * Database integrity check: there should be exactly one user with this username.
     * If we somehow have duplicates (which shouldn't happen due to UNIQUE constraint),
     * it's a critical database error we should flag.
     */
    if (result.rows.length > 1) {
      return res.status(500).json({ error: 'Database integrity error' });
    }

    const user = result.rows[0];

    /**
     * Compare the plaintext password against the stored bcrypt hash.
     * bcrypt.compare() hashes the input password with the salt stored in the hash
     * and compares the results. This is the secure way to verify passwords.
     */
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    /**
     * Password doesn't match the hash.
     * Generic error message again to avoid revealing whether the username exists.
     */
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    /**
     * Create a JWT token with the user's ID encoded in it.
     * The JWT_SECRET is used to sign the token so we can verify its authenticity later.
     * Token expires in 24 hours for security.
     */
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(200).json({ message: 'Login successful', token });

  } catch (error) {
    /**
     * Catch unexpected errors and return a generic 401.
     * Real-world errors might include database connection failures, JWT errors, etc.
     */
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * GET /api/favorites
 *
 * Retrieves all favorite cities for the authenticated user.
 * Each user only sees their own favorites — data isolation is enforced at the
 * database query level using the user_id from the JWT token.
 *
 * @param {string} Authorization - Bearer token (required, checked by authMiddleware)
 * @returns {Object[]} 200 OK — Array of favorite city objects
 * @throws {401} Unauthorized — If token is missing or invalid (checked by authMiddleware)
 * @throws {500} Internal Server Error — If database query fails
 */
app.get('/api/favorites', authMiddleware, async (req: any, res: any) => {
  try {
    /**
     * Query for all favorite cities belonging to this user.
     * The WHERE clause ensures users can only see their own data.
     * req.userId comes from authMiddleware, so it's guaranteed to be valid.
     */
    const result = await client.query(
      'SELECT id, user_id, city_name, latitude, longitude, created_at FROM favourite_cities WHERE user_id = $1',
      [req.userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    /**
     * Database query failed. This shouldn't happen in normal operation,
     * but we handle it gracefully with a 500 error.
     */
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

/**
 * POST /api/favorites
 *
 * Adds a new favorite city for the authenticated user.
 * The user ID is automatically pulled from the JWT token, so users can't
 * add favorites for other users.
 *
 * @param {string} Authorization - Bearer token (required, checked by authMiddleware)
 * @param {Object} req.body - Request body
 * @param {string} req.body.city_name - Name of the city to favorite
 * @param {number} req.body.latitude - City's latitude coordinate
 * @param {number} req.body.longitude - City's longitude coordinate
 * @returns {Object[]} 201 Created — Array containing the newly created favorite object
 * @throws {401} Unauthorized — If token is missing or invalid (checked by authMiddleware)
 * @throws {400} Bad Request — If data is invalid or database operation fails
 */
app.post('/api/favorites', authMiddleware, async (req: any, res: any) => {
  try {
    const { city_name, latitude, longitude } = req.body;

    /**
     * Insert the new favorite into the database.
     * req.userId (from authMiddleware) ensures this favorite belongs to the current user.
     * RETURNING * sends back the full row so we can return it to the client.
     */
    const result = await client.query(
      'INSERT INTO favourite_cities (user_id, city_name, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, city_name, latitude, longitude]
    );

    res.status(201).json(result.rows);

  } catch (error) {
    /**
     * Database insertion failed. Could be invalid data or connection issues.
     */
    res.status(400).json({ error: 'Failed to add favourite' });
  }
});

/**
 * DELETE /api/favorites/:id
 *
 * Removes a favorite city by its ID. The deletion is restricted to the owner —
 * the WHERE clause checks both the favorite's ID and that it belongs to the
 * authenticated user. This prevents one user from deleting another user's favorites.
 *
 * @param {string} Authorization - Bearer token (required, checked by authMiddleware)
 * @param {number} id - URL parameter for the favorite city's database ID
 * @returns {void} 204 No Content — Success response (no body)
 * @throws {401} Unauthorized — If token is missing or invalid (checked by authMiddleware)
 * @throws {400} Bad Request — If deletion fails (e.g., favorite doesn't exist or wrong owner)
 */
app.delete('/api/favorites/:id', authMiddleware, async (req: any, res: any) => {
  try {
    /**
     * Extract the favorite ID from the URL path.
     * Example: DELETE /api/favorites/123 → id = "123"
     */
    const id = req.params.id;

    /**
     * Delete the favorite only if it exists AND belongs to the authenticated user.
     * This is the critical security check — the AND user_id = $2 clause ensures
     * users can only delete their own favorites, not anyone else's.
     */
    const result = await client.query(
      'DELETE FROM favourite_cities WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    /**
     * Return 204 No Content on success.
     * This is the standard HTTP response for successful deletions with no response body.
     */
    res.status(204).send();
  } catch (error) {
    /**
     * Deletion failed. Could be invalid ID, permission issues, or database errors.
     */
    res.status(400).json({ error: 'Failed to delete favourite' });
  }
});

/**
 * POST /api/auth/logout
 *
 * Logs out the authenticated user. In a JWT-based system, logout is mostly
 * a frontend operation (client deletes the token). This endpoint exists for
 * consistency and to allow the client to signal logout to the backend if needed.
 *
 * @param {string} Authorization - Bearer token (required, checked by authMiddleware)
 * @returns {Object} 200 OK — Success message
 * @throws {401} Unauthorized — If token is missing or invalid (checked by authMiddleware)
 */
app.post('/api/auth/logout', authMiddleware, (_req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

/**
 * GET /
 *
 * Health check endpoint. This is a simple endpoint that verifies the server
 * is up and running. Useful for deployment monitoring and readiness checks.
 * No authentication required.
 *
 * @returns {Object} 200 OK — Server status message
 */
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

/**
 * Export the Express app for use in test files.
 * The tests import this to make HTTP requests without starting the actual server.
 */
export default app;

/**
 * Export the database client for test setup/teardown.
 * Tests use this to reset the database between test cases.
 */
export { client };

/**
 * Start the server if this file is run directly (not imported in tests).
 * Tests set NODE_ENV to 'test', so the server doesn't start during test runs.
 * This prevents port conflicts when running tests.
 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => {
    console.log('Server listening on port 3001');
  });
}