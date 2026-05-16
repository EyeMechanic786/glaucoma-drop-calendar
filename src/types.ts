export type EyeTarget = 'left' | 'right' | 'both' | 'oral';

export type Frequency = 'once' | 'twice' | 'three' | 'four';

export type CapStyle = 'solid' | 'gradient' | 'striped' | 'oral';

export interface MedicationPreset {
  id: string;
  name: string;
  capColor: string;
  capColorSecondary?: string;
  capStyle: CapStyle;
  isOral?: boolean;
  searchTerms: string[];
}

export interface TimeSlotDef {
  id: string;
  label: string;
  shortLabel: string;
  period: string;
  hour: number;
}

export interface MedicationEntry {
  id: string;
  presetId: string;
  customName?: string;
  frequency: Frequency;
  eye: EyeTarget;
  enabledSlots: string[];
  notes: string;
}

export interface AppState {
  patientName: string;
  clinicDate: string;
  specialInstructions: string;
  medications: MedicationEntry[];
  checkedItems: Record<string, boolean>;
  activeView: 'clinic' | 'patient';
  selectedDay: string;
}

export interface ScheduledDose {
  key: string;
  medEntryId: string;
  medName: string;
  capColor: string;
  capColorSecondary?: string;
  capStyle: CapStyle;
  slotId: string;
  slotLabel: string;
  slotShort: string;
  period: string;
  eyeLabel: string;
  notes: string;
  isOral: boolean;
}
