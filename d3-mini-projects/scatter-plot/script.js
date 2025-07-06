// Chart Configuration
const margin = { top: 10, right: 20, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

function generateScatterData(count = 100) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const category = Math.floor(Math.random() * 3); // random values: 0, 1, 2
    let x, y;
    if (category === 0) {
      x = Math.random() * 60 + 20;
      y = x * 0.8 + Math.random() * 20 + 10;
    } else if (category === 1) {
      x = Math.random() * 60 + 20;
      y = 100 - x * 0.6 + Math.random() * 15;
    } else {
      x = Math.random() * 80 + 10;
      y = Math.random() * 80 + 10;
    }
    data.push({ id: i, x, y, category });
  }
  return data;
}

let data = generateScatterData();

const svg = d3.select("#scatter-plot").attr("width", 800).attr("height", 500);

const chartGroup = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3
  .scaleLinear()
  .domain(d3.extent(data, (d) => d.x))
  .range([0, width]);

const yScale = d3
  .scaleLinear()
  .domain(d3.extent(data, (d) => d.y))
  .range([height, 0]);

const colorScale = d3
  .scaleOrdinal()
  .domain([0, 1, 2])
  .range(["#3498db", "#e74c3c", "#2ecc71"]); // positive, negative, random

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

const xAxisGroup = chartGroup
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .call(xAxis);

const yAxisGroup = chartGroup.append("g").call(yAxis);

const pointsGroup = chartGroup.append("g");

// Track the current zoom transform
let currentTransform = d3.zoomIdentity;

const zoom = d3
  .zoom()
  .scaleExtent([0.5, 10]) // Set zoom scale limits
  .on("zoom", (event) => {
    currentTransform = event.transform;
    const zx = currentTransform.rescaleX(xScale);
    const zy = currentTransform.rescaleY(yScale);
    xAxisGroup.call(xAxis.scale(zx));
    yAxisGroup.call(yAxis.scale(zy));
    pointsGroup
      .selectAll("circle")
      .attr("cx", (d) => zx(d.x))
      .attr("cy", (d) => zy(d.y));
  });

svg.call(zoom);

const brush = d3
  .brush()
  .extent([
    [0, 0],
    [width, height],
  ])
  .on("brush end", (event) => {
    const sel = event.selection;
    if (!sel) {
      pointsGroup.selectAll("circle").attr("stroke", null);
      return;
    }
    const [[x0, y0], [x1, y1]] = sel;

    // Use zoomed scales for selection
    const zx = currentTransform.rescaleX(xScale);
    const zy = currentTransform.rescaleY(yScale);

    // Find selected data points
    const selected = data.filter((d) => {
      const cx = zx(d.x),
        cy = zy(d.y);
      return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    });

    pointsGroup.selectAll("circle").attr("stroke", (d) => {
      const cx = zx(d.x),
        cy = zy(d.y);
      return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1 ? "#000" : null;
    });

    // Show alert on brush end, not during brushing
    if (event.type === "end" && selected.length > 0) {
      const yValues = selected.map((d) => d.y);
      const sum = d3.sum(yValues);
      const avg = d3.mean(yValues);
      const median = d3.median(yValues);
      alert(
        `Selected ${selected.length} circles.\n` +
          `Values: ${selected
            .map((d) => `(${d.x.toFixed(2)}, ${d.y.toFixed(2)})`)
            .join(", ")}\n` +
          `Sum (y): ${sum.toFixed(2)}\n` +
          `Average (y): ${avg.toFixed(2)}\n` +
          `Median (y): ${median.toFixed(2)}`
      );
    }
  });

let brushing = false;

d3.select("#toggle-brush").on("click", function () {
  brushing = !brushing;
  if (brushing) {
    chartGroup.append("g").attr("class", "brush").call(brush);
    svg.on(".zoom", null);
    d3.select(this).text("Disable Brush");
  } else {
    chartGroup.select(".brush").remove();
    svg.call(zoom);
    d3.select(this).text("Enable Brush");
    pointsGroup.selectAll("circle").attr("stroke", null);
  }
});

d3.select("#reset-zoom").on("click", () => {
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
});

pointsGroup
  .selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", (d) => xScale(d.x))
  .attr("cy", (d) => yScale(d.y))
  .attr("r", 6)
  .attr("fill", (d) => colorScale(d.category));
