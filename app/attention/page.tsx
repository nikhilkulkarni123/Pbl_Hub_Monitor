import AppShell from '@/components/AppShell';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { requireMonitorAuth } from '@/lib/auth';
import { parseFilters } from '@/lib/filters';
import { formatDateTime } from '@/lib/format';
import { getAttentionDetails, getMonitorOverview } from '@/lib/monitor-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { searchParams: Promise<{ institution?: string; semester?: string }> };

export default async function AttentionPage({ searchParams }: Props) {
  await requireMonitorAuth();
  const filters = parseFilters(await searchParams);
  const [details, overview] = await Promise.all([getAttentionDetails(filters), getMonitorOverview(filters)]);

  return (
    <AppShell filters={filters} title="Attention Required" subtitle="Detailed exception lists for the items most likely to need follow-up." active="/attention" generatedAt={overview.generatedAt}>
      <section className="metricGrid metricGridFour">
        <MetricCard label="Students Without Teams" value={details.unassignedStudents.length} icon="ST" detail={<span>Active students not found in an active team</span>} tone={details.unassignedStudents.length ? 'danger' : 'good'} />
        <MetricCard label="Teams Without Projects" value={details.unallocatedTeams.length} icon="TM" detail={<span>Teams without an active project allocation</span>} tone={details.unallocatedTeams.length ? 'warn' : 'good'} />
        <MetricCard label="Open Review Submissions Pending" value={details.pendingSubmissions.length} icon="RV" detail={<span>Only current reviews with open submission windows</span>} tone={details.pendingSubmissions.length ? 'danger' : 'good'} />
        <MetricCard label="HoD Verification Pending" value={details.pendingVerifications.length} icon="HV" detail={<span>Faculty evaluations waiting for verification</span>} tone={details.pendingVerifications.length ? 'warn' : 'good'} />
      </section>

      <section className="panel">
        <div className="sectionHeader compact"><div><p className="eyebrow">TEAM FORMATION</p><h2>Students Without Teams</h2></div><StatusBadge tone={details.unassignedStudents.length ? 'danger' : 'good'}>{details.unassignedStudents.length}</StatusBadge></div>
        <div className="tableWrap"><table><thead><tr><th>Institution</th><th>Semester</th><th>Section</th><th>USN</th><th>Student</th></tr></thead><tbody>
          {details.unassignedStudents.map((s) => <tr key={`${s.institution}-${s.usn}`}><td><StatusBadge tone={s.institution === 'GMIT' ? 'info' : 'neutral'}>{s.institution}</StatusBadge></td><td>Sem {s.semester}</td><td>{s.section}</td><td>{s.usn}</td><td><strong>{s.name}</strong></td></tr>)}
          {details.unassignedStudents.length === 0 && <tr><td colSpan={5}><div className="emptyState">All active students in the selected scope are assigned to teams.</div></td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel">
        <div className="sectionHeader compact"><div><p className="eyebrow">PROJECT ALLOCATION</p><h2>Teams Without Project Allocation</h2></div><StatusBadge tone={details.unallocatedTeams.length ? 'warn' : 'good'}>{details.unallocatedTeams.length}</StatusBadge></div>
        <div className="tableWrap"><table><thead><tr><th>Institution</th><th>Semester</th><th>Team Code</th><th>Team</th><th>Members</th></tr></thead><tbody>
          {details.unallocatedTeams.map((t) => <tr key={`${t.institution}-${t.teamCode}`}><td><StatusBadge tone={t.institution === 'GMIT' ? 'info' : 'neutral'}>{t.institution}</StatusBadge></td><td>Sem {t.semester}</td><td>{t.teamCode}</td><td><strong>{t.teamName}</strong></td><td>{t.memberCount}</td></tr>)}
          {details.unallocatedTeams.length === 0 && <tr><td colSpan={5}><div className="emptyState">All created teams in the selected scope have active project allocations.</div></td></tr>}
        </tbody></table></div>
      </section>

      <section className="splitGrid">
        <article className="panel">
          <div className="sectionHeader compact"><div><p className="eyebrow">CURRENT REVIEW</p><h2>Pending Team Submissions</h2></div><StatusBadge tone={details.pendingSubmissions.length ? 'danger' : 'good'}>{details.pendingSubmissions.length}</StatusBadge></div>
          <div className="compactList">
            {details.pendingSubmissions.map((row) => <div className="compactListRow" key={`${row.institution}-${row.teamCode}-${row.reviewName}`}><div><strong>{row.teamCode} • {row.teamName}</strong><span>{row.institution} • Sem {row.semester} • {row.reviewName}</span></div><span className="rightMeta">Due {formatDateTime(row.deadline)}</span></div>)}
            {details.pendingSubmissions.length === 0 && <div className="emptyState">No pending submissions in currently open review windows.</div>}
          </div>
        </article>

        <article className="panel">
          <div className="sectionHeader compact"><div><p className="eyebrow">HOD QUEUE</p><h2>Pending Verification</h2></div><StatusBadge tone={details.pendingVerifications.length ? 'warn' : 'good'}>{details.pendingVerifications.length}</StatusBadge></div>
          <div className="compactList">
            {details.pendingVerifications.map((row) => <div className="compactListRow" key={`${row.institution}-${row.teamCode}-${row.reviewName}`}><div><strong>{row.teamCode} • {row.teamName}</strong><span>{row.institution} • Sem {row.semester} • {row.reviewName}</span><span>Faculty: {row.facultyName}</span></div><span className="rightMeta">{formatDateTime(row.submittedAt)}</span></div>)}
            {details.pendingVerifications.length === 0 && <div className="emptyState">No faculty evaluation is waiting for HoD verification.</div>}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
