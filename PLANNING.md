# for stage 3: 

<!--

Learning Plan for Stage 3

What we're building: A backend server with user registration and login. Users will get a token they can use to prove who they are on future requests.

The 10 steps:

1. Scaffold an Express + TypeScript project; run npm run dev and see it respond to a request

2. Connect to PostgreSQL via the pg library and test the connection

3. Create the users table with a node-pg-migrate migration

4. Write a POST /api/auth/register endpoint that accepts a username and password

5. Hash the password with bcrypt before saving it

6. Write a POST /api/auth/login endpoint that checks the username exists

7. Compare the submitted password to the stored hash; reject if wrong

8. Sign and return a JWT token on successful login

9. Set up CORS on the backend so the React frontend can call these endpoints

10. Wire the register and login forms on the frontend to call the real endpoints

Each step teaches one thing:

Steps 1–3: project setup and database connection
Steps 4–7: building auth endpoints and hashing
Steps 8–10: tokens, CORS, and wiring the frontend

Definition of done (from the brief):

A new user can register, then log in with the same credentials and receive a token.

Logging in with the wrong password is rejected.

Inspecting the users table shows a hash in password_hash, never the original password.

-->

# for stage 4: 

<!-- 

Stage 4 Learning Plan

What we’re building: A favorites system. Logged-in users can save cities to a favorites list that persists in the database.

The 8 steps:

1.Create the favorite_cities table with a migration (foreign key to users)

2. Write GET /api/favorites endpoint (protected, returns user’s favorites)

3. Write POST /api/favorites endpoint (protected, adds a favorite)

4. Write DELETE /api/favorites/:id endpoint (protected, removes a favorite)

5. Use auth middleware to protect all three endpoints

6. Wire the frontend favorites list to fetch from the backend

7. Wire the “save favorite” button to call the backend

8. Wire the “delete favorite” button to call the backend

Each step teaches one thing:

Steps 1–2: migrations with foreign keys, one-to-many relationships
Steps 3–5: CRUD endpoints protected by auth middleware
Steps 6–8: frontend integration

Definition of done (from the brief):

A logged-in user can add and remove favourite cities, and they’re still there after logging out and back in

Running npx node-pg-migrate up against a fresh database produces the full schema correctly, in order

Requesting /api/favorites without a token is rejected (401), not silently given empty results

-->

