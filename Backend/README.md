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

## SMTP (Gmail) Troubleshooting
If you see `EAUTH` or `535 5.7.8 Username and Password not accepted` when sending verification or reset emails:

1. Make sure `SMTP_USER` is your Gmail address.
2. Do not use your normal Gmail password in `SMTP_PASS`.
3. Enable Google 2-Step Verification.
4. Create a Google App Password and use that value for `SMTP_PASS`.
5. If your app password is shown as grouped text (`xxxx xxxx xxxx xxxx`), it can be pasted with or without spaces.
6. Run `npm run smtp:check` in `Backend/` to validate your SMTP config quickly.

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
