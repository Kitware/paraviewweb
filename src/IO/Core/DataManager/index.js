/* global window */

import Monologue from 'monologue.js';

// Module dependencies and constants
import request from './request';
import PatternMap from './pattern';

const
  typeFnMap = {
    json: request.fetchJSON,
    text: request.fetchTxt,
    blob: request.fetchBlob,
    arraybuffer: request.fetchArray,
    array: request.fetchArray,
  };

// Internal helper that return the current time
function ts() {
  return new Date().getTime();
}

function updateDataSize(data) {
  if (data.type === 'json') {
    data.size = JSON.stringify(data.data).length;
  } else if (data.type === 'blob') {
    data.size = data.data.size;
  } else {
    data.size = data.data.length;
  }
  return data.size;
}

// Should use converter
// flipArrayEndianness = function(array) {
//   var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
//   for (var i=0; i<array.byteLength; i+=array.BYTES_PER_ELEMENT) {
//     for (var j=i+array.BYTES_PER_ELEMENT-1, k=i; j>k; j--, k++) {
//       var tmp = u8[k];
//       u8[k] = u8[j];
//       u8[j] = tmp;
//     }
//   }
//   return array;
// }

export default class DataManager {

  constructor(cacheSize = 1000000000) {
    this.pattern = new PatternMap();
    this.keyToTypeMap = {};
    this.cacheSize = cacheSize;
    this.cacheData = {
      cache: {},
      modified: 0,
      ts: 0,
      size: 0,
    };
  }

  destroy() {
    this.off();
    this.clear();
  }

  // Fetch data in an asynchronous manner
  // This will trigger an event using the key as the type
  fetch(key, options, notificationTopic = null) {
    var url = options ? this.pattern.getValue(key, options) : key,
      dataCached = this.cacheData.cache[url];

    if (dataCached) {
      if (!dataCached.pending) {
        this.cacheData.ts = dataCached.ts = ts();

        // Trigger the event after the return
        setTimeout(() => {
          var array = dataCached.keysToNotify || [key],
            count = array.length;

          delete dataCached.keysToNotify;

          while (count) {
            count -= 1;
            this.emit(array[count], dataCached);
          }

          if (notificationTopic) {
            this.emit(notificationTopic, dataCached);
          }
        }, 0);
      } else {
        dataCached.keysToNotify.push(key);
        if (notificationTopic) {
          dataCached.keysToNotify.push(notificationTopic);
        }
      }
    } else {
      // Run Garbage collector to free memory if need be
      this.gc();

      // Prevent double fetch
      this.cacheData.cache[url] = {
        pending: true,
        keysToNotify: [key],
      };

      if (notificationTopic) {
        this.cacheData.cache[url].keysToNotify.push(notificationTopic);
      }

      // Need to fetch the data on the web
      const self = this,
        typeFnMime = this.keyToTypeMap[key],
        type = typeFnMime[0],
        fn = typeFnMime[1],
        mimeType = typeFnMime[2],
        callback = (error, data) => {
          if (error) {
            delete self.cacheData.cache[url];
            self.emit(key, {
              error,
              data: {
                key, options, url, typeFnMime,
              },
            });
            return;
          }

          dataCached = {
            data,
            type,
            requestedURL: url,
            pending: false,
          };

          // Handle internal url for image blob
          if (mimeType && mimeType.indexOf('image') !== -1) {
            dataCached.url = window.URL.createObjectURL(data);
          }

          // Update memory usage
          self.cacheData.size += updateDataSize(dataCached);

          // Update ts
          self.cacheData.modified = self.cacheData.ts = dataCached.ts = ts();

          // Trigger the event
          const array = self.cacheData.cache[url].keysToNotify;
          let count = array.length;

          // Store it in the cache
          self.cacheData.cache[url] = dataCached;

          while (count) {
            count -= 1;
            self.emit(array[count], dataCached);
          }
        };

      if (mimeType) {
        fn(url, mimeType, callback);
      } else {
        fn(url, callback);
      }
    }

    return url;
  }

  // Fetch data from URL
  fetchURL(url, type, mimeType, notificationTopic = null) {
    this.keyToTypeMap[url] = [type, typeFnMap[type], mimeType];
    return this.fetch(url, null, notificationTopic);
  }

  // Get data in cache
  get(url, freeCache) {
    var dataObj = this.cacheData.cache[url];
    if (freeCache) {
      this.free(url);
    }
    return dataObj;
  }

  // Free a fetched data
  free(url) {
    var dataCached = this.cacheData.cache[url];
    if (dataCached && dataCached.url) {
      window.URL.revokeObjectURL(dataCached.url);
      delete dataCached.url;
    }

    delete this.cacheData.cache[url];
    this.off(url);
  }

  // Register a key/pattern for future use
  // Type can only be ['json', 'text', 'blob', 'array']
  // mimeType is only required for blob
  registerURL(key, filePattern, type, mimeType) {
    this.pattern.registerPattern(key, filePattern);
    this.keyToTypeMap[key] = [type, typeFnMap[type], mimeType];
  }

  // Free previously registered URL
  unregisterURL(key) {
    this.pattern.unregisterPattern(key);
    delete this.keyToTypeMap[key];
    this.off(key);
  }

  // Empty cache
  clear() {
    var urlToDelete = [];
    Object.keys(this.cacheData.cache).forEach((url) => {
      urlToDelete.push(url);
    });

    let count = urlToDelete.length;
    while (count) {
      count -= 1;
      this.free(urlToDelete[count]);
    }
    this.cacheData.size = 0;
  }

  gc() {
    if (this.cacheData.size > this.cacheSize) {
      console.log('Free cache memory', this.cacheData.size);
      this.clear();
    }
  }

  setCacheSize(sizeBeforeGC) {
    this.cacheSize = sizeBeforeGC;
  }

  getCacheSize() {
    return this.cacheSize;
  }

  getMemoryUsage() {
    return this.cacheData.size;
  }
}

Monologue.mixInto(DataManager);
