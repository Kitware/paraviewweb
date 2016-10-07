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
    while (count) {
      count -= 1;
      dataSubscriptions[count] = null;
    }
  }

  function flushDataToListener(dataListener, dataChanged) {
    try {
      if (dataListener) {
        const event = dataHelper.getNotificationData(model.selectionData, dataListener.request);
        if (event) {
          if (dataChanged && dataChanged.type === dataListener.request.type) {
            dataListener.onDataReady(event);
          } else if (!dataChanged) {
            dataListener.onDataReady(event);
          }
        }
      }
    } catch (err) {
      console.log('flushDataToListener error caught:', err);
    }
  }

  // Method use to store received data
  publicAPI.setSelectionData = (data) => {
    dataHelper.set(model.selectionData, data);

    // Process all subscription to see if we can trigger a notification
    dataSubscriptions.forEach(listener => flushDataToListener(listener, data));
  };

  // Method use to access cached data. Will return undefined if not available
  publicAPI.getSelectionData = query => dataHelper.get(model.selectionData, query);

  // Use to extend data subscription
  publicAPI.updateSelectionMetadata = (addon) => {
    model.selectionMetaData[addon.type] = Object.assign({}, model.selectionMetaData[addon.type], addon.metadata);
  };

  // Get metadata for a given data type
  publicAPI.getSelectionMetadata = type => model.selectionMetaData[type];

  // --------------------------------

  publicAPI.setSelection = (selection) => {
    model.selection = selection;
    publicAPI.fireSelectionChange(selection);
  };

  // --------------------------------

  // annotation = {
  //    selection: {...},
  //    score: [0],
  //    weight: 1,
  //    rationale: 'why not...',
  // }

  publicAPI.setAnnotation = (annotation) => {
    model.annotation = annotation;
    if (annotation.selection) {
      publicAPI.setSelection(annotation.selection);
    } else {
      annotation.selection = model.selection;
    }
    model.shouldCreateNewAnnotation = false;
    publicAPI.fireAnnotationChange(annotation);
  };

  // --------------------------------

  publicAPI.shouldCreateNewAnnotation = () => model.shouldCreateNewAnnotation;
  publicAPI.setCreateNewAnnotationFlag = shouldCreate => (model.shouldCreateNewAnnotation = shouldCreate);

  // --------------------------------
  // When a new selection is made, data dependent on that selection will be pushed
  // to subscribers.
  // A subscriber should save the return value and call update() when they need to
  // change the variables or meta data which is pushed to them.
  publicAPI.subscribeToDataSelection = (type, onDataReady, variables = [], metadata = {}) => {
    const id = dataSubscriptions.length;
    const request = { id, type, variables, metadata };
    const dataListener = { onDataReady, request };
    dataSubscriptions.push(dataListener);
    publicAPI.fireDataSelectionSubscriptionChange(request);
    flushDataToListener(dataListener, null);
    return {
      unsubscribe() {
        request.action = 'unsubscribe';
        publicAPI.fireDataSelectionSubscriptionChange(request);
        dataSubscriptions[id] = null;
      },
      update(vars, meta) {
        request.variables = [].concat(vars);
        request.metadata = Object.assign({}, request.metadata, meta);
        publicAPI.fireDataSelectionSubscriptionChange(request);
        flushDataToListener(dataListener, null);
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
  shouldCreateNewAnnotation: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'SelectionProvider');
  CompositeClosureHelper.get(publicAPI, model, ['selection', 'annotation']);
  CompositeClosureHelper.event(publicAPI, model, 'selectionChange');
  CompositeClosureHelper.event(publicAPI, model, 'annotationChange');
  CompositeClosureHelper.event(publicAPI, model, 'dataSelectionSubscriptionChange');

  selectionProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
