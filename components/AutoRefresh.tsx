'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setRemaining((value: number) => {
        if (value <= 1) {
          router.refresh();
          return seconds;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [router, seconds]);

  return <span className="refreshText">Refresh in {remaining}s</span>;
}
