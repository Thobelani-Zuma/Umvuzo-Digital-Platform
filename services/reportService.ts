import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';

// FIX: Added 'admin' to the report type union to allow generating a full report from the admin dashboard.
export const generateReportPDF = (type: 'daily' | 'monthly' | 'material' | 'admin', transactions: Transaction[]) => {
  let filteredTransactions: Transaction[] = [];
  const today = new Date();

  if (type === 'daily') {
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    filteredTransactions = transactions.filter(tx => tx.date >= startOfDay && tx.date <= endOfDay);
  } else if (type === 'monthly') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    filteredTransactions = transactions.filter(tx => tx.date >= startOfMonth && tx.date <= endOfMonth);
  } else {
    filteredTransactions = transactions;
  }

  if (filteredTransactions.length === 0) {
    alert("No data available for the selected report type.");
    return;
  }
  
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Umvuzo ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 29);

  const tableColumn = ["Date", "Rep", "Client", "Material", "Kg", "Rate", "Total"];
  const tableRows: (string | number)[][] = [];
  let totalPaid = 0;
  let totalKg = 0;

  filteredTransactions.forEach(tx => {
    tableRows.push([
      new Date(tx.date).toLocaleDateString("en-ZA"),
      tx.repName,
      tx.clientName,
      tx.material,
      tx.weight.toFixed(2),
      `R ${tx.pricePerKg.toFixed(2)}`,
      `R ${tx.total.toFixed(2)}`
    ]);
    totalPaid += tx.total;
    totalKg += tx.weight;
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: '#0b6000' },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(12);
  doc.text(`Total Paid: R ${totalPaid.toFixed(2)}`, 14, finalY + 15);
  doc.text(`Total Kg: ${totalKg.toFixed(2)} kg`, 14, finalY + 22);
  
  doc.save(`${type}_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
