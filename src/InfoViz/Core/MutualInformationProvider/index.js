import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

const SEPARATOR = '--|+|--';

// ----------------------------------------------------------------------------
// Mutual Information Provider
// ----------------------------------------------------------------------------

function mutualInformationProvider(publicAPI, model) {
  // Private members
  let fetchCallback = null;
  const readyListeners = [];

  // Free listeners at delete time
  function unsubscribeListeners() {
    let count = readyListeners.length;
    while (count--) {
      readyListeners[count] = null;
    }
  }
  model.subscriptions.push({ unsubscribe: unsubscribeListeners });

  // Provide data fetcher
  publicAPI.setMutualInformationFetchCallback = fetch => {
    if (model.mutualInformationParameterNames.length) {
      fetch(model.mutualInformationParameterNames);
    }
    fetchCallback = fetch;
  };


  // Return true if data is available
  publicAPI.loadMutualInformation = names => {
    const previousRequest = model.mutualInformationParameterNames.join(SEPARATOR);
    const currentRequest = names.join(SEPARATOR);

    if (previousRequest === currentRequest) {
      return !!model.mutualInformationData;
    }

    // Store request and reset data
    model.mutualInformationParameterNames = [].concat(names);
    model.mutualInformationData = null;

    // Request data if possible
    if (fetchCallback) {
      fetchCallback(model.mutualInformationParameterNames);
    }

    return false;
  };

  publicAPI.onMutualInformationReady = callback => {
    const idx = readyListeners.length;
    const unsubscribe = () => { readyListeners[idx] = null; };
    readyListeners.push(callback);
    return { unsubscribe };
  };

  publicAPI.getMutualInformation = names => {
    const previousRequest = model.mutualInformationParameterNames.join(SEPARATOR);
    const currentRequest = names ? names.join(SEPARATOR) : previousRequest;

    if (previousRequest === currentRequest) {
      return model.mutualInformationData;
    }
    return null;
  };

  publicAPI.setMutualInformation = data => {
    // FIXME (params can be out of synch)
    model.mutualInformationData = data;

    setImmediate(() => {
      readyListeners.filter(ready => !!ready).forEach(ready => {
        try {
          ready(data);
        } catch (err) {
          console.log('Fail notifying ready callback', err);
        }
      });
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mutualInformationData: null,
  mutualInformationParameterNames: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'MutualInformationProvider');
  CompositeClosureHelper.get(publicAPI, model, ['mutualInformationParameterNames']);

  mutualInformationProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
