import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Histogram 1D Provider
// ----------------------------------------------------------------------------

function histogram1DProvider(publicAPI, model, fetchHelper) {
  // Private members
  const ready = publicAPI.fireHistogram1DReady;
  delete publicAPI.fireHistogram1DReady;

  // Protected members
  if (!model.histogram1DData) {
    model.histogram1DData = {};
  }

  // Data access
  publicAPI.setHistogram1DNumberOfBins = bin => {
    if (model.histogram1DNumberOfBins !== bin) {
      model.histogram1DData = {};
      model.histogram1DNumberOfBins = bin;
    }
  };

  // Return true if data is available
  publicAPI.loadHistogram1D = field => {
    if (!model.histogram1DData[field]) {
      model.histogram1DData[field] = { pending: true };
      fetchHelper.addRequest(field);
      return false;
    }

    if (model.histogram1DData[field].pending) {
      return false;
    }

    return true;
  };

  publicAPI.getHistogram1D = field => model.histogram1DData[field];
  publicAPI.setHistogram1D = (field, data) => {
    model.histogram1DData[field] = data;
    setImmediate(() => {
      ready(field, data);
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // histogram1DData: null,
  histogram1DNumberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'Histogram1DProvider');
  CompositeClosureHelper.get(publicAPI, model, ['histogram1DNumberOfBins']);
  CompositeClosureHelper.event(publicAPI, model, 'histogram1DReady');
  const fetchHelper = CompositeClosureHelper.fetch(publicAPI, model, 'Histogram1D');

  histogram1DProvider(publicAPI, model, fetchHelper);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
