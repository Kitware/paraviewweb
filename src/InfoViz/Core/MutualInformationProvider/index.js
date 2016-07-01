import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

const SEPARATOR = '--|+|--';

// ----------------------------------------------------------------------------
// Mutual Information Provider
// ----------------------------------------------------------------------------

function mutualInformationProvider(publicAPI, model, fetchHelper) {
  // Private members
  const ready = publicAPI.fireMutualInformationReady;
  delete publicAPI.fireMutualInformationReady;

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

    fetchHelper.addRequest(model.mutualInformationParameterNames);

    return false;
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
    ready(data);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // mutualInformationData: null,
  mutualInformationParameterNames: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'MutualInformationProvider');
  CompositeClosureHelper.get(publicAPI, model, ['mutualInformationParameterNames']);
  CompositeClosureHelper.event(publicAPI, model, 'MutualInformationReady');
  const fetchHelper = CompositeClosureHelper.fetch(publicAPI, model, 'MutualInformation');

  mutualInformationProvider(publicAPI, model, fetchHelper);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
