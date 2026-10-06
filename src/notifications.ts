import { LocalNotifications } from '@capacitor/local-notifications';
import type { Payment } from './types';

export async function setupNotifications() {
  try {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch {
    // Browser preview or unsupported environment.
  }
}

export async function schedulePaymentReminder(payment: Payment, year: number, month: number) {
  if (!payment.dueDay || payment.amount <= 0 || payment.paid) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId(payment.id, year, month) }] });

    const scheduledDate = new Date(year, month - 1, payment.dueDay, 9, 0, 0);
    const now = new Date();
    if (scheduledDate <= now) return;

    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId(payment.id, year, month),
        title: 'Payment reminder',
        body: `${payment.name} of ₹${payment.amount.toLocaleString('en-IN')} is due today.`,
        schedule: { at: scheduledDate },
        extra: { paymentId: payment.id }
      }]
    });
  } catch {
    // Safe no-op in browser.
  }
}

export async function cancelPaymentReminder(payment: Payment, year: number, month: number) {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId(payment.id, year, month) }]
    });
  } catch {}
}

function notificationId(id: string, year: number, month: number) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(hash) + year * 100 + month;
}