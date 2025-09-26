import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TransactionData } from '../types';
import { PayoutIcon, WeightIcon, UsersIcon, SearchIcon, ReportIcon } from '../components/icons/Icons';
import { generateReportPDF } from '../services/reportService';

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

  const { flatTransactions, totalPayout, totalWeight, repCount, repPerformanceData } = useMemo(() => {
    const allTxs = Object.values(allTransactions).flat();
    
    const payout = allTxs.reduce((sum, tx) => sum + tx.total, 0);
    const weight = allTxs.reduce((sum, tx) => sum + tx.weight, 0);
    
    const reps = new Set(allTxs.map(tx => tx.repName));
    
    const performance = Object.entries(allTransactions).map(([email, txs]) => {
        const repName = txs.length > 0 ? txs[0].repName : email.split('@')[0].replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        const totalWeight = txs.reduce((sum, tx) => sum + tx.weight, 0);
        return { name: repName, kg: parseFloat(totalWeight.toFixed(2)) };
    }).sort((a,b) => b.kg - a.kg);
    
    return {
      flatTransactions: allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalPayout: payout,
      totalWeight: weight,
      repCount: reps.size,
      repPerformanceData: performance,
    };
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return flatTransactions;
    const lowercasedFilter = searchTerm.toLowerCase();
    return flatTransactions.filter(tx =>
      tx.repName.toLowerCase().includes(lowercasedFilter) ||
      tx.clientName.toLowerCase().includes(lowercasedFilter) ||
      tx.material.toLowerCase().includes(lowercasedFilter)
    );
  }, [flatTransactions, searchTerm]);
  
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  }, [filteredTransactions]);

  const handleDownloadReport = () => {
    // We pass all transactions, and the service will handle the rest for the 'admin' type.
    const allTxs = Object.values(allTransactions).flat();
    generateReportPDF('admin', allTxs);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
         <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-2 py-2 px-4 font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90"
          >
            <ReportIcon className="h-5 w-5" />
            Download Report
          </button>
      </div>
      
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
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Performance by Representative (kg)</h2>
            <div style={{ width: '100%', height: 300 }}>
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
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-center text-gray-400">
            <p>Additional charts and analytics coming soon.</p>
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