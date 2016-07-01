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

function histogram2DProvider(publicAPI, model, fetchHelper) {
  // Private members
  const ready = publicAPI.fireHistogram2DReady;
  delete publicAPI.fireHistogram2DReady;

  // Protected members
  if (!model.histogram2DData) {
    model.histogram2DData = {};
  }

  // Data access
  publicAPI.setHistogram2DNumberOfBins = bin => {
    if (model.histogram2DNumberOfBins !== bin) {
      model.histogram2DData = {};
      model.histogram2DNumberOfBins = bin;
    }
  };

  // Return true if data is available
  publicAPI.loadHistogram2D = (axisA, axisB) => {
    if (model.histogram2DData[axisA] && model.histogram2DData[axisA][axisB]) {
      if (model.histogram2DData[axisA][axisB].pending) {
        return false;
      }
      return true;
    }
    if (model.histogram2DData[axisB] && model.histogram2DData[axisB][axisA] && !model.histogram2DData[axisB][axisA].pending) {
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
    fetchHelper.addRequest([axisA, axisB]);

    return false;
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
      ready(axisA, axisB, data);
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
  // histogram2DData: null,
  histogram2DNumberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'Histogram2DProvider');
  CompositeClosureHelper.get(publicAPI, model, ['histogram2DNumberOfBins']);
  CompositeClosureHelper.event(publicAPI, model, 'Histogram2DReady');
  const fetchHelper = CompositeClosureHelper.fetch(publicAPI, model, 'Histogram2D');

  histogram2DProvider(publicAPI, model, fetchHelper);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
