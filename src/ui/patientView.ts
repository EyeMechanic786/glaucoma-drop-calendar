import { buildDosesForDay, checkKey, formatClinicDate, getWeekDates } from '../schedule';
import type { AppState } from '../types';
import { capBadgeHtml } from './capBadge';

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderDoseCheckbox(
  dateIso: string,
  doseKey: string,
  checked: boolean,
  label: string,
): string {
  const id = `chk-${dateIso}-${doseKey}`;
  return `
    <label class="dose-check" for="${id}">
      <input type="checkbox" id="${id}" class="dose-check__input"
        data-check-date="${dateIso}" data-check-key="${doseKey}"
        ${checked ? 'checked' : ''} aria-label="${escapeAttr(label)}" />
      <span class="dose-check__box" aria-hidden="true"></span>
    </label>`;
}

function renderWeeklyGrid(state: AppState): string {
  const week = getWeekDates(state.selectedDay);
  const slotOrder = ['morning', 'noon', 'evening', 'night'] as const;
  const slotLabels: Record<string, string> = {
    morning: 'Morning (8 AM)',
    noon: 'Noon (12 PM)',
    evening: 'Evening (6 PM)',
    night: 'Night (10 PM)',
  };

  const usedSlots = new Set<string>();
  for (const day of week) {
    for (const dose of buildDosesForDay(state, day.iso)) {
      usedSlots.add(dose.slotId);
    }
  }
  const rows = slotOrder.filter((s) => usedSlots.has(s));

  if (state.medications.length === 0) {
    return `<p class="empty-hint">No medications on the schedule yet. Ask your clinic to add them in the Clinic Setup view.</p>`;
  }

  if (rows.length === 0) {
    return `<p class="empty-hint">No time slots configured.</p>`;
  }

  return `
    <div class="week-grid-wrap" role="region" aria-label="Weekly medication calendar">
      <table class="week-grid">
        <thead>
          <tr>
            <th scope="col" class="week-grid__time-col">Time</th>
            ${week
              .map(
                (d) => `
              <th scope="col" class="week-grid__day-col ${d.iso === state.selectedDay ? 'week-grid__day-col--today' : ''}">
                <span class="week-grid__day-name">${d.label}</span>
                <span class="week-grid__day-date">${d.short}</span>
              </th>`,
              )
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((slotId) => {
              return `
              <tr>
                <th scope="row" class="week-grid__time-label">${slotLabels[slotId]}</th>
                ${week
                  .map((day) => {
                    const doses = buildDosesForDay(state, day.iso).filter(
                      (d) => d.slotId === slotId,
                    );
                    if (doses.length === 0) {
                      return `<td class="week-grid__cell week-grid__cell--empty">—</td>`;
                    }
                    return `<td class="week-grid__cell">
                      <ul class="week-cell-doses">
                        ${doses
                          .map((dose) => {
                            const ck = checkKey(day.iso, dose.key);
                            const done = !!state.checkedItems[ck];
                            const label = `${dose.medName}, ${dose.slotShort}, ${dose.eyeLabel}`;
                            return `
                            <li class="week-dose ${done ? 'week-dose--done' : ''}">
                              ${renderDoseCheckbox(day.iso, dose.key, done, `Mark ${label} as taken`)}
                              ${capBadgeHtml(dose.capColor, dose.capStyle, dose.capColorSecondary, dose.isOral, true)}
                              <div class="week-dose__text">
                                <strong>${dose.medName}</strong>
                                <span>${dose.eyeLabel}</span>
                                ${dose.notes ? `<em>${dose.notes}</em>` : ''}
                              </div>
                            </li>`;
                          })
                          .join('')}
                      </ul>
                    </td>`;
                  })
                  .join('')}
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function renderDailyTimeline(state: AppState): string {
  const doses = buildDosesForDay(state, state.selectedDay);
  const dayLabel = formatClinicDate(state.selectedDay);

  if (doses.length === 0) {
    return `<p class="empty-hint">Nothing scheduled for this day.</p>`;
  }

  return `
    <ol class="timeline" aria-label="Daily medication timeline for ${escapeAttr(dayLabel)}">
      ${doses
        .map((dose) => {
          const ck = checkKey(state.selectedDay, dose.key);
          const done = !!state.checkedItems[ck];
          const label = `${dose.medName} at ${dose.period}, ${dose.eyeLabel}`;
          return `
          <li class="timeline__item ${done ? 'timeline__item--done' : ''}">
            <div class="timeline__time">
              <span class="timeline__period">${dose.slotShort}</span>
              <span class="timeline__clock">${dose.period}</span>
            </div>
            <div class="timeline__card">
              ${renderDoseCheckbox(state.selectedDay, dose.key, done, `Mark ${label} as taken`)}
              ${capBadgeHtml(dose.capColor, dose.capStyle, dose.capColorSecondary, dose.isOral)}
              <div class="timeline__body">
                <h4 class="timeline__med">${dose.medName}</h4>
                <p class="timeline__eye">${dose.eyeLabel}</p>
                ${dose.notes ? `<p class="timeline__notes">${dose.notes}</p>` : ''}
              </div>
            </div>
          </li>`;
        })
        .join('')}
    </ol>`;
}

export function renderPatientView(state: AppState): string {
  const week = getWeekDates(state.selectedDay);

  return `
    <section class="panel patient-panel" aria-labelledby="patient-heading">
      <header class="panel__header patient-panel__header">
        <div>
          <h2 id="patient-heading">My Drop Schedule</h2>
          <p class="panel__sub">Tap each box when you have taken your drops.</p>
        </div>
        <button type="button" class="btn btn--print btn--lg" id="print-schedule">
          🖨 Print High-Contrast Schedule
        </button>
      </header>

      <div class="patient-header-card">
        <div class="patient-header-card__row">
          <span class="patient-header-card__label">Patient</span>
          <strong class="patient-header-card__value">${state.patientName || '—'}</strong>
        </div>
        <div class="patient-header-card__row">
          <span class="patient-header-card__label">Clinic date</span>
          <strong class="patient-header-card__value">${formatClinicDate(state.clinicDate) || '—'}</strong>
        </div>
        ${
          state.specialInstructions
            ? `<div class="patient-header-card__instructions">
            <span class="patient-header-card__label">Special instructions</span>
            <p>${state.specialInstructions.replace(/</g, '&lt;')}</p>
          </div>`
            : ''
        }
      </div>

      <div class="day-picker" role="group" aria-label="Select day">
        <label class="field">
          <span class="field__label">Focus day for timeline</span>
          <input type="date" id="selected-day" value="${escapeAttr(state.selectedDay)}" />
        </label>
        <div class="day-picker__chips">
          ${week
            .map(
              (d) => `
            <button type="button" class="day-chip ${d.iso === state.selectedDay ? 'day-chip--active' : ''}"
              data-day="${d.iso}">${d.short}</button>`,
            )
            .join('')}
        </div>
      </div>

      <section aria-labelledby="weekly-heading">
        <h3 id="weekly-heading" class="section-title">Weekly calendar</h3>
        ${renderWeeklyGrid(state)}
      </section>

      <section aria-labelledby="timeline-heading" class="timeline-section">
        <h3 id="timeline-heading" class="section-title">Today&apos;s timeline — ${formatClinicDate(state.selectedDay)}</h3>
        ${renderDailyTimeline(state)}
      </section>

      <div class="patient-actions">
        <button type="button" class="btn btn--secondary" id="back-clinic">Back to clinic setup</button>
      </div>
    </section>`;
}

export function bindPatientView(
  root: HTMLElement,
  getState: () => AppState,
  onChange: (partial: Partial<AppState> | ((s: AppState) => AppState)) => void,
  onRerender: () => void,
  onPrint: () => void,
): void {
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.classList.contains('dose-check__input')) {
      const dateIso = t.dataset.checkDate!;
      const doseKey = t.dataset.checkKey!;
      const key = checkKey(dateIso, doseKey);
      const state = getState();
      const checkedItems = { ...state.checkedItems };
      if (t.checked) checkedItems[key] = true;
      else delete checkedItems[key];
      onChange({ checkedItems });
    }
    if (t.id === 'selected-day') {
      onChange({ selectedDay: t.value });
      onRerender();
    }
  });

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const day = t.closest('[data-day]')?.getAttribute('data-day');
    if (day) {
      onChange({ selectedDay: day });
      onRerender();
      return;
    }
    if (t.id === 'back-clinic') {
      onChange({ activeView: 'clinic' });
      onRerender();
    }
    if (t.id === 'print-schedule') {
      onPrint();
    }
  });
}
