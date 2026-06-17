import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Page, Transaction, User, TransactionData } from './types';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  
  const [transactionsByUser, setTransactionsByUser] = useState<TransactionData>({});

  const handleLogin = (email: string) => {
    if (email.toLowerCase() === 'admin@umvuzo.com') {
        setCurrentUser({ name: 'Admin', email, role: 'admin' });
        setActivePage(Page.AdminDashboard);
    } else {
        const name = email.split('@')[0].replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        // Ensure user exists in the transaction data
        if (!transactionsByUser[email]) {
            setTransactionsByUser(prev => ({...prev, [email]: []}));
        }
        setCurrentUser({ name, email, role: 'rep' });
        setActivePage(Page.Dashboard);
    }
    setIsAuthenticated(true);
  };

  const handleRegister = (name: string, email: string) => {
    if (transactionsByUser[email]) {
      return false;
    }
    setTransactionsByUser(prev => ({ ...prev, [email]: [] }));
    setCurrentUser({ name, email, role: 'rep' });
    setIsAuthenticated(true);
    setActivePage(Page.Dashboard);
    return true;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };
  
  const addMultipleTransactions = (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName'>[], clientName: string) => {
      if (!currentUser || currentUser.role !== 'rep') return;

      const newTransactions = items.map(item => ({
          ...item,
          id: new Date().getTime().toString() + Math.random(),
          date: new Date().toISOString(),
          repName: currentUser.name,
          clientName: clientName,
      }));

      setTransactionsByUser(prev => {
          const userTransactions = prev[currentUser.email] || [];
          return {
              ...prev,
              [currentUser.email]: [...newTransactions, ...userTransactions]
          };
      });
  };

  const userTransactions = currentUser && currentUser.role === 'rep' ? transactionsByUser[currentUser.email] || [] : [];

  return (
    <div className="bg-gray-100 min-h-screen">
      {isAuthenticated && currentUser ? (
        <DashboardLayout
          user={currentUser}
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={handleLogout}
          transactions={userTransactions}
          allTransactions={transactionsByUser}
          addMultipleTransactions={addMultipleTransactions}
        />
      ) : (
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}