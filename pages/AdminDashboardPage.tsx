import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TransactionData } from '../types';
import { PayoutIcon, WeightIcon, UsersIcon, SearchIcon, ReportIcon, CashIcon } from '../components/icons/Icons';
import { generateReportPDF } from '../services/reportService';
import { db } from '../services/firebase';
import { RATE_SHEETS } from '../constants';


const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
        <div className={`flex items-center justify-center h-16 w-16 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-lg text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export function AdminDashboardPage({ allTransactions }: { allTransactions: TransactionData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceMessage, setBalanceMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedRateSheet, setSelectedRateSheet] = useState('All');

  useEffect(() => {
    const fetchBalances = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const balanceDocRef = db.collection('dailyBalances').doc(todayStr);
      try {
        const docSnap = await balanceDocRef.get();
        if (docSnap.exists) {
          const data = docSnap.data()!;
          setOpeningBalance(data.openingBalance?.toString() || '');
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };
    fetchBalances();
  }, []);

  const pageTransactions = useMemo(() => {
    const allTxs = Object.values(allTransactions).flat();
    if (selectedRateSheet === 'All') {
      return allTxs;
    }
    return allTxs.filter(tx => tx.rateSheet === selectedRateSheet);
  }, [allTransactions, selectedRateSheet]);

  const { totalPayout, totalWeight, repCount, repPerformanceData, todaysPayout } = useMemo(() => {
    const allTxs = pageTransactions;
    
    const payout = allTxs.reduce((sum, tx) => sum + tx.total, 0);
    const weight = allTxs.reduce((sum, tx) => sum + tx.weight, 0);
    
    const reps = new Set(allTxs.map(tx => tx.repName));
    
    const groupedByEmail = allTxs.reduce((acc, tx) => {
        const email = tx.userEmail || 'unknown';
        if (!acc[email]) {
            acc[email] = [];
        }
        acc[email].push(tx);
        return acc;
    }, {} as TransactionData);

    const performance = Object.entries(groupedByEmail).map(([email, txs]) => {
        const repName = txs.length > 0 ? txs[0].repName : email.split('@')[0].replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        const totalWeight = txs.reduce((sum, tx) => sum + tx.weight, 0);
        return { name: repName, kg: parseFloat(totalWeight.toFixed(2)) };
    }).sort((a,b) => b.kg - a.kg);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysTxs = allTxs.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= todayStart && txDate <= todayEnd;
    });
    const dailyPayout = todaysTxs.reduce((sum, tx) => sum + tx.total, 0);

    return {
      totalPayout: payout,
      totalWeight: weight,
      repCount: reps.size,
      repPerformanceData: performance,
      todaysPayout: dailyPayout,
    };
  }, [pageTransactions]);

  const calculatedClosingBalance = parseFloat(openingBalance || '0') - todaysPayout;

  const handleSaveBalances = async () => {
    setBalanceMessage(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const ob = parseFloat(openingBalance);

    if (isNaN(ob)) {
      setBalanceMessage({ text: 'Please enter a valid number for the opening balance.', type: 'error' });
      setTimeout(() => setBalanceMessage(null), 3000);
      return;
    }

    const finalClosingBalance = ob - todaysPayout;

    const balanceDocRef = db.collection('dailyBalances').doc(todayStr);
    try {
      await balanceDocRef.set({ 
        openingBalance: ob, 
        closingBalance: finalClosingBalance,
        date: todayStr 
      }, { merge: true });
      setBalanceMessage({ text: 'Opening Balance saved successfully!', type: 'success' });
      setTimeout(() => setBalanceMessage(null), 3000);
    } catch (error) {
      console.error("Error saving balances: ", error);
      setBalanceMessage({ text: 'Failed to save balance. Check console for details.', type: 'error' });
      setTimeout(() => setBalanceMessage(null), 5000);
    }
  };

  const filteredTransactions = useMemo(() => {
    const sortedTransactions = pageTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!searchTerm) return sortedTransactions;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedTransactions.filter(tx =>
      tx.repName.toLowerCase().includes(lowercasedFilter) ||
      tx.clientName.toLowerCase().includes(lowercasedFilter) ||
      tx.material.toLowerCase().includes(lowercasedFilter)
    );
  }, [pageTransactions, searchTerm]);
  
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  }, [filteredTransactions]);

  const handleDownloadReport = () => {
    generateReportPDF('admin', filteredTransactions, {
        opening: parseFloat(openingBalance || '0'),
        closing: calculatedClosingBalance,
    }, selectedRateSheet);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
         <div className="flex items-center gap-4">
            <select
              id="admin-rate-sheet-filter"
              value={selectedRateSheet}
              onChange={(e) => setSelectedRateSheet(e.target.value)}
              className="py-2 px-4 border rounded-lg focus:ring-brand-orange focus:border-brand-orange bg-white shadow-sm"
            >
              <option value="All">All Rate Sheets</option>
              {Object.keys(RATE_SHEETS).map(sheet => (
                <option key={sheet} value={sheet}>{sheet}</option>
              ))}
            </select>
            <button
              onClick={handleDownloadReport}
              className="flex items-center justify-center gap-2 py-2 px-4 font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90"
            >
              <ReportIcon className="h-5 w-5" />
              Download Filtered Report
            </button>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Filtered Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
            icon={<UsersIcon className="h-8 w-8 text-white"/>} 
            title="Active Reps"
            value={repCount.toLocaleString()}
            color="bg-brand-green"
        />
        <StatCard 
            icon={<WeightIcon className="h-8 w-8 text-white"/>} 
            title="Total Weight (kg)"
            value={totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            color="bg-orange-400"
        />
        <StatCard 
            icon={<PayoutIcon className="h-8 w-8 text-white"/>}
            title="Total Payout"
            value={`R ${totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="bg-brand-orange"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Daily Financials Card */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Today's Financials</h2>
            <div>
                <div>
                    <label htmlFor="opening-balance" className="block text-sm font-medium text-gray-700">Opening Balance (R)</label>
                    <input id="opening-balance" type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="0.00" className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
                </div>
            </div>
            <button onClick={handleSaveBalances} className="w-full py-2 px-4 font-semibold text-white bg-brand-green rounded-lg shadow-sm hover:opacity-90">
                Save Opening Balance
            </button>
            {balanceMessage && (
              <p className={`text-center text-sm font-medium ${balanceMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {balanceMessage.text}
              </p>
            )}
            <div className="pt-4 border-t space-y-4">
                <StatCard 
                    icon={<PayoutIcon className="h-8 w-8 text-white"/>}
                    title="Today's Payouts"
                    value={`R ${todaysPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color="bg-red-500"
                />
                <StatCard 
                    icon={<CashIcon className="h-8 w-8 text-white"/>}
                    title="Current Day's Balance"
                    value={`R ${calculatedClosingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    color="bg-blue-500"
                />
            </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Performance by Representative (kg)</h2>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <BarChart data={repPerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{fill: 'rgba(255, 102, 0, 0.1)'}} />
                        <Legend />
                        <Bar dataKey="kg" fill="#ff6600" name="Weight (kg)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Master Transaction Log</h2>
            <div className="relative">
                <input 
                    type="text"
                    placeholder="Search by rep, client, material..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-brand-orange focus:border-brand-orange w-64"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
        </div>
        <div className="overflow-x-auto max-h-[450px]">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map(tx => (
                        <tr key={tx.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.repName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.material}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{tx.weight.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-orange font-semibold text-right">R {tx.total.toFixed(2)}</td>
                        </tr>
                    ))}
                     {filteredTransactions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500">No transactions found.</td>
                        </tr>
                    )}
                </tbody>
                <tfoot className="bg-gray-100 sticky bottom-0">
                    <tr>
                        <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">Overall Total</td>
                        <td className="px-6 py-3 whitespace-nowrap text-base text-brand-orange font-bold text-right">R {filteredTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
      </div>
    </div>
  );
}