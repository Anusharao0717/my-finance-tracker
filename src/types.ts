export type Category =
  | 'Loans'
  | 'Driver Payments'
  | 'Credit Cards'
  | 'Gold Loans'
  | 'Maintenance'
  | 'Insurance'
  | 'Household'
  | 'Other';

export interface Payment {
  id: string;
  name: string;
  category: Category;
  amount: number;
  dueDay: number | null;
  paid: boolean;
  paidDate?: string;
  note?: string;
}

export interface Credit {
  id: string;
  name: string;
  amount: number;
  received: boolean;
  date?: string;
  note?: string;
}

export interface MonthData {
  income: number;
  incomeReceived: boolean;
  credits: Credit[];
  payments: Payment[];
}

export interface AppData {
  months: Record<string, MonthData>;
  darkMode: boolean;
}
