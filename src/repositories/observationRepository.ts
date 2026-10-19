import { LocationData, ObservationLogEntry, ObservationPlanItem } from '../types';
import { appStorage } from './storageRepository';

const PLAN_KEY = 'skyview_observation_plan_v1';
const LOG_KEY = 'skyview_observation_log_v1';
export const OBSERVATION_DATA_CHANGED = 'skyview:observation-data-changed';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const notify = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OBSERVATION_DATA_CHANGED));
};

const isLocation = (value: unknown): value is LocationData => {
  if (!value || typeof value !== 'object') return false;
  const location = value as Partial<LocationData>;
  return typeof location.name === 'string'
    && typeof location.latitude === 'number'
    && typeof location.longitude === 'number';
};

const readPlan = (): ObservationPlanItem[] => appStorage
  .getJson<unknown[]>(PLAN_KEY, [])
  .filter((item): item is ObservationPlanItem => {
    if (!item || typeof item !== 'object') return false;
    const plan = item as Partial<ObservationPlanItem>;
    return typeof plan.id === 'string'
      && typeof plan.targetId === 'string'
      && typeof plan.targetName === 'string'
      && typeof plan.plannedFor === 'string'
      && typeof plan.createdAt === 'string'
      && typeof plan.completed === 'boolean'
      && isLocation(plan.location);
  })
  .sort((a, b) => a.plannedFor.localeCompare(b.plannedFor));

const readLogs = (): ObservationLogEntry[] => appStorage
  .getJson<unknown[]>(LOG_KEY, [])
  .filter((item): item is ObservationLogEntry => {
    if (!item || typeof item !== 'object') return false;
    const log = item as Partial<ObservationLogEntry>;
    return typeof log.id === 'string'
      && typeof log.targetId === 'string'
      && typeof log.targetName === 'string'
      && typeof log.observedAt === 'string'
      && typeof log.createdAt === 'string'
      && typeof log.note === 'string'
      && Number.isInteger(log.rating)
      && Number(log.rating) >= 1
      && Number(log.rating) <= 5
      && isLocation(log.location);
  })
  .sort((a, b) => b.observedAt.localeCompare(a.observedAt));

export const observationRepository = {
  listPlan(): ObservationPlanItem[] {
    return readPlan();
  },

  addPlan(input: Omit<ObservationPlanItem, 'id' | 'createdAt' | 'completed'>): ObservationPlanItem {
    const existing = readPlan();
    const duplicate = existing.find(item => item.targetId === input.targetId && item.plannedFor === input.plannedFor);
    if (duplicate) return duplicate;
    const item: ObservationPlanItem = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    appStorage.setJson(PLAN_KEY, [...existing, item]);
    notify();
    return item;
  },

  togglePlan(id: string): void {
    appStorage.setJson(PLAN_KEY, readPlan().map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    notify();
  },

  removePlan(id: string): void {
    appStorage.setJson(PLAN_KEY, readPlan().filter(item => item.id !== id));
    notify();
  },

  listLogs(): ObservationLogEntry[] {
    return readLogs();
  },

  addLog(input: Omit<ObservationLogEntry, 'id' | 'createdAt'>): ObservationLogEntry {
    const item: ObservationLogEntry = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    appStorage.setJson(LOG_KEY, [item, ...readLogs()].slice(0, 250));
    notify();
    return item;
  },

  removeLog(id: string): void {
    appStorage.setJson(LOG_KEY, readLogs().filter(item => item.id !== id));
    notify();
  },
};
