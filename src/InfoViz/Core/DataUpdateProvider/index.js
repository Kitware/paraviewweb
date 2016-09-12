import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import dataHelper from '../SelectionProvider/dataHelper';

// ----------------------------------------------------------------------------
// Data Update Provider
// ----------------------------------------------------------------------------

function dataUpdateProvider(publicAPI, model) {
  const dataSubscriptions = [];

  if (!model.updatedData) {
    model.updatedData = {};
  }

  function off() {
    let count = dataSubscriptions.length;
    while (count--) {
      dataSubscriptions[count] = null;
    }
  }

  function flushDataToListener(dataListener) {
    try {
      if (dataListener) {
        const event = dataHelper.getNotificationData(model.updatedData, dataListener.request);
        if (event) {
          dataListener.onDataReady(event);
        }
      }
    } catch (err) {
      console.log('flushDataToListener error caught:', err);
    }
  }

  // Method use to store received data
  publicAPI.setUpdatedData = data => {
    dataHelper.set(model.updatedData, data);

    // Process all subscription to see if we can trigger a notification
    dataSubscriptions.forEach(flushDataToListener);
  };

  // --------------------------------

  publicAPI.subscribeToDataUpdate = (type, onDataReady, variables = [], metadata = {}) => {
    const id = dataSubscriptions.length;
    const request = { id, type, variables, metadata };
    const dataListener = { onDataReady, request };
    dataSubscriptions.push(dataListener);
    publicAPI.fireDataChange(request);
    flushDataToListener(dataListener);
    return {
      unsubscribe() {
        request.action = 'unsubscribe';
        publicAPI.fireDataChange(request);
        dataSubscriptions[id] = null;
      },
      update(vars, meta) {
        request.variables = [].concat(vars);
        request.metadata = Object.assign({}, request.metadata, meta);
        publicAPI.fireDataChange(request);
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

};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'DataUpdateProvider');
  CompositeClosureHelper.event(publicAPI, model, 'dataChange');

  dataUpdateProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
