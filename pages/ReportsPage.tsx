import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { generateReportPDF } from '../services/reportService';
import { ReportIcon, ShareIcon } from '../components/icons/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RATE_SHEETS } from '../constants';

interface ReportsPageProps {
  transactions: Transaction[];
}

const reportTypes = [
    { key: 'daily', label: 'Daily Report' },
    { key: 'weekly', label: 'Weekly Report' },
    { key: 'monthly', label: 'Monthly Report' },
    { key: 'material', label: 'Full Material Report' },
] as const;

type ReportType = typeof reportTypes[number]['key'];

export function ReportsPage({ transactions }: ReportsPageProps) {
  const [selectedRateSheet, setSelectedRateSheet] = useState('All');
  const [isSharing, setIsSharing] = useState<ReportType | null>(null);

  const filteredTransactions = useMemo(() => {
    if (selectedRateSheet === 'All') {
      return transactions;
    }
    return transactions.filter(tx => tx.rateSheet === selectedRateSheet);
  }, [transactions, selectedRateSheet]);

  const handleGenerateReport = (type: ReportType) => {
    generateReportPDF(type, filteredTransactions, undefined, selectedRateSheet, 'download');
  };
  
  const handleShareReport = async (type: ReportType) => {
    setIsSharing(type);
    try {
      const pdfBlob = generateReportPDF(type, filteredTransactions, undefined, selectedRateSheet, 'blob');
      
      if (!pdfBlob || pdfBlob.size === 0) {
        // generateReportPDF shows an alert if there's no data.
        return;
      }

      const reportFile = new File([pdfBlob], `${type}_report.pdf`, { type: 'application/pdf' });
      
      const shareData = {
          title: `Umvuzo ${type} Report`,
          text: `Here is the Umvuzo ${type} report.`,
          files: [reportFile],
      };

      if (navigator.share && navigator.canShare({ files: [reportFile] })) {
          await navigator.share(shareData);
      } else {
          alert("Your browser doesn't support sharing files directly. Please download the report and share it manually.");
      }
    } catch (err) {
      // Don't show an alert if the user cancels the share dialog
      if ((err as DOMException).name !== 'AbortError') {
          console.error("Share failed:", err);
          alert("Sharing failed. Please try again or share the downloaded file manually.");
      }
    } finally {
      setIsSharing(null);
    }
  };


  const materialTotals = filteredTransactions.reduce((acc, tx) => {
    acc[tx.material] = (acc[tx.material] || 0) + tx.weight;
    return acc;
  }, {} as { [key: string]: number });
  
  // FIX: Explicitly type the destructured arguments from Object.entries to resolve 'unknown' type inference.
  const chartData = Object.entries(materialTotals)
    .map(([name, kg]: [string, number]) => ({ name, kg: parseFloat(kg.toFixed(2)) }))
    .sort((a,b) => b.kg - a.kg);


  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>
      
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
        <label htmlFor="rate-sheet-filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Rate Sheet</label>
        <select
          id="rate-sheet-filter"
          value={selectedRateSheet}
          onChange={(e) => setSelectedRateSheet(e.target.value)}
          className="mt-1 block w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
        >
          <option value="All">All Rate Sheets</option>
          {Object.keys(RATE_SHEETS).map(sheet => (
            <option key={sheet} value={sheet}>{sheet}</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">My Material Collection Summary (kg)</h2>
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
      
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Generate & Share Reports</h2>
        <div className="space-y-3">
          {reportTypes.map(({ key, label }) => (
            <div key={key} className="bg-gray-50 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <ReportIcon className="h-6 w-6 text-brand-green" />
                <span className="font-semibold text-gray-800">{label}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleGenerateReport(key)}
                  className="py-2 px-4 text-sm font-semibold text-brand-orange border-2 border-brand-orange rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => handleShareReport(key)}
                  disabled={isSharing === key}
                  className="flex items-center gap-2 py-2 px-4 text-sm font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  <ShareIcon className="h-5 w-5" />
                  {isSharing === key ? 'Preparing...' : 'Share'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}