import { WebSocketServer } from "ws";
import {
  initializeMarketData,
  getCurrentStockData,
  getStockBySymbol,
  generatePriceMovements,
  updateAllStockPrices,
  updateSingleStockPrice,
  getRandomMarketNews,
} from "./stocksData.js";

const PORT = 4005;
const HOST = "localhost";
const TIMERS = {
  ALL_STOCKS_UPDATE: 30000, // 30 seconds - Full market update
  SINGLE_STOCK_UPDATE: 1000, // 1 second - Individual stock update
  PING_INTERVAL: 12000, // 12 seconds - Health check ping
  MARKET_NEWS_UPDATE: 20000, // 20 seconds - Market news/alerts
  CONNECTION_TIMEOUT: 30000, // 30 seconds - Connection timeout
};

const clients = new Map();
// Track all interval IDs for proper cleanup
const activeIntervals = [];

const wsServer = new WebSocketServer({
  port: PORT,
  host: HOST,
});

// Function to broadcast message to all clients
const broadcast = (message) => {
  clients.forEach((_clientData, client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Function to send automatic stock updates to all clients
const sendAutomaticUpdates = () => {
  // Send updates for ALL stocks every 10 seconds
  const allStocksInterval = setInterval(() => {
    const updatedStocks = updateAllStockPrices();

    // Broadcast updated stock data to all clients
    broadcast({
      type: "STOCK_UPDATE_ALL",
      data: updatedStocks,
      marketStatus: "OPEN",
      timestamp: new Date().toISOString(),
    });
  }, TIMERS.ALL_STOCKS_UPDATE);
  activeIntervals.push(allStocksInterval);

  // Send update for ONE random stock every second
  const singleStockInterval = setInterval(() => {
    const updatedStock = updateSingleStockPrice();

    // Broadcast single stock update to all clients
    broadcast({
      type: "STOCK_UPDATE_SINGLE",
      data: updatedStock,
      timestamp: new Date().toISOString(),
    });
  }, TIMERS.SINGLE_STOCK_UPDATE);
  activeIntervals.push(singleStockInterval);

  // Send market news/alerts every 30 seconds
  const newsInterval = setInterval(() => {
    const newsData = getRandomMarketNews();
    broadcast({
      type: "MARKET_NEWS",
      data: newsData,
      timestamp: new Date().toISOString(),
    });
  }, TIMERS.MARKET_NEWS_UPDATE);
  activeIntervals.push(newsInterval);
};

// Function to handle PING/PONG with connection monitoring
const handlePingPong = (ws, clientId) => {
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
      // Update last ping time
      const clientData = clients.get(ws);
      if (clientData) {
        clientData.lastPing = Date.now();
      }
    } else {
      clearInterval(pingInterval);
    }
  }, TIMERS.PING_INTERVAL);
  activeIntervals.push(pingInterval);

  ws.on("pong", () => {
    const clientData = clients.get(ws);
    if (clientData) {
      clientData.lastPong = Date.now();
      clientData.latency = clientData.lastPong - clientData.lastPing;
    }
    console.log(`Received pong from client ${clientData?.id || "unknown"}`);
  });

  return pingInterval;
};

wsServer.on("connection", (ws) => {
  const clientId = `client_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;
  console.log(`New client connected: ${clientId}`);

  // Add client to the pool with metadata
  clients.set(ws, {
    id: clientId,
    connectedAt: new Date().toISOString(),
    lastPing: null,
    lastPong: null,
    latency: null,
    subscribedStocks: [], // For subscription feature
    messageCount: 0,
  });

  console.log(`Total clients connected: ${clients.size}`);

  // Start ping/pong for this client
  const pingInterval = handlePingPong(ws, clientId);

  // Send initial welcome message
  const currentStocks = getCurrentStockData();
  ws.send(
    JSON.stringify({
      type: "INITIAL_MESSAGE",
      data: {
        welcome: "Welcome to the Stock WebSocket server!",
        clientId: clientId,
        serverTime: new Date().toISOString(),
        availableCommands: [
          "GET_STOCK_DATA_OF_ALL",
          "GET_STOCK_PRICE_BY_SYMBOL",
          "SUBSCRIBE_TO_STOCK",
          "UNSUBSCRIBE_FROM_STOCK",
          "GET_MARKET_STATUS",
          "PING",
        ],
      },
      stockData: currentStocks,
      marketStatus: "OPEN",
      timestamp: new Date().toISOString(),
    })
  );

  // Handle incoming messages from the client
  ws.on("message", (message) => {
    try {
      const clientData = clients.get(ws);
      clientData.messageCount++;

      console.log(`Received message from ${clientData.id}: ${message}`);

      // Try to parse JSON message
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
      } catch (e) {
        parsedMessage = { type: "TEXT", data: message.toString() };
      }

      const { type, data } = parsedMessage;
      console.log(
        `Client ${clientData.id} - Message type: ${type}, data: ${data}`
      );

      switch (type) {
        case "GET_STOCK_DATA_OF_ALL":
          const allStocks = getCurrentStockData();
          ws.send(
            JSON.stringify({
              type: "ALL_STOCK_DATA",
              data: allStocks,
              marketStatus: "OPEN",
              totalStocks: allStocks.length,
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case "GET_STOCK_PRICE_BY_SYMBOL":
          const requestedStock = getStockBySymbol(data);
          if (requestedStock) {
            const priceData = generatePriceMovements(
              requestedStock.price,
              requestedStock.symbol
            );
            const freshStock = {
              ...requestedStock,
              ...priceData,
              volume: Math.floor(Math.random() * 100000) + 10000,
              time: new Date().toISOString(),
            };
            ws.send(
              JSON.stringify({
                type: "SINGLE_STOCK_DATA",
                data: freshStock,
                symbol: data,
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            const allStocks = getCurrentStockData();
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: `Stock symbol '${data}' not found`,
                availableSymbols: allStocks.map((s) => s.symbol),
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "SUBSCRIBE_TO_STOCK":
          if (!clientData.subscribedStocks.includes(data)) {
            clientData.subscribedStocks.push(data);
            ws.send(
              JSON.stringify({
                type: "SUBSCRIPTION_CONFIRMED",
                symbol: data,
                message: `Subscribed to ${data} updates`,
                subscribedStocks: clientData.subscribedStocks,
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "UNSUBSCRIBE_FROM_STOCK":
          clientData.subscribedStocks = clientData.subscribedStocks.filter(
            (s) => s !== data
          );
          ws.send(
            JSON.stringify({
              type: "UNSUBSCRIPTION_CONFIRMED",
              symbol: data,
              message: `Unsubscribed from ${data} updates`,
              subscribedStocks: clientData.subscribedStocks,
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case "GET_MARKET_STATUS":
          ws.send(
            JSON.stringify({
              type: "MARKET_STATUS",
              data: {
                status: "OPEN",
                serverTime: new Date().toISOString(),
                totalClients: clients.size,
                uptime: process.uptime(),
                clientStats: {
                  id: clientData.id,
                  connectedAt: clientData.connectedAt,
                  messageCount: clientData.messageCount,
                  latency: clientData.latency,
                  subscribedStocks: clientData.subscribedStocks,
                },
              },
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case "PING":
          ws.send(
            JSON.stringify({
              type: "PONG",
              clientId: clientData.id,
              serverTime: new Date().toISOString(),
              timestamp: new Date().toISOString(),
            })
          );
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "ECHO",
              data: `Server received: ${message}`,
              clientId: clientData.id,
              timestamp: new Date().toISOString(),
            })
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Failed to process message",
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      );
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    const clientData = clients.get(ws);
    console.log(`Client disconnected: ${clientData?.id || "unknown"}`);
    clients.delete(ws);
    clearInterval(pingInterval);
    console.log(`Total clients connected: ${clients.size}`);
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    const clientData = clients.get(ws);
    console.error(
      `WebSocket client error (${clientData?.id || "unknown"}):`,
      error
    );
    clients.delete(ws);
    clearInterval(pingInterval);
  });
});

wsServer.on("error", (error) => {
  console.error(`WebSocket server error: ${error.message}`);
});

// Initialize market data
initializeMarketData();

// Start sending automatic updates
sendAutomaticUpdates();

// Server startup messages
console.log(`🚀 WebSocket server is running on ws://${HOST}:${PORT}`);
console.log("📊 Server features:");
console.log(
  `- All stock updates every ${TIMERS.ALL_STOCKS_UPDATE / 1000} seconds`
);
console.log(
  `- Single random stock updates every ${
    TIMERS.SINGLE_STOCK_UPDATE / 1000
  } seconds`
);
console.log(
  `- Market news updates every ${TIMERS.MARKET_NEWS_UPDATE / 1000} seconds`
);
console.log(
  `- Health check pings every ${TIMERS.PING_INTERVAL / 1000} seconds`
);
console.log("- Realistic price movements with trends");
console.log("- Client subscription management");
console.log("- Enhanced error handling and logging");
console.log("📈 Ready for React development!");

// Function to close the server
function shutdownServer() {
  console.log("\n🛑 Shutting down WebSocket server...");

  // Clear all interval timers
  console.log(`Clearing ${activeIntervals.length} active intervals...`);
  activeIntervals.forEach((interval) => clearInterval(interval));

  // Close the WebSocket server
  wsServer.close(() => {
    console.log("✅ WebSocket server closed successfully");
    process.exit(1);
  });

  // Force exit after 1 second if server doesn't close gracefully
  setTimeout(() => {
    console.log("⚠️ Forcing shutdown after timeout");
    process.exit(1);
  }, 1000);
}

// Cleanup on process termination
process.on("SIGINT", shutdownServer);
process.on("SIGTERM", shutdownServer);
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdownServer();
});
