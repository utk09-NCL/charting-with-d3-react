import { useWebSocket } from "./hooks/useWebSocket";
import { StockList } from "./components/StockList";
import { LiveDataFeed } from "./components/LiveDataFeed";
import { MarketNews } from "./components/MarketNews";
import { StockChart } from "./components/StockChart";
import "./App.css";

const App = () => {
  const { connected, stocks, newsItems, error } = useWebSocket();

  return (
    <div className="app">
      <div className="main-content">
        <h1>D3 Stock Chart</h1>
        <div className="chart-area">
          {error ? (
            <div className="error">{error}</div>
          ) : !connected ? (
            <div className="loading">Connecting to server...</div>
          ) : (
            <>
              <div className="info-message">
                Please wait at least 10 seconds before selecting a stock to see
                real-time data
              </div>
              <div className="chart-area">
                <StockChart stocks={stocks} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="data-sidebar">
        {connected ? (
          <>
            <div className="sidebar-section stock-overview">
              <StockList stocks={stocks} />
            </div>
            <div className="sidebar-section live-feed">
              <LiveDataFeed stocks={stocks} />
            </div>
            <div className="sidebar-section market-news-section">
              <MarketNews newsItems={newsItems} />
            </div>
          </>
        ) : (
          <div>Waiting for connection...</div>
        )}
      </div>
    </div>
  );
};

export default App;
