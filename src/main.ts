import './style.css';
import { loadState, saveState } from './storage';
import type { AppState } from './types';
import { renderClinicDashboard, bindClinicDashboard } from './ui/clinicDashboard';
import { renderPatientView, bindPatientView } from './ui/patientView';
import { renderPrintSchedule, triggerPrint } from './ui/printSchedule';

let state: AppState = loadState();

function setState(
  partial: Partial<AppState> | ((s: AppState) => AppState),
): void {
  state =
    typeof partial === 'function'
      ? partial(state)
      : { ...state, ...partial };
  saveState(state);
  render();
}

function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const isClinic = state.activeView === 'clinic';

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
        <button type="button" class="app-nav__btn ${isClinic ? 'app-nav__btn--active' : ''}"
          data-view="clinic" aria-current="${isClinic ? 'page' : 'false'}">
          Clinic setup
        </button>
        <button type="button" class="app-nav__btn ${!isClinic ? 'app-nav__btn--active' : ''}"
          data-view="patient" aria-current="${!isClinic ? 'page' : 'false'}">
          Patient schedule
        </button>
      </nav>
    </header>

    <main id="main-content" class="app-main">
      <div id="view-root">${isClinic ? renderClinicDashboard(state) : renderPatientView(state)}</div>
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
  const onRerender = () => render();

  if (isClinic) {
    bindClinicDashboard(viewRoot, () => state, setState, onRerender);
  } else {
    bindPatientView(viewRoot, () => state, setState, onRerender, triggerPrint);
  }

  app.querySelector('.app-nav')?.addEventListener('click', (e) => {
    const view = (e.target as HTMLElement).closest('[data-view]')?.getAttribute('data-view');
    if (view === 'clinic' || view === 'patient') {
      setState({ activeView: view });
    }
  });
}

render();
