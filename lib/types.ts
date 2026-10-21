export type Institution = 'ALL' | 'GMU' | 'GMIT';

export type MonitorFilters = {
  institution: Institution;
  semester: number | null;
};

export type DatabaseProfile = {
  hasGmitV5: boolean;
  hasPublicInstitutionColumn: boolean;
};

export type StudentSummary = {
  total: number;
  assigned: number;
  unassigned: number;
};

export type TeamSummary = {
  total: number;
  allocated: number;
  unallocated: number;
};

export type ProjectSummary = {
  total: number;
  facultyProjects: number;
  studentProjects: number;
  pendingApplications: number;
  pendingGuideRequests: number;
};

export type CycleSummary = {
  institution: 'GMU' | 'GMIT';
  cycleId: number;
  academicCycle: string;
  semester: number;
  students: number;
  assignedStudents: number;
  teams: number;
  allocatedTeams: number;
  coordinator: string | null;
  status: string;
};

export type ReviewSnapshot = {
  institution: 'GMU' | 'GMIT';
  reviewId: number;
  cycleId: number;
  academicCycle: string;
  semester: number;
  name: string;
  sequenceNo: number;
  reviewDate: string | null;
  submissionOpenAt: string | null;
  submissionDeadline: string | null;
  status: string;
  isOpen: boolean;
  totalTeams: number;
  submitted: number;
  pendingSubmission: number;
  facultyEvaluated: number;
  pendingHodVerification: number;
  verified: number;
  returnedForCorrection: number;
};

export type FacultyWorkload = {
  facultyId: number;
  name: string;
  employeeId: string;
  designation: string | null;
  gmuTeams: number;
  gmitTeams: number;
  totalTeams: number;
  gmuProjects: number;
  gmitProjects: number;
  totalProjects: number;
  gmuOfferedProjects: number;
  gmitOfferedProjects: number;
  pendingApplications: number;
  pendingGuideRequests: number;
};

export type ActivityItem = {
  institution: 'GMU' | 'GMIT';
  kind:
    | 'TEAM_CREATED'
    | 'PROJECT_ALLOCATED'
    | 'REVIEW_SUBMITTED'
    | 'EVALUATION_SUBMITTED'
    | 'HOD_VERIFIED'
    | 'PROJECT_PUBLISHED'
    | 'APPLICATION_RECEIVED'
    | 'GUIDE_REQUESTED';
  title: string;
  detail: string;
  occurredAt: string;
};

export type AttentionLevel = 'critical' | 'warning' | 'info' | 'ok';

export type AttentionItem = {
  level: AttentionLevel;
  title: string;
  detail: string;
  count: number;
  href?: string;
};

export type UnassignedStudent = {
  institution: 'GMU' | 'GMIT';
  usn: string;
  name: string;
  semester: number;
  section: string;
};

export type UnallocatedTeam = {
  institution: 'GMU' | 'GMIT';
  teamCode: string;
  teamName: string;
  semester: number;
  memberCount: number;
};

export type PendingSubmission = {
  institution: 'GMU' | 'GMIT';
  semester: number;
  reviewName: string;
  teamCode: string;
  teamName: string;
  deadline: string | null;
};

export type PendingVerification = {
  institution: 'GMU' | 'GMIT';
  semester: number;
  reviewName: string;
  teamCode: string;
  teamName: string;
  facultyName: string;
  submittedAt: string | null;
};

export type MonitorOverview = {
  generatedAt: string;
  profile: DatabaseProfile;
  students: StudentSummary;
  teams: TeamSummary;
  projects: ProjectSummary;
  currentReviews: ReviewSnapshot[];
  cycles: CycleSummary[];
  faculty: FacultyWorkload[];
  activity: ActivityItem[];
  attention: AttentionItem[];
};

export type AttentionDetails = {
  unassignedStudents: UnassignedStudent[];
  unallocatedTeams: UnallocatedTeam[];
  pendingSubmissions: PendingSubmission[];
  pendingVerifications: PendingVerification[];
};

export type TeamMemberInfo = {
  usn: string;
  name: string;
  section?: string;
};

export type StudentDetailItem = {
  institution: 'GMU' | 'GMIT';
  usn: string;
  name: string;
  semester: number;
  section: string;
  academicCycle: string;
  teamCode: string | null;
  teamName: string | null;
  projectTitle: string | null;
  projectType: string | null;
  guideName: string | null;
  assignmentStatus: 'ASSIGNED' | 'UNASSIGNED';
};

export type TeamDetailItem = {
  institution: 'GMU' | 'GMIT';
  teamId: number;
  teamCode: string;
  teamName: string;
  semester: number;
  academicCycle: string;
  createdAt: string | null;
  projectTitle: string | null;
  projectType: string | null;
  guideName: string | null;
  allocationStatus: 'ALLOCATED' | 'UNALLOCATED';
  members: TeamMemberInfo[];
};

export type ProjectDetailItem = {
  institution: 'GMU' | 'GMIT';
  projectId: number;
  title: string;
  projectType: 'FACULTY_PROJECT' | 'STUDENT_PROJECT';
  status: string;
  publishedAt: string | null;
  semester: number;
  academicCycle: string;
  ownerFacultyName: string | null;
  guideFacultyName: string | null;
  teamCode: string | null;
  teamName: string | null;
  allocationStatus: 'ALLOCATED' | 'UNALLOCATED';
};

export type ApplicationDetailItem = {
  institution: 'GMU' | 'GMIT';
  applicationId: number;
  semester: number;
  teamCode: string;
  teamName: string;
  projectTitle: string;
  facultyName: string | null;
  status: string;
  appliedAt: string | null;
};

export type GuideRequestDetailItem = {
  institution: 'GMU' | 'GMIT';
  requestId: number;
  semester: number;
  teamCode: string;
  teamName: string;
  projectTitle: string;
  requestedFacultyName: string | null;
  status: string;
  requestedAt: string | null;
};

export type VerificationDetailItem = {
  institution: 'GMU' | 'GMIT';
  evaluationId: number;
  semester: number;
  reviewName: string;
  teamCode: string;
  teamName: string;
  facultyName: string;
  status: string;
  submittedAt: string | null;
  verifiedAt: string | null;
};

export type ReviewTeamDetailItem = {
  institution: 'GMU' | 'GMIT';
  teamId: number;
  teamCode: string;
  teamName: string;
  reviewId: number;
  reviewName: string;
  semester: number;
  guideName: string | null;
  projectTitle: string | null;
  submissionStatus: 'SUBMITTED' | 'PENDING';
  submittedAt: string | null;
  evaluationStatus: string | null;
  evaluatedAt: string | null;
  verifiedAt: string | null;
  members: TeamMemberInfo[];
};

