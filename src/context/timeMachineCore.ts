import { createContext, useContext } from 'react';

/**
 * TUR 2 — Global Zaman Ekseni çekirdeği (provider'dan ayrı tutulur ki
 * react-refresh yalnız bileşen dosyasını izlesin).
 */
export const MAX_TIME_OFFSET_MINUTES = 12 * 60;
export const TIME_STEP_MINUTES = 15;

export const clampOffsetMinutes = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_TIME_OFFSET_MINUTES, Math.round(value)));
};

export const shiftInstant = (now: Date, offsetMinutes: number): Date =>
  new Date(now.getTime() + clampOffsetMinutes(offsetMinutes) * 60_000);

export interface TimeMachineValue {
  now: Date;
  offsetMinutes: number;
  instant: Date;
  isShifted: boolean;
  setOffsetMinutes: (minutes: number) => void;
  shiftBy: (deltaMinutes: number) => void;
  reset: () => void;
}

export const TimeMachineContext = createContext<TimeMachineValue | null>(null);

export const useTimeMachine = (): TimeMachineValue => {
  const context = useContext(TimeMachineContext);
  if (!context) throw new Error('useTimeMachine must be used inside TimeMachineProvider');
  return context;
};
