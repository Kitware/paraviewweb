/* eslint-disable no-underscore-dangle */
export default function ({
  client,
  filterQuery,
  mustContain,
  busy,
  encodeQueryAsString,
}) {
  return {
    listAssetStores(query = {}) {
      const expected = ['limit', 'offset', 'sort', 'sortdir'];
      const params = filterQuery(query, ...expected);

      return client._.get('/assetstore', {
        params,
      });
    },

    createAssetStore(assetstore) {
      const required = ['name', 'type'];
      const possible = [
        'root',
        'db',
        'bucket',
        'prefix',
        'accessKeyId',
        'secretKey',
        'service',
      ];
      const params = filterQuery(assetstore, ...[].concat(required, possible));
      const { missingKeys, promise } = mustContain(assetstore, ...required);

      return missingKeys
        ? promise
        : busy(client._.post(`/assetstore${encodeQueryAsString(params)}`));
    },

    updateAssetStore(assetstore) {
      const expected = ['name', 'root', 'db', 'current', '_id'];
      const params = filterQuery(
        assetstore,
        expected.slice(0, expected.length - 1)
      ); // Remove 'id'

      return client._.put(`/assetstore/${assetstore._id}`, {
        params,
      });
    },

    deleteAssetStore(id) {
      return client._.delete(`/assetstore/${id}`);
    },
  };
}
