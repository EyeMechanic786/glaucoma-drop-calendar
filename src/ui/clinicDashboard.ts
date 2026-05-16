import { MEDICATION_PRESETS, findPreset } from '../data/medications';
import { ALL_TIME_SLOTS, slotsForFrequency } from '../data/timeSlots';
import type { AppState, EyeTarget, Frequency, MedicationEntry } from '../types';
import { capBadgeHtml } from './capBadge';

let draftPresetId = 'latanoprost';
let draftCustomName = '';
let draftFrequency: Frequency = 'once';
let draftEye: EyeTarget = 'both';
let draftSlots = slotsForFrequency('once');
let draftNotes = '';
let medSearch = '';

function uid(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

function renderMedSearchOptions(): string {
  const list = filteredPresets(medSearch);
  return list
    .map((m) => {
      const oral = m.isOral ? ' — ORAL TABLET' : '';
      const selected = m.id === draftPresetId ? ' selected' : '';
      return `<option value="${m.id}"${selected}>${m.name}${oral}</option>`;
    })
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
    return `<p class="empty-hint">No medications added yet. Use the form above to build the schedule.</p>`;
  }

  return `<ul class="med-list" role="list">
    ${state.medications
      .map((entry) => {
        const preset = findPreset(entry.presetId);
        const name =
          entry.presetId === 'other' && entry.customName
            ? entry.customName
            : preset?.name ?? 'Medication';
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

export function renderClinicDashboard(state: AppState): string {
  const preset = findPreset(draftPresetId);
  const showCustom = draftPresetId === 'other';
  const isOralPreset = preset?.isOral;

  return `
    <section class="panel clinic-panel" aria-labelledby="clinic-heading">
      <header class="panel__header">
        <h2 id="clinic-heading">Clinic Input Dashboard</h2>
        <p class="panel__sub">Configure medications and times for the patient schedule.</p>
      </header>

      <fieldset class="patient-meta">
        <legend>Patient &amp; visit details</legend>
        <div class="field-grid">
          <label class="field">
            <span class="field__label">Patient name</span>
            <input type="text" id="patient-name" value="${escapeAttr(state.patientName)}"
              placeholder="e.g., Jane Smith" autocomplete="name" />
          </label>
          <label class="field">
            <span class="field__label">Clinic date</span>
            <input type="date" id="clinic-date" value="${escapeAttr(state.clinicDate)}" />
          </label>
        </div>
        <label class="field">
          <span class="field__label">Special instructions (schedule header)</span>
          <textarea id="special-instructions" rows="2"
            placeholder="e.g., Return in 4 weeks. Call if redness or pain.">${escapeHtml(state.specialInstructions)}</textarea>
        </label>
      </fieldset>

      <form class="med-form" id="add-med-form" aria-labelledby="add-med-heading">
        <h3 id="add-med-heading">Add medication</h3>

        <div class="med-search-row">
          <label class="field field--grow">
            <span class="field__label">Search or select medication</span>
            <input type="search" id="med-search" list="med-preset-list"
              value="${escapeAttr(medSearch || preset?.name || '')}"
              placeholder="Type to search (e.g., Latanoprost)" autocomplete="off" />
            <datalist id="med-preset-list">${renderMedSearchOptions()}</datalist>
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
          <textarea id="med-notes" rows="2"
            placeholder="e.g., Keep in fridge until opened">${escapeHtml(draftNotes)}</textarea>
        </label>

        <button type="submit" class="btn btn--primary">Add to schedule</button>
      </form>

      <section class="added-meds" aria-labelledby="added-meds-heading">
        <h3 id="added-meds-heading">Current schedule (${state.medications.length})</h3>
        ${renderMedList(state)}
      </section>

      <div class="clinic-actions">
        <button type="button" class="btn btn--primary btn--lg" id="go-patient-view">
          Open patient schedule view
        </button>
        <button type="button" class="btn btn--secondary" id="clear-schedule">
          Clear all data
        </button>
      </div>
    </section>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function bindClinicDashboard(
  root: HTMLElement,
  getState: () => AppState,
  onChange: (partial: Partial<AppState> | ((s: AppState) => AppState)) => void,
  onRerender: () => void,
): void {
  const syncDraftFromPreset = (presetId: string) => {
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
    medSearch = preset?.name ?? '';
  };

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'patient-name') {
      onChange({ patientName: (t as HTMLInputElement).value });
    } else if (t.id === 'clinic-date') {
      onChange({ clinicDate: (t as HTMLInputElement).value });
    } else if (t.id === 'special-instructions') {
      onChange({ specialInstructions: (t as HTMLTextAreaElement).value });
    } else if (t.id === 'med-search') {
      medSearch = (t as HTMLInputElement).value;
      const match = MEDICATION_PRESETS.find(
        (m) => m.name.toLowerCase() === medSearch.toLowerCase(),
      );
      if (match) syncDraftFromPreset(match.id);
      onRerender();
    } else if (t.id === 'custom-med-name') {
      draftCustomName = (t as HTMLInputElement).value;
    } else if (t.id === 'med-notes') {
      draftNotes = (t as HTMLTextAreaElement).value;
    }
  });

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'med-frequency') {
      draftFrequency = (t as HTMLSelectElement).value as Frequency;
      draftSlots = slotsForFrequency(draftFrequency);
      onRerender();
    } else if (t.id === 'med-eye') {
      draftEye = (t as HTMLSelectElement).value as EyeTarget;
      onRerender();
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
    const searchVal = (root.querySelector('#med-search') as HTMLInputElement)?.value ?? '';
    let presetId = draftPresetId;
    const byName = MEDICATION_PRESETS.find(
      (m) => m.name.toLowerCase() === searchVal.trim().toLowerCase(),
    );
    if (byName) presetId = byName.id;

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

    onChange({ medications: [...state.medications, entry] });
    draftNotes = '';
    if (presetId === 'other') draftCustomName = '';
    onRerender();
  });

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const removeId = t.closest('[data-remove-med]')?.getAttribute('data-remove-med');
    if (removeId) {
      const state = getState();
      onChange({ medications: state.medications.filter((m) => m.id !== removeId) });
      onRerender();
      return;
    }
    if (t.id === 'go-patient-view') {
      onChange({ activeView: 'patient' });
      onRerender();
    }
    if (t.id === 'clear-schedule') {
      if (confirm('Clear all schedule data from this device? This cannot be undone.')) {
        onChange({
          patientName: '',
          clinicDate: new Date().toISOString().slice(0, 10),
          specialInstructions: '',
          medications: [],
          checkedItems: {},
        });
        draftPresetId = 'latanoprost';
        draftSlots = slotsForFrequency('once');
        medSearch = '';
        onRerender();
      }
    }
  });
}
