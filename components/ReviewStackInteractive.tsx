'use client';

import { useDrillDown } from './DrillDownContext';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '@/lib/format';
import type { ReviewSnapshot } from '@/lib/types';

export default function ReviewStackInteractive({ reviews }: { reviews: ReviewSnapshot[] }) {
  const { openDrillDown } = useDrillDown();

  if (reviews.length === 0) {
    return <div className="emptyState">No reviews configured for the selected scope.</div>;
  }

  return (
    <div className="reviewStack">
      {reviews.map((review) => (
        <div className="reviewCard" key={`${review.institution}-${review.reviewId}`}>
          <div className="reviewCardHead">
            <div>
              <strong>
                {review.institution} • Sem {review.semester} • {review.name}
              </strong>
              <span>Deadline {formatDateTime(review.submissionDeadline)}</span>
            </div>
            <StatusBadge tone={review.isOpen ? 'good' : 'neutral'}>
              {review.isOpen ? 'Submission open' : review.status}
            </StatusBadge>
          </div>

          <div className="reviewMiniGrid">
            {/* TOTAL TEAMS */}
            <div
              className="clickableKpi"
              onClick={() =>
                openDrillDown({
                  type: 'review-teams',
                  reviewId: review.reviewId,
                  reviewName: `${review.name} (Sem ${review.semester})`,
                  title: `${review.name} (Sem ${review.semester}) — All Teams`,
                  initialFilter: 'ALL',
                })
              }
              title="Click to view all teams in this review"
            >
              <span>Teams ↗</span>
              <strong>{review.totalTeams}</strong>
            </div>

            {/* SUBMITTED */}
            <div
              className="clickableKpi"
              onClick={() =>
                openDrillDown({
                  type: 'review-teams',
                  reviewId: review.reviewId,
                  reviewName: `${review.name} (Sem ${review.semester})`,
                  title: `${review.name} (Sem ${review.semester}) — Submitted Teams`,
                  initialFilter: 'SUBMITTED',
                })
              }
              title="Click to view submitted teams"
            >
              <span className="goodText">Submitted ↗</span>
              <strong className="goodText">{review.submitted}</strong>
            </div>

            {/* PENDING SUBMISSION */}
            <div
              className="clickableKpi"
              onClick={() =>
                openDrillDown({
                  type: 'review-teams',
                  reviewId: review.reviewId,
                  reviewName: `${review.name} (Sem ${review.semester})`,
                  title: `${review.name} (Sem ${review.semester}) — Pending Submissions`,
                  initialFilter: 'PENDING',
                })
              }
              title="Click to view teams with pending submission"
            >
              <span className={review.pendingSubmission > 0 && review.isOpen ? 'dangerText' : ''}>
                Pending ↗
              </span>
              <strong className={review.pendingSubmission > 0 && review.isOpen ? 'dangerText' : ''}>
                {review.pendingSubmission}
              </strong>
            </div>

            {/* FACULTY EVALUATED */}
            <div
              className="clickableKpi"
              onClick={() =>
                openDrillDown({
                  type: 'review-teams',
                  reviewId: review.reviewId,
                  reviewName: `${review.name} (Sem ${review.semester})`,
                  title: `${review.name} (Sem ${review.semester}) — Faculty Evaluated Teams`,
                  initialFilter: 'EVALUATED',
                })
              }
              title="Click to view faculty-evaluated teams"
            >
              <span>Evaluated ↗</span>
              <strong>{review.facultyEvaluated}</strong>
            </div>

            {/* PENDING HOD */}
            <div
              className="clickableKpi"
              onClick={() =>
                openDrillDown({
                  type: 'review-teams',
                  reviewId: review.reviewId,
                  reviewName: `${review.name} (Sem ${review.semester})`,
                  title: `${review.name} (Sem ${review.semester}) — Pending HoD Verification`,
                  initialFilter: 'PENDING_HOD',
                })
              }
              title="Click to view evaluations pending HoD verification"
            >
              <span className={review.pendingHodVerification > 0 ? 'warnText' : ''}>
                Pending HoD ↗
              </span>
              <strong className={review.pendingHodVerification > 0 ? 'warnText' : ''}>
                {review.pendingHodVerification}
              </strong>
            </div>

            {/* VERIFIED */}
            <div
              className="clickableKpi"
              onClick={() =>
                openDrillDown({
                  type: 'review-teams',
                  reviewId: review.reviewId,
                  reviewName: `${review.name} (Sem ${review.semester})`,
                  title: `${review.name} (Sem ${review.semester}) — Verified Evaluations`,
                  initialFilter: 'VERIFIED',
                })
              }
              title="Click to view verified teams"
            >
              <span className="goodText">Verified ↗</span>
              <strong className="goodText">{review.verified}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
