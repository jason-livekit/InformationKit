'use client';

import { useRouter } from 'next/navigation';
import { CardSort } from '@/components/card-sort/card-sort';

export default function Home() {
  const router = useRouter();
  return (
    <CardSort
      onShowResults={() => router.push('/results')}
      onSubmitted={() => router.push('/results?submitted=1')}
    />
  );
}
