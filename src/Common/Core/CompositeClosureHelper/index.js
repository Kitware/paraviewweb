// ----------------------------------------------------------------------------
// capitilze provided string
// ----------------------------------------------------------------------------

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ----------------------------------------------------------------------------
// Add isA function and register your class name
// ----------------------------------------------------------------------------

export function isA(publicAPI, model = {}, name = null) {
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

export function set(publicAPI, model = {}, names = []) {
  names.forEach(name => {
    publicAPI[`set${capitalize(name)}`] = value => {
      model[name] = value;
    };
  });
}

// ----------------------------------------------------------------------------
// Basic getter
// ----------------------------------------------------------------------------

export function get(publicAPI, model = {}, names = []) {
  names.forEach(name => {
    publicAPI[`get${capitalize(name)}`] = () => model[name];
  });
}

// ----------------------------------------------------------------------------
// Add destroy function
// ----------------------------------------------------------------------------

export function destroy(publicAPI, model = {}) {
  const previousDestroy = publicAPI.destroy;

  if (!model.subscriptions) {
    model.subscriptions = [];
  }

  publicAPI.destroy = () => {
    if (previousDestroy) {
      previousDestroy();
    }
    Object.keys(model).forEach(field => {
      if (field === 'subscriptions') {
        model[field].forEach(subscription => subscription.unsubscribe());
      }
      delete model[field];
    });

    // Flag the instance beeing deleted
    model.deleted = true;
  };
}

// ----------------------------------------------------------------------------
// Event handling: onXXX(callback), fireXXX(args...)
// ----------------------------------------------------------------------------

export function event(publicAPI, model, eventName, asynchrounous = true) {
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
      callbacks.forEach(callback => {
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

  publicAPI[`on${capitalize(eventName)}`] = callback => {
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
export function fetch(publicAPI, model, name) {
  let fetchCallback = null;
  const requestQueue = [];

  publicAPI[`set${capitalize(name)}FetchCallback`] = fetchMethod => {
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
        requestList.forEach(req => {
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
// newInstance
// ----------------------------------------------------------------------------

export function newInstance(extend) {
  return (initialValues = {}) => {
    const model = {};
    const publicAPI = {};
    extend(publicAPI, model, initialValues);
    return Object.freeze(publicAPI);
  };
}

export default {
  newInstance,
  destroy,
  fetch,
  isA,
  event,
  set,
  get,
};
