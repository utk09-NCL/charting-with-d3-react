import React, { useState, useEffect, useRef } from "react";
import type { Stock } from "../hooks/useWebSocket";

const MAX_FEED_ITEMS = 15; // Maximum number of items to keep in feed
const MAX_ITEMS_PER_UPDATE = 3; // Maximum number of stocks to add per update
const PRICE_DECIMALS = 2; // Number of decimal places for price display
const CHANGE_DECIMALS = 2; // Number of decimal places for change display

type LiveDataFeedProps = {
  stocks: Stock[];
};

type FeedItem = {
  stock: Stock;
  timestamp: string;
};

export const LiveDataFeed: React.FC<LiveDataFeedProps> = ({ stocks }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const prevStocksRef = useRef<Stock[]>([]);

  useEffect(() => {
    // Skip processing if no stocks data
    if (stocks.length === 0) return;

    // Skip the first render (initial data load)
    if (prevStocksRef.current.length === 0) {
      prevStocksRef.current = stocks;
      return;
    }

    // Find stocks with changed prices
    const changedStocks = stocks.filter((newStock) => {
      const prevStock = prevStocksRef.current.find((s) => s.id === newStock.id);
      return prevStock && prevStock.price !== newStock.price;
    });

    // Process changed stocks
    if (changedStocks.length > 0) {
      const sortedChanges = [...changedStocks].sort(
        (a, b) => Math.abs(b.change) - Math.abs(a.change)
      );

      const currentTimestamp = new Date().toLocaleTimeString();

      const newFeedItems = sortedChanges
        .slice(0, MAX_ITEMS_PER_UPDATE)
        .map((stock) => ({
          stock,
          timestamp: currentTimestamp,
        }));

      // Update the feed, keeping only the most recent items
      setFeed((prev) => [...newFeedItems, ...prev].slice(0, MAX_FEED_ITEMS));
    }

    // Store current stocks for next comparison
    prevStocksRef.current = stocks;
  }, [stocks]);

  // Show waiting message if feed is empty
  if (feed.length === 0) {
    return (
      <div className="live-data-feed">
        <h3>Live Updates</h3>
        <div className="live-feed-empty">Waiting for stock updates...</div>
      </div>
    );
  }

  return (
    <div className="live-data-feed">
      <h3>
        Live Updates <span className="update-indicator">●</span>
      </h3>
      <div className="feed-container">
        {feed.map((item, index) => {
          const isLatest = index === 0;
          const isPositiveChange = item.stock.change >= 0;
          const changePrefix = isPositiveChange ? "+" : "";

          return (
            <div
              key={index}
              className={`feed-item ${isLatest ? "latest-update" : ""}`}
            >
              <span className="feed-time">{item.timestamp}</span>
              <span className="feed-symbol">{item.stock.symbol}</span>
              <span
                className={`feed-price ${
                  isPositiveChange ? "positive" : "negative"
                }`}
              >
                ${item.stock.price.toFixed(PRICE_DECIMALS)}
              </span>
              <span
                className={`feed-change ${
                  isPositiveChange ? "positive" : "negative"
                }`}
              >
                {changePrefix}
                {item.stock.change.toFixed(CHANGE_DECIMALS)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
