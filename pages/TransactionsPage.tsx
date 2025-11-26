import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction } from '../types';
import { RATE_SHEETS } from '../constants';
import { PlusIcon, TrashIcon, PrintIcon, ScaleIcon, CameraIcon } from '../components/icons/Icons';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (
    items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>[],
    clientName: string,
    transactionDate: Date
  ) => Promise<void>;
}

type TransactionItem = Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName' | 'userEmail'>;

type ScaleStatus = 'idle' | 'fetching' | 'success' | 'error';
type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

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
  
  // State for scale connection
  const [scaleStatus, setScaleStatus] = useState<ScaleStatus>('idle');
  const [scaleError, setScaleError] = useState<string | null>(null);

  // State for camera scanning
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanError, setScanError] = useState<string | null>(null);

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
      rateSheet: rateSheetKey,
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
  
  const handleGetWeight = async () => {
    setScaleStatus('fetching');
    setScaleError(null);
    try {
      const response = await fetch('http://localhost:12345/weight');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (typeof data.weight === 'number') {
        setWeight(data.weight.toString());
        setScaleStatus('success');
      } else {
        throw new Error('Invalid weight data received');
      }
    } catch (err) {
      console.error('Failed to fetch weight from scale service:', err);
      setScaleStatus('error');
      setScaleError('Connection failed. Is the scale service running?');
    }
  };

  const openCamera = async () => {
    setScanStatus('idle');
    setScanError(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        setIsCameraOpen(true);
    } catch (err) {
        console.error("Error accessing camera:", err);
        setScanStatus('error');
        setScanError('Could not access camera. Please check permissions.');
    }
  };

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const closeCamera = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const scanImageForWeight = async (base64Image: string) => {
    setScanStatus('scanning');
    setScanError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image,
                        },
                    },
                    {
                        text: 'Analyze the image of a digital scale. Extract the numerical weight value. Your response must be only the number. For example, if the scale shows "12.34 kg", respond with "12.34".',
                    },
                ],
            },
        });
        
        const extractedText = response.text?.trim();
        let weightValue = NaN;
        if (extractedText) {
            // Use regex to find the first floating point number in the string
            const match = extractedText.match(/(\d+\.?\d*|\.\d+)/);
            if (match) {
                weightValue = parseFloat(match[0]);
            }
        }
        
        if (!isNaN(weightValue) && weightValue > 0) {
            setWeight(weightValue.toString());
            setScanStatus('success');
        } else {
            setScanStatus('error');
            setScanError("Could not detect a valid weight. Please try again.");
        }
    } catch (error) {
        console.error("Error scanning image for weight:", error);
        setScanStatus('error');
        setScanError("Failed to scan image. Please try again.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const base64Data = dataUrl.split(',')[1];
            scanImageForWeight(base64Data);
            closeCamera();
        }
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
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Log Transaction</h1>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel: Form */}
        <div class="lg:col-span-3 bg-white p-6 rounded-xl shadow-md space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="repName" class="block text-sm font-medium text-gray-700">Rep Name</label>
              <input id="repName" type="text" value={repName} disabled class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="clientName" class="block text-sm font-medium text-gray-700">Client Name</label>
              <input id="clientName" type="text" placeholder="Enter client name" value={clientName} onChange={e => setClientName(e.target.value)} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
            </div>
            <div class="md:col-span-2">
                <label htmlFor="timeOfDay" class="block text-sm font-medium text-gray-700">Time of Day</label>
                <select 
                    id="timeOfDay" 
                    value={timeOfDay} 
                    onChange={e => setTimeOfDay(e.target.value as 'AM' | 'PM')}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
          </div>
          
          <div class="pt-6 border-t">
            <h2 class="text-xl font-semibold text-gray-700">Add Material</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="rateSheet" class="block text-sm font-medium text-gray-700">Rate Sheet</label>
                <select id="rateSheet" value={rateSheetKey} onChange={e => setRateSheetKey(e.target.value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                    {Object.keys(RATE_SHEETS).map(sheet => <option key={sheet} value={sheet}>{sheet}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="material" class="block text-sm font-medium text-gray-700">Material</label>
                <select id="material" value={material} onChange={e => setMaterial(e.target.value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange">
                    {rateSheet.map(m => <option key={m.type} value={m.type}>{`${m.type} (R${m.price.toFixed(1)}/kg)`}</option>)}
                </select>
              </div>
              <div class="md:col-span-2">
                <label htmlFor="weight" class="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <div class="mt-1 flex gap-2">
                    <input type="number" step="0.01" id="weight" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.00" class="flex-grow p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange" />
                    <button onClick={handleGetWeight} disabled={scaleStatus === 'fetching'} title="Get Weight from Scale" class="flex-shrink-0 flex items-center justify-center p-3 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait">
                        <ScaleIcon class="h-5 w-5" />
                    </button>
                    <button onClick={openCamera} disabled={scanStatus === 'scanning'} title="Scan Weight from Image" class="flex-shrink-0 flex items-center justify-center p-3 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait">
                        <CameraIcon class="h-5 w-5" />
                    </button>
                </div>
                <div class="h-4 mt-1 text-xs">
                    {scaleStatus === 'fetching' && <p class="text-blue-600">Fetching weight...</p>}
                    {scaleStatus === 'success' && <p class="text-green-600">Weight captured successfully.</p>}
                    {scaleStatus === 'error' && <p class="text-red-600">{scaleError}</p>}
                    {scanStatus === 'scanning' && <p class="text-blue-600">Scanning image for weight...</p>}
                    {scanStatus === 'success' && <p class="text-green-600">Weight scanned successfully.</p>}
                    {scanStatus === 'error' && <p class="text-red-600">{scanError}</p>}
                </div>
              </div>
            </div>
             <button onClick={handleAddItem} class="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-brand-orange border-2 border-dashed border-brand-orange rounded-lg hover:bg-orange-50 transition-colors">
              <PlusIcon class="h-5 w-5" />
              Add Material to Transaction
            </button>
          </div>
        </div>

        {/* Right Panel: Summary */}
        <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 mb-4">Current Transaction Summary</h2>
            <div class="bg-gray-50 border border-dashed rounded-lg p-4 min-h-[200px] overflow-y-auto max-h-64">
                {items.length === 0 ? (
                    <p class="text-gray-500 text-center py-10">No materials added yet.</p>
                ) : (
                    <ul class="space-y-3">
                        {items.map((item, index) => (
                           <li key={index} class="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                               <div>
                                   <p class="font-semibold text-gray-800">{item.material}</p>
                                   <p class="text-sm text-gray-500">{item.weight.toFixed(2)} kg @ R{item.pricePerKg.toFixed(2)}/kg</p>
                               </div>
                               <div class="flex items-center gap-4">
                                   <p class="font-semibold text-gray-800">R{item.total.toFixed(2)}</p>
                                   <button onClick={() => handleRemoveItem(index)} class="text-red-500 hover:text-red-700">
                                       <TrashIcon class="h-5 w-5" />
                                   </button>
                               </div>
                           </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <div class="mt-4 bg-orange-50 p-4 rounded-lg text-center">
                <p class="text-gray-600">Grand Total</p>
                <p class="text-4xl font-bold text-brand-orange">R {grandTotal.toFixed(2)}</p>
            </div>
            
            {status && (
              <p className={`mt-4 text-center font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {status.message}
              </p>
            )}

            <div class="mt-4 space-y-2">
                <button
                  onClick={handleSaveAll}
                  disabled={isSubmitting || items.length === 0}
                  class="w-full py-4 text-lg font-semibold text-white bg-slate-600 rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : `Complete & Save All (${items.length})`}
                </button>
                <button
                  onClick={handlePrintReceipt}
                  class="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-brand-green border-2 border-brand-green rounded-lg hover:bg-green-50 transition-colors disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50"
                >
                    <PrintIcon class="h-5 w-5" />
                    Print Receipt
                </button>
            </div>
        </div>
      </div>
      
      {isCameraOpen && (
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div class="bg-white p-4 rounded-lg shadow-xl relative max-w-lg w-full">
                <h3 class="text-lg font-bold mb-4 text-center">Scan Weight from Scale</h3>
                <div class="bg-gray-200 rounded-md overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline class="w-full h-full object-cover"></video>
                </div>
                <canvas ref={canvasRef} class="hidden"></canvas>
                <div class="mt-4 grid grid-cols-2 gap-3">
                    <button onClick={closeCamera} class="w-full py-3 px-4 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button onClick={capturePhoto} class="w-full py-3 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 transition-colors">
                        Capture
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
