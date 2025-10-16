import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { RATE_SHEETS } from '../constants';
import { PlusIcon, TrashIcon } from '../components/icons/Icons';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (
    items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[],
    clientName: string,
    transactionDate: Date
  ) => Promise<void>;
}

interface TransactionItem {
  material: string;
  weight: string;
  pricePerKg: number;
  total: number;
}

const initialItemState: TransactionItem = {
  material: '',
  weight: '',
  pricePerKg: 0,
  total: 0,
};

export function TransactionsPage({ repName, addMultipleTransactions }: TransactionsPageProps) {
  const [clientName, setClientName] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [rateSheetKey, setRateSheetKey] = useState(Object.keys(RATE_SHEETS)[0]);
  const [items, setItems] = useState<TransactionItem[]>([initialItemState]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const rateSheet = RATE_SHEETS[rateSheetKey];
  
  useEffect(() => {
    // Reset items when rate sheet changes
    setItems([initialItemState]);
  }, [rateSheetKey]);

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'material') {
      const materialInfo = rateSheet.find(m => m.type === value);
      item.material = value as string;
      item.pricePerKg = materialInfo ? materialInfo.price : 0;
    } else if (field === 'weight') {
      item.weight = value as string;
    }
    
    const weightValue = parseFloat(item.weight);
    if (!isNaN(weightValue) && item.pricePerKg > 0) {
      item.total = weightValue * item.pricePerKg;
    } else {
      item.total = 0;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, initialItemState]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };
  
  const resetForm = () => {
    setClientName('');
    setTransactionDate(new Date());
    setRateSheetKey(Object.keys(RATE_SHEETS)[0]);
    setItems([initialItemState]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus(null);

    if (!clientName.trim()) {
        setSubmissionStatus({ message: 'Client name is required.', type: 'error' });
        return;
    }
    
    const validItems = items.filter(item => item.material && parseFloat(item.weight) > 0);
    
    if (validItems.length === 0) {
        setSubmissionStatus({ message: 'Please add at least one valid material with a weight.', type: 'error' });
        return;
    }

    setIsSubmitting(true);
    try {
      const transactionItems = validItems.map(item => ({
        material: item.material,
        weight: parseFloat(item.weight),
        pricePerKg: item.pricePerKg,
        total: item.total,
      }));
      await addMultipleTransactions(transactionItems, clientName, transactionDate);
      setSubmissionStatus({ message: 'Transaction logged successfully!', type: 'success' });
      resetForm();
      setTimeout(() => setSubmissionStatus(null), 3000);
    } catch (error) {
      console.error('Transaction submission error:', error);
      setSubmissionStatus({ message: 'Failed to log transaction. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Log New Transaction</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="repName" className="block text-sm font-medium text-gray-700">Representative Name</label>
              <input id="repName" type="text" value={repName} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none" />
            </div>
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name / Walk-in</label>
              <input id="clientName" type="text" value={clientName} onChange={e => setClientName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
            </div>
            <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">Transaction Date</label>
                <input
                    id="transactionDate"
                    type="date"
                    value={transactionDate.toISOString().split('T')[0]}
                    onChange={e => setTransactionDate(new Date(e.target.value))}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                />
            </div>
            <div>
              <label htmlFor="rateSheet" className="block text-sm font-medium text-gray-700">Rate Sheet</label>
              <select id="rateSheet" value={rateSheetKey} onChange={e => setRateSheetKey(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange">
                {Object.keys(RATE_SHEETS).map(key => <option key={key} value={key}>{key}</option>)}
              </select>
            </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Materials</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-3">
                  <label htmlFor={`material-${index}`} className="block text-xs font-medium text-gray-600">Material</label>
                  <select id={`material-${index}`} value={item.material} onChange={e => handleItemChange(index, 'material', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange">
                    <option value="">Select a material</option>
                    {rateSheet.map(m => <option key={m.type} value={m.type}>{m.type}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={`weight-${index}`} className="block text-xs font-medium text-gray-600">Weight (kg)</label>
                  <input id={`weight-${index}`} type="number" step="0.01" value={item.weight} onChange={e => handleItemChange(index, 'weight', e.target.value)} placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Price/kg</label>
                  <p className="mt-1 px-3 py-2 text-gray-700">R {item.pricePerKg.toFixed(2)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Total</label>
                  <p className="mt-1 px-3 py-2 text-gray-800 font-semibold">R {item.total.toFixed(2)}</p>
                </div>
                <div className="md:col-span-1">
                  <button type="button" onClick={() => removeItem(index)} disabled={items.length <= 1} className="w-full flex items-center justify-center p-2 text-red-500 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="flex items-center gap-2 mt-2 px-4 py-2 text-sm font-medium text-white bg-brand-green rounded-md hover:opacity-90">
            <PlusIcon className="h-5 w-5" />
            Add Another Item
          </button>
        </div>
        
        <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-end items-center gap-6">
                <div className="text-right">
                    <p className="text-lg text-gray-600">Grand Total</p>
                    <p className="text-3xl font-bold text-brand-orange">R {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange disabled:bg-gray-400">
                  {isSubmitting ? 'Submitting...' : 'Log Transaction'}
                </button>
            </div>
            {submissionStatus && (
              <p className={`mt-4 text-center font-medium ${submissionStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {submissionStatus.message}
              </p>
            )}
        </div>
      </form>
    </div>
  );
}
