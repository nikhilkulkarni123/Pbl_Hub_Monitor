'use client';

import { useDrillDown } from './DrillDownContext';
import MetricCard from './MetricCard';
import { numberFormat } from '@/lib/format';
import type { MonitorOverview } from '@/lib/types';

export default function OverviewMetricsInteractive({ data }: { data: MonitorOverview }) {
  const { openDrillDown } = useDrillDown();
  const pendingHod = data.currentReviews.reduce((sum, review) => sum + review.pendingHodVerification, 0);

  return (
    <section className="metricGrid">
      {/* 1. ACTIVE STUDENTS */}
      <MetricCard
        label="Active Students"
        value={numberFormat(data.students.total)}
        icon="ST"
        onClick={() => openDrillDown({ type: 'students', title: 'Active Students — Roster & Team Status' })}
        detail={
          <>
            <span
              className="goodText subClickable"
              onClick={(e) => {
                e.stopPropagation();
                openDrillDown({ type: 'students', title: 'Assigned Students', initialFilter: 'assigned' });
              }}
              title="Click to view assigned students"
            >
              {numberFormat(data.students.assigned)} assigned ↗
            </span>
            <span
              className={data.students.unassigned > 0 ? 'dangerText subClickable' : 'subClickable'}
              onClick={(e) => {
                e.stopPropagation();
                openDrillDown({ type: 'students', title: 'Unassigned Students (Need Teams)', initialFilter: 'unassigned' });
              }}
              title="Click to view unassigned students"
            >
              {numberFormat(data.students.unassigned)} unassigned ↗
            </span>
          </>
        }
        tone={data.students.unassigned > 0 ? 'warn' : 'good'}
      />

      {/* 2. TEAMS CREATED */}
      <MetricCard
        label="Teams Created"
        value={numberFormat(data.teams.total)}
        icon="TM"
        onClick={() => openDrillDown({ type: 'teams', title: 'Created Teams — Members & Allocation' })}
        detail={
          <>
            <span
              className="goodText subClickable"
              onClick={(e) => {
                e.stopPropagation();
                openDrillDown({ type: 'teams', title: 'Teams with Project Allocation', initialFilter: 'allocated' });
              }}
              title="Click to view allocated teams"
            >
              {numberFormat(data.teams.allocated)} allocated ↗
            </span>
            <span
              className={data.teams.unallocated > 0 ? 'warnText subClickable' : 'subClickable'}
              onClick={(e) => {
                e.stopPropagation();
                openDrillDown({ type: 'teams', title: 'Unallocated Teams (Need Projects)', initialFilter: 'unallocated' });
              }}
              title="Click to view unallocated teams"
            >
              {numberFormat(data.teams.unallocated)} unallocated ↗
            </span>
          </>
        }
        tone={data.teams.unallocated > 0 ? 'warn' : 'good'}
      />

      {/* 3. PROJECTS */}
      <MetricCard
        label="Projects"
        value={numberFormat(data.projects.total)}
        icon="PR"
        onClick={() => openDrillDown({ type: 'projects', title: 'Projects Catalog — Faculty & Student Proposals' })}
        detail={
          <>
            <span
              className="subClickable"
              onClick={(e) => {
                e.stopPropagation();
                openDrillDown({ type: 'projects', title: 'Faculty Proposed Projects', initialFilter: 'faculty_project' });
              }}
              title="Click to view faculty projects"
            >
              {numberFormat(data.projects.facultyProjects)} faculty projects ↗
            </span>
            <span
              className="subClickable"
              onClick={(e) => {
                e.stopPropagation();
                openDrillDown({ type: 'projects', title: 'Student Proposed Projects', initialFilter: 'student_project' });
              }}
              title="Click to view student projects"
            >
              {numberFormat(data.projects.studentProjects)} student projects ↗
            </span>
          </>
        }
        tone="blue"
      />

      {/* 4. PENDING APPLICATIONS */}
      <MetricCard
        label="Pending Applications"
        value={numberFormat(data.projects.pendingApplications)}
        icon="AP"
        onClick={() => openDrillDown({ type: 'applications', title: 'Pending Project Applications Awaiting Faculty Decision' })}
        detail={<span className="subClickable">Awaiting faculty decision ↗</span>}
        tone={data.projects.pendingApplications > 0 ? 'warn' : 'good'}
      />

      {/* 5. GUIDE REQUESTS */}
      <MetricCard
        label="Guide Requests"
        value={numberFormat(data.projects.pendingGuideRequests)}
        icon="GR"
        onClick={() => openDrillDown({ type: 'guide-requests', title: 'Student Guide Requests Awaiting Faculty Response' })}
        detail={<span className="subClickable">Student-project requests pending ↗</span>}
        tone={data.projects.pendingGuideRequests > 0 ? 'warn' : 'good'}
      />

      {/* 6. HOD VERIFICATION */}
      <MetricCard
        label="HoD Verification"
        value={numberFormat(pendingHod)}
        icon="HV"
        onClick={() => openDrillDown({ type: 'verifications', title: 'Faculty Evaluations Awaiting HoD Verification' })}
        detail={<span className="subClickable">Evaluations waiting for verification ↗</span>}
        tone={pendingHod > 0 ? 'danger' : 'good'}
      />
    </section>
  );
}
