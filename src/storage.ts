import type { AppData, MonthData } from './types';

const KEY = 'my-finance-tracker-v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppData;
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
    payments: [
      { id: crypto.randomUUID(), name: 'Car 1 Loan', category: 'Loans', amount: 11000, dueDay: 10, paid: false },
      { id: crypto.randomUUID(), name: 'Car 2 Loan', category: 'Loans', amount: 12500, dueDay: 13, paid: false },
      { id: crypto.randomUUID(), name: 'Car 3 Loan', category: 'Loans', amount: 12500, dueDay: 30, paid: false },
      { id: crypto.randomUUID(), name: 'HDFC Credit Card', category: 'Credit Cards', amount: 0, dueDay: 2, paid: false },
      { id: crypto.randomUUID(), name: 'Axis Credit Card', category: 'Credit Cards', amount: 0, dueDay: 12, paid: false },
      { id: crypto.randomUUID(), name: 'Gold Loan 1', category: 'Gold Loans', amount: 0, dueDay: null, paid: false },
      { id: crypto.randomUUID(), name: 'Gold Loan 2', category: 'Gold Loans', amount: 0, dueDay: null, paid: false }
    ]
  };
}