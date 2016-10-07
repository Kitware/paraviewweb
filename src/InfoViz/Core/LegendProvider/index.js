import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import legendShapes from './shapes';
import palettes from '../../../Common/Misc/ColorPalettes';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

function convert(item, model) {
  const result = { color: item.colors };
  result.shape = model.legendShapes[item.shapes];
  return result;
}

export function createSortedIterator(priorityOrder, propertyChoices, defaultValues) {
  const propertyKeys = Object.keys(propertyChoices);

  const prioritySizes = priorityOrder.map(name => propertyChoices[name].length);
  const priorityIndex = prioritySizes.map(i => 0);

  const get = () => {
    const item = {};
    propertyKeys.forEach((name) => {
      const idx = priorityOrder.indexOf(name);
      if (idx === -1) {
        item[name] = defaultValues[name];
      } else {
        item[name] = propertyChoices[name][priorityIndex[idx]];
      }
    });
    return item;
  };

  const next = () => {
    let overflowIdx = 0;
    priorityIndex[overflowIdx] += 1;
    while (priorityIndex[overflowIdx] === prioritySizes[overflowIdx]) {
      // Handle overflow
      priorityIndex[overflowIdx] = 0;
      if (overflowIdx < priorityIndex.length) {
        overflowIdx += 1;
        priorityIndex[overflowIdx] += 1;
      }
    }
  };

  return { get, next };
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  shapes: legendShapes,
  palettes,
};

// ----------------------------------------------------------------------------
// Legend Provider
// ----------------------------------------------------------------------------

function legendProvider(publicAPI, model) {
  publicAPI.addLegendEntry = (name) => {
    if (model.legendEntries.indexOf(name) === -1 && name) {
      model.legendEntries.push(name);
      model.legendDirty = true;
    }
  };

  publicAPI.removeLegendEntry = (name) => {
    if (model.legendEntries.indexOf(name) !== -1 && name) {
      model.legendEntries.splice(model.legendEntries.indexOf(name), 1);
      model.legendDirty = true;
    }
  };
  publicAPI.removeAllLegendEntry = () => {
    model.legendEntries = [];
    model.legendDirty = true;
  };

  publicAPI.assignLegend = (newPriority = null) => {
    if (newPriority) {
      model.legendPriorities = newPriority;
      model.legendDirty = true;
    }
    if (model.legendDirty) {
      const shapesArray = Object.keys(model.legendShapes);
      model.legendDirty = false;
      model.legendMapping = {};

      if (model.legendPriorities && model.legendPriorities.length) {
        const defaultColor = model.legendColors[0];
        const defaultShape = shapesArray[0];

        const iterator = createSortedIterator(
          model.legendPriorities,
          { colors: model.legendColors, shapes: shapesArray },
          { colors: defaultColor, shapes: defaultShape });

        model.legendEntries.forEach((name) => {
          model.legendMapping[name] = convert(iterator.get(), model);
          iterator.next();
        });
      } else {
        model.legendEntries.forEach((name, idx) => {
          model.legendMapping[name] = {
            color: model.legendColors[idx % model.legendColors.length],
            shape: model.legendShapes[shapesArray[idx % shapesArray.length]],
          };
        });
      }
    }
  };

  publicAPI.useLegendPalette = (name) => {
    const colorSet = palettes[name];
    if (colorSet) {
      model.legendColors = [].concat(colorSet);
      model.legendDirty = true;
    }
  };

  publicAPI.updateLegendSettings = (settings) => {
    ['legendShapes', 'legendColors', 'legendEntries', 'legendPriorities'].forEach((key) => {
      if (settings[key]) {
        model[key] = [].concat(settings.key);
        model.legendDirty = true;
      }
    });
  };

  publicAPI.listLegendColorPalettes = () => Object.keys(palettes);

  publicAPI.getLegend = (name) => {
    if (model.legendDirty) {
      publicAPI.assignLegend();
    }
    return model.legendMapping[name];
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  legendShapes,
  legendColors: [].concat(palettes.Paired),
  legendEntries: [],
  legendPriorities: ['shapes', 'colors'],
  legendMapping: {},
  legendDirty: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'LegendProvider');

  legendProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
