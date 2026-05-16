import type { AppState } from './types';

const STORAGE_KEY = 'glaucoma-drop-calendar-v1';

export const DEFAULT_STATE: AppState = {
  patientName: '',
  clinicDate: new Date().toISOString().slice(0, 10),
  specialInstructions: '',
  medications: [],
  checkedItems: {},
  activeView: 'patient-info',
  selectedDay: new Date().toISOString().slice(0, 10),
};

function normalizeView(view: unknown): AppState['activeView'] {
  if (view === 'patient-info' || view === 'prescribe' || view === 'schedule') return view;
  if (view === 'clinic') return 'prescribe';
  if (view === 'patient') return 'schedule';
  return 'patient-info';
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      activeView: normalizeView(parsed.activeView),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
