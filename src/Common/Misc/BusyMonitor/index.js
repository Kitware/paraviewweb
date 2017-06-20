import CompositeClosureHelper from '../../Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Busy Monitor
// ----------------------------------------------------------------------------

function busyMonitor(publicAPI, model) {
  model.busyCounter = 0;

  const checkNotifyStatus = (delta) => {
    const lastCount = model.busyCounter;
    model.busyCounter += delta;
    if (model.busyCounter <= 0) {
      // not busy anymore
      publicAPI.fireBusyStatusChanged(false);
      model.busyCounter = 0;
    } else if (lastCount === 0 && model.busyCounter > 0) {
      // busy now, don't notify again with increased count
      publicAPI.fireBusyStatusChanged(true);
    }
  };

  const success = (...args) => {
    checkNotifyStatus(-1);
    return new Promise((ok, ko) => {
      ok(...args);
    });
  };

  const error = (...args) => {
    checkNotifyStatus(-1);
    return new Promise((ok, ko) => {
      ko(...args);
    });
  };

  publicAPI.busy = (promise) => {
    checkNotifyStatus(1);
    return promise.then(success, error);
  };

  publicAPI.busyWrapFunction = fn => (...args) => publicAPI.busy(fn(...args));

  publicAPI.isBusy = () => model.busyCounter > 0;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.event(publicAPI, model, 'busyStatusChanged');

  busyMonitor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
