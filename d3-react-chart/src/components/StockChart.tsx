import { useEffect, useMemo, useRef, useState } from "react";
import type { Stock } from "../hooks/useWebSocket";
import * as d3 from "d3";
import {
  getStockHistory,
  hasEnoughHistoricalData,
} from "../utils/sessionStorageUtils";

type StockChartProps = {
  stocks: Stock[];
};

const WAIT_TIME_FOR_DATA = 10;

const margin = { top: 40, right: 30, bottom: 50, left: 60 };

export const StockChart: React.FC<StockChartProps> = ({ stocks }) => {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const waitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedStock) {
      if (hasEnoughHistoricalData(selectedStock, 5)) {
        setDataReady(true);
      } else {
        setDataReady(false);

        if (waitTimerRef.current) {
          window.clearTimeout(waitTimerRef.current);
        }

        waitTimerRef.current = window.setTimeout(() => {
          if (hasEnoughHistoricalData(selectedStock, 5)) {
            setDataReady(true);
          }
        }, WAIT_TIME_FOR_DATA * 1000);
      }
    }

    return () => {
      if (waitTimerRef.current) {
        window.clearTimeout(waitTimerRef.current);
      }
    };
  }, [selectedStock]);

  const stockData = selectedStock
    ? stocks.find((eachStock) => eachStock.symbol === selectedStock)
    : null;

  const historicalData = useMemo(() => {
    if (!selectedStock || !stockData) {
      return [];
    }

    const storageData = getStockHistory(selectedStock);

    if (storageData.length < 5) {
      return [];
    }

    return storageData.map((entry) => ({
      date: new Date(entry.timestamp),
      price: entry.price,
    }));
  }, [selectedStock, stockData]);

  const handleStockChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStock(event.target.value);
  };

  return (
    <div className="stock-chart-container">
      <div className="chart-controls">
        <select
          value={selectedStock || ""}
          onChange={handleStockChange}
          className="stock-selector"
        >
          <option value="">Select a stock</option>
          {stocks.map((stock) => (
            <option key={stock.id} value={stock.symbol}>
              {stock.symbol} : {stock.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
