import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

import d3 from 'd3';
import style from 'PVWStyle/InfoVizNative/FieldSelector.mcss';
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

  // public API
  publicAPI.resize = () => {
    publicAPI.render();
  };

  publicAPI.setContainer = el => {
    if (model.container) {
      d3.select(model.container).select('div.fieldSelector').remove();
    }

    model.container = el;

    if (el) {
      d3.select(model.container)
        .style('overflow-y', 'auto')
        .style('overflow-x', 'hidden');
      d3.select(model.container).html(template);
      model.fieldShowHistogram = model.fieldShowHistogram && (model.provider.isA('Histogram1DProvider'));
      // append headers for histogram columns
      if (model.fieldShowHistogram) {
        const header = d3.select(model.container).select('thead').select('tr');
        header.append('th').text('Min').classed(style.jsHistMin, true);
        header.append('th').text('Histogram').classed(style.jsSparkline, true);
        header.append('th').text('Max').classed(style.jsHistMax, true);
      }
      publicAPI.render();
    }
  };

  publicAPI.render = () => {
    const legendSize = 15;

    // Apply style
    d3.select(model.container).select('thead').classed(style.thead, true);
    d3.select(model.container).select('tbody').classed(style.tbody, true);
    d3.select(model.container)
      .select('th.mode')
      .on('click', d => {
        model.displayUnselected = !model.displayUnselected;
        publicAPI.render();
      })
      .select('i')
      // apply class - 'false' should come first to not remove common base class.
      .classed(!model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed(model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, true);


    const data = model.displayUnselected ? model.provider.getFieldNames() : model.provider.getActiveFieldNames();
    // Update header label
    d3.select(model.container)
      .select('th.label')
      .text(model.displayUnselected ? `All Variables (${data.length})` : `Selected Variables (${data.length})`)
      .on('click', d => {
        model.displayUnselected = !model.displayUnselected;
        publicAPI.render();
      });

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

    // Handle variables
    const variablesContainer = d3
      .select(model.container)
      .select('tbody.fields')
      .selectAll('tr')
      .data(data);

    variablesContainer.enter().append('tr');
    variablesContainer.exit().remove();

    // Apply on each data item
    function renderField(fieldName, index) {
      const field = model.provider.getField(fieldName);
      const fieldContainer = d3.select(this);
      let legendCell = fieldContainer.select(`.${style.jsLegend}`);
      let fieldCell = fieldContainer.select(`.${style.jsFieldName}`);

      // Apply style to row (selected/unselected)
      fieldContainer
        .classed(!field.active ? style.selectedRow : style.unselectedRow, false)
        .classed(field.active ? style.selectedRow : style.unselectedRow, true)
        .on('click', name => {
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
        if (model.provider.loadHistogram1D(fieldName)) {
          const hobj = model.provider.getHistogram1D(fieldName);
          if (hobj !== null) {
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
                .classed(style.histRect, true)
                .attr('pname', fieldName)
                .attr('y', d => model.fieldHistHeight * (1.0 - d / cmax))
                .attr('x', (d, i) => (model.fieldHistWidth / hsize) * i)
                .attr('height', d => model.fieldHistHeight * d / cmax)
                .attr('width', model.fieldHistWidth / hsize);

              hdata.exit().remove();
            }

            const formatter = d3.format('.3s');
            minCell.text(formatter(hobj.min))
              .style('display', hideField.minMax ? 'none' : null);
            maxCell.text(formatter(hobj.max))
              .style('display', hideField.minMax ? 'none' : null);
          }
        }
      }
    }

    // Render all fields
    variablesContainer
      .each(renderField);
  };

  // Make sure default values get applied
  publicAPI.setContainer(model.container);

  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  model.subscriptions.push(model.provider.onFieldChange(publicAPI.render));
  if (model.fieldShowHistogram) {
    // event from Histogram Provider
    model.subscriptions.push(model.provider.onHistogram1DReady(publicAPI.render));
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
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container', 'fieldShowHistogram']);
  CompositeClosureHelper.set(publicAPI, model, ['fieldShowHistogram']);

  fieldSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
