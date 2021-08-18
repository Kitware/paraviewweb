/* eslint-disable no-underscore-dangle */
function jsonToString(data) {
  return JSON.stringify(data);
}

export default function ({
  client,
  filterQuery,
  mustContain,
  busy,
  encodeQueryAsString,
}) {
  return {
    listFolders(query = {}) {
      const allowed = [
        'parentType',
        'parentId',
        'text',
        'limit',
        'offset',
        'sort',
        'sortdir',
      ];
      const params = filterQuery(query, ...allowed);

      return busy(client._.get('/folder', { params }));
    },

    createFolder(folder) {
      const allowed = [
        'parentType',
        'parentId',
        'name',
        'description',
        'public',
      ];
      const params = filterQuery(folder, ...allowed);
      const { missingKeys, promise } = mustContain(
        folder,
        'parentType',
        'parentId',
        'name'
      );

      return missingKeys
        ? promise
        : busy(client._.post(`/folder${encodeQueryAsString(params)}`));
    },

    editFolderMetaData(id, metadata) {
      return busy(
        client._.put(`/folder/${id}`, metadata, {
          transformRequest: jsonToString,
        })
      );
    },

    deleteFolder(id) {
      return busy(client._.delete(`/folder/${id}`));
    },

    getFolder(id) {
      return busy(client._.get(`/folder/${id}`));
    },

    editFolder(folder) {
      const allowed = ['parentType', 'parentId', 'name', 'description'];
      const params = filterQuery(folder, ...allowed);
      const { missingKeys, promise } = mustContain(folder, '_id');

      return missingKeys
        ? promise
        : busy(
            client._.put(`/folder/${folder._id}${encodeQueryAsString(params)}`)
          );
    },

    downloadFolder(id) {
      return busy(client._.get(`/folder/${id}/download`));
    },

    getFolderAccess(id) {
      return busy(client._.get(`/folder/${id}/access`));
    },

    editFolderAccess(folder) {
      const allowed = ['access', 'public'];
      const params = filterQuery(folder, ...allowed);
      const { missingKeys, promise } = mustContain(folder, '_id');

      return missingKeys
        ? promise
        : busy(
            client._.put(
              `/folder/${folder._id}/access${encodeQueryAsString(params)}`
            )
          );
    },
  };
}
