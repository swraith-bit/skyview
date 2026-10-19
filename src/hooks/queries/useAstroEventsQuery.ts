import { useQuery } from '@tanstack/react-query';
import { AstroEvent, LocationData } from '../../types';
import { LangCode } from '../../i18n';
import { getDateKeyInTimeZone } from '../../utils/dateTime';
import { getAstroEvents, formatAstroEventSearch } from '../../utils/events';
import { RawAstroEventSearch } from '../../utils/astroEventSearch';
import { requestAstroEventsFromWorker } from '../../workers/astronomyWorkerClient';

// F3.5: the three-year eclipse search and 60-day planet sweep run in the
// shared astronomy worker and are cached for 15 minutes; the query key is
// day-bucketed so the per-minute observer tick never recomputes the catalog.
const ASTRO_EVENTS_STALE_MS = 15 * 60 * 1000;

interface AstroEventsRequestArgs {
  lang: LangCode;
  timeZone: string | undefined;
  fromDate: Date;
  location: LocationData;
}

const requestAstroEventsFromSharedWorker = (
  { timeZone, fromDate, location }: Omit<AstroEventsRequestArgs, 'lang'>,
  signal: AbortSignal | undefined,
): Promise<RawAstroEventSearch> => new Promise((resolve, reject) => {
  const cancel = requestAstroEventsFromWorker(
    {
      fromMs: fromDate.getTime(),
      latitude: location.latitude,
      longitude: location.longitude,
      timeZone,
    },
    resolve,
    reject,
  );
  if (!signal) return;
  const abort = () => {
    cancel();
    reject(new DOMException('Aborted', 'AbortError'));
  };
  if (signal.aborted) {
    abort();
    return;
  }
  signal.addEventListener('abort', abort, { once: true });
});

const computeAstroEvents = async (
  args: AstroEventsRequestArgs,
  signal: AbortSignal | undefined,
): Promise<AstroEvent[]> => {
  try {
    const search = await requestAstroEventsFromSharedWorker(args, signal);
    return formatAstroEventSearch(search, args.lang, args.timeZone);
  } catch (error) {
    // Cancellation must not fall back — the request is already obsolete.
    if (signal?.aborted) throw error;
    // No worker (construction failure / dead instance): same math on the
    // main thread, identical to the pre-F3.5 behavior.
    return getAstroEvents(args.lang, args.timeZone, args.fromDate, args.location);
  }
};

export const useAstroEventsQuery = (
  lang: LangCode,
  timeZone: string | undefined,
  fromDate: Date,
  location: LocationData,
) => {
  // F3.6 pattern: one rounded coordinate key shared by every cache layer.
  const latKey = location.latitude.toFixed(4);
  const lngKey = location.longitude.toFixed(4);
  const dayKey = getDateKeyInTimeZone(fromDate, timeZone);

  return useQuery<AstroEvent[]>({
    queryKey: ['astro-events', lang, timeZone ?? 'tz-auto', latKey, lngKey, dayKey],
    queryFn: ({ signal }) => computeAstroEvents({ lang, timeZone, fromDate, location }, signal),
    staleTime: ASTRO_EVENTS_STALE_MS,
  });
};
