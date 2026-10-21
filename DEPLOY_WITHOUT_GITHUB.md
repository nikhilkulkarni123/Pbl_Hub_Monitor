# Deploy as a Separate Vercel Website — Without Touching GitHub

This monitor does not need to be added to the existing PBL GitHub repository.

## Option A — Vercel CLI from this folder

1. Extract the ZIP.
2. Open PowerShell inside `falcon-hod-live-monitor-v1`.
3. Install packages:

```powershell
npm install
```

4. Install/log in to Vercel if needed:

```powershell
npx vercel login
```

5. Create a new Vercel project from this folder:

```powershell
npx vercel
```

Choose a new project name such as:

```text
falcon-pbl-hod-monitor
```

6. In that **new Vercel project only**, add environment variables:

```text
DATABASE_URL
MONITOR_ACCESS_KEY
MONITOR_SESSION_SECRET
```

7. Deploy production:

```powershell
npx vercel --prod
```

This creates a separate website and does not push or modify the existing GitHub repository.

## Option B — Keep it local first

Set `DEMO_MODE=true` in `.env.local` and run:

```powershell
npm run dev
```

You can show the dashboard concept to the HoD before connecting the production database.

## Important

Do not run database migration, seed, reset, import, update or delete commands for this monitor. It only needs the existing database URL and read access.
