import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';
import { TotalIcon, WeightIcon, PayoutIcon, SearchIcon, CloseIcon } from '../components/icons/Icons';
import { DateRangePicker } from '../components/DateRangePicker';
import { DateRange, isWithinRange, formatDisplayDate } from '../utils/dateUtils';

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
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


export function DashboardPage({ transactions }: DashboardPageProps) {
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions by the selected date range
  const dateFilteredTransactions = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return transactions;
    }
    return transactions.filter(tx => isWithinRange(tx.date, dateRange.startDate, dateRange.endDate));
  }, [transactions, dateRange]);

  // Overall metrics based on the date range
  const totalTransactions = dateFilteredTransactions.length;
  const totalKg = dateFilteredTransactions.reduce((sum, tx) => sum + tx.weight, 0);
  const totalValue = dateFilteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  
  const materialTotals = dateFilteredTransactions.reduce((acc, tx) => {
    acc[tx.material] = (acc[tx.material] || 0) + tx.weight;
    return acc;
  }, {} as { [key: string]: number });
  
  const chartData = Object.entries(materialTotals)
    .map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) }))
    .sort((a, b) => b.kg - a.kg);

  // Search filter for displayed transactions list
  const displayedTransactions = useMemo(() => {
    const sorted = [...dateFilteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (!searchTerm.trim()) return sorted;

    const query = searchTerm.toLowerCase();
    return sorted.filter(tx =>
      tx.clientName?.toLowerCase().includes(query) ||
      tx.material?.toLowerCase().includes(query) ||
      tx.rateSheet?.toLowerCase().includes(query)
    );
  }, [dateFilteredTransactions, searchTerm]);

  const displayedTotalValue = useMemo(() => {
    return displayedTransactions.reduce((sum, tx) => sum + tx.total, 0);
  }, [displayedTransactions]);

  const displayedTotalKg = useMemo(() => {
    return displayedTransactions.reduce((sum, tx) => sum + tx.weight, 0);
  }, [displayedTransactions]);

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Date Range Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of collected materials and transactions
          </p>
        </div>

        {/* Date Range Picker Component */}
        <div className="w-full lg:w-auto lg:min-w-[480px]">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            activeCount={dateFilteredTransactions.length}
          />
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            icon={<TotalIcon className="h-8 w-8 text-white"/>} 
            title="Transactions in Period"
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

      {/* Material Weight Collected Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h2 className="text-xl font-semibold text-gray-700">Material Weight Collected (kg)</h2>
          {(dateRange.startDate || dateRange.endDate) && (
            <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
              Filtered: {dateRange.startDate ? formatDisplayDate(dateRange.startDate) : 'Start'} – {dateRange.endDate ? formatDisplayDate(dateRange.endDate) : 'Present'}
            </span>
          )}
        </div>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 350 }}>
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
        ) : (
          <div className="py-12 text-center text-gray-400">
            <p>No material data recorded for this time window.</p>
          </div>
        )}
      </div>

      {/* Displayed List of Transactions */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-700">Transactions List</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {displayedTransactions.length} of {dateFilteredTransactions.length} {dateFilteredTransactions.length === 1 ? 'transaction' : 'transactions'} in selected period
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input 
              type="text"
              placeholder="Search by client or material..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-orange focus:border-brand-orange shadow-sm"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {displayedTransactions.length > 0 ? (
          <div className="overflow-x-auto max-h-[450px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Sheet</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total (R)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.clientName || 'Walk-in'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-brand-green border border-green-200">
                        {tx.material}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-500">
                      {tx.rateSheet || 'Default'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                      {tx.weight.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-900 font-bold text-right text-brand-orange">
                      R {tx.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 sticky bottom-0">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                    Period Total ({displayedTransactions.length} {displayedTransactions.length === 1 ? 'record' : 'records'}):
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-800">
                    {displayedTotalKg.toFixed(2)} kg
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-brand-orange">
                    R {displayedTotalValue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-base font-medium text-gray-700">No transactions match this time window</p>
            <p className="text-xs text-gray-400 mt-1">
              {dateRange.startDate || dateRange.endDate
                ? 'Try choosing a broader date range or click below to view All Time.'
                : 'No transactions recorded yet.'}
            </p>
            {(dateRange.startDate || dateRange.endDate || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setSearchTerm('');
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline"
              >
                Reset all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}