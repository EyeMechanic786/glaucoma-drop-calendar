import type { MedicationPreset } from '../types';

export const MEDICATION_PRESETS: MedicationPreset[] = [
  {
    id: 'latanoprost',
    name: 'Latanoprost',
    capColor: '#0d9488',
    capStyle: 'solid',
    searchTerms: ['latanoprost', 'xalatan'],
  },
  {
    id: 'timolol',
    name: 'Timolol',
    capColor: '#eab308',
    capColorSecondary: '#2563eb',
    capStyle: 'gradient',
    searchTerms: ['timolol', 'timoptic'],
  },
  {
    id: 'brinzolamide',
    name: 'Brinzolamide',
    capColor: '#ea580c',
    capStyle: 'solid',
    searchTerms: ['brinzolamide', 'azopt'],
  },
  {
    id: 'cosopt',
    name: 'CoSopt',
    capColor: '#1e3a8a',
    capColorSecondary: '#ffffff',
    capStyle: 'gradient',
    searchTerms: ['cosopt', 'dorzolamide timolol'],
  },
  {
    id: 'travoprost',
    name: 'Travoprost',
    capColor: '#14b8a6',
    capColorSecondary: '#0d9488',
    capStyle: 'gradient',
    searchTerms: ['travoprost', 'travatan'],
  },
  {
    id: 'iopidine',
    name: 'Iopidine',
    capColor: '#7c3aed',
    capStyle: 'solid',
    searchTerms: ['iopidine', 'apraclonidine'],
  },
  {
    id: 'alphagan',
    name: 'Alphagan',
    capColor: '#6d28d9',
    capStyle: 'solid',
    searchTerms: ['alphagan', 'brimonidine'],
  },
  {
    id: 'bimatoprost',
    name: 'Bimatoprost',
    capColor: '#6b7280',
    capColorSecondary: '#374151',
    capStyle: 'striped',
    searchTerms: ['bimatoprost', 'lumigan'],
  },
  {
    id: 'saflutan',
    name: 'Saflutan',
    capColor: '#7dd3fc',
    capColorSecondary: '#0d9488',
    capStyle: 'gradient',
    searchTerms: ['saflutan', 'tafluprost'],
  },
  {
    id: 'acetazolamide',
    name: 'Acetazolamide 250mg Tablets',
    capColor: '#1f2937',
    capStyle: 'oral',
    isOral: true,
    searchTerms: ['acetazolamide', 'diamox', 'tablet', 'oral'],
  },
  {
    id: 'other',
    name: 'Other / Custom Medication',
    capColor: '#4b5563',
    capStyle: 'solid',
    searchTerms: ['other', 'custom'],
  },
];

export function findPreset(id: string): MedicationPreset | undefined {
  return MEDICATION_PRESETS.find((m) => m.id === id);
}
