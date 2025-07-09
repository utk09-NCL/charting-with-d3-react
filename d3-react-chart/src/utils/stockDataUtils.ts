// Utilities for generating historical stock data
export interface HistoricalDataPoint {
  date: Date;
  price: number;
}

export function generateHistoricalData(
  currentPrice: number,
  points: number = 30,
  volatility: number = 0.1
): HistoricalDataPoint[] {
  const now = new Date();

  return Array.from({ length: points }).map((_, i) => {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - (points - 1 - i) * 2);

    const trendFactor = i / (points - 1);
    const basePrice = currentPrice * 0.7;
    const priceRange = currentPrice - basePrice;

    const randomVariation = currentPrice * volatility * (Math.random() - 0.5);

    return {
      date: date,
      price: basePrice + priceRange * trendFactor + randomVariation,
    };
  });
}

export function getDateRangeString(data: HistoricalDataPoint[]): string {
  if (!data.length) return "";

  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;

  const formatDate = (date: Date): string => {
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${month} ${day} ${time}`;
  };

  const today = new Date();
  if (
    firstDate.getDate() === today.getDate() &&
    firstDate.getMonth() === today.getMonth() &&
    firstDate.getFullYear() === today.getFullYear() &&
    lastDate.getDate() === today.getDate() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getFullYear() === today.getFullYear()
  ) {
    return `Today, ${formatDate(firstDate)} - ${formatDate(lastDate)}`;
  }

  const year = lastDate.getFullYear();
  return `${formatDate(firstDate)} - ${formatDate(lastDate)}, ${year}`;
}

export function getPriceChangeStats(data: HistoricalDataPoint[]): {
  changeValue: number;
  changePercent: number;
  isPositive: boolean;
} {
  if (data.length < 2) {
    return { changeValue: 0, changePercent: 0, isPositive: true };
  }

  const startPrice = data[0].price;
  const endPrice = data[data.length - 1].price;

  const changeValue = endPrice - startPrice;
  const changePercent = (changeValue / startPrice) * 100;

  return {
    changeValue,
    changePercent,
    isPositive: changeValue >= 0,
  };
}
