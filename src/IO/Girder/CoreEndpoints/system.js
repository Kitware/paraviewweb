/* eslint-disable no-underscore-dangle */
export default function ({ client, filterQuery, mustContain, busy, encodeQueryAsString }) {
  return {
    deleteSetting(key) {
      return busy(client._.delete(`/system/setting${encodeQueryAsString({ key })}`));
    },

    getSettings(settings) {
      const expected = ['key', 'list', 'default'],
        params = filterQuery(settings, ...expected);

      return busy(client._.get('/system/setting', {
        params,
      }));
    },

    setSettings(keyValueMap) {
      const list = Object.keys(keyValueMap).map((key) => {
        const value = keyValueMap[key];
        return {
          key, value,
        };
      });

      return busy(client._.put(`/system/setting${encodeQueryAsString({ list })}`));
    },

    getServerVersion() {
      return busy(client._.get('/system/version'));
    },

    listUnfinishedUpload(query = {}) {
      const allowed = ['uploadId', 'userId', 'parentId', 'assetstoreId', 'minimumAge', 'includeUntracked', 'limit', 'offset', 'sort', 'sortdir'],
        params = filterQuery(query, ...allowed);

      return busy(client._.get('/system/uploads', {
        params,
      }));
    },

    removeUnfinishedUpload(query = {}) {
      const allowed = ['uploadId', 'userId', 'parentId', 'assetstoreId', 'minimumAge', 'includeUntracked'],
        params = filterQuery(query, ...allowed);

      return busy(client._.delete(`/system/uploads${encodeQueryAsString(params)}`));
    },

    listPlugins() {
      return busy(client._.get('/system/plugins'));
    },

    setActivePlugins(plugins) {
      return busy(client._.put(`/system/plugins${encodeQueryAsString({ plugins })}`));
    },
  };
}
