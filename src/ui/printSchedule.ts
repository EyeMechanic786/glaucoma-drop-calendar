import { ALL_TIME_SLOTS } from '../data/timeSlots';
import { buildDosesForDay, formatClinicDate, getWeekDates, medDisplayName } from '../schedule';
import { findPreset } from '../data/medications';
import type { AppState, ScheduledDose } from '../types';
import { medAccentStyle, printCapHtml } from './printCap';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function printDoseBlock(dose: ScheduledDose): string {
  const oral = dose.isOral ? ' <span class="print-oral-tag">ORAL TABLET</span>' : '';
  return `
    <div class="print-dose" style="${medAccentStyle(dose.capColor)}">
      <span class="print-check-box" aria-hidden="true"></span>
      ${printCapHtml(dose.capColor, dose.capStyle, dose.capColorSecondary, dose.isOral)}
      <span class="print-dose-text">
        <strong class="print-dose-name">${escapeHtml(dose.medName)}${oral}</strong>
        <span class="print-dose-eye">${dose.eyeLabel}</span>
        ${dose.notes ? `<span class="print-dose-notes">${escapeHtml(dose.notes)}</span>` : ''}
      </span>
    </div>`;
}

function printDailyItem(dose: ScheduledDose): string {
  return `
    <li class="print-daily-item" style="${medAccentStyle(dose.capColor)}">
      <span class="print-check-box" aria-hidden="true"></span>
      ${printCapHtml(dose.capColor, dose.capStyle, dose.capColorSecondary, dose.isOral)}
      <span class="print-daily-item__text">
        <strong>${escapeHtml(dose.medName)}</strong>
        <span>${dose.eyeLabel}${dose.notes ? ` · ${escapeHtml(dose.notes)}` : ''}</span>
      </span>
    </li>`;
}

export function renderPrintSchedule(state: AppState): string {
  const week = getWeekDates(state.selectedDay || state.clinicDate);
  const days = week.length > 0 ? week : getWeekDates(new Date().toISOString().slice(0, 10));

  const slotRows = ALL_TIME_SLOTS.map((slot) => {
    const dayCells = days
      .map((day) => {
        const doses = buildDosesForDay(state, day.iso).filter((d) => d.slotId === slot.id);
        if (doses.length === 0) {
          return `<td class="print-cell print-cell--empty">—</td>`;
        }
        return `<td class="print-cell">${doses.map(printDoseBlock).join('')}</td>`;
      })
      .join('');

    return `
      <tr class="print-slot-row">
        <th class="print-time-col">
          <span class="print-time-col__label">${slot.shortLabel}</span>
          <span class="print-time-col__time">${slot.period}</span>
        </th>
        ${dayCells}
      </tr>`;
  });

  const medLegend = state.medications
    .map((entry) => {
      const preset = findPreset(entry.presetId);
      const name = medDisplayName(entry);
      if (!preset) return '';
      return `
        <li class="print-legend__card" style="${medAccentStyle(preset.capColor)}">
          ${printCapHtml(
            preset.capColor,
            preset.capStyle,
            preset.capColorSecondary,
            preset.isOral,
          )}
          <span class="print-legend__name">${escapeHtml(name)}</span>
          ${preset.isOral ? '<span class="print-oral-tag">ORAL TABLET</span>' : ''}
        </li>`;
    })
    .join('');

  return `
    <div id="print-area" class="print-area" aria-hidden="true">
      <header class="print-header">
        <div class="print-header__banner">
          <span class="print-header__logo" aria-hidden="true">👁</span>
          <div>
            <h1>Glaucoma Medication Schedule</h1>
            <p class="print-header__subtitle">Personal eye drop plan · cap colours match your bottles</p>
          </div>
        </div>
        <div class="print-meta-grid">
          <div class="print-meta-box">
            <span class="print-meta-label">Patient name</span>
            <span class="print-meta-value">${escapeHtml(state.patientName) || '________________________'}</span>
          </div>
          <div class="print-meta-box">
            <span class="print-meta-label">Clinic date</span>
            <span class="print-meta-value">${escapeHtml(formatClinicDate(state.clinicDate)) || '________________________'}</span>
          </div>
        </div>
        <div class="print-meta-box print-meta-box--wide">
          <span class="print-meta-label">Special instructions</span>
          <span class="print-meta-value">${escapeHtml(state.specialInstructions) || '________________________________________________________________'}</span>
        </div>
      </header>

      ${
        medLegend
          ? `<section class="print-legend">
          <h2>Your medications <span class="print-legend__hint">(bottle cap colours)</span></h2>
          <ul class="print-legend__grid">${medLegend}</ul>
        </section>`
          : ''
      }

      <section class="print-calendar-section">
        <h2>Weekly schedule</h2>
        <p class="print-calendar-intro">Check each box when you have taken your drops. Same routine every day unless your doctor advises otherwise.</p>
        <table class="print-week-table">
          <thead>
            <tr>
              <th class="print-time-col print-time-col--head">Time</th>
              ${days.map((d) => `<th class="print-day-head"><span class="print-day-head__name">${d.label}</span><span class="print-day-head__date">${d.short}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>${slotRows.join('')}</tbody>
        </table>
      </section>

      <section class="print-daily-detail">
        <h2>Daily checklist</h2>
        <p class="print-calendar-intro">Quick reference for today&apos;s routine (same each day).</p>
        ${ALL_TIME_SLOTS.map((slot) => {
          const doses = buildDosesForDay(state, state.selectedDay).filter(
            (d) => d.slotId === slot.id,
          );
          if (doses.length === 0) return '';
          return `
          <div class="print-daily-block">
            <h3 class="print-daily-block__title"><span>${slot.shortLabel}</span> ${slot.period}</h3>
            <ul class="print-daily-list">
              ${doses.map(printDailyItem).join('')}
            </ul>
          </div>`;
        }).join('')}
      </section>

      <footer class="print-footer">
        <p>Check each box when you have taken your drops. No patient health data is sent over the internet.</p>
        <p class="print-footer__small">Glaucoma Drop Calendar · For clinic use · Not a substitute for medical advice</p>
      </footer>
    </div>`;
}

export function triggerPrint(): void {
  window.print();
}

function pdfFilename(state: AppState): string {
  const name = state.patientName.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const date = state.clinicDate || 'schedule';
  return `glaucoma-schedule${name ? `-${name}` : ''}-${date}.pdf`;
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function mountPdfCaptureNode(source: HTMLElement): HTMLElement {
  const existing = document.getElementById('pdf-export-root');
  existing?.remove();

  const root = document.createElement('div');
  root.id = 'pdf-export-root';
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.removeAttribute('aria-hidden');
  clone.classList.add('print-area', 'print-area--capture');
  clone.style.display = 'block';
  root.appendChild(clone);
  document.body.appendChild(root);
  return clone;
}

function unmountPdfCaptureNode(): void {
  document.getElementById('pdf-export-root')?.remove();
}

export async function downloadSchedulePdf(
  getState: () => AppState,
): Promise<void> {
  const element = document.getElementById('print-area');
  if (!element) {
    alert('Nothing to save yet. Add medications to the schedule first.');
    return;
  }

  const state = getState();
  if (state.medications.length === 0) {
    alert('Add at least one medication before saving a PDF.');
    return;
  }

  const btn = document.getElementById('save-pdf-schedule') as HTMLButtonElement | null;
  const prevLabel = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Creating PDF…';
  }

  document.body.classList.add('is-exporting-pdf');
  let captureEl: HTMLElement | null = null;

  try {
    captureEl = mountPdfCaptureNode(element);
    await waitForPaint();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const width = Math.max(captureEl.scrollWidth, captureEl.offsetWidth, 794);
    const height = Math.max(captureEl.scrollHeight, captureEl.offsetHeight, 400);

    if (height < 50) {
      throw new Error('Print layout has no visible height');
    }

    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: [6, 6, 6, 6],
        filename: pdfFilename(state),
        image: { type: 'png', quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#f8fafc',
          logging: false,
          width,
          height,
          windowWidth: width,
          windowHeight: height,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(captureEl)
      .save();
  } catch {
    alert(
      'Could not create the PDF on this device. Try Print, then choose Microsoft Print to PDF in the printer list.',
    );
  } finally {
    unmountPdfCaptureNode();
    document.body.classList.remove('is-exporting-pdf');
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevLabel ?? 'Save as PDF';
    }
  }
}
