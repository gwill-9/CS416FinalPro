

var Scope = 0


    
// Function to update the chart based on selected year range
function updateChart(data, minYear, maxYear) {
    // Filter data based on year range
    const filteredData = data.filter(d => d.Year >= minYear && d.Year <= maxYear);

    let filteredScopeData;

    if (Scope === 0) {
        // Filter out rows where Region column is not null (look at the regions only)
        filteredScopeData = filteredData.filter(d => !d.Region);
    } else {
        // If Scope is not 0, handle the case where Region is defined
        filteredScopeData = filteredData.filter(d => d.Region);
    }

    // Group by country and calculate the product for each country
    const countryData = d3.rollups(filteredScopeData,
        v => {
            const co2Electricity = d3.mean(v.filter(d => d["Indicator Name"] === 'CO2 emissions from electricity and heat production, total (% of total fuel combustion)'), d => +d.Value);
            const co2Total = d3.mean(v.filter(d => d["Indicator Name"] === 'CO2 emissions (kt)'), d => +d.Value);
            const totalPop = d3.mean(v.filter(d => d["Indicator Name"] === 'Population, total'), d => +d.Value);
            if ((co2Electricity * co2Total)/ totalPop==NaN){
                return 0;
            }else{
                return (co2Electricity * co2Total) / totalPop;
            }
        },
        d => d["Country Name"]
    );

    // Convert countryData to an array of objects with 'country' and 'value' properties
    const countryArray = Array.from(countryData, ([countryName, calculatedValue]) => ({ country: countryName, value: calculatedValue }));

    // Print the array to the console to check the output
    console.log(countryArray);

    // Call the function to render the chart
    renderChart(countryArray);
}

// Function to render the chart
function renderChart(countryArray) {
    // Set margins for the chart
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };

    // Function to update chart dimensions
    function updateChartDimensions() {
        const containerWidth = document.getElementById('bar-chart-container').offsetWidth;
        const width = containerWidth - margin.left - margin.right; // Dynamic width based on container
        const height = 400 - margin.top - margin.bottom;

        // Remove existing SVG if it exists
        d3.select("#bar-chart-container svg").remove();

        // Append the SVG object to the div
        const svg = d3.select("#bar-chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X axis
        const x = d3.scaleBand()
            .domain(countryArray.map(d => d.country))
            .range([0, width])
            .padding(0.2);
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Y axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(countryArray, d => d.value)])
            .nice()
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("rect")
            .data(countryArray)
            .enter()
            .append("rect")
            .attr("x", d => x(d.country))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", "steelblue");
    }

    // Initial chart rendering
    updateChartDimensions();

    // Add an event listener to resize the chart when the window is resized
    window.addEventListener('resize', updateChartDimensions);
}









// Load CSV data
d3.csv("data/OutPutData_silm_slim.csv").then(function(data) {

    // Parse data
    data.forEach(d => {
        d.Year = +d.Year;
        d.Value = +d.Value;
    });

    // Initial year range
    let minYear = 2010;
    let maxYear = 2022;

    // Update year range display
    d3.select("#year-range").text(`${minYear} - ${maxYear}`);

    // Create initial chart
    updateChart(data, minYear, maxYear);

    // Update chart when slider values change
    d3.select("#year-slider").on("input", function() {
        minYear = +this.value;
        maxYear = +d3.select("#year-slider-max").property("value");
        d3.select("#year-range").text(`${minYear} - ${maxYear}`);
        updateChart(data, minYear, maxYear);
    });

    // d3.select("#year-slider-max").on("input", function() {
    //     maxYear = +this.value;
    //     minYear = +d3.select("#year-slider").property("value");
    //     d3.select("#year-range").text(`${minYear} - ${maxYear}`);
    //     updateChart(data, minYear, maxYear);
    // });
});















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