export default function ({ client, filterQuery, mustContain, busy, encodeQueryAsString }) {
  return {
    downloadResources(resourceList, withMetadata = false) {
      const params = {
        resourceList: JSON.toString(resourceList),
        withMetadata,
      };

      return busy(client._.get('/resource/download', {
        params,
      }));
    },

    searchResources(query, types) {
      const params = {
        q: JSON.toString(query),
        types: JSON.toString(types),
      };
      return busy(client._.get('/resource/search', {
        params,
      }));
    },

    deleteResources(resourceList) {
      const params = {
        resources: JSON.toString(resourceList),
      };
      return busy(client._.delete('/resource', {
        params,
      }));
    },
  };
}
