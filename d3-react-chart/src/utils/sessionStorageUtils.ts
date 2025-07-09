import type { Stock } from "../hooks/useWebSocket";

export interface StockHistoryEntry {
  symbol: string;
  price: number;
  timestamp: string;
}

const MAX_HISTORY_ENTRIES = 100;

// Session storage keys
const STORAGE_KEYS = {
  STOCKS_HISTORY: "stocksDataHistory",
  LAST_UPDATED: "stocksDataLastUpdated",
};

export const initializeStockStorage = (): void => {
  if (!sessionStorage.getItem(STORAGE_KEYS.STOCKS_HISTORY)) {
    sessionStorage.setItem(STORAGE_KEYS.STOCKS_HISTORY, JSON.stringify({}));
    sessionStorage.setItem(
      STORAGE_KEYS.LAST_UPDATED,
      JSON.stringify(new Date().toISOString())
    );
  }
};

export const storeStockUpdate = (stock: Stock): void => {
  try {
    const historyRaw = sessionStorage.getItem(STORAGE_KEYS.STOCKS_HISTORY);
    const history: Record<string, StockHistoryEntry[]> = historyRaw
      ? JSON.parse(historyRaw)
      : {};

    const newEntry: StockHistoryEntry = {
      symbol: stock.symbol,
      price: stock.price,
      timestamp: new Date().toISOString(),
    };

    if (!history[stock.symbol]) {
      history[stock.symbol] = [];
    }

    const mostRecentEntry = history[stock.symbol][0];
    if (!mostRecentEntry || mostRecentEntry.price !== stock.price) {
      history[stock.symbol] = [newEntry, ...history[stock.symbol]].slice(
        0,
        MAX_HISTORY_ENTRIES
      );
    }

    history[stock.symbol] = [newEntry, ...history[stock.symbol]].slice(
      0,
      MAX_HISTORY_ENTRIES
    );

    sessionStorage.setItem(
      STORAGE_KEYS.STOCKS_HISTORY,
      JSON.stringify(history)
    );
    sessionStorage.setItem(
      STORAGE_KEYS.LAST_UPDATED,
      JSON.stringify(new Date().toISOString())
    );
  } catch (error) {
    console.error("Error storing stock update:", error);
  }
};

export const storeMultipleStockUpdates = (stocks: Stock[]): void => {
  stocks.forEach((stock) => storeStockUpdate(stock));
};

export const getStockHistory = (symbol: string): StockHistoryEntry[] => {
  try {
    const historyRaw = sessionStorage.getItem(STORAGE_KEYS.STOCKS_HISTORY);
    const history: Record<string, StockHistoryEntry[]> = historyRaw
      ? JSON.parse(historyRaw)
      : {};
    return history[symbol] || [];
  } catch (error) {
    console.error("Error retrieving stock history:", error);
    return [];
  }
};

export const hasEnoughHistoricalData = (
  symbol: string,
  minEntries: number = 10
): boolean => {
  const history = getStockHistory(symbol);
  return history.length >= minEntries;
};

export const getStoredStockSymbols = (): string[] => {
  try {
    const historyRaw = sessionStorage.getItem(STORAGE_KEYS.STOCKS_HISTORY);
    const history: Record<string, StockHistoryEntry[]> = historyRaw
      ? JSON.parse(historyRaw)
      : {};
    return Object.keys(history);
  } catch (error) {
    console.error("Error retrieving stored stock symbols:", error);
    return [];
  }
};

export const getStockPriceChangeStats = (
  symbol: string
): {
  changeValue: number;
  changePercent: number;
  isPositive: boolean;
} => {
  const history = getStockHistory(symbol);

  if (history.length < 2) {
    return { changeValue: 0, changePercent: 0, isPositive: true };
  }

  const latestPrice = history[0].price;
  const oldestPrice = history[history.length - 1].price;

  const changeValue = latestPrice - oldestPrice;
  const changePercent = (changeValue / oldestPrice) * 100;

  return {
    changeValue,
    changePercent,
    isPositive: changeValue >= 0,
  };
};

export const getTimeRangeString = (symbol: string): string => {
  const history = getStockHistory(symbol);

  if (history.length < 2) {
    return "Insufficient data";
  }

  const latestTime = new Date(history[0].timestamp);
  const oldestTime = new Date(history[history.length - 1].timestamp);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return `${formatTime(oldestTime)} - ${formatTime(latestTime)}`;
};

export const logStoredHistory = (symbol?: string): void => {
  try {
    const historyRaw = sessionStorage.getItem(STORAGE_KEYS.STOCKS_HISTORY);
    const history: Record<string, StockHistoryEntry[]> = historyRaw
      ? JSON.parse(historyRaw)
      : {};

    if (symbol) {
      console.log(`History for ${symbol}:`, history[symbol] || []);
    } else {
      console.log("All stored history:", history);
    }
  } catch (error) {
    console.error("Error logging history:", error);
  }
};
