// select the div with #selection-area
d3.select("#selection-area").style("background-color", "yellow");

// select the div with #selection-area and the p with #p1
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
