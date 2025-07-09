import React from "react";
import type { NewsObject } from "../hooks/useWebSocket";

type MarketNewsProps = {
  newsItems: NewsObject[];
};

export const MarketNews: React.FC<MarketNewsProps> = ({ newsItems }) => {
  if (!newsItems || newsItems.length === 0) {
    return (
      <div className="market-news">
        <h3>Market News</h3>
        <div className="news-empty">Waiting for market news...</div>
      </div>
    );
  }

  return (
    <div className="market-news">
      <h3>Market News</h3>
      <div className="news-content">
        {newsItems.map((newsItem, index) => (
          <div
            key={index}
            className={`news-item ${newsItem.severity.toLowerCase()}`}
          >
            <span className="news-text">{newsItem.headline}</span>
            {newsItem.category && (
              <span className="news-category">{newsItem.category}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
