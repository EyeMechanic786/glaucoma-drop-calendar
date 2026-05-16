import { saveState } from './storage';
import type { AppState } from './types';

export type RenderOptions = {
  focusId?: string;
};

export type StateUpdateOptions = {
  /** Rebuild the UI (default true). Set false while typing in text fields. */
  render?: boolean;
  /** Focus this field after render (e.g. when changing tabs). */
  focusId?: string;
};

let state: AppState;
let renderFn: (options?: RenderOptions) => void = () => {};

export function initAppState(initial: AppState, render: (options?: RenderOptions) => void): void {
  state = initial;
  renderFn = render;
}

export function getState(): AppState {
  return state;
}

export function updateState(
  partial: Partial<AppState> | ((s: AppState) => AppState),
  options: StateUpdateOptions = {},
): void {
  const { render = true, focusId } = options;
  state =
    typeof partial === 'function'
      ? partial(state)
      : { ...state, ...partial };
  saveState(state);

  if (render) {
    renderFn({ focusId });
  } else {
    syncChrome();
  }
}

/** Update header badge and patient banner without rebuilding the form. */
export function syncChrome(): void {
  const count = state.medications.length;
  const name = state.patientName.trim() || 'Patient name not set';
  const countLabel =
    count === 0
      ? 'No medications yet'
      : count === 1
        ? '1 medication prescribed'
        : `${count} medications prescribed`;

  document.querySelectorAll('.patient-context__name').forEach((el) => {
    el.textContent = name;
  });
  document.querySelectorAll('.patient-context__count').forEach((el) => {
    el.textContent = countLabel;
  });

  const prescribeBtn = document.querySelector<HTMLButtonElement>('[data-view="prescribe"]');
  if (prescribeBtn) {
    const badge =
      count > 0
        ? `<span class="app-nav__badge" aria-label="${count} medications">${count}</span>`
        : '';
    prescribeBtn.innerHTML = `2. Prescribe meds ${badge}`;
    prescribeBtn.setAttribute(
      'aria-label',
      count > 0 ? `Prescribe medications, ${count} added` : 'Prescribe medications',
    );
  }

  const workflowText = document.querySelector<HTMLElement>('[data-workflow-text]');
  if (workflowText) {
    workflowText.innerHTML =
      count > 0
        ? `This patient has <strong>${count}</strong> medication${count === 1 ? '' : 's'} on the schedule. You can add more or open the patient view.`
        : 'When patient details are saved, go to <strong>Prescribe medications</strong> to add drops for this patient. You can add as many medications as needed.';
  }

  const prescribeCta = document.querySelector<HTMLButtonElement>('[data-nav="prescribe"]');
  if (prescribeCta) {
    prescribeCta.textContent =
      count > 0 ? `Prescribe medications (${count} added)` : 'Prescribe medications';
  }

  const scheduleBtn = document.querySelector<HTMLButtonElement>('[data-nav="schedule"]');
  if (scheduleBtn) {
    scheduleBtn.disabled = count === 0;
  }

  const scheduleTab = document.querySelector<HTMLButtonElement>('[data-view="schedule"]');
  if (scheduleTab && count === 0 && state.activeView === 'schedule') {
    updateState({ activeView: 'prescribe' }, { focusId: 'med-preset-select' });
  }
}

export const TAB_FOCUS: Record<AppState['activeView'], string> = {
  'patient-info': 'patient-name',
  prescribe: 'med-preset-select',
  schedule: 'selected-day',
};

export function captureFocus(): { id: string; start: number | null; end: number | null } | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el?.id || el === document.body) return null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return { id: el.id, start: el.selectionStart, end: el.selectionEnd };
  }
  if (el instanceof HTMLSelectElement) {
    return { id: el.id, start: null, end: null };
  }
  return null;
}

export function restoreFocus(
  preferredId: string | undefined,
  captured: { id: string; start: number | null; end: number | null } | null,
): void {
  const id = preferredId ?? captured?.id;
  if (!id) return;
  const el = document.getElementById(id);
  if (!el || !(el instanceof HTMLElement)) return;

  requestAnimationFrame(() => {
    el.focus();
    if (
      captured &&
      captured.id === id &&
      captured.start !== null &&
      captured.end !== null &&
      (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    ) {
      try {
        el.setSelectionRange(captured.start, captured.end);
      } catch {
        /* date/time inputs may not support selection */
      }
    }
  });
}
