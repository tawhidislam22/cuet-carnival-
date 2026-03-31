# CUET Carnival Backend

Express + Prisma + Better Auth backend using Neon Postgres.

## Stack
- Node.js + Express (modular pattern)
- Prisma ORM
- Neon Postgres
- Better Auth (email/password)

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   npm install
3. Generate Prisma client:
   npm run prisma:generate
4. Run migration (or push schema):
   npm run prisma:migrate
   or
   npm run prisma:push
5. Start development server:
   npm run dev

## API Routes
- `GET /api/health`
- `ALL /api/auth/*` (Better Auth handler)
- `GET /api/users/me` (requires auth)
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events` (requires auth)
- `PATCH /api/events/:id` (requires auth + owner)
- `DELETE /api/events/:id` (requires auth + owner)

## Folder Structure
- `src/config` env and prisma
- `src/modules/auth` Better Auth setup and routes
- `src/modules/users` users module
- `src/modules/events` events module
- `src/middlewares` shared middlewares
- `src/utils` utilities
