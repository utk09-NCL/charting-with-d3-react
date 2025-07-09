import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Stock } from "../hooks/useWebSocket";
import * as d3 from "d3";
import {
  getStockHistory,
  hasEnoughHistoricalData,
} from "../utils/sessionStorageUtils";
import "./StockChart.css";
import {
  getPriceChangeStats,
  type HistoricalDataPoint,
} from "../utils/stockDataUtils";

type StockChartProps = {
  stocks: Stock[];
};

const WAIT_TIME_FOR_DATA = 10;
const margin = { top: 40, right: 30, bottom: 50, left: 60 };

export const StockChart: React.FC<StockChartProps> = ({ stocks }) => {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform | null>(
    null
  );
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedStock) {
      if (hasEnoughHistoricalData(selectedStock, 5)) {
        setDataReady(true);
      }
    }
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

  useEffect(() => {
    if (!tooltipRef.current) {
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.style.display = "none";
      tooltipRef.current = tooltip;
      document.body.appendChild(tooltip);
    }
  }, []);

  // TODO: Fix the unmount
  // useEffect(() => {
  //   return () => {
  //     if (tooltipRef.current) {
  //       document.body.removeChild(tooltipRef.current);
  //     }
  //   };
  // }, []);

  const drawChart = useCallback(() => {
    if (
      !svgRef.current ||
      !selectedStock ||
      !stockData ||
      historicalData.length === 0
    ) {
      return;
    }

    // console.log(`Drawing chart for ${selectedStock}`);

    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(historicalData, (d) => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(historicalData, (d) => d.price)! * 0.95,
        d3.max(historicalData, (d) => d.price)! * 1.05,
      ])
      .range([height, 0]);

    const zx = zoomTransform ? zoomTransform.rescaleX(x) : x;
    const zy = zoomTransform ? zoomTransform.rescaleY(y) : y;

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(zx)
          .ticks(5)
          .tickFormat((d) => d3.timeFormat("%H:%M:%S")(d as Date))
      );

    svg.append("g").call(d3.axisLeft(zy).tickFormat((d) => `$${d}`));

    const priceChangeState = getPriceChangeStats(historicalData);
    const changeColor = priceChangeState.isPositive ? "#0ba843" : "#be150e";

    svg
      .append("path")
      .datum(historicalData)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", changeColor)
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line<HistoricalDataPoint>()
          .x((d) => zx(d.date))
          .y((d) => zy(d.price))
          .curve(d3.curveMonotoneX)
      );

    svg
      .selectAll(".data-point")
      .data(historicalData)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", (d) => zx(d.date))
      .attr("cy", (d) => zy(d.price))
      .attr("r", 4)
      .attr("fill", changeColor)
      .on("mouseover", function (event, d: HistoricalDataPoint) {
        const tooltip = d3.select(tooltipRef.current!);
        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 25}px`)
          .html(
            `<div><b>${d3.timeFormat("%H:%M:%S")(d.date)}</b></div>
             <div>Price: $${d.price.toFixed(2)}</div>`
          );
        d3.select(this).attr("r", 7);
      })
      .on("mouseout", function () {
        d3.select(tooltipRef.current!).style("display", "none");
        d3.select(this).attr("r", 4);
      });
  }, [selectedStock, stockData, historicalData, zoomTransform]);

  useEffect(() => {
    if (
      !svgRef.current ||
      !selectedStock ||
      !stockData ||
      historicalData.length === 0
    ) {
      return;
    }

    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => {
        setZoomTransform(event.transform);
      });

    const svgSelection = d3.select(svgRef.current);
    svgSelection.call(zoom);

    svgSelection.on("dblclick.zoom", () => {
      svgSelection
        .transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
      setZoomTransform(d3.zoomIdentity);
    });
  }, [selectedStock, stockData, historicalData]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="stock-chart-container">
      <div className="chart-controls">
        <select
          value={selectedStock || ""}
          onChange={(e) => setSelectedStock(e.target.value)}
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
      <div className="chart-area">
        {!selectedStock ? (
          <div className="chart-placeholder">Please select a stock</div>
        ) : !dataReady ? (
          <div>
            Please wait for {WAIT_TIME_FOR_DATA} seconds before selecting a
            stock
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="320"
            className="d3-chart"
            style={{ minHeight: 250 }}
          ></svg>
        )}
      </div>
    </div>
  );
};
