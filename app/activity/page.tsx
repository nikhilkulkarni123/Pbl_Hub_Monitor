import AppShell from '@/components/AppShell';
import StatusBadge from '@/components/StatusBadge';
import { requireMonitorAuth } from '@/lib/auth';
import { parseFilters } from '@/lib/filters';
import { formatDateTime, timeAgo } from '@/lib/format';
import { getRecentActivity } from '@/lib/monitor-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { searchParams: Promise<{ institution?: string; semester?: string }> };

export default async function ActivityPage({ searchParams }: Props) {
  await requireMonitorAuth();
  const filters = parseFilters(await searchParams);
  const activity = await getRecentActivity(filters, 100);

  return (
    <AppShell filters={filters} title="Recent PBL Activity" subtitle="A single timeline of the operational events that matter to the HoD." active="/activity" generatedAt={new Date().toISOString()}>
      <section className="panel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">ACTIVITY FEED</p>
            <h2>Latest Events</h2>
            <p>Team creation, project allocation, applications, guide requests, review submissions, evaluations and HoD verification.</p>
          </div>
        </div>
        <div className="timeline">
          {activity.map((item, index) => (
            <div className="timelineItem" key={`${item.occurredAt}-${index}`}>
              <div className="timelineRail"><span /></div>
              <div className="timelineBody">
                <div className="timelineTitle"><strong>{item.title}</strong><StatusBadge tone={item.institution === 'GMIT' ? 'info' : 'neutral'}>{item.institution}</StatusBadge></div>
                <p>{item.detail}</p>
                <span>{formatDateTime(item.occurredAt)} • {timeAgo(item.occurredAt)}</span>
              </div>
            </div>
          ))}
          {activity.length === 0 && <div className="emptyState">No recent activity found for this scope.</div>}
        </div>
      </section>
    </AppShell>
  );
}
