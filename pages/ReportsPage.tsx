import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { generateReportPDF } from '../services/reportService';
import { ReportIcon, EmailIcon, WhatsAppIcon } from '../components/icons/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RATE_SHEETS } from '../constants';

interface ReportsPageProps {
  transactions: Transaction[];
}

export function ReportsPage({ transactions }: ReportsPageProps) {
  const [selectedRateSheet, setSelectedRateSheet] = useState('All');

  const filteredTransactions = useMemo(() => {
    if (selectedRateSheet === 'All') {
      return transactions;
    }
    return transactions.filter(tx => tx.rateSheet === selectedRateSheet);
  }, [transactions, selectedRateSheet]);

  const handleGenerateReport = (type: 'daily' | 'weekly' | 'monthly' | 'material') => {
    generateReportPDF(type, filteredTransactions, undefined, selectedRateSheet);
  };
  
  const handleShare = (platform: 'email' | 'whatsapp') => {
    const subject = "Umvuzo Report";
    const emailBody = "Hi,\n\nPlease see the attached Umvuzo report.\n\n(This email was pre-filled. Please attach the PDF report you downloaded from the app).\n\nSent from the Umvuzo Digital Platform.";
    const whatsappText = "Hi, I'm sharing an Umvuzo report with you. I will send the PDF file next. (Sent from the Umvuzo Digital Platform)";

    if (platform === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
    }
  };

  const materialTotals = filteredTransactions.reduce((acc, tx) => {
    acc[tx.material] = (acc[tx.material] || 0) + tx.weight;
    return acc;
  }, {} as { [key: string]: number });
  
  const chartData = Object.entries(materialTotals)
    .map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) }))
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
      
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Download Reports</h2>
        <div className="space-y-4">
          <button
            onClick={() => handleGenerateReport('daily')}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 transition-transform transform hover:scale-105"
          >
            <ReportIcon className="h-6 w-6" />
            Download Daily Report
          </button>
          <button
            onClick={() => handleGenerateReport('weekly')}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 transition-transform transform hover:scale-105"
          >
            <ReportIcon className="h-6 w-6" />
            Download Weekly Report
          </button>
          <button
            onClick={() => handleGenerateReport('monthly')}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 transition-transform transform hover:scale-105"
          >
            <ReportIcon className="h-6 w-6" />
            Download Monthly Report
          </button>
          <button
            onClick={() => handleGenerateReport('material')}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 transition-transform transform hover:scale-105"
          >
            <ReportIcon className="h-6 w-6" />
            Download Full Material Report
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">Share Report</h3>
          <p className="text-center text-sm text-gray-500 mb-4">First, download a report, then use an option below to share the file.</p>
          <div className="flex justify-center gap-4">
              <button onClick={() => handleShare('email')} className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors">
                  <EmailIcon className="h-5 w-5" />
                  Email
              </button>
              <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                  <WhatsAppIcon className="h-5 w-5" />
                  WhatsApp
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}