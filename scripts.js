// Example data
const barChartData = [30, 86, 168, 281, 303, 365];
const scatterPlotData = [
    {x: 30, y: 20},
    {x: 50, y: 90},
    {x: 80, y: 50},
    {x: 120, y: 33},
    {x: 150, y: 80},
];
const colorBarData = [
    {color: '#FF0000', label: 'Red'},
    {color: '#00FF00', label: 'Green'},
    {color: '#0000FF', label: 'Blue'},
    {color: '#FFFF00', label: 'Yellow'},
    {color: '#FF00FF', label: 'Magenta'}
];

// Create Bar Chart
const barChartSvg = d3.select("#bar-chart-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 600 300");

const barWidth = 600 / barChartData.length;

barChartSvg.selectAll("rect")
    .data(barChartData)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * barWidth)
    .attr("y", d => 300 - d)
    .attr("width", barWidth - 1)
    .attr("height", d => d)
    .attr("fill", "steelblue");

// Create Scatter Plot
const scatterPlotSvg = d3.select("#scatter-plot-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 600 400");

scatterPlotSvg.selectAll("circle")
    .data(scatterPlotData)
    .enter()
    .append("circle")
    .attr("cx", d => d.x * 3)
    .attr("cy", d => 400 - d.y * 3)
    .attr("r", 5)
    .attr("fill", "red");

// Create Color Bar Chart
const colorBarContainer = d3.select("#color-bar-chart-container");

colorBarContainer.selectAll(".color-bar")
    .data(colorBarData)
    .enter()
    .append("div")
    .attr("class", "color-bar")
    .style("background-color", d => d.color)
    .text(d => d.label);