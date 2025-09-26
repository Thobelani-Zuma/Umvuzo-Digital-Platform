import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';
import { TotalIcon, WeightIcon, PayoutIcon } from '../components/icons/Icons';

interface DashboardPageProps {
  transactions: Transaction[];
}

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


export function DashboardPage({ transactions }: DashboardPageProps) {
  const totalTransactions = transactions.length;
  const totalKg = transactions.reduce((sum, tx) => sum + tx.weight, 0);
  const totalValue = transactions.reduce((sum, tx) => sum + tx.total, 0);
  
  const materialTotals = transactions.reduce((acc, tx) => {
    acc[tx.material] = (acc[tx.material] || 0) + tx.weight;
    return acc;
  }, {} as { [key: string]: number });
  
  const chartData = Object.entries(materialTotals)
    .map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) }))
    .sort((a,b) => b.kg - a.kg);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
            icon={<TotalIcon className="h-8 w-8 text-white"/>} 
            title="Total Transactions"
            value={totalTransactions.toLocaleString()}
            color="bg-brand-green"
        />
        <StatCard 
            icon={<WeightIcon className="h-8 w-8 text-white"/>} 
            title="Total Weight (kg)"
            value={totalKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            color="bg-orange-400"
        />
        <StatCard 
            icon={<PayoutIcon className="h-8 w-8 text-white"/>}
            title="Total Payout"
            value={`R ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="bg-brand-orange"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Material Weight Collected (kg)</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{fill: 'rgba(255, 102, 0, 0.1)'}} />
              <Legend />
              <Bar dataKey="kg" fill="#ff6600" name="Weight (kg)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}