import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Page, Transaction, User, TransactionData } from './types';
import { auth, db } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [transactionsByUser, setTransactionsByUser] = useState<TransactionData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const isAdmin = user.email.toLowerCase() === 'media@isphepho.co.za';
        const name = user.displayName || user.email.split('@')[0].replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        
        setCurrentUser({
          name: name,
          email: user.email,
          role: isAdmin ? 'admin' : 'rep',
        });
        setActivePage(isAdmin ? Page.AdminDashboard : Page.Dashboard);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setTransactionsByUser({});
      return;
    }

    const transactionsCol = collection(db, 'transactions');
    let q;
    if (currentUser.role === 'admin') {
      q = query(transactionsCol, orderBy('date', 'desc'));
    } else {
      q = query(transactionsCol, where('userEmail', '==', currentUser.email), orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        // Make sure to include the document ID
        allTransactions.push({ ...doc.data(), id: doc.id } as Transaction);
      });

      if (currentUser.role === 'admin') {
        const groupedByEmail = allTransactions.reduce((acc, tx) => {
          const email = tx.userEmail || 'unknown';
          if (!acc[email]) {
            acc[email] = [];
          }
          acc[email].push(tx);
          return acc;
        }, {} as TransactionData);
        setTransactionsByUser(groupedByEmail);
      } else {
        setTransactionsByUser({ [currentUser.email]: allTransactions });
      }
    }, (error) => {
      console.error("Error fetching transactions: ", error);
    });

    return () => unsubscribe();
  }, [currentUser]);


  const handleLogin = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleRegister = async (name: string, email: string, password: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // The onAuthStateChanged listener handles logins and session persistence,
    // but it can experience a race condition with updateProfile on new registrations,
    // potentially using the email to create a temporary name.
    // To ensure the UI immediately reflects the correct registered name, we manually
    // set the current user state here. This state will be used until the next
    // refresh or login, at which point onAuthStateChanged will take over
    // with the persisted displayName from the user's profile.
    const user = userCredential.user;
    const isAdmin = user.email!.toLowerCase() === 'media@isphepho.co.za';
    
    setCurrentUser({
      name: name, // Use the name from the registration form directly.
      email: user.email!,
      role: isAdmin ? 'admin' : 'rep',
    });

    setActivePage(isAdmin ? Page.AdminDashboard : Page.Dashboard);
  };

  const handleLogout = async (): Promise<void> => {
    await signOut(auth);
  };
  
  const addMultipleTransactions = async (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[], clientName: string) => {
      if (!currentUser || currentUser.role !== 'rep') return;

      const transactionsToAdd = items.map(item => ({
          ...item,
          date: new Date().toISOString(),
          repName: currentUser.name,
          clientName: clientName,
          userEmail: currentUser.email,
      }));
      
      const transactionCollection = collection(db, 'transactions');
      for (const tx of transactionsToAdd) {
        await addDoc(transactionCollection, tx);
      }
  };

  const userTransactions = currentUser && currentUser.role === 'rep' ? transactionsByUser[currentUser.email] || [] : [];
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="text-center">
                <p className="text-xl font-semibold text-gray-700">Loading...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {currentUser ? (
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