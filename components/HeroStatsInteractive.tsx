'use client';

import { useDrillDown } from './DrillDownContext';

export default function HeroStatsInteractive({
  pendingSubmissions,
  verified,
}: {
  pendingSubmissions: number;
  verified: number;
}) {
  const { openDrillDown } = useDrillDown();

  return (
    <div className="heroStats">
      <div
        className="clickableHeroStat"
        onClick={() =>
          openDrillDown({
            type: 'review-teams',
            title: 'Pending Review Submissions Across Current Reviews',
            initialFilter: 'PENDING',
          })
        }
        title="Click to view teams with pending submissions"
      >
        <span>Pending review submissions ↗</span>
        <strong>{pendingSubmissions}</strong>
      </div>
      <div
        className="clickableHeroStat"
        onClick={() =>
          openDrillDown({
            type: 'review-teams',
            title: 'Verified Evaluations Across Reviews',
            initialFilter: 'VERIFIED',
          })
        }
        title="Click to view verified evaluations"
      >
        <span>Verified in current/latest reviews ↗</span>
        <strong>{verified}</strong>
      </div>
    </div>
  );
}
