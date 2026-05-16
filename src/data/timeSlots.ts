import type { Frequency, TimeSlotDef } from '../types';

export const ALL_TIME_SLOTS: TimeSlotDef[] = [
  { id: 'morning', label: 'Morning — 8:00 AM', shortLabel: 'MORNING', period: '8:00 AM', hour: 8 },
  { id: 'noon', label: 'Noon — 12:00 PM', shortLabel: 'NOON', period: '12:00 PM', hour: 12 },
  { id: 'evening', label: 'Evening — 6:00 PM', shortLabel: 'EVENING', period: '6:00 PM', hour: 18 },
  { id: 'night', label: 'Night — 10:00 PM', shortLabel: 'NIGHT', period: '10:00 PM', hour: 22 },
];

const FREQUENCY_SLOTS: Record<Frequency, string[]> = {
  once: ['morning'],
  twice: ['morning', 'evening'],
  three: ['morning', 'noon', 'evening'],
  four: ['morning', 'noon', 'evening', 'night'],
};

export function slotsForFrequency(freq: Frequency): string[] {
  return [...FREQUENCY_SLOTS[freq]];
}

export function getSlot(id: string): TimeSlotDef | undefined {
  return ALL_TIME_SLOTS.find((s) => s.id === id);
}
