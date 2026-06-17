import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AdminSidebar } from './AdminSidebar';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { Page, Transaction, User, TransactionData } from '../types';
import { LogoIcon, MenuIcon } from './icons/Icons';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
         <AdminSidebar onLogout={onLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      ) : (
         <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            onLogout={onLogout}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between bg-white shadow-md p-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-brand-orange" />
            <h1 className="text-xl font-bold text-gray-800">Umvuzo</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
            <MenuIcon className="h-6 w-6 text-gray-700" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {user.role === 'admin' ? (
            <AdminDashboardPage allTransactions={allTransactions} />
          ) : (
            renderRepPage()
          )}
        </main>
      </div>
    </div>
  );
}