import { findPreset } from './data/medications';
import { getSlot } from './data/timeSlots';
import type { AppState, MedicationEntry, ScheduledDose } from './types';

const EYE_LABELS: Record<string, string> = {
  left: 'LEFT EYE ONLY',
  right: 'RIGHT EYE ONLY',
  both: 'BOTH EYES',
  oral: 'ORAL — BY MOUTH',
};

export function medDisplayName(entry: MedicationEntry): string {
  if (entry.presetId === 'other' && entry.customName?.trim()) {
    return entry.customName.trim();
  }
  return findPreset(entry.presetId)?.name ?? 'Unknown medication';
}

export function eyeLabel(eye: string): string {
  return EYE_LABELS[eye] ?? eye.toUpperCase();
}

export function buildDosesForDay(state: AppState, _dateIso: string): ScheduledDose[] {
  const doses: ScheduledDose[] = [];

  for (const entry of state.medications) {
    const preset = findPreset(entry.presetId);
    const name = medDisplayName(entry);
    const isOral = preset?.isOral ?? entry.eye === 'oral';

    for (const slotId of entry.enabledSlots) {
      const slot = getSlot(slotId);
      if (!slot) continue;

      doses.push({
        key: `${entry.id}-${slotId}`,
        medEntryId: entry.id,
        medName: name,
        capColor: preset?.capColor ?? '#4b5563',
        capColorSecondary: preset?.capColorSecondary,
        capStyle: preset?.capStyle ?? 'solid',
        slotId,
        slotLabel: slot.label,
        slotShort: slot.shortLabel,
        period: slot.period,
        eyeLabel: eyeLabel(entry.eye),
        notes: entry.notes,
        isOral,
      });
    }
  }

  return doses.sort((a, b) => {
    const ha = getSlot(a.slotId)?.hour ?? 0;
    const hb = getSlot(b.slotId)?.hour ?? 0;
    if (ha !== hb) return ha - hb;
    return a.medName.localeCompare(b.medName);
  });
}

export function checkKey(dateIso: string, doseKey: string): string {
  return `${dateIso}::${doseKey}`;
}

export function getWeekDates(anchorIso: string): { iso: string; label: string; short: string }[] {
  const anchor = new Date(anchorIso + 'T12:00:00');
  const day = anchor.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMonday);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dateNum = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    return { iso, label: days[i], short: `${shorts[i]} ${month} ${dateNum}` };
  });
}

export function formatClinicDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
