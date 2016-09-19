// ----------------------------------------------------------------------------
// Histogram1d
// ----------------------------------------------------------------------------

export function set(model, payload) {
  if (!model.histogram1d) {
    model.histogram1d = {};
  }
  // const { x, annotationInfo } = payload.data;
  const { x } = payload.data;
  if (!model.histogram1d[x.name]) {
    model.histogram1d[x.name] = {};
  }

  model.histogram1d[x.name] = [payload.data];

  // Attach max count
  // let count = 0;
  // payload.data.bins.forEach(item => {
  //   count = count < item.count ? item.count : count;
  // });
  // payload.data.maxCount = count;
}

// ----------------------------------------------------------------------------

function get(model, query) {
  if (model.histogram1d && model.histogram1d[query.paramName]) {
    return model.histogram1d[query.paramName];
  }
  return null;
}

// ----------------------------------------------------------------------------

function getNotificationData(model, request) {
  const result = {};
  let missingData = false;

  request.variables.forEach(paramName => {
    const histogram = get(model, { paramName });
    if (histogram) {
      result[paramName] = histogram;
    } else {
      missingData = true;
    }
  });

  return missingData ? null : result;
}

// ----------------------------------------------------------------------------

export default {
  set,
  get,
  getNotificationData,
};
