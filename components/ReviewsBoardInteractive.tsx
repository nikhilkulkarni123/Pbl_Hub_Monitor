'use client';

import { useDrillDown } from './DrillDownContext';
import MetricCard from './MetricCard';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { formatDateTime, numberFormat } from '@/lib/format';
import type { ReviewSnapshot } from '@/lib/types';

export default function ReviewsBoardInteractive({ reviews }: { reviews: ReviewSnapshot[] }) {
  const { openDrillDown } = useDrillDown();

  const open = reviews.filter((r) => r.isOpen);
  const pendingSubmission = open.reduce((s, r) => s + r.pendingSubmission, 0);
  const pendingHod = reviews.reduce((s, r) => s + r.pendingHodVerification, 0);
  const verified = reviews.reduce((s, r) => s + r.verified, 0);

  return (
    <>
      <section className="metricGrid metricGridFour">
        {/* 1. OPEN REVIEW WINDOWS */}
        <MetricCard
          label="Open Review Windows"
          value={numberFormat(open.length)}
          icon="OP"
          onClick={() =>
            openDrillDown({
              type: 'review-teams',
              title: 'Teams in Open Review Windows',
              initialFilter: 'ALL',
            })
          }
          detail={<span>Review submission windows active now ↗</span>}
          tone={open.length > 0 ? 'good' : 'default'}
        />

        {/* 2. PENDING SUBMISSIONS */}
        <MetricCard
          label="Pending Submissions"
          value={numberFormat(pendingSubmission)}
          icon="PS"
          onClick={() =>
            openDrillDown({
              type: 'review-teams',
              title: 'Teams with Pending Submissions in Open Windows',
              initialFilter: 'PENDING',
            })
          }
          detail={<span>Only reviews with an open submission window ↗</span>}
          tone={pendingSubmission > 0 ? 'danger' : 'good'}
        />

        {/* 3. PENDING HOD VERIFICATION */}
        <MetricCard
          label="Pending HoD Verification"
          value={numberFormat(pendingHod)}
          icon="HV"
          onClick={() =>
            openDrillDown({
              type: 'verifications',
              title: 'Evaluations Awaiting HoD Verification Across Reviews',
            })
          }
          detail={<span>Faculty-submitted evaluations awaiting verification ↗</span>}
          tone={pendingHod > 0 ? 'warn' : 'good'}
        />

        {/* 4. VERIFIED EVALUATIONS */}
        <MetricCard
          label="Verified Evaluations"
          value={numberFormat(verified)}
          icon="OK"
          onClick={() =>
            openDrillDown({
              type: 'review-teams',
              title: 'Verified Evaluations Across Reviews',
              initialFilter: 'VERIFIED',
            })
          }
          detail={<span>Across reviews in the selected active cycles ↗</span>}
          tone="teal"
        />
      </section>

      <section className="reviewBoard">
        {reviews.map((review) => {
          const submitPct = review.totalTeams > 0 ? Math.round((review.submitted / review.totalTeams) * 100) : 0;
          const evalPct = review.totalTeams > 0 ? Math.round((review.facultyEvaluated / review.totalTeams) * 100) : 0;
          const verifyBase = review.facultyEvaluated || review.totalTeams;
          const verifyPct = verifyBase > 0 ? Math.round((review.verified / verifyBase) * 100) : 0;

          return (
            <article className="panel reviewDetailCard" key={`${review.institution}-${review.reviewId}`}>
              <div className="reviewDetailHead">
                <div>
                  <div className="badgeRow">
                    <StatusBadge tone={review.institution === 'GMIT' ? 'info' : 'neutral'}>
                      {review.institution}
                    </StatusBadge>
                    <StatusBadge tone={review.isOpen ? 'good' : 'neutral'}>
                      {review.isOpen ? 'Submission open' : review.status}
                    </StatusBadge>
                  </div>
                  <h2>
                    Semester {review.semester} • {review.name}
                  </h2>
                  <p>
                    {review.academicCycle} • Deadline {formatDateTime(review.submissionDeadline)}
                  </p>
                </div>
                <div
                  className="reviewBigNumber clickableBigNumber"
                  onClick={() =>
                    openDrillDown({
                      type: 'review-teams',
                      reviewId: review.reviewId,
                      reviewName: `${review.name} (Sem ${review.semester})`,
                      title: `${review.name} (Sem ${review.semester}) — Verified Teams`,
                      initialFilter: 'VERIFIED',
                    })
                  }
                  title="Click to view verified teams"
                >
                  <strong>{review.verified} ↗</strong>
                  <span>verified evaluations</span>
                </div>
              </div>

              {/* REVIEW KPIS WITH INTERACTIVE DRILLDOWN */}
              <div className="reviewKpis">
                {/* 1. TOTAL TEAMS */}
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
                  title="Click to view all teams"
                >
                  <span>Total teams ↗</span>
                  <strong>{review.totalTeams}</strong>
                </div>

                {/* 2. SUBMITTED */}
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

                {/* 3. PENDING SUBMISSION */}
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
                    Pending submission ↗
                  </span>
                  <strong className={review.pendingSubmission > 0 && review.isOpen ? 'dangerText' : ''}>
                    {review.pendingSubmission}
                  </strong>
                </div>

                {/* 4. FACULTY EVALUATED */}
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
                  title="Click to view faculty evaluated teams"
                >
                  <span>Faculty evaluated ↗</span>
                  <strong>{review.facultyEvaluated}</strong>
                </div>

                {/* 5. PENDING HOD */}
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
                  title="Click to view evaluations waiting for HoD verification"
                >
                  <span className={review.pendingHodVerification > 0 ? 'warnText' : ''}>
                    Pending HoD ↗
                  </span>
                  <strong className={review.pendingHodVerification > 0 ? 'warnText' : ''}>
                    {review.pendingHodVerification}
                  </strong>
                </div>

                {/* 6. RETURNED */}
                <div
                  className="clickableKpi"
                  onClick={() =>
                    openDrillDown({
                      type: 'review-teams',
                      reviewId: review.reviewId,
                      reviewName: `${review.name} (Sem ${review.semester})`,
                      title: `${review.name} (Sem ${review.semester}) — Returned for Correction`,
                      initialFilter: 'RETURNED',
                    })
                  }
                  title="Click to view returned evaluations"
                >
                  <span>Returned ↗</span>
                  <strong>{review.returnedForCorrection}</strong>
                </div>
              </div>

              <div className="reviewProgressList">
                <div>
                  <span>Submission progress</span>
                  <ProgressBar value={submitPct} max={100} />
                </div>
                <div>
                  <span>Faculty evaluation progress</span>
                  <ProgressBar value={evalPct} max={100} />
                </div>
                <div>
                  <span>Verification progress</span>
                  <ProgressBar value={verifyPct} max={100} />
                </div>
              </div>
            </article>
          );
        })}
        {reviews.length === 0 && (
          <section className="panel">
            <div className="emptyState">No reviews found for the selected active PBL cycle scope.</div>
          </section>
        )}
      </section>
    </>
  );
}
