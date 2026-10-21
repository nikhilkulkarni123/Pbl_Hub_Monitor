import { NextResponse } from 'next/server';
import { isMonitorAuthenticated } from '@/lib/auth';
import { parseFilters } from '@/lib/filters';
import {
  getApplicationDetails,
  getAttentionDetails,
  getGuideRequestDetails,
  getProjectDetails,
  getReviewTeamDetails,
  getStudentDetails,
  getTeamDetails,
  getVerificationDetails,
} from '@/lib/monitor-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isMonitorAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseFilters({
    institution: url.searchParams.get('institution') ?? undefined,
    semester: url.searchParams.get('semester') ?? undefined,
  });

  const type = url.searchParams.get('type') ?? 'students';
  const reviewIdParam = url.searchParams.get('reviewId');
  const reviewId = reviewIdParam ? parseInt(reviewIdParam, 10) : undefined;

  try {
    switch (type) {
      case 'students': {
        const items = await getStudentDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      case 'teams': {
        const items = await getTeamDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      case 'projects': {
        const items = await getProjectDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      case 'applications': {
        const items = await getApplicationDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      case 'guide-requests': {
        const items = await getGuideRequestDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      case 'verifications': {
        const items = await getVerificationDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      case 'review-teams': {
        const items = await getReviewTeamDetails(filters, reviewId);
        return NextResponse.json({ success: true, type, items });
      }
      case 'attention': {
        const items = await getAttentionDetails(filters);
        return NextResponse.json({ success: true, type, items });
      }
      default:
        return NextResponse.json({ error: `Unknown detail type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching details:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch details' }, { status: 500 });
  }
}
