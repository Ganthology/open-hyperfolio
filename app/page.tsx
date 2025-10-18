// 'use client';

import { Suspense } from 'react';
import { PortfolioScreen } from '@/module/portfolio/view/screens/PortfolioScreen';

/**
 * PortfolioPage - Routing layer
 * Just renders the screen, no logic, no state
 */
export default function PortfolioPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PortfolioScreen />
    </Suspense>
  );
}

/**
 * LoadingFallback - Simple loading state while search params are being read
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background font-mono flex items-center justify-center">
      <div className="text-muted-foreground">LOADING...</div>
    </div>
  );
}
