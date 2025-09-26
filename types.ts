export enum Page {
  Dashboard = 'dashboard',
  Transactions = 'transactions',
  Reports = 'reports',
  AdminDashboard = 'admin-dashboard',
}

export type User = {
  name: string;
  email: string;
  role: 'admin' | 'rep';
};

export interface Material {
  type: string;
  price: number;
}

export interface RateSheet {
  [key: string]: Material[];
}

export interface Transaction {
  id: string;
  repName: string;
  clientName: string;
  material: string;
  weight: number;
  pricePerKg: number;
  total: number;
  date: string;
}

export type TransactionData = {
  [email: string]: Transaction[];
};
