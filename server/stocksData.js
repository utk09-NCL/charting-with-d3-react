export const MARKET_CONFIG = {
  VOLATILITY_FACTOR: 0.05, // 5% max price change per update
  MIN_PRICE: 10, // Minimum stock price
  MAX_PRICE: 2000, // Maximum stock price
  TRENDING_PROBABILITY: 0.7, // 70% chance stock continues trend
};

const STOCKLIST = [
  { id: "1", symbol: "AAPL", name: "Apple Inc." },
  { id: "2", symbol: "GOOGL", name: "Alphabet Inc." },
  { id: "3", symbol: "AMZN", name: "Amazon.com Inc." },
  { id: "4", symbol: "MSFT", name: "Microsoft Corporation" },
  { id: "5", symbol: "TSLA", name: "Tesla Inc." },
  { id: "6", symbol: "NFLX", name: "Netflix Inc." },
  { id: "7", symbol: "META", name: "Meta Platforms Inc." },
  { id: "8", symbol: "NVDA", name: "NVIDIA Corporation" },
  { id: "9", symbol: "BRK.A", name: "Berkshire Hathaway Inc." },
  { id: "10", symbol: "V", name: "Visa Inc." },
  { id: "11", symbol: "JPM", name: "JPMorgan Chase & Co." },
  { id: "12", symbol: "UNH", name: "UnitedHealth Group Incorporated" },
  { id: "13", symbol: "PG", name: "Procter & Gamble Co." },
  { id: "14", symbol: "HD", name: "The Home Depot Inc." },
  { id: "15", symbol: "DIS", name: "The Walt Disney Company" },
];

export const MARKET_NEWS = [
  "Market opens strong with tech stocks leading gains",
  "Federal Reserve hints at interest rate changes",
  "Energy sector shows volatility amid global tensions",
  "MLH Global Hack Week Season Launch sees the new season mascot",
  "Healthcare stocks reach new quarterly highs",
  "Consumer spending data exceeds expectations",
  "Tech earnings beat expectations across the board",
  "Oil prices surge amid supply chain concerns",
  "Inflation concerns impact market sentiment",
  "Earnings season shows mixed results",
  "Tech giants announce major product launches",
  "Major League Hacking announces new season launch",
  "MLH DataHackfest 2025 registrations are now open",
  "MLH announces new mentorship program for students",
  "MLH partners with leading universities for hackathon events",
  "MLH announces new sponsorship opportunities for companies",
];

let marketTrends = new Map(); // Track if stocks are trending up/down
let currentStockData = null;

// Initialize stock data with starting prices
const generateRandomStockData = () => {
  return STOCKLIST.map((stock) => ({
    id: stock.id,
    symbol: stock.symbol,
    name: stock.name,
    price: +(Math.random() * 1000).toFixed(2),
    change: 0,
    changePercent: 0,
    trend: Math.random() > 0.5 ? "up" : "down",
    volume: Math.floor(Math.random() * 1000000) + 100000,
    time: new Date().toISOString(),
  }));
};

// Initialize market data and trends
export const initializeMarketData = () => {
  currentStockData = generateRandomStockData();

  // Initialize market trends for each stock
  currentStockData.forEach((stock) => {
    marketTrends.set(stock.symbol, {
      direction: Math.random() > 0.5 ? "up" : "down",
      strength: Math.random(), // 0-1, how strong the trend is
      lastPrice: stock.price,
      dayChange: 0,
      dayChangePercent: 0,
    });
  });

  return currentStockData;
};

// Get current stock data
export const getCurrentStockData = () => {
  if (!currentStockData) {
    return initializeMarketData();
  }
  return currentStockData;
};

// Find stock by symbol
export const getStockBySymbol = (symbol) => {
  const stockData = getCurrentStockData();
  return stockData.find(
    (stock) => stock.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

// Generate price movements based on trends
export const generatePriceMovements = (currentPrice, symbol) => {
  const trend = marketTrends.get(symbol);
  if (!trend) {
    // Fallback if trend doesn't exist
    return {
      price: +currentPrice.toFixed(2),
      change: 0,
      changePercent: 0,
    };
  }

  const volatility = MARKET_CONFIG.VOLATILITY_FACTOR;

  // Base random change
  let changePercent = (Math.random() - 0.5) * volatility * 2;

  // Apply trend influence
  if (Math.random() < MARKET_CONFIG.TRENDING_PROBABILITY) {
    changePercent +=
      trend.direction === "up"
        ? Math.random() * volatility * trend.strength
        : -Math.random() * volatility * trend.strength;
  }
  // Calculate new price
  let newPrice = currentPrice * (1 + changePercent);

  // Apply bounds
  newPrice = Math.max(
    MARKET_CONFIG.MIN_PRICE,
    Math.min(MARKET_CONFIG.MAX_PRICE, newPrice)
  );

  return {
    price: +newPrice.toFixed(2),
    change: +(newPrice - trend.lastPrice).toFixed(2),
    changePercent: +(
      ((newPrice - trend.lastPrice) / trend.lastPrice) *
      100
    ).toFixed(2),
  };
};

// Update market trends randomly
export const updateMarketTrends = () => {
  marketTrends.forEach((trend, symbol) => {
    // 30% chance to change trend direction
    if (Math.random() < 0.3) {
      trend.direction = trend.direction === "up" ? "down" : "up";
      trend.strength = Math.random();
    }
  });
};

// Update all stock prices with movements
export const updateAllStockPrices = () => {
  if (!currentStockData) {
    currentStockData = initializeMarketData();
  }

  // Update market trends occasionally
  updateMarketTrends();

  // Generate price updates
  currentStockData = currentStockData.map((stock) => {
    const priceData = generatePriceMovements(stock.price, stock.symbol);
    const trend = marketTrends.get(stock.symbol);

    // Update trend tracking
    trend.lastPrice = priceData.price;
    trend.dayChange = priceData.change;
    trend.dayChangePercent = priceData.changePercent;

    return {
      ...stock,
      price: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
      trend: trend.direction,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      time: new Date().toISOString(),
    };
  });

  return currentStockData;
};

// Update single stock price
export const updateSingleStockPrice = (stockIndex = null) => {
  if (!currentStockData) {
    currentStockData = initializeMarketData();
  }

  // Pick random stock if no index provided
  const randomIndex =
    stockIndex !== null
      ? stockIndex
      : Math.floor(Math.random() * currentStockData.length);
  const randomStock = currentStockData[randomIndex];

  // Generate price update
  const priceData = generatePriceMovements(
    randomStock.price,
    randomStock.symbol
  );
  const trend = marketTrends.get(randomStock.symbol);

  // Update trend tracking
  trend.lastPrice = priceData.price;

  const updatedStock = {
    ...randomStock,
    price: priceData.price,
    change: priceData.change,
    changePercent: priceData.changePercent,
    trend: trend.direction,
    volume: Math.floor(Math.random() * 50000) + 10000,
    time: new Date().toISOString(),
  };

  // Update the stock in our current data
  currentStockData[randomIndex] = updatedStock;

  return updatedStock;
};

// Get random market news
export const getRandomMarketNews = () => {
  const randomNews =
    MARKET_NEWS[Math.floor(Math.random() * MARKET_NEWS.length)];
  return {
    headline: randomNews,
    severity: Math.random() > 0.7 ? "HIGH" : "NORMAL",
    category: ["ECONOMIC", "CORPORATE", "TECHNICAL", "GLOBAL"][
      Math.floor(Math.random() * 4)
    ],
  };
};
