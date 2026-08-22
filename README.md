# Kalki Sena Drive Dashboard

React + Vite admin console for Kalki Sena Drive.

## Stack

React 19, TypeScript, Tailwind 4, TanStack Query, Formik, Yup, Recharts.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Dashboard: `http://localhost:5174`

Start the API first (`kalkisenadrive_backend` on port 3011).

Seeded login: `admin@kalki.local` / `KalkiAdmin@123`

## Docker

```bash
docker compose up -d --build
```

Host port `3015`.
