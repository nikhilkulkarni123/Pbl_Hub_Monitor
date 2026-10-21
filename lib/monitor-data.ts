import { readQuery } from './db';
import { detectDatabaseProfile } from './schema';
import { getDemoAttention, getDemoOverview, getDemoStudents } from './demo';
import type {
  ActivityItem,
  ApplicationDetailItem,
  AttentionDetails,
  AttentionItem,
  CycleSummary,
  DatabaseProfile,
  FacultyWorkload,
  GuideRequestDetailItem,
  MonitorFilters,
  MonitorOverview,
  ProjectDetailItem,
  ReviewSnapshot,
  ReviewTeamDetailItem,
  StudentDetailItem,
  TeamDetailItem,
  VerificationDetailItem,
} from './types';

type SourceInstitution = 'GMU' | 'GMIT';

type SourceConfig = {
  institution: SourceInstitution;
  schema: 'public' | 'gmit_v5';
  programPredicate: string;
};

const n = (value: unknown) => Number(value ?? 0);

function sourceConfig(institution: SourceInstitution, profile: DatabaseProfile): SourceConfig {
  if (institution === 'GMIT' && profile.hasGmitV5) {
    return { institution, schema: 'gmit_v5', programPredicate: 'TRUE' };
  }

  const gmitProgram = `(UPPER(pr.code) LIKE 'GMIT%' OR UPPER(pr.name) LIKE 'GMIT%')`;
  return {
    institution,
    schema: 'public',
    programPredicate: institution === 'GMIT' ? gmitProgram : `NOT ${gmitProgram}`,
  };
}

function selectedCyclesCte(config: SourceConfig) {
  const s = config.schema;
  return `
    WITH selected_cycles AS (
      SELECT
        pc.id AS pbl_cycle_id,
        pc.academic_cycle_id,
        pc.program_id,
        pc.semester,
        pc.coordinator_assignment_id,
        pc.status,
        ac.name AS academic_cycle
      FROM ${s}.pbl_cycles_v2 pc
      JOIN ${s}.academic_cycles_v2 ac ON ac.id = pc.academic_cycle_id
      JOIN ${s}.programs_v2 pr ON pr.id = pc.program_id
      WHERE ac.is_active = TRUE
        AND (${config.programPredicate})
        AND ($1::int IS NULL OR pc.semester = $1::int)
    )
  `;
}

async function getSourceOverview(config: SourceConfig, filters: MonitorFilters) {
  const s = config.schema;
  const params = [filters.semester];
  const cte = selectedCyclesCte(config);

  const [studentRows, teamRows, projectRows, cycleRows, facultyRows, reviewRows, activityRows] = await Promise.all([
    readQuery<{ total: string; assigned: string }>(
      `${cte}
      SELECT
        COUNT(DISTINCT e.id)::text AS total,
        COUNT(DISTINCT e.id) FILTER (WHERE tm.id IS NOT NULL)::text AS assigned
      FROM selected_cycles sc
      JOIN ${s}.student_enrollments_v2 e
        ON e.academic_cycle_id=sc.academic_cycle_id
       AND e.program_id=sc.program_id
       AND e.semester=sc.semester
       AND e.status='ACTIVE'
      JOIN ${s}.students_v2 st ON st.id=e.student_id AND st.is_active=TRUE
      LEFT JOIN ${s}.team_members_v2 tm
        ON tm.enrollment_id=e.id
       AND tm.pbl_cycle_id=sc.pbl_cycle_id
       AND tm.status='ACTIVE'
       AND EXISTS (
         SELECT 1 FROM ${s}.teams_v2 t2
         WHERE t2.id=tm.team_id AND t2.status<>'DISSOLVED'
       )`,
      params,
    ),
    readQuery<{ total: string; allocated: string }>(
      `${cte}
      SELECT
        COUNT(DISTINCT t.id)::text AS total,
        COUNT(DISTINCT t.id) FILTER (WHERE EXISTS (
          SELECT 1 FROM ${s}.project_allocations_v2 pa
          WHERE pa.team_id=t.id AND pa.status='ACTIVE'
        ))::text AS allocated
      FROM selected_cycles sc
      JOIN ${s}.teams_v2 t ON t.pbl_cycle_id=sc.pbl_cycle_id
      WHERE t.status<>'DISSOLVED'`,
      params,
    ),
    readQuery<{
      total: string;
      faculty_projects: string;
      student_projects: string;
      pending_applications: string;
      pending_guide_requests: string;
    }>(
      `${cte}
      SELECT
        (SELECT COUNT(DISTINCT p.id) FROM ${s}.projects_v2 p JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id)::text AS total,
        (SELECT COUNT(DISTINCT p.id) FROM ${s}.projects_v2 p JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id WHERE p.project_type='FACULTY_PROJECT')::text AS faculty_projects,
        (SELECT COUNT(DISTINCT p.id) FROM ${s}.projects_v2 p JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id WHERE p.project_type='STUDENT_PROJECT')::text AS student_projects,
        (SELECT COUNT(*) FROM ${s}.project_applications_v2 a JOIN ${s}.projects_v2 p ON p.id=a.project_id JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id WHERE a.status IN ('SUBMITTED','UNDER_REVIEW','DISCUSSION'))::text AS pending_applications,
        (SELECT COUNT(*) FROM ${s}.guide_requests_v2 g JOIN ${s}.projects_v2 p ON p.id=g.project_id JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id WHERE g.status IN ('REQUESTED','DISCUSSION','REVISION_REQUESTED'))::text AS pending_guide_requests`,
      params,
    ),
    readQuery<{
      pbl_cycle_id: number;
      academic_cycle: string;
      semester: number;
      status: string;
      students: string;
      assigned_students: string;
      teams: string;
      allocated_teams: string;
      coordinator: string | null;
    }>(
      `${cte}
      SELECT
        sc.pbl_cycle_id,
        sc.academic_cycle,
        sc.semester,
        sc.status,
        (
          SELECT COUNT(DISTINCT e.id)
          FROM ${s}.student_enrollments_v2 e
          JOIN ${s}.students_v2 st ON st.id=e.student_id AND st.is_active=TRUE
          WHERE e.academic_cycle_id=sc.academic_cycle_id
            AND e.program_id=sc.program_id
            AND e.semester=sc.semester
            AND e.status='ACTIVE'
        )::text AS students,
        (
          SELECT COUNT(DISTINCT tm.enrollment_id)
          FROM ${s}.team_members_v2 tm
          JOIN ${s}.teams_v2 t ON t.id=tm.team_id AND t.status<>'DISSOLVED'
          WHERE tm.pbl_cycle_id=sc.pbl_cycle_id AND tm.status='ACTIVE'
        )::text AS assigned_students,
        (
          SELECT COUNT(*) FROM ${s}.teams_v2 t
          WHERE t.pbl_cycle_id=sc.pbl_cycle_id AND t.status<>'DISSOLVED'
        )::text AS teams,
        (
          SELECT COUNT(DISTINCT pa.team_id)
          FROM ${s}.project_allocations_v2 pa
          JOIN ${s}.projects_v2 p ON p.id=pa.project_id
          WHERE p.pbl_cycle_id=sc.pbl_cycle_id AND pa.status='ACTIVE'
        )::text AS allocated_teams,
        f.name AS coordinator
      FROM selected_cycles sc
      LEFT JOIN ${s}.pbl_coordinator_assignments_v2 ca ON ca.id=sc.coordinator_assignment_id AND ca.is_active=TRUE
      LEFT JOIN public.faculty_v2 f ON f.id=ca.faculty_id
      ORDER BY sc.semester`,
      params,
    ),
    readQuery<{
      id: number;
      employee_id: string;
      name: string;
      designation: string | null;
      allocated_teams: string;
      allocated_projects: string;
      offered_projects: string;
      pending_applications: string;
      pending_guide_requests: string;
    }>(
      `${cte}
      SELECT
        f.id,
        f.employee_id,
        f.name,
        f.designation,
        (
          SELECT COUNT(DISTINCT pa.team_id)
          FROM ${s}.project_allocations_v2 pa
          JOIN ${s}.projects_v2 p ON p.id=pa.project_id
          JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
          WHERE pa.guide_faculty_id=f.id AND pa.status='ACTIVE'
        )::text AS allocated_teams,
        (
          SELECT COUNT(DISTINCT pa.project_id)
          FROM ${s}.project_allocations_v2 pa
          JOIN ${s}.projects_v2 p ON p.id=pa.project_id
          JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
          WHERE pa.guide_faculty_id=f.id AND pa.status='ACTIVE'
        )::text AS allocated_projects,
        (
          SELECT COUNT(DISTINCT p.id)
          FROM ${s}.projects_v2 p
          JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
          WHERE p.owner_faculty_id=f.id AND p.project_type='FACULTY_PROJECT'
        )::text AS offered_projects,
        (
          SELECT COUNT(*)
          FROM ${s}.project_applications_v2 a
          JOIN ${s}.projects_v2 p ON p.id=a.project_id
          JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
          WHERE p.owner_faculty_id=f.id AND a.status IN ('SUBMITTED','UNDER_REVIEW','DISCUSSION')
        )::text AS pending_applications,
        (
          SELECT COUNT(*)
          FROM ${s}.guide_requests_v2 g
          JOIN ${s}.projects_v2 p ON p.id=g.project_id
          JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
          WHERE g.requested_faculty_id=f.id AND g.status IN ('REQUESTED','DISCUSSION','REVISION_REQUESTED')
        )::text AS pending_guide_requests
      FROM public.faculty_v2 f
      WHERE f.is_active=TRUE
      ORDER BY f.name`,
      params,
    ),
    readQuery<{
      review_id: number;
      pbl_cycle_id: number;
      academic_cycle: string;
      semester: number;
      name: string;
      sequence_no: number;
      review_date: string | null;
      submission_open_at: string | null;
      submission_deadline: string | null;
      status: string;
      is_open: boolean;
      total_teams: string;
      submitted: string;
      faculty_evaluated: string;
      pending_hod: string;
      verified: string;
      returned: string;
    }>(
      `${cte}
      SELECT
        r.id AS review_id,
        sc.pbl_cycle_id,
        sc.academic_cycle,
        sc.semester,
        r.name,
        r.sequence_no,
        r.review_date::text,
        r.submission_open_at::text,
        r.submission_deadline::text,
        r.status,
        (r.submission_open_at IS NOT NULL AND r.submission_deadline IS NOT NULL AND NOW() BETWEEN r.submission_open_at AND r.submission_deadline) AS is_open,
        (SELECT COUNT(*) FROM ${s}.teams_v2 t WHERE t.pbl_cycle_id=sc.pbl_cycle_id AND t.status<>'DISSOLVED')::text AS total_teams,
        (SELECT COUNT(DISTINCT trs.team_id) FROM ${s}.team_review_submissions_v4 trs WHERE trs.review_id=r.id AND trs.status='SUBMITTED')::text AS submitted,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status IN ('SUBMITTED','PENDING_HOD_VERIFICATION','VERIFIED','RETURNED_FOR_CORRECTION'))::text AS faculty_evaluated,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status='PENDING_HOD_VERIFICATION')::text AS pending_hod,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status='VERIFIED')::text AS verified,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status='RETURNED_FOR_CORRECTION')::text AS returned
      FROM selected_cycles sc
      JOIN LATERAL (
        SELECT r0.*
        FROM ${s}.pbl_reviews_v2 r0
        WHERE r0.pbl_cycle_id=sc.pbl_cycle_id
        ORDER BY
          CASE WHEN (r0.submission_open_at IS NOT NULL AND r0.submission_deadline IS NOT NULL AND NOW() BETWEEN r0.submission_open_at AND r0.submission_deadline) THEN 0 ELSE 1 END,
          r0.submission_deadline DESC NULLS LAST,
          r0.review_date DESC NULLS LAST,
          r0.sequence_no DESC
        LIMIT 1
      ) r ON TRUE
      ORDER BY sc.semester`,
      params,
    ),
    readQuery<{ kind: ActivityItem['kind']; title: string; detail: string; occurred_at: string }>(
      `${cte}
      SELECT kind, title, detail, occurred_at::text
      FROM (
        SELECT 'TEAM_CREATED'::text AS kind, 'Team created'::text AS title,
          (t.team_code || ' • ' || t.team_name)::text AS detail, t.created_at AS occurred_at
        FROM ${s}.teams_v2 t JOIN selected_cycles sc ON sc.pbl_cycle_id=t.pbl_cycle_id

        UNION ALL
        SELECT 'PROJECT_PUBLISHED'::text, 'Project published'::text,
          p.title::text, p.published_at
        FROM ${s}.projects_v2 p JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
        WHERE p.published_at IS NOT NULL

        UNION ALL
        SELECT 'APPLICATION_RECEIVED'::text, 'Project application received'::text,
          (t.team_code || ' → ' || p.title)::text, a.applied_at
        FROM ${s}.project_applications_v2 a
        JOIN ${s}.teams_v2 t ON t.id=a.team_id
        JOIN ${s}.projects_v2 p ON p.id=a.project_id
        JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id

        UNION ALL
        SELECT 'GUIDE_REQUESTED'::text, 'Guide requested'::text,
          (t.team_code || ' → ' || f.name)::text, g.requested_at
        FROM ${s}.guide_requests_v2 g
        JOIN ${s}.teams_v2 t ON t.id=g.team_id
        JOIN ${s}.projects_v2 p ON p.id=g.project_id
        JOIN public.faculty_v2 f ON f.id=g.requested_faculty_id
        JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id

        UNION ALL
        SELECT 'PROJECT_ALLOCATED'::text, 'Project allocated'::text,
          (t.team_code || ' → ' || p.title)::text, pa.allocated_at
        FROM ${s}.project_allocations_v2 pa
        JOIN ${s}.teams_v2 t ON t.id=pa.team_id
        JOIN ${s}.projects_v2 p ON p.id=pa.project_id
        JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
        WHERE pa.status='ACTIVE'

        UNION ALL
        SELECT 'REVIEW_SUBMITTED'::text, 'Review submitted'::text,
          (t.team_code || ' • ' || r.name)::text, trs.submitted_at
        FROM ${s}.team_review_submissions_v4 trs
        JOIN ${s}.teams_v2 t ON t.id=trs.team_id
        JOIN ${s}.pbl_reviews_v2 r ON r.id=trs.review_id
        JOIN selected_cycles sc ON sc.pbl_cycle_id=r.pbl_cycle_id
        WHERE trs.status='SUBMITTED' AND trs.submitted_at IS NOT NULL

        UNION ALL
        SELECT 'EVALUATION_SUBMITTED'::text, 'Faculty evaluation submitted'::text,
          (t.team_code || ' • ' || r.name)::text, e.submitted_at
        FROM ${s}.review_evaluations_v3 e
        JOIN ${s}.teams_v2 t ON t.id=e.team_id
        JOIN ${s}.pbl_reviews_v2 r ON r.id=e.review_id
        JOIN selected_cycles sc ON sc.pbl_cycle_id=r.pbl_cycle_id
        WHERE e.submitted_at IS NOT NULL

        UNION ALL
        SELECT 'HOD_VERIFIED'::text, 'HoD verified evaluation'::text,
          (t.team_code || ' • ' || r.name)::text, e.verified_at
        FROM ${s}.review_evaluations_v3 e
        JOIN ${s}.teams_v2 t ON t.id=e.team_id
        JOIN ${s}.pbl_reviews_v2 r ON r.id=e.review_id
        JOIN selected_cycles sc ON sc.pbl_cycle_id=r.pbl_cycle_id
        WHERE e.verified_at IS NOT NULL
      ) recent
      WHERE occurred_at IS NOT NULL
      ORDER BY occurred_at DESC
      LIMIT 50`,
      params,
    ),
  ]);

  const reviews: ReviewSnapshot[] = reviewRows.map((row) => {
    const totalTeams = n(row.total_teams);
    const submitted = n(row.submitted);
    return {
      institution: config.institution,
      reviewId: Number(row.review_id),
      cycleId: Number(row.pbl_cycle_id),
      academicCycle: row.academic_cycle,
      semester: Number(row.semester),
      name: row.name,
      sequenceNo: Number(row.sequence_no),
      reviewDate: row.review_date,
      submissionOpenAt: row.submission_open_at,
      submissionDeadline: row.submission_deadline,
      status: row.status,
      isOpen: Boolean(row.is_open),
      totalTeams,
      submitted,
      pendingSubmission: Math.max(totalTeams - submitted, 0),
      facultyEvaluated: n(row.faculty_evaluated),
      pendingHodVerification: n(row.pending_hod),
      verified: n(row.verified),
      returnedForCorrection: n(row.returned),
    };
  });

  return {
    students: {
      total: n(studentRows[0]?.total),
      assigned: n(studentRows[0]?.assigned),
    },
    teams: {
      total: n(teamRows[0]?.total),
      allocated: n(teamRows[0]?.allocated),
    },
    projects: {
      total: n(projectRows[0]?.total),
      facultyProjects: n(projectRows[0]?.faculty_projects),
      studentProjects: n(projectRows[0]?.student_projects),
      pendingApplications: n(projectRows[0]?.pending_applications),
      pendingGuideRequests: n(projectRows[0]?.pending_guide_requests),
    },
    cycles: cycleRows.map<CycleSummary>((row) => ({
      institution: config.institution,
      cycleId: Number(row.pbl_cycle_id),
      academicCycle: row.academic_cycle,
      semester: Number(row.semester),
      students: n(row.students),
      assignedStudents: n(row.assigned_students),
      teams: n(row.teams),
      allocatedTeams: n(row.allocated_teams),
      coordinator: row.coordinator,
      status: row.status,
    })),
    faculty: facultyRows.map((row) => ({
      facultyId: Number(row.id),
      employeeId: row.employee_id,
      name: row.name,
      designation: row.designation,
      allocatedTeams: n(row.allocated_teams),
      allocatedProjects: n(row.allocated_projects),
      offeredProjects: n(row.offered_projects),
      pendingApplications: n(row.pending_applications),
      pendingGuideRequests: n(row.pending_guide_requests),
    })),
    reviews,
    activity: activityRows.map<ActivityItem>((row) => ({
      institution: config.institution,
      kind: row.kind,
      title: row.title,
      detail: row.detail,
      occurredAt: row.occurred_at,
    })),
  };
}

function mergeFaculty(
  gmu: Awaited<ReturnType<typeof getSourceOverview>> | null,
  gmit: Awaited<ReturnType<typeof getSourceOverview>> | null,
) {
  const map = new Map<number, FacultyWorkload>();

  const merge = (source: typeof gmu, institution: SourceInstitution) => {
    if (!source) return;
    for (const f of source.faculty) {
      const current = map.get(f.facultyId) ?? {
        facultyId: f.facultyId,
        name: f.name,
        employeeId: f.employeeId,
        designation: f.designation,
        gmuTeams: 0,
        gmitTeams: 0,
        totalTeams: 0,
        gmuProjects: 0,
        gmitProjects: 0,
        totalProjects: 0,
        gmuOfferedProjects: 0,
        gmitOfferedProjects: 0,
        pendingApplications: 0,
        pendingGuideRequests: 0,
      };
      if (institution === 'GMU') {
        current.gmuTeams = f.allocatedTeams;
        current.gmuProjects = f.allocatedProjects;
        current.gmuOfferedProjects = f.offeredProjects;
      } else {
        current.gmitTeams = f.allocatedTeams;
        current.gmitProjects = f.allocatedProjects;
        current.gmitOfferedProjects = f.offeredProjects;
      }
      current.totalTeams = current.gmuTeams + current.gmitTeams;
      current.totalProjects = current.gmuProjects + current.gmitProjects;
      current.pendingApplications += f.pendingApplications;
      current.pendingGuideRequests += f.pendingGuideRequests;
      map.set(f.facultyId, current);
    }
  };

  merge(gmu, 'GMU');
  merge(gmit, 'GMIT');
  return [...map.values()].sort((a, b) => b.totalTeams - a.totalTeams || b.totalProjects - a.totalProjects || a.name.localeCompare(b.name));
}

function buildAttention(overview: Omit<MonitorOverview, 'attention'>): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (overview.students.unassigned > 0) {
    items.push({ level: 'critical', title: 'Students without teams', detail: 'Active students are not yet assigned to any team.', count: overview.students.unassigned, href: '/attention' });
  }
  if (overview.teams.unallocated > 0) {
    items.push({ level: 'warning', title: 'Teams without project allocation', detail: 'Created teams do not yet have an active project allocation.', count: overview.teams.unallocated, href: '/attention' });
  }
  const openPending = overview.currentReviews.filter((r) => r.isOpen).reduce((sum, r) => sum + r.pendingSubmission, 0);
  if (openPending > 0) {
    items.push({ level: 'critical', title: 'Current review submissions pending', detail: 'Submission windows are open and some teams have not submitted.', count: openPending, href: '/reviews' });
  }
  const pendingHod = overview.currentReviews.reduce((sum, r) => sum + r.pendingHodVerification, 0);
  if (pendingHod > 0) {
    items.push({ level: 'warning', title: 'HoD verification pending', detail: 'Faculty evaluations are waiting for HoD verification.', count: pendingHod, href: '/attention' });
  }
  const corrections = overview.currentReviews.reduce((sum, r) => sum + r.returnedForCorrection, 0);
  if (corrections > 0) {
    items.push({ level: 'info', title: 'Evaluations returned for correction', detail: 'Returned evaluations still need faculty correction/resubmission.', count: corrections, href: '/reviews' });
  }
  const noCoordinator = overview.cycles.filter((c) => !c.coordinator).length;
  if (noCoordinator > 0) {
    items.push({ level: 'warning', title: 'Coordinator assignment missing', detail: 'Active PBL cycles do not have an active coordinator.', count: noCoordinator });
  }
  if (overview.projects.pendingApplications > 0) {
    items.push({ level: 'info', title: 'Project applications awaiting faculty action', detail: 'Submitted/under-review applications are still open.', count: overview.projects.pendingApplications, href: '/faculty' });
  }
  if (overview.projects.pendingGuideRequests > 0) {
    items.push({ level: 'info', title: 'Guide requests awaiting faculty action', detail: 'Student-project guide requests are waiting for response.', count: overview.projects.pendingGuideRequests, href: '/faculty' });
  }
  if (items.length === 0) {
    items.push({ level: 'ok', title: 'No major pending items', detail: 'The selected scope has no major action item right now.', count: 0 });
  }
  return items;
}

export async function getMonitorOverview(filters: MonitorFilters): Promise<MonitorOverview> {
  if (process.env.DEMO_MODE === 'true') return getDemoOverview(filters);

  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceOverview(sourceConfig('GMU', profile), filters) : Promise.resolve(null),
    wantGmit ? getSourceOverview(sourceConfig('GMIT', profile), filters) : Promise.resolve(null),
  ]);

  const totalStudents = (gmu?.students.total ?? 0) + (gmit?.students.total ?? 0);
  const assignedStudents = (gmu?.students.assigned ?? 0) + (gmit?.students.assigned ?? 0);
  const totalTeams = (gmu?.teams.total ?? 0) + (gmit?.teams.total ?? 0);
  const allocatedTeams = (gmu?.teams.allocated ?? 0) + (gmit?.teams.allocated ?? 0);

  const base: Omit<MonitorOverview, 'attention'> = {
    generatedAt: new Date().toISOString(),
    profile,
    students: { total: totalStudents, assigned: assignedStudents, unassigned: Math.max(totalStudents - assignedStudents, 0) },
    teams: { total: totalTeams, allocated: allocatedTeams, unallocated: Math.max(totalTeams - allocatedTeams, 0) },
    projects: {
      total: (gmu?.projects.total ?? 0) + (gmit?.projects.total ?? 0),
      facultyProjects: (gmu?.projects.facultyProjects ?? 0) + (gmit?.projects.facultyProjects ?? 0),
      studentProjects: (gmu?.projects.studentProjects ?? 0) + (gmit?.projects.studentProjects ?? 0),
      pendingApplications: (gmu?.projects.pendingApplications ?? 0) + (gmit?.projects.pendingApplications ?? 0),
      pendingGuideRequests: (gmu?.projects.pendingGuideRequests ?? 0) + (gmit?.projects.pendingGuideRequests ?? 0),
    },
    currentReviews: [...(gmu?.reviews ?? []), ...(gmit?.reviews ?? [])].sort((a, b) => a.institution.localeCompare(b.institution) || a.semester - b.semester),
    cycles: [...(gmu?.cycles ?? []), ...(gmit?.cycles ?? [])].sort((a, b) => a.institution.localeCompare(b.institution) || a.semester - b.semester),
    faculty: mergeFaculty(gmu, gmit),
    activity: [...(gmu?.activity ?? []), ...(gmit?.activity ?? [])]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 50),
  };

  return { ...base, attention: buildAttention(base) };
}

async function getSourceAttention(config: SourceConfig, filters: MonitorFilters): Promise<AttentionDetails> {
  const s = config.schema;
  const params = [filters.semester];
  const cte = selectedCyclesCte(config);

  const [students, teams, submissions, verifications] = await Promise.all([
    readQuery<{ usn: string; name: string; semester: number; section: string }>(
      `${cte}
      SELECT st.usn, st.name, e.semester, sec.code AS section
      FROM selected_cycles sc
      JOIN ${s}.student_enrollments_v2 e
        ON e.academic_cycle_id=sc.academic_cycle_id
       AND e.program_id=sc.program_id
       AND e.semester=sc.semester
       AND e.status='ACTIVE'
      JOIN ${s}.students_v2 st ON st.id=e.student_id AND st.is_active=TRUE
      JOIN ${s}.sections_v2 sec ON sec.id=e.section_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM ${s}.team_members_v2 tm
        JOIN ${s}.teams_v2 t ON t.id=tm.team_id AND t.status<>'DISSOLVED'
        WHERE tm.enrollment_id=e.id AND tm.pbl_cycle_id=sc.pbl_cycle_id AND tm.status='ACTIVE'
      )
      ORDER BY e.semester, sec.code, st.usn
      LIMIT 250`,
      params,
    ),
    readQuery<{ team_code: string; team_name: string; semester: number; member_count: string }>(
      `${cte}
      SELECT t.team_code, t.team_name, sc.semester,
        (SELECT COUNT(*) FROM ${s}.team_members_v2 tm WHERE tm.team_id=t.id AND tm.status='ACTIVE')::text AS member_count
      FROM selected_cycles sc
      JOIN ${s}.teams_v2 t ON t.pbl_cycle_id=sc.pbl_cycle_id
      WHERE t.status<>'DISSOLVED'
        AND NOT EXISTS (
          SELECT 1 FROM ${s}.project_allocations_v2 pa WHERE pa.team_id=t.id AND pa.status='ACTIVE'
        )
      ORDER BY sc.semester, t.team_code
      LIMIT 250`,
      params,
    ),
    readQuery<{ semester: number; review_name: string; team_code: string; team_name: string; deadline: string | null }>(
      `${cte}, current_reviews AS (
        SELECT sc.pbl_cycle_id, sc.semester, r.id AS review_id, r.name AS review_name, r.submission_deadline
        FROM selected_cycles sc
        JOIN LATERAL (
          SELECT r0.* FROM ${s}.pbl_reviews_v2 r0
          WHERE r0.pbl_cycle_id=sc.pbl_cycle_id
          ORDER BY
            CASE WHEN (r0.submission_open_at IS NOT NULL AND r0.submission_deadline IS NOT NULL AND NOW() BETWEEN r0.submission_open_at AND r0.submission_deadline) THEN 0 ELSE 1 END,
            r0.submission_deadline DESC NULLS LAST,
            r0.sequence_no DESC
          LIMIT 1
        ) r ON TRUE
        WHERE r.submission_open_at IS NOT NULL
          AND r.submission_deadline IS NOT NULL
          AND NOW() BETWEEN r.submission_open_at AND r.submission_deadline
      )
      SELECT cr.semester, cr.review_name, t.team_code, t.team_name, cr.submission_deadline::text AS deadline
      FROM current_reviews cr
      JOIN ${s}.teams_v2 t ON t.pbl_cycle_id=cr.pbl_cycle_id AND t.status<>'DISSOLVED'
      WHERE NOT EXISTS (
        SELECT 1 FROM ${s}.team_review_submissions_v4 trs
        WHERE trs.review_id=cr.review_id AND trs.team_id=t.id AND trs.status='SUBMITTED'
      )
      ORDER BY cr.semester, t.team_code
      LIMIT 250`,
      params,
    ),
    readQuery<{ semester: number; review_name: string; team_code: string; team_name: string; faculty_name: string; submitted_at: string | null }>(
      `${cte}
      SELECT sc.semester, r.name AS review_name, t.team_code, t.team_name, f.name AS faculty_name, e.submitted_at::text
      FROM ${s}.review_evaluations_v3 e
      JOIN ${s}.pbl_reviews_v2 r ON r.id=e.review_id
      JOIN selected_cycles sc ON sc.pbl_cycle_id=r.pbl_cycle_id
      JOIN ${s}.teams_v2 t ON t.id=e.team_id
      JOIN public.faculty_v2 f ON f.id=e.guide_faculty_id
      WHERE e.status='PENDING_HOD_VERIFICATION'
      ORDER BY e.submitted_at ASC NULLS FIRST, sc.semester, t.team_code
      LIMIT 250`,
      params,
    ),
  ]);

  return {
    unassignedStudents: students.map((row) => ({ institution: config.institution, usn: row.usn, name: row.name, semester: Number(row.semester), section: row.section })),
    unallocatedTeams: teams.map((row) => ({ institution: config.institution, teamCode: row.team_code, teamName: row.team_name, semester: Number(row.semester), memberCount: n(row.member_count) })),
    pendingSubmissions: submissions.map((row) => ({ institution: config.institution, semester: Number(row.semester), reviewName: row.review_name, teamCode: row.team_code, teamName: row.team_name, deadline: row.deadline })),
    pendingVerifications: verifications.map((row) => ({ institution: config.institution, semester: Number(row.semester), reviewName: row.review_name, teamCode: row.team_code, teamName: row.team_name, facultyName: row.faculty_name, submittedAt: row.submitted_at })),
  };
}

export async function getAttentionDetails(filters: MonitorFilters): Promise<AttentionDetails> {
  if (process.env.DEMO_MODE === 'true') return getDemoAttention(filters);
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';
  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceAttention(sourceConfig('GMU', profile), filters) : Promise.resolve(null),
    wantGmit ? getSourceAttention(sourceConfig('GMIT', profile), filters) : Promise.resolve(null),
  ]);
  return {
    unassignedStudents: [...(gmu?.unassignedStudents ?? []), ...(gmit?.unassignedStudents ?? [])],
    unallocatedTeams: [...(gmu?.unallocatedTeams ?? []), ...(gmit?.unallocatedTeams ?? [])],
    pendingSubmissions: [...(gmu?.pendingSubmissions ?? []), ...(gmit?.pendingSubmissions ?? [])],
    pendingVerifications: [...(gmu?.pendingVerifications ?? []), ...(gmit?.pendingVerifications ?? [])],
  };
}

export async function getAllReviews(filters: MonitorFilters): Promise<ReviewSnapshot[]> {
  if (process.env.DEMO_MODE === 'true') return getDemoOverview(filters).currentReviews;
  const profile = await detectDatabaseProfile();
  const institutions: SourceInstitution[] = filters.institution === 'ALL' ? ['GMU', 'GMIT'] : [filters.institution];
  const results = await Promise.all(institutions.map(async (institution) => {
    const config = sourceConfig(institution, profile);
    const s = config.schema;
    const cte = selectedCyclesCte(config);
    const rows = await readQuery<{
      review_id: number; pbl_cycle_id: number; academic_cycle: string; semester: number; name: string; sequence_no: number;
      review_date: string | null; submission_open_at: string | null; submission_deadline: string | null; status: string; is_open: boolean;
      total_teams: string; submitted: string; faculty_evaluated: string; pending_hod: string; verified: string; returned: string;
    }>(`${cte}
      SELECT r.id AS review_id, sc.pbl_cycle_id, sc.academic_cycle, sc.semester, r.name, r.sequence_no,
        r.review_date::text, r.submission_open_at::text, r.submission_deadline::text, r.status,
        (r.submission_open_at IS NOT NULL AND r.submission_deadline IS NOT NULL AND NOW() BETWEEN r.submission_open_at AND r.submission_deadline) AS is_open,
        (SELECT COUNT(*) FROM ${s}.teams_v2 t WHERE t.pbl_cycle_id=sc.pbl_cycle_id AND t.status<>'DISSOLVED')::text AS total_teams,
        (SELECT COUNT(DISTINCT trs.team_id) FROM ${s}.team_review_submissions_v4 trs WHERE trs.review_id=r.id AND trs.status='SUBMITTED')::text AS submitted,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status IN ('SUBMITTED','PENDING_HOD_VERIFICATION','VERIFIED','RETURNED_FOR_CORRECTION'))::text AS faculty_evaluated,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status='PENDING_HOD_VERIFICATION')::text AS pending_hod,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status='VERIFIED')::text AS verified,
        (SELECT COUNT(DISTINCT e.team_id) FROM ${s}.review_evaluations_v3 e WHERE e.review_id=r.id AND e.status='RETURNED_FOR_CORRECTION')::text AS returned
      FROM selected_cycles sc
      JOIN ${s}.pbl_reviews_v2 r ON r.pbl_cycle_id=sc.pbl_cycle_id
      ORDER BY sc.semester, r.sequence_no DESC, r.review_date DESC NULLS LAST
      LIMIT 100`, [filters.semester]);

    return rows.map<ReviewSnapshot>((row) => {
      const totalTeams = n(row.total_teams); const submitted = n(row.submitted);
      return {
        institution, reviewId: Number(row.review_id), cycleId: Number(row.pbl_cycle_id), academicCycle: row.academic_cycle,
        semester: Number(row.semester), name: row.name, sequenceNo: Number(row.sequence_no), reviewDate: row.review_date,
        submissionOpenAt: row.submission_open_at, submissionDeadline: row.submission_deadline, status: row.status, isOpen: Boolean(row.is_open),
        totalTeams, submitted, pendingSubmission: Math.max(totalTeams - submitted, 0), facultyEvaluated: n(row.faculty_evaluated),
        pendingHodVerification: n(row.pending_hod), verified: n(row.verified), returnedForCorrection: n(row.returned),
      };
    });
  }));
  return results.flat().sort((a, b) => b.sequenceNo - a.sequenceNo || a.institution.localeCompare(b.institution) || a.semester - b.semester);
}

export async function getRecentActivity(filters: MonitorFilters, limit = 100) {
  const overview = await getMonitorOverview(filters);
  return overview.activity.slice(0, Math.max(1, Math.min(limit, 100)));
}

async function getSourceStudentDetails(config: SourceConfig, filters: MonitorFilters): Promise<StudentDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    usn: string;
    name: string;
    semester: number;
    section: string;
    academic_cycle: string;
    team_code: string | null;
    team_name: string | null;
    project_title: string | null;
    project_type: string | null;
    guide_name: string | null;
    assignment_status: 'ASSIGNED' | 'UNASSIGNED';
  }>(
    `${cte}
    SELECT
      st.usn,
      st.name,
      e.semester,
      COALESCE(sec.code, '—') AS section,
      sc.academic_cycle,
      t.team_code,
      t.team_name,
      p.title AS project_title,
      p.project_type,
      f.name AS guide_name,
      CASE WHEN tm.id IS NOT NULL THEN 'ASSIGNED' ELSE 'UNASSIGNED' END AS assignment_status
    FROM selected_cycles sc
    JOIN ${s}.student_enrollments_v2 e
      ON e.academic_cycle_id=sc.academic_cycle_id
     AND e.program_id=sc.program_id
     AND e.semester=sc.semester
     AND e.status='ACTIVE'
    JOIN ${s}.students_v2 st ON st.id=e.student_id AND st.is_active=TRUE
    LEFT JOIN ${s}.sections_v2 sec ON sec.id=e.section_id
    LEFT JOIN ${s}.team_members_v2 tm
      ON tm.enrollment_id=e.id
     AND tm.pbl_cycle_id=sc.pbl_cycle_id
     AND tm.status='ACTIVE'
    LEFT JOIN ${s}.teams_v2 t
      ON t.id=tm.team_id
     AND t.status<>'DISSOLVED'
    LEFT JOIN ${s}.project_allocations_v2 pa
      ON pa.team_id=t.id
     AND pa.status='ACTIVE'
    LEFT JOIN ${s}.projects_v2 p
      ON p.id=pa.project_id
    LEFT JOIN public.faculty_v2 f
      ON f.id=pa.guide_faculty_id
    ORDER BY e.semester, sec.code, st.usn`,
    [filters.semester],
  );

  return rows.map((r) => ({
    institution: config.institution,
    usn: r.usn,
    name: r.name,
    semester: Number(r.semester),
    section: r.section,
    academicCycle: r.academic_cycle,
    teamCode: r.team_code,
    teamName: r.team_name,
    projectTitle: r.project_title,
    projectType: r.project_type,
    guideName: r.guide_name,
    assignmentStatus: r.assignment_status,
  }));
}

export async function getStudentDetails(filters: MonitorFilters): Promise<StudentDetailItem[]> {
  if (process.env.DEMO_MODE === 'true') return getDemoStudents(filters);
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceStudentDetails(sourceConfig('GMU', profile), filters) : Promise.resolve([]),
    wantGmit ? getSourceStudentDetails(sourceConfig('GMIT', profile), filters) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => a.semester - b.semester || a.section.localeCompare(b.section) || a.usn.localeCompare(b.usn));
}

async function getSourceTeamDetails(config: SourceConfig, filters: MonitorFilters): Promise<TeamDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    team_id: number;
    team_code: string;
    team_name: string;
    semester: number;
    academic_cycle: string;
    created_at: string | null;
    project_title: string | null;
    project_type: string | null;
    guide_name: string | null;
    allocation_status: 'ALLOCATED' | 'UNALLOCATED';
    members: any;
  }>(
    `${cte}
    SELECT
      t.id AS team_id,
      t.team_code,
      t.team_name,
      sc.semester,
      sc.academic_cycle,
      t.created_at::text AS created_at,
      p.title AS project_title,
      p.project_type,
      f.name AS guide_name,
      CASE WHEN pa.id IS NOT NULL THEN 'ALLOCATED' ELSE 'UNALLOCATED' END AS allocation_status,
      (
        SELECT COALESCE(json_agg(json_build_object(
          'usn', st2.usn,
          'name', st2.name,
          'section', sec2.code
        )), '[]'::json)
        FROM ${s}.team_members_v2 tm2
        JOIN ${s}.student_enrollments_v2 e2 ON e2.id=tm2.enrollment_id
        JOIN ${s}.students_v2 st2 ON st2.id=e2.student_id
        LEFT JOIN ${s}.sections_v2 sec2 ON sec2.id=e2.section_id
        WHERE tm2.team_id=t.id AND tm2.status='ACTIVE'
      ) AS members
    FROM selected_cycles sc
    JOIN ${s}.teams_v2 t ON t.pbl_cycle_id=sc.pbl_cycle_id AND t.status<>'DISSOLVED'
    LEFT JOIN ${s}.project_allocations_v2 pa ON pa.team_id=t.id AND pa.status='ACTIVE'
    LEFT JOIN ${s}.projects_v2 p ON p.id=pa.project_id
    LEFT JOIN public.faculty_v2 f ON f.id=pa.guide_faculty_id
    ORDER BY sc.semester, t.team_code`,
    [filters.semester],
  );

  return rows.map((r) => ({
    institution: config.institution,
    teamId: Number(r.team_id),
    teamCode: r.team_code,
    teamName: r.team_name,
    semester: Number(r.semester),
    academicCycle: r.academic_cycle,
    createdAt: r.created_at,
    projectTitle: r.project_title,
    projectType: r.project_type,
    guideName: r.guide_name,
    allocationStatus: r.allocation_status,
    members: Array.isArray(r.members) ? r.members : typeof r.members === 'string' ? JSON.parse(r.members) : [],
  }));
}

export async function getTeamDetails(filters: MonitorFilters): Promise<TeamDetailItem[]> {
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceTeamDetails(sourceConfig('GMU', profile), filters) : Promise.resolve([]),
    wantGmit ? getSourceTeamDetails(sourceConfig('GMIT', profile), filters) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => a.semester - b.semester || a.teamCode.localeCompare(b.teamCode));
}

async function getSourceProjectDetails(config: SourceConfig, filters: MonitorFilters): Promise<ProjectDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    project_id: number;
    title: string;
    project_type: 'FACULTY_PROJECT' | 'STUDENT_PROJECT';
    status: string;
    published_at: string | null;
    semester: number;
    academic_cycle: string;
    owner_faculty_name: string | null;
    guide_faculty_name: string | null;
    team_code: string | null;
    team_name: string | null;
    allocation_status: 'ALLOCATED' | 'UNALLOCATED';
  }>(
    `${cte}
    SELECT
      p.id AS project_id,
      p.title,
      p.project_type,
      p.status,
      p.published_at::text AS published_at,
      sc.semester,
      sc.academic_cycle,
      f_owner.name AS owner_faculty_name,
      f_guide.name AS guide_faculty_name,
      t.team_code,
      t.team_name,
      CASE WHEN pa.id IS NOT NULL THEN 'ALLOCATED' ELSE 'UNALLOCATED' END AS allocation_status
    FROM selected_cycles sc
    JOIN ${s}.projects_v2 p ON p.pbl_cycle_id=sc.pbl_cycle_id
    LEFT JOIN public.faculty_v2 f_owner ON f_owner.id=p.owner_faculty_id
    LEFT JOIN ${s}.project_allocations_v2 pa ON pa.project_id=p.id AND pa.status='ACTIVE'
    LEFT JOIN ${s}.teams_v2 t ON t.id=pa.team_id AND t.status<>'DISSOLVED'
    LEFT JOIN public.faculty_v2 f_guide ON f_guide.id=pa.guide_faculty_id
    ORDER BY sc.semester, p.project_type, p.title`,
    [filters.semester],
  );

  return rows.map((r) => ({
    institution: config.institution,
    projectId: Number(r.project_id),
    title: r.title,
    projectType: r.project_type,
    status: r.status,
    publishedAt: r.published_at,
    semester: Number(r.semester),
    academicCycle: r.academic_cycle,
    ownerFacultyName: r.owner_faculty_name,
    guideFacultyName: r.guide_faculty_name,
    teamCode: r.team_code,
    teamName: r.team_name,
    allocationStatus: r.allocation_status,
  }));
}

export async function getProjectDetails(filters: MonitorFilters): Promise<ProjectDetailItem[]> {
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceProjectDetails(sourceConfig('GMU', profile), filters) : Promise.resolve([]),
    wantGmit ? getSourceProjectDetails(sourceConfig('GMIT', profile), filters) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => a.semester - b.semester || a.title.localeCompare(b.title));
}

async function getSourceApplicationDetails(config: SourceConfig, filters: MonitorFilters): Promise<ApplicationDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    application_id: number;
    semester: number;
    team_code: string;
    team_name: string;
    project_title: string;
    faculty_name: string | null;
    status: string;
    applied_at: string | null;
  }>(
    `${cte}
    SELECT
      a.id AS application_id,
      sc.semester,
      t.team_code,
      t.team_name,
      p.title AS project_title,
      f.name AS faculty_name,
      a.status,
      a.applied_at::text AS applied_at
    FROM ${s}.project_applications_v2 a
    JOIN ${s}.teams_v2 t ON t.id=a.team_id
    JOIN ${s}.projects_v2 p ON p.id=a.project_id
    JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
    LEFT JOIN public.faculty_v2 f ON f.id=p.owner_faculty_id
    WHERE a.status IN ('SUBMITTED','UNDER_REVIEW','DISCUSSION')
    ORDER BY a.applied_at DESC`,
    [filters.semester],
  );

  return rows.map((r) => ({
    institution: config.institution,
    applicationId: Number(r.application_id),
    semester: Number(r.semester),
    teamCode: r.team_code,
    teamName: r.team_name,
    projectTitle: r.project_title,
    facultyName: r.faculty_name,
    status: r.status,
    appliedAt: r.applied_at,
  }));
}

export async function getApplicationDetails(filters: MonitorFilters): Promise<ApplicationDetailItem[]> {
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceApplicationDetails(sourceConfig('GMU', profile), filters) : Promise.resolve([]),
    wantGmit ? getSourceApplicationDetails(sourceConfig('GMIT', profile), filters) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => (b.appliedAt ?? '').localeCompare(a.appliedAt ?? ''));
}

async function getSourceGuideRequestDetails(config: SourceConfig, filters: MonitorFilters): Promise<GuideRequestDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    request_id: number;
    semester: number;
    team_code: string;
    team_name: string;
    project_title: string;
    requested_faculty_name: string | null;
    status: string;
    requested_at: string | null;
  }>(
    `${cte}
    SELECT
      g.id AS request_id,
      sc.semester,
      t.team_code,
      t.team_name,
      p.title AS project_title,
      f.name AS requested_faculty_name,
      g.status,
      g.requested_at::text AS requested_at
    FROM ${s}.guide_requests_v2 g
    JOIN ${s}.teams_v2 t ON t.id=g.team_id
    JOIN ${s}.projects_v2 p ON p.id=g.project_id
    JOIN public.faculty_v2 f ON f.id=g.requested_faculty_id
    JOIN selected_cycles sc ON sc.pbl_cycle_id=p.pbl_cycle_id
    WHERE g.status IN ('REQUESTED','DISCUSSION','REVISION_REQUESTED')
    ORDER BY g.requested_at DESC`,
    [filters.semester],
  );

  return rows.map((r) => ({
    institution: config.institution,
    requestId: Number(r.request_id),
    semester: Number(r.semester),
    teamCode: r.team_code,
    teamName: r.team_name,
    projectTitle: r.project_title,
    requestedFacultyName: r.requested_faculty_name,
    status: r.status,
    requestedAt: r.requested_at,
  }));
}

export async function getGuideRequestDetails(filters: MonitorFilters): Promise<GuideRequestDetailItem[]> {
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceGuideRequestDetails(sourceConfig('GMU', profile), filters) : Promise.resolve([]),
    wantGmit ? getSourceGuideRequestDetails(sourceConfig('GMIT', profile), filters) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''));
}

async function getSourceVerificationDetails(config: SourceConfig, filters: MonitorFilters): Promise<VerificationDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    evaluation_id: number;
    semester: number;
    review_name: string;
    team_code: string;
    team_name: string;
    faculty_name: string;
    status: string;
    submitted_at: string | null;
    verified_at: string | null;
  }>(
    `${cte}
    SELECT
      e.id AS evaluation_id,
      sc.semester,
      r.name AS review_name,
      t.team_code,
      t.team_name,
      f.name AS faculty_name,
      e.status,
      e.submitted_at::text AS submitted_at,
      e.verified_at::text AS verified_at
    FROM ${s}.review_evaluations_v3 e
    JOIN ${s}.pbl_reviews_v2 r ON r.id=e.review_id
    JOIN selected_cycles sc ON sc.pbl_cycle_id=r.pbl_cycle_id
    JOIN ${s}.teams_v2 t ON t.id=e.team_id
    JOIN public.faculty_v2 f ON f.id=e.guide_faculty_id
    WHERE e.status='PENDING_HOD_VERIFICATION'
    ORDER BY e.submitted_at ASC NULLS FIRST`,
    [filters.semester],
  );

  return rows.map((r) => ({
    institution: config.institution,
    evaluationId: Number(r.evaluation_id),
    semester: Number(r.semester),
    reviewName: r.review_name,
    teamCode: r.team_code,
    teamName: r.team_name,
    facultyName: r.faculty_name,
    status: r.status,
    submittedAt: r.submitted_at,
    verifiedAt: r.verified_at,
  }));
}

export async function getVerificationDetails(filters: MonitorFilters): Promise<VerificationDetailItem[]> {
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceVerificationDetails(sourceConfig('GMU', profile), filters) : Promise.resolve([]),
    wantGmit ? getSourceVerificationDetails(sourceConfig('GMIT', profile), filters) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''));
}

async function getSourceReviewTeamDetails(config: SourceConfig, filters: MonitorFilters, reviewId?: number): Promise<ReviewTeamDetailItem[]> {
  const s = config.schema;
  const cte = selectedCyclesCte(config);
  const rows = await readQuery<{
    team_id: number;
    team_code: string;
    team_name: string;
    review_id: number;
    review_name: string;
    semester: number;
    guide_name: string | null;
    project_title: string | null;
    submission_status: 'SUBMITTED' | 'PENDING';
    submitted_at: string | null;
    evaluation_status: string | null;
    evaluated_at: string | null;
    verified_at: string | null;
    members: any;
  }>(
    `${cte}
    SELECT
      t.id AS team_id,
      t.team_code,
      t.team_name,
      r.id AS review_id,
      r.name AS review_name,
      sc.semester,
      f.name AS guide_name,
      p.title AS project_title,
      CASE WHEN trs.status='SUBMITTED' THEN 'SUBMITTED' ELSE 'PENDING' END AS submission_status,
      trs.submitted_at::text AS submitted_at,
      e.status AS evaluation_status,
      e.submitted_at::text AS evaluated_at,
      e.verified_at::text AS verified_at,
      (
        SELECT COALESCE(json_agg(json_build_object('usn', st2.usn, 'name', st2.name)), '[]'::json)
        FROM ${s}.team_members_v2 tm2
        JOIN ${s}.student_enrollments_v2 e2 ON e2.id=tm2.enrollment_id
        JOIN ${s}.students_v2 st2 ON st2.id=e2.student_id
        WHERE tm2.team_id=t.id AND tm2.status='ACTIVE'
      ) AS members
    FROM selected_cycles sc
    JOIN ${s}.pbl_reviews_v2 r ON r.pbl_cycle_id=sc.pbl_cycle_id
    JOIN ${s}.teams_v2 t ON t.pbl_cycle_id=sc.pbl_cycle_id AND t.status<>'DISSOLVED'
    LEFT JOIN ${s}.project_allocations_v2 pa ON pa.team_id=t.id AND pa.status='ACTIVE'
    LEFT JOIN ${s}.projects_v2 p ON p.id=pa.project_id
    LEFT JOIN public.faculty_v2 f ON f.id=pa.guide_faculty_id
    LEFT JOIN ${s}.team_review_submissions_v4 trs ON trs.review_id=r.id AND trs.team_id=t.id AND trs.status='SUBMITTED'
    LEFT JOIN ${s}.review_evaluations_v3 e ON e.review_id=r.id AND e.team_id=t.id
    WHERE ($2::int IS NULL OR r.id = $2::int)
    ORDER BY sc.semester, r.sequence_no, t.team_code`,
    [filters.semester, reviewId ?? null],
  );

  return rows.map((r) => ({
    institution: config.institution,
    teamId: Number(r.team_id),
    teamCode: r.team_code,
    teamName: r.team_name,
    reviewId: Number(r.review_id),
    reviewName: r.review_name,
    semester: Number(r.semester),
    guideName: r.guide_name,
    projectTitle: r.project_title,
    submissionStatus: r.submission_status,
    submittedAt: r.submitted_at,
    evaluationStatus: r.evaluation_status,
    evaluatedAt: r.evaluated_at,
    verifiedAt: r.verified_at,
    members: Array.isArray(r.members) ? r.members : typeof r.members === 'string' ? JSON.parse(r.members) : [],
  }));
}

export async function getReviewTeamDetails(filters: MonitorFilters, reviewId?: number): Promise<ReviewTeamDetailItem[]> {
  const profile = await detectDatabaseProfile();
  const wantGmu = filters.institution === 'ALL' || filters.institution === 'GMU';
  const wantGmit = filters.institution === 'ALL' || filters.institution === 'GMIT';

  const [gmu, gmit] = await Promise.all([
    wantGmu ? getSourceReviewTeamDetails(sourceConfig('GMU', profile), filters, reviewId) : Promise.resolve([]),
    wantGmit ? getSourceReviewTeamDetails(sourceConfig('GMIT', profile), filters, reviewId) : Promise.resolve([]),
  ]);

  return [...gmu, ...gmit].sort((a, b) => a.semester - b.semester || a.teamCode.localeCompare(b.teamCode));
}

