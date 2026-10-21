import type { ActivityItem, AttentionDetails, FacultyWorkload, MonitorFilters, MonitorOverview, PendingSubmission, PendingVerification, ReviewSnapshot, UnallocatedTeam } from './types';

function includeInstitution(filters: MonitorFilters, institution: 'GMU' | 'GMIT') {
  return filters.institution === 'ALL' || filters.institution === institution;
}

function includeSemester(filters: MonitorFilters, semester: number) {
  return !filters.semester || filters.semester === semester;
}

const cycles = [
  { institution: 'GMU' as const, cycleId: 1, academicCycle: '2026-27 ODD', semester: 5, students: 159, assignedStudents: 154, teams: 31, allocatedTeams: 29, coordinator: 'Dr. Ananya Rao', status: 'ACTIVE' },
  { institution: 'GMU' as const, cycleId: 2, academicCycle: '2026-27 ODD', semester: 7, students: 87, assignedStudents: 84, teams: 17, allocatedTeams: 17, coordinator: 'Prof. Vivek K', status: 'ACTIVE' },
  { institution: 'GMIT' as const, cycleId: 3, academicCycle: '2026-27 ODD', semester: 3, students: 81, assignedStudents: 76, teams: 16, allocatedTeams: 12, coordinator: 'Dr. Megha S', status: 'ACTIVE' },
  { institution: 'GMIT' as const, cycleId: 4, academicCycle: '2026-27 ODD', semester: 5, students: 130, assignedStudents: 126, teams: 25, allocatedTeams: 22, coordinator: 'Prof. Kiran B', status: 'ACTIVE' },
  { institution: 'GMIT' as const, cycleId: 5, academicCycle: '2026-27 ODD', semester: 7, students: 126, assignedStudents: 123, teams: 24, allocatedTeams: 23, coordinator: 'Dr. Shilpa M', status: 'ACTIVE' },
];

const reviews: ReviewSnapshot[] = [
  { institution: 'GMU', reviewId: 11, cycleId: 1, academicCycle: '2026-27 ODD', semester: 5, name: 'Review 2', sequenceNo: 2, reviewDate: '2026-10-15', submissionOpenAt: '2026-10-08T03:30:00Z', submissionDeadline: '2026-10-14T11:30:00Z', status: 'PUBLISHED', isOpen: true, totalTeams: 31, submitted: 24, pendingSubmission: 7, facultyEvaluated: 18, pendingHodVerification: 6, verified: 9, returnedForCorrection: 1 },
  { institution: 'GMU', reviewId: 12, cycleId: 2, academicCycle: '2026-27 ODD', semester: 7, name: 'Review 2', sequenceNo: 2, reviewDate: '2026-10-16', submissionOpenAt: '2026-10-09T03:30:00Z', submissionDeadline: '2026-10-15T11:30:00Z', status: 'PUBLISHED', isOpen: true, totalTeams: 17, submitted: 16, pendingSubmission: 1, facultyEvaluated: 12, pendingHodVerification: 3, verified: 7, returnedForCorrection: 0 },
  { institution: 'GMIT', reviewId: 21, cycleId: 3, academicCycle: '2026-27 ODD', semester: 3, name: 'Review 1', sequenceNo: 1, reviewDate: '2026-10-18', submissionOpenAt: '2026-10-10T03:30:00Z', submissionDeadline: '2026-10-17T11:30:00Z', status: 'PUBLISHED', isOpen: true, totalTeams: 16, submitted: 9, pendingSubmission: 7, facultyEvaluated: 5, pendingHodVerification: 2, verified: 2, returnedForCorrection: 1 },
  { institution: 'GMIT', reviewId: 22, cycleId: 4, academicCycle: '2026-27 ODD', semester: 5, name: 'Review 1', sequenceNo: 1, reviewDate: '2026-10-20', submissionOpenAt: '2026-10-11T03:30:00Z', submissionDeadline: '2026-10-19T11:30:00Z', status: 'PUBLISHED', isOpen: true, totalTeams: 25, submitted: 14, pendingSubmission: 11, facultyEvaluated: 8, pendingHodVerification: 4, verified: 3, returnedForCorrection: 1 },
  { institution: 'GMIT', reviewId: 23, cycleId: 5, academicCycle: '2026-27 ODD', semester: 7, name: 'Review 2', sequenceNo: 2, reviewDate: '2026-10-17', submissionOpenAt: '2026-10-09T03:30:00Z', submissionDeadline: '2026-10-16T11:30:00Z', status: 'PUBLISHED', isOpen: true, totalTeams: 24, submitted: 20, pendingSubmission: 4, facultyEvaluated: 15, pendingHodVerification: 5, verified: 8, returnedForCorrection: 1 },
];

const faculty: FacultyWorkload[] = [
  { facultyId: 1, name: 'Dr. Ananya Rao', employeeId: 'FAC001', designation: 'Professor', gmuTeams: 4, gmitTeams: 2, totalTeams: 6, gmuProjects: 3, gmitProjects: 2, totalProjects: 5, gmuOfferedProjects: 3, gmitOfferedProjects: 2, pendingApplications: 3, pendingGuideRequests: 1 },
  { facultyId: 2, name: 'Prof. Kiran B', employeeId: 'FAC002', designation: 'Associate Professor', gmuTeams: 2, gmitTeams: 5, totalTeams: 7, gmuProjects: 2, gmitProjects: 4, totalProjects: 6, gmuOfferedProjects: 2, gmitOfferedProjects: 4, pendingApplications: 2, pendingGuideRequests: 2 },
  { facultyId: 3, name: 'Dr. Megha S', employeeId: 'FAC003', designation: 'Assistant Professor', gmuTeams: 1, gmitTeams: 4, totalTeams: 5, gmuProjects: 1, gmitProjects: 3, totalProjects: 4, gmuOfferedProjects: 1, gmitOfferedProjects: 3, pendingApplications: 1, pendingGuideRequests: 0 },
  { facultyId: 4, name: 'Prof. Vivek K', employeeId: 'FAC004', designation: 'Assistant Professor', gmuTeams: 5, gmitTeams: 1, totalTeams: 6, gmuProjects: 4, gmitProjects: 1, totalProjects: 5, gmuOfferedProjects: 4, gmitOfferedProjects: 1, pendingApplications: 4, pendingGuideRequests: 1 },
  { facultyId: 5, name: 'Dr. Shilpa M', employeeId: 'FAC005', designation: 'Professor', gmuTeams: 2, gmitTeams: 4, totalTeams: 6, gmuProjects: 2, gmitProjects: 3, totalProjects: 5, gmuOfferedProjects: 2, gmitOfferedProjects: 3, pendingApplications: 0, pendingGuideRequests: 1 },
];

export function getDemoOverview(filters: MonitorFilters): MonitorOverview {
  const selectedCycles = cycles.filter((c) => includeInstitution(filters, c.institution) && includeSemester(filters, c.semester));
  const selectedReviews = reviews.filter((r) => includeInstitution(filters, r.institution) && includeSemester(filters, r.semester));
  const institutions = new Set(selectedCycles.map((c) => c.institution));
  const selectedFaculty = faculty.map((f) => {
    const includeGmu = institutions.has('GMU');
    const includeGmit = institutions.has('GMIT');
    const gmuTeams = includeGmu ? f.gmuTeams : 0;
    const gmitTeams = includeGmit ? f.gmitTeams : 0;
    const gmuProjects = includeGmu ? f.gmuProjects : 0;
    const gmitProjects = includeGmit ? f.gmitProjects : 0;
    return { ...f, gmuTeams, gmitTeams, totalTeams: gmuTeams + gmitTeams, gmuProjects, gmitProjects, totalProjects: gmuProjects + gmitProjects };
  }).filter((f) => f.totalTeams > 0 || f.totalProjects > 0);

  const studentsTotal = selectedCycles.reduce((s, c) => s + c.students, 0);
  const assigned = selectedCycles.reduce((s, c) => s + c.assignedStudents, 0);
  const teamsTotal = selectedCycles.reduce((s, c) => s + c.teams, 0);
  const allocated = selectedCycles.reduce((s, c) => s + c.allocatedTeams, 0);
  const pendingHod = selectedReviews.reduce((s, r) => s + r.pendingHodVerification, 0);
  const pendingSubmissions = selectedReviews.reduce((s, r) => s + r.pendingSubmission, 0);
  const pendingApplications = selectedFaculty.reduce((s, f) => s + f.pendingApplications, 0);
  const pendingGuideRequests = selectedFaculty.reduce((s, f) => s + f.pendingGuideRequests, 0);

  const attention = [
    { level: studentsTotal - assigned > 0 ? 'critical' as const : 'ok' as const, title: 'Students without teams', detail: 'Active students not yet assigned to a PBL team', count: studentsTotal - assigned, href: '/attention' },
    { level: teamsTotal - allocated > 0 ? 'warning' as const : 'ok' as const, title: 'Teams without projects', detail: 'Created teams without an active project allocation', count: teamsTotal - allocated, href: '/attention' },
    { level: pendingSubmissions > 0 ? 'critical' as const : 'ok' as const, title: 'Review submissions pending', detail: 'Teams that have not submitted the current/latest review', count: pendingSubmissions, href: '/reviews' },
    { level: pendingHod > 0 ? 'warning' as const : 'ok' as const, title: 'HoD verification pending', detail: 'Faculty evaluations waiting for HoD action', count: pendingHod, href: '/attention' },
  ];

  return {
    generatedAt: new Date().toISOString(),
    profile: { hasGmitV5: true, hasPublicInstitutionColumn: false },
    students: { total: studentsTotal, assigned, unassigned: studentsTotal - assigned },
    teams: { total: teamsTotal, allocated, unallocated: teamsTotal - allocated },
    projects: { total: 91, facultyProjects: 58, studentProjects: 33, pendingApplications, pendingGuideRequests },
    currentReviews: selectedReviews,
    cycles: selectedCycles,
    faculty: selectedFaculty.sort((a, b) => b.totalTeams - a.totalTeams),
    activity: ([
      { institution: 'GMIT', kind: 'REVIEW_SUBMITTED', title: 'Review submitted', detail: 'GMIT-S5-021 submitted Review 1', occurredAt: new Date(Date.now() - 8 * 60_000).toISOString() },
      { institution: 'GMU', kind: 'HOD_VERIFIED', title: 'Evaluation verified', detail: 'GMU-S7-006 Review 2 verified by HoD', occurredAt: new Date(Date.now() - 22 * 60_000).toISOString() },
      { institution: 'GMIT', kind: 'PROJECT_ALLOCATED', title: 'Project allocated', detail: 'GMIT-S3-011 allocated to Smart Campus Assistant', occurredAt: new Date(Date.now() - 48 * 60_000).toISOString() },
      { institution: 'GMU', kind: 'EVALUATION_SUBMITTED', title: 'Faculty evaluation submitted', detail: 'GMU-S5-014 Review 2 moved to HoD verification', occurredAt: new Date(Date.now() - 76 * 60_000).toISOString() },
      { institution: 'GMIT', kind: 'TEAM_CREATED', title: 'Team created', detail: 'GMIT-S5-025 created with 5 members', occurredAt: new Date(Date.now() - 130 * 60_000).toISOString() },
    ] as ActivityItem[]).filter((a) => includeInstitution(filters, a.institution)),
    attention,
  };
}

export function getDemoAttention(filters: MonitorFilters): AttentionDetails {
  const rows = [
    { institution: 'GMU' as const, usn: '4GMU23CS011', name: 'Student One', semester: 5, section: 'A' },
    { institution: 'GMIT' as const, usn: '4GM24CS018', name: 'Student Two', semester: 3, section: 'A' },
    { institution: 'GMIT' as const, usn: '4GM22CS044', name: 'Student Three', semester: 7, section: 'B' },
  ].filter((x) => includeInstitution(filters, x.institution) && includeSemester(filters, x.semester));

  return {
    unassignedStudents: rows,
    unallocatedTeams: ([
      { institution: 'GMU', teamCode: 'PBL-26-S5-031', teamName: 'VisionX', semester: 5, memberCount: 5 },
      { institution: 'GMIT', teamCode: 'GMIT-26-S3-015', teamName: 'Campus Coders', semester: 3, memberCount: 4 },
      { institution: 'GMIT', teamCode: 'GMIT-26-S5-024', teamName: 'Byte Force', semester: 5, memberCount: 5 },
    ] as UnallocatedTeam[]).filter((x) => includeInstitution(filters, x.institution) && includeSemester(filters, x.semester)),
    pendingSubmissions: ([
      { institution: 'GMU', semester: 5, reviewName: 'Review 2', teamCode: 'PBL-26-S5-012', teamName: 'Alpha', deadline: '2026-10-14T11:30:00Z' },
      { institution: 'GMIT', semester: 5, reviewName: 'Review 1', teamCode: 'GMIT-26-S5-009', teamName: 'Neural Ninjas', deadline: '2026-10-19T11:30:00Z' },
    ] as PendingSubmission[]).filter((x) => includeInstitution(filters, x.institution) && includeSemester(filters, x.semester)),
    pendingVerifications: ([
      { institution: 'GMU', semester: 7, reviewName: 'Review 2', teamCode: 'PBL-26-S7-004', teamName: 'Core Four', facultyName: 'Prof. Vivek K', submittedAt: '2026-10-11T03:40:00Z' },
      { institution: 'GMIT', semester: 5, reviewName: 'Review 1', teamCode: 'GMIT-26-S5-013', teamName: 'Data Forge', facultyName: 'Prof. Kiran B', submittedAt: '2026-10-11T04:10:00Z' },
    ] as PendingVerification[]).filter((x) => includeInstitution(filters, x.institution) && includeSemester(filters, x.semester)),
  };
}

export function getDemoStudents(filters: MonitorFilters) {
  const students = [
    { institution: 'GMU' as const, usn: '4GMU23CS001', name: 'Aarav Sharma', semester: 5, section: 'A', academicCycle: '2026-27 ODD', teamCode: 'PBL-26-S5-001', teamName: 'Alpha Innovators', projectTitle: 'AI Smart Irrigation System', projectType: 'FACULTY_PROJECT', guideName: 'Dr. Ananya Rao', assignmentStatus: 'ASSIGNED' as const },
    { institution: 'GMU' as const, usn: '4GMU23CS002', name: 'Aditi Patel', semester: 5, section: 'A', academicCycle: '2026-27 ODD', teamCode: 'PBL-26-S5-001', teamName: 'Alpha Innovators', projectTitle: 'AI Smart Irrigation System', projectType: 'FACULTY_PROJECT', guideName: 'Dr. Ananya Rao', assignmentStatus: 'ASSIGNED' as const },
    { institution: 'GMU' as const, usn: '4GMU23CS011', name: 'Student One', semester: 5, section: 'A', academicCycle: '2026-27 ODD', teamCode: null, teamName: null, projectTitle: null, projectType: null, guideName: null, assignmentStatus: 'UNASSIGNED' as const },
    { institution: 'GMIT' as const, usn: '4GM24CS018', name: 'Student Two', semester: 3, section: 'A', academicCycle: '2026-27 ODD', teamCode: null, teamName: null, projectTitle: null, projectType: null, guideName: null, assignmentStatus: 'UNASSIGNED' as const },
  ];
  return students.filter((s) => includeInstitution(filters, s.institution) && includeSemester(filters, s.semester));
}

