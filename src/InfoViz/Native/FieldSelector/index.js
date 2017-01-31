import d3 from 'd3';
// eslint-disable-next-line
import style from 'PVWStyle/InfoVizNative/FieldSelector.mcss';

import   CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import              FieldSearch from '../../../InfoViz/React/FieldSearch';
import             ReactAdapter from '../../../Component/React/ReactAdapter';

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
      model.innerDiv = null;
    }

    model.container = el;
    // model.fieldsToRender = null;

    if (el) {
      model.innerDiv = model.container;
      const table = d3.select(model.container).append('table').classed(style.fieldSelector, true);
      const theadRow = table.append('thead').classed(style.thead, true).append('tr');
      theadRow.append('th').classed(style.jsFieldSelectorMode, true).append('i');
      const thLabel = theadRow.append('th').classed('field-selector-label', true);
      table.append('tbody').classed(style.tbody, true);
      thLabel.append('div').classed(style.jsFieldSelectorLabel, true);
      thLabel.append('div').classed('field-selector-search', true);
      if (model.displaySearch) {
        model.searchBar = new ReactAdapter(FieldSearch, { provider: model.provider });
        model.searchBar.setContainer(d3.select(model.innerDiv).select('.field-selector-search').node());
      }

      model.fieldShowHistogram = model.fieldShowHistogram && (model.provider.isA('Histogram1DProvider'));
      // append headers for histogram columns
      if (model.fieldShowHistogram) {
        theadRow.append('th').text('Min').classed(style.jsHistMin, true);
        const chartHeader = theadRow.append('th').classed(style.jsSparkline, true);
        chartHeader.append('span').text('Histogram').classed(style.chartHeader, true);
        chartHeader.append('i');
        theadRow.append('th').text('Max').classed(style.jsHistMax, true);
      }
      if (model.showSelectedFirstToggle) {
        const header = d3.select(model.innerDiv).select('thead').append('tr');
        const selClick = () => {
          if (model.display === 'all') {
            model.displaySelectedFirst = !model.displaySelectedFirst;
            publicAPI.render();
          }
        };
        header
          .append('th').classed(style.jsSelectedFirst, true)
            .append('i').classed(style.allFieldsIcon, true)
              .on('click', selClick);
        header.append('th').classed(style.selectedFirstLabel, true)
          .append('div').classed(style.fieldSelectorHead, true)
            .text('Selected First')
            .on('click', selClick);
        if (model.fieldShowHistogram) header.append('th').attr('colspan', '3');
      }
      // allow completely hidden header
      if (!model.showHeader) {
        d3.select(model.innerDiv).select('thead').style('display', 'none');
      }
    }
  };

  // TODO idx/model.sortByVar is probably not needed anymore, but still used to gate sorting.
  publicAPI.setSortArray = (arr, direction) => {
    model.sortArray = arr;
    model.sortMult = (direction === 'up' ? -1 : 1);
    publicAPI.render();
  };

  publicAPI.setDisplay = (which) => {
    if (which === 'selected' || which === 'unselected') model.display = which;
    else model.display = 'all';
    publicAPI.render();
  };

  publicAPI.setDisplaySelectedFirst = (onoff) => {
    model.displaySelectedFirst = !!onoff;
    publicAPI.render();
  };

  publicAPI.handleFieldChange = (field) => {
    if (field && model.fieldsToRender) {
      const index = model.fieldsToRender.findIndex(fieldInfo => (fieldInfo.name === field.name));
      if (index !== -1) {
        model.fieldsToRender[index].active = field.active;
      }
    }
    publicAPI.render();
  };

  publicAPI.setFieldsToRender = (info) => {
    if (info) {
      const fieldList = Object.keys(info.fieldMapping).map((key, idx) => {
        const field = model.provider.getField(info.fieldMapping[key].name);
        return {
          name: info.fieldMapping[key].name,
          id: info.fieldMapping[key].id,
          range: info.fieldMapping[key].range || field.range,
          active: info.fieldMapping[key].active || field.active,
          originalRow: idx, // where in the table the row should appear in the "default" view.
          row: idx, // where in the table the row should appear on the next render
        };
      });
      model.fieldsToRender = fieldList;
      // model.mutualInformationMatrix = info.mutualInformation;
    } else {
      const fieldList = model.provider.getFieldNames().map((fieldName, idx) => {
        const field = model.provider.getField(fieldName);
        // console.log(field.name);
        return Object.assign({}, field, {
          id: idx,
          originalRow: idx, // where in the table the row should appear in the "default" view.
          row: idx, // where in the table the row should appear on the next render
        });
      });
      model.fieldsToRender = fieldList;
    }
    publicAPI.render();
  };

  publicAPI.getFieldsToRender = () => JSON.parse(JSON.stringify(model.fieldsToRender));

  const clickChart = (d) => {
    model.showHist = !model.showHist;
    publicAPI.render();
  };

  publicAPI.render = () => {
    if (!model.innerDiv || !model.fieldsToRender) {
      return;
    }

    const legendSize = 15;
    const displayClick = (d) => {
      if (model.display === 'all') model.display = 'selected';
      else if (model.display === 'selected') model.display = 'unselected';
      else model.display = 'all';
      publicAPI.render();
    };

    // Apply style
    d3.select(`.${style.jsFieldSelectorMode}`)
      .on('click', displayClick)
      .select('i')
      // apply class - 'false' should come first to not remove common base class.
      .classed(!(model.display === 'all') ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed((model.display === 'all') ? style.allFieldsIcon : style.selectedFieldsIcon, true);


    const selectedBool = (model.display === 'selected');
    const data = (model.display === 'all') ? model.fieldsToRender :
      model.fieldsToRender.filter(xx => (selectedBool ? xx.active : !xx.active));
    const totalNum = model.fieldsToRender.length;

    let text = (model.display === 'all') ? `All (${data.length} total)` : `Only Selected (${data.length} / ${totalNum} total)`;
    if (model.display === 'unselected') text = `Unselected (${data.length} / ${totalNum} total)`;
    // Update header label
    d3.select(model.innerDiv)
      .select('th.field-selector-label')
      .style('text-align', 'left')
      .select(`.${style.jsFieldSelectorLabel}`)
        .classed(style.fieldSelectorHead, true)
        .text(text)
        .on('click', displayClick);
    d3.select(model.innerDiv)
      .select('th.field-selector-label')
      .select('div.field-selector-search')
        .style('min-width', model.displaySearch ? '11rem' : '0') // Not sure how else to get necessary width...
        .classed(style.fieldSelectorHead, true);
    if (model.showSelectedFirstToggle) {
      d3.select(model.innerDiv).select(`.${style.jsSelectedFirst}`).select('i')
        .classed(model.displaySelectedFirst ? style.allFieldsIcon : style.selectedFirstIcon, false)
        .classed(!model.displaySelectedFirst ? style.allFieldsIcon : style.selectedFirstIcon, true)
        .classed(style.disabled, model.display !== 'all');
      d3.select(model.innerDiv).selectAll(`.${style.jsSelectedFirst}`)
        .classed(style.disabled, model.display !== 'all');
    }

    // test for too-long rows
    const hideMore = model.innerDiv.scrollWidth > model.innerDiv.clientWidth;
    if (hideMore) {
      if (!hideField.minMax) {
        hideField.minMax = true;
        hideField.minMaxWidth = model.innerDiv.scrollWidth;
        // if we hide min/max, we may also need to hide hist, so trigger another resize
        setTimeout(publicAPI.resize, 0);
      } else if (!hideField.hist) {
        hideField.hist = true;
        hideField.histWidth = model.innerDiv.scrollWidth;
      }
    } else if (hideField.minMax) {
      // if we've hidden something, see if we can re-show it.
      if (hideField.hist) {
        if (model.innerDiv.scrollWidth - hideField.histWidth > 0) {
          hideField.hist = false;
          hideField.histWidth = 0;
          // if we show hist, we may also need to show min/max, so trigger another resize
          setTimeout(publicAPI.resize, 0);
        }
      } else if (hideField.minMax) {
        if (model.innerDiv.scrollWidth - hideField.minMaxWidth > 0) {
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

    // Sorting
    // console.log('Sort ', model.sortMult === 1 ? 'normal' : 'reversed');
    if (!model.sortArray) {
      data.sort((a, b) =>
        (model.sortMult * (a.name < b.name ? -1 :
          (a.name > b.name) ? 1 : 0)));
    } else {
      data.sort((a, b) => {
        const result = (model.sortMult * (model.sortArray[b.id] - model.sortArray[a.id]));
        if (result === 0) {
          return (a.name < b.name ? -1 :
          (a.name > b.name) ? 1 : 0);
        }
        return result;
      });
    }

    // pull selected fields to the top, after sorting, if configured.
    if (model.displaySelectedFirst && model.display === 'all') {
      const newData = data.filter(xx => xx.active).concat(data.filter(xx => !xx.active));
      newData.forEach((d, i) => { data[i] = d; });
    }

    // Handle variables
    const variablesContainer = d3
      .select(`.${style.jsTBody}`)
      .selectAll('tr')
      .data(data);

    variablesContainer.enter().append('tr');
    variablesContainer.exit().remove();

    // Hovering anywhere over a row (except its histogram, when
    // bin-hovering is enabled) triggers a field-hover event that
    // can provide context for the field.
    if (model.provider.isA('FieldHoverProvider')) {
      variablesContainer
        .on('mouseenter', (d, i) => {
          const state = { highlight: {}, disposition: 'preliminary' };
          state.highlight[d.name] = { weight: 1 };
          model.provider.setFieldHoverState({ state });
        })
        .on('mouseleave', (d, i) => {
          const state = { highlight: {}, disposition: 'preliminary' };
          model.provider.setFieldHoverState({ state });
        });
    }

    // track if any quantiles are available at all.
    let foundQuantile = false;

    // Apply on each data item
    function renderField(fieldInfo, index) {
      const fieldName = fieldInfo.name;
      const field = model.provider.getField(fieldName) || fieldInfo;
      const fieldContainer = d3.select(this);
      let legendCell = fieldContainer.select(`.${style.jsLegend}`);
      let fieldCell = fieldContainer.select(`.${style.jsFieldName}`);
      if (field.quantiles) foundQuantile = true;


      // Apply style to row (selected/unselected)
      fieldContainer
        .classed(!field.active ? style.selectedRow : style.unselectedRow, false)
        .classed(field.active ? style.selectedRow : style.unselectedRow, true)
        .on('dblclick', (entry) => {
          model.provider.toggleFieldSelection(entry.name);
          // if (fieldInfo) fieldInfo.active = !fieldInfo.active;
        });
      if (model.provider.isA('FieldHoverProvider')) {
        fieldContainer
          .on('click', (entry) => {
            const state = { highlight: {}, subject: entry.name, disposition: 'final' };
            state.highlight[entry.name] = { weight: 1 };
            model.provider.setFieldHoverState({ state });
          });
      }
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
    const svg = d3.select(model.innerDiv);
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
  model.subscriptions.push(model.provider.onFieldChange(publicAPI.handleFieldChange));
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

  if (model.provider.isA('FieldHoverProvider')) {
    model.subscriptions.push(
      model.provider.onHoverFieldChange((hover) => {
        d3.select(`.${style.jsTBody}`)
          .selectAll('tr')
          .classed(style.highlightedRow, d => d.name in hover.state.highlight);
      }));
  }

  if (model.provider.isA('FieldInformationProvider')) {
    model.subscriptions.push(
      model.provider.subscribeToFieldInformation(
        publicAPI.setFieldsToRender));
  } else {
    publicAPI.setFieldsToRender();
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  outerContainer: null,
  container: null,
  provider: null,
  sortByVar: null,
  sortMult: 1,
  displaySearch: false,
  displaySelectedFirst: false,
  display: 'all',
  fieldShowHistogram: true,
  fieldHistWidth: 120,
  fieldHistHeight: 15,
  numberOfBins: 32,
  showSelectedFirstToggle: false,
  showHeader: true,
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
