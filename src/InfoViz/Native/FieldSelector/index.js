import d3 from 'd3';
import style from 'PVWStyle/InfoVizNative/FieldSelector.mcss';

import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Field Selector
// ----------------------------------------------------------------------------

function fieldSelector(publicAPI, model) {
  // private variables
  const hideField = {
    minMax: false,
    hist: false,
    minMaxWidth: 0,
    histWidth: 0,
  };

  // storage for 1d histograms
  if (!model.histograms) {
    model.histograms = {};
  }

  // public API
  publicAPI.resize = () => {
    publicAPI.render();
  };

  publicAPI.setContainer = (el) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
      }
      model.container = null;
    }

    model.container = el;

    if (el) {
      const table = d3.select(model.container).append('table').classed(style.fieldSelector, true);
      const theadRow = table.append('thead').classed(style.thead, true).append('tr');
      theadRow.append('th').classed(style.jsFieldSelectorMode, true).append('i');
      theadRow.append('th').classed(style.jsFieldSelectorLabel, true);
      table.append('tbody').classed(style.tbody, true);

      model.fieldShowHistogram = model.fieldShowHistogram && (model.provider.isA('Histogram1DProvider'));
      // append headers for histogram columns
      if (model.fieldShowHistogram) {
        theadRow.append('th').text('Min').classed(style.jsHistMin, true);
        const chartHeader = theadRow.append('th').classed(style.jsSparkline, true);
        chartHeader.append('span').text('Histogram').classed(style.chartHeader, true);
        chartHeader.append('i');
        theadRow.append('th').text('Max').classed(style.jsHistMax, true);
      }
      publicAPI.render();
    }
  };

  const clickSelected = (d) => {
    model.displayUnselected = !model.displayUnselected;
    publicAPI.render();
  };
  const clickChart = (d) => {
    model.showHist = !model.showHist;
    publicAPI.render();
  };

  publicAPI.render = () => {
    if (!model.container) {
      return;
    }

    const legendSize = 15;

    // Apply style
    d3.select(`.${style.jsFieldSelectorMode}`)
      .on('click', clickSelected)
      .select('i')
      // apply class - 'false' should come first to not remove common base class.
      .classed(!model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed(model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, true);


    const data = model.displayUnselected ? model.provider.getFieldNames() : model.provider.getActiveFieldNames();
    const totalNum = model.displayUnselected ? data.length : model.provider.getFieldNames().length;

    // Update header label
    d3.select(`.${style.jsFieldSelectorLabel}`)
      .style('text-align', 'left')
      .text(model.displayUnselected ? `Only Selected (${data.length} total)` : `Only Selected (${data.length} / ${totalNum} total)`)
      .on('click', clickSelected);

    // test for too-long rows
    const hideMore = model.container.scrollWidth > model.container.clientWidth;
    if (hideMore) {
      if (!hideField.minMax) {
        hideField.minMax = true;
        hideField.minMaxWidth = model.container.scrollWidth;
        // if we hide min/max, we may also need to hide hist, so trigger another resize
        setTimeout(publicAPI.resize, 0);
      } else if (!hideField.hist) {
        hideField.hist = true;
        hideField.histWidth = model.container.scrollWidth;
      }
    } else if (hideField.minMax) {
      // if we've hidden something, see if we can re-show it.
      if (hideField.hist) {
        if (model.container.scrollWidth - hideField.histWidth > 0) {
          hideField.hist = false;
          hideField.histWidth = 0;
          // if we show hist, we may also need to show min/max, so trigger another resize
          setTimeout(publicAPI.resize, 0);
        }
      } else if (hideField.minMax) {
        if (model.container.scrollWidth - hideField.minMaxWidth > 0) {
          hideField.minMax = false;
          hideField.minMaxWidth = 0;
        }
      }
    }
    const header = d3.select(`.${style.jsTHead}`).select('tr');
    header.selectAll(`.${style.jsHistMin}`)
      .style('display', hideField.minMax ? 'none' : null);
    const chartHeader = header.selectAll(`.${style.jsSparkline}`)
      .style('display', hideField.hist ? 'none' : null);
    header.selectAll(`.${style.jsHistMax}`)
      .style('display', hideField.minMax ? 'none' : null);

    // Handle variables
    const variablesContainer = d3
      .select(`.${style.jsTBody}`)
      .selectAll('tr')
      .data(data);

    variablesContainer.enter().append('tr');
    variablesContainer.exit().remove();

    // track if any quantiles are available at all.
    let foundQuantile = false;

    // Apply on each data item
    function renderField(fieldName, index) {
      const field = model.provider.getField(fieldName);
      const fieldContainer = d3.select(this);
      let legendCell = fieldContainer.select(`.${style.jsLegend}`);
      let fieldCell = fieldContainer.select(`.${style.jsFieldName}`);
      if (field.quantiles) foundQuantile = true;


      // Apply style to row (selected/unselected)
      fieldContainer
        .classed(!field.active ? style.selectedRow : style.unselectedRow, false)
        .classed(field.active ? style.selectedRow : style.unselectedRow, true)
        .on('click', (name) => {
          model.provider.toggleFieldSelection(name);
        });

      // Create missing DOM element if any
      if (legendCell.empty()) {
        legendCell = fieldContainer
          .append('td')
          .classed(style.legend, true);

        fieldCell = fieldContainer
          .append('td')
          .classed(style.fieldName, true);
      }

      // Apply legend
      if (model.provider.isA('LegendProvider')) {
        const { color, shape } = model.provider.getLegend(fieldName);
        legendCell
          .html(`<svg class='${style.legendSvg}' width='${legendSize}' height='${legendSize}'
                  fill='${color}' stroke='black'><use xlink:href='${shape}'/></svg>`);
      } else {
        legendCell
          .html('<i></i>')
          .select('i')
          .classed(!field.active ? style.selectedRow : style.unselectedRow, false)
          .classed(field.active ? style.selectedRow : style.unselectedRow, true);
      }

      // Apply field name
      fieldCell.text(fieldName);

      if (model.fieldShowHistogram) {
        let minCell = fieldContainer.select(`.${style.jsHistMin}`);
        let histCell = fieldContainer.select(`.${style.jsSparkline}`);
        let maxCell = fieldContainer.select(`.${style.jsHistMax}`);

        if (histCell.empty()) {
          minCell = fieldContainer.append('td').classed(style.jsHistMin, true);
          histCell = fieldContainer.append('td').classed(style.sparkline, true);
          maxCell = fieldContainer.append('td').classed(style.jsHistMax, true);
          histCell.append('svg')
            .classed(style.sparklineSvg, true)
            .attr('width', model.fieldHistWidth)
            .attr('height', model.fieldHistHeight);
        }

        // make sure our data is ready. If not, render will be called when loaded.
        const hobj = model.histograms ? model.histograms[fieldName] : null;
        if (hobj || field.quantiles) {
          histCell
            .style('display', hideField.hist ? 'none' : null);

          // only do work if histogram is displayed.
          if (!hideField.hist) {
            // ignore whisker/histogram toggle if whisker data is unavailable
            if (model.showHist || !field.quantiles) {
              if (!model.lastShowHist) {
                histCell.select('svg').selectAll('*').remove();
              }
              const cmax = 1.0 * d3.max(hobj.counts);
              const hsize = hobj.counts.length;
              const hdata = histCell.select('svg')
                .selectAll(`.${style.jsHistRect}`).data(hobj.counts);

              hdata.enter().append('rect');
              // changes apply to both enter and update data join:
              hdata
                .attr('class', (d, i) => (i % 2 === 0 ? style.histRectEven : style.histRectOdd))
                .attr('pname', fieldName)
                .attr('y', d => model.fieldHistHeight * (1.0 - (d / cmax)))
                .attr('x', (d, i) => (model.fieldHistWidth / hsize) * i)
                .attr('height', d => model.fieldHistHeight * (d / cmax))
                .attr('width', model.fieldHistWidth / hsize);

              hdata.exit().remove();

              if (model.provider.isA('HistogramBinHoverProvider')) {
                histCell.select('svg')
                  .on('mousemove', function inner(d, i) {
                    const mCoords = d3.mouse(this);
                    const binNum = Math.floor((mCoords[0] / model.fieldHistWidth) * hsize);
                    const state = {};
                    state[fieldName] = [binNum];
                    model.provider.setHoverState({ state });
                  })
                  .on('mouseout', (d, i) => {
                    const state = {};
                    state[fieldName] = [-1];
                    model.provider.setHoverState({ state });
                  });
              }
            } else {
              // whisker/box plot
              // draw verical line for lowerWhisker
              const svg = histCell.select('svg');
              svg.selectAll('line').remove();
              svg.selectAll('rect').remove();
              const xScale = d3.scale.linear()
                // allows 1 pixel whiskers at the extremes to not be cut off.
                .range([0.5, model.fieldHistWidth - 0.5])
                .domain(field.range);
              const midline = model.fieldHistHeight * 0.5;
              let lowerWhisker = 0;
              let q1Val = 0;
              let medianVal = 0;
              let meanVal = 0;
              let iqr = 0;
              let upperWhisker = 0;
              const bh = Math.floor(0.5 * (model.fieldHistHeight - 4));
              if (field.quantiles) {
                lowerWhisker = field.quantiles[0];
                q1Val = field.quantiles[1];
                medianVal = field.quantiles[2];
                meanVal = field.mean;
                iqr = field.quantiles[3] - q1Val;
                upperWhisker = field.quantiles[4];
              }

              svg.append('line')
                 .attr('class', style.whisker)
                 .attr('x1', xScale(lowerWhisker))
                 .attr('x2', xScale(lowerWhisker))
                 .attr('y1', midline - bh)
                 .attr('y2', midline + bh);

              // draw vertical line for upperWhisker
              svg.append('line')
                 .attr('class', style.whisker)
                 .attr('x1', xScale(upperWhisker))
                 .attr('x2', xScale(upperWhisker))
                 .attr('y1', midline - bh)
                 .attr('y2', midline + bh);

              // draw horizontal line from lowerWhisker to upperWhisker
              svg.append('line')
                 .attr('class', style.whisker)
                 .attr('x1', xScale(lowerWhisker))
                 .attr('x2', xScale(upperWhisker))
                 .attr('y1', midline)
                 .attr('y2', midline);

              // mean, behind the rect
              svg.append('line')
                 .attr('class', style.mean)
                 .attr('x1', xScale(meanVal))
                 .attr('x2', xScale(meanVal))
                 .attr('y1', midline - bh - 3)
                 .attr('y2', midline + bh + 3);

              // draw rect for iqr
              svg.append('rect')
                 .attr('class', style.iqr)
                 .attr('x', xScale(q1Val))
                 .attr('y', midline - bh)
                 .attr('width', xScale(iqr + field.range[0]))
                 .attr('height', 2 * bh);

              // draw vertical line at median
              if (field.mean) {
                svg.append('line')
                 .attr('class', style.median)
                 .attr('x1', xScale(medianVal))
                 .attr('x2', xScale(medianVal))
                 .attr('y1', midline - bh)
                 .attr('y2', midline + bh);
              }
            }

            const formatter = d3.format('.3s');
            minCell.text(formatter(hobj ? hobj.min : field.range[0]))
              .style('display', hideField.minMax ? 'none' : null);
            maxCell.text(formatter(hobj ? hobj.max : field.range[1]))
              .style('display', hideField.minMax ? 'none' : null);
          }
        }
      }
    }

    // Render all fields
    variablesContainer
      .each(renderField);

    // hide the hist/whisker toggle if no whisker data found.
    if (!foundQuantile) model.showHist = true;

    chartHeader.select('span').text(model.showHist ? 'Histogram' : 'Whisker');
    chartHeader.select('i')
      .style('display', foundQuantile ? null : 'none')
      .on('click', clickChart)
      .classed(model.showHist ? style.showHistIcon : style.showBoxIcon, false)
      .classed(!model.showHist ? style.showHistIcon : style.showBoxIcon, true);


    model.lastShowHist = model.showHist;
  };

  function handleHoverUpdate(data) {
    const svg = d3.select(model.container);
    Object.keys(data.state).forEach((pName) => {
      const binList = data.state[pName];
      svg.selectAll(`rect[pname='${pName}']`)
        .classed(style.histoHilite, (d, i) => binList.indexOf(-1) === -1)
        .classed(style.binHilite, (d, i) => binList.indexOf(i) >= 0);
    });
  }

  // Make sure default values get applied
  publicAPI.setContainer(model.container);
  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  model.subscriptions.push(model.provider.onFieldChange(publicAPI.render));
  if (model.fieldShowHistogram) {
    if (model.provider.isA('Histogram1DProvider')) {
      model.histogram1DDataSubscription = model.provider.subscribeToHistogram1D(
        (allHistogram1d) => {
          // Below, we're asking for partial updates, so we just update our
          // cache with anything that came in.
          Object.keys(allHistogram1d).forEach((paramName) => {
            model.histograms[paramName] = allHistogram1d[paramName];
          });
          publicAPI.render();
        },
        model.provider.getFieldNames(),
        {
          numberOfBins: model.numberOfBins,
          partial: true,
        }
      );

      model.subscriptions.push(model.histogram1DDataSubscription);
    }
  }

  if (model.provider.isA('HistogramBinHoverProvider')) {
    model.subscriptions.push(model.provider.onHoverBinChange(handleHoverUpdate));
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,
  displayUnselected: true,
  fieldShowHistogram: true,
  fieldHistWidth: 120,
  fieldHistHeight: 15,
  numberOfBins: 32,
  showHist: false,
  lastShowHist: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container', 'fieldShowHistogram', 'numberOfBins']);
  CompositeClosureHelper.set(publicAPI, model, ['fieldShowHistogram', 'numberOfBins']);

  fieldSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
