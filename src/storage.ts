import type { AppData, MonthData, Payment } from './types';

const KEY = 'my-finance-tracker-v2';
const OLD_KEY = 'my-finance-tracker-v1';

function makePayment(name: string, category: Payment['category'], amount: number, dueDay: number | null): Payment {
  return { id: crypto.randomUUID(), name, category, amount, dueDay, paid: false };
}

function normalizePayment(value: Partial<Payment> & { id?: string }): Payment {
  return {
    id: value.id ?? crypto.randomUUID(),
    name: String(value.name ?? 'Payment'),
    category: (value.category ?? 'Other') as Payment['category'],
    amount: Number(value.amount) || 0,
    dueDay: value.dueDay == null ? null : Number(value.dueDay),
    paid: Boolean(value.paid),
    paidDate: value.paidDate,
    note: value.note
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      const months: Record<string, MonthData> = {};
      for (const [key, value] of Object.entries(parsed.months ?? {})) {
        const oldMonth = value as Partial<MonthData>;
        const payments = Array.isArray(oldMonth.payments) ? oldMonth.payments.map(normalizePayment) : [];
        // One-time migration for older app data: add the new driver-payment and maintenance rows
        // without replacing anything the user already entered.
        const ensureDefault = (name: string, category: Payment['category'], amount: number, dueDay: number | null) => {
          if (!payments.some(p => p.name === name)) payments.push(makePayment(name, category, amount, dueDay));
        };
        ensureDefault('Car 2 Driver Payment', 'Driver Payments', 17000, 5);
        ensureDefault('Car 4 Driver Payment', 'Driver Payments', 16000, 2);
        ensureDefault('Car 1 Maintenance', 'Maintenance', 5000, null);
        ensureDefault('Car 2 Maintenance', 'Maintenance', 5000, null);
        ensureDefault('Car 3 Maintenance', 'Maintenance', 5000, null);
        ensureDefault('Car 4 Maintenance', 'Maintenance', 5000, null);
        months[key] = {
          income: Number(oldMonth.income) || 0,
          incomeReceived: oldMonth.incomeReceived ?? (Number(oldMonth.income) || 0) > 0,
          credits: Array.isArray(oldMonth.credits) ? oldMonth.credits : [],
          payments
        };
      }
      return { months, darkMode: Boolean(parsed.darkMode) };
    }
  } catch {
    // Fall through to defaults.
  }
  return { months: {}, darkMode: false };
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function defaultMonth(): MonthData {
  return {
    income: 0,
    incomeReceived: false,
    credits: [],
    payments: [
      makePayment('Car 1 Loan', 'Loans', 11000, 10),
      makePayment('Car 2 Loan', 'Loans', 12500, 13),
      makePayment('Car 3 Loan', 'Loans', 12500, 30),
      makePayment('Car 2 Driver Payment', 'Driver Payments', 17000, 5),
      makePayment('Car 4 Driver Payment', 'Driver Payments', 16000, 2),
      makePayment('HDFC Credit Card', 'Credit Cards', 0, 2),
      makePayment('Axis Credit Card', 'Credit Cards', 0, 12),
      makePayment('Gold Loan 1', 'Gold Loans', 0, null),
      makePayment('Gold Loan 2', 'Gold Loans', 0, null),
      makePayment('Car 1 Maintenance', 'Maintenance', 5000, null),
      makePayment('Car 2 Maintenance', 'Maintenance', 5000, null),
      makePayment('Car 3 Maintenance', 'Maintenance', 5000, null),
      makePayment('Car 4 Maintenance', 'Maintenance', 5000, null)
    ]
  };
}
