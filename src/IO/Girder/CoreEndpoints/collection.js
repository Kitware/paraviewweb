export default function ({ client, filterQuery, mustContain, busy, encodeQueryAsString }) {
  return {
    listCollections(query = {}) {
      const expected = ['text', 'limit', 'offset', 'sort', 'sortdir'],
        params = filterQuery(query, ...expected);

      return client._.get('/collection', { params });
    },

    createCollection(collection) {
      const expected = ['name', 'description', 'public'],
        params = filterQuery(collection, ...expected),
        { missingKeys, promise } = mustContain(params, ...expected);

      return missingKeys ? promise : busy(client._.post(`/collection${encodeQueryAsString(params)}`));
    },

    deleteCollection(id) {
      return busy(client._.delete(`/collection/${id}`));
    },

    getCollection(id) {
      return busy(client._.get(`/collection/${id}`));
    },

    editCollection(collection = {}) {
      const expected = ['name', 'description'],
        params = filterQuery(collection, ...expected),
        { missingKeys, promise } = mustContain(collection, '_id');

      return missingKeys ? promise : busy(client._.put(`/collection/${collection._id}${encodeQueryAsString(params)}`));
    },

    getCollectionAccess(id) {
      return busy(client._.get(`/collection/${id}/access`));
    },

    editCollectionAccess(collection) {
      const expected = ['access', 'public'],
        params = filterQuery(collection, ...expected),
        { missingKeys, promise } = mustContain(collection, '_id');

      return missingKeys ? promise : busy(client._.put(`/collection/${collection._id}/access${encodeQueryAsString(params)}`));
    },
  };
}
