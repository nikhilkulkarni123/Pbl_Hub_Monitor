import { NextResponse } from 'next/server';
import { isMonitorAuthenticated } from '@/lib/auth';
import { parseFilters } from '@/lib/filters';
import { getAllReviews, getMonitorOverview } from '@/lib/monitor-data';

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isMonitorAuthenticated())) return new NextResponse('Unauthorized', { status: 401 });
  const url = new URL(request.url);
  const filters = parseFilters({ institution: url.searchParams.get('institution') ?? undefined, semester: url.searchParams.get('semester') ?? undefined });
  const type = url.searchParams.get('type') ?? 'faculty';

  if (type === 'reviews') {
    const reviews = await getAllReviews(filters);
    const body = csv([
      ['Institution', 'Semester', 'Academic Cycle', 'Review', 'Status', 'Open Now', 'Total Teams', 'Submitted', 'Pending Submission', 'Faculty Evaluated', 'Pending HoD Verification', 'Verified', 'Returned For Correction', 'Deadline'],
      ...reviews.map((r) => [r.institution, r.semester, r.academicCycle, r.name, r.status, r.isOpen ? 'YES' : 'NO', r.totalTeams, r.submitted, r.pendingSubmission, r.facultyEvaluated, r.pendingHodVerification, r.verified, r.returnedForCorrection, r.submissionDeadline ?? '']),
    ]);
    return new NextResponse(body, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="falcon-pbl-review-status.csv"',
        'cache-control': 'no-store',
      },
    });
  }

  const data = await getMonitorOverview(filters);
  const body = csv([
    ['Employee ID', 'Faculty', 'Designation', 'GMU Teams', 'GMIT Teams', 'Total Teams', 'GMU Projects', 'GMIT Projects', 'Total Projects', 'GMU Offered Projects', 'GMIT Offered Projects', 'Pending Applications', 'Pending Guide Requests'],
    ...data.faculty.map((f) => [f.employeeId, f.name, f.designation ?? '', f.gmuTeams, f.gmitTeams, f.totalTeams, f.gmuProjects, f.gmitProjects, f.totalProjects, f.gmuOfferedProjects, f.gmitOfferedProjects, f.pendingApplications, f.pendingGuideRequests]),
  ]);
  return new NextResponse(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="falcon-pbl-faculty-workload.csv"',
      'cache-control': 'no-store',
    },
  });
}
