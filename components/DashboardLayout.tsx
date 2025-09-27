import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AdminSidebar } from './AdminSidebar';
import { DashboardPage } from '../pages/DashboardPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { Page, Transaction, User, TransactionData } from '../types';
import { MenuIcon } from './icons/Icons';

interface DashboardLayoutProps {
  user: User;
  activePage: Page;
  setActivePage: (page: Page) => void;
  onLogout: () => void;
  transactions: Transaction[];
  allTransactions: TransactionData;
  addMultipleTransactions: (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[], clientName: string) => void;
}

const pageTitles: { [key in Page]?: string } = {
  [Page.Dashboard]: 'Dashboard',
  [Page.Transactions]: 'Log Transaction',
  [Page.Reports]: 'Reports',
  [Page.AdminDashboard]: 'Admin Dashboard',
};


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

  const handleSetActivePage = (page: Page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  const pageTitle = pageTitles[activePage] || 'Umvuzo';


  return (
    <div className="relative min-h-screen bg-gray-100 md:flex">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         {user.role === 'admin' ? (
           <AdminSidebar onLogout={onLogout} />
        ) : (
           <Sidebar
              activePage={activePage}
              setActivePage={handleSetActivePage}
              onLogout={onLogout}
            />
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 shadow-md md:hidden">
            <button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
                <MenuIcon className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
            <div className="w-6" /> {/* Spacer */}
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
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