import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

function flipHistogram(histo2d) {
  const newHisto2d = {
    bins: histo2d.bins.map(bin => {
      const { x, y, count } = bin;
      return {
        x: y,
        y: x,
        count,
      };
    }),
    x: histo2d.y,
    y: histo2d.x };

  return newHisto2d;
}

// ----------------------------------------------------------------------------
// Histogram 2D Provider
// ----------------------------------------------------------------------------

function histogram2DProvider(publicAPI, model) {
  if (!model.cache) {
    model.cache = {};
  }
  model.histogram2dRequestQueue = [];
  model.dataReadyListeners = [];

  publicAPI.setHistogram2DNumberOfBins = bin => {
    model.cache = {};
    model.histogram2DNumberOfBins = bin;
  };

  // Return true if data is available
  publicAPI.loadHistogram2D = (axisA, axisB) => {
    if (model.cache[axisA] && model.cache[axisA][axisB]) {
      if (model.cache[axisA][axisB].pending) {
        return false;
      }
      return true;
    }
    if (model.cache[axisB] && model.cache[axisB][axisA]) {
      if (!model.cache[axisA]) {
        model.cache[axisA] = {};
      }
      model.cache[axisA][axisB] = flipHistogram(model.cache[axisB][axisA]);
      return true;
    }

    if (!model.cache[axisA]) {
      model.cache[axisA] = {};
    }
    model.cache[axisA][axisB] = { pending: true };

    // Queue the call
    model.histogram2dRequestQueue.push([axisA, axisB]);
    setImmediate(publicAPI.processRequests);

    return false;
  };

  publicAPI.processRequests = () => {
    console.log('Default implementation expect only cached data', model.histogram2dRequestQueue);
  };

  publicAPI.onHistogram2DDataReady = callback => {
    const idx = model.dataReadyListeners.length;
    const unsubscribe = () => { model.dataReadyListeners[idx] = null; };
    model.dataReadyListeners.push(callback);
    return { unsubscribe };
  };

  publicAPI.triggerHistogram2DDataReady = () => {
    model.dataReadyListeners.forEach(ready => {
      if (ready) {
        ready();
      }
    });
  };

  publicAPI.getHistogram2D = (axisA, axisB) => {
    if (model.cache[axisA] && model.cache[axisA][axisB]) {
      return model.cache[axisA][axisB];
    }
    return null;
  };

  publicAPI.getMaxCount = (axisA, axisB) => {
    if (model.cache[axisA] && model.cache[axisA][axisB]) {
      if (!model.cache[axisA][axisB].maxCount) {
        let count = 0;
        model.cache[axisA][axisB].bins.forEach(item => {
          count = count < item.count ? item.count : count;
        });
        model.cache[axisA][axisB].maxCount = count;
      }
      return model.cache[axisA][axisB].maxCount;
    }
    return 1;
  };

  publicAPI.getParallelCoordinateMaxCount = axesNames => {
    let maxCount = 1;
    const nbAxes = axesNames.length;
    for (let i = 1; i < nbAxes; i++) {
      const currentCount = publicAPI.getMaxCount(axesNames[i - 1], axesNames[i]);
      maxCount = maxCount < currentCount ? currentCount : maxCount;
    }
    return maxCount;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cache: null,
  histogram2DNumberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'Histogram2DProvider');
  CompositeClosureHelper.get(publicAPI, model, ['histogram2DNumberOfBins']);

  histogram2DProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
