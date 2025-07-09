import { useState, useEffect } from "react";
import {
  initializeStockStorage,
  storeStockUpdate,
  storeMultipleStockUpdates,
} from "../utils/sessionStorageUtils";

export type Stock = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: string;
  volume: number;
  time: string;
};

export type NewsObject = {
  headline: string;
  severity: string;
  category: string;
  timestamp?: string;
};

// Maximum number of news items to keep
const MAX_NEWS_ITEMS = 5;

const WEB_SOCKET_URL = "ws://localhost:4005";

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newsItems, setNewsItems] = useState<NewsObject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize session storage for stock data
    initializeStockStorage();

    // Create WebSocket connection
    const ws = new WebSocket(WEB_SOCKET_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      setConnected(true);
      setError(null);

      // Request all stock data when connected
      ws.send(JSON.stringify({ type: "GET_STOCK_DATA_OF_ALL" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message.type);

        // Handle different message types
        switch (message.type) {
          case "INITIAL_MESSAGE":
            console.log("Initial stock data received");
            if (message.stockData && message.stockData.length > 0) {
              setStocks(message.stockData);
              // Store all initial stocks in session storage
              storeMultipleStockUpdates(message.stockData);
            }
            break;
          case "ALL_STOCK_DATA":
            console.log("All stock data received");
            if (message.data && message.data.length > 0) {
              setStocks(message.data);
              // Store all stocks in session storage
              storeMultipleStockUpdates(message.data);
            }
            break;
          case "STOCK_UPDATE_ALL":
            console.log("Stock update received for all stocks");
            if (message.data && message.data.length > 0) {
              setStocks(message.data);
              // Store all updated stocks in session storage
              storeMultipleStockUpdates(message.data);
            }
            break;
          case "STOCK_UPDATE_SINGLE":
            console.log(
              "Single stock update received",
              message.data?.symbol,
              "price:",
              message.data?.price
            );
            if (message.data) {
              setStocks((prevStocks) =>
                prevStocks.map((stock) =>
                  stock.id === message.data.id ? message.data : stock
                )
              );
              // Store the updated stock in session storage
              storeStockUpdate(message.data);
            }
            break;
          case "MARKET_NEWS":
            console.log("Market news received", message.data);
            if (message.data) {
              const newsWithTimestamp = {
                ...message.data,
                timestamp: new Date().toISOString(),
              };
              // Add the new news item to the top of the list, and keep only the last MAX_NEWS_ITEMS items
              setNewsItems((prevNews) =>
                [newsWithTimestamp, ...prevNews].slice(0, MAX_NEWS_ITEMS)
              );
            }
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Failed to connect to server");
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
    };

    setSocket(ws);

    // Clean up the WebSocket connection
    return () => {
      ws.close();
    };
  }, []);

  return { socket, connected, stocks, newsItems, error };
}
