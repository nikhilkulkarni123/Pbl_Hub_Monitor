import { isMonitorAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type LoginProps = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: LoginProps) {
  if (await isMonitorAuthenticated()) redirect('/');
  const params = await searchParams;
  const message = params.error === 'invalid'
    ? 'The access key is not correct.'
    : params.error === 'config'
      ? 'Monitor access is not configured yet. Set MONITOR_ACCESS_KEY and MONITOR_SESSION_SECRET.'
      : null;

  return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="loginBrand">
          <img className="loginLogo" src="/falcon-mark.svg" alt="Falcon" />
          <div>
            <p className="eyebrow">FALCON PBL PROJECT HUB</p>
            <h1>HoD Live Monitor</h1>
          </div>
        </div>
        <p className="loginLead">A fast, read-only command center for students, teams, projects, faculty workload, reviews and HoD verification status.</p>
        <div className="securityNote">
          <strong>Private executive access</strong>
          <span>The browser stays signed in for 30 days unless you sign out.</span>
        </div>
        {message && <div className="loginError">{message}</div>}
        <form action="/api/login" method="post" className="loginForm">
          <label htmlFor="accessKey">HoD monitor access key</label>
          <input id="accessKey" name="accessKey" type="password" autoComplete="current-password" required autoFocus placeholder="Enter private access key" />
          <button type="submit" className="primaryButton">Open live dashboard</button>
        </form>
        <p className="loginFoot">This website does not provide create, edit, delete, allocation or verification actions.</p>
      </section>
    </main>
  );
}
