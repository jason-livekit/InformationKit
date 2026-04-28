import Link from 'next/link';
import { Suspense } from 'react';
import { aggregate } from '@/lib/card-sort/store';
import { ResultsDashboard } from '@/components/card-sort/results-dashboard';
import { Button } from '@/components/bytes/Button';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftXIcon } from '@/icons/react';
import { ResultsSubmittedToast } from './submitted-toast';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const results = await aggregate();
  const sp = await searchParams;
  const justSubmitted = sp.submitted === '1';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="medium">
              Results
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">Card sort dashboard</h1>
          </div>
          <p className="text-fg3 max-w-2xl text-sm">
            Aggregated answers from all teammates so far. Refresh to see new submissions roll in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeftXIcon />}>
              Back to sort
            </Button>
          </Link>
          <Link href="/">
            <Button variant="primary" size="sm">
              Take it again
            </Button>
          </Link>
        </div>
      </div>

      {justSubmitted && (
        <Suspense>
          <ResultsSubmittedToast />
        </Suspense>
      )}

      <ResultsDashboard results={results} />
    </div>
  );
}
