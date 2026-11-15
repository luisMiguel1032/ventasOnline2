'use client';

import { useEffect, useState } from 'react';

import { formatRemaining } from '@/lib/deals';

export function DealCountdown({
  endsAt,
  prefix = 'Termina en',
  className,
}: {
  endsAt: string | null | undefined;
  prefix?: string;
  className?: string;
}) {
  const [label, setLabel] = useState('--:--:--');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!endsAt) return;

    const update = () => {
      const remaining = new Date(endsAt).getTime() - Date.now();
      setFinished(remaining <= 0);
      setLabel(formatRemaining(endsAt));
    };

    update();
    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [endsAt]);

  if (!endsAt) return null;

  return (
    <span className={className ?? 'countdown'} aria-live="off">
      {finished ? null : <span className="countdown-prefix">{prefix} </span>}
      <span className={finished ? 'countdown-clock is-finished' : 'countdown-clock'}>
        {label}
      </span>
    </span>
  );
}
