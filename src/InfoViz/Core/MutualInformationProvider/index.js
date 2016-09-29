import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

import PMI from './pmi';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

function listToPair(list = []) {
  const size = list.length;
  const pairList = [];
  list.forEach((name, idx) => {
    for (let i = idx; i < size; i++) {
      pairList.push([name, list[i]]);
    }
  });
  return pairList;
}

// ----------------------------------------------------------------------------
// Mutual Information Provider
// ----------------------------------------------------------------------------

function mutualInformationProvider(publicAPI, model) {
  let hasData = false;
  const onMutualInformationReady = publicAPI.onMutualInformationReady;
  const mutualInformationData = PMI.initializeMutualInformationData();
  const deltaHandling = { added: [], removed: [], modified: [], previousMTime: {}, currentMTime: {} };

  function updateHistogram2D(histograms) {
    if (Object.keys(histograms).length > 1) {
      const invalidAxis = [];
      // Extract mtime
      deltaHandling.modified = [];
      deltaHandling.previousMTime = deltaHandling.currentMTime;
      deltaHandling.currentMTime = {};
      model.mutualInformationParameterNames.forEach(name => {
        if (histograms[name] && histograms[name][name]) {
          // Validate range
          if (histograms[name][name].x.delta === 0) {
            invalidAxis.push(name);
            deltaHandling.currentMTime[name] = 0;
          } else {
            deltaHandling.currentMTime[name] = histograms[name][name].x.mtime;
          }

          if (deltaHandling.added.indexOf(name) === -1
            && deltaHandling.currentMTime[name]
            && (deltaHandling.previousMTime[name] || 0) < deltaHandling.currentMTime[name]) {
            deltaHandling.modified.push(name);
          }
        }
      });

      PMI.updateMutualInformation(
        mutualInformationData,
        [].concat(deltaHandling.added, deltaHandling.modified),
        [].concat(deltaHandling.removed, invalidAxis),
        histograms);

      // Push the new mutual info
      hasData = true;
      publicAPI.fireMutualInformationReady(mutualInformationData);
    }
  }

  publicAPI.onMutualInformationReady = callback => {
    if (hasData) {
      callback(mutualInformationData);
    }
    return onMutualInformationReady(callback);
  };

  publicAPI.setHistogram2dProvider = provider => {
    if (model.histogram2dProviderSubscription) {
      model.histogram2dProviderSubscription.unsubscribe();
    }
    model.histogram2dProvider = provider;
    if (provider) {
      model.histogram2dProviderSubscription = provider.subscribeToHistogram2D(
        updateHistogram2D,
        listToPair(model.mutualInformationParameterNames),
        { symmetric: true, partial: false }
      );
    }
  };

  publicAPI.setMutualInformationParameterNames = names => {
    deltaHandling.added = names.filter(name => model.mutualInformationParameterNames.indexOf(name) === -1);
    deltaHandling.removed = model.mutualInformationParameterNames.filter(name => names.indexOf(name) === -1);

    model.mutualInformationParameterNames = [].concat(names);
    if (model.histogram2dProviderSubscription) {
      model.histogram2dProviderSubscription.update(listToPair(model.mutualInformationParameterNames));
    }
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
  CompositeClosureHelper.get(publicAPI, model, ['histogram2dProvider']);
  CompositeClosureHelper.event(publicAPI, model, 'mutualInformationReady');

  mutualInformationProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
