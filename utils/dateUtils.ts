export interface DateRange {
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
}

export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPresetRange = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month'): DateRange => {
  const today = new Date();
  
  switch (preset) {
    case 'today': {
      const dateStr = formatDateToISO(today);
      return { startDate: dateStr, endDate: dateStr };
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dateStr = formatDateToISO(yesterday);
      return { startDate: dateStr, endDate: dateStr };
    }
    case 'week': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      return {
        startDate: formatDateToISO(sevenDaysAgo),
        endDate: formatDateToISO(today),
      };
    }
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDateToISO(startOfMonth),
        endDate: formatDateToISO(today),
      };
    }
    case 'all':
    default:
      return { startDate: '', endDate: '' };
  }
};

export const isWithinRange = (dateStr: string, startDate?: string, endDate?: string): boolean => {
  if (!startDate && !endDate) return true;
  if (!dateStr) return false;

  const txDate = new Date(dateStr);
  if (isNaN(txDate.getTime())) return true;

  if (startDate) {
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
    if (txDate < start) return false;
  }

  if (endDate) {
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
    const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
    if (txDate > end) return false;
  }

  return true;
};

export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
