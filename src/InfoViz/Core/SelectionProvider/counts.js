// ----------------------------------------------------------------------------
// count
// ----------------------------------------------------------------------------
//
// ===> SET
//
//  const payload = {
//    type: 'count',
//    data: {
//
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

export function set(model, payload) {
  model.count = payload;
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
