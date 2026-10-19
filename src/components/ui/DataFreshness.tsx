import React from 'react';
import { CloudOff, Database, Radio } from 'lucide-react';
import { LangCode, t } from '../../i18n';
import { formatMessage } from '../../i18nExtra';

export interface DataFreshnessProps {
  fetchedAt?: number;
  source: string;
  offline?: boolean;
  estimated?: boolean;
  lang: LangCode;
  className?: string;
}

const relativeAge = (timestamp: number | undefined, lang: LangCode): string => {
  if (!timestamp) return t('freshness.unknown', lang);
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return t('freshness.now', lang);
  if (minutes < 60) return formatMessage(t('freshness.minsAgo', lang), { mins: minutes });
  const hours = Math.round(minutes / 60);
  return formatMessage(t('freshness.hoursAgo', lang), { hours });
};

export const DataFreshness: React.FC<DataFreshnessProps> = ({ fetchedAt, source, offline, estimated, lang, className = '' }) => {
  const Icon = offline ? CloudOff : estimated ? Database : Radio;
  const qualifier = offline
    ? t('freshness.offline', lang)
    : estimated
      ? t('freshness.estimated', lang)
      : relativeAge(fetchedAt, lang);
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-400 ${className}`.trim()}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{qualifier}</span><span aria-hidden="true">·</span><span>{source}</span>
    </p>
  );
};
