import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

const EMPTY_HISTOGRAM = {
  bins: [],
  x: { delta: 1, extent: 2 },
  y: { delta: 1, extent: 2 },
  empty: true,
  pending: true,
};

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
// Selection Provider
// ----------------------------------------------------------------------------

function selectionProvider(publicAPI, model) {
  // Private members
  let fetchCallback = null;
  const requestQueue = [];
  const readyListeners = [];

  // Protected members
  if (!model.histogram2DSelectionData) {
    model.histogram2DSelectionData = {};
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
  publicAPI.setSelectionHistogram2DFetchCallback = fetch => {
    if (requestQueue.length) {
      fetch(requestQueue);
    }
    fetchCallback = fetch;
  };

  // Data access
  publicAPI.setSelectionHistogram2DNumberOfBins = bin => {
    model.histogram2DSelectionData = {};
    model.selectionHistogram2DNumberOfBins = bin;
  };

  // Return true if data is available
  publicAPI.loadSelectionHistogram2D = (axisA, axisB) => {
    requestQueue.push([axisA, axisB]);

    if (model.histogram2DSelectionData[axisA] && model.histogram2DSelectionData[axisA][axisB]) {
      if (model.histogram2DSelectionData[axisA][axisB].pending) {
        return false;
      }
      return true;
    }
    if (model.histogram2DSelectionData[axisB] && model.histogram2DSelectionData[axisB][axisA]) {
      if (!model.histogram2DSelectionData[axisA]) {
        model.histogram2DSelectionData[axisA] = {};
      }
      model.histogram2DSelectionData[axisA][axisB] = flipHistogram(model.histogram2DSelectionData[axisB][axisA]);
      return true;
    }

    if (!model.histogram2DSelectionData[axisA]) {
      model.histogram2DSelectionData[axisA] = {};
    }
    model.histogram2DSelectionData[axisA][axisB] = EMPTY_HISTOGRAM;

    // Request data if possible
    if (fetchCallback) {
      fetchCallback(requestQueue);
    }

    return false;
  };

  publicAPI.onSelectionHistogram2DReady = callback => {
    const idx = readyListeners.length;
    const unsubscribe = () => { readyListeners[idx] = null; };
    readyListeners.push(callback);
    return { unsubscribe };
  };


  publicAPI.getSelectionHistogram2D = (axisA, axisB) => {
    if (model.histogram2DSelectionData[axisA] && model.histogram2DSelectionData[axisA][axisB]) {
      return model.histogram2DSelectionData[axisA][axisB];
    }
    return EMPTY_HISTOGRAM;
  };

  publicAPI.setSelectionHistogram2D = (axisA, axisB, data) => {
    if (!model.histogram2DSelectionData[axisA]) {
      model.histogram2DSelectionData[axisA] = {};
    }
    if (!model.histogram2DSelectionData[axisB]) {
      model.histogram2DSelectionData[axisB] = {};
    }
    model.histogram2DSelectionData[axisA][axisB] = data;
    model.histogram2DSelectionData[axisB][axisA] = flipHistogram(data);

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

  publicAPI.getSelectionMaxCount = (axisA, axisB) => {
    if (model.histogram2DSelectionData[axisA] && model.histogram2DSelectionData[axisA][axisB] && model.histogram2DSelectionData[axisA][axisB].bins) {
      if (!model.histogram2DSelectionData[axisA][axisB].maxCount) {
        let count = 0;
        model.histogram2DSelectionData[axisA][axisB].bins.forEach(item => {
          count = count < item.count ? item.count : count;
        });
        model.histogram2DSelectionData[axisA][axisB].maxCount = count;
      }
      return model.histogram2DSelectionData[axisA][axisB].maxCount;
    }
    return 0;
  };

  publicAPI.getSelectionMaxCounts = listOfAxisPair => listOfAxisPair.map(args => publicAPI.getSelectionMaxCount(args[0], args[1]));
  publicAPI.getSelectionMaxOfMaxCounts = listOfAxisPair => Math.max.apply(null, publicAPI.getSelectionMaxCounts(listOfAxisPair));

  // --------------------------------

  publicAPI.resetSelectionHistogram2D = () => {
    while (requestQueue.length) {
      requestQueue.pop();
    }
  };

  publicAPI.setSelection = selection => {
    model.selection = selection;
    publicAPI.fireSelectionChange(selection);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  selection: null,
  histogram2DSelectionData: null,
  selectionHistogram2DNumberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'SelectionProvider');
  CompositeClosureHelper.get(publicAPI, model, ['selectionHistogram2DNumberOfBins', 'selection']);
  CompositeClosureHelper.event(publicAPI, model, 'selectionChange');

  selectionProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
