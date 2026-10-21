import Link from 'next/link';
import AppShell from '@/components/AppShell';
import CycleCardsInteractive from '@/components/CycleCardsInteractive';
import HeroStatsInteractive from '@/components/HeroStatsInteractive';
import OverviewMetricsInteractive from '@/components/OverviewMetricsInteractive';
import PriorityQueueInteractive from '@/components/PriorityQueueInteractive';
import ReviewStackInteractive from '@/components/ReviewStackInteractive';
import StatusBadge from '@/components/StatusBadge';
import { requireMonitorAuth } from '@/lib/auth';
import { parseFilters, filterQuery } from '@/lib/filters';
import { timeAgo } from '@/lib/format';
import { getMonitorOverview } from '@/lib/monitor-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { searchParams: Promise<{ institution?: string; semester?: string }> };

export default async function OverviewPage({ searchParams }: Props) {
  await requireMonitorAuth();
  const filters = parseFilters(await searchParams);
  const data = await getMonitorOverview(filters);
  const q = filterQuery(filters);
  const allocationPct = data.teams.total > 0 ? Math.round((data.teams.allocated / data.teams.total) * 100) : 0;
  const assignmentPct = data.students.total > 0 ? Math.round((data.students.assigned / data.students.total) * 100) : 0;
  const pendingHod = data.currentReviews.reduce((sum, review) => sum + review.pendingHodVerification, 0);
  const verified = data.currentReviews.reduce((sum, review) => sum + review.verified, 0);
  const pendingSubmissions = data.currentReviews.filter((r) => r.isOpen).reduce((sum, review) => sum + review.pendingSubmission, 0);

  return (
    <AppShell
      filters={filters}
      title="Live Command Center"
      subtitle="Everything the HoD needs to know right now, without entering the operational portal. Click any card or number to drill down."
      active="/"
      generatedAt={data.generatedAt}
    >
      <section className="heroSummary">
        <div>
          <p className="eyebrow light">CURRENT STATUS</p>
          <h2>{data.attention.some((a) => a.level === 'critical') ? 'Attention required' : 'PBL operations are on track'}</h2>
          <p>Student assignment {assignmentPct}% • Project allocation {allocationPct}% • {pendingHod} evaluations awaiting HoD verification.</p>
        </div>
        <HeroStatsInteractive pendingSubmissions={pendingSubmissions} verified={verified} />
      </section>

      {/* INTERACTIVE METRIC CARDS WITH NUMBER DRILLDOWN */}
      <OverviewMetricsInteractive data={data} />

      {/* PRIORITY QUEUE WITH DIRECT DRILLDOWN */}
      <section className="panel attentionPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">PRIORITY QUEUE</p>
            <h2>Attention Required</h2>
            <p>Items that may need coordinator, faculty or HoD follow-up. Click any card to inspect records.</p>
          </div>
          <Link className="textLink" href={`/attention${q}`}>Open full page view →</Link>
        </div>
        <PriorityQueueInteractive items={data.attention} />
      </section>

      <section className="splitGrid">
        <article className="panel">
          <div className="sectionHeader compact">
            <div>
              <p className="eyebrow">INSTITUTION / SEMESTER</p>
              <h2>Cycle Progress</h2>
            </div>
          </div>
          <CycleCardsInteractive cycles={data.cycles} />
        </article>

        <article className="panel">
          <div className="sectionHeader compact">
            <div>
              <p className="eyebrow">REVIEW MONITOR</p>
              <h2>Current / Latest Reviews</h2>
            </div>
            <Link className="textLink" href={`/reviews${q}`}>All reviews →</Link>
          </div>
          <ReviewStackInteractive reviews={data.currentReviews} />
        </article>
      </section>


      <section className="splitGrid">
        <article className="panel">
          <div className="sectionHeader compact">
            <div>
              <p className="eyebrow">FACULTY WORKLOAD</p>
              <h2>Highest Current Load</h2>
            </div>
            <Link className="textLink" href={`/faculty${q}`}>Full faculty table →</Link>
          </div>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Faculty</th><th>GMU Teams</th><th>GMIT Teams</th><th>Total Teams</th><th>Projects</th></tr></thead>
              <tbody>
                {data.faculty.filter((f) => f.totalTeams > 0 || f.totalProjects > 0).slice(0, 10).map((faculty) => (
                  <tr key={faculty.facultyId}>
                    <td><strong>{faculty.name}</strong><span className="subCell">{faculty.designation ?? faculty.employeeId}</span></td>
                    <td>{faculty.gmuTeams}</td>
                    <td>{faculty.gmitTeams}</td>
                    <td><strong>{faculty.totalTeams}</strong></td>
                    <td>{faculty.totalProjects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="sectionHeader compact">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h2>What Happened Recently</h2>
            </div>
            <Link className="textLink" href={`/activity${q}`}>View activity →</Link>
          </div>
          <div className="activityList">
            {data.activity.slice(0, 10).map((item, index) => (
              <div className="activityItem" key={`${item.occurredAt}-${index}`}>
                <span className="activityDot" />
                <div>
                  <div className="activityTitleRow"><strong>{item.title}</strong><StatusBadge tone={item.institution === 'GMIT' ? 'info' : 'neutral'}>{item.institution}</StatusBadge></div>
                  <span>{item.detail}</span>
                  <small>{timeAgo(item.occurredAt)}</small>
                </div>
              </div>
            ))}
            {data.activity.length === 0 && <div className="emptyState">No recent activity found.</div>}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
