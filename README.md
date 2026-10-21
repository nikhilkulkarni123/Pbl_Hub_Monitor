# Falcon PBL — HoD Live Monitor

A **separate, read-only executive monitoring website** for the Falcon PBL Project Hub.

It is designed for the Head of Department to open on a phone or laptop and immediately see the current PBL status without navigating the operational student/faculty/coordinator portal.

## What it shows

- Active students, assigned students and students without teams
- Teams created, teams with projects and teams without project allocations
- Faculty-project and student-project counts
- Pending faculty project applications and student-project guide requests
- Institution / semester cycle status for GMU and GMIT
- PBL coordinator assignment for each active cycle
- Faculty workload: GMU teams, GMIT teams, projects handled and pending requests
- Current/latest review status per institution and semester
- Review submission progress
- Faculty evaluation progress
- Pending HoD verification and verified evaluations
- Detailed attention page for exceptions
- Recent operational activity timeline
- CSV export for faculty workload and review status
- Automatic refresh every 60 seconds

## Safety design

This website contains **no write endpoints** for PBL data.

The PostgreSQL pool opens every database session with:

```text
default_transaction_read_only=on
```

The query helper also rejects SQL that does not begin with `SELECT`, `WITH` or `SHOW`.

The only POST endpoints are monitor login/logout; they modify only the browser session cookie.

## Database compatibility

The monitor detects the database layout automatically:

1. **GMU public schema + GMIT `gmit_v5` schema** (V5 workspace layout), or
2. **GMU + GMIT in public V2/V3/V4 tables** where the GMIT program is identified by a program code/name beginning with `GMIT`.

Faculty is read from `public.faculty_v2` in both layouts.

## Local setup

1. Extract this folder somewhere separate from your PBL project.
2. Open PowerShell in this folder.
3. Install dependencies:

```powershell
npm install
```

4. Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

5. Edit `.env.local` and set:

```text
DATABASE_URL=<same Neon database URL used by the PBL portal>
MONITOR_ACCESS_KEY=<private HoD access key>
MONITOR_SESSION_SECRET=<long random secret>
```

Generate a session secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. Run:

```powershell
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Preview without connecting a database

Set:

```text
DEMO_MODE=true
```

The website will show realistic sample dashboard data. This is useful for showing the concept to the HoD before deployment.

## Vercel deployment

This project is completely standalone. You can deploy it as a **new Vercel project** without changing the existing PBL portal.

Recommended environment variables in the new Vercel project:

- `DATABASE_URL`
- `MONITOR_ACCESS_KEY`
- `MONITOR_SESSION_SECRET`
- optional `DB_POOL_MAX=4`

Do **not** run database migrations or seed commands for this monitor. It requires no database changes.

## Important privacy note

The monitor can show student and faculty operational information. Keep it private. Do not deploy it as an unauthenticated public dashboard.

For stronger production protection, you can additionally enable Vercel Deployment Protection / access controls on the monitor project.
