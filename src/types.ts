export type Category =
  | 'Loans'
  | 'Credit Cards'
  | 'Gold Loans'
  | 'Household'
  | 'Other';

export interface Payment {
  id: string;
  name: string;
  category: Category;
  amount: number;
  dueDay: number | null;
  paid: boolean;
  note?: string;
}

export interface MonthData {
  income: number;
  payments: Payment[];
}

export interface AppData {
  months: Record<string, MonthData>;
  darkMode: boolean;
}