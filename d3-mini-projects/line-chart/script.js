// Chart Configuration
const margin = { top: 10, right: 20, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

let data = [];
const startDate = new Date("2025-01-01");

// Generate Initial Data
function generateInitialData() {
  data = [];
  for (let i = 0; i < 10; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i * 7); // Weekly intervals

    const values = {
      date: date,
      value: Math.random() * 80 + 20 + Math.sin(i * 0.5) * 10, // values will be between 20 and 100
    };
    data.push(values);
  }
}

generateInitialData();

// Create SVG and CHART group
const svg = d3.select("#line-chart").attr("width", 800).attr("height", 500);

const chartGroup = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Create scales
const xScale = d3.scaleTime().range([0, width]);

const yScale = d3.scaleLinear().range([height, 0]);

const line = d3
  .line()
  .x((d) => xScale(d.date))
  .y((d) => yScale(d.value))
  .curve(d3.curveMonotoneX);

// Create Axes
const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d/%m"));
const yAxis = d3.axisLeft(yScale);

const xAxisGroup = chartGroup
  .append("g")
  .attr("class", "axis x-axis")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = chartGroup.append("g").attr("class", "axis y-axis");

// Label on x-axis
chartGroup
  .append("text")
  .attr("class", "axis-label")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .style("text-align", "center")
  .text("X Axis: Date");

// Label on y-axis
chartGroup
  .append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -40)
  .style("text-align", "center")
  .text("Y Axis: Values");

const linePath = chartGroup
  .append("path")
  .attr("class", "line")
  .style("fill", "none")
  .style("stroke", "#3498db")
  .style("stroke-width", 3);

// Set scale domains
xScale.domain(d3.extent(data, (d) => d.date));
yScale.domain([0, d3.max(data, (d) => d.value)]);

// Draw axes
xAxisGroup.call(xAxis);
yAxisGroup.call(yAxis);

// Draw the line
linePath.datum(data).attr("d", line);
