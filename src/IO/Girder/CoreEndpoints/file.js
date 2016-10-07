/* global FormData XMLHttpRequest */

/* eslint-disable no-underscore-dangle */
export default function ({ client, filterQuery, mustContain, busy, encodeQueryAsString, progress }) {
  function uploadChunk(uploadId, offset, chunk) {
    return new Promise((resolve, reject) => {
      const data = new FormData();
      data.append('uploadId', uploadId);
      data.append('offset', offset);
      data.append('chunk', chunk);

      const xhr = new XMLHttpRequest();

      function extractResponse(ctx) {
        return {
          ctx,
          data: JSON.parse(xhr.responseText),
          status: xhr.status,
          statusText: xhr.statusText,
          headers: {},
          config: {},
        };
      }

      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const complete = event.loaded / event.total;
          console.log('chunk progress', complete);
        }
      });
      xhr.addEventListener('load', (event) => {
        resolve(extractResponse('load'));
      });
      xhr.addEventListener('error', (event) => {
        console.log('Transfer as failed', event);
        reject(extractResponse('error'));
      });
      xhr.addEventListener('abort', (event) => {
        console.log('Transfer as been canceled', event);
        reject(extractResponse('abort'));
      });

      xhr.open('POST', `${client.baseURL}/file/chunk`, true);
      xhr.responseType = 'text';
      xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
      xhr.setRequestHeader('Girder-Token', client.token);
      xhr.send(data);
    });
  }

  function uploadFileToItem(params, file) {
    const fileId = `${file.name}_${file.lastModified}`;
    // upload file to item
    return new Promise((resolve, reject) => {
      busy(client._.post(`/file${encodeQueryAsString(params)}`))
        .then((upload) => {
          var chunkSize = 10 * 1024 * 1024,
            uploadNextChunk;

          uploadNextChunk = (offset) => {
            var blob;
            progress(fileId, offset, file.size);
            if (offset + chunkSize >= file.size) {
              blob = file.slice(offset);
              uploadChunk(upload.data._id, offset, blob)
                .then((uploadResp) => {
                  progress(fileId, file.size, file.size);
                  resolve(uploadResp);
                })
                .catch((error) => {
                  console.warn('could not upload final chunk');
                  console.warn(error);
                  reject(error);
                });
            } else {
              blob = file.slice(offset, offset + chunkSize);
              uploadChunk(upload.data._id, offset, blob)
                .then((uploadResp) => {
                  uploadNextChunk(offset + chunkSize);
                })
                .catch((error) => {
                  console.warn('could not upload chunk');
                  console.warn(error);
                  reject(error);
                });
            }
          };
          uploadNextChunk(0);
        })
        .catch((error) => {
          console.warn('Could not upload file');
          console.warn(error);
          reject(error);
        });
    });
  }

  return {
    uploadChunk,

    uploadFileToItem,

    getUploadOffset(id) {
      return busy(client._.get('/file/offset', { params: { uploadId: id } }));
    },

    downloadFile(id, offset, endByte, contentDisposition) {
      const params = { offset, endByte, contentDisposition };
      Object.keys(params).forEach((key) => {
        if (params[key] === null) {
          delete params[key];
        }
      });
      return busy(client._.get(`/file/${id}/download${encodeQueryAsString(params)}`));
    },

    updateFileContent(id, size) {
      return busy(client._.put(`/file/${id}/contents?size=${size}`));
    },

    deleteFile(id) {
      return busy(client._.delete(`/file/${id}`));
    },

    editFile(file) {
      const expected = ['name', 'mimeType'],
        params = filterQuery(file, ...expected),
        { missingKeys, promise } = mustContain(file, '_id');

      return missingKeys ? promise : busy(client._.put(`/file/${file._id}${encodeQueryAsString(params)}`));
    },

    newFile(file) {
      const expected = ['parentType', 'parentId', 'name', 'size', 'mimeType', 'linkUrl'],
        params = filterQuery(file, ...expected),
        { missingKeys, promise } = mustContain(file, 'parentType', 'parentId', 'name');

      return missingKeys ? promise : busy(client._.post(`/file${encodeQueryAsString(params)}`));
    },
  };
}
