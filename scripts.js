

var Scope = 0
let selectedCountry = 'none';
let selectedCountry1 = null;
let selectedCountry2 = null;


console.log('version 1.12');
    
// Function to update the chart based on selected year range
function updateChart(data, minYear, maxYear) {
    // Filter data based on year range
    const filteredData = data.filter(d => d.Year >= minYear && d.Year <= maxYear);

    let filteredScopeData;

    if (Scope === 0) {
        // Extract distinct regions
        const distinctRegions = Array.from(new Set(data.map(d => d.Region)));
        // console.log("Distinct Regions:", distinctRegions);

        // Filter out rows where Region column is not null (look at the regions only)
        filteredScopeData = filteredData.filter(d => !d.Region);
        // console.log("Filtered Data (Scope 0):", filteredScopeData);

        // Filter data based on the list of regions
        filteredScopeData = filteredScopeData.filter(d => distinctRegions.includes(d["Country Name"]));
        // console.log("Filtered Data (Scope 0) after compare:", filteredScopeData);

    } else {
        // If Scope is not 0, handle the case where Region is defined
        filteredScopeData = filteredData.filter(d => d.Region);
    }

    // Group by country and calculate the average for each country
    const countryData = d3.rollups(filteredScopeData,
        v => {
            const co2Electricity = d3.mean(v.filter(d => d["Indicator Name"] === 'CO2 emissions from electricity and heat production, total (% of total fuel combustion)'), d => +d.Value);
            const co2Total = d3.mean(v.filter(d => d["Indicator Name"] === 'CO2 emissions (kt)'), d => +d.Value);
            const totalPop = d3.mean(v.filter(d => d["Indicator Name"] === 'Population, total'), d => +d.Value);
            const calculatedValue = (co2Electricity * co2Total) / totalPop;
            return{
                calculatedValue: isNaN(calculatedValue) ? 0 : calculatedValue,
                electricPowerConsumption: d3.mean(v.filter(d => d["Indicator Name"] === 'Electric power consumption (kWh per capita)'), d => +d.Value)
            };
        },
        d => d["Country Name"]
    );

    // Format the data for the bar chart
    const barChartData = countryData.map(([countryName, values]) => ({
        country: countryName,
        value: values.calculatedValue
    }));

    /// Format the data for the scatter plot
    const scatterPlotData = countryData.map(([countryName, values]) => ({
        country: countryName,
        x: values.electricPowerConsumption,
        y: values.calculatedValue
    }));


    // console.log("Scatter data:", scatterPlotData)

    // Call the function to render the chart
    renderChart(barChartData,scatterPlotData);


}

// Function to render the bar chart and scatter plot
function renderChart(countryArray, scatterData) {
    // Sort the bar chart data in descending order based on value
    countryArray.sort((a, b) => b.value - a.value);

    // Set margins for the charts
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const barHeight = 300;
    const scatterHeight = 400;

    // Function to update chart dimensions
    function updateChartDimensions() {
        const containerWidth = document.getElementById('bar-chart-container').offsetWidth;
        const width = containerWidth - margin.left - margin.right;
        const barChartHeight = barHeight - margin.top - margin.bottom;
        const scatterChartHeight = scatterHeight - margin.top - margin.bottom;

        // Remove existing SVGs if they exist
        d3.select("#bar-chart-container svg").remove();
        d3.select("#scatter-plot-container svg").remove();
        d3.select("#bar-chart-compare svg").remove();

        // Append SVG for bar chart
        const barSvg = d3.select("#bar-chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", barHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Bar chart X axis
        const xBar = d3.scaleBand()
            .domain(countryArray.map(d => d.country))
            .range([0, width])
            .padding(0.2);
        barSvg.append("g")
            .attr("transform", `translate(0,${barChartHeight})`)
            .call(d3.axisBottom(xBar))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Bar chart Y axis
        const yBar = d3.scaleLinear()
            .domain([0, d3.max(countryArray, d => d.value)])
            .nice()
            .range([barChartHeight, 0]);
        barSvg.append("g")
            .call(d3.axisLeft(yBar));

        // Bar chart bars
        barSvg.selectAll("rect")
            .data(countryArray)
            .enter()
            .append("rect")
            .attr("x", d => xBar(d.country))
            .attr("y", d => yBar(d.value))
            .attr("width", xBar.bandwidth())
            .attr("height", d => barChartHeight - yBar(d.value))
            .attr("fill", "steelblue")
            .on("click", function(event, d) {
                selectedCountry = d.country;
                d3.select("#selected-country-text").text(`Selected Country: ${selectedCountry}`);
            });

        // Append SVG for scatter plot
        const scatterSvg = d3.select("#scatter-plot-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", scatterHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scatter plot X axis
        const xScatter = d3.scaleLinear()
            .domain([0, d3.max(scatterData, d => d.x)])
            .range([0, width]);
        
        // Scatter plot Y axis
        const yScatter = d3.scaleLinear()
            .domain([0, d3.max(scatterData, d => d.y)])
            .range([scatterHeight, 0]);

        // x axis
        scatterSvg.append("g")
            .attr("transform", `translate(0,${scatterHeight})`)
            .call(d3.axisBottom(xScatter))
            .append("text")
            .attr("fill", "#000")
            .attr("x", width / 2)
            .attr("y", margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Electric power consumption (kWh per capita)");

        // y axis
        scatterSvg.append("g")
            .call(d3.axisLeft(yScatter))
            .append("text")
            .attr("fill", "#000")
            .attr("x", -margin.left)
            .attr("y", scatterHeight / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("C02 From Electric Power Generation And Heating (kt Per capita)");

        // Create a tooltip div that is hidden by default
        const tooltip = d3.select("#scatter-plot-container")
            .append("div")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Circles
        scatterSvg.selectAll("circle")
            .data(scatterData)
            .enter()
            .append("circle")
            .attr("cx", d => xScatter(d.x))
            .attr("cy", d => yScatter(d.y))
            .attr("r", 5)
            .attr("fill", "red")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                // Get the width of the tooltip
                const tooltipWidth = tooltip.node().offsetWidth;
                
                // Calculate the position, making sure the tooltip doesn't go off the right edge
                let left = event.pageX + 5;
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - 5;
                }

                //fill tooltip
                tooltip.html(`Country: ${d.country}<br/>X: ${d.x}<br/>Y: ${d.y}`)
                    .style("left", left + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                selectedCountry = d.country;
                d3.select("#selected-country-text").text(`Selected Country: ${selectedCountry}`);
            });


        // botton logic
        document.getElementById('save-country-1').addEventListener('click', function() {
            selectedCountry1 = selectedCountry;
            if (selectedCountry1!='none') {
                renderChart(countryArray, scatterData, breakdownData); // Ensure to pass the required data
            }
        });
        
        document.getElementById('save-country-2').addEventListener('click', function() {
            selectedCountry2 = selectedCountry;
            if (selectedCountry2!='none') {
                renderChart(countryArray, scatterData, breakdownData); // Ensure to pass the required data
            }
        });






        // Append SVG for electrical breakdown chart
        const breakdownSvg = d3.select("#bar-chart-compare")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", breakdownHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Check if two countries are selected
        if (selectedCountries.length === 2) {
             const selectedCountries = [selectedCountry1, selectedCountry2];

            // Filter breakdown data for the selected countries
            const filteredData = breakdownData.filter(d => selectedCountries.includes(d.country));

            // Process breakdown data to average over years and split by energy type
            const breakdownProcessed = d3.rollups(
                filteredData,
                v => {
                    const total = v.reduce((sum, d) => sum + d['Electricity production from coal sources (% of total)'], 0);
                    return {
                        coal: d3.mean(v, d => +d['Electricity production from coal sources (% of total)']),
                        hydro: d3.mean(v, d => +d['Electricity production from hydroelectric sources (% of total)']),
                        gas: d3.mean(v, d => +d['Electricity production from natural gas sources (% of total)']),
                        nuclear: d3.mean(v, d => +d['Electricity production from nuclear sources (% of total)']),
                        oil: d3.mean(v, d => +d['Electricity production from oil sources (% of total)']),
                        other: 100 - (d3.mean(v, d => +d['Electricity production from coal sources (% of total)'])
                            + d3.mean(v, d => +d['Electricity production from hydroelectric sources (% of total)'])
                            + d3.mean(v, d => +d['Electricity production from natural gas sources (% of total)'])
                            + d3.mean(v, d => +d['Electricity production from nuclear sources (% of total)'])
                            + d3.mean(v, d => +d['Electricity production from oil sources (% of total)']))
                    };
                },
                d => d.country
            );

            // Flatten the processed data for stacking
            const stackData = breakdownProcessed.map(([country, values]) => ({
                country,
                coal: values.coal,
                hydro: values.hydro,
                gas: values.gas,
                nuclear: values.nuclear,
                oil: values.oil,
                other: values.other
            }));

            // Set up the color scale for breakdown
            const color = d3.scaleOrdinal()
                .domain(['coal', 'hydro', 'gas', 'nuclear', 'oil', 'other'])
                .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']);

            // Stack the data
            const astack = d3.stack()
                .keys(['coal', 'hydro', 'gas', 'nuclear', 'oil', 'other'])
                .order(d3.stackOrderNone)
                .offset(d3.stackOffsetNone);

            const series = stack(stackData);
           

            // X axis for breakdown
            const xBreakdown = d3.scaleBand()
                .domain(stackData.map(d => d.country))
                .range([0, width])
                .padding(0.2);
            breakdownSvg.append("g")
                .attr("transform", `translate(0,${breakdownHeight})`)
                .call(d3.axisBottom(xBreakdown))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

             // Y axis for breakdown
             const yBreakdown = d3.scaleLinear()
             .domain([0, 100])
             .range([breakdownHeight, 0]);
         breakdownSvg.append("g")
             .call(d3.axisLeft(yBreakdown))
             .append("text")
             .attr("fill", "#000")
             .attr("x", -margin.left)
             .attr("y", breakdownHeight / 2)
             .attr("text-anchor", "middle")
             .attr("transform", "rotate(-90)")
             .text("Percentage (%)");

            // Append the stacked bars
            breakdownSvg.selectAll(".layer")
                .data(series)
                .enter()
                .append("g")
                .attr("class", "layer")
                .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("x", d => xBreakdown(d.data.country))
                .attr("y", d => yBreakdown(d[1]))
                .attr("height", d => yBreakdown(d[0]) - yBreakdown(d[1]))
                .attr("width", xBreakdown.bandwidth())
                .append("title")
                .text(d => `${d.data.country}<br/>${d.key}: ${d[1] - d[0]}%`);
        }
    }




    // Initial chart rendering
    updateChartDimensions();

    // Add an event listener to resize the charts when the window is resized
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
    let maxYear = 2014;

    // Update year range display
    d3.select("#year-range").text(`${minYear} - ${maxYear}`);

    // Create initial chart
    updateChart(data, minYear, maxYear);

    // Update chart when slider values change
    d3.select("#year-slider").on("input", function() {
        minYear = +this.value;
        // console.log(minYear);
        maxYear = 2014;//+d3.select("#year-slider-max").property("value");
        d3.select("#year-range").text(`${minYear} - ${maxYear}`);
        updateChart(data, minYear, maxYear);
    })
    .on("click", function(event, d) {
        // check for selection click
        selectedCountry = d.country; 
    });

    // d3.select("#year-slider-max").on("input", function() {
    //     maxYear = +this.value;
    //     minYear = +d3.select("#year-slider").property("value");
    //     d3.select("#year-range").text(`${minYear} - ${maxYear}`);
    //     updateChart(data, minYear, maxYear);
    // });
});












// // Create Color Bar Chart
// const colorBarContainer = d3.select("#color-bar-chart-container");

// colorBarContainer.selectAll(".color-bar")
//     .data(colorBarData)
//     .enter()
//     .append("div")
//     .attr("class", "color-bar")
//     .style("background-color", d => d.color)
//     .text(d => d.label);