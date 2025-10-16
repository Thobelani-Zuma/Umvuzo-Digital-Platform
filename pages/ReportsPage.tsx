import React from 'react';
import { Transaction } from '../types';
import { generateReportPDF } from '../services/reportService';
import { ReportIcon } from '../components/icons/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportsPageProps {
  transactions: Transaction[];
}

export function ReportsPage({ transactions }: ReportsPageProps) {
  const handleGenerateReport = (type: 'daily' | 'monthly' | 'material') => {
    generateReportPDF(type, transactions);
  };

  const materialTotals = transactions.reduce((acc, tx) => {
    acc[tx.material] = (acc[tx.material] || 0) + tx.weight;
    return acc;
  }, {} as { [key: string]: number });
  
  const chartData = Object.entries(materialTotals)
    .map(([name, kg]) => ({ name, kg: parseFloat(kg.toFixed(2)) }))
    .sort((a,b) => b.kg - a.kg);


  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>
      
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
        <p className="mt-6 text-center text-gray-500">Reports will be downloaded as PDF files.</p>
      </div>
    </div>
  );
}