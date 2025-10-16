import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '../types';
import { RATE_SHEETS } from '../constants';
import { PlusIcon, TrashIcon, PrintIcon } from '../components/icons/Icons';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (
    items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[],
    clientName: string,
    transactionDate: Date
  ) => Promise<void>;
}

type TransactionItem = Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>;

export function TransactionsPage({ repName, addMultipleTransactions }: TransactionsPageProps) {
  // State for the overall transaction
  const [clientName, setClientName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'AM' | 'PM'>('AM');
  const [items, setItems] = useState<TransactionItem[]>([]);
  
  // State for the item currently being added
  const [rateSheetKey, setRateSheetKey] = useState(Object.keys(RATE_SHEETS)[0]);
  const [material, setMaterial] = useState(RATE_SHEETS[rateSheetKey][0].type);
  const [weight, setWeight] = useState('');

  // State for submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const rateSheet = RATE_SHEETS[rateSheetKey];

  useEffect(() => {
    setMaterial(rateSheet[0]?.type || '');
  }, [rateSheetKey, rateSheet]);

  const handleAddItem = () => {
    setStatus(null);
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      alert('Please enter a valid weight.');
      return;
    }

    const materialInfo = rateSheet.find(m => m.type === material);
    if (!materialInfo) {
      alert('Please select a valid material.');
      return;
    }

    const newItem: TransactionItem = {
      material,
      weight: weightValue,
      pricePerKg: materialInfo.price,
      total: weightValue * materialInfo.price,
    };

    setItems([...items, newItem]);
    setWeight(''); // Reset weight for the next item
  };
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);
  
  const resetForm = () => {
    setClientName('');
    setItems([]);
    setWeight('');
    setTimeOfDay('AM');
    setRateSheetKey(Object.keys(RATE_SHEETS)[0]);
    setStatus(null);
  }

  const handleSaveAll = async () => {
    setStatus(null);
    if (!clientName.trim()) {
      setStatus({ message: 'Client name is required.', type: 'error' });
      return;
    }
    if (items.length === 0) {
      setStatus({ message: 'Please add at least one material to the transaction.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const transactionDate = new Date();
    transactionDate.setHours(timeOfDay === 'AM' ? 10 : 14, 0, 0, 0);

    try {
      await addMultipleTransactions(items, clientName, transactionDate);
      setStatus({ message: 'Transaction saved successfully!', type: 'success' });
      setTimeout(resetForm, 2000);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setStatus({ message: 'Failed to save transaction. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!clientName.trim() || items.length === 0) {
        alert("Please enter a client name and add at least one item before printing.");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        const receiptHTML = `
            <html>
                <head>
                    <title>Transaction Receipt</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 25px; color: #111; }
                        .info { margin-bottom: 25px; padding-bottom: 15px; }
                        .info p { margin: 6px 0; font-size: 14px; }
                        .info strong { font-weight: 600; color: #000; }
                        table { width: 100%; border-collapse: collapse; font-size: 14px; }
                        th, td { padding: 12px 0; text-align: left; }
                        th { font-weight: 600; }
                        thead th { border-bottom: 2px solid #000; }
                        tbody tr { border-bottom: 1px solid #eaeaea; }
                        .align-right { text-align: right; }
                        tfoot td { font-weight: 600; font-size: 1.1em; padding-top: 15px; border-bottom: none; }
                        tfoot .grand-total-label { text-align: right; padding-right: 15px; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #777; }
                        .footer .thank-you { font-style: italic; margin-bottom: 10px; }
                        .footer .credit { font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="info">
                        <p><strong>Date & Time:</strong> ${new Date().toLocaleString('en-ZA')}</p>
                        <p><strong>Rep Name:</strong> ${repName}</p>
                        <p><strong>Client Name:</strong> ${clientName}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th class="align-right">Kg</th>
                                <th class="align-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.material}</td>
                                    <td class="align-right">${item.weight.toFixed(2)}</td>
                                    <td class="align-right">R ${item.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td class="grand-total-label" colspan="2">Grand Total</td>
                                <td class="align-right">R ${grandTotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">
                        <p class="thank-you">Thank you for your business</p>
                        <p class="credit">Umvuzo is developed and powered by Isphepho</p>
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Log Transaction</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel: Form */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="repName" className="block text-sm font-medium text-gray-700">Rep Name</label>
              <input id="repName" type="text" value={repName} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
              <input id="clientName" type="text" placeholder="Enter client name" value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="timeOfDay" className="block text-sm font-medium text-gray-700">Time of Day</label>
                <select 
                    id="timeOfDay" 
                    value={timeOfDay} 
                    onChange={e => setTimeOfDay(e.target.value as 'AM' | 'PM')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
          </div>
          
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-700">Add Material</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="rateSheet" className="block text-sm font-medium text-gray-700">Rate Sheet</label>
                <select id="rateSheet" value={rateSheetKey} onChange={e => setRateSheetKey(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                    {Object.keys(RATE_SHEETS).map(sheet => <option key={sheet} value={sheet}>{sheet}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                <select id="material" value={material} onChange={e => setMaterial(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                    {rateSheet.map(m => <option key={m.type} value={m.type}>{`${m.type} (R${m.price.toFixed(1)}/kg)`}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input type="number" step="0.01" id="weight" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.00" className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
              </div>
            </div>
             <button onClick={handleAddItem} className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-brand-orange border-2 border-dashed border-brand-orange rounded-lg hover:bg-orange-50 transition-colors">
              <PlusIcon className="h-5 w-5" />
              Add Material to Transaction
            </button>
          </div>
        </div>

        {/* Right Panel: Summary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Transaction Summary</h2>
            <div className="bg-gray-50 border border-dashed rounded-lg p-4 min-h-[200px] overflow-y-auto max-h-64">
                {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No materials added yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((item, index) => (
                           <li key={index} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                               <div>
                                   <p className="font-semibold text-gray-800">{item.material}</p>
                                   <p className="text-sm text-gray-500">{item.weight.toFixed(2)} kg @ R{item.pricePerKg.toFixed(2)}/kg</p>
                               </div>
                               <div className="flex items-center gap-4">
                                   <p className="font-semibold text-gray-800">R{item.total.toFixed(2)}</p>
                                   <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                       <TrashIcon className="h-5 w-5" />
                                   </button>
                               </div>
                           </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <div className="mt-4 bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">Grand Total</p>
                <p className="text-4xl font-bold text-brand-orange">R {grandTotal.toFixed(2)}</p>
            </div>
            
            {status && (
              <p className={`mt-4 text-center font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {status.message}
              </p>
            )}

            <div className="mt-4 space-y-2">
                <button
                  onClick={handleSaveAll}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full py-4 text-lg font-semibold text-white bg-slate-600 rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : `Complete & Save All (${items.length})`}
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-brand-green border-2 border-brand-green rounded-lg hover:bg-green-50 transition-colors disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50"
                >
                    <PrintIcon className="h-5 w-5" />
                    Print Receipt
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}