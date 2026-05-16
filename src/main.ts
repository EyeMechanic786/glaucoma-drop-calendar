import './style.css';
import { loadState } from './storage';
import type { AppState } from './types';
import {
  initAppState,
  getState,
  updateState,
  TAB_FOCUS,
  captureFocus,
  restoreFocus,
  type RenderOptions,
} from './state';
import {
  renderPatientInfo,
  renderPrescribeMeds,
  bindPatientInfo,
  bindPrescribeMeds,
} from './ui/clinicDashboard';
import { renderPatientView, bindPatientView } from './ui/patientView';
import {
  renderPrintSchedule,
  triggerPrint,
  downloadSchedulePdf,
} from './ui/printSchedule';

initAppState(loadState(), render);

function medCountBadge(count: number): string {
  if (count === 0) return '';
  return `<span class="app-nav__badge" aria-label="${count} medications">${count}</span>`;
}

function render(options?: RenderOptions): void {
  const captured = options?.focusId ? null : captureFocus();
  const state = getState();
  const view = state.activeView;
  const medCount = state.medications.length;

  let viewHtml = '';
  if (view === 'patient-info') viewHtml = renderPatientInfo(state);
  else if (view === 'prescribe') viewHtml = renderPrescribeMeds(state);
  else viewHtml = renderPatientView(state);

  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <header class="app-header no-print">
      <div class="app-header__brand">
        <span class="app-header__icon" aria-hidden="true">👁</span>
        <div>
          <h1 class="app-header__title">Glaucoma Drop Calendar</h1>
          <p class="app-header__tagline">Clinic schedule &amp; patient reminders</p>
        </div>
      </div>
      <nav class="app-nav" aria-label="Main views">
        <button type="button" class="app-nav__btn ${view === 'patient-info' ? 'app-nav__btn--active' : ''}"
          data-view="patient-info" aria-current="${view === 'patient-info' ? 'page' : 'false'}">
          1. Patient details
        </button>
        <button type="button" class="app-nav__btn ${view === 'prescribe' ? 'app-nav__btn--active' : ''}"
          data-view="prescribe" aria-current="${view === 'prescribe' ? 'page' : 'false'}">
          2. Prescribe meds ${medCountBadge(medCount)}
        </button>
        <button type="button" class="app-nav__btn ${view === 'schedule' ? 'app-nav__btn--active' : ''}"
          data-view="schedule" aria-current="${view === 'schedule' ? 'page' : 'false'}"
          ${medCount === 0 ? 'disabled' : ''}>
          3. Patient schedule
        </button>
      </nav>
    </header>

    <main id="main-content" class="app-main">
      <div id="view-root">${viewHtml}</div>
    </main>

    ${renderPrintSchedule(state)}

    <footer class="app-footer no-print">
      <p class="privacy-notice">
        <strong>Privacy:</strong> No patient health data is sent over the internet.
        Your schedule is saved only on this device using browser local storage.
      </p>
    </footer>
  `;

  const viewRoot = app.querySelector('#view-root') as HTMLElement;
  const rerender = (opts?: RenderOptions) => render(opts);

  if (view === 'patient-info') {
    bindPatientInfo(viewRoot, rerender);
  } else if (view === 'prescribe') {
    bindPrescribeMeds(viewRoot, rerender);
  } else {
    bindPatientView(viewRoot, rerender, triggerPrint, () =>
      downloadSchedulePdf(getState),
    );
  }

  app.querySelector('.app-nav')?.addEventListener('click', (e) => {
    const next = (e.target as HTMLElement)
      .closest('[data-view]')
      ?.getAttribute('data-view') as AppState['activeView'] | null;
    if (!next || next === getState().activeView) return;
    if (next === 'schedule' && getState().medications.length === 0) return;
    updateState({ activeView: next }, { focusId: TAB_FOCUS[next] });
  });

  restoreFocus(options?.focusId ?? TAB_FOCUS[view], captured);
}

render({ focusId: TAB_FOCUS[getState().activeView] });
