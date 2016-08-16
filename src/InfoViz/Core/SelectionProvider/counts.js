// ----------------------------------------------------------------------------
// count
// ----------------------------------------------------------------------------
//
// ===> SET
//
//  const payload = {
//    type: 'count',
//    data: {
//       annotationInfo: {
//         annotationGeneration: 1,
//         selectionGeneration: 1,
//       },
//       count: 20,
//       role: {
//         selected: true,
//         score: 0,
//       },
//    },
//  }
//
// ===> GET
//
//  const query = {
//    type: 'count',
//  }
//
// const response = [
//   {
//   },
// ];
//
// ===> NOTIFICATION
//
// request = {
//   type: 'count',
//   variables: [],
//   metadata: {},
// }
//
// const notification = {
// };
//
// ----------------------------------------------------------------------------

function keep(id) {
  return item => (item.annotationInfo.annotationGeneration === id);
}

function sortByScore(a, b) {
  return a.role.score - b.role.score;
}

export function set(model, payload) {
  const { annotationGeneration } = payload.data.annotationInfo;
  model.count = (model.count || []).filter(keep(annotationGeneration)).concat(payload.data);
  model.count.sort(sortByScore);
  model.count = model.count.filter((item, idx, array) => !idx || array[idx - 1].role.score !== item.role.score);
}

// ----------------------------------------------------------------------------

function get(model, query) {
  return model.count;
}

// ----------------------------------------------------------------------------

function getNotificationData(model, request) {
  return get(model);
}

// ----------------------------------------------------------------------------

export default {
  set,
  get,
  getNotificationData,
};
