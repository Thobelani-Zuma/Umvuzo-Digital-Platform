import React from 'react';
import { Transaction } from '../types';
import { generateReportPDF } from '../services/reportService';
import { ReportIcon } from '../components/icons/Icons';

interface ReportsPageProps {
  transactions: Transaction[];
}

export function ReportsPage({ transactions }: ReportsPageProps) {
  const handleGenerateReport = (type: 'daily' | 'monthly' | 'material') => {
    generateReportPDF(type, transactions);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Generate Reports</h1>
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
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