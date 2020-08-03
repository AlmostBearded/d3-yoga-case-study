import * as d3 from 'd3';
import yogaLayoutParser from './yoga-layout-parser';

// Data representing the populations of large Austrian cities
var data = [
  { city: 'Vienna', population: 1691000 },
  { city: 'Graz', population: 222000 },
  { city: 'Linz', population: 205000 },
  { city: 'Salzburg', population: 153000 },
  { city: 'Innsbruck', population: 132000 },
  { city: 'Klagenfurt', population: 91000 },
  { city: 'Villach', population: 59000 },
];

// Configuration for the chart
var config = {
  numericAxis: {
    visible: true,
    title: 'Population',
  },
  categoricAxis: {
    visible: true,
    title: 'Countries',
  },
};

// Calculate bounding rect of the chart
var boundingRect = getBoundingRect('#chart');

// Setting up the initial scales for the full size of the container
var categoricScale = d3
  .scaleBand()
  .domain(data.map((d) => d.city))
  .padding(0.05)
  .range([0, boundingRect.width]);

var numericScale = d3
  .scaleLinear()
  .domain([0, d3.max(data, (d) => d.population)])
  .range([boundingRect.height, 0]);

// Create the root node of the chart
var svgSelection = d3.select('#chart').append('svg');

// Cached selection variables
var numericAxisSelection, categoricAxisSelection, barsSelection;

// Create an initial scaffold of the chart that reflects the desired layout
scaffoldChart();

// Initial rendering of the axes to access their sizes during layouting
renderCategoricAxis();
renderNumericAxis();

// Create layout parser and parse node hierarchy
var layoutParser = yogaLayoutParser();
layoutParser.parseNodeHierarchy(svgSelection.node());

// Update the layout to fit into the bounding rect dimensions
updateLayout();

window.addEventListener('resize', updateLayout);

// Get the bounding rect of a node
function getBoundingRect(selector) {
  var node = document.querySelector(selector);
  return node.getBoundingClientRect();
}

// Scaffold the desired layout of the chart using yogaLayout attributes
function scaffoldChart() {
  // This function has been organized using unnecessary blocks to reflect nesting of nodes

  svgSelection.attr(
    'yogaLayout',
    'flex-direction: column; align-items: stretch; padding-left: 25; padding-right: 25'
  );
  {
    var row1Selection = svgSelection
      .append('g')
      .attr('yogaLayout', 'flex-direction: row;align-items: stretch;flex-grow: 1');
    {
      numericAxisSelection = row1Selection
        .append('g')
        .classed('numeric-axis', true)
        .attr('yogaLayout', 'flex-direction: row; flex-grow: 0; flex-shrink: 0');
      {
        numericAxisSelection
          .append('text')
          .classed('title', true)
          .attr(
            'yogaLayout',
            'width: auto; align-self: center; flex-grow: 0; flex-shrink: 0; margin-right: 10'
          );

        numericAxisSelection
          .append('g')
          .classed('ticks', true)
          .attr('yogaLayout', 'width: auto; flex-grow: 0; flex-shrink: 0');
      }

      barsSelection = row1Selection
        .append('g')
        .classed('bars', true)
        .attr('yogaLayout', 'flex-grow: 1');
    }

    categoricAxisSelection = svgSelection
      .append('g')
      .classed('categoric-axis', true)
      .attr(
        'yogaLayout',
        'flex-direction: column; margin-left: $.numeric-axis#width; flex-grow: 0; flex-shrink: 0'
      );
    {
      categoricAxisSelection.append('g').classed('ticks', true).attr('yogaLayout', 'height: auto');

      categoricAxisSelection
        .append('text')
        .classed('title', true)
        .attr('yogaLayout', 'height: auto; align-self: center; margin-top: 10');
    }
  }
}

function renderCategoricAxis() {
  categoricAxisSelection.attr('transform', `scale(${+config.categoricAxis.visible}, 1)`);

  categoricAxisSelection
    .select('.ticks')
    .call(d3.axisBottom(categoricScale))
    .attr('font-size', null)
    .attr('font-family', null);

  categoricAxisSelection
    .select('.title')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.7em')
    .attr('font-weight', 'bold')
    .text(config.categoricAxis.title || '');
}

function renderNumericAxis() {
  numericAxisSelection.attr('transform', `scale(${+config.numericAxis.visible}, 1)`);

  numericAxisSelection
    .select('.title')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.7em')
    .attr('font-weight', 'bold')
    .attr('transform', 'rotate(-90)')
    .text(config.numericAxis.title || '');

  numericAxisSelection
    .select('.ticks')
    .call(d3.axisLeft(numericScale))
    .attr('font-size', null)
    .attr('font-family', null)
    .call((e) => e.attr('transform', `translate(${e.node().getBoundingClientRect().width}, 0)`));
}

function renderBars() {
  barsSelection
    .attr('fill', 'steelblue')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d) => categoricScale(d.city))
    .attr('y', (d) => numericScale(d.population))
    .attr('height', (d) => numericScale(0) - numericScale(d.population))
    .attr('width', categoricScale.bandwidth());
}

function updateLayout() {
  // Update the size of the bounding rect
  boundingRect = getBoundingRect('#chart');

  // Update the viewbox of the chart
  svgSelection.attr('viewBox', `0, 0, ${boundingRect.width}, ${boundingRect.height}`);

  // Calculate the layout
  layoutParser.calculateLayout(boundingRect.width, boundingRect.height);

  // Resize the range of the scale to fit into the calculated size of the bar drawing area
  var barsLayoutNode = layoutParser.nodeToLayoutNodeMap.get(barsSelection.node());
  categoricScale.range([0, barsLayoutNode.getComputedWidth()]);
  numericScale.range([barsLayoutNode.getComputedHeight(), 0]);

  // Rerender the axes and render the bars now that the scales have correct ranges
  renderCategoricAxis();
  renderNumericAxis();
  renderBars();

  // Position the different nodes according to the layout
  layoutParser.applyLayout();
}
