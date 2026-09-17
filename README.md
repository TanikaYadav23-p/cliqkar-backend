# Cliqkar Backend

Node.js + Express + MongoDB backend for the Cliqkar travel platform. This first version covers the project structure and basic authentication (signup / signin / get profile) matching the frontend's `Signup.jsx` and `Signin.jsx` forms.

## Folder Structure

```
cliqkar-backend/
├── config/          MongoDB connection
├── controllers/      Route logic (authController.js)
├── helpers/           Shared response helpers
├── middleware/        JWT auth guard + error handler
├── models/             Mongoose schemas (User.js)
├── routes/              API route definitions
├── uploads/             Uploaded files (KYC docs, logos, etc.) — empty for now
├── utils/                Small helpers (JWT token generator)
├── .env.example
├── package.json
└── server.js
```

## Setup

```
npm install
cp .env.example .env
```

Fill in `.env` with your own values:
- `MONGO_URI` — your MongoDB connection string (local or Atlas)
- `JWT_SECRET` — any long random string

Run in development (auto-restart on changes):
```
npm run dev
```

Run in production:
```
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### POST `/api/auth/signup`
Matches `Signup.jsx` form fields exactly.

Request body:
```json
{
  "firstName": "Aarav",
  "countryCode": "+91 (IN)",
  "phoneNumber": "9829012345",
  "email": "aarav@example.com",
  "gender": "male",
  "password": "Secret@123",
  "confirmPassword": "Secret@123",
  "country": "IN"
}
```

Response (201):
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt_token_here",
  "user": { "id": "...", "firstName": "Aarav", "email": "aarav@example.com", "role": "user" }
}
```

### POST `/api/auth/signin`
Matches `Signin.jsx` form fields.

Request body:
```json
{
  "email": "aarav@example.com",
  "password": "Secret@123"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Signed in successfully",
  "token": "jwt_token_here",
  "user": { "id": "...", "firstName": "Aarav", "email": "aarav@example.com", "role": "user" }
}
```

### GET `/api/auth/me`
Protected route — returns the logged-in user's profile.

Headers:
```
Authorization: Bearer <token>
```

## Connecting the Frontend

In `Signup.jsx` and `Signin.jsx`, point the `fetch` calls to this server, e.g.:
```js
fetch("http://localhost:5000/api/auth/signup", { ... })
```

Store the returned `token` (e.g. in `localStorage`) and attach it as `Authorization: Bearer <token>` on any protected request going forward.

## What's Next

This covers only auth. Once ready, the same pattern (model → controller → route) can be extended for Bookings, Wallet, Visa History, OTB History, Airlines, Countries, and Airports — matching the admin and user dashboard pages already built on the frontend.
