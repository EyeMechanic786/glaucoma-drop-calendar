import { getSlot } from './data/timeSlots';
import { buildDosesForDay, isDayInSchedule } from './schedule';
import { getState } from './state';
import type { AppState } from './types';

export const REMINDER_LEAD_MINUTES = 15;
const TICK_MS = 30_000;
const NOTIFIED_KEY = 'glaucoma-drop-reminders-sent';

interface DoseReminder {
  key: string;
  dateIso: string;
  slotId: string;
  slotLabel: string;
  doseTime: Date;
  reminderAt: Date;
  medNames: string[];
}

function localTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slotDateTime(dateIso: string, hour: number, minute = 0): Date {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

function loadNotified(): Record<string, true> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, true>) : {};
  } catch {
    return {};
  }
}

function saveNotified(map: Record<string, true>): void {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

function pruneNotified(map: Record<string, true>, keepFromIso: string): Record<string, true> {
  const pruned: Record<string, true> = {};
  for (const key of Object.keys(map)) {
    if (key >= keepFromIso) pruned[key] = true;
  }
  return pruned;
}

export function clearReminderHistory(): void {
  localStorage.removeItem(NOTIFIED_KEY);
}

function buildRemindersForDay(state: AppState, dateIso: string): DoseReminder[] {
  if (!isDayInSchedule(state, dateIso)) return [];

  const bySlot = new Map<string, DoseReminder>();

  for (const dose of buildDosesForDay(state, dateIso)) {
    const slot = getSlot(dose.slotId);
    if (!slot) continue;

    const key = `${dateIso}::${dose.slotId}`;
    let entry = bySlot.get(key);
    if (!entry) {
      const doseTime = slotDateTime(dateIso, slot.hour);
      const reminderAt = new Date(doseTime);
      reminderAt.setMinutes(reminderAt.getMinutes() - REMINDER_LEAD_MINUTES);
      entry = {
        key,
        dateIso,
        slotId: dose.slotId,
        slotLabel: slot.label,
        doseTime,
        reminderAt,
        medNames: [],
      };
      bySlot.set(key, entry);
    }
    const medLine = `${dose.medName} (${dose.eyeLabel})`;
    if (!entry.medNames.includes(medLine)) entry.medNames.push(medLine);
  }

  return Array.from(bySlot.values()).sort(
    (a, b) => a.reminderAt.getTime() - b.reminderAt.getTime(),
  );
}

export function getNextReminder(state: AppState): DoseReminder | null {
  const today = localTodayIso();
  const now = Date.now();
  for (const r of buildRemindersForDay(state, today)) {
    if (r.doseTime.getTime() > now) return r;
  }
  return null;
}

export function formatReminderClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function reminderStatusMessage(state: AppState): string {
  if (!state.remindersEnabled) {
    return 'Off — turn on to get an alert 15 minutes before each scheduled dose.';
  }
  if (!('Notification' in window)) {
    return 'This browser does not support notifications.';
  }
  if (Notification.permission === 'denied') {
    return 'Notifications are blocked. Enable them in your browser or phone settings.';
  }
  if (Notification.permission === 'default') {
    return 'Allow notifications when prompted to receive drop reminders.';
  }
  if (state.medications.length === 0) {
    return 'Add medications to your schedule to receive reminders.';
  }
  const next = getNextReminder(state);
  if (!next) {
    return 'Reminders on. No more doses scheduled for today.';
  }
  return `Reminders on. Next alert at ${formatReminderClock(next.reminderAt)} (${REMINDER_LEAD_MINUTES} min before ${formatReminderClock(next.doseTime)}).`;
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function reminderBody(reminder: DoseReminder): string {
  return `Due at ${formatReminderClock(reminder.doseTime)} — ${reminder.medNames.join(' · ')}`;
}

async function showReminderNotification(reminder: DoseReminder): Promise<void> {
  const title = `Eye drops in ${REMINDER_LEAD_MINUTES} minutes`;
  const options: NotificationOptions = {
    body: reminderBody(reminder),
    tag: reminder.key,
    icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    badge: `${import.meta.env.BASE_URL}pwa-192x192.png`,
    requireInteraction: true,
  };

  if (Notification.permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through */
  }

  new Notification(title, options);
}

function showInAppReminder(reminder: DoseReminder): void {
  const existing = document.getElementById('drop-reminder-toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.id = 'drop-reminder-toast';
  toast.className = 'drop-reminder-toast no-print';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="drop-reminder-toast__body">
      <strong>Eye drops in ${REMINDER_LEAD_MINUTES} minutes</strong>
      <p>${reminder.slotLabel}</p>
      <p class="drop-reminder-toast__meds">${reminder.medNames.map((m) => m.replace(/</g, '&lt;')).join('<br />')}</p>
    </div>
    <button type="button" class="drop-reminder-toast__dismiss" aria-label="Dismiss reminder">×</button>
  `;
  document.body.appendChild(toast);
  toast.querySelector('.drop-reminder-toast__dismiss')?.addEventListener('click', () => toast.remove());
}

function checkReminders(): void {
  const state = getState();
  if (!state.remindersEnabled || state.medications.length === 0) return;

  const today = localTodayIso();
  let notified = pruneNotified(loadNotified(), today);
  const now = Date.now();

  for (const reminder of buildRemindersForDay(state, today)) {
    if (notified[reminder.key]) continue;

    const start = reminder.reminderAt.getTime();
    const end = reminder.doseTime.getTime();
    if (now >= start && now < end) {
      notified[reminder.key] = true;
      showInAppReminder(reminder);
      if ('Notification' in window && Notification.permission === 'granted') {
        void showReminderNotification(reminder);
      }
    }
  }

  saveNotified(notified);
}

let tickId: ReturnType<typeof setInterval> | undefined;

export function initReminders(): void {
  if (tickId) clearInterval(tickId);
  tickId = setInterval(checkReminders, TICK_MS);
  checkReminders();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkReminders();
  });
}
