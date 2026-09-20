import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface DailyBalanceData {
  openingBalance: number;
  closingBalance?: number;
  date: string;
  updatedAt?: string;
}

export interface BalanceResult {
  openingBalance: number;
  closingBalance?: number;
  source: 'cloud' | 'local';
  carriedOver?: boolean;
}

const LOCAL_STORAGE_PREFIX = 'umvuzo_daily_balance_';
const LOCAL_STORAGE_INDEX = 'umvuzo_balance_dates';

function getStoredDates(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INDEX);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addStoredDate(dateStr: string) {
  try {
    const dates = getStoredDates();
    if (!dates.includes(dateStr)) {
      dates.push(dateStr);
      dates.sort((a, b) => b.localeCompare(a)); // Descending order (newest first)
      localStorage.setItem(LOCAL_STORAGE_INDEX, JSON.stringify(dates));
    }
  } catch {
    // Ignore localStorage errors
  }
}

function getLocalBalance(dateStr: string): DailyBalanceData | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + dateStr);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalBalance(dateStr: string, data: DailyBalanceData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + dateStr, JSON.stringify(data));
    addStoredDate(dateStr);
  } catch {
    // Ignore localStorage errors
  }
}

function getMostRecentLocalClosingBalance(excludeDate: string): number {
  try {
    const dates = getStoredDates();
    for (const d of dates) {
      if (d !== excludeDate) {
        const bal = getLocalBalance(d);
        if (bal && typeof bal.closingBalance === 'number') {
          return bal.closingBalance;
        }
      }
    }
  } catch {
    // Ignore
  }
  return 0;
}

function isPermissionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    code.includes('permission-denied') ||
    msg.includes('missing or insufficient permissions') ||
    msg.includes('permission')
  );
}

/**
 * Loads today's opening balance from Firestore or localStorage fallback.
 */
export async function getDailyBalance(todayStr: string): Promise<BalanceResult> {
  // Check local storage first as potential fast fallback
  const localToday = getLocalBalance(todayStr);

  try {
    const balanceDocRef = doc(db, 'dailyBalances', todayStr);
    const docSnap = await getDoc(balanceDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DailyBalanceData;
      const opening = Number(data.openingBalance) || 0;
      saveLocalBalance(todayStr, {
        openingBalance: opening,
        closingBalance: data.closingBalance,
        date: todayStr,
      });
      return {
        openingBalance: opening,
        closingBalance: data.closingBalance,
        source: 'cloud',
      };
    }

    // No balance for today in Firestore; check previous day's closing balance
    const balancesCol = collection(db, 'dailyBalances');
    const balancesQuery = query(balancesCol, orderBy('date', 'desc'), limit(1));
    const querySnapshot = await getDocs(balancesQuery);

    let carriedBalance = 0;
    if (!querySnapshot.empty) {
      const lastBalanceDoc = querySnapshot.docs[0].data() as DailyBalanceData;
      carriedBalance = Number(lastBalanceDoc.closingBalance) || 0;
    } else {
      // Fallback to local storage for previous closing balance if Firestore collection is empty
      carriedBalance = getMostRecentLocalClosingBalance(todayStr);
    }

    // Attempt to persist today's opening balance in Firestore
    try {
      await setDoc(balanceDocRef, {
        openingBalance: carriedBalance,
        date: todayStr,
      }, { merge: true });
    } catch {
      // If saving fails, we still continue with local save
    }

    saveLocalBalance(todayStr, {
      openingBalance: carriedBalance,
      closingBalance: carriedBalance,
      date: todayStr,
    });

    return {
      openingBalance: carriedBalance,
      closingBalance: carriedBalance,
      source: 'cloud',
      carriedOver: carriedBalance > 0,
    };
  } catch (err: any) {
    if (isPermissionError(err)) {
      console.warn(
        "Firestore 'dailyBalances' collection permissions not configured. Operating in resilient local storage mode."
      );
    } else {
      console.warn("Could not reach Firestore for daily balances. Using local storage:", err);
    }

    // Graceful fallback to local storage
    if (localToday) {
      return {
        openingBalance: localToday.openingBalance,
        closingBalance: localToday.closingBalance,
        source: 'local',
      };
    }

    const prevClosing = getMostRecentLocalClosingBalance(todayStr);
    saveLocalBalance(todayStr, {
      openingBalance: prevClosing,
      closingBalance: prevClosing,
      date: todayStr,
    });

    return {
      openingBalance: prevClosing,
      closingBalance: prevClosing,
      source: 'local',
      carriedOver: prevClosing > 0,
    };
  }
}

/**
 * Saves today's opening and calculated closing balance.
 * Saves to localStorage immediately, and attempts to sync to Firestore.
 */
export async function updateDailyBalance(
  todayStr: string,
  openingBalance: number,
  closingBalance: number
): Promise<{ success: boolean; syncedToCloud: boolean; reason?: string }> {
  // 1. Save to local storage immediately
  saveLocalBalance(todayStr, {
    openingBalance,
    closingBalance,
    date: todayStr,
    updatedAt: new Date().toISOString(),
  });

  // 2. Attempt to sync with Firestore
  try {
    const balanceDocRef = doc(db, 'dailyBalances', todayStr);
    await setDoc(
      balanceDocRef,
      {
        openingBalance,
        closingBalance,
        date: todayStr,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { success: true, syncedToCloud: true };
  } catch (err: any) {
    if (isPermissionError(err)) {
      console.warn(
        "Firestore 'dailyBalances' permissions not configured. Balance saved locally in browser storage."
      );
      return { success: true, syncedToCloud: false, reason: 'permissions' };
    }
    console.warn("Could not sync balance to Firestore, saved locally:", err);
    return { success: true, syncedToCloud: false, reason: 'network' };
  }
}
