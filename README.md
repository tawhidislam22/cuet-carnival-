# CUET Carnival Backend

Express + Prisma + Better Auth backend using Neon Postgres.

# Live Link: https://cuet-carnival.vercel.app/

## Stack
- Node.js + Express (modular pattern)
- Prisma ORM
- Neon Postgres
- Better Auth (email/password + email verification + password reset)

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   ```
   npm install
   ```
3. Generate Prisma client:
   ```
   npm run prisma:generate
   ```
4. Run migration (or push schema):
   ```
   npm run prisma:migrate
   ```
   or
   ```
   npm run prisma:push
   ```
5. Start development server:
   ```
   npm run dev
   ```

## SMTP (Gmail) Troubleshooting
If you see `EAUTH` or `535 5.7.8 Username and Password not accepted` when sending verification or reset emails:

1. Make sure `SMTP_USER` is your Gmail address.
2. Do not use your normal Gmail password in `SMTP_PASS`.
3. Enable Google 2-Step Verification.
4. Create a Google App Password and use that value for `SMTP_PASS`.
5. If your app password is shown as grouped text (`xxxx xxxx xxxx xxxx`), it can be pasted with or without spaces.
6. Run `npm run smtp:check` in `Backend/` to validate your SMTP config quickly.

---

## API Reference

All endpoints are prefixed with the base URL. Authenticated routes require a valid session cookie (managed by Better Auth). Admin routes additionally require `role = "admin"`.

### Health

| Method | Endpoint     | Auth | Description              |
|--------|-------------|------|--------------------------|
| GET    | /api/health | No   | Returns `{ status: "ok" }` |

---

### Authentication (`/api/auth/*`)

Handled by **Better Auth**. All auth routes live under `/api/auth/`.

| Method | Endpoint                       | Auth | Description                              |
|--------|-------------------------------|------|------------------------------------------|
| POST   | /api/auth/sign-up/email        | No   | Register with email + password           |
| POST   | /api/auth/sign-in/email        | No   | Sign in with email + password            |
| POST   | /api/auth/sign-out             | Yes  | Sign out current session                 |
| POST   | /api/auth/forget-password      | No   | Send password-reset email                |
| POST   | /api/auth/reset-password       | No   | Reset password with token from email     |
| GET    | /api/auth/verify-email         | No   | Verify email address via token in query  |

#### Sign Up — Request Body
```json
{
  "name": "Sajjad Hossain",
  "email": "u2204075@student.cuet.ac.bd",
  "password": "secret123"
}
```
> Only `@student.cuet.ac.bd` addresses are accepted.

#### Sign Up — Success Response `201`
```json
{
  "token": "<session-token>",
  "user": {
    "id": "cuid...",
    "name": "Sajjad Hossain",
    "email": "u2204075@student.cuet.ac.bd",
    "role": "user",
    "emailVerified": false
  }
}
```

#### Sign In — Request Body
```json
{
  "email": "u2204075@student.cuet.ac.bd",
  "password": "secret123"
}
```

---

### Users (`/api/users`)

| Method | Endpoint                  | Auth  | Description                                     |
|--------|--------------------------|-------|-------------------------------------------------|
| GET    | /api/users/me             | Yes   | Get current authenticated user profile          |
| PATCH  | /api/users/me/onboarding  | Yes   | Complete organizer onboarding (bio, club, type) |
| GET    | /api/users/organizers     | Yes   | List all users with organizer role              |

#### GET /api/users/me — Response `200`
```json
{
  "data": {
    "id": "cuid...",
    "name": "Sajjad Hossain",
    "email": "u2204075@student.cuet.ac.bd",
    "studentId": "2204075",
    "department": "CSE",
    "hall": "Shaheed Abdullah Hall",
    "role": "user",
    "onboardingCompleted": true,
    "image": null
  }
}
```

#### PATCH /api/users/me/onboarding — Request Body
```json
{
  "organizerBio": "CSE Society president",
  "organizerClubName": "CSE Society",
  "organizerEventType": "Technical"
}
```

---

### Events (`/api/events`)

| Method | Endpoint                                              | Auth        | Description                                   |
|--------|------------------------------------------------------|-------------|-----------------------------------------------|
| GET    | /api/events                                           | No          | List all published events                     |
| GET    | /api/events/mine                                      | Yes         | List events created by the authenticated user |
| GET    | /api/events/:id                                       | No          | Get a single event by ID                      |
| POST   | /api/events                                           | Yes         | Create a new event                            |
| PATCH  | /api/events/:id                                       | Yes (owner) | Update event details                          |
| POST   | /api/events/:id/image                                 | Yes (owner) | Upload event banner image (multipart)         |
| DELETE | /api/events/:id                                       | Yes (owner) | Delete an event                               |
| POST   | /api/events/:id/register                              | Yes         | Register current user for an event            |
| GET    | /api/events/:id/registrations                         | Yes         | List all registrations for an event           |
| DELETE | /api/events/:id/registrations/:registrationId         | Yes         | Remove a registration                         |
| POST   | /api/events/:id/registrations/:registrationId/certificate  | Yes    | Issue a certificate for a registration       |
| DELETE | /api/events/:id/registrations/:registrationId/certificate  | Yes    | Revoke a certificate for a registration      |

#### POST /api/events — Request Body
```json
{
  "title": "CUET Tech Fest 2026",
  "description": "Annual technology festival of CUET.",
  "category": "Technical",
  "location": "CUET Main Auditorium",
  "startsAt": "2026-06-01T09:00:00.000Z",
  "endsAt": "2026-06-03T18:00:00.000Z",
  "capacity": 500
}
```

#### POST /api/events — Success Response `201`
```json
{
  "data": {
    "id": "cuid...",
    "title": "CUET Tech Fest 2026",
    "description": "Annual technology festival of CUET.",
    "category": "Technical",
    "status": "Upcoming",
    "location": "CUET Main Auditorium",
    "startsAt": "2026-06-01T09:00:00.000Z",
    "endsAt": "2026-06-03T18:00:00.000Z",
    "capacity": 500,
    "isPublished": false,
    "organizerId": "cuid...",
    "imageUrl": null
  }
}
```

#### POST /api/events/:id/register — Request Body (optional)
```json
{
  "studentId": "2204075",
  "department": "CSE",
  "hall": "Shaheed Abdullah Hall"
}
```

#### POST /api/events/:id/register — Success Response `201`
```json
{
  "data": {
    "id": "cuid...",
    "userId": "cuid...",
    "eventId": "cuid...",
    "status": "Confirmed",
    "registeredAt": "2026-04-26T10:00:00.000Z"
  },
  "message": "Registered successfully"
}
```

---

### Dashboard (`/api/dashboard`)

All dashboard routes require authentication. Admin sub-routes additionally require `role = "admin"`.

#### User Dashboard

| Method | Endpoint                    | Auth  | Description                                        |
|--------|-----------------------------|-------|----------------------------------------------------|
| GET    | /api/dashboard/overview     | Yes   | Personal dashboard stats (events joined, upcoming) |
| GET    | /api/dashboard/my-events    | Yes   | Events the user has registered for                 |
| GET    | /api/dashboard/schedule     | Yes   | Upcoming registered events sorted by date          |
| GET    | /api/dashboard/certificates | Yes   | Certificates earned by the user                    |

#### Admin Dashboard

| Method | Endpoint                                          | Auth (Admin) | Description                                  |
|--------|--------------------------------------------------|--------------|----------------------------------------------|
| GET    | /api/dashboard/admin/overview                    | Admin        | Platform-wide stats (users, events, etc.)    |
| GET    | /api/dashboard/admin/events                      | Admin        | All events with filters                      |
| GET    | /api/dashboard/admin/users                       | Admin        | All registered users                         |
| GET    | /api/dashboard/admin/reports                     | Admin        | Aggregated reports                           |
| GET    | /api/dashboard/admin/events/:id/registrations    | Admin        | All registrations for a specific event       |
| PATCH  | /api/dashboard/admin/events/:id/toggle-publish   | Admin        | Publish or unpublish an event                |
| DELETE | /api/dashboard/admin/events/:id                  | Admin        | Force-delete any event                       |
| PATCH  | /api/dashboard/admin/users/:id/suspend           | Admin        | Suspend or unsuspend a user                  |
| DELETE | /api/dashboard/admin/users/:id                   | Admin        | Delete a user account                        |
| PATCH  | /api/dashboard/admin/users/:id/role              | Admin        | Change a user's role                         |
| PATCH  | /api/dashboard/admin/settings                    | Admin        | Update platform-level event settings         |

#### PATCH /api/dashboard/admin/users/:id/role — Request Body
```json
{ "role": "organizer" }
```

---

### Admin Reference Data (`/api/admin`)

| Method | Endpoint                              | Auth (Admin) | Description                              |
|--------|--------------------------------------|--------------|------------------------------------------|
| GET    | /api/admin/faculties                  | No           | List all faculties with categories/venues|
| POST   | /api/admin/faculties                  | Admin        | Create a new faculty                     |
| DELETE | /api/admin/faculties/:id              | Admin        | Delete a faculty                         |
| POST   | /api/admin/faculties/:id/categories   | Admin        | Add a category under a faculty           |
| DELETE | /api/admin/categories/:categoryId     | Admin        | Delete a category                        |
| POST   | /api/admin/faculties/:id/venues       | Admin        | Add a venue under a faculty              |
| DELETE | /api/admin/venues/:venueId            | Admin        | Delete a venue                           |

#### POST /api/admin/faculties — Request Body
```json
{ "name": "Faculty of Engineering" }
```

#### POST /api/admin/faculties/:id/categories — Request Body
```json
{ "name": "Technical" }
```

---

## Error Responses

All errors follow a consistent JSON format:

```json
{
  "message": "Descriptive error message"
}
```

| Status | Meaning                                          |
|--------|--------------------------------------------------|
| 400    | Bad Request — invalid or missing input           |
| 401    | Unauthorized — no valid session                  |
| 403    | Forbidden — authenticated but insufficient role  |
| 404    | Not Found — resource does not exist              |
| 409    | Conflict — duplicate entry (e.g. already registered) |
| 503    | Service Unavailable — database cold start        |

---

## Folder Structure
- `src/config` — env and prisma client
- `src/modules/auth` — Better Auth setup and routes
- `src/modules/users` — users module
- `src/modules/events` — events module
- `src/modules/dashboard` — dashboard module (user + admin)
- `src/modules/admin` — reference data (faculties, categories, venues)
- `src/middlewares` — shared middlewares (requireAuth)
- `src/utils` — utilities
- `prisma/` — schema, migrations, seed
