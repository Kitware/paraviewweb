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
  // Private members
  let fetchCallback = null;
  const requestQueue = [];
  const readyListeners = [];

  // Protected members
  if (!model.histogram2DData) {
    model.histogram2DData = {};
  }

  // Free listeners at delete time
  function unsubscribeListeners() {
    let count = readyListeners.length;
    while (count--) {
      readyListeners[count] = null;
    }
  }
  model.subscriptions.push({ unsubscribe: unsubscribeListeners });

  // Provide data fetcher
  publicAPI.setHistogram2DFetchCallback = fetch => {
    if (requestQueue.length) {
      fetch(requestQueue);
    }
    fetchCallback = fetch;
  };

  // Data access
  publicAPI.setHistogram2DNumberOfBins = bin => {
    model.histogram2DData = {};
    model.histogram2DNumberOfBins = bin;
  };

  // Return true if data is available
  publicAPI.loadHistogram2D = (axisA, axisB) => {
    if (model.histogram2DData[axisA] && model.histogram2DData[axisA][axisB]) {
      if (model.histogram2DData[axisA][axisB].pending) {
        return false;
      }
      return true;
    }
    if (model.histogram2DData[axisB] && model.histogram2DData[axisB][axisA]) {
      if (!model.histogram2DData[axisA]) {
        model.histogram2DData[axisA] = {};
      }
      model.histogram2DData[axisA][axisB] = flipHistogram(model.histogram2DData[axisB][axisA]);
      return true;
    }

    if (!model.histogram2DData[axisA]) {
      model.histogram2DData[axisA] = {};
    }
    model.histogram2DData[axisA][axisB] = { pending: true };

    // Request data if possible
    requestQueue.push([axisA, axisB]);
    if (fetchCallback) {
      fetchCallback(requestQueue);
    }

    return false;
  };

  publicAPI.onHistogram2DReady = callback => {
    const idx = readyListeners.length;
    const unsubscribe = () => { readyListeners[idx] = null; };
    readyListeners.push(callback);
    return { unsubscribe };
  };

  publicAPI.getHistogram2D = (axisA, axisB) => {
    if (model.histogram2DData[axisA] && model.histogram2DData[axisA][axisB]) {
      return model.histogram2DData[axisA][axisB];
    }
    return null;
  };

  publicAPI.setHistogram2D = (axisA, axisB, data) => {
    if (!model.histogram2DData[axisA]) {
      model.histogram2DData[axisA] = {};
    }
    if (!model.histogram2DData[axisB]) {
      model.histogram2DData[axisB] = {};
    }
    model.histogram2DData[axisA][axisB] = data;
    model.histogram2DData[axisB][axisA] = flipHistogram(data);

    setImmediate(() => {
      readyListeners.filter(ready => !!ready).forEach(ready => {
        try {
          ready(axisA, axisB, data);
        } catch (err) {
          console.log('Fail notifying ready callback', err);
        }
      });
    });
  };

  publicAPI.getMaxCount = (axisA, axisB) => {
    if (model.histogram2DData[axisA] && model.histogram2DData[axisA][axisB] && model.histogram2DData[axisA][axisB].bins) {
      if (!model.histogram2DData[axisA][axisB].maxCount) {
        let count = 0;
        model.histogram2DData[axisA][axisB].bins.forEach(item => {
          count = count < item.count ? item.count : count;
        });
        model.histogram2DData[axisA][axisB].maxCount = count;
      }
      return model.histogram2DData[axisA][axisB].maxCount;
    }
    return 0;
  };

  publicAPI.getMaxCounts = listOfAxisPair => listOfAxisPair.map(args => publicAPI.getMaxCount(args[0], args[1]));
  publicAPI.getMaxOfMaxCounts = listOfAxisPair => Math.max.apply(null, publicAPI.getMaxCounts(listOfAxisPair));
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  histogram2DData: null,
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
