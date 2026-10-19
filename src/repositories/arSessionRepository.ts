import { appStorage } from './storageRepository';

const SESSION_KEY = 'skyview_ar_sessions_v1';
const MAX_SESSIONS = 50;

export interface ArObservationSession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  targetId?: string;
}

export const readArSessions = (): ArObservationSession[] => appStorage.getJson<ArObservationSession[]>(SESSION_KEY, []);

export const saveArSession = (session: Omit<ArObservationSession, 'id'>): ArObservationSession => {
  const entry: ArObservationSession = {
    ...session,
    id: typeof globalThis.crypto?.randomUUID === 'function' ? globalThis.crypto.randomUUID() : `ar-${session.startedAt}`,
  };
  appStorage.setJson(SESSION_KEY, [entry, ...readArSessions()].slice(0, MAX_SESSIONS));
  return entry;
};
