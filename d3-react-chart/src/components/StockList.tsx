import React from "react";
import type { Stock } from "../hooks/useWebSocket";

type StockListProps = {
  stocks: Stock[];
};

export const StockList: React.FC<StockListProps> = ({ stocks }) => {
  return (
    <div className="stock-list">
      <h3>Market Overview</h3>
      <div className="compact-stock-container">
        {stocks.map((stock) => (
          <div key={stock.id} className="compact-stock-item">
            <div className="compact-stock-symbol">{stock.symbol}</div>
            <div className="compact-stock-price">${stock.price.toFixed(2)}</div>
            <div
              className={`compact-stock-change ${
                stock.change >= 0 ? "positive" : "negative"
              }`}
            >
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
