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
  publicAPI.resize = () => {
    publicAPI.render();
  };

  publicAPI.setContainer = el => {
    if (model.container) {
      d3.select(model.container).select('div.fieldSelector').remove();
    }

    model.container = el;

    if (el) {
      d3.select(model.container).html(template);
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
      .classed(!model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed(model.displayUnselected ? style.allFieldsIcon : style.selectedFieldsIcon, true);


    // Update header label
    d3.select(model.container)
      .select('th.label')
      .text(model.displayUnselected ? 'All Variables' : 'Selected Variables')
      .on('click', d => {
        model.displayUnselected = !model.displayUnselected;
        publicAPI.render();
      });

    // Handle variables
    const data = model.displayUnselected ? model.provider.getFieldNames() : model.provider.getActiveFieldNames();
    const variablesContainer = d3
      .select(model.container)
      .select('tbody.fields')
      .selectAll('tr')
      .data(data);

    variablesContainer.enter().append('tr');
    variablesContainer.exit().remove();

    // Apply on each data item
    function renderField(d, i) {
      const field = model.provider.getField(d);
      const fieldContainer = d3.select(this);
      let legendCell = fieldContainer.select('.legend');
      let fieldCell = fieldContainer.select('.field');

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
          .classed('legend', true)
          .classed(style.legend, true);

        fieldCell = fieldContainer
          .append('td')
          .classed('field', true)
          .classed(style.fieldName, true);
      }

      // Apply legend
      if (model.provider.isA('LegendProvider')) {
        const { color, shape } = model.provider.getLegend(d);
        legendCell
          .html(`<svg width="${legendSize}" height="${legendSize}" fill="${color}"><use xlink:href="${shape}"/></svg>`);
      } else {
        legendCell
          .html('<i></i>')
          .select('i')
          .classed(style.selectedRow, field.active)
          .classed(style.row, !field.active);
      }

      // Apply field name
      fieldCell.text(d);
    }

    // Render all fields
    d3.select(model.container)
      .select('tbody.fields')
      .selectAll('tr')
      .each(renderField);
  };

  // Make sure default values get applied
  publicAPI.setContainer(model.container);

  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  model.subscriptions.push(model.provider.onFieldChange(publicAPI.render));
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,
  displayUnselected: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container']);

  fieldSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
