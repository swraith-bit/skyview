import React from 'react';

const Block: React.FC<{ className: string }> = ({ className }) => (
  <div aria-hidden="true" className={`skeleton-block ${className}`} />
);

export const PageLoadingSkeleton: React.FC<{ media?: boolean }> = ({ media = false }) => (
  <div className="w-full max-w-4xl mx-auto space-y-5" role="status" aria-label="Loading">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2 flex-1">
        <Block className="h-6 w-44 max-w-full" />
        <Block className="h-3 w-64 max-w-[80%]" />
      </div>
      <Block className="h-9 w-24" />
    </div>
    <div className={`grid gap-5 ${media ? 'lg:grid-cols-[1.4fr_1fr]' : ''}`}>
      <Block className={media ? 'aspect-[4/3] w-full' : 'h-56 w-full'} />
      <div className="space-y-3">
        <Block className="h-5 w-2/3" />
        <Block className="h-3 w-full" />
        <Block className="h-3 w-11/12" />
        <Block className="h-3 w-4/5" />
        <Block className="h-24 w-full mt-5" />
      </div>
    </div>
  </div>
);

export const PanelLoadingSkeleton: React.FC = () => (
  <div className="w-full min-h-[260px] space-y-4" role="status" aria-label="Loading">
    <div className="flex items-center justify-between gap-4">
      <Block className="h-5 w-40" />
      <Block className="h-8 w-20" />
    </div>
    <Block className="h-28 w-full" />
    <div className="grid grid-cols-2 gap-3">
      <Block className="h-16 w-full" />
      <Block className="h-16 w-full" />
    </div>
  </div>
);
