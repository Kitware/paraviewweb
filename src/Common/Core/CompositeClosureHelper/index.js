// ----------------------------------------------------------------------------
// capitilze provided string
// ----------------------------------------------------------------------------

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ----------------------------------------------------------------------------
// Add isA function and register your class name
// ----------------------------------------------------------------------------

function isA(publicAPI, model = {}, name = null) {
  if (!model.isA) {
    model.isA = [];
  }

  if (name) {
    model.isA.push(name);
  }

  if (!publicAPI.isA) {
    publicAPI.isA = className => (model.isA.indexOf(className) !== -1);
  }
}

// ----------------------------------------------------------------------------
// Basic setter
// ----------------------------------------------------------------------------

function set(publicAPI, model = {}, names = []) {
  names.forEach((name) => {
    publicAPI[`set${capitalize(name)}`] = (value) => {
      model[name] = value;
    };
  });
}

// ----------------------------------------------------------------------------
// Basic getter
// ----------------------------------------------------------------------------

function get(publicAPI, model = {}, names = []) {
  names.forEach((name) => {
    publicAPI[`get${capitalize(name)}`] = () => model[name];
  });
}

// ----------------------------------------------------------------------------
// Add destroy function
// ----------------------------------------------------------------------------

function destroy(publicAPI, model = {}) {
  const previousDestroy = publicAPI.destroy;

  if (!model.subscriptions) {
    model.subscriptions = [];
  }

  publicAPI.destroy = () => {
    if (previousDestroy) {
      previousDestroy();
    }
    while (model.subscriptions && model.subscriptions.length) {
      model.subscriptions.pop().unsubscribe();
    }
    Object.keys(model).forEach((field) => {
      delete model[field];
    });

    // Flag the instance beeing deleted
    model.deleted = true;
  };
}

// ----------------------------------------------------------------------------
// Event handling: onXXX(callback), fireXXX(args...)
// ----------------------------------------------------------------------------

function event(publicAPI, model, eventName, asynchrounous = true) {
  const callbacks = [];
  const previousDestroy = publicAPI.destroy;

  function off(index) {
    callbacks[index] = null;
  }

  function on(index) {
    function unsubscribe() {
      off(index);
    }
    return Object.freeze({ unsubscribe });
  }

  publicAPI[`fire${capitalize(eventName)}`] = (...args) => {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return;
    }

    function processCallbacks() {
      callbacks.forEach((callback) => {
        if (callback) {
          try {
            callback.apply(publicAPI, args);
          } catch (errObj) {
            console.log('Error event:', eventName, errObj);
          }
        }
      });
    }

    if (asynchrounous) {
      setImmediate(processCallbacks);
    } else {
      processCallbacks();
    }
  };

  publicAPI[`on${capitalize(eventName)}`] = (callback) => {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return null;
    }

    const index = callbacks.length;
    callbacks.push(callback);
    return on(index);
  };

  publicAPI.destroy = () => {
    previousDestroy();
    callbacks.forEach((el, index) => off(index));
  };
}

// ----------------------------------------------------------------------------
// Fetch handling: setXXXFetchCallback / return { addRequest }
// ----------------------------------------------------------------------------
function fetch(publicAPI, model, name) {
  let fetchCallback = null;
  const requestQueue = [];

  publicAPI[`set${capitalize(name)}FetchCallback`] = (fetchMethod) => {
    if (requestQueue.length) {
      fetchMethod(requestQueue);
    }
    fetchCallback = fetchMethod;
  };

  return {
    addRequest(request) {
      requestQueue.push(request);
      if (fetchCallback) {
        fetchCallback(requestQueue);
      }
    },
    resetRequests(requestList) {
      while (requestQueue.length) {
        requestQueue.pop();
      }
      if (requestList) {
        // Rebuild request list
        requestList.forEach((req) => {
          requestQueue.push(req);
        });
        // Also trigger a request
        if (fetchCallback) {
          fetchCallback(requestQueue);
        }
      }
    },
  };
}

// ----------------------------------------------------------------------------
// Dynamic array handler
//   - add${xxx}(item)
//   - remove${xxx}(item)
//   - get${xxx}() => [items...]
//   - removeAll${xxx}()
// ----------------------------------------------------------------------------

function dynamicArray(publicAPI, model, name) {
  if (!model[name]) {
    model[name] = [];
  }

  publicAPI[`set${capitalize(name)}`] = (items) => {
    model[name] = [].concat(items);
  };

  publicAPI[`add${capitalize(name)}`] = (item) => {
    model[name].push(item);
  };

  publicAPI[`remove${capitalize(name)}`] = (item) => {
    const index = model[name].indexOf(item);
    model[name].splice(index, 1);
  };

  publicAPI[`get${capitalize(name)}`] = () => model[name];

  publicAPI[`removeAll${capitalize(name)}`] = () => (model[name] = []);
}

// ----------------------------------------------------------------------------
// Chain function calls
// ----------------------------------------------------------------------------

function chain(...fn) {
  return (...args) => fn.filter(i => !!i).forEach(i => i(...args));
}

// ----------------------------------------------------------------------------
// Data Subscription
//   => dataHandler = {
//         // Set of default values you would expect in your metadata
//         defaultMetadata: {
//            numberOfBins: 32,
//         },
//
//         // Method used internally to store the data
//         set(model, data) { return !!sameAsBefore; }, // Return true if nothing has changed
//
//         // Method used internally to extract the data from the cache based on a given subscription
//         // This should return null/undefined if the data is not available (yet).
//         get(model, request, dataChanged) {},
//      }
// ----------------------------------------------------------------------------
// Methods generated with dataName = 'mutualInformation'
// => publicAPI
//     - onMutualInformationSubscriptionChange(callback) => subscription[unsubscribe() + update(variables = [], metadata = {})]
//     - fireMutualInformationSubscriptionChange(request)
//     - subscribeToMutualInformation(onDataReady, variables = [], metadata = {})
//     - setMutualInformation(data)
//     - destroy()
// ----------------------------------------------------------------------------

function dataSubscriber(publicAPI, model, dataName, dataHandler) {
  // Private members
  const dataSubscriptions = [];
  const eventName = `${dataName}SubscriptionChange`;
  const fireMethodName = `fire${capitalize(eventName)}`;
  const dataContainerName = `${dataName}_storage`;

  // Add data container to model if not exist
  if (!model[dataContainerName]) {
    model[dataContainerName] = {};
  }

  // Add event handling methods
  event(publicAPI, model, eventName);

  function off() {
    let count = dataSubscriptions.length;
    while (count) {
      count -= 1;
      dataSubscriptions[count] = null;
    }
  }

  // Internal function that will notify any subscriber with its data in a synchronous manner
  function flushDataToListener(dataListener, dataChanged) {
    try {
      if (dataListener) {
        const dataToForward = dataHandler.get(model[dataContainerName], dataListener.request, dataChanged);
        if (dataToForward && JSON.stringify(dataToForward) !== dataListener.request.lastPush) {
          dataListener.request.lastPush = JSON.stringify(dataToForward);
          dataListener.onDataReady(dataToForward);
        }
      }
    } catch (err) {
      console.log(`flush ${dataName} error caught:`, err);
    }
  }

  // onDataReady function will be called each time the setXXX method will be called and
  // when the actual subscription correspond to the data that has been set.
  // This is performed synchronously.
  publicAPI[`subscribeTo${capitalize(dataName)}`] = (onDataReady, variables = [], metadata = {}) => {
    const id = dataSubscriptions.length;
    const request = {
      id,
      variables,
      metadata: Object.assign({}, dataHandler.defaultMetadata, metadata),
    };
    const dataListener = { onDataReady, request };
    dataSubscriptions.push(dataListener);
    publicAPI[fireMethodName](request);
    flushDataToListener(dataListener, null);
    return {
      unsubscribe() {
        request.action = 'unsubscribe';
        publicAPI[fireMethodName](request);
        dataSubscriptions[id] = null;
      },
      update(vars, meta) {
        request.variables = [].concat(vars);
        request.metadata = Object.assign({}, request.metadata, meta);
        publicAPI[fireMethodName](request);
        flushDataToListener(dataListener, null);
      },
    };
  };

  // Method use to store data
  publicAPI[`set${capitalize(dataName)}`] = (data) => {
    // Process all subscription to see if we can trigger a notification
    if (!dataHandler.set(model[dataContainerName], data)) {
      dataSubscriptions.forEach(dataListener => flushDataToListener(dataListener, data));
    }
  };

  publicAPI.destroy = chain(off, publicAPI.destroy);
}

// ----------------------------------------------------------------------------
// newInstance
// ----------------------------------------------------------------------------

function newInstance(extend) {
  return (initialValues = {}) => {
    const model = {};
    const publicAPI = {};
    extend(publicAPI, model, initialValues);
    return Object.freeze(publicAPI);
  };
}

export default {
  chain,
  dataSubscriber,
  destroy,
  dynamicArray,
  event,
  fetch,
  get,
  isA,
  newInstance,
  set,
};
