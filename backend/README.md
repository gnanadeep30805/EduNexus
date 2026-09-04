# EduNexus backend

The backend is an Express REST service organized as routes -> controllers -> services -> repositories (repositories will be added with the database adapter).

## Local run

```powershell
npm install
npm start
```

Health: `GET http://localhost:4000/health`
Industry dashboard: `GET http://localhost:4000/api/industry/dashboard`

The initial Industry schema is in `migrations/001_industry_foundation.sql` and expects PostgreSQL with pgvector.
