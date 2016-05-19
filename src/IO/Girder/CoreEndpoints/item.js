/* eslint-disable no-underscore-dangle */
function jsonToString(data) {
  return JSON.stringify(data);
}

export default function ({ client, filterQuery, mustContain, busy, encodeQueryAsString }) {
  return {
    downloadItem(id, offset, endByte, contentDisposition) {
      const params = { offset, endByte, contentDisposition };
      Object.keys(params).forEach((key) => {
        if (params[key] === null) {
          delete params[key];
        }
      });
      return busy(client._.get(`/item/${id}/download${encodeQueryAsString(params)}`));
    },

    updateItemMetadata(id, metadata = {}) {
      return busy(client._.put(`/item/${id}/metadata`, metadata, {
        transformRequest: jsonToString,
      }));
    },

    // query = { folderId, text, limit, offset, sort, sortdir }
    listItems(query = {}) {
      const allowed = ['folderId', 'text', 'limit', 'offset', 'sort', 'sortdir'],
        params = filterQuery(query, ...allowed);

      return busy(client._.get(`/item${encodeQueryAsString(params)}`));
    },

    createItem(folderId, name, description = '') {
      const params = {
        folderId, name, description,
      };
      return busy(client._.post(`/item${encodeQueryAsString(params)}`));
    },

    // query = { limit, offset, sort }
    listFiles(id, query) {
      const allowed = ['limit', 'offset', 'sort'],
        params = filterQuery(query, ...allowed);

      if (!id) {
        return new Promise((resolve, reject) => reject('No argument id provided'));
      }

      return busy(client._.get(`/item/${id}/files${encodeQueryAsString(params)}`));
    },

    getItemRootPath(id) {
      return busy(client._.get(`/item/${id}/rootpath`));
    },

    getItem(id) {
      return busy(client._.get(`/item/${id}`));
    },

    deleteItem(id) {
      return busy(client._.delete(`/item/${id}`));
    },

    // item = { id, folderId, name, description }
    editItem(item) {
      const expected = ['folderId', 'name', 'description'],
        params = filterQuery(item, ...expected),
        {
          missingKeys, promise,
        } = mustContain(params, '_id');

      return missingKeys ? promise : busy(client._.put(`/item/${item._id}${encodeQueryAsString(params)}`));
    },

    // destinationItem = { folderId, name, description }
    copyItem(id, destinationItem) {
      const expected = ['folderId', 'name', 'description'],
        params = filterQuery(destinationItem, ...expected),
        {
          missingKeys, promise,
        } = mustContain(params, 'folderId');

      return missingKeys ? promise : busy(client._.post(`/item/${id}/copy${encodeQueryAsString(params)}`));
    },
  };
}
