// ----------------------------------------------------------------------------
// Histogram2d
// ----------------------------------------------------------------------------
//
//  const payload = {
//    type: 'histogram2d',
//    data: {
//      x: 'temperature',
//      y: 'pressure',
//      bins: [...]
//    }
//  }
//
//  const query = {
//    type: 'histogram2d',
//    axes: ['temperature', 'pressure']
//  }
// ----------------------------------------------------------------------------

// function flipHistogram(histo2d) {
//   const newHisto2d = {
//     bins: histo2d.bins.map(bin => {
//       const { x, y, count } = bin;
//       return {
//         x: y,
//         y: x,
//         count,
//       };
//     }),
//     x: histo2d.y,
//     y: histo2d.x };

//   return newHisto2d;
// }

// ----------------------------------------------------------------------------

export function set(model, payload) {
  if (!model.histogram2d) {
    model.histogram2d = {};
  }
  const { x, y } = payload.data;
  if (!model.histogram2d[x.name]) {
    model.histogram2d[x.name] = {};
  }
  model.histogram2d[x.name][y.name] = payload.data;

  // Attach max count
  let count = 0;
  payload.data.bins.forEach(item => {
    count = count < item.count ? item.count : count;
  });
  model.histogram2d[x.name][y.name].maxCount = count;

  // Create flipped histogram?
  // FIXME
}

// ----------------------------------------------------------------------------

function get(model, query) {
  if (model.histogram2d && model.histogram2d[query.axes[0]] && model.histogram2d[query.axes[0]][query.axes[1]]) {
    return model.histogram2d[query.axes[0]][query.axes[1]];
  }
  return undefined;
}

// ----------------------------------------------------------------------------

function getNotificationData(model, request) {
  const result = {};
  let missingData = false;

  request.variables.forEach(axes => {
    const histogram = get(model, { axes });
    if (histogram) {
      if (!result[axes[0]]) {
        result[axes[0]] = {};
      }
      result[axes[0]][axes[1]] = histogram;
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
