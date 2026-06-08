import {
  buildDosesForDay,
  canShiftMonth,
  checkKey,
  formatClinicDate,
  formatMonthYear,
  formatSchedulePeriod,
  getMonthCalendar,
  getScheduleEndDate,
  getWeekDates,
  isDayInSchedule,
  shiftMonth,
} from '../schedule';
import { getState, updateState, TAB_FOCUS, type RenderOptions } from '../state';
import type { AppState, ScheduledDose } from '../types';
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

function renderDoseRow(
  state: AppState,
  dayIso: string,
  dose: ScheduledDose,
  compact: boolean,
): string {
  const ck = checkKey(dayIso, dose.key);
  const done = !!state.checkedItems[ck];
  const label = `${dose.medName}, ${dose.slotShort}, ${dose.eyeLabel}`;
  const cls = compact ? 'month-dose' : 'week-dose';
  return `
    <li class="${cls} ${done ? `${cls}--done` : ''}">
      ${renderDoseCheckbox(dayIso, dose.key, done, `Mark ${label} as taken`)}
      ${capBadgeHtml(dose.capColor, dose.capStyle, dose.capColorSecondary, dose.isOral, true)}
      <div class="${cls}__text">
        <strong>${dose.medName}</strong>
        ${compact ? `<span>${dose.slotShort}</span>` : `<span>${dose.eyeLabel}</span>`}
        ${!compact && dose.notes ? `<em>${dose.notes}</em>` : ''}
      </div>
    </li>`;
}

function renderCalendarToolbar(state: AppState): string {
  const isWeek = state.calendarRange === 'week';
  const canPrev = canShiftMonth(state, state.selectedDay, -1);
  const canNext = canShiftMonth(state, state.selectedDay, 1);
  return `
    <div class="calendar-toolbar">
      <div class="calendar-toolbar__nav" role="group" aria-label="Change month">
        <button type="button" class="btn btn--soft btn--sm" data-month-shift="-1"
          aria-label="Previous month" ${canPrev ? '' : 'disabled'}>←</button>
        <strong class="calendar-toolbar__month">${formatMonthYear(state.selectedDay)}</strong>
        <button type="button" class="btn btn--soft btn--sm" data-month-shift="1"
          aria-label="Next month" ${canNext ? '' : 'disabled'}>→</button>
      </div>
      <div class="calendar-view-toggle" role="group" aria-label="Calendar range">
        <button type="button" class="calendar-view-toggle__btn ${isWeek ? 'calendar-view-toggle__btn--active' : ''}"
          data-calendar-range="week" aria-pressed="${isWeek}">Week view</button>
        <button type="button" class="calendar-view-toggle__btn ${!isWeek ? 'calendar-view-toggle__btn--active' : ''}"
          data-calendar-range="month" aria-pressed="${!isWeek}">Full month</button>
      </div>
    </div>`;
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
            .map(
              (slotId) => `
              <tr>
                <th scope="row" class="week-grid__time-label">${slotLabels[slotId]}</th>
                ${week
                  .map((day) => {
                    const doses = buildDosesForDay(state, day.iso).filter(
                      (d) => d.slotId === slotId,
                    );
                    if (!isDayInSchedule(state, day.iso)) {
                      return `<td class="week-grid__cell week-grid__cell--out-of-range" aria-label="Outside prescription period">—</td>`;
                    }
                    if (doses.length === 0) {
                      return `<td class="week-grid__cell week-grid__cell--empty">—</td>`;
                    }
                    return `<td class="week-grid__cell">
                      <ul class="week-cell-doses">
                        ${doses.map((dose) => renderDoseRow(state, day.iso, dose, false)).join('')}
                      </ul>
                    </td>`;
                  })
                  .join('')}
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function renderMonthGrid(state: AppState): string {
  if (state.medications.length === 0) {
    return `<p class="empty-hint">No medications on the schedule yet. Ask your clinic to add them in the Clinic Setup view.</p>`;
  }

  const weeks = getMonthCalendar(state.selectedDay, state.selectedDay, state);
  const weekdayHead = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return `
    <div class="month-grid-wrap" role="region" aria-label="Monthly medication calendar for ${escapeAttr(formatMonthYear(state.selectedDay))}">
      <div class="month-grid__weekdays">
        ${weekdayHead.map((d) => `<span class="month-grid__weekday">${d}</span>`).join('')}
      </div>
      <div class="month-grid">
        ${weeks
          .map(
            (week) => `
          <div class="month-grid__week">
            ${week
              .map((day) => {
                const doses = buildDosesForDay(state, day.iso);
                const doneCount = doses.filter(
                  (d) => state.checkedItems[checkKey(day.iso, d.key)],
                ).length;
                const cellCls = [
                  'month-cell',
                  day.inMonth ? '' : 'month-cell--outside',
                  !day.inSchedule ? 'month-cell--out-of-range' : '',
                  day.isSelected ? 'month-cell--selected' : '',
                  day.isToday ? 'month-cell--today' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return `
              <div class="${cellCls}">
                <button type="button" class="month-cell__head" data-day="${day.iso}"
                  aria-label="Select ${day.weekday} ${day.dayNum}"
                  ${day.inSchedule ? '' : 'disabled'}>
                  <span class="month-cell__num">${day.dayNum}</span>
                  ${
                    day.inSchedule && doses.length > 0
                      ? `<span class="month-cell__progress">${doneCount}/${doses.length}</span>`
                      : ''
                  }
                </button>
                ${
                  !day.inSchedule
                    ? '<span class="month-cell__empty month-cell__empty--muted">—</span>'
                    : doses.length > 0
                      ? `<ul class="month-cell__doses">${doses.map((d) => renderDoseRow(state, day.iso, d, true)).join('')}</ul>`
                      : '<span class="month-cell__empty">No drops</span>'
                }
              </div>`;
              })
              .join('')}
          </div>`,
          )
          .join('')}
      </div>
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
  const isMonth = state.calendarRange === 'month';
  const scheduleEnd = state.clinicDate
    ? getScheduleEndDate(state.clinicDate, state.scheduleDurationMonths)
    : '';

  return `
    <section class="panel patient-panel" aria-labelledby="patient-heading">
      <header class="panel__header patient-panel__header">
        <div>
          <h2 id="patient-heading">My Drop Schedule</h2>
          <p class="panel__sub">Tap each box when you have taken your drops. Use the arrows to move through months in your prescription.</p>
        </div>
        <div class="print-actions">
          <button type="button" class="btn btn--print btn--lg" id="print-schedule">Print schedule</button>
          <button type="button" class="btn btn--pdf btn--lg" id="save-pdf-schedule">Save as PDF</button>
        </div>
      </header>
      <div class="print-options no-print" role="group" aria-label="Print layout">
        <span class="print-options__label">Print layout</span>
        <div class="print-layout-toggle">
          <button type="button" class="print-layout-toggle__btn ${state.printLayout === 'week' ? 'print-layout-toggle__btn--active' : ''}"
            data-print-layout="week" aria-pressed="${state.printLayout === 'week'}">Weekly</button>
          <button type="button" class="print-layout-toggle__btn ${state.printLayout === 'month' ? 'print-layout-toggle__btn--active' : ''}"
            data-print-layout="month" aria-pressed="${state.printLayout === 'month'}">Full month</button>
        </div>
        <p class="print-options__hint">
          <strong>Full month</strong> prints ${escapeAttr(formatMonthYear(state.selectedDay))} (use calendar arrows to change month).
          Enable <strong>Background graphics</strong> when printing for cap colours.
        </p>
      </div>

      <div class="patient-header-card">
        <div class="patient-header-card__row">
          <span class="patient-header-card__label">Patient</span>
          <strong class="patient-header-card__value">${state.patientName || '—'}</strong>
        </div>
        <div class="patient-header-card__row">
          <span class="patient-header-card__label">Clinic date</span>
          <strong class="patient-header-card__value">${formatClinicDate(state.clinicDate) || '—'}</strong>
        </div>
        <div class="patient-header-card__row patient-header-card__row--period">
          <span class="patient-header-card__label">Prescription period</span>
          <strong class="patient-header-card__value">${state.clinicDate ? formatSchedulePeriod(state) : '—'}</strong>
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

      ${renderCalendarToolbar(state)}

      <div class="day-picker" role="group" aria-label="Select day">
        <label class="field">
          <span class="field__label">Focus day for timeline</span>
          <input type="date" id="selected-day" value="${escapeAttr(state.selectedDay)}"
            ${state.clinicDate ? `min="${escapeAttr(state.clinicDate)}"` : ''}
            ${scheduleEnd ? `max="${escapeAttr(scheduleEnd)}"` : ''} />
        </label>
        ${
          !isMonth
            ? `<div class="day-picker__chips">
          ${week
            .map(
              (d) => `
            <button type="button" class="day-chip ${d.iso === state.selectedDay ? 'day-chip--active' : ''}"
              data-day="${d.iso}">${d.short}</button>`,
            )
            .join('')}
        </div>`
            : `<p class="day-picker__hint">In month view, tap any day in the calendar below to focus the timeline.</p>`
        }
      </div>

      <section aria-labelledby="calendar-heading">
        <h3 id="calendar-heading" class="section-title">${isMonth ? 'Monthly calendar' : 'Weekly calendar'}</h3>
        ${isMonth ? renderMonthGrid(state) : renderWeeklyGrid(state)}
      </section>

      <section aria-labelledby="timeline-heading" class="timeline-section">
        <h3 id="timeline-heading" class="section-title">Today&apos;s timeline — ${formatClinicDate(state.selectedDay)}</h3>
        ${renderDailyTimeline(state)}
      </section>

      <div class="patient-actions">
        <button type="button" class="btn btn--secondary" data-nav="prescribe">Add or edit medications</button>
        <button type="button" class="btn btn--secondary" data-nav="patient-info">Patient details</button>
      </div>
    </section>`;
}

function toggleDoseRowVisual(checkbox: HTMLInputElement): void {
  const done = checkbox.checked;
  checkbox.closest('.week-dose')?.classList.toggle('week-dose--done', done);
  checkbox.closest('.month-dose')?.classList.toggle('month-dose--done', done);
  checkbox.closest('.timeline__item')?.classList.toggle('timeline__item--done', done);

  const dayIso = checkbox.dataset.checkDate;
  if (dayIso) {
    const cell = document.querySelector(
      `.month-cell__head[data-day="${dayIso}"]`,
    );
    if (cell) {
      const state = getState();
      const doses = buildDosesForDay(state, dayIso);
      const doneCount = doses.filter((d) => state.checkedItems[checkKey(dayIso, d.key)]).length;
      const progress = cell.querySelector('.month-cell__progress');
      if (progress && doses.length > 0) {
        progress.textContent = `${doneCount}/${doses.length}`;
      }
    }
  }
}

export function bindPatientView(
  root: HTMLElement,
  _rerender: (options?: RenderOptions) => void,
  onPrint: () => void,
  onSavePdf: () => void,
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
      updateState({ checkedItems }, { render: false });
      toggleDoseRowVisual(t);
      return;
    }
    if (t.id === 'selected-day') {
      updateState({ selectedDay: t.value }, { focusId: 'selected-day' });
    }
  });

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;

    const printLayout = t.closest('[data-print-layout]')?.getAttribute('data-print-layout');
    if (printLayout === 'week' || printLayout === 'month') {
      updateState({ printLayout }, { focusId: 'print-schedule' });
      return;
    }

    const range = t.closest('[data-calendar-range]')?.getAttribute('data-calendar-range');
    if (range === 'week' || range === 'month') {
      updateState({ calendarRange: range }, { focusId: 'selected-day' });
      return;
    }

    const monthShift = t.closest('[data-month-shift]')?.getAttribute('data-month-shift');
    if (monthShift) {
      const state = getState();
      const delta = Number(monthShift);
      if (!canShiftMonth(state, state.selectedDay, delta)) return;
      const next = shiftMonth(state.selectedDay, delta);
      updateState({ selectedDay: next }, { focusId: 'selected-day' });
      return;
    }

    if ((t as HTMLElement).closest('.dose-check')) {
      return;
    }

    const day = t.closest('[data-day]')?.getAttribute('data-day');
    if (day) {
      const state = getState();
      if (!isDayInSchedule(state, day)) return;
      updateState({ selectedDay: day }, { focusId: 'selected-day' });
      return;
    }

    const nav = t.closest('[data-nav]')?.getAttribute('data-nav');
    if (nav === 'patient-info' || nav === 'prescribe') {
      updateState({ activeView: nav }, { focusId: TAB_FOCUS[nav] });
      return;
    }
    if (t.id === 'print-schedule') onPrint();
    if (t.id === 'save-pdf-schedule') onSavePdf();
  });
}
