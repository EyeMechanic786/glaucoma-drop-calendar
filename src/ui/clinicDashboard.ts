import { MEDICATION_PRESETS, findPreset } from '../data/medications';
import { ALL_TIME_SLOTS, slotsForFrequency } from '../data/timeSlots';
import type { AppState, EyeTarget, Frequency, MedicationEntry } from '../types';
import { capBadgeHtml } from './capBadge';
import { medDisplayName } from '../schedule';
import { getState, updateState, type RenderOptions } from '../state';

let draftPresetId = 'latanoprost';
let draftCustomName = '';
let draftFrequency: Frequency = 'once';
let draftEye: EyeTarget = 'both';
let draftSlots = slotsForFrequency('once');
let draftNotes = '';
let medFilter = '';
let lastAddedMessage = '';

function uid(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function filteredPresets(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return MEDICATION_PRESETS;
  return MEDICATION_PRESETS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.searchTerms.some((t) => t.includes(q)),
  );
}

function renderMedSelectOptions(): string {
  const list = filteredPresets(medFilter);
  const groups: { label: string; ids: string[] }[] = [
    { label: 'Eye drops', ids: list.filter((m) => !m.isOral && m.id !== 'other').map((m) => m.id) },
    { label: 'Oral medication', ids: list.filter((m) => m.isOral).map((m) => m.id) },
    { label: 'Other', ids: list.filter((m) => m.id === 'other').map((m) => m.id) },
  ];

  const optionHtml = (id: string) => {
    const m = findPreset(id);
    if (!m) return '';
    const oral = m.isOral ? ' — ORAL TABLET' : '';
    const selected = m.id === draftPresetId ? ' selected' : '';
    return `<option value="${m.id}"${selected}>${m.name}${oral}</option>`;
  };

  return groups
    .filter((g) => g.ids.length > 0)
    .map(
      (g) => `
      <optgroup label="${g.label}">
        ${g.ids.map(optionHtml).join('')}
      </optgroup>`,
    )
    .join('');
}

function renderSlotCheckboxes(): string {
  const preset = findPreset(draftPresetId);
  const isOral = preset?.isOral ?? draftEye === 'oral';

  return ALL_TIME_SLOTS.map((slot) => {
    const checked = draftSlots.includes(slot.id);
    const disabled = isOral && slot.id !== 'morning' && slot.id !== 'noon';
    return `
      <label class="slot-check ${disabled ? 'slot-check--disabled' : ''}">
        <input type="checkbox" name="time-slot" value="${slot.id}"
          ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}
          data-slot="${slot.id}" />
        <span class="slot-check__label">${slot.label}</span>
      </label>`;
  }).join('');
}

function renderMedList(state: AppState): string {
  if (state.medications.length === 0) {
    return `<p class="empty-hint">No medications added yet. Use the form above to add the first medication for this patient.</p>`;
  }

  return `<ul class="med-list" role="list">
    ${state.medications
      .map((entry) => {
        const preset = findPreset(entry.presetId);
        const name = medDisplayName(entry);
        const slots = entry.enabledSlots
          .map((id) => ALL_TIME_SLOTS.find((s) => s.id === id)?.shortLabel ?? id)
          .join(', ');
        return `
        <li class="med-list__item" data-med-id="${entry.id}">
          ${capBadgeHtml(
            preset?.capColor ?? '#4b5563',
            preset?.capStyle ?? 'solid',
            preset?.capColorSecondary,
            preset?.isOral,
            true,
          )}
          <div class="med-list__body">
            <strong>${name}</strong>
            <span>${entry.frequency.replace('_', ' ')} · ${entry.eye.toUpperCase()} · ${slots}</span>
            ${entry.notes ? `<em>${entry.notes}</em>` : ''}
          </div>
          <button type="button" class="btn btn--danger btn--sm" data-remove-med="${entry.id}" aria-label="Remove ${name}">Remove</button>
        </li>`;
      })
      .join('')}
  </ul>`;
}

function patientContextBar(state: AppState): string {
  const name = state.patientName.trim() || 'Patient name not set';
  const count = state.medications.length;
  const countLabel =
    count === 0
      ? 'No medications yet'
      : count === 1
        ? '1 medication prescribed'
        : `${count} medications prescribed`;
  return `
    <div class="patient-context" role="status">
      <div class="patient-context__main">
        <span class="patient-context__label">Current patient</span>
        <strong class="patient-context__name">${escapeHtml(name)}</strong>
        <span class="patient-context__count">${countLabel}</span>
      </div>
    </div>`;
}

export function renderPatientInfo(state: AppState): string {
  const count = state.medications.length;
  return `
    <section class="panel clinic-panel" aria-labelledby="patient-info-heading">
      <header class="panel__header">
        <h2 id="patient-info-heading">Patient details</h2>
        <p class="panel__sub">Enter visit information once, then prescribe one or more medications on the next tab.</p>
      </header>

      ${patientContextBar(state)}

      <fieldset class="patient-meta">
        <legend>Patient &amp; visit details</legend>
        <div class="field-grid">
          <label class="field">
            <span class="field__label">Patient name</span>
            <input type="text" id="patient-name" class="type-first" value="${escapeAttr(state.patientName)}"
              placeholder="e.g., Jane Smith" autocomplete="name" spellcheck="false" />
          </label>
          <label class="field">
            <span class="field__label">Clinic date</span>
            <input type="date" id="clinic-date" value="${escapeAttr(state.clinicDate)}" />
          </label>
        </div>
        <label class="field">
          <span class="field__label">Special instructions (schedule header)</span>
          <textarea id="special-instructions" class="type-first" rows="2"
            placeholder="e.g., Return in 4 weeks. Call if redness or pain.">${escapeHtml(state.specialInstructions)}</textarea>
        </label>
      </fieldset>

      <section class="workflow-card" aria-labelledby="workflow-heading">
        <h3 id="workflow-heading">Next steps</h3>
        <p class="workflow-card__text" data-workflow-text>
          ${
            count > 0
              ? `This patient has <strong>${count}</strong> medication${count === 1 ? '' : 's'} on the schedule. You can add more or open the patient view.`
              : 'When patient details are saved, go to <strong>Prescribe medications</strong> to add drops for this patient. You can add as many medications as needed.'
          }
        </p>
        <div class="clinic-actions">
          <button type="button" class="btn btn--primary btn--lg" data-nav="prescribe">
            Prescribe medications${count > 0 ? ` (${count} added)` : ''}
          </button>
          <button type="button" class="btn btn--secondary" data-nav="schedule" ${count === 0 ? 'disabled' : ''}>
            View patient schedule
          </button>
        </div>
      </section>

      <div class="clinic-actions clinic-actions--footer">
        <button type="button" class="btn btn--secondary" id="clear-schedule">
          Clear all data
        </button>
      </div>
    </section>`;
}

export function renderPrescribeMeds(state: AppState): string {
  const preset = findPreset(draftPresetId);
  const showCustom = draftPresetId === 'other';
  const isOralPreset = preset?.isOral;
  const heading =
    state.medications.length === 0 ? 'Add first medication' : 'Add another medication';

  return `
    <section class="panel clinic-panel" aria-labelledby="prescribe-heading">
      <header class="panel__header">
        <h2 id="prescribe-heading">Prescribe medications</h2>
        <p class="panel__sub">Add each medication for this patient. Repeat the form for every drop or tablet you prescribe.</p>
      </header>

      ${patientContextBar(state)}

      ${
        lastAddedMessage
          ? `<p class="add-success" role="status">${escapeHtml(lastAddedMessage)}</p>`
          : ''
      }

      <form class="med-form" id="add-med-form" aria-labelledby="add-med-heading">
        <h3 id="add-med-heading">${heading}</h3>

        <div class="med-picker">
          <label class="field">
            <span class="field__label">Select medication</span>
            <select id="med-preset-select" class="med-select" aria-describedby="med-picker-hint">
              ${renderMedSelectOptions()}
            </select>
            <span id="med-picker-hint" class="field-hint">Choose from the list, or type below to narrow options.</span>
          </label>
          <label class="field">
            <span class="field__label">Quick filter (optional)</span>
            <input type="search" id="med-filter" class="med-filter type-first"
              value="${escapeAttr(medFilter)}"
              placeholder="e.g., Latanoprost, Timolol, oral…" autocomplete="off" spellcheck="false" />
          </label>
          <div class="preset-preview" aria-live="polite">
            ${capBadgeHtml(
              preset?.capColor ?? '#4b5563',
              preset?.capStyle ?? 'solid',
              preset?.capColorSecondary,
              preset?.isOral,
            )}
            <span class="preset-preview__name">${preset?.name ?? ''}</span>
          </div>
        </div>

        ${showCustom ? `
        <label class="field">
          <span class="field__label">Custom medication name</span>
          <input type="text" id="custom-med-name" value="${escapeAttr(draftCustomName)}"
            placeholder="Enter medication name" required />
        </label>` : ''}

        <div class="field-grid field-grid--3">
          <label class="field">
            <span class="field__label">Dosage frequency</span>
            <select id="med-frequency" ${isOralPreset ? 'disabled' : ''}>
              <option value="once" ${draftFrequency === 'once' ? 'selected' : ''}>Once daily</option>
              <option value="twice" ${draftFrequency === 'twice' ? 'selected' : ''}>Twice daily</option>
              <option value="three" ${draftFrequency === 'three' ? 'selected' : ''}>Three times daily</option>
              <option value="four" ${draftFrequency === 'four' ? 'selected' : ''}>Four times daily</option>
            </select>
          </label>
          <label class="field">
            <span class="field__label">Eye / route</span>
            <select id="med-eye">
              <option value="left" ${draftEye === 'left' ? 'selected' : ''} ${isOralPreset ? 'disabled' : ''}>Left eye only</option>
              <option value="right" ${draftEye === 'right' ? 'selected' : ''} ${isOralPreset ? 'disabled' : ''}>Right eye only</option>
              <option value="both" ${draftEye === 'both' ? 'selected' : ''} ${isOralPreset ? 'disabled' : ''}>Both eyes</option>
              <option value="oral" ${draftEye === 'oral' || isOralPreset ? 'selected' : ''}>Oral (tablets)</option>
            </select>
          </label>
        </div>

        <fieldset class="time-slots-fieldset">
          <legend>Time slots</legend>
          <div class="slot-checks" id="slot-checks">${renderSlotCheckboxes()}</div>
        </fieldset>

        <label class="field">
          <span class="field__label">Notes for this medication</span>
          <textarea id="med-notes" class="type-first" rows="2"
            placeholder="e.g., Keep in fridge until opened">${escapeHtml(draftNotes)}</textarea>
        </label>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary" name="add-action" value="add">
            Add medication to schedule
          </button>
          <button type="submit" class="btn btn--secondary" name="add-action" value="another">
            Add &amp; prescribe another
          </button>
        </div>
      </form>

      <section class="added-meds" aria-labelledby="added-meds-heading">
        <h3 id="added-meds-heading">Medications for this patient (${state.medications.length})</h3>
        ${renderMedList(state)}
      </section>

      <div class="clinic-actions">
        <button type="button" class="btn btn--primary btn--lg" data-nav="schedule" ${state.medications.length === 0 ? 'disabled' : ''}>
          Open patient schedule
        </button>
        <button type="button" class="btn btn--secondary" data-nav="patient-info">
          Edit patient details
        </button>
      </div>
    </section>`;
}

function syncDraftFromPreset(presetId: string): void {
  draftPresetId = presetId;
  const preset = findPreset(presetId);
  if (preset?.isOral) {
    draftEye = 'oral';
    draftFrequency = 'once';
    draftSlots = ['morning'];
  } else if (draftEye === 'oral') {
    draftEye = 'both';
  }
  if (!preset?.isOral) {
    draftSlots = slotsForFrequency(draftFrequency);
  }
}

function bindNav(root: HTMLElement): void {
  root.addEventListener('click', (e) => {
    const nav = (e.target as HTMLElement).closest('[data-nav]')?.getAttribute('data-nav');
    if (nav === 'patient-info' || nav === 'prescribe' || nav === 'schedule') {
      const focusId =
        nav === 'patient-info'
          ? 'patient-name'
          : nav === 'prescribe'
            ? 'med-preset-select'
            : 'selected-day';
      updateState({ activeView: nav }, { focusId });
    }
  });
}

let filterDebounce: ReturnType<typeof setTimeout> | undefined;

export function bindPatientInfo(
  root: HTMLElement,
  rerender: (options?: RenderOptions) => void,
): void {
  bindNav(root);

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'patient-name') {
      updateState({ patientName: (t as HTMLInputElement).value }, { render: false });
    } else if (t.id === 'clinic-date') {
      updateState({ clinicDate: (t as HTMLInputElement).value }, { render: false });
    } else if (t.id === 'special-instructions') {
      updateState(
        { specialInstructions: (t as HTMLTextAreaElement).value },
        { render: false },
      );
    }
  });

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'clear-schedule') {
      if (confirm('Clear all schedule data from this device? This cannot be undone.')) {
        updateState({
          patientName: '',
          clinicDate: new Date().toISOString().slice(0, 10),
          specialInstructions: '',
          medications: [],
          checkedItems: {},
        });
        draftPresetId = 'latanoprost';
        draftSlots = slotsForFrequency('once');
        medFilter = '';
        lastAddedMessage = '';
        rerender({ focusId: 'patient-name' });
      }
    }
  });
}

export function bindPrescribeMeds(
  root: HTMLElement,
  rerender: (options?: RenderOptions) => void,
): void {
  bindNav(root);

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'med-filter') {
      medFilter = (t as HTMLInputElement).value;
      const visible = filteredPresets(medFilter);
      if (!visible.some((m) => m.id === draftPresetId) && visible.length > 0) {
        syncDraftFromPreset(visible[0].id);
      }
      clearTimeout(filterDebounce);
      filterDebounce = setTimeout(() => {
        rerender({ focusId: 'med-filter' });
      }, 280);
    } else if (t.id === 'custom-med-name') {
      draftCustomName = (t as HTMLInputElement).value;
    } else if (t.id === 'med-notes') {
      draftNotes = (t as HTMLTextAreaElement).value;
    }
  });

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'med-preset-select') {
      syncDraftFromPreset((t as HTMLSelectElement).value);
      rerender({ focusId: 'med-preset-select' });
    } else if (t.id === 'med-frequency') {
      draftFrequency = (t as HTMLSelectElement).value as Frequency;
      draftSlots = slotsForFrequency(draftFrequency);
      rerender({ focusId: 'med-frequency' });
    } else if (t.id === 'med-eye') {
      draftEye = (t as HTMLSelectElement).value as EyeTarget;
      rerender({ focusId: 'med-eye' });
    } else if ((t as HTMLInputElement).name === 'time-slot') {
      const slotId = (t as HTMLInputElement).dataset.slot!;
      if ((t as HTMLInputElement).checked) {
        if (!draftSlots.includes(slotId)) draftSlots.push(slotId);
      } else {
        draftSlots = draftSlots.filter((s) => s !== slotId);
      }
    }
  });

  root.querySelector('#add-med-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const state = getState();
    const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
    const addAnother = submitter?.value === 'another';
    const presetId =
      (root.querySelector('#med-preset-select') as HTMLSelectElement)?.value ||
      draftPresetId;

    const preset = findPreset(presetId);
    if (!preset) return;

    if (presetId === 'other' && !draftCustomName.trim()) {
      alert('Please enter a name for the custom medication.');
      return;
    }
    if (draftSlots.length === 0) {
      alert('Please select at least one time slot.');
      return;
    }

    const entry: MedicationEntry = {
      id: uid(),
      presetId,
      customName: presetId === 'other' ? draftCustomName.trim() : undefined,
      frequency: preset.isOral ? 'once' : draftFrequency,
      eye: preset.isOral ? 'oral' : draftEye,
      enabledSlots: [...draftSlots],
      notes: draftNotes.trim(),
    };

    const medName = medDisplayName(entry);
    lastAddedMessage = `Added ${medName} to this patient's schedule. You can add more medications below.`;

    updateState({ medications: [...state.medications, entry] });
    draftNotes = '';
    if (presetId === 'other') draftCustomName = '';

    const focusId = addAnother ? 'med-preset-select' : undefined;
    rerender({ focusId });
    if (addAnother) {
      root.querySelector('#med-preset-select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  root.addEventListener('click', (e) => {
    const removeId = (e.target as HTMLElement)
      .closest('[data-remove-med]')
      ?.getAttribute('data-remove-med');
    if (removeId) {
      const s = getState();
      updateState({
        medications: s.medications.filter((m) => m.id !== removeId),
      });
      lastAddedMessage = '';
      rerender({ focusId: 'med-preset-select' });
    }
  });
}
