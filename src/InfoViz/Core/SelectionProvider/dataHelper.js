import histogram2d from './histogram2d';
import histogram1d from './histogram1d';
import counts from './counts';

const dataMapping = {
  histogram1d,
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
