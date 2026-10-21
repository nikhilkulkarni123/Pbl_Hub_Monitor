import AppShell from '@/components/AppShell';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { requireMonitorAuth } from '@/lib/auth';
import { parseFilters } from '@/lib/filters';
import { numberFormat } from '@/lib/format';
import { getMonitorOverview } from '@/lib/monitor-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { searchParams: Promise<{ institution?: string; semester?: string }> };

export default async function FacultyPage({ searchParams }: Props) {
  await requireMonitorAuth();
  const filters = parseFilters(await searchParams);
  const data = await getMonitorOverview(filters);
  const activeFaculty = data.faculty.filter((f) => f.totalTeams > 0 || f.totalProjects > 0 || f.pendingApplications > 0 || f.pendingGuideRequests > 0);
  const totalAssignments = activeFaculty.reduce((s, f) => s + f.totalTeams, 0);
  const totalProjects = activeFaculty.reduce((s, f) => s + f.totalProjects, 0);
  const highest = activeFaculty[0]?.totalTeams ?? 0;

  return (
    <AppShell filters={filters} title="Faculty Workload" subtitle="See how teams and active project responsibilities are distributed across faculty." active="/faculty" generatedAt={data.generatedAt}>
      <section className="metricGrid metricGridFour">
        <MetricCard label="Faculty with Current Load" value={numberFormat(activeFaculty.length)} icon="FC" detail={<span>Guiding teams, projects or pending requests</span>} tone="blue" />
        <MetricCard label="Allocated Team Assignments" value={numberFormat(totalAssignments)} icon="TM" detail={<span>Across the selected institution/semester scope</span>} tone="teal" />
        <MetricCard label="Distinct Projects Handled" value={numberFormat(totalProjects)} icon="PR" detail={<span>Projects attached to active allocations</span>} tone="blue" />
        <MetricCard label="Highest Faculty Team Load" value={numberFormat(highest)} icon="HL" detail={<span>Highest current assigned-team count</span>} tone={highest >= 6 ? 'warn' : 'default'} />
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">WORKLOAD DISTRIBUTION</p>
            <h2>Faculty Team & Project Load</h2>
            <p>GMU and GMIT are shown separately because the same faculty login can work across both institutions.</p>
          </div>
          <a className="secondaryButton linkButton" href={`/api/export?type=faculty&institution=${filters.institution}&semester=${filters.semester ?? ''}`}>Export CSV</a>
        </div>
        <div className="tableWrap wideTable">
          <table>
            <thead>
              <tr>
                <th>Faculty</th><th>GMU Teams</th><th>GMIT Teams</th><th>Total Teams</th><th>GMU Projects</th><th>GMIT Projects</th><th>Total Projects</th><th>Published/Offered</th><th>Pending Apps</th><th>Guide Requests</th><th>Load</th>
              </tr>
            </thead>
            <tbody>
              {data.faculty.map((f) => {
                const tone = f.totalTeams >= 7 ? 'danger' : f.totalTeams >= 5 ? 'warn' : f.totalTeams > 0 ? 'good' : 'neutral';
                const label = f.totalTeams >= 7 ? 'High' : f.totalTeams >= 5 ? 'Moderate' : f.totalTeams > 0 ? 'Active' : 'No load';
                return (
                  <tr key={f.facultyId}>
                    <td><strong>{f.name}</strong><span className="subCell">{f.employeeId}{f.designation ? ` • ${f.designation}` : ''}</span></td>
                    <td>{f.gmuTeams}</td><td>{f.gmitTeams}</td><td><strong>{f.totalTeams}</strong></td>
                    <td>{f.gmuProjects}</td><td>{f.gmitProjects}</td><td><strong>{f.totalProjects}</strong></td>
                    <td>{f.gmuOfferedProjects + f.gmitOfferedProjects}</td><td>{f.pendingApplications}</td><td>{f.pendingGuideRequests}</td>
                    <td><StatusBadge tone={tone}>{label}</StatusBadge></td>
                  </tr>
                );
              })}
              {data.faculty.length === 0 && <tr><td colSpan={11}><div className="emptyState">No faculty records found.</div></td></tr>}
            </tbody>
          </table>
        </div>
        <p className="tableNote">Load labels are monitor-only indicators based on current allocated team counts; they do not change configured guide limits in the PBL portal.</p>
      </section>
    </AppShell>
  );
}
