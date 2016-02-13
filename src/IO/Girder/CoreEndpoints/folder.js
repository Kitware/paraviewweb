function jsonToString(data) {
    return JSON.stringify(data);
}

export default function({client, filterQuery, mustContain, busy, encodeQueryAsString}) {
    return {

        listFolders(query={}) {
            const allowed = ['parentType', 'parentId', 'text', 'limit', 'offset', 'sort', 'sortdir'],
                params = filterQuery(query, ...allowed);

            return busy(client._.get('/folder', { params }));
        },

        createFolder(folder) {
            const allowed = ['parentType', 'parentId', 'name', 'description', 'public'],
                params = filterQuery(folder, ...allowed),
                { missingKeys, promise } = mustContain(folder, 'parentType', 'parentId', 'name');

            return missingKeys ? busy(client._.post(`/folder${encodeQueryAsString(params)}`)) : promise;
        },

        editFolderMetaData(id, metadata) {
            return busy(client._.put(`/folder/${id}`, metadata, { transformRequest: jsonToString }));
        },

        deleteFolder(id) {
            return busy(client._.delete(`/folder/${id}`))
        },

        getFolder(id) {
            return busy(client._.get(`/folder/${id}`))
        },

        editFolder(folder) {
            const allowed = ['parentType', 'parentId', 'name', 'description'],
                params = filterQuery(folder, ...allowed),
                { missingKeys, promise } = mustContain(folder, '_id');

            return missingKeys ? busy(client._.put(`/folder/${folder._id}${encodeQueryAsString(params)}`)) : promise;
        },

        downloadFolder(id) {
            return busy(client._.get(`/folder/${id}/download`));
        },

        getFolderAccess(id) {
            return busy(client._.get(`/folder/${id}/access`));
        },

        editFolderAccess(folder) {
            const allowed = ['access', 'public'],
                params = filterQuery(folder, ...allowed),
                { missingKeys, promise } = mustContain(folder, '_id');

            return missingKeys ? busy(client._.put(`/folder/${folder._id}/access${encodeQueryAsString(params)}`)) : promise;
        },
    };
}
