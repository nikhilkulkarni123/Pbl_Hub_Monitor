import AppShell from '@/components/AppShell';
import ReviewsBoardInteractive from '@/components/ReviewsBoardInteractive';
import { requireMonitorAuth } from '@/lib/auth';
import { parseFilters } from '@/lib/filters';
import { getAllReviews } from '@/lib/monitor-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { searchParams: Promise<{ institution?: string; semester?: string }> };

export default async function ReviewsPage({ searchParams }: Props) {
  await requireMonitorAuth();
  const filters = parseFilters(await searchParams);
  const reviews = await getAllReviews(filters);

  return (
    <AppShell
      filters={filters}
      title="Review Monitoring"
      subtitle="Track submission progress, faculty evaluation and HoD verification across reviews. Click any card or number for full team lists."
      active="/reviews"
      generatedAt={new Date().toISOString()}
    >
      <ReviewsBoardInteractive reviews={reviews} />
    </AppShell>
  );
}

