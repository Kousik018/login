# Auth API (TypeScript + Express + Postgres)

Endpoints (all under `/api/auth`):

| Method | Path     | Body                        | Returns                  |
|--------|----------|-----------------------------|--------------------------|
| POST   | /signup  | `{ name, email, password }` | `{ user, token }` (201)  |
| POST   | /login   | `{ email, password }`       | `{ user, token }`        |
| GET    | /me      | header `Authorization: Bearer <token>` | `{ user }`    |

The login/signup page is served at `/`. Health check: `GET /health`.

## Run locally
```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
# local Postgres without SSL? set DATABASE_SSL=false
npm run dev
```

## Deploy on Render (free tier works)
1. Push this folder to a GitHub repo.
2. Create a free Postgres at https://neon.tech (or Render Postgres) and copy its connection string.
3. On https://render.com: New > Web Service > pick your repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
4. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `DATABASE_SSL=true`.
5. Deploy. Your page and API are live at the URL Render gives you.

Railway and Fly.io work the same way: same build/start commands and the same three env vars.
