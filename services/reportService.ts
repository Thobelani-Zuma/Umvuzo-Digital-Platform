import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';

// FIX: Added 'admin' and 'weekly' to the report type union to allow for more report variations.
// FIX: Added outputType parameter to allow returning a Blob instead of downloading.
export const generateReportPDF = (
  type: 'daily' | 'monthly' | 'material' | 'admin' | 'weekly', 
  transactions: Transaction[], 
  balances?: { opening: number, closing: number },
  filterTitle?: string,
  outputType: 'download' | 'blob' = 'download'
): Blob | void => {
  let filteredTransactions: Transaction[] = [];
  const now = new Date();

  if (type === 'daily') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startOfDay && txDate <= endOfDay;
    });
  } else if (type === 'weekly') {
    const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, etc.
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 6, 23, 59, 59, 999);
    
    filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startOfWeek && txDate <= endOfWeek;
    });
  } else if (type === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startOfMonth && txDate <= endOfMonth;
    });
  } else {
    filteredTransactions = transactions;
  }

  if (filteredTransactions.length === 0) {
    if (outputType === 'blob') return new Blob();
    return;
  }
  
  const doc = new jsPDF();
  
  const reportTitle = `Umvuzo ${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  let subTitleY = 29;
  if (filterTitle && filterTitle !== 'All') {
      doc.text(`Rate Sheet: ${filterTitle}`, 14, subTitleY);
      subTitleY += 7;
  }
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, subTitleY);

  const tableColumn = ["Date", "Rep", "Client", "Material", "Rate Sheet", "Kg", "Rate", "Total"];
  const tableRows: (string | number)[][] = [];
  let totalPaid = 0;
  let totalKg = 0;

  filteredTransactions.forEach(tx => {
    tableRows.push([
      new Date(tx.date).toLocaleString("en-ZA", {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute:'2-digit',
        hour12: true
      }),
      tx.repName,
      tx.clientName,
      tx.material,
      tx.rateSheet,
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
    startY: subTitleY + 6,
    theme: 'grid',
    headStyles: { fillColor: '#0b6000' },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const pageHeight = doc.internal.pageSize.getHeight();
  let summaryY = finalY + 15;

  // If table ended near bottom of page, start a new page for the summary
  if (summaryY + 45 > pageHeight) {
    doc.addPage();
    summaryY = 20;
  }

  doc.setFontSize(12);

  if (type === 'admin' && balances && balances.opening > 0) {
      const calculatedClosing = balances.opening - totalPaid;
      doc.text(`Financial Summary`, 14, summaryY);
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Today's Opening Balance: R ${balances.opening.toFixed(2)}`, 14, summaryY + 7);
      doc.text(`Total Payouts (for report period): R ${totalPaid.toFixed(2)}`, 14, summaryY + 14);
      doc.text(`Calculated Closing Balance: R ${calculatedClosing.toFixed(2)}`, 14, summaryY + 21);
      doc.text(`Total Kg (for report period): ${totalKg.toFixed(2)} kg`, 14, summaryY + 28);
  } else {
      doc.text(`Total Paid: R ${totalPaid.toFixed(2)}`, 14, summaryY);
      if (type === 'daily' || type === 'weekly' || type === 'monthly') {
          const roundedTotalPaid = Math.round(totalPaid / 10) * 10;
          doc.text(`Total Paid (Rounded to nearest 10): R ${roundedTotalPaid.toFixed(2)}`, 14, summaryY + 7);
          doc.text(`Total Kg: ${totalKg.toFixed(2)} kg`, 14, summaryY + 14);
      } else {
          doc.text(`Total Kg: ${totalKg.toFixed(2)} kg`, 14, summaryY + 7);
      }
  }
  
  if (outputType === 'blob') {
    return doc.output('blob');
  } else {
    doc.save(`${type}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};