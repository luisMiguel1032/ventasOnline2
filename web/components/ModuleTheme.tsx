'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ModuleTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const module = pathname?.startsWith('/medical') ? 'medical' : 'general';
    document.documentElement.dataset.module = module;
  }, [pathname]);

  return null;
}