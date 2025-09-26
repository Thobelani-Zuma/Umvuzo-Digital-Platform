import React from 'react';
import { Sidebar } from './Sidebar';
import { AdminSidebar } from './AdminSidebar';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { Page, Transaction, User, TransactionData } from '../types';

interface DashboardLayoutProps {
  user: User;
  activePage: Page;
  setActivePage: (page: Page) => void;
  onLogout: () => void;
  transactions: Transaction[];
  allTransactions: TransactionData;
  addMultipleTransactions: (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName'>[], clientName: string) => void;
}

export function DashboardLayout({ user, activePage, setActivePage, onLogout, transactions, allTransactions, addMultipleTransactions }: DashboardLayoutProps) {
  const renderRepPage = () => {
    switch (activePage) {
      case Page.Dashboard:
        return <DashboardPage transactions={transactions} />;
      case Page.Transactions:
        return <TransactionsPage repName={user.name} addMultipleTransactions={addMultipleTransactions} />;
      case Page.Reports:
        return <ReportsPage transactions={transactions} />;
      default:
        return <DashboardPage transactions={transactions} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {user.role === 'admin' ? (
         <AdminSidebar onLogout={onLogout} />
      ) : (
         <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            onLogout={onLogout}
          />
      )}
      <main className="flex-1 overflow-y-auto p-8">
        {user.role === 'admin' ? (
          <AdminDashboardPage allTransactions={allTransactions} />
        ) : (
          renderRepPage()
        )}
      </main>
    </div>
  );
}
