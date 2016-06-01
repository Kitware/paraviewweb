import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Histogram 1D Provider
// ----------------------------------------------------------------------------

function histogram1DProvider(publicAPI, model) {
  // Private members
  let fetchCallback = null;
  const requestQueue = [];
  const readyListeners = [];

  // Protected members
  if (!model.histogram1DData) {
    model.histogram1DData = {};
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
  publicAPI.setHistogram1DFetchCallback = fetch => {
    if (requestQueue.length) {
      fetch(requestQueue);
    }
    fetchCallback = fetch;
  };

  // Data access
  publicAPI.setHistogram1DNumberOfBins = bin => {
    model.histogram1DData = {};
    model.histogram1DNumberOfBins = bin;
  };

  // Return true if data is available
  publicAPI.loadHistogram1D = field => {
    if (!model.histogram1DData[field]) {
      model.histogram1DData[field] = { pending: true };
      requestQueue.push(field);
      if (fetchCallback) {
        fetchCallback(requestQueue);
      }
      return false;
    }

    if (model.histogram1DData[field].pending) {
      return false;
    }

    return true;
  };

  publicAPI.onHistogram1DReady = callback => {
    const idx = readyListeners.length;
    const unsubscribe = () => { readyListeners[idx] = null; };
    readyListeners.push(callback);
    return { unsubscribe };
  };

  publicAPI.getHistogram1D = field => model.histogram1DData[field];
  publicAPI.setHistogram1D = (field, data) => {
    model.histogram1DData[field] = data;
    readyListeners.filter(ready => !!ready).forEach(ready => {
      try {
        ready(field, data);
      } catch (err) {
        console.log('Fail notifying ready callback', err);
      }
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  histogram1DData: null,
  histogram1DNumberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'Histogram1DProvider');
  CompositeClosureHelper.get(publicAPI, model, ['histogram1DNumberOfBins']);

  histogram1DProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
