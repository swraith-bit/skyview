import React, { lazy, Suspense } from 'react';
import { PageLoadingSkeleton } from '../../components/ui/Skeleton';

const AstroEventsHub = lazy(() => import('../astronomy/AstroEventsHub').then(module => ({ default: module.AstroEventsHub })));

export const PlanHub: React.FC = () => (
  <Suspense fallback={<PageLoadingSkeleton />}>
    <AstroEventsHub />
  </Suspense>
);
