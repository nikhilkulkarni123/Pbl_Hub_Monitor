import Link from 'next/link';
import type { ReactNode } from 'react';
import AutoRefresh from './AutoRefresh';
import FilterBar from './FilterBar';
import { DrillDownProvider } from './DrillDownContext';
import type { MonitorFilters } from '@/lib/types';
import { filterQuery } from '@/lib/filters';

const navigation = [
  ['Overview', '/', 'OV'],
  ['Attention', '/attention', 'AT'],
  ['Faculty Load', '/faculty', 'FL'],
  ['Reviews', '/reviews', 'RV'],
  ['Activity', '/activity', 'AC'],
] as const;

export default function AppShell({
  filters,
  title,
  subtitle,
  active,
  generatedAt,
  children,
}: {
  filters: MonitorFilters;
  title: string;
  subtitle: string;
  active: string;
  generatedAt?: string;
  children: ReactNode;
}) {
  const q = filterQuery(filters);
  return (
    <div className="appFrame">
      <aside className="sidebar">
        <div className="brand">
          <img className="brandLogo" src="/falcon-mark.svg" alt="Falcon" />
          <div>
            <strong>Falcon PBL</strong>
            <span>HoD Live Monitor</span>
          </div>
        </div>
        <nav className="sideNav" aria-label="Monitor navigation">
          {navigation.map(([label, href, badge]) => (
            <Link key={href} href={`${href}${q}`} className={active === href ? 'navLink active' : 'navLink'}>
              <span className="navBadge">{badge}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebarFooter">
          <span className="readOnlyBadge">READ ONLY</span>
          <p>No student, team, project, review or evaluation can be edited from this website.</p>
        </div>
      </aside>

      <div className="mainArea">
        <header className="appHeader">
          <div>
            <p className="eyebrow">EXECUTIVE PBL MONITORING</p>
            <h1>{title}</h1>
            <p className="pageSubtitle">{subtitle}</p>
          </div>
          <div className="headerActions">
            <div className="liveStatus"><span className="liveDot" /> LIVE</div>
            <AutoRefresh />
            <form method="post" action="/api/logout">
              <button className="secondaryButton" type="submit">Sign out</button>
            </form>
          </div>
        </header>

        <FilterBar filters={filters} />

        {generatedAt && (
          <div className="lastUpdated">Last refreshed: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(generatedAt))}</div>
        )}

        <main className="contentArea">
          <DrillDownProvider filters={filters}>{children}</DrillDownProvider>
        </main>
        <footer className="siteFooter">Falcon PBL HoD Live Monitor • Private executive dashboard • Read-only database access</footer>
      </div>
    </div>
  );
}
