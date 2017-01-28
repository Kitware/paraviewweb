import d3 from 'd3';
// eslint-disable-next-line
import style from 'PVWStyle/InfoVizNative/FieldSelector.mcss';

import   CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import              FieldSearch from '../../../InfoViz/React/FieldSearch';
import             ReactAdapter from '../../../Component/React/ReactAdapter';

import template from './template.html';

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
      d3.select(model.container).html(template);
      // Style the outer div so long field lists will be scrollable:
      model.innerDiv = d3.select(model.container).select('.field-selector-container')
        .classed(style.fieldSelectorContainer, true)
        .node();
      if (!model.innerDiv) model.innerDiv = model.container;
      // Style the table fonts:
      d3.select(model.innerDiv).select('.fieldSelector').classed(style.fieldSelector, true);
      if (model.displaySearch) {
        model.searchBar = new ReactAdapter(FieldSearch, { provider: model.provider });
        model.searchBar.setContainer(d3.select(model.innerDiv).select('.field-selector-search').node());
      }

      model.fieldShowHistogram = model.fieldShowHistogram && (model.provider.isA('Histogram1DProvider'));
      // append headers for histogram columns
      if (model.fieldShowHistogram) {
        const header = d3.select(model.innerDiv).select('thead').select('tr');
        header.append('th').text('Min').classed(style.jsHistMin, true);
        header.append('th').text('Histogram').classed(style.jsSparkline, true);
        header.append('th').text('Max').classed(style.jsHistMax, true);
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
    d3.select(model.innerDiv).select('thead').classed(style.thead, true);
    d3.select(model.innerDiv).select('tbody').classed(style.tbody, true);
    d3.select(model.innerDiv)
      .select('th.field-selector-mode')
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
      .select('div.field-selector-label')
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
    const header = d3.select(model.innerDiv).select('thead').select('tr');
    header.selectAll(`.${style.jsHistMin}`)
      .style('display', hideField.minMax ? 'none' : null);
    header.selectAll(`.${style.jsSparkline}`)
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
      data.sort((a, b) =>
        (model.sortMult * (model.sortArray[b.id] - model.sortArray[a.id])));
    }

    // pull selected fields to the top, after sorting, if configured.
    if (model.displaySelectedFirst && model.display === 'all') {
      const newData = data.filter(xx => xx.active).concat(data.filter(xx => !xx.active));
      newData.forEach((d, i) => { data[i] = d; });
    }

    // Handle variables
    const variablesContainer = d3
      .select(model.innerDiv)
      .select('tbody.fields')
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

    // Apply on each data item
    function renderField(fieldInfo, index) {
      const fieldName = fieldInfo.name;
      const field = model.provider.getField(fieldName) || fieldInfo;
      const fieldContainer = d3.select(this);
      let legendCell = fieldContainer.select(`.${style.jsLegend}`);
      let fieldCell = fieldContainer.select(`.${style.jsFieldName}`);

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
        if (hobj) {
          histCell
            .style('display', hideField.hist ? 'none' : null);

          // only do work if histogram is displayed.
          if (!hideField.hist) {
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
          }

          const formatter = d3.format('.3s');
          minCell.text(formatter(hobj.min))
            .style('display', hideField.minMax ? 'none' : null);
          maxCell.text(formatter(hobj.max))
            .style('display', hideField.minMax ? 'none' : null);
        }
      }
    }

    // Render all fields
    variablesContainer
      .each(renderField);
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
        d3
          .select(model.innerDiv)
          .select('tbody.fields')
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
