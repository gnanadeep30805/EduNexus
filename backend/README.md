# EduNexus backend

The backend is an Express REST service organized as routes -> controllers -> services -> repositories (repositories will be added with the database adapter).

## Local run

```powershell
npm install
npm start
```

Health: `GET http://localhost:4000/health`
Industry dashboard: `GET http://localhost:4000/api/industry/dashboard`

## Gemini AI

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` locally. The key is never returned by an API response or committed to Git. Recruiters can request an evidence-based explanation for an existing match with `POST /api/industry/matches/:id/ai-explanation`. If Gemini is not configured, times out, or fails, the endpoint returns `503 SERVICE_UNAVAILABLE` instead of a fabricated explanation.

Run automated backend checks with:

```powershell
npm test
```

The initial Industry schema is in `migrations/001_industry_foundation.sql` and expects PostgreSQL with pgvector.
