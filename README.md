# Kavryx Dev — Backend

Full backend for the Kavryx Dev landing page: user accounts, demo booking, contact form, and an admin dashboard.

## Run

```bash
npm start        # http://localhost:3000
npm run dev      # auto-restart on file changes
```

Open http://localhost:3000 — the site and API are served from the same server.

## Important: first user becomes admin

The **first account registered** is automatically granted the admin role.
Register via the Login button on the site (or the first signup of any kind), and that account can access http://localhost:3000/admin.html

## Features

- **Auth** — register / login / logout with hashed passwords (bcrypt, 12 rounds) and HttpOnly session cookies (7-day expiry, stored in SQLite)
- **Book a demo** — modal form on the landing page; works for visitors and logged-in users (auto-linked to their account)
- **Contact form** — "Talk with the team" modal; same behavior
- **Admin dashboard** (`/admin.html`) — stats, demo request pipeline (new → contacted → qualified → closed), contact messages (new → read → archived), and user management (delete users; role column shown)
- Logged-in users see their own submissions via `/api/demo-requests/mine` and `/api/contact/mine`
- Expired sessions are purged automatically every hour

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account (first one becomes admin) |
| POST | `/api/auth/login` | — | Log in, sets session cookie |
| POST | `/api/auth/logout` | session | Log out, deletes session |
| GET | `/api/auth/me` | — | Current user or 401 |
| POST | `/api/demo-requests` | optional | Book a demo |
| GET | `/api/demo-requests/mine` | session | Your own demo requests |
| POST | `/api/contact` | optional | Send contact message |
| GET | `/api/contact/mine` | session | Your own messages |
| GET | `/api/admin/stats` | admin | Dashboard counters |
| GET | `/api/admin/users` | admin | List users |
| PATCH | `/api/admin/users/:id/role` | admin | Change role (`user`/`admin`) |
| DELETE | `/api/admin/users/:id` | admin | Delete user |
| GET | `/api/admin/demo-requests` | admin | All demo requests |
| PATCH | `/api/admin/demo-requests/:id` | admin | Update status |
| DELETE | `/api/admin/demo-requests/:id` | admin | Delete request |
| GET | `/api/admin/contact-messages` | admin | All messages |
| PATCH | `/api/admin/contact-messages/:id` | admin | Update status |
| DELETE | `/api/admin/contact-messages/:id` | admin | Delete message |

## Files

```
server.js               Express app: sessions, routes, static files, error handler
src/db.js               SQLite schema + connection (data/kavryx.db)
src/auth.js             Session helpers + middleware
src/routes-auth.js      Register / login / logout / me
src/routes-public.js    Demo booking + contact endpoints
src/routes-admin.js     Protected admin API
admin.html              Admin dashboard UI
index.html              Landing page (modified: auth modal, demo/contact forms, session UI)
data/kavryx.db          SQLite database (created automatically, gitignored content)
```

## Notes

- SQLite in WAL mode, foreign keys on. Swap to Postgres later by replacing `src/db.js` and the SQL in the route files.
- Config via env vars: `PORT` (default 3000), `DB_PATH` (default `data/kavryx.db`).
- To re-run the admin promotion (fresh start), stop the server and delete `data/kavryx.db*`.
