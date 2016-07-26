import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import dataHelper from './dataHelper';

// ----------------------------------------------------------------------------
// Selection Provider
// ----------------------------------------------------------------------------

function selectionProvider(publicAPI, model) {
  const dataSubscriptions = [];

  if (!model.selectionData) {
    model.selectionData = {};
  }
  if (!model.selectionMetaData) {
    model.selectionMetaData = {};
  }

  function off() {
    let count = dataSubscriptions.length;
    while (count--) {
      dataSubscriptions[count] = null;
    }
  }

  function flushDataToListener(dataListener) {
    if (dataListener) {
      const event = dataHelper.getNotificationData(model.selectionData, dataListener.request);
      if (event) {
        dataListener.onDataReady(event);
      }
    }
  }

  // Method use to store received data
  publicAPI.setSelectionData = data => {
    dataHelper.set(model.selectionData, data);

    // Process all subscription to see if we can trigger a notification
    dataSubscriptions.forEach(flushDataToListener);
  };

  // Method use to access cached data. Will return undefined if not available
  publicAPI.getSelectionData = query => dataHelper.get(model.selectionData, query);

  // Use to extend data subscription
  publicAPI.updateMetadata = addon => {
    model.selectionMetaData[addon.type] = Object.assign({}, model.selectionMetaData[addon.type], addon.metadata);
  };

  // Get metadata for a given data type
  publicAPI.getMetadata = type => model.selectionMetaData[type];

  // --------------------------------

  publicAPI.setSelection = (selection) => {
    model.selection = selection;
    publicAPI.fireSelectionChange(selection);
  };

  // --------------------------------

  publicAPI.subscribeToDataSelection = (type, onDataReady, variables = []) => {
    const id = dataSubscriptions.length;
    const request = { id, type, variables };
    const dataListener = { onDataReady, request };
    dataSubscriptions.push(dataListener);
    publicAPI.fireDataSubscriptionChange(request);
    flushDataToListener(dataListener);
    return {
      unsubscribe() {
        dataSubscriptions[id] = null;
      },
      update(newVars) {
        request.variables = [].concat(newVars);
        publicAPI.fireDataSubscriptionChange(request);
        flushDataToListener(dataListener);
      },
    };
  };

  publicAPI.destroy = CompositeClosureHelper.chain(off, publicAPI.destroy);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // selection: null,
  // selectionData: null,
  // selectionMetaData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'SelectionProvider');
  CompositeClosureHelper.get(publicAPI, model, ['selection']);
  CompositeClosureHelper.event(publicAPI, model, 'selectionChange');
  CompositeClosureHelper.event(publicAPI, model, 'dataSubscriptionChange');

  selectionProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
