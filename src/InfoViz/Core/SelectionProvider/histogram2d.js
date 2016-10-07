// ----------------------------------------------------------------------------
// Histogram2d
// ----------------------------------------------------------------------------
//
// ===> SET
//
//  const payload = {
//    type: 'histogram2d',
//    filter: '7c1ce0b1-4ecd-4415-80d3-00364c1f7f8b',
//    data: {
//      x: 'temperature',
//      y: 'pressure',
//      bins: [...],
//      annotationInfo: {
//        annotationGeneration: 2,
//        selectionGeneration: 5,
//      },
//      role: {
//        score: 0,
//        selected: true,
//      },
//    },
//  }
//
// ===> GET
//
//  const query = {
//    type: 'histogram2d',
//    axes: ['temperature', 'pressure'],
//    score: [0, 2],
//  }
//
// const response = [
//   {
//     x: 'temperature',
//     y: 'pressure',
//     bins: [],
//     annotationInfo: {
//       annotationGeneration: 2,
//       selectionGeneration: 5,
//     },
//     role: {
//       score: 0,
//       selected: true,
//     },
//     maxCount: 3534,
//   }, {
//     x: 'temperature',
//     y: 'pressure',
//     bins: [],
//     annotationInfo: {
//       annotationGeneration: 2,
//       selectionGeneration: 5,
//     },
//     role: {
//       score: 0,
//       selected: true,
//     },
//     maxCount: 3534,
//   },
// ];
//
// ===> NOTIFICATION
//
// request = {
//   type: 'histogram2d',
//   variables: [
//     ['temperature', 'pressure'],
//     ['pressure', 'velocity'],
//     ['velocity', 'abcd'],
//   ],
//   metadata: {
//     partitionScore: [0, 2],
//   },
// }
//
// const notification = {
//   temperature: {
//     pressure: [
//       {
//         x: 'temperature',
//         y: 'pressure',
//         bins: [],
//         annotationInfo: {
//           annotationGeneration: 2,
//           selectionGeneration: 5,
//         },
//         role: {
//           score: 0,
//           selected: true,
//         },
//         maxCount: 3534,
//       }, {
//         x: 'temperature',
//         y: 'pressure',
//         bins: [],
//         annotationInfo: {
//           annotationGeneration: 2,
//           selectionGeneration: 5,
//         },
//         role: {
//           score: 2,
//           selected: true,
//         },
//         maxCount: 3534,
//       },
//     ],
//   },
//   pressure: {
//     velocity: [
//       {
//         x: 'pressure',
//         y: 'velocity',
//         bins: [],
//         annotationInfo: {
//           annotationGeneration: 2,
//           selectionGeneration: 5,
//         },
//         role: {
//           score: 0,
//           selected: true,
//         },
//         maxCount: 3534,
//       }, {
//         x: 'pressure',
//         y: 'velocity',
//         bins: [],
//         annotationInfo: {
//           annotationGeneration: 2,
//           selectionGeneration: 5,
//         },
//         role: {
//           score: 2,
//           selected: true,
//         },
//         maxCount: 3534,
//       },
//     ],
//   },
//   velocity: {
//     abcd: [
//       {
//         x: 'velocity',
//         y: 'abcd',
//         bins: [],
//         annotationInfo: {
//           annotationGeneration: 2,
//           selectionGeneration: 5,
//         },
//         role: {
//           score: 0,
//           selected: true,
//         },
//         maxCount: 3534,
//       }, {
//         x: 'velocity',
//         y: 'abcd',
//         bins: [],
//         annotationInfo: {
//           annotationGeneration: 2,
//           selectionGeneration: 5,
//         },
//         role: {
//           score: 2,
//           selected: true,
//         },
//         maxCount: 3534,
//       },
//     ],
//   },
// };
//
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
  const { x, y, annotationInfo, role } = payload.data;
  if (!model.histogram2d[x.name]) {
    model.histogram2d[x.name] = {};
  }
  if (!model.histogram2d[x.name][y.name]) {
    model.histogram2d[x.name][y.name] = [];
  }

  model.histogram2d[x.name][y.name] = [].concat(
    payload.data,
    model.histogram2d[x.name][y.name]
      .filter(hist => hist.annotationInfo.annotationGeneration === annotationInfo.annotationGeneration && hist.role.score !== role.score));

  // Attach max count
  let count = 0;
  payload.data.bins.forEach((item) => {
    count = count < item.count ? item.count : count;
  });
  payload.data.maxCount = count;

  // Create flipped histogram?
  // FIXME
}

// ----------------------------------------------------------------------------

function get(model, query) {
  if (model.histogram2d && model.histogram2d[query.axes[0]] && model.histogram2d[query.axes[0]][query.axes[1]]) {
    if (query.score) {
      return model.histogram2d[query.axes[0]][query.axes[1]].filter(hist => query.score.indexOf(hist.role.score) !== -1);
    }
    return model.histogram2d[query.axes[0]][query.axes[1]];
  }
  return null;
}

// ----------------------------------------------------------------------------

function getNotificationData(model, request) {
  const result = {};
  let missingData = false;
  const generationNumbers = [];

  request.variables.forEach((axes) => {
    const histograms = get(model, { axes });
    if (histograms && histograms.length) {
      if (!result[axes[0]]) {
        result[axes[0]] = {};
      }
      result[axes[0]][axes[1]] = histograms;
      histograms.forEach(hist => generationNumbers.push(hist.annotationInfo.annotationGeneration));
    } else {
      missingData = true;
    }
  });

  // Prevent generation mix in result
  generationNumbers.sort();
  const generation = generationNumbers.shift();
  if (generationNumbers.length && generation !== generationNumbers.pop()) {
    return null;
  }

  result['##annotationGeneration##'] = generation;

  return missingData ? null : result;
}

// ----------------------------------------------------------------------------

export default {
  set,
  get,
  getNotificationData,
};
