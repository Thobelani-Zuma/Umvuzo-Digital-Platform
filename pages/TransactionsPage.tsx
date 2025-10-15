import React, { useState, useEffect } from 'react';
import { RATE_SHEETS } from '../constants';
import { Transaction } from '../types';
import { PlusIcon, TrashIcon, PrintIcon } from '../components/icons/Icons';
import { LOGO_BASE64 } from '../components/Logo';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[], clientName: string, transactionDate: string) => void;
}

type TransactionItem = Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>;

export function TransactionsPage({ repName, addMultipleTransactions }: TransactionsPageProps) {
  const [clientName, setClientName] = useState('');
  const [rateSheet, setRateSheet] = useState(Object.keys(RATE_SHEETS)[0]);
  const [material, setMaterial] = useState(RATE_SHEETS[rateSheet][0].type);
  const [weight, setWeight] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [pricePerKg, setPricePerKg] = useState(RATE_SHEETS[rateSheet][0].price);
  const [total, setTotal] = useState(0);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>(() => {
    return new Date().getHours() < 12 ? 'AM' : 'PM';
  });

  useEffect(() => {
    const newRateSheetMaterials = RATE_SHEETS[rateSheet];
    const selectedMaterial = newRateSheetMaterials.find(m => m.type === material);
    if (selectedMaterial) {
      setPricePerKg(selectedMaterial.price);
    } else {
      // If the old material doesn't exist in the new rate sheet, default to the first one
      setMaterial(newRateSheetMaterials[0].type);
      setPricePerKg(newRateSheetMaterials[0].price);
    }
  }, [material, rateSheet]);

  useEffect(() => {
    const w = parseFloat(weight);
    if (!isNaN(w) && w > 0) {
      setTotal(w * pricePerKg);
    } else {
      setTotal(0);
    }
  }, [weight, pricePerKg]);

  const handleAddItem = () => {
    const w = parseFloat(weight);
    if (!material || !w || w <= 0) {
      alert("Please select a material and enter a valid weight.");
      return;
    }

    const newItem: TransactionItem = {
      material,
      weight: w,
      pricePerKg,
      total,
    };

    setItems([...items, newItem]);
    // Reset form fields
    setMaterial(RATE_SHEETS[rateSheet][0].type);
    setWeight('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
        alert("Please add at least one item.");
        return;
    }
    if (!clientName) {
        alert("Please enter a client name.");
        return;
    }
    try {
        const time = timePeriod === 'AM' ? '10:00:00' : '14:00:00';
        const transactionDateTime = new Date(`${transactionDate}T${time}`).toISOString();
        await addMultipleTransactions(items, clientName, transactionDateTime);
        alert('Transactions saved successfully!');
        setItems([]);
        setClientName('');
    } catch (error) {
        alert('Failed to save transactions.');
        console.error(error);
    }
  };
  
  const handlePrint = () => {
    if (items.length === 0 || !clientName) {
        alert("Please add items and a client name before printing.");
        return;
    }
    
    const time = timePeriod === 'AM' ? '10:00:00' : '14:00:00';
    const transactionDateTime = new Date(`${transactionDate}T${time}`);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptHTML = `
        <html>
          <head>
            <title>Umvuzo Transaction Receipt</title>
            <style>
              body { font-family: sans-serif; margin: 20px; color: #333; }
              .header { display: flex; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .header img { width: 80px; margin-right: 20px; }
              .header h1 { margin: 0; font-size: 24px; }
              .info { margin-bottom: 20px; }
              .info p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { margin-top: 20px; text-align: right; font-size: 1.2em; font-weight: bold; }
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${LOGO_BASE64}" alt="Umvuzo Logo" />
              <h1>Transaction Receipt</h1>
            </div>
            <div class="info">
              <p><strong>Date:</strong> ${transactionDateTime.toLocaleString('en-ZA')}</p>
              <p><strong>Rep Name:</strong> ${repName}</p>
              <p><strong>Client Name:</strong> ${clientName}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Weight (kg)</th>
                  <th>Rate (R/kg)</th>
                  <th>Total (R)</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.material}</td>
                    <td>${item.weight.toFixed(2)}</td>
                    <td>R ${item.pricePerKg.toFixed(2)}</td>
                    <td>R ${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              <p>Grand Total: R ${grandTotal.toFixed(2)}</p>
            </div>
            <div class="footer">
              <p>Umvuzo is powered by Isphepho.</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };


  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Log a New Transaction</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md space-y-4 h-fit">
                <h2 className="text-xl font-semibold text-gray-700">Add Item</h2>
                 <div className="flex gap-4">
                    <div className="w-2/3">
                        <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="date" id="transactionDate" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
                    </div>
                    <div className="w-1/3">
                        <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700">Period</label>
                        <select 
                            id="timePeriod" 
                            value={timePeriod} 
                            onChange={e => setTimePeriod(e.target.value as 'AM' | 'PM')}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange h-[42px]"
                        >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
                    <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter client's name" className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
                </div>
                <div>
                    <label htmlFor="rateSheet" className="block text-sm font-medium text-gray-700">Rate Sheet</label>
                    <select id="rateSheet" value={rateSheet} onChange={e => {
                        setRateSheet(e.target.value);
                    }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                        {Object.keys(RATE_SHEETS).map(sheet => <option key={sheet} value={sheet}>{sheet}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                    <select id="material" value={material} onChange={e => setMaterial(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                        {RATE_SHEETS[rateSheet].map(m => <option key={m.type} value={m.type}>{m.type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input type="number" id="weight" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g., 12.5" className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
                </div>
                <div className="pt-2 text-right">
                    <p className="text-gray-500">Price: R {pricePerKg.toFixed(2)} / kg</p>
                    <p className="text-gray-800 font-bold text-lg">Item Total: R {total.toFixed(2)}</p>
                </div>
                <button onClick={handleAddItem} className="w-full flex items-center justify-center gap-2 py-2 px-4 font-semibold text-white bg-brand-green rounded-lg shadow-md hover:opacity-90 transition-transform transform hover:scale-105">
                    <PlusIcon className="h-5 w-5" /> Add Item to Receipt
                </button>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Receipt for {clientName || '...'}</h2>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.length > 0 ? items.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.material}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{item.weight.toFixed(2)} kg</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">R {item.pricePerKg.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-brand-orange font-semibold text-right">R {item.total.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                        <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">No items added yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                    <p className="text-xl font-bold text-gray-800">Grand Total: R {grandTotal.toFixed(2)}</p>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                     <button
                        onClick={handlePrint}
                        disabled={items.length === 0 || !clientName}
                        className="flex items-center justify-center gap-2 py-2 px-4 font-semibold text-brand-orange border border-brand-orange rounded-lg shadow-sm hover:bg-brand-orange hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                    >
                        <PrintIcon className="h-5 w-5" /> Print Receipt
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={items.length === 0 || !clientName}
                        className="flex items-center justify-center gap-2 py-2 px-6 font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Submit Transactions
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}