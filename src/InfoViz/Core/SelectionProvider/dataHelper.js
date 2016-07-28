import histogram2d from './histogram2d';

const dataMapping = {
  histogram2d,
};

// ----------------------------------------------------------------------------

export function getHandler(data) {
  const handler = dataMapping[data.type];
  if (handler) {
    return handler;
  }

  throw new Error(`No set handler for ${data.type}`);
}

export function set(model, data) {
  return getHandler(data).set(model, data);
}

export function get(model, data) {
  return getHandler(data).get(model, data);
}

export function getNotificationData(model, request) {
  return getHandler(request).getNotificationData(model, request);
}

export default {
  set,
  get,
  getNotificationData,
};
