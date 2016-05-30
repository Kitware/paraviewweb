import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

const EMPTY_HISTOGRAM = {
  bins: [],
  x: { delta: 1, extent: 2 },
  y: { delta: 1, extent: 2 },
  empty: true,
};

// ----------------------------------------------------------------------------
// Selection Provider
// ----------------------------------------------------------------------------

function selectionProvider(publicAPI, model) {
  model.selectionHistogram2dCache = {};

  publicAPI.applySelection = selection => {
    model.selection = selection;
  };

  publicAPI.resetSelectionHistogram2D = () => {
    model.selectionHistogram2dRequestQueue = [];
  };

  publicAPI.loadSelectionHistogram2D = (axisA, axisB) => {
    model.selectionHistogram2dRequestQueue.push([axisA, axisB]);
  };

  publicAPI.getSelection2DHistogram = (axisA, axisB) => {
    if (model.selectionHistogram2dCache[axisA] && model.selectionHistogram2dCache[axisA][axisB]) {
      return model.selectionHistogram2dCache[axisA][axisB];
    }
    return EMPTY_HISTOGRAM;
  };

  publicAPI.getSelectionMaxCount = (axisA, axisB) => {
    if (model.selectionHistogram2dCache[axisA] && model.selectionHistogram2dCache[axisA][axisB]) {
      if (!model.selectionHistogram2dCache[axisA][axisB].maxCount) {
        let count = 0;
        model.selectionHistogram2dCache[axisA][axisB].bins.forEach(item => {
          count = count < item.count ? item.count : count;
        });
        model.selectionHistogram2dCache[axisA][axisB].maxCount = count;
      }
      return model.selectionHistogram2dCache[axisA][axisB].maxCount;
    }
    return 1;
  };

  publicAPI.getSelectionParallelCoordinateMaxCount = axesNames => {
    let maxCount = 1;
    const nbAxes = axesNames.length;
    for (let i = 1; i < nbAxes; i++) {
      const currentCount = publicAPI.getSelectionMaxCount(axesNames[i - 1], axesNames[i]);
      maxCount = maxCount < currentCount ? currentCount : maxCount;
    }
    return maxCount;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  selection: null,
  selectionHistogram2dCache: null,
  histogram2DNumberOfBins: 32, // Share the same name as histogram 2d provider on purpose
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'SelectionProvider');
  CompositeClosureHelper.get(publicAPI, model, ['histogram2DNumberOfBins']);

  selectionProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
