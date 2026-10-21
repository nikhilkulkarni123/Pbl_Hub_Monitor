'use client';

import { useDrillDown } from './DrillDownContext';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import type { CycleSummary } from '@/lib/types';

export default function CycleCardsInteractive({ cycles }: { cycles: CycleSummary[] }) {
  const { openDrillDown } = useDrillDown();

  if (cycles.length === 0) {
    return <div className="emptyState">No active PBL cycle found for the selected scope.</div>;
  }

  return (
    <div className="cycleCards">
      {cycles.map((cycle) => {
        const assignedPct = cycle.students > 0 ? Math.round((cycle.assignedStudents / cycle.students) * 100) : 0;
        const allocatedPct = cycle.teams > 0 ? Math.round((cycle.allocatedTeams / cycle.teams) * 100) : 0;

        return (
          <div className="cycleCard" key={`${cycle.institution}-${cycle.cycleId}`}>
            <div className="cycleTitle">
              <div>
                <strong>
                  {cycle.institution} • Semester {cycle.semester}
                </strong>
                <span>{cycle.academicCycle}</span>
              </div>
              <StatusBadge tone={cycle.coordinator ? 'good' : 'warn'}>
                {cycle.coordinator ? 'Coordinator set' : 'No coordinator'}
              </StatusBadge>
            </div>

            <div className="cycleFacts">
              {/* STUDENTS */}
              <div
                className="clickableKpi"
                onClick={() =>
                  openDrillDown({
                    type: 'students',
                    title: `${cycle.institution} Sem ${cycle.semester} — Active Students`,
                    initialFilter: 'ALL',
                  })
                }
                title="Click to view students in this cycle"
              >
                <span>Students ↗</span>
                <strong>{cycle.students}</strong>
              </div>

              {/* ASSIGNED */}
              <div
                className="clickableKpi"
                onClick={() =>
                  openDrillDown({
                    type: 'students',
                    title: `${cycle.institution} Sem ${cycle.semester} — Assigned Students`,
                    initialFilter: 'ASSIGNED',
                  })
                }
                title="Click to view assigned students"
              >
                <span className="goodText">Assigned ↗</span>
                <strong className="goodText">{cycle.assignedStudents}</strong>
              </div>

              {/* TEAMS */}
              <div
                className="clickableKpi"
                onClick={() =>
                  openDrillDown({
                    type: 'teams',
                    title: `${cycle.institution} Sem ${cycle.semester} — Teams Created`,
                    initialFilter: 'ALL',
                  })
                }
                title="Click to view teams in this cycle"
              >
                <span>Teams ↗</span>
                <strong>{cycle.teams}</strong>
              </div>

              {/* ALLOCATED */}
              <div
                className="clickableKpi"
                onClick={() =>
                  openDrillDown({
                    type: 'teams',
                    title: `${cycle.institution} Sem ${cycle.semester} — Allocated Teams`,
                    initialFilter: 'ALLOCATED',
                  })
                }
                title="Click to view allocated teams"
              >
                <span className="goodText">Allocated ↗</span>
                <strong className="goodText">{cycle.allocatedTeams}</strong>
              </div>
            </div>

            <div className="cycleProgressRow">
              <span>Student assignment</span>
              <ProgressBar value={assignedPct} max={100} />
            </div>
            <div className="cycleProgressRow">
              <span>Project allocation</span>
              <ProgressBar value={allocatedPct} max={100} />
            </div>
            <p className="coordinatorLine">
              {cycle.coordinator ? `Coordinator: ${cycle.coordinator}` : 'Coordinator assignment pending'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
