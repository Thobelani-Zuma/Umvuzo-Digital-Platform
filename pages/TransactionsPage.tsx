import React, { useState, useEffect } from 'react';
import { RATE_SHEETS } from '../constants';
import { Transaction } from '../types';
import { PlusIcon, TrashIcon, PrintIcon } from '../components/icons/Icons';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[], clientName: string) => void;
}

type TransactionItem = Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>;

export function TransactionsPage({ repName, addMultipleTransactions }: TransactionsPageProps) {
  const [clientName, setClientName] = useState('');
  const [rateSheet, setRateSheet] = useState(Object.keys(RATE_SHEETS)[0]);
  const [material, setMaterial] = useState(RATE_SHEETS[rateSheet][0].type);
  const [weight, setWeight] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [message, setMessage] = useState('');
  const [receiptData, setReceiptData] = useState<{ items: TransactionItem[], clientName: string, repName: string, grandTotal: number } | null>(null);
  
  useEffect(() => {
    setMaterial(RATE_SHEETS[rateSheet][0].type);
  }, [rateSheet]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptData(null);
    setMessage('');
    const weightNum = parseFloat(weight);
    if (!clientName.trim()) {
        setMessage('Please enter a client name first.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      setMessage('Please enter a valid weight.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const materialData = RATE_SHEETS[rateSheet].find(m => m.type === material);
    if (!materialData) return;
    
    const newItem: TransactionItem = {
      material: material,
      weight: weightNum,
      pricePerKg: materialData.price,
      total: weightNum * materialData.price,
    };

    setItems([...items, newItem]);
    setWeight('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSaveAll = () => {
    if (items.length === 0) return;
    addMultipleTransactions(items, clientName.trim());
    setReceiptData({ items, clientName: clientName.trim(), repName, grandTotal });
    setItems([]);
    setClientName('');
    setMessage(`${items.length} transaction(s) saved. You can now print the receipt.`);
  }
  
  const handlePrintReceipt = () => {
    if (!receiptData) return;

    const { items, clientName, repName, grandTotal } = receiptData;

    const receiptContent = `
        <html>
        <head>
            <title>Umvuzo Receipt</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 300px; margin: auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 1.5em; color: #0b6000; }
                .header p { margin: 0; font-size: 0.9em; color: #ff6600; }
                .info { margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; font-size: 0.8em; }
                .info p { margin: 4px 0; }
                table { width: 100%; border-collapse: collapse; font-size: 0.8em; }
                th, td { padding: 5px; text-align: left; }
                th { border-bottom: 1px solid #333; }
                .text-right { text-align: right; }
                .total { margin-top: 15px; text-align: right; border-top: 2px double #333; padding-top: 10px; }
                .total h2 { margin: 0; font-size: 1.2em; }
                .footer { text-align: center; margin-top: 25px; font-style: italic; color: #555; font-size: 0.8em; }
                @media print {
                  body { margin: 0; }
                  .container { box-shadow: none; border: none; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Umvuzo</h1>
                    <p>Customer Receipt</p>
                </div>
                <div class="info">
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Client:</strong> ${clientName}</p>
                    <p><strong>Rep:</strong> ${repName}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th class="text-right">Kg</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.material}</td>
                                <td class="text-right">${item.weight.toFixed(2)}</td>
                                <td class="text-right">R ${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total">
                    <h2>Grand Total: R ${grandTotal.toFixed(2)}</h2>
                </div>
                <div class="footer">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'height=600,width=400');
    if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
    } else {
        alert('Please allow popups to print the receipt.');
    }
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
    setReceiptData(null);
    setMessage('');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Log Transaction</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Form Card */}
        <div className="bg-white p-8 rounded-xl shadow-md space-y-6">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rep Name</label>
                <input type="text" value={repName} readOnly className="mt-1 w-full p-2 bg-gray-200 border border-gray-300 rounded-md cursor-not-allowed" />
              </div>
              <div>
                <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">Client Name</label>
                <input id="client-name" type="text" value={clientName} onChange={handleClientNameChange} placeholder="Enter client name" disabled={items.length > 0} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200" />
              </div>
          </div>

          <form onSubmit={handleAddItem} className="pt-6 border-t space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Add Material</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rate-sheet" className="block text-sm font-medium text-gray-700">Rate Sheet</label>
                  <select id="rate-sheet" value={rateSheet} onChange={e => setRateSheet(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                    {Object.keys(RATE_SHEETS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                  <select id="material" value={material} onChange={e => setMaterial(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                    {RATE_SHEETS[rateSheet].map(m => <option key={m.type} value={m.type}>{m.type} (R{m.price}/kg)</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input id="weight" type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.00" required className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 py-3 px-4 font-semibold text-brand-orange bg-white border-2 border-dashed border-brand-orange rounded-lg hover:bg-orange-50 transition-colors">
                <PlusIcon className="h-5 w-5" />
                Add Material to Transaction
              </button>
          </form>
        </div>

        {/* Summary Card */}
        <div className="bg-white p-8 rounded-xl shadow-md flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Transaction Summary</h2>
            <div className="flex-1 overflow-y-auto border-2 border-dashed border-gray-200 rounded-lg p-4">
                {items.length === 0 ? (
                    <p className="text-center text-gray-500 h-full flex items-center justify-center">No materials added yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((item, index) => (
                            <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.material}</p>
                                    <p className="text-sm text-gray-500">{item.weight.toFixed(2)} kg @ R{item.pricePerKg.toFixed(2)}/kg</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-semibold text-brand-orange">R {item.total.toFixed(2)}</p>
                                    <button onClick={() => handleRemoveItem(index)} className="text-gray-400 hover:text-red-500">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="pt-6 border-t mt-4 space-y-4">
                 <div className="text-center bg-orange-50 p-4 rounded-lg">
                    <p className="text-lg text-gray-600">Grand Total</p>
                    <p className="text-4xl font-bold text-brand-orange">R {grandTotal.toFixed(2)}</p>
                 </div>
                 {receiptData ? (
                    <button onClick={handlePrintReceipt} className="w-full flex justify-center items-center gap-2 py-3 px-4 text-lg font-semibold text-white bg-brand-green rounded-lg shadow-md hover:opacity-90 transition-colors">
                        <PrintIcon className="h-6 w-6" />
                        Print Receipt
                    </button>
                  ) : (
                    <button onClick={handleSaveAll} disabled={items.length === 0} className="w-full py-3 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Complete & Save All ({items.length})
                    </button>
                  )}
                 {message && <p className="text-center text-green-600 font-medium mt-2">{message}</p>}
            </div>
        </div>
      </div>
    </div>
  );
}