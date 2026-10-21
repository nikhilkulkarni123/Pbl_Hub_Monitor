# Security Notes

- The PBL database is opened in PostgreSQL read-only mode by this application.
- The monitor has no API route that creates, updates or deletes PBL data.
- Authentication uses a private monitor access key stored only in environment variables.
- The browser receives an HTTP-only, SameSite=Strict session cookie.
- The session cookie is marked Secure in production.
- The session token is derived with HMAC-SHA256 and a separate `MONITOR_SESSION_SECRET` when configured.
- Search engines are instructed not to index the site.
- Keep `DATABASE_URL`, `MONITOR_ACCESS_KEY` and `MONITOR_SESSION_SECRET` out of Git/source control.
- Prefer a dedicated database credential with SELECT-only permissions if you later create one in Neon. This is optional; the application already requests read-only transactions.
