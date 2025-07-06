// select the div with id #selection-area
d3.select("#selection-area").style("background-color", "yellow");

// select the div with id #selection-area and the p with id #p1
d3.select("#selection-area").select("#p1").style("background-color", "yellow");

// select all 'p' tags and style them
d3.selectAll("p").style("background-color", "pink");

// select all 'div' tags, style them pink, but also choose "#p2" and style it green
d3.selectAll("div")
  .style("background-color", "pink")
  .select("#p2")
  .style("background-color", "green");

// select a div and append a p tag with some text inside it
d3.select("#append-area")
  .append("p")
  .text("This text was added from console, using D3.js")
  .style("background-color", "yellow");

// select a div and remove all p tags inside it
d3.select("#interactive-area").selectAll("p").remove();

// select a div and remove the first p tag inside it
d3.select("#interactive-area").select(":first-child").remove();

// select a div and insert an element after the last child
d3.select("#interactive-area")
  .insert("h3", ":last-child")
  .text("Inserted a h3 tag here");

// D3 Joins -- INCOMPLETE, NEED TO ADD JOINS
const dataJoinArea = d3.select("#data-join-area");

let initialData = [10, 20]; // has 2 data points, so it will create 2 divs

const divs1 = dataJoinArea.selectAll("div").data(initialData);

divs1
  .enter()
  .append("div")
  .text((d) => `INITIAL: ${d}`)
  .style("background-color", "#0ce444");

let updatedData = [30, 40, 0, 10]; // it will add ONLY 2 more divs (values 0, 10), because 2 divs already exist in the DOM from the initialData

const divs2 = dataJoinArea.selectAll("div").data(updatedData).join();

divs2
  .enter()
  .append("div")
  .text((d) => `ENTER: ${d}`)
  .style("background-color", "orange");

// Data Transitions
const transitionArea = d3.select("#transition-area");

function runTransition() {
  clearTransitions(); // clear out all the html elements inside the selected div

  const mySvg = transitionArea
    .append("svg")
    .attr("width", "100%")
    .attr("height", 500);

  mySvg
    .selectAll("cicle")
    .data([20, 40, 60, 80, 100])
    .enter()
    .append("circle")
    .attr("cx", 0)
    .attr("cy", (d, i) => 25 + i * 20)
    .attr("r", 10)
    .style("fill", "#9f2ec2")
    .transition()
    .duration(1500)
    .attr("cx", (d) => d * 3)
    .attr("cy", (d) => d * 3);
}

runTransition();

function clearTransitions() {
  transitionArea.html("");
}

// clearTransitions(); // Uncomment to clear transitions
