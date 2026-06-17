import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { RATE_SHEETS } from '../constants';
import { Transaction } from '../types';
import { PlusIcon, TrashIcon, PrintIcon, ScaleIcon, CameraIcon, UploadIcon } from '../components/icons/Icons';

interface TransactionsPageProps {
  repName: string;
  addMultipleTransactions: (items: Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName'>[], clientName: string) => void;
}

type TransactionItem = Omit<Transaction, 'id' | 'date' | 'repName' | 'clientName'>;

type ReceiptData = {
  items: TransactionItem[];
  clientName: string;
  repName: string;
  grandTotal: number;
  date: string;
};

type Message = {
  text: string;
  type: 'success' | 'error';
};

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

export function TransactionsPage({ repName, addMultipleTransactions }: TransactionsPageProps) {
  const [clientName, setClientName] = useState('');
  const [rateSheet, setRateSheet] = useState(Object.keys(RATE_SHEETS)[0]);
  const [material, setMaterial] = useState(RATE_SHEETS[rateSheet][0].type);
  const [weight, setWeight] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [lastTransactionForReceipt, setLastTransactionForReceipt] = useState<ReceiptData | null>(null);

  // State for Web Serial API
  const [scaleStatus, setScaleStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [rawSerialData, setRawSerialData] = useState<string[]>([]);
  const portRef = useRef<any | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  // State for Image Reading
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'upload' | 'camera' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // State for Camera Modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    setMaterial(RATE_SHEETS[rateSheet][0].type);
  }, [rateSheet]);

  const handleDisconnectScale = useCallback(async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (error) {
        // Ignore cancel error
      }
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (error) {
         // Ignore close error
      }
    }
    portRef.current = null;
    readerRef.current = null;
    setScaleStatus('disconnected');
  }, []);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (portRef.current) {
        handleDisconnectScale();
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [handleDisconnectScale]);

  const readFromStream = async (reader: ReadableStreamDefaultReader<string>) => {
    let lineBuffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        lineBuffer += value;
        const lines = lineBuffer.split(/\r?\n/);
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
              setRawSerialData(prev => [line, ...prev].slice(0, 10));
              let match = line.match(/(\d+\.?\d*)\s*kg/i);
              if (!match) {
                  match = line.match(/(\d+\.?\d*)/);
              }
              if (match && match[1]) {
                  const parsedWeight = parseFloat(match[1]);
                  if (!isNaN(parsedWeight)) {
                      setWeight(parsedWeight.toString());
                  }
              }
            }
        }
      }
    } catch (error) {
      console.warn("Reader cancelled or stream closed:", error);
    } finally {
      reader.releaseLock();
      handleDisconnectScale();
    }
  };

  const handleConnectScale = async () => {
    if (scaleStatus === 'connected') {
      await handleDisconnectScale();
      return;
    }
    if (!('serial' in navigator)) {
      alert('Web Serial API not supported in this browser. Please use Chrome or Edge.');
      setScaleStatus('error');
      return;
    }

    setScaleStatus('connecting');
    setRawSerialData([]);
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;
      
      setScaleStatus('connected');
      readFromStream(reader);
    } catch (error) {
      console.error('Error connecting to serial port:', error);
      setScaleStatus('error');
      if (portRef.current) {
          await portRef.current.close();
          portRef.current = null;
      }
    }
  };
  
  const processImageForWeight = async (base64Data: string, mimeType: string) => {
    setIsReadingImage(true);
    setMessage(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data,
                        },
                    },
                    {
                        text: "Extract the weight from this image of a weighing scale. Provide only the numerical value, for example: 13.25. If you cannot determine the weight, respond with 'Error'.",
                    },
                ],
            },
        });
        
        const text = response.text.trim();
        const match = text.match(/(\d+\.?\d*)/);
        const parsedWeight = match ? parseFloat(match[1]) : NaN;

        if (!isNaN(parsedWeight)) {
            setWeight(parsedWeight.toString());
            setMessage({ text: 'Weight extracted successfully!', type: 'success'});
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ text: 'Could not read weight from image. Please try again or enter it manually.', type: 'error'});
            setTimeout(() => setMessage(null), 4000);
        }
    } catch (error) {
        console.error("Error reading from image:", error);
        setMessage({ text: 'An error occurred while analyzing the image.', type: 'error'});
        setTimeout(() => setMessage(null), 4000);
    } finally {
        setIsReadingImage(false);
        setImageSource(null);
    }
};

  const handleReadFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageSource('upload');
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
    
    await processImageForWeight(base64Data, file.type);
    
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleTakePhotoClick = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage({ text: 'Camera not supported on this device.', type: 'error' });
        setTimeout(() => setMessage(null), 4000);
        return;
    }
    
    setIsCameraOpen(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
        setMessage({ text: 'Could not access camera. Please check permissions.', type: 'error' });
        setIsCameraOpen(false);
        setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleCloseCamera = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
  };
  
  const handleCapturePhoto = () => {
      if (!videoRef.current) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          const base64Data = dataUrl.split(',')[1];
          
          setImageSource('camera');
          processImageForWeight(base64Data, 'image/jpeg');
      }
      handleCloseCamera();
  };

  const getScaleButtonText = () => {
    switch (scaleStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Disconnect';
      case 'error': return 'Retry';
      default: return 'Connect Scale';
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (!clientName.trim()) {
        setMessage({ text: 'Please enter a client name first.', type: 'error'});
        setTimeout(() => setMessage(null), 3000);
        return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      setMessage({ text: 'Please enter a valid weight.', type: 'error'});
      setTimeout(() => setMessage(null), 3000);
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
    if (items.length === 0 || !clientName.trim()) {
        setMessage({text: 'Please add items and a client name before saving.', type: 'error'});
        setTimeout(() => setMessage(null), 3000);
        return;
    };

    const receiptData: ReceiptData = {
        items: [...items],
        clientName: clientName.trim(),
        repName: repName,
        grandTotal: grandTotal,
        date: new Date().toLocaleString('en-ZA'),
    };

    addMultipleTransactions(items, clientName.trim());
    
    setLastTransactionForReceipt(receiptData);
    setItems([]);
    setClientName('');
    setMessage({ text: `Transaction saved! You can now print a receipt.`, type: 'success' });
  }

  const handlePrintReceipt = () => {
      if (!lastTransactionForReceipt) return;
      const { items, clientName, repName, grandTotal, date } = lastTransactionForReceipt;
      const receiptContent = `
        <html>
          <head><title>Umvuzo Receipt</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');
              body { font-family: 'Roboto Mono', monospace; font-size: 12px; color: #000; } .receipt { width: 300px; margin: 0 auto; padding: 15px; } h1 { font-size: 18px; text-align: center; margin: 0 0 10px; } p { margin: 2px 0; } hr { border: 0; border-top: 1px dashed #000; margin: 10px 0; } table { width: 100%; border-collapse: collapse; } th, td { padding: 4px 0; } .text-right { text-align: right; } .total-row td { padding-top: 8px; border-top: 1px solid #000; font-weight: bold; } .footer { text-align: center; margin-top: 15px; }
              @media print { body { margin: 0; } .receipt { box-shadow: none; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              <h1>Umvuzo Digital</h1> <p style="text-align: center;">Transaction Receipt</p> <hr /> <p><strong>Date:</strong> ${date}</p> <p><strong>Client:</strong> ${clientName}</p> <p><strong>Rep:</strong> ${repName}</p> <hr />
              <table>
                <thead><tr><th>Material</th><th class="text-right">Weight</th><th class="text-right">Total</th></tr></thead>
                <tbody>${items.map(item => `<tr><td>${item.material}</td><td class="text-right">${item.weight.toFixed(2)}kg</td><td class="text-right">R ${item.total.toFixed(2)}</td></tr>`).join('')}</tbody>
                <tfoot><tr class="total-row"><td colspan="2">GRAND TOTAL</td><td class="text-right">R ${grandTotal.toFixed(2)}</td></tr></tfoot>
              </table> <hr /> <div class="footer"><p>Thank you!</p></div>
            </div>
          </body>
        </html>`;
      const printWindow = window.open('', '_blank', 'height=600,width=400');
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Log Transaction</h1>
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleCloseCamera}>
            <div className="bg-white p-4 rounded-lg max-w-xl w-full" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-md aspect-video bg-gray-900"></video>
                <div className="flex justify-center gap-4 mt-4">
                    <button onClick={handleCapturePhoto} className="px-6 py-3 bg-brand-orange text-white font-semibold rounded-lg shadow-md hover:opacity-90">Capture</button>
                    <button onClick={handleCloseCamera} className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-md space-y-6">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rep Name</label>
                <input type="text" value={repName} readOnly className="mt-1 w-full p-2 bg-gray-200 border border-gray-300 rounded-md cursor-not-allowed" />
              </div>
              <div>
                <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">Client Name</label>
                <input id="client-name" type="text" value={clientName} 
                  onChange={e => {
                      setClientName(e.target.value);
                      if (lastTransactionForReceipt) {
                        setLastTransactionForReceipt(null);
                        setMessage(null);
                      }
                  }} 
                  placeholder="Enter client name" disabled={items.length > 0} className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200" />
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
                <div className="mt-1 flex">
                    <input id="weight" type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.00" required className="w-full p-2 border border-r-0 border-gray-300 rounded-l-md focus:ring-brand-orange focus:border-brand-orange z-10" aria-describedby="scale-status-message" />
                    <input type="file" ref={imageInputRef} onChange={handleReadFromImage} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isReadingImage} className="relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200 disabled:cursor-not-allowed" aria-label="Upload weight from image">
                        {isReadingImage && imageSource === 'upload' ? <Spinner /> : <UploadIcon className="h-5 w-5 text-gray-500" />}
                    </button>
                    <button type="button" onClick={handleTakePhotoClick} disabled={isReadingImage} className="relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200 disabled:cursor-not-allowed" aria-label="Scan weight with camera">
                        {isReadingImage && imageSource === 'camera' ? <Spinner /> : <CameraIcon className="h-5 w-5 text-gray-500" />}
                    </button>
                    <button type="button" onClick={handleConnectScale} disabled={scaleStatus === 'connecting'} className={`relative inline-flex items-center space-x-2 px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange disabled:bg-gray-200 disabled:cursor-not-allowed ${scaleStatus === 'connected' ? 'bg-green-100 hover:bg-green-200 border-green-300' : ''}`}>
                      <ScaleIcon className={`h-5 w-5 ${scaleStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span>{getScaleButtonText()}</span>
                      {scaleStatus === 'connected' && (<span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>)}
                    </button>
                </div>
                {scaleStatus === 'error' && <p id="scale-status-message" className="mt-2 text-sm text-red-600">Could not connect. Ensure scale is plugged in and permissions are granted.</p>}
                {!('serial' in navigator) && <p id="scale-status-message" className="mt-2 text-sm text-yellow-600">Scale connection is not supported by this browser. Please use Chrome or Edge.</p>}
                {rawSerialData.length > 0 && (
                    <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-gray-500">Show Raw Scale Data</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded-md text-xs text-gray-600 max-h-24 overflow-y-auto">{rawSerialData.join('\n')}</pre>
                    </details>
                )}
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 py-3 px-4 font-semibold text-brand-orange bg-white border-2 border-dashed border-brand-orange rounded-lg hover:bg-orange-50 transition-colors">
                <PlusIcon className="h-5 w-5" />
                Add Material to Transaction
              </button>
          </form>
        </div>

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
                 <button onClick={handleSaveAll} disabled={items.length === 0} className="w-full py-3 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Complete & Save All ({items.length})
                 </button>
                 {lastTransactionForReceipt && (
                    <button onClick={handlePrintReceipt} className="w-full flex justify-center items-center gap-2 py-3 px-4 font-semibold text-white bg-brand-green rounded-lg shadow-md hover:opacity-90 transition-colors">
                        <PrintIcon className="h-5 w-5" />
                        Print Receipt
                    </button>
                 )}
                 {message && <p className={`text-center font-medium mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>}
            </div>
        </div>
      </div>
    </div>
  );
}