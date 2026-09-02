'use client';

import { useEffect, useState } from 'react';
import MarketingApp from '@/MarketingApp';
import MobileApp from '@/app/MobileApp';
import { preferAppShell } from '@/app/detectAppMode';

export default function HomePage() {
  const [useApp, setUseApp] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUseApp(preferAppShell());
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return useApp ? <MobileApp /> : <MarketingApp />;
}
