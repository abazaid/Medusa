# Coolify Deployment (Backend)

## Build settings

- Base directory: `my-ecommerce-store`
- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start:production`
- Port exposes: `9000`

## Required environment variables

- `DATABASE_URL=postgres://.../medusa?sslmode=disable`
- `STORE_CORS=https://vapehubksa.com,https://www.vapehubksa.com`
- `ADMIN_CORS=https://api.vapehubksa.com,https://vapehubksa.com,https://www.vapehubksa.com`
- `AUTH_CORS=https://api.vapehubksa.com,https://vapehubksa.com,https://www.vapehubksa.com`
- `JWT_SECRET=...`
- `COOKIE_SECRET=...`
- `NODE_ENV=production`
- `PORT=9000`
- `HOST=0.0.0.0`

## Notes

- Internal PostgreSQL on Coolify usually requires `?sslmode=disable`.
- `start:production` runs:
  - fallback `build` if admin assets are missing
  - `db:migrate`
  - `medusa start` from `.medusa/server`
