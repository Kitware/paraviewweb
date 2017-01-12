import d3 from 'd3';
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
    }

    model.container = el;
    model.fieldsToRender = null;

    if (el) {
      d3.select(model.container).html(template);
      d3.select(model.container).select('.fieldSelector').classed(style.fieldSelector, true);
      if (model.displaySearch) {
        model.searchBar = new ReactAdapter(FieldSearch, { provider: model.provider });
        model.searchBar.setContainer(d3.select(model.container).select('.field-selector-search').node());
      }

      model.fieldShowHistogram = model.fieldShowHistogram && (model.provider.isA('Histogram1DProvider'));
      // append headers for histogram columns
      if (model.fieldShowHistogram) {
        const header = d3.select(model.container).select('thead').select('tr');
        header.append('th').text('Min').classed(style.jsHistMin, true);
        header.append('th').text('Histogram').classed(style.jsSparkline, true);
        header.append('th').text('Max').classed(style.jsHistMax, true);
      }

      model.subscriptions.push(
        model.provider.subscribeToFieldInformation(
          publicAPI.setFieldsToRender));
    }
  };

  publicAPI.setFieldsToRender = (info) => {
    const fieldList = Object.keys(info.fieldMapping).map((key, idx) => ({
      name: info.fieldMapping[key].name,
      id: info.fieldMapping[key].id,
      range: info.fieldMapping[key].range,
      active: info.fieldMapping[key].active,
      originalRow: idx, // where in the table the row should appear in the "default" view.
      row: idx, // where in the table the row should appear on the next render
    }));
    model.fieldsToRender = fieldList;
    model.mutualInformationMatrix = info.mutualInformation;
    publicAPI.render();
  }

  publicAPI.getFieldsToRender = () => JSON.parse(JSON.stringify(model.fieldsToRender));

  publicAPI.render = () => {
    if (!model.container || !model.fieldsToRender) {
      return;
    }

    const legendSize = 15;

    // Apply style
    d3.select(model.container).select('thead').classed(style.thead, true);
    d3.select(model.container).select('tbody').classed(style.tbody, true);
    d3.select(model.container)
      .select('th.field-selector-mode')
      .on('click', (d) => {
        model.displayUnselected = !model.displayUnselected;
        publicAPI.render();
      })
      .select('i')
      // apply class - 'false' should come first to not remove common base class.
      .classed(!model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed(model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, true);


    const data = model.displayUnselected ? model.fieldsToRender : model.fieldsToRender.filter(xx => xx.active);
    const totalNum = model.fieldsToRender.length;

    // Update header label
    d3.select(model.container)
      .select('th.field-selector-label')
      .style('text-align', 'left')
      .select('div.field-selector-label')
        .classed(style.fieldSelectorHead, true)
        .text(model.displayUnselected ? `Only Selected (${data.length} total)` : `Only Selected (${data.length} / ${totalNum} total)`)
        .on('click', (d) => {
          model.displayUnselected = !model.displayUnselected;
          publicAPI.render();
        });
    d3.select(model.container)
      .select('th.field-selector-label')
      .select('div.field-selector-search')
        .style('width', '400px') // FIXME: Evil!
        .classed(style.fieldSelectorHead, true);

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
    const header = d3.select(model.container).select('thead').select('tr');
    header.selectAll(`.${style.jsHistMin}`)
      .style('display', hideField.minMax ? 'none' : null);
    header.selectAll(`.${style.jsSparkline}`)
      .style('display', hideField.hist ? 'none' : null);
    header.selectAll(`.${style.jsHistMax}`)
      .style('display', hideField.minMax ? 'none' : null);

    if (model.sortDirty) {
      console.log('Sort by var ', model.sortByVar);
      if (model.sortByVar === null) {
        data.sort((a, b) => a.name > b.name);
      } else {
        data.sort((a, b) =>
          (a.id === model.sortByVar ? false : (
            b.id === model.sortByVar ? true : (
              model.mutualInformationMatrix[model.sortByVar][a.id] < model.mutualInformationMatrix[model.sortByVar][b.id]))));
      }
      model.sortDirty = false;
    }
    // Handle variables
    const variablesContainer = d3
      .select(model.container)
      .select('tbody.fields')
      .selectAll('tr')
      .data(data);

    variablesContainer.enter().append('tr');
    variablesContainer.exit().remove();

    // Hovering anywhere over a row (except its histogram, when
    // bin-hovering is enabled) triggers a field-hover event that
    // can provide context for the field.
    if (model.provider.isA('FieldHoverProvider')) {
      d3
        .select(model.container)
        .select('tbody.fields')
        .selectAll('tr')
        .on('mouseenter', function inner(d, i) {
          const state = { highlight: {}, disposition: 'preliminary' };
          state.highlight[d.name] = { weight: 1 };
          model.provider.setFieldHoverState({ state });
        })
        .on('mouseleave', (d, i) => {
          const state = { highlight: {}, disposition: 'final' };
          model.provider.setFieldHoverState({ state });
        });
      model.subscriptions.push(
        model.provider.onHoverFieldChange(hover => {
          let sortOrder = null;
          d3
            .select(model.container)
            .select('tbody.fields')
            .selectAll('tr')
            .classed(style.highlightedRow, d => d.name in hover.state.highlight);
          if ('subject' in hover.state && hover.state.subject !== null) {
            console.log('Reorder by mutual information to ', hover.state.subject);
            sortOrder = model.fieldsToRender.reduce(
              (varId, entry) => entry.name === hover.state.subject ? entry.id : varId,
              null);
          } else {
            sortOrder = null;
          }
          if (model.sortByVar !== sortOrder && sortOrder) {
            model.sortByVar = sortOrder;
            model.sortDirty = true;
            publicAPI.render();
          }
        }));
    }

    // Apply on each data item
    function renderField(fieldInfo, index) {
      const fieldName = fieldInfo.name;
      const field = fieldInfo; // model.provider.getField(fieldName);
      const fieldContainer = d3.select(this);
      let legendCell = fieldContainer.select(`.${style.jsLegend}`);
      let fieldCell = fieldContainer.select(`.${style.jsFieldName}`);

      // Apply style to row (selected/unselected)
      fieldContainer
        .classed(!field.active ? style.selectedRow : style.unselectedRow, false)
        .classed(field.active ? style.selectedRow : style.unselectedRow, true)
        .on('click', (entry) => {
          const state = { highlight: {}, subject: entry.name, disposition: 'final' };
          state.highlight[entry.name] = { weight: 1 };
          model.provider.setFieldHoverState({ state });
        })
        .on('dblclick', (entry) => {
          model.provider.toggleFieldSelection(entry.name);
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
  sortByVar: null,
  sortDirty: true,
  displaySearch: false,
  displayUnselected: true,
  fieldShowHistogram: true,
  fieldHistWidth: 120,
  fieldHistHeight: 15,
  numberOfBins: 32,
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
