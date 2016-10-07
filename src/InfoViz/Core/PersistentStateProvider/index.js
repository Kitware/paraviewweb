import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

/* global window */

export function localStorageAvailable() {
  try {
    if (!window.localStorage) {
      return false;
    }
    const storage = window.localStorage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    const storedX = storage.getItem(x);
    if (x !== storedX) {
      return false;
    }
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Persistence Provider
// ----------------------------------------------------------------------------

function persistentStateProvider(publicAPI, model) {
  if (!model.persistentStateImpl) {
    if (localStorageAvailable()) {
      model.persistentStateImpl = {
        getState: (key) => {
          const strVal = window.localStorage[key];
          if (strVal === undefined) {
            return null;
          }
          return JSON.parse(strVal);
        },
        setState: (key, value) => {
          window.localStorage.setItem(key, JSON.stringify(value));
        },
      };
    } else {
      model.persistentStateImpl = {
        state: {},
        getState: key => model.persistentStateImpl.state[key],
        setState: (key, value) => {
          model.persistentStateImpl.state[key] = value;
        },
      };
    }
  }

  // Provide this method an object that implements getState(key) and setState(key, value)
  publicAPI.setImplementation = (impl) => {
    model.persistentStateImpl = impl;
  };

  publicAPI.getPersistentState = key => model.persistentStateImpl.getState(key);

  publicAPI.setPersistentState = (key, value) => {
    model.persistentStateImpl.setState(key, value);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'PersistentStateProvider');

  persistentStateProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, localStorageAvailable };
