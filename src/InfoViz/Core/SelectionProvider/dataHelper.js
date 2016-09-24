import histogram2d from './histogram2d';
import counts from './counts';

const dataMapping = {
  histogram2d,
  counts,
};

// ----------------------------------------------------------------------------

function getHandler(type) {
  const handler = dataMapping[type];
  if (handler) {
    return handler;
  }

  throw new Error(`No set handler for ${type}`);
}

function set(model, data) {
  return getHandler(data.type).set(model, data);
}

function get(model, data) {
  return getHandler(data.type).get(model, data);
}

function getNotificationData(model, request) {
  return getHandler(request.type).getNotificationData(model, request);
}

export default {
  set,
  get,
  getNotificationData,
};
